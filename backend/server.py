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
    price: float
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
    vibe: str
    explanation: str
    moodboard_image: str
    recommendations: List[RecommendationItem]
    created_at: str

class PassportResponse(BaseModel):
    session_id: str
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

BUDGET_RANGES = {
    "Under $100": (0, 100),
    "$100–$300": (100, 300),
    "$300–$800": (300, 800),
    "$800+": (800, 999999),
}

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

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
    """Use OpenAI (via OPENAI_API_KEY) to classify vibe. Fallback returns None."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or AsyncOpenAI is None:
        return None
    try:
        client = AsyncOpenAI(api_key=api_key)
        model = os.environ.get("OPENAI_MODEL", "gpt-4")  # user requested gpt-4
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
        # Some older models (e.g. gpt-4) do not support response_format. Use it only if supported.
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
        # Try strict JSON first
        data = None
        try:
            data = json.loads(content)
        except Exception:
            # Fallback: extract JSON object from text
            import re
            m = re.search(r"\{[\s\S]*\}", content)
            if m:
                try:
                    data = json.loads(m.group(0))
                except Exception:
                    data = None
        if not isinstance(data, dict):
            # Last resort: map a simple text into our schema
            vibe_guess = match_vibe(SurveyInput(**payload.model_dump()))
            return AIResponse(vibe=vibe_guess, explanation="Tailored to your inputs.", source="ai")
        vibe = data.get("vibe")
        explanation = data.get("explanation")
        if isinstance(vibe, str) and isinstance(explanation, str) and vibe in VIBE_IMAGES:
            return AIResponse(vibe=vibe, explanation=explanation, source="ai")
    except Exception as e:
        logging.warning(f"OpenAI vibe failed, fallback to rules. Error: {e}")
    return None

async def recommend_products(s: SurveyInput, vibe: str) -> List[RecommendationItem]:
    min_b, max_b = BUDGET_RANGES.get(s.budget, (0, 999999))

    style_q = s.style.lower().split()
    occ_q = s.occasion.lower().split()

    cursor = db.products.find({})
    items = await cursor.to_list(1000)

    scored: List[tuple[float, Dict[str, Any]]] = []
    for it in items:
        price = float(it.get("price", 0))
        if not (min_b <= price <= max_b):
            continue
        score = 0.0
        tags = [t.lower() for t in it.get("style_tags", [])]
        occs = [t.lower() for t in it.get("occasion_tags", [])]
        score += sum(1 for t in tags for q in style_q if q in t) * 1.5
        score += sum(1 for t in occs for q in occ_q if q in t) * 1.2
        if vibe.split()[0].lower() in tags:
            score += 1.0
        score += 0.2 if 120 <= price <= 600 else 0
        scored.append((score, it))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [x[1] for x in scored[:4]]

    recs: List[RecommendationItem] = []
    for it in top:
        reason_bits = []
        if any(k in (s.style.lower()) for k in it.get("style_tags", [])):
            reason_bits.append("matches your style preference")
        if any(k in (s.occasion.lower()) for k in it.get("occasion_tags", [])):
            reason_bits.append("perfect for your occasion")
        price = it.get("price")
        reason_bits.append(f"within your budget at ${price}")
        reason = ", ".join(reason_bits) if reason_bits else "tailored to your inputs"
        recs.append(RecommendationItem(product=Product(**it), reason=reason))
    if len(recs) < 3:
        for it in items:
            price = float(it.get("price", 0))
            if min_b <= price <= max_b and all(r.product.id != it["id"] for r in recs):
                recs.append(RecommendationItem(product=Product(**it), reason="great fit for your budget"))
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
    else:
        vibe = match_vibe(payload)
        explanation = vibe_explanation(vibe)
    mood_img = VIBE_IMAGES.get(vibe)
    recs = await recommend_products(payload, vibe)

    session_id = str(uuid.uuid4())
    created_at = now_iso()
    await db.sessions.insert_one({
        "id": session_id,
        "created_at": created_at,
        "survey": payload.model_dump(),
        "vibe": vibe,
        "explanation": explanation,
        "recommendation_product_ids": [r.product.id for r in recs],
    })

    return RecommendationResponse(
        session_id=session_id,
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
        recs.append(RecommendationItem(product=Product(**it), reason="curated for your vibe"))

    survey = SurveyInput(**sess["survey"]) if isinstance(sess.get("survey"), dict) else SurveyInput(**{})
    return PassportResponse(
        session_id=sess["id"],
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

@app.on_event("startup")
async def on_startup():
    await seed_products_if_needed()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
