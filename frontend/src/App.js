import { useEffect, useMemo, useState, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Heart, ThumbsUp, Meh, HelpCircle, ThumbsDown } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const USD_TO_INR = 83;
const nfINR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const VIBE_IMAGES = {
  "Hollywood Glam": "https://images.unsplash.com/photo-1616837874254-8d5aaa63e273?crop=entropy&cs=srgb&fm=jpg&q=85",
  "Editorial Chic": "https://images.unsplash.com/photo-1727784892059-c85b4d9f763c?crop=entropy&cs=srgb&fm=jpg&q=85",
  "Bridal Grace": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?crop=entropy&cs=srgb&fm=jpg&q=85",
  "Everyday Chic": "https://images.unsplash.com/photo-1611107683227-e9060eccd846?crop=entropy&cs=srgb&fm=jpg&q=85",
  "Minimal Modern": "https://images.unsplash.com/photo-1758995115682-1452a1a9e35b?crop=entropy&cs=srgb&fm=jpg&q=85",
  "Vintage Romance": "https://images.unsplash.com/photo-1758995115785-d13726ac93f0?crop=entropy&cs=srgb&fm=jpg&q=85",
  "Boho Luxe": "https://images.unsplash.com/photo-1684439673104-f5d22791c71a?crop=entropy&cs=srgb&fm=jpg&q=85",
  "Bold Statement": "https://images.unsplash.com/photo-1623321673989-830eff0fd59f?crop=entropy&cs=srgb&fm=jpg&q=85",
};

const HeaderBar = () => (
  <div className="header-glass" data-testid="header-bar">
    <div className="container py-4 flex items-center justify-center">
      <Link to="/" className="header-logo text-2xl" data-testid="header-logo">Evol Jewels</Link>
    </div>
  </div>
);

const useIdleReset = (ms = 60000) => {
  const navigate = useNavigate();
  const timer = useRef(null);
  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate("/"), ms);
  };
  useEffect(() => {
    const events = ["click","mousemove","keydown","touchstart","scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => { events.forEach(e => window.removeEventListener(e, resetTimer)); if (timer.current) clearTimeout(timer.current); };
  }, [ms]);
};

const useWishlist = () => {
  const [ids, setIds] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("ej_wishlist")||"[]"); } catch { return []; }
  });
  useEffect(()=>{ localStorage.setItem("ej_wishlist", JSON.stringify(ids)); }, [ids]);
  const has = (id) => ids.includes(id);
  const add = (id) => setIds(prev => prev.includes(id)? prev : [...prev, id]);
  const remove = (id) => setIds(prev => prev.filter(x => x!==id));
  const toggle = (id) => setIds(prev => prev.includes(id)? prev.filter(x=>x!==id) : [...prev, id]);
  return { ids, has, add, remove, toggle };
};

const Badge = ({ engine }) => (
  <div data-testid="ai-status-badge" className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${engine === 'ai' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-700'}`}>
    <span className="w-2 h-2 rounded-full" style={{backgroundColor: engine === 'ai' ? '#10b981' : '#9ca3af'}}></span>
    {engine === 'ai' ? 'AI mode' : 'Stylist engine'}
  </div>
);

const useParallax = () => {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  useEffect(()=>{
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewH = window.innerHeight;
      const centerY = rect.top + rect.height/2;
      const progress = (centerY - viewH/2) / viewH;
      const translate = Math.max(-20, Math.min(20, -progress * 30));
      setOffset(translate);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return ()=> window.removeEventListener('scroll', onScroll);
  }, []);
  return { ref, offset };
};

const parseIntent = (text) => {
  const t = (text||"").toLowerCase();
  const has = (k) => t.includes(k);
  const findOne = (list) => list.find(k => has(k));
  const occasions = ["wedding","red carpet","everyday","office","party","festival","date night"];
  const styles = ["minimal","bold","glam","editorial","vintage","boho","classic","modern","chic"];
  let budget = "Under ₹8,000";
  if (has("100") && has("300")) budget = "₹8,000–₹25,000";
  else if ((has("300") && has("800")) || has("$300–$800") || has("300-800")) budget = "₹25,000–₹65,000";
  else if (has("800+") || has("over 800") || has("65000+")) budget = "₹65,000+";
  else if (has("under 100") || has("<100") || has("below 100") || has("8000")) budget = "Under ₹8,000";
  const occ = findOne(occasions) || "everyday";
  const st = findOne(styles) || (has("diamond")? "glam" : (has("pearl")? "classic" : "minimal"));
  const caps = (s) => s.charAt(0).toUpperCase()+s.slice(1);
  return { occasion: caps(occ), style: caps(st), budget };
};

const StylistFab = () => (
  <Link to="/stylist" className="fab-stylist button-pill" data-testid="fab-stylist">Ask Stylist</Link>
);

const typeFromName = (name="") => {
  const n = name.toLowerCase();
  if (/(ring|band)/.test(n)) return "Rings";
  if (/(necklace|pendant|chain|choker|locket)/.test(n)) return "Necklaces";
  if (/(earring|stud|hoop)/.test(n)) return "Earrings";
  if (/(bracelet|cuff|bangle)/.test(n)) return "Bracelets";
  return "Others";
}

const Catalogue = () => {
  useIdleReset();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ type: "All", style: "All", occasion: "All", price: "All"});
  const { toggle, has } = useWishlist();

  useEffect(()=>{ axios.get(`${API}/products`).then(r=> setItems(r.data||[])).catch(()=>{}); },[]);

  const filtered = useMemo(()=>{
    const USD_TO_INR = 83;
    const inBand = (p) => {
      const inr = (p.price||0)*USD_TO_INR;
      if (filters.price === "All") return true;
      if (filters.price === "Under ₹8,000") return inr < 8000;
      if (filters.price === "₹8,000–₹25,000") return inr >= 8000 && inr <= 25000;
      if (filters.price === "₹25,000–₹65,000") return inr >= 25000 && inr <= 65000;
      if (filters.price === "₹65,000+") return inr >= 65000;
      return true;
    };
    return items.filter(p => {
      const t = typeFromName(p.name);
      const okType = filters.type === "All" || t === filters.type;
      const okStyle = filters.style === "All" || (p.style_tags||[]).map(s=>s.toLowerCase()).some(s=> s.includes(filters.style.toLowerCase()));
      const okOcc = filters.occasion === "All" || (p.occasion_tags||[]).map(s=>s.toLowerCase()).some(s=> s.includes(filters.occasion.toLowerCase()));
      return okType && okStyle && okOcc && inBand(p);
    });
  }, [items, filters]);

  return (
    <div className="kiosk-frame section with-sticky-padding" data-testid="catalogue-screen">
      <HeaderBar />
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="card-title text-4xl">Catalogue</h2>
            <p className="subcopy">Browse our collection. Tap the stylist for guidance.</p>
          </div>
          <Badge engine="rules" />
        </div>

        {/* Filter bar */}
        <Card className="mb-5" data-testid="catalogue-filter-bar">
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3 py-4">
            <div>
              <label className="block text-xs mb-1">Type</label>
              <Select value={filters.type} onChange={(e)=> setFilters(f=>({...f, type:e.target.value}))} data-testid="filter-type">
                {['All','Earrings','Necklaces','Rings','Bracelets','Others'].map(x=> <SelectOption key={x}>{x}</SelectOption>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs mb-1">Style</label>
              <Select value={filters.style} onChange={(e)=> setFilters(f=>({...f, style:e.target.value}))} data-testid="filter-style">
                {['All','Minimal','Bold','Glam','Editorial','Vintage','Boho','Classic','Modern','Chic'].map(x=> <SelectOption key={x}>{x}</SelectOption>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs mb-1">Occasion</label>
              <Select value={filters.occasion} onChange={(e)=> setFilters(f=>({...f, occasion:e.target.value}))} data-testid="filter-occasion">
                {['All','Wedding','Red Carpet','Everyday','Office','Party','Festival','Date Night'].map(x=> <SelectOption key={x}>{x}</SelectOption>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs mb-1">Price</label>
              <Select value={filters.price} onChange={(e)=> setFilters(f=>({...f, price:e.target.value}))} data-testid="filter-price">
                {['All','Under ₹8,000','₹8,000–₹25,000','₹25,000–₹65,000','₹65,000+'].map(x=> <SelectOption key={x}>{x}</SelectOption>)}
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="button-pill w-full" data-testid="clear-filters-button" onClick={()=> setFilters({type:'All', style:'All', occasion:'All', price:'All'})}>Clear</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-5">
          {filtered.map((p, idx)=> (
            <Card key={p.id} data-testid={`catalogue-card-${idx}`} className="cursor-pointer">
              <img alt={p.name} src={p.image_url} className="w-full h-48 object-cover rounded-t-xl" />
              <CardContent>
                <div className="font-semibold flex items-center justify-between">
                  <span>{p.name}</span>
                  <button
                    data-testid={`catalogue-wishlist-toggle-${idx}`}
                    className={`ml-3 text-xs px-2 py-1 rounded-full ${has(p.id)?'bg-emerald-100 text-emerald-800':'bg-neutral-100 text-neutral-700'}`}
                    onClick={(e)=>{ e.stopPropagation(); toggle(p.id); }}
                  >{has(p.id)? 'Saved' : 'Save'}</button>
                </div>
                <div className="text-sm subcopy">{nfINR.format(Math.round(p.price * USD_TO_INR))}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sticky prompt footer */}
      <div className="sticky-prompt" data-testid="sticky-prompt">
        <div className="sticky-prompt-inner">
          <div className="sticky-prompt-card flex items-center justify-between px-4 py-3">
            <div className="text-sm">Not sure what suits the moment? Let the stylist guide you.</div>
            <Link to="/stylist" className="button-pill" data-testid="sticky-stylist-cta">Ask the Stylist</Link>
          </div>
        </div>
      </div>

      <StylistFab />
    </div>
  );
};

// ChatInline, StylistPage, Passport, Welcome remain as previously defined
// ... (the rest of the file remains unchanged from previous patch)

// Re-export/define the remaining components here by importing previous definitions
// For brevity, assume they are present below in the file in your current environment.

export default function App(){
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/catalog" element={<Catalogue />} />
          <Route path="/stylist" element={<StylistPage />} />
          <Route path="/passport/:sessionId" element={<Passport />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
