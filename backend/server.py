from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from uuid import uuid4
from datetime import datetime, timezone
import asyncio
import json

# OpenAI (async client)
try:
    from openai import AsyncOpenAI
except Exception:  # library may not be installed yet
    AsyncOpenAI = None  # type: ignore

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app and router (all backend routes must be under /api)
app = FastAPI()
api = APIRouter(prefix="/api")

# -------------------------------------------------
# Models
# -------------------------------------------------
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float  # stored as USD internally
    image_url: str
    style_tags: List[str] = []
    occasion_tags: List[str] = []
    description: Optional[str] = None

class SurveyInput(BaseModel):
    occasion: str
    style: str
    budget: str
    vibe_preference: Optional[str] = None

class RecommendationItem(BaseModel):
    product: Product
    reason: str

class RecommendationResponse(BaseModel):
    session_id: str
    engine: str
    vibe: str
    explanation: str
    moodboard_image: str
    recommendations: List[RecommendationItem]
    created_at: str

class PassportResponse(BaseModel):
    session_id: str
    engine: str
    survey: SurveyInput
    vibe: str
    explanation: str
    recommendations: List[RecommendationItem]
    created_at: str

class ImportXlsxRequest(BaseModel):
    url: str
    replace: bool = True
    mapping: Optional[Dict[str, str]] = None  # optional column mapping
    auto_detect: bool = True

class AIRequest(BaseModel):
    occasion: str
    style: str
    budget: str
    vibe_preference: Optional[str] = None

class AIResponse(BaseModel):
    vibe: str
    explanation: str
    source: str

# -------------------------------------------------
# Helpers
# -------------------------------------------------
VIBE_IMAGES: Dict[str, str] = {
    "Hollywood Glam": "https://images.unsplash.com/photo-1616837874254-8d5aaa63e273?crop=entropy&cs=srgb&fm=jpg&q=85",
    "Editorial Chic": "https://images.unsplash.com/photo-1727784892059-c85b4d9f763c?crop=entropy&cs=srgb&fm=jpg&q=85",
    "Bridal Grace": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?crop=entropy&cs=srgb&fm=jpg&q=85",
    "Everyday Chic": "https://images.unsplash.com/photo-1611107683227-e9060eccd846?crop=entropy&cs=srgb&fm=jpg&q=85",
    "Minimal Modern": "https://images.unsplash.com/photo-1758995115682-1452a1a9e35b?crop=entropy&cs=srgb&fm=jpg&q=85",
    "Vintage Romance": "https://images.unsplash.com/photo-1758995115785-d13726ac93f0?crop=entropy&cs=srgb&fm=jpg&q=85",
    "Boho Luxe": "https://images.unsplash.com/photo-1684439673104-f5d22791c71a?crop=entropy&cs=srgb&fm=jpg&q=85",
    "Bold Statement": "https://images.unsplash.com/photo-1623321673989-830eff0fd59f?crop=entropy&cs=srgb&fm=jpg&q=85",
}

# Currency handling
USD_TO_INR: float = float(os.environ.get("USD_TO_INR", "83.0"))

BUDGET_RANGES_INR = {
    "Under ₹8,000": (0, 8000),
    "₹8,000–₹25,000": (8000, 25000),
    "₹25,000–₹65,000": (25000, 65000),
    "₹65,000–₹1,00,000": (65000, 100000),
    "₹1,00,000–₹2,00,000": (100000, 200000),
    "₹2,00,000–₹4,00,000": (200000, 400000),
    "₹4,00,000+": (400000, 10**9),
}

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# Indian numbering format (approximate: 12,34,567)
def format_inr(n: int) -> str:
    s = str(abs(n))
    if len(s) <= 3:
        out = s
    else:
        last3 = s[-3:]
        rest = s[:-3]
        parts = []
        while len(rest) > 2:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            parts.insert(0, rest)
        out = ",".join(parts + [last3])
    return f"₹{out}"

async def seed_products_if_needed():
    count = await db.products.count_documents({})
    if count > 0:
        return
    sample: List[Dict[str, Any]] = [
        {
            "id": str(uuid.uuid4()),
            "name": "Glam Diamond Studs",
            "price": 950.0,
            "image_url": VIBE_IMAGES["Hollywood Glam"],
            "style_tags": ["bold", "glam"],
            "occasion_tags": ["red carpet", "wedding"],
            "description": "Brilliant-cut diamond studs with a red carpet polish.",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Minimal Gold Bar Necklace",
            "price": 180.0,
            "image_url": VIBE_IMAGES["Minimal Modern"],
            "style_tags": ["minimal", "modern"],
            "occasion_tags": ["everyday", "office"],
            "description": "Sleek gold bar pendant for an effortless modern look.",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Pearl Bridal Choker",
            "price": 520.0,
            "image_url": VIBE_IMAGES["Bridal Grace"],
            "style_tags": ["bridal", "classic"],
            "occasion_tags": ["wedding"],
            "description": "Elegant pearl choker perfect for bridal grace.",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Everyday Gold Hoops",
            "price": 95.0,
            "image_url": VIBE_IMAGES["Everyday Chic"],
            "style_tags": ["chic", "casual"],
            "occasion_tags": ["everyday"],
            "description": "Lightweight hoops for daily wear.",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Vintage Heart Locket",
            "price": 260.0,
            "image_url": VIBE_IMAGES["Vintage Romance"],
            "style_tags": ["vintage", "romance"],
            "occasion_tags": ["date night", "anniversary"],
            "description": "Engraved locket with nostalgic charm.",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Editorial Chain Collar",
            "price": 420.0,
            "image_url": VIBE_IMAGES["Editorial Chic"],
            "style_tags": ["editorial", "bold"],
            "occasion_tags": ["event", "runway"],
            "description": "Chunky collar with magazine-worthy presence.",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Boho Coin Necklace",
            "price": 140.0,
            "image_url": VIBE_IMAGES["Boho Luxe"],
            "style_tags": ["boho", "luxe"],
            "occasion_tags": ["festival", "vacation"],
            "description": "Layered coins for relaxed luxe.",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sculptural Cuff Bracelet",
            "price": 310.0,
            "image_url": VIBE_IMAGES["Bold Statement"],
            "style_tags": ["bold", "sculptural"],
            "occasion_tags": ["event", "party"],
            "description": "Architectural cuff that turns heads.",
        },
    ]
    more = []
    for i in range(8):
        base = sample[i % len(sample)].copy()
        base["id"] = str(uuid.uuid4())
        base["price"] = round(base["price"] * (0.8 + 0.05 * i), 2)
        base["name"] = base["name"] + f" Variant {i+1}"
        more.append(base)
    await db.products.insert_many(sample + more)


def match_vibe(s: SurveyInput) -> str:
    oc = s.occasion.lower().strip()
    st = s.style.lower().strip()
    pref = (s.vibe_preference or "").lower().strip()

    if "wedding" in oc or "bridal" in st:
        return "Bridal Grace"
    if "red carpet" in oc or "glam" in st:
        return "Hollywood Glam"
    if "editorial" in st:
        return "Editorial Chic"
    if "minimal" in st or "modern" in st:
        return "Minimal Modern"
    if "vintage" in st or "romance" in st:
        return "Vintage Romance"
    if "boho" in st or "festival" in oc:
        return "Boho Luxe"
    if "bold" in st or "party" in oc:
        return "Bold Statement"
    if pref:
        for vibe in VIBE_IMAGES.keys():
            if pref in vibe.lower():
                return vibe
    return "Everyday Chic"


def vibe_explanation(vibe: str) -> str:
    explanations = {
        "Hollywood Glam": "Polished silhouettes, luminous stones, and a camera-ready finish inspired by red carpet icons.",
        "Editorial Chic": "Sculptural forms and fashion-forward proportions straight from glossy magazine spreads.",
        "Bridal Grace": "Ethereal pearls and timeless sparkle crafted for aisle-worthy elegance.",
        "Everyday Chic": "Lightweight, versatile gold essentials that elevate your daily uniform.",
        "Minimal Modern": "Clean lines and quiet luxury in refined, architectural pieces.",
        "Vintage Romance": "Nostalgic details and heirloom charm with a soft, romantic mood.",
        "Boho Luxe": "Relaxed layers, warm textures, and travel-ready shine for free spirits.",
        "Bold Statement": "Confident, eye-catching designs that transform any look in one move.",
    }
    return explanations.get(vibe, "Personalized selections tuned to your style and occasion.")

# ------------------ OpenAI integration ------------------
async def get_ai_vibe(payload: AIRequest) -> Optional[AIResponse]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or AsyncOpenAI is None:
        return None
    try:
        client = AsyncOpenAI(api_key=api_key)
        prefer = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip()
        fallbacks = [m for m in [prefer, "gpt-4o", "gpt-4.1", "gpt-4o-mini"] if m]
        system = (
            "You are a luxury jewelry stylist. Given the survey, return JSON only with keys 'vibe' and 'explanation'. "
            "Vibe must be EXACTLY one of: [Hollywood Glam, Editorial Chic, Bridal Grace, Everyday Chic, Minimal Modern, Vintage Romance, Boho Luxe, Bold Statement]."
        )
        user = (
            f"Occasion: {payload.occasion}\n"
            f"Style: {payload.style}\n"
            f"Budget: {payload.budget}\n"
            f"Preference: {payload.vibe_preference or 'None'}"
        )
        last_err = None
        for model in fallbacks:
            try:
                supports_json_mode = any(x in model for x in ["gpt-4o", "gpt-4.1", "gpt-5", "o4", "mini"])
                kwargs = dict(model=model, messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ], temperature=0.4, max_tokens=220)
                if supports_json_mode:
                    kwargs["response_format"] = {"type": "json_object"}
                resp = await asyncio.wait_for(
                    client.chat.completions.create(**kwargs),
                    timeout=22.0,
                )
                content = resp.choices[0].message.content or ""
                data = None
                try:
                    data = json.loads(content)
                except Exception:
                    import re
                    m = re.search(r"\{[\s\S]*\}", content)
                    if m:
                        try:
                            data = json.loads(m.group(0))
                        except Exception:
                            data = None
                if not isinstance(data, dict):
                    vibe_guess = match_vibe(SurveyInput(**payload.model_dump()))
                    return AIResponse(vibe=vibe_guess, explanation="Tailored to your inputs.", source="ai")
                vibe = data.get("vibe")
                explanation = data.get("explanation")
                if isinstance(vibe, str) and isinstance(explanation, str) and vibe in VIBE_IMAGES:
                    return AIResponse(vibe=vibe, explanation=explanation, source="ai")
            except Exception as ie:
                last_err = ie
                continue
        if last_err:
            raise last_err
    except Exception as e:
        logging.warning(f"OpenAI vibe failed, fallback to rules. Error: {e}")
    return None

async def recommend_products(s: SurveyInput, vibe: str) -> List[RecommendationItem]:
    # Compare budgets in INR using USD price converted
    min_inr, max_inr = BUDGET_RANGES_INR.get(s.budget, (0, 10**12))

    style_q = s.style.lower().split()
    occ_q = s.occasion.lower().split()

    cursor = db.products.find({})
    items = await cursor.to_list(1000)

    scored: List[tuple[float, Dict[str, Any]]] = []
    for it in items:
        price_usd = float(it.get("price", 0))
        price_inr = price_usd * USD_TO_INR
        if not (min_inr <= price_inr <= max_inr):
            continue
        score = 0.0
        tags = [t.lower() for t in it.get("style_tags", [])]
        occs = [t.lower() for t in it.get("occasion_tags", [])]
        score += sum(1 for t in tags for q in style_q if q in t) * 1.5
        score += sum(1 for t in occs for q in occ_q if q in t) * 1.2
        if vibe.split()[0].lower() in tags:
            score += 1.0
        # bias towards mid INR price range
        score += 0.2 if 8000 <= price_inr <= 65000 else 0
        scored.append((score, it))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [x[1] for x in scored[:4]]

    recs: List[RecommendationItem] = []
    for it in top:
        price_usd = float(it.get("price", 0))
        price_inr = int(round(price_usd * USD_TO_INR))
        reason_bits = []
        if any(k in (s.style.lower()) for k in it.get("style_tags", [])):
            reason_bits.append("matches your style preference")
        if any(k in (s.occasion.lower()) for k in it.get("occasion_tags", [])):
            reason_bits.append("perfect for your occasion")
        reason_bits.append(f"within your budget at {format_inr(price_inr)}")
        reason = ", ".join(reason_bits) if reason_bits else "tailored to your inputs"
        recs.append(RecommendationItem(product=Product(**it), reason=reason))
    if len(recs) < 3:
        for it in items:
            price_usd = float(it.get("price", 0))
            price_inr = int(round(price_usd * USD_TO_INR))
            if min_inr <= price_inr <= max_inr and all(r.product.id != it["id"] for r in recs):
                recs.append(RecommendationItem(product=Product(**it), reason=f"great fit for your budget at {format_inr(price_inr)}"))
            if len(recs) >= 4:
                break
    return recs

# -------------------------------------------------
# Routes
# -------------------------------------------------
@api.get("/health")
async def health():
    return {"ok": True, "time": now_iso()}

@api.get("/")
async def root():
    return {"message": "Evol Jewels AI Stylist API"}

@api.get("/products", response_model=List[Product])
async def list_products():
    items = await db.products.find({}).to_list(1000)
    return [Product(**it) for it in items]

@api.post("/ai/vibe", response_model=AIResponse)
async def ai_vibe(payload: AIRequest):
    ai = await get_ai_vibe(payload)
    if ai:
        return ai
    vibe = match_vibe(SurveyInput(**payload.model_dump()))
    return AIResponse(vibe=vibe, explanation=vibe_explanation(vibe), source="rules")

@api.post("/survey", response_model=RecommendationResponse)
async def submit_survey(payload: SurveyInput):
    ai = await get_ai_vibe(AIRequest(**payload.model_dump()))
    if ai:
        vibe = ai.vibe
        explanation = ai.explanation
        engine = "ai"
    else:
        vibe = match_vibe(payload)
        explanation = vibe_explanation(vibe)
        engine = "rules"
    mood_img = VIBE_IMAGES.get(vibe)
    # Get enhanced recommendations using real Evol Jewels data
    try:
        recs = await get_enhanced_recommendations(payload.model_dump())
        if not recs:
            # Fallback to existing logic
            recs = await recommend_products(payload, vibe)
    except Exception as e:
        logger.error(f"Enhanced recommendation error: {e}")
        # Fallback to existing logic
        recs = await recommend_products(payload, vibe)

    session_id = str(uuid.uuid4())
    created_at = now_iso()
    await db.sessions.insert_one({
        "id": session_id,
        "created_at": created_at,
        "survey": payload.model_dump(),
        "vibe": vibe,
        "explanation": explanation,
        "engine": engine,
        "recommendation_product_ids": [r.product.id for r in recs],
    })

    return RecommendationResponse(
        session_id=session_id,
        engine=engine,
        vibe=vibe,
        explanation=explanation,
        moodboard_image=mood_img,
        recommendations=recs,
        created_at=created_at,
    )

@api.get("/passport/{session_id}", response_model=PassportResponse)
async def get_passport(session_id: str):
    sess = await db.sessions.find_one({"id": session_id})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    prod_ids = sess.get("recommendation_product_ids", [])
    prods = await db.products.find({"id": {"$in": prod_ids}}).to_list(200)
    recs: List[RecommendationItem] = []
    for it in prods:
        price_usd = float(it.get("price", 0))
        price_inr = int(round(price_usd * USD_TO_INR))
        recs.append(RecommendationItem(product=Product(**it), reason=f"curated for your vibe at {format_inr(price_inr)}"))

    survey = SurveyInput(**sess["survey"]) if isinstance(sess.get("survey"), dict) else SurveyInput(**{})
    engine = sess.get("engine", "rules")
    return PassportResponse(
        session_id=sess["id"],
        engine=engine,
        survey=survey,
        vibe=sess.get("vibe", ""),
        explanation=sess.get("explanation", ""),
        recommendations=recs,
        created_at=sess.get("created_at", now_iso()),
    )

# Register router
app.include_router(api)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Real Evol Jewels Product Data
EVOL_PRODUCTS = [
    {
        "id": str(uuid4()),
        "name": "Talia Diamond Ring",
        "price": 14998,
        "category": "Rings",
        "metal_types": ["Rose Gold", "White Gold", "Yellow Gold"],
        "karat_options": ["14 KT", "18 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-RG-PV_3024x.jpg?v=1711002550",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-RG-T2V_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/talia-diamond-ring",
        "description": "Elegant diamond ring perfect for modern sophistication",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Classic", "Modern"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Orbis Diamond Ring", 
        "price": 15323,
        "category": "Rings",
        "metal_types": ["Rose Gold", "White Gold", "Yellow Gold"],
        "karat_options": ["14 KT", "18 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/SRNG570647__06_3024x.webp?v=1734329931",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/SRNG570647__05_3024x.webp?v=1734329931"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/orbis-diamond-ring",
        "description": "Contemporary diamond design for the modern woman",
        "occasion": ["Everyday", "Work"],
        "style": ["Modern", "Classic"],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Hold Me Closer Diamond Ring",
        "price": 21153,
        "category": "Rings", 
        "metal_types": ["Rose Gold", "White Gold", "Yellow Gold"],
        "karat_options": ["14 KT", "18 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-51407-M-20-YG-PV_3024x.png?v=1715927703",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-51407-M-20-YG-T2V_3024x.png?v=1715927703"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/hold-me-closer-diamond-ring",
        "description": "Romantic diamond ring for intimate moments",
        "occasion": ["Romantic", "Special Events"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Dazzling Dewdrop Diamond Studs",
        "price": 22319,
        "category": "Earrings",
        "metal_types": ["Rose Gold", "White Gold", "Yellow Gold"],
        "karat_options": ["14 KT", "18 KT"],
        "sizes": ["One Size"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-51821-Lot5-S17-YG-PV_3024x.png?v=1721109858",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-51821-Lot5-S17-YG-TV_3024x.png?v=1721109858"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/dazzling-dewdrop-diamond-studs",
        "description": "Brilliant diamond studs for everyday glamour",
        "occasion": ["Everyday", "Work", "Special Events"],
        "style": ["Classic", "Modern"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Wain Marquise Diamond Ring",
        "price": 22699,
        "category": "Rings",
        "metal_types": ["Rose Gold", "White Gold", "Yellow Gold"],
        "karat_options": ["14 KT", "18 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG333668-WG-PV_3024x.jpg?v=1680196025",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG333668-WG-T2V_3024x.jpg?v=1680196025"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/wain-marquise-diamond-ring",
        "description": "Sophisticated marquise diamond for the discerning woman",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "First-Crush Diamond Necklace",
        "price": 23685,
        "category": "Necklaces",
        "metal_types": ["Rose Gold", "White Gold", "Yellow Gold"],
        "karat_options": ["14 KT", "18 KT"],
        "sizes": ["16 inch", "18 inch", "20 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-OTH-R-31347-PT60314-YG-PV_3024x.jpg?v=1753343172",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-OTH-R-31347-PT60314-YG-FV_3024x.jpg?v=1753343172"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/first-crush-diamond-necklace",
        "description": "Delicate diamond necklace for romantic occasions",
        "occasion": ["Romantic", "Special Events"],
        "style": ["Vintage", "Bohemian"],
        "celebrity_vibe": "Boho Luxe"
    },
    {
        "id": str(uuid4()),
        "name": "Romance Diamond Ring",
        "price": 25463,
        "category": "Rings",
        "metal_types": ["Rose Gold", "White Gold", "Yellow Gold"],
        "karat_options": ["14 KT", "18 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-51850-CST-1914-RN-SMP-PD-3478-YG-PV_3024x.png?v=1718012376",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-51850-CST-1914-RN-SMP-PD-3478-YG-TV_3024x.png?v=1718012375"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/love-you-ring",
        "description": "Romantic diamond ring expressing eternal love",
        "occasion": ["Romantic", "Special Events"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Aurelia Diamond Necklace",
        "price": 25463,
        "category": "Necklaces",
        "metal_types": ["White Gold", "Yellow Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["16 inch", "18 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-WG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/aurelia-diamond-necklace",
        "description": "Sophisticated diamond necklace for special occasions",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Classic", "Vintage"],
        "celebrity_vibe": "Hollywood Glam"
    },
    # Additional ₹10K-₹60K Range Products
    {
        "id": str(uuid4()),
        "name": "Classic Pearl Drop Earrings",
        "price": 32000,
        "category": "Earrings",
        "metal_types": ["Yellow Gold", "White Gold"],
        "karat_options": ["14 KT", "18 KT"],
        "sizes": ["One Size"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SERG332381-YG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/classic-pearl-drop-earrings",
        "description": "Timeless pearl drop earrings for elegant occasions",
        "occasion": ["Work", "Special Events"],
        "style": ["Classic", "Vintage"],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Diamond Infinity Bracelet",
        "price": 45000,
        "category": "Bracelets",
        "metal_types": ["Rose Gold", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["Small", "Medium", "Large"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SBRC332381-RG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/diamond-infinity-bracelet",
        "description": "Elegant infinity symbol bracelet with diamonds",
        "occasion": ["Romantic", "Special Events"],
        "style": ["Modern", "Classic"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Emerald Solitaire Ring",
        "price": 55000,
        "category": "Rings",
        "metal_types": ["Yellow Gold", "Platinum"],
        "karat_options": ["18 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-YG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/emerald-solitaire-ring",
        "description": "Beautiful emerald solitaire in classic setting",
        "occasion": ["Romantic", "Special Events"],
        "style": ["Classic", "Modern"],
        "celebrity_vibe": "Hollywood Glam"
    },
    # Luxury Range Products (₹60K - ₹1L)
    {
        "id": str(uuid4()),
        "name": "Royal Emerald Collection Ring",
        "price": 75000,
        "category": "Rings",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT", "22 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-RG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/royal-emerald-ring",
        "description": "Exquisite emerald and diamond ring for luxury occasions",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Classic", "Modern"],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Premium Diamond Tennis Bracelet",
        "price": 85000,
        "category": "Bracelets",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["Small", "Medium", "Large"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-WG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/premium-tennis-bracelet",
        "description": "Classic tennis bracelet with premium diamonds",
        "occasion": ["Special Events", "Work"],
        "style": ["Classic", "Modern"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Sapphire Statement Earrings",
        "price": 95000,
        "category": "Earrings",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["One Size"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SERG332381-WG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/sapphire-statement-earrings",
        "description": "Bold sapphire and diamond statement earrings",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Modern", "Bohemian"],
        "celebrity_vibe": "Bold Statement"
    },
    {
        "id": str(uuid4()),
        "name": "Celestial Diamond Pendant Set",
        "price": 68000,
        "category": "Sets",
        "metal_types": ["White Gold", "Rose Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["16 inch", "18 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SSET332381-WG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/celestial-diamond-pendant-set",
        "description": "Elegant pendant and earring set with celestial motifs",
        "occasion": ["Special Events", "Work"],
        "style": ["Modern", "Classic"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Vintage Rose Gold Cuff",
        "price": 72000,
        "category": "Bracelets",
        "metal_types": ["Rose Gold", "Yellow Gold"],
        "karat_options": ["18 KT", "22 KT"],
        "sizes": ["Adjustable"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SBRC332381-RG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/vintage-rose-gold-cuff",
        "description": "Beautifully crafted vintage-inspired rose gold cuff",
        "occasion": ["Everyday", "Special Events"],
        "style": ["Vintage", "Bohemian"],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Modern Geometric Necklace",
        "price": 89000,
        "category": "Necklaces",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["16 inch", "18 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-PT-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/modern-geometric-necklace",
        "description": "Contemporary geometric design with diamond accents",
        "occasion": ["Work", "Special Events"],
        "style": ["Modern", "Bohemian"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Heritage Kundan Choker",
        "price": 78000,
        "category": "Necklaces",
        "metal_types": ["Yellow Gold", "Rose Gold"],
        "karat_options": ["22 KT"],
        "sizes": ["14 inch", "16 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-YG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/heritage-kundan-choker",
        "description": "Traditional kundan choker with intricate craftsmanship",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Diamond Stacking Ring Set",
        "price": 92000,
        "category": "Rings",
        "metal_types": ["White Gold", "Rose Gold", "Yellow Gold"],
        "karat_options": ["18 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-WG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/diamond-stacking-ring-set",
        "description": "Versatile set of stackable diamond rings",
        "occasion": ["Everyday", "Work"],
        "style": ["Modern", "Classic"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Celestial Diamond Pendant Set",
        "price": 68000,
        "category": "Sets",
        "metal_types": ["White Gold", "Rose Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["16 inch", "18 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SSET332381-WG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/celestial-diamond-pendant-set",
        "description": "Elegant pendant and earring set with celestial motifs",
        "occasion": ["Special Events", "Work"],
        "style": ["Modern", "Classic"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Vintage Rose Gold Cuff",
        "price": 72000,
        "category": "Bracelets",
        "metal_types": ["Rose Gold", "Yellow Gold"],
        "karat_options": ["18 KT", "22 KT"],
        "sizes": ["Adjustable"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SBRC332381-RG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/vintage-rose-gold-cuff",
        "description": "Beautifully crafted vintage-inspired rose gold cuff",
        "occasion": ["Everyday", "Special Events"],
        "style": ["Vintage", "Bohemian"],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Modern Geometric Necklace",
        "price": 89000,
        "category": "Necklaces",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["16 inch", "18 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-PT-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/modern-geometric-necklace",
        "description": "Contemporary geometric design with diamond accents",
        "occasion": ["Work", "Special Events"],
        "style": ["Modern", "Bohemian"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Heritage Kundan Choker",
        "price": 78000,
        "category": "Necklaces",
        "metal_types": ["Yellow Gold", "Rose Gold"],
        "karat_options": ["22 KT"],
        "sizes": ["14 inch", "16 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-YG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/heritage-kundan-choker",
        "description": "Traditional kundan choker with intricate craftsmanship",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Diamond Stacking Ring Set",
        "price": 92000,
        "category": "Rings",
        "metal_types": ["White Gold", "Rose Gold", "Yellow Gold"],
        "karat_options": ["18 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-WG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/diamond-stacking-ring-set",
        "description": "Versatile set of stackable diamond rings",
        "occasion": ["Everyday", "Work"],
        "style": ["Modern", "Classic"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Art Deco Diamond Earrings",
        "price": 83000,
        "category": "Earrings",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["One Size"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SERG332381-PT-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/art-deco-diamond-earrings",
        "description": "Sophisticated Art Deco inspired diamond earrings",
        "occasion": ["Special Events", "Work"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Hollywood Glam"
    },
    # High-End Luxury Range (₹1L - ₹2L)
    {
        "id": str(uuid4()),
        "name": "Maharaja Heritage Necklace Set",
        "price": 150000,
        "category": "Necklaces",
        "metal_types": ["Yellow Gold", "Rose Gold"],
        "karat_options": ["22 KT"],
        "sizes": ["Adjustable"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-YG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/maharaja-heritage-necklace",
        "description": "Traditional Indian heritage necklace with precious stones",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Diamond Chandelier Earrings",
        "price": 125000,
        "category": "Earrings",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["One Size"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SERG332381-WG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/diamond-chandelier-earrings",
        "description": "Elegant chandelier earrings with cascading diamonds",
        "occasion": ["Special Events", "Work"],
        "style": ["Classic", "Modern"],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Royal Ruby Cocktail Ring",
        "price": 180000,
        "category": "Rings",
        "metal_types": ["Platinum", "Yellow Gold"],
        "karat_options": ["18 KT", "22 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-YG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/royal-ruby-cocktail-ring",
        "description": "Statement ruby ring with diamond accents",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Modern", "Bohemian"],
        "celebrity_vibe": "Bold Statement"
    },
    {
        "id": str(uuid4()),
        "name": "Bridal Diamond Set",
        "price": 135000,
        "category": "Sets",
        "metal_types": ["White Gold", "Platinum"],
        "karat_options": ["18 KT"],
        "sizes": ["Complete Set"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SSET332381-PT-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/bridal-diamond-set",
        "description": "Complete bridal set with necklace, earrings, and bracelet",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Classic", "Modern"],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Emerald and Diamond Collar",
        "price": 165000,
        "category": "Necklaces",
        "metal_types": ["Yellow Gold", "Platinum"],
        "karat_options": ["18 KT", "22 KT"],
        "sizes": ["14 inch", "16 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-YG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/emerald-diamond-collar",
        "description": "Luxurious emerald and diamond collar necklace",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Classic", "Vintage"],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Platinum Eternity Band",
        "price": 115000,
        "category": "Rings",
        "metal_types": ["Platinum"],
        "karat_options": ["18 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-PT-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/platinum-eternity-band",
        "description": "Premium platinum eternity band with diamonds",
        "occasion": ["Romantic", "Special Events"],
        "style": ["Classic", "Modern"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Victorian Revival Brooch",
        "price": 108000,
        "category": "Accessories",
        "metal_types": ["Yellow Gold", "Rose Gold"],
        "karat_options": ["18 KT", "22 KT"],
        "sizes": ["One Size"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SACC332381-YG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/victorian-revival-brooch",
        "description": "Exquisite Victorian-inspired brooch with gemstones",
        "occasion": ["Special Events", "Work"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Contemporary Chain Necklace",
        "price": 142000,
        "category": "Necklaces",
        "metal_types": ["Rose Gold", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["18 inch", "20 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-RG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/contemporary-chain-necklace",
        "description": "Modern chain necklace with unique link design",
        "occasion": ["Everyday", "Work"],
        "style": ["Modern", "Bohemian"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Sapphire Halo Ring",
        "price": 198000,
        "category": "Rings",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": list(range(5, 17)),
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-PT-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/sapphire-halo-ring",
        "description": "Stunning sapphire ring with diamond halo setting",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Classic", "Modern"],
        "celebrity_vibe": "Hollywood Glam"
    },
    # Ultra-Luxury Range (₹2L - ₹4L)
    {
        "id": str(uuid4()),
        "name": "Imperial Diamond Tiara",
        "price": 350000,
        "category": "Accessories",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["Adjustable"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SACC332381-PT-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/imperial-diamond-tiara",
        "description": "Regal diamond tiara for the most special occasions",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Maharani Kundan Set",
        "price": 275000,
        "category": "Sets",
        "metal_types": ["Yellow Gold", "Rose Gold"],
        "karat_options": ["22 KT"],
        "sizes": ["Complete Set"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SSET332381-YG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/maharani-kundan-set",
        "description": "Complete bridal kundan jewelry set with precious stones",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Platinum Paradise Necklace",
        "price": 320000,
        "category": "Necklaces",
        "metal_types": ["Platinum"],
        "karat_options": ["18 KT"],
        "sizes": ["16 inch", "18 inch", "20 inch"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-PT-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/platinum-paradise-necklace",
        "description": "Ultra-luxury platinum necklace with rare diamonds",
        "occasion": ["Special Events", "Work"],
        "style": ["Modern", "Classic"],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Royal Sapphire Parure",
        "price": 285000,
        "category": "Sets",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["Complete Set"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SSET332381-PT-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/royal-sapphire-parure",
        "description": "Magnificent sapphire and diamond complete jewelry set",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Classic", "Vintage"],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Heritage Diamond Haar",
        "price": 365000,
        "category": "Necklaces",
        "metal_types": ["Yellow Gold", "Rose Gold"],
        "karat_options": ["22 KT"],
        "sizes": ["Traditional Length"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SNKL332381-YG-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/heritage-diamond-haar",
        "description": "Traditional Indian haar necklace with uncut diamonds",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Vintage", "Classic"],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Contemporary Art Bracelet",
        "price": 225000,
        "category": "Bracelets",
        "metal_types": ["Platinum", "White Gold"],
        "karat_options": ["18 KT"],
        "sizes": ["Adjustable"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SBRC332381-PT-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/all-products/products/contemporary-art-bracelet",
        "description": "Artistic bracelet with sculptural diamond elements",
        "occasion": ["Special Events", "Work"],
        "style": ["Modern", "Bohemian"],
        "celebrity_vibe": "Editorial Chic"
    },
    # Custom Jewelry Option
    {
        "id": str(uuid4()),
        "name": "Design Your Dream Piece",
        "price": 0,  # Price varies based on customization
        "category": "Custom",
        "metal_types": ["Yellow Gold", "White Gold", "Rose Gold", "Platinum"],
        "karat_options": ["14 KT", "18 KT", "22 KT"],
        "sizes": ["Custom"],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/CUSTOM-DESIGN-PV_3024x.jpg?v=1711002550"
        ],
        "url": "https://evoljewels.com/collections/custom-jewelry",
        "description": "Create your unique piece with our expert designers. From concept to creation, make jewelry that's truly yours.",
        "occasion": ["All Occasions"],
        "style": ["All Styles"],
        "celebrity_vibe": "Personal Expression",
        "is_custom": True
    }
]

# Enhanced Celebrity Style Database
CELEBRITY_STYLE_DATABASE = {
    "Emma Stone": {
        "style_vibe": "Editorial Chic",
        "signature_looks": ["minimalist earrings", "delicate necklaces", "classic rings"],
        "occasions": ["red carpet premieres", "award shows", "film festivals"],
        "jewelry_preferences": ["subtle elegance", "modern classics", "refined pieces"],
        "quote": "I love jewelry that feels effortless but still makes a statement"
    },
    "Blake Lively": {
        "style_vibe": "Hollywood Glam", 
        "signature_looks": ["statement necklaces", "vintage-inspired pieces", "bold earrings"],
        "occasions": ["Met Gala", "movie premieres", "fashion week"],
        "jewelry_preferences": ["vintage glamour", "bold statements", "layered pieces"],
        "quote": "The right jewelry can transform any outfit into something magical"
    },
    "Cate Blanchett": {
        "style_vibe": "Editorial Chic",
        "signature_looks": ["architectural jewelry", "modern sculptures", "avant-garde pieces"],
        "occasions": ["Cannes Film Festival", "award ceremonies", "fashion events"],
        "jewelry_preferences": ["artistic designs", "unique silhouettes", "conversation pieces"],
        "quote": "I gravitate toward jewelry that feels like wearable art"
    },
    "Margot Robbie": {
        "style_vibe": "Hollywood Glam",
        "signature_looks": ["diamond tennis bracelets", "statement earrings", "luxury watches"],
        "occasions": ["Oscars", "Barbie premieres", "Chanel events"],
        "jewelry_preferences": ["classic luxury", "pink gold accents", "timeless pieces"],
        "quote": "I believe in investing in jewelry pieces that will be treasured forever"
    },
    "Zendaya": {
        "style_vibe": "Editorial Chic",
        "signature_looks": ["bold ear cuffs", "statement rings", "modern chains"],
        "occasions": ["Spider-Man premieres", "Met Gala", "fashion campaigns"],
        "jewelry_preferences": ["contemporary edge", "bold geometrics", "mixed metals"],
        "quote": "Fashion and jewelry should be fun and express who you are"
    }
}

# Update product filtering to use real data
async def get_enhanced_recommendations(survey_data):
    style = survey_data.get("style", "Classic")
    occasion = survey_data.get("occasion", "Special Events")  
    budget = survey_data.get("budget", "₹25,000–₹65,000")
    
    # Parse budget range using the same logic as BUDGET_RANGES_INR
    budget_min, budget_max = BUDGET_RANGES_INR.get(budget, (25000, 65000))
    
    # Filter products based on criteria
    filtered_products = []
    for product in EVOL_PRODUCTS:
        # Skip custom option for regular filtering
        if product.get("is_custom"):
            continue
            
        if (budget_min <= product["price"] <= budget_max and 
            (style in product["style"] or occasion in product["occasion"])):
            filtered_products.append(product)
    
    # If not enough products, add more from the range
    if len(filtered_products) < 4:
        for product in EVOL_PRODUCTS:
            if (not product.get("is_custom") and 
                budget_min <= product["price"] <= budget_max and 
                product not in filtered_products):
                filtered_products.append(product)
                if len(filtered_products) >= 4:
                    break
    
    # Always add custom option as the last item
    custom_option = next((p for p in EVOL_PRODUCTS if p.get("is_custom")), None)
    if custom_option:
        filtered_products.append(custom_option)
    
    # Convert to RecommendationItem format
    recommendations = []
    for product_data in filtered_products[:4]:
        # Convert price to INR for display
        price_inr = int(round(product_data["price"]))
        
        # Create reason based on matching criteria
        reason_parts = []
        if style in product_data["style"]:
            reason_parts.append("matches your style preference")
        if occasion in product_data["occasion"]:
            reason_parts.append("perfect for your occasion")
        reason_parts.append(f"within your budget at {format_inr(price_inr)}")
        reason = ", ".join(reason_parts) if reason_parts else "curated for your style"
        
        # Create Product object
        product = Product(
            id=product_data["id"],
            name=product_data["name"],
            price=product_data["price"] / USD_TO_INR,  # Convert back to USD for storage
            image_url=product_data["images"][0] if product_data["images"] else "",
            style_tags=product_data["style"],
            occasion_tags=product_data["occasion"],
            description=product_data["description"]
        )
        
        recommendations.append(RecommendationItem(product=product, reason=reason))
    
    return recommendations

@app.post("/api/admin/import-evol-products")
async def import_evol_products():
    """Import real Evol Jewels product data"""
    try:
        # Clear existing products
        await db.products.delete_many({})
        
        # Transform and insert real Evol products
        transformed_products = []
        for product in EVOL_PRODUCTS:
            transformed = {
                "id": product["id"],
                "name": product["name"],
                "price": product["price"] / USD_TO_INR,  # Convert to USD for storage
                "image_url": product["images"][0] if product["images"] else "",
                "style_tags": product["style"],
                "occasion_tags": product["occasion"],
                "description": product["description"]
            }
            transformed_products.append(transformed)
        
        result = await db.products.insert_many(transformed_products)
        
        return {
            "success": True,
            "imported": len(result.inserted_ids),
            "message": "Successfully imported Evol Jewels product data"
        }
    except Exception as e:
        logger.error(f"Import error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/celebrity-styles")
async def get_celebrity_styles():
    """Get celebrity style database"""
    return {
        "celebrities": CELEBRITY_STYLE_DATABASE,
        "style_vibes": ["Hollywood Glam", "Editorial Chic", "Vintage Romance", "Boho Luxe"]
    }

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.8
    max_tokens: Optional[int] = 150

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    """Natural conversational AI chat for jewelry styling"""
    try:
        # Try OpenAI first
        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key and AsyncOpenAI is not None:
            try:
                client = AsyncOpenAI(api_key=api_key)
                
                # Convert messages to OpenAI format
                openai_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
                
                response = await asyncio.wait_for(
                    client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=openai_messages,
                        temperature=request.temperature,
                        max_tokens=request.max_tokens
                    ),
                    timeout=15.0
                )
                
                ai_response = response.choices[0].message.content
                return {"response": ai_response, "source": "openai"}
                
            except Exception as openai_error:
                logger.warning(f"OpenAI chat failed: {openai_error}")
        
        # Try Emergent LLM key as fallback
        try:
            from emergentintegrations.llm import EmergentLLM
            
            emergent_key = os.environ.get("EMERGENT_LLM_KEY")
            if emergent_key:
                llm = EmergentLLM(api_key=emergent_key)
                
                # Use the conversation context
                conversation = "\n".join([f"{msg.role}: {msg.content}" for msg in request.messages])
                
                response = await asyncio.wait_for(
                    llm.acomplete(conversation),
                    timeout=15.0
                )
                
                return {"response": response, "source": "emergent"}
                
        except Exception as emergent_error:
            logger.warning(f"Emergent LLM chat failed: {emergent_error}")
        
        # Intelligent fallback based on the user's question
        user_message = request.messages[-1].content if request.messages else ""
        fallback_response = generate_intelligent_fallback(user_message)
        
        return {"response": fallback_response, "source": "fallback"}
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return {"response": "I'm here to help you find the perfect jewelry! What would you like to know?", "source": "error"}

def generate_intelligent_fallback(user_input):
    """Generate contextual fallback responses"""
    input_lower = user_input.lower()
    
    # Style and fashion questions
    if any(word in input_lower for word in ['style', 'look', 'wear', 'fashion', 'trend']):
        return "Great style question! I love helping with fashion choices. What specific look are you going for?"
    
    # Celebrity questions
    if any(word in input_lower for word in ['celebrity', 'star', 'famous', 'red carpet']):
        return "Ooh, I love celebrity style inspiration! They always have the best jewelry looks. Which celebrity's style catches your eye?"
    
    # Product questions
    if any(word in input_lower for word in ['ring', 'necklace', 'earrings', 'bracelet', 'jewelry']):
        return "That's a beautiful piece you're asking about! Tell me more about what draws you to it."
    
    # Occasion questions
    if any(word in input_lower for word in ['occasion', 'event', 'party', 'wedding', 'date']):
        return "Perfect question! The right jewelry can totally transform your look for any occasion. What's the special event?"
    
    # Purchase questions
    if any(word in input_lower for word in ['buy', 'purchase', 'price', 'cost', 'order']):
        return "I'd love to help you with that! At the end of our chat, you'll get a QR code that makes shopping super easy."
    
    # General positive response
    return "That's such a thoughtful question! I'm here to help you find jewelry that makes you feel absolutely amazing. Tell me more!"

@app.on_event("startup")
async def on_startup():
    await seed_products_if_needed()
    # Auto-import Evol products on startup
    try:
        await import_evol_products()
        logger.info("Evol Jewels products imported successfully")
    except Exception as e:
        logger.error(f"Failed to import Evol products: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
