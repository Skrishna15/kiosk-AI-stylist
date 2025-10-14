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
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-RG-PV_3024x.jpg?v=1711002550",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332381-RG-T2V_3024x.jpg?v=1711002550",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/talia-diamond-ring",
        "description": "Talia Diamond Ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic'],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Orbis Diamond Ring",
        "price": 15323,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/SRNG570647__06_3024x.webp?v=1734329931",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/SRNG570647__05_3024x.webp?v=1734329931",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/orbis-diamond-ring",
        "description": "Orbis Diamond Ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic'],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Hold Me Closer Diamond Ring",
        "price": 21153,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-51407-M-20-YG-PV_3024x.png?v=1715927703",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-51407-M-20-YG-T2V_3024x.png?v=1715927703",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/hold-me-closer-diamond-ring",
        "description": "Hold Me Closer Diamond Ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Dazzling Dewdrop Diamond Studs",
        "price": 22319,
        "category": "Earrings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['One Size'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-51821-Lot5-S17-YG-PV_3024x.png?v=1721109858",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-51821-Lot5-S17-YG-TV_3024x.png?v=1721109858",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/dazzling-dewdrop-diamond-studs",
        "description": "Dazzling Dewdrop Diamond Studs - Evol Jewels",
        "occasion": ['Everyday', 'Work'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Wain Marquise Diamond Ring",
        "price": 22699,
        "category": "Rings",
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG333668-WG-PV_3024x.jpg?v=1680196025",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG333668-WG-T2V_3024x.jpg?v=1680196025",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/wain-marquise-diamond-ring",
        "description": "Wain Marquise Diamond Ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "First-Crush Diamond Necklace",
        "price": 23685,
        "category": "Necklaces",
        "metal_types": ['White Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['16 inch', '18 inch', '20 inch'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-OTH-R-31347-PT60314-YG-PV_3024x.jpg?v=1753343172",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-OTH-R-31347-PT60314-YG-FV_3024x.jpg?v=1753343172",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/first-crush-diamond-necklace",
        "description": "First-Crush Diamond Necklace - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Romance Diamond Ring",
        "price": 25463,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-51850-CST-1914-RN-SMP-PD-3478-YG-PV_3024x.png?v=1718012376",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-51850-CST-1914-RN-SMP-PD-3478-YG-TV_3024x.png?v=1718012375",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/love-you-ring",
        "description": "Romance Diamond Ring - Evol Jewels",
        "occasion": ['Romantic'],
        "style": ['Vintage'],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Nova diamond eternity ring",
        "price": 25237,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46473-ER-11-YG-PV_3024x.jpg?v=1709798343",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46473-ER-11-YG-FV_3024x.jpg?v=1709798343",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/nova-diamond-eternity-ring",
        "description": "Nova diamond eternity ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Tranquil Diamond Necklace",
        "price": 26644,
        "category": "Necklaces",
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['16 inch', '18 inch', '20 inch'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-OTH-R-31339-NK60271-RG-PV_3024x.jpg?v=1695635936",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-OTH-R-31339-NK60271-RG-FV_3024x.jpg?v=1695635936",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/tranquil-diamond-necklace",
        "description": "Tranquil Diamond Necklace - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Lineal Diamond Chain Bracelet",
        "price": 26610,
        "category": "Bracelets",
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['6.7"'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SBRC317623-RG-PV_3024x.jpg?v=1680170804",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SBRC317623-RG-T2V_3024x.jpg?v=1694434404",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/lineal-diamond-chain-bracelet",
        "description": "Lineal Diamond Chain Bracelet - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Butterfly Diamond Studs",
        "price": 26668,
        "category": "Earrings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['One Size'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SERN327984-YG-TV_3024x.jpg?v=1680152913",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SERN327984-YG-PV_3024x.jpg?v=1755327462",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/butterfly-diamond-studs",
        "description": "Butterfly Diamond Studs",
        "occasion": ['Everyday', 'Work'],
        "style": ['Bohemian'],
        "celebrity_vibe": "Boho Luxe"
    },
    {
        "id": str(uuid4()),
        "name": "Duri Diamond Ring",
        "price": 26440,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332405-YG-PV_3024x.jpg?v=1680164750",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332405-YG-T2V_3024x.jpg?v=1715849392",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/duri-damond-ring",
        "description": "Duri Diamond Ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Astra Diamond Earrings",
        "price": 29219,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-27550-E04-RG-PV_3024x.jpg?v=1694198438",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-27550-E04-RG-FV_3024x.jpg?v=1694198438",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/astra-diamond-earrings",
        "description": "Astra Diamond Earrings - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Zeal Diamond Bracelet",
        "price": 29523,
        "category": "Bracelets",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['One Size'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-BR-R-27546-B04-YG-PV_3024x.jpg?v=1692680527",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-BR-R-27546-B04-YG-T2V_3024x.jpg?v=1694435994",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/zeal-diamond-bracelet",
        "description": "Zeal Diamond Bracelet - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Galaxy diamond eternity ring",
        "price": 28921,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46471-ER-9-YG-PV_3024x.jpg?v=1709793988",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46471-ER-9-YG-FV_3024x.jpg?v=1709793988",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/galaxy-diamond-eternity",
        "description": "Galaxy diamond eternity ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Ornate Star Diamond Earrings",
        "price": 30087,
        "category": "Rings",
        "metal_types": ['White Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-51823-Lot5-S21-WG-PV_3024x.png?v=1719569654",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-51823-Lot5-S21-WG-TV_3024x.png?v=1719569654",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/ornate-star-diamond-earrings",
        "description": "Ornate Star Diamond Earrings - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Cupid Diamond Earrings",
        "price": 30496,
        "category": "Rings",
        "metal_types": ['White Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-47053-V5-WG-PV_3024x.jpg?v=1709989559",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-47053-V5-WG-TV_3024x.jpg?v=1709989559",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/cupid-diamond-earrings",
        "description": "Cupid Diamond Earrings - Evol Jewels",
        "occasion": ['Romantic'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Bubble diamond ring",
        "price": 30304,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46456-E-22-YG-PV_3024x.jpg?v=1710309630",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46456-E-22-YG-FV_3024x.jpg?v=1710309630",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/bubble-diamond-ring",
        "description": "Bubble diamond ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Zen diamond eternity ring",
        "price": 30469,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46475-ER-15-YG-PV_3024x.jpg?v=1709883074",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46475-ER-15-YG-FV_3024x.jpg?v=1709883074",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/zen-diamond-eternity-ring",
        "description": "Zen diamond eternity ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Selene Diamond Earrings",
        "price": 31320,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-27553-E09-YG-PV_3024x.jpg?v=1695300631",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-27553-E09-YG-FV_3024x.jpg?v=1695300795",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/selene-diamond-earrings",
        "description": "Selene Diamond Earrings - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Mirage diamond Earrings",
        "price": 31700,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-27547-E01-RG-FV_3024x.jpg?v=1692796472",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-27547-E01-RG-TV_3024x.jpg?v=1694520597",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/mirage-diamond-earrings",
        "description": "Mirage diamond Earrings - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Floret Diamond Stud Earrings",
        "price": 31446,
        "category": "Rings",
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SERN332425-RG-TV_3024x.jpg?v=1755324762",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SERN332425-RG-FV_3024x.jpg?v=1755324766",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/floret-diamond-stud-earrings",
        "description": "Floret Diamond Stud Earrings",
        "occasion": ['Everyday', 'Work'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Serpent's Tail Diamond Ring",
        "price": 31950,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332407-YG-PV_3024x.jpg?v=1755327297",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332407-YG-T2V_3024x.jpg?v=1694435186",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/serpents-tail-diamond-ring",
        "description": "Serpent's Tail Diamond Ring",
        "occasion": ['Special Events'],
        "style": ['Vintage'],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Stardust Diamond Bracelet",
        "price": 32892,
        "category": "Bracelets",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['One Size'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-BR-R-27545-B02-RG-PV_3024x.jpg?v=1692613512",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-BR-R-27545-B02-RG-T2V_3024x.jpg?v=1692613512",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/stardust-diamond-bracelet",
        "description": "Stardust Diamond Bracelet - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Hope Diamond Eternity Ring",
        "price": 32289,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332409-YG-PV_3024x.jpg?v=1755325114",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332409-YG-T2V_3024x.jpg?v=1694434218",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/hope-diamond-eternity-ring",
        "description": "Hope Diamond Eternity Ring",
        "occasion": ['Special Events'],
        "style": ['Classic'],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Amour Diamond Earring",
        "price": 32792,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-47051-V2-YG-FV_3024x.jpg?v=1709889123",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-47051-V2-YG-PV_3024x.jpg?v=1709889273",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/amour-diamond-earring",
        "description": "Amour Diamond Earring - Evol Jewels",
        "occasion": ['Romantic'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Amour Diamond Ring",
        "price": 33370,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-47062-V17-YG-PV_3024x.jpg?v=1710584357",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-47062-V17-YG-FV_3024x.jpg?v=1710584357",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/amour-diamond-ring",
        "description": "Amour Diamond Ring - Evol Jewels",
        "occasion": ['Romantic'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Clique Diamond Studs",
        "price": 35506,
        "category": "Earrings",
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['One Size'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SERN332458-RG-TV_3024x.jpg?v=1755326424",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SERN332458-RG-FV_3024x.jpg?v=1755326432",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/clique-diamond-studs",
        "description": "Clique Diamond Studs",
        "occasion": ['Everyday', 'Work'],
        "style": ['Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Mirage Diamond Earrings",
        "price": 35212,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-51835-Lot5-S63-YG-PV_3024x.png?v=1719383938",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-51835-Lot5-S63-YG-TV_3024x.png?v=1719383938",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/mirage-diamond-earrings-1",
        "description": "Mirage Diamond Earrings - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Solar diamond eternity ring",
        "price": 35012,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46472-ER-10-YG-PV_3024x.jpg?v=1709796443",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46472-ER-10-YG-FV_3024x.jpg?v=1709796443",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/solar-diamond-eternity-ring",
        "description": "Solar diamond eternity ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Grapevine Diamond Earrings",
        "price": 36333,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-27549-E03-YG-PV_3024x.jpg?v=1709125898",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-27549-E03-YG-TV_3024x.jpg?v=1709125898",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/grapevine-diamond-earrings",
        "description": "Grapevine Diamond Earrings - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Petite zen eternity ring",
        "price": 35341,
        "category": "Rings",
        "metal_types": ['White Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46476-ER-15-WG-PV_3024x.jpg?v=1709805604",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-46476-ER-15-WG-FV_3024x.jpg?v=1709805604",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/petite-zen-eternity-ring",
        "description": "Petite zen eternity ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Dutchess Diamond Ring",
        "price": 43415,
        "category": "Rings",
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-31329-LR60282-YG-PV_3024x.jpg?v=1692276243",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-RN-R-31329-LR60282-YG-T2V_3024x.jpg?v=1694436245",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/dutchess-diamond-ring",
        "description": "Dutchess Diamond Ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Vintage'],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Yara Diamond Pendant",
        "price": 43968,
        "category": "Necklaces",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['16 inch', '18 inch', '20 inch'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/CPND330239-RG-PV_3024x.jpg?v=1755327077",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/CPND330239-RG-TV_3024x.jpg?v=1755327083",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/yara-diamond-pendant",
        "description": "Yara Diamond Pendant",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Florentine Grace Diamond Earrings",
        "price": 44086,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-51827-Lot5-S34-YG-PV_829a6a3c-d4db-4800-9fc5-188fbcd85717_3024x.png?v=1719572101",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-51827-Lot5-S34-YG-TV_7baa627a-492e-4056-971d-8c1c7b853f6b_3024x.png?v=1719572101",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/florentine-grace-diamond-earrings",
        "description": "Florentine Grace Diamond Earrings - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic'],
        "celebrity_vibe": "Hollywood Glam"
    },
    {
        "id": str(uuid4()),
        "name": "Sprinkle Diamond Bracelet",
        "price": 44113,
        "category": "Bracelets",
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['One Size'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-BR-R-31326-LB70662-RG-PV_3024x.jpg?v=1695302214",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-BR-R-31326-LB70662-RG-T2V_3024x.jpg?v=1695302214",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/sprinkle-diamond-bracelet",
        "description": "Sprinkle Diamond Bracelet - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Oscar Diamond Half Eternity Ring",
        "price": 44326,
        "category": "Rings",
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG317630-RG-PV_3024x.jpg?v=1680190113",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG317630-RG-T2V_3024x.jpg?v=1694434966",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/oscar-diamond-half-eternity-ring",
        "description": "Oscar Diamond Half Eternity Ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Eros Diamond Halo Ring",
        "price": 44483,
        "category": "Rings",
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332508-RG-PV_8d59e480-92a5-4ab6-a004-5cffc59de1be_3024x.jpg?v=1755324597",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332508-RG-T2V_3024x.jpg?v=1755324603",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/eros-diamond-halo-ring",
        "description": "Eros Diamond Halo Ring",
        "occasion": ['Romantic', 'Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Flutter Diamond earrings",
        "price": 44534,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-52362-ER70872-YG-PV_3024x.png?v=1721637490",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-52362-ER70872-YG-TV_3024x.png?v=1721637490",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/flutter-diamond-earrings",
        "description": "Flutter Diamond earrings - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Bohemian'],
        "celebrity_vibe": "Boho Luxe"
    },
    {
        "id": str(uuid4()),
        "name": "Better Half Diamond Earrings",
        "price": 56626,
        "category": "Rings",
        "metal_types": ['White Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-47057-V15-WG-PV_3024x.jpg?v=1710577384",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-47057-V15-WG-TV_3024x.jpg?v=1710577384",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/better-half-diamond-earrings",
        "description": "Better Half Diamond Earrings - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Nomadic Diamond Huggie Earring",
        "price": 57005,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-31318-ER60416-YG-FV_3024x.jpg?v=1694514501",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-31318-ER60416-YG-PV_3024x.jpg?v=1694514501",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/nomadic-diamond-huggie-earring",
        "description": "Nomadic Diamond Huggie Earring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Bohemian'],
        "celebrity_vibe": "Boho Luxe"
    },
    {
        "id": str(uuid4()),
        "name": "Urbane Diamond J-hoop Earrings",
        "price": 61075,
        "category": "Rings",
        "metal_types": ['Rose Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/SERN332380-RG-PV_2906fcc2-1b8a-407b-a7f6-7b9d800ce8b9_3024x.jpg?v=1755325278",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/SERN332380-RG-TV_fc321226-29c9-4240-b930-e9fa79d89647_3024x.jpg?v=1753187465",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/urbane-diamond-j-hoop-earrings",
        "description": "Urbane Diamond J-hoop Earrings",
        "occasion": ['Special Events'],
        "style": ['Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Reverie Diamond Earrings",
        "price": 62331,
        "category": "Rings",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-27556-M02-RG-PV_3024x.jpg?v=1696855803",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/files/PMA-ER-R-27556-M02-RG-FV_3024x.jpg?v=1696855803",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/valentina-diamond-earrings",
        "description": "Valentina Diamond Earrings - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Marion Diamond Halo Pendant",
        "price": 62696,
        "category": "Necklaces",
        "metal_types": ['Yellow Gold'],
        "karat_options": ['14 KT'],
        "sizes": ['16 inch', '18 inch', '20 inch'],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SPND340240-YG-PV_3024x.jpg?v=1675343506",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SPND340240-YG-TV_3024x.jpg?v=1694434495",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/marion-diamond-halo-pendant",
        "description": "Marion Diamond Halo Pendant - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Classic', 'Modern'],
        "celebrity_vibe": "Editorial Chic"
    },
    {
        "id": str(uuid4()),
        "name": "Victoria Diamond Ring",
        "price": 68128,
        "category": "Rings",
        "metal_types": ['White Gold'],
        "karat_options": ['14 KT'],
        "sizes": [5],
        "images": [
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332383-WG-PV_3024x.jpg?v=1675080477",
            "https://cdn.shopify.com/s/files/1/0674/7665/2346/products/SRNG332383-WG-T2V_3024x.jpg?v=1694435813",
        ],
        "url": "https://evoljewels.com/collections/all-products/products/victoria-diamond-ring",
        "description": "Victoria Diamond Ring - Evol Jewels",
        "occasion": ['Special Events'],
        "style": ['Vintage'],
        "celebrity_vibe": "Vintage Romance"
    },
    {
        "id": str(uuid4()),
        "name": "Design Your Dream Piece",
        "price": 0,
        "category": "Custom",
        "metal_types": ["Yellow Gold", "White Gold", "Rose Gold", "Platinum"],
        "karat_options": ["14 KT", "18 KT", "22 KT"],
        "sizes": ["Custom"],
        "images": [
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000"
        ],
        "url": "https://evoljewels.com/pages/custom-jewelry",
        "description": "Create your own unique piece with our expert jewelers. Perfect for special occasions and personalized gifts.",
        "occasion": ["Special Events", "Romantic"],
        "style": ["Classic", "Modern", "Vintage", "Bohemian"],
        "celebrity_vibe": "Hollywood Glam",
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
    # Take first 3 regular products, then add custom option as 4th
    regular_products = [p for p in filtered_products if not p.get("is_custom")][:3]
    custom_products = [p for p in filtered_products if p.get("is_custom")]
    
    # Combine regular products with custom option
    products_to_process = regular_products + custom_products
    
    for product_data in products_to_process:
        # Convert price to INR for display
        price_inr = int(round(product_data["price"]))
        
        # Create reason based on matching criteria
        reason_parts = []
        if product_data.get("is_custom"):
            reason = "Create your own unique piece with our expert jewelers"
        else:
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
