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

// Header – Evol Jewels centered logo across all pages
const HeaderBar = () => (
  <div className="header-glass" data-testid="header-bar">
    <div className="container py-4 flex items-center justify-center">
      <Link to="/" className="header-logo text-2xl" data-testid="header-logo">Evol Jewels</Link>
    </div>
  </div>
);

// 60s idle reset
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

// Wishlist hook using localStorage
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

// Parallax hook
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

// Intent parser (INR aware)
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

// Floating chat button component (navigates to stylist page)
const StylistFab = () => (
  <Link to="/stylist" className="fab-stylist button-pill" data-testid="fab-stylist">Ask Stylist</Link>
);

// Welcome with swipe to catalog
const Welcome = () => {
  useIdleReset();
  const navigate = useNavigate();
  const [showHint, setShowHint] = useState(false);
  const touchStartY = useRef(null);

  useEffect(()=>{ const t = setTimeout(()=> setShowHint(true), 1200); return ()=> clearTimeout(t); },[]);

  const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    if (touchStartY.current == null) return;
    const endY = e.changedTouches[0].clientY;
    if (touchStartY.current - endY > 50) { navigate('/catalog'); }
    touchStartY.current = null;
  };

  useEffect(() => { axios.get(`${API}/health`).catch(() => {}); }, []);

  return (
    <div className="kiosk-frame ej-gradient-accent" data-testid="welcome-screen" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <HeaderBar />
      <section className="hero section">
        <div className="container grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="hero-title text-5xl md:text-6xl leading-tight" data-testid="welcome-title">
              Meet Your Celebrity Stylist
            </h1>
            <p className="subcopy mt-4 text-lg" data-testid="welcome-subcopy">
              Swipe up to browse the catalogue. Tap the stylist anytime.
            </p>
            <div className="mt-8 flex gap-3">
              <Button data-testid="browse-catalog-btn" className="button-pill" onClick={() => navigate("/catalog")}>Browse Catalogue</Button>
              <Link className="link-underline self-center text-sm" to="/stylist" data-testid="go-stylist-link">Ask stylist</Link>
            </div>
            {showHint && <div className="text-xs subcopy mt-3">Hint: Swipe up to start</div>}
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-neutral-200">
              <img alt="Moodboard" src={VIBE_IMAGES["Hollywood Glam"]} className="w-full h-[520px] object-cover" data-testid="welcome-hero-image" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Catalogue page – full list with INR, FAB to stylist
const Catalogue = () => {
  useIdleReset();
  const [items, setItems] = useState([]);
  const { toggle, has } = useWishlist();
  useEffect(()=>{ axios.get(`${API}/products`).then(r=> setItems(r.data||[])).catch(()=>{}); },[]);
  return (
    <div className="kiosk-frame section" data-testid="catalogue-screen">
      <HeaderBar />
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="card-title text-4xl">Catalogue</h2>
            <p className="subcopy">Browse our collection. Tap the stylist for guidance.</p>
          </div>
          <Badge engine="rules" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-5">
          {items.map((p, idx)=> (
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
      <StylistFab />
    </div>
  );
};

// ChatInline reused from earlier (top of stylist page)
const ChatInline = ({ onNewRecommendation }) => {
  const { ref, offset } = useParallax();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Tell me the occasion, your style vibe, and budget. I\'ll curate top picks instantly.' }
  ]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const intent = parseIntent(userMsg.content);
      const { data } = await axios.post(`${API}/survey`, intent);
      onNewRecommendation?.(data);
      const reply = `Your vibe: ${data.vibe}. ${data.explanation}`;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      const intent = parseIntent(userMsg.content);
      const reply = `Your vibe: ${intent.style === 'Minimal' ? 'Minimal Modern' : intent.style === 'Glam' ? 'Hollywood Glam' : 'Everyday Chic'}. Tailored to your inputs.`;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } finally { setLoading(false); }
  };

  return (
    <Card ref={ref} className="will-change-transform" style={{transform:`translateY(${offset}px)`}} data-testid="chat-inline">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="card-title text-2xl">AI Stylist</div>
          <div className="text-xs subcopy">Describe your look</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[44vh] overflow-y-auto space-y-3 pr-1" data-testid="chat-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`text-sm ${m.role==='assistant'?'text-neutral-800':'text-neutral-700'}`} data-testid={`chat-message-${m.role}-${idx}`}>
              <div className={`inline-block rounded-2xl px-3 py-2 ${m.role==='assistant'?'bg-neutral-100':'bg-emerald-50 text-emerald-800'}`}>{m.content}</div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full flex gap-2">
          <input
            data-testid="chat-input"
            className="flex-1 h-11 rounded-md border border-neutral-300 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
            placeholder="e.g., Wedding, minimal style, budget ₹25,000–₹65,000"
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); send(); } }}
          />
          <Button data-testid="chat-send-button" className="button-pill" disabled={loading} onClick={send}>{loading? 'Thinking…':'Send'}</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// Stylist page – chat at top, auto-scrolling picks below
const StylistPage = () => {
  useIdleReset();
  const [picks, setPicks] = useState([]);
  const [embla, setEmbla] = useState(null);
  const { toggle, has } = useWishlist();

  useEffect(()=>{
    // Default: first 10 products
    axios.get(`${API}/products`).then(r => setPicks((r.data||[]).slice(0,10))).catch(()=>{});
  },[]);

  useEffect(()=>{
    if (!embla) return;
    const id = setInterval(()=>{ try { embla.scrollNext(); } catch {} }, 3000);
    return ()=> clearInterval(id);
  }, [embla]);

  return (
    <div className="kiosk-frame section" data-testid="stylist-screen">
      <HeaderBar />
      <div className="container max-w-5xl space-y-8">
        <ChatInline onNewRecommendation={(data)=> setPicks(data.recommendations?.map(r=> r.product) || [])} />

        <div data-testid="stylist-picks-carousel">
          <Carousel opts={{ align: "start", dragFree: true, loop: true }} setApi={setEmbla}>
            <CarouselContent>
              {picks.map((p, idx)=> (
                <CarouselItem key={p.id} className="basis-[78%] sm:basis-[48%] lg:basis-[38%]">
                  <Card data-testid={`stylist-pick-${idx}`} className="cursor-pointer">
                    <img alt={p.name} src={p.image_url} className="w-full h-56 object-cover rounded-t-xl" />
                    <CardContent>
                      <div className="font-semibold flex items-center justify-between">
                        <span>{p.name}</span>
                        <button
                          data-testid={`stylist-wishlist-toggle-${idx}`}
                          className={`ml-3 text-xs px-2 py-1 rounded-full ${has(p.id)?'bg-emerald-100 text-emerald-800':'bg-neutral-100 text-neutral-700'}`}
                          onClick={(e)=>{ e.stopPropagation(); toggle(p.id); }}
                        >{has(p.id)? 'Saved' : 'Save'}</button>
                      </div>
                      <div className="text-sm subcopy">{nfINR.format(Math.round(p.price * USD_TO_INR))}</div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious data-testid="stylist-prev" />
            <CarouselNext data-testid="stylist-next" />
          </Carousel>
        </div>
      </div>
    </div>
  );
};

// Passport page is unchanged from previous response – omitted here for brevity in this patch
// ... bringing the previous Passport implementation to keep build consistent

const Passport = () => {
  useIdleReset();
  const { toggle, has } = useWishlist();
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  useEffect(()=>{ axios.get(`${API}/passport/${sessionId}`).then(res => setData(res.data)).catch(()=>{}); }, [sessionId]);
  if (!data) return <div className="section">Loading…</div>;
  return (
    <div className="kiosk-frame section" data-testid="passport-screen">
      <HeaderBar />
      <div className="container max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="card-title text-3xl">Jewelry Passport</h2>
            <p className="subcopy">Session: {data.session_id}</p>
          </div>
          <Badge engine={data.engine || 'rules'} />
        </div>
        <div className="mt-2 text-sm text-neutral-700" data-testid="passport-cta-copy">Your selections are saved here. Continue exploring, save favorites, and purchase securely on Evol Jewels.</div>
        <Card className="mt-5">
          <CardHeader>
            <div className="font-medium">Stylist Vibe: {data.vibe}</div>
            <div className="text-sm subcopy">{data.explanation}</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium">Your Survey</div>
              <div className="text-sm subcopy">Occasion: {data.survey.occasion} • Style: {data.survey.style} • Budget: {data.survey.budget}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.recommendations?.map((rec, idx) => (
                <Card key={rec.product.id} data-testid={`passport-product-${idx}`}>
                  <img alt={rec.product.name} src={rec.product.image_url} className="w-full h-40 object-cover rounded-t-xl" />
                  <CardContent>
                    <div className="font-semibold flex items-center justify-between">
                      <span>{rec.product.name}</span>
                      <button
                        data-testid={`passport-wishlist-toggle-${idx}`}
                        className={`ml-3 text-xs px-2 py-1 rounded-full ${has(rec.product.id)?'bg-emerald-100 text-emerald-800':'bg-neutral-100 text-neutral-700'}`}
                        onClick={(e)=>{ e.stopPropagation(); toggle(rec.product.id); }}
                      >{has(rec.product.id)? 'Saved' : 'Save'}</button>
                    </div>
                    <div className="text-sm subcopy">{nfINR.format(Math.round(rec.product.price * USD_TO_INR))}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="pt-4 border-t border-neutral-200">
              <div className="text-sm font-medium mb-2">How helpful were these picks?</div>
              <div className="flex items-center gap-3" data-testid="passport-feedback">
                <button aria-label="Loved it" data-testid="feedback-love" className={`h-9 w-9 rounded-full border flex items-center justify-center ${feedback==='love'?'bg-emerald-100 border-emerald-300':'border-neutral-300'}`} onClick={()=>setFeedback('love')}><Heart size={16} /></button>
                <button aria-label="Great" data-testid="feedback-great" className={`h-9 w-9 rounded-full border flex items-center justify-center ${feedback==='up'?'bg-emerald-100 border-emerald-300':'border-neutral-300'}`} onClick={()=>setFeedback('up')}><ThumbsUp size={16} /></button>
                <button aria-label="Okay" data-testid="feedback-okay" className={`h-9 w-9 rounded-full border flex items-center justify-center ${feedback==='meh'?'bg-emerald-100 border-emerald-300':'border-neutral-300'}`} onClick={()=>setFeedback('meh')}><Meh size={16} /></button>
                <button aria-label="Not sure" data-testid="feedback-unsure" className={`h-9 w-9 rounded-full border flex items-center justify-center ${feedback==='help'?'bg-emerald-100 border-emerald-300':'border-neutral-300'}`} onClick={()=>setFeedback('help')}><HelpCircle size={16} /></button>
                <button aria-label="Didn’t help" data-testid="feedback-down" className={`h-9 w-9 rounded-full border flex items-center justify-center ${feedback==='down'?'bg-emerald-100 border-emerald-300':'border-neutral-300'}`} onClick={()=>setFeedback('down')}><ThumbsDown size={16} /></button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function App() {
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

export default App;
