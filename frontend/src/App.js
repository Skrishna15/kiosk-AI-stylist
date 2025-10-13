import { useEffect, useMemo, useState, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Heart, ThumbsUp, Meh, HelpCircle, ThumbsDown } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Import new page components
import WelcomeScreen from "@/pages/WelcomeScreen";
import SurveyScreen from "@/pages/SurveyScreen";  
import RecommendationScreen from "@/pages/RecommendationScreen";
import QRCodeScreen from "@/pages/QRCodeScreen";

// Import individual survey pages
import StylePreferencePage from "@/pages/StylePreferencePage";
import OccasionPage from "@/pages/OccasionPage";
import BudgetRangePage from "@/pages/BudgetRangePage";
import MetalTypePage from "@/pages/MetalTypePage";
import AIJewelryStylistPage from "@/pages/AIJewelryStylistPage";

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

// Enhanced idle detection with attract mode
const useIdleAttract = (onIdle, ms = 30000) => {
  const timer = useRef(null);
  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onIdle, ms);
  };
  useEffect(() => {
    const events = ["click", "mousemove", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => { 
      events.forEach(e => window.removeEventListener(e, resetTimer)); 
      if (timer.current) clearTimeout(timer.current); 
    };
  }, [ms, onIdle]);
};

// 60s idle reset (fallback)
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

// Attract overlay for Welcome (appears after 20s idle on Welcome only)
const AttractOverlay = ({ onStart }) => {
  const [index, setIndex] = useState(0);
  useEffect(()=>{
    const t = setInterval(()=> setIndex(i => (i+1)%Object.keys(VIBE_IMAGES).length), 2500);
    return ()=> clearInterval(t);
  }, []);
  const keys = Object.keys(VIBE_IMAGES);
  const current = keys[index];
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50" data-testid="attract-overlay">
      <div className="w-[860px] max-w-[90vw] rounded-3xl overflow-hidden shadow-2xl border border-neutral-700 bg-white/5">
        <div className="grid md:grid-cols-2">
          <img alt={current} src={VIBE_IMAGES[current]} className="w-full h-[420px] object-cover" />
          <div className="p-8 text-white flex flex-col justify-between" style={{background:"linear-gradient(120deg, rgba(21,21,21,.9), rgba(21,21,21,.75))"}}>
            <div>
              <div className="text-sm tracking-widest opacity-80">Evol Jewels</div>
              <div className="text-4xl mt-2 font-serif">Meet Your Celebrity Stylist</div>
              <div className="opacity-80 mt-3">Tap to begin your 60‑second personalized jewelry picks.</div>
            </div>
            <div className="mt-6">
              <Button className="button-pill" data-testid="attract-start-button" onClick={onStart}>Start</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Parallax hook for cards
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

// Floating chat dialog widget (Welcome/Survey quick access)
const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your in-store stylist. Tell me the occasion and vibe you\'re going for, and your budget.' }
  ]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const intent = parseIntent(userMsg.content);
      const { data } = await axios.post(`${API}/ai/vibe`, intent);
      const reply = `Your vibe: ${data.vibe}. ${data.explanation}`;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      const intent = parseIntent(userMsg.content);
      const reply = `Your vibe: ${intent.style === 'Minimal' ? 'Minimal Modern' : intent.style === 'Glam' ? 'Hollywood Glam' : 'Everyday Chic'}. Tailored to your inputs.`;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <button
        data-testid="chat-open-button"
        onClick={()=>setOpen(true)}
        className="fixed right-6 z-40 button-pill shadow-lg px-5 py-3"
        style={{ bottom: 110 }}
      >Ask Stylist</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="chat-dialog" className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="card-title text-2xl">Ask the Stylist</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1" data-testid="chat-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`text-sm ${m.role==='assistant'?'text-neutral-800':'text-neutral-700'}`} data-testid={`chat-message-${m.role}-${idx}`}>
                <div className={`inline-block rounded-2xl px-3 py-2 ${m.role==='assistant'?'bg-neutral-100':'bg-emerald-50 text-emerald-800'}`}>{m.content}</div>
              </div>
            ))}
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
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

// Reusable chat card (supports fixed half-screen height) with multiple-choice flow
const ChatInline = ({ onNewRecommendation, fixedHeightVH }) => {
  const { ref, offset } = useParallax();
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [style, setStyle] = useState("");
  const [budget, setBudget] = useState("");

  const OCCASIONS = ["Wedding","Red Carpet","Everyday","Office","Party","Festival","Date Night"];
  const STYLES = ["Minimal","Bold","Glam","Editorial","Vintage","Boho","Classic","Modern","Chic"];
  const BUDGETS = ["Under ₹8,000","₹8,000–₹25,000","₹25,000–₹65,000","₹65,000+"];

  const submitChoices = async () => {
    if (!occasion || !style || !budget) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/survey`, { occasion, style, budget });
      onNewRecommendation?.(data);
    } catch (e) {
      // no-op; keeps UI responsive
    } finally { setLoading(false); }
  };

  const cardStyle = fixedHeightVH ? { height: `50svh` } : { transform: `translateY(${offset}px)` };

  const Chip = ({ active, children, onClick, testid }) => (
    <button
      data-testid={testid}
      onClick={onClick}
      className={`px-3 py-2 rounded-full text-xs border transition-colors ${active? 'bg-emerald-100 text-emerald-800 border-emerald-300':'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100'}`}
    >{children}</button>
  );

  return (
    <Card ref={ref} className="will-change-transform" style={cardStyle} data-testid="chat-inline">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="card-title text-2xl">AI Stylist</div>
          <div className="text-xs subcopy">Choose to refine picks</div>
        </div>
      </CardHeader>
      <CardContent className="h-full overflow-y-auto space-y-5 pr-1">
        <div>
          <div className="text-sm font-medium mb-2">Occasion</div>
          <div className="flex flex-wrap gap-2" data-testid="choices-occasion">
            {OCCASIONS.map(o => (
              <Chip key={o} testid={`choice-occasion-${o}`} active={occasion===o} onClick={()=>setOccasion(o)}>{o}</Chip>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Style</div>
          <div className="flex flex-wrap gap-2" data-testid="choices-style">
            {STYLES.map(s => (
              <Chip key={s} testid={`choice-style-${s}`} active={style===s} onClick={()=>setStyle(s)}>{s}</Chip>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Budget</div>
          <div className="flex flex-wrap gap-2" data-testid="choices-budget">
            {BUDGETS.map(b => (
              <Chip key={b} testid={`choice-budget-${b}`} active={budget===b} onClick={()=>setBudget(b)}>{b}</Chip>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full flex justify-end">
          <Button data-testid="show-picks-button" className="button-pill" disabled={loading || !occasion || !style || !budget} onClick={submitChoices}>{loading? 'Curating…':'Show Picks'}</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// Old Welcome component removed - now using NewFlow as the main experience

// Stylist page: chat (half page) + auto-scrolling picks below with QR bottom-left after session
const StylistPage = () => {
  useIdleReset();
  const [picks, setPicks] = useState([]);
  const [embla, setEmbla] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [qr, setQr] = useState("");
  const { toggle, has } = useWishlist();

  useEffect(()=>{ axios.get(`${API}/products`).then(r => setPicks((r.data||[]).slice(0,10))).catch(()=>{}); },[]);

  useEffect(()=>{
    if (!embla) return;
    const id = setInterval(()=>{ try { embla.scrollNext(); } catch {} }, 3000);
    return ()=> clearInterval(id);
  }, [embla]);

  const passportLink = useMemo(() => sessionId ? `${window.location.origin}/passport/${sessionId}` : "", [sessionId]);
  useEffect(()=>{ if (passportLink) { QRCode.toDataURL(passportLink, { margin: 1, width: 160 }).then(setQr).catch(()=>{}); } }, [passportLink]);

  return (
    <div className="kiosk-frame section" data-testid="stylist-screen">
      <div className="container max-w-5xl space-y-8">
        <ChatInline fixedHeightVH={50} onNewRecommendation={(data)=> { setPicks(data.recommendations?.map(r=> r.product) || []); setSessionId(data.session_id); }} />

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

      {sessionId && qr && (
        <div className="fixed left-6 bottom-6 z-40 flex items-center gap-3 bg-white/85 backdrop-blur-md border border-neutral-200 rounded-xl px-3 py-2 shadow" data-testid="floating-qr">
          <img src={qr} alt="QR" className="w-[120px] h-[120px] rounded" />
          <div className="text-xs subcopy">
            <div data-testid="floating-qr-cta-copy">Your picks are saved in your Jewelry Passport. Scan to open on your phone.</div>
            <div className="mt-1 break-all" data-testid="floating-qr-link">{passportLink}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// The rest of pages unchanged (Survey, Recommendation, Passport)

const Survey = () => {
  useIdleReset();
  const navigate = useNavigate();
  const [occasion, setOccasion] = useState("");
  const [style, setStyle] = useState("");
  const [budget, setBudget] = useState("");
  const [vibePref, setVibePref] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!occasion || !style || !budget) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/survey`, { occasion, style, budget, vibe_preference: vibePref });
      navigate(`/recommendation/${data.session_id}`, { state: data });
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  return (
    <div className="kiosk-frame section" data-testid="survey-screen">
      <div className="container max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="card-title text-3xl">Quick Style Survey</h2>
                <p className="subcopy mt-1">Answer 3 questions to get your vibe and picks.</p>
              </div>
              <Badge engine="rules" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm mb-2" htmlFor="occasion">Occasion</label>
              <Select id="occasion" value={occasion} onChange={(e)=>setOccasion(e.target.value)} data-testid="occasion-select">
                <SelectOption value="">Select occasion</SelectOption>
                <SelectOption>Wedding</SelectOption>
                <SelectOption>Red Carpet</SelectOption>
                <SelectOption>Everyday</SelectOption>
                <SelectOption>Office</SelectOption>
                <SelectOption>Party</SelectOption>
                <SelectOption>Festival</SelectOption>
                <SelectOption>Date Night</SelectOption>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-2" htmlFor="style">Style Preference</label>
              <Select id="style" value={style} onChange={(e)=>setStyle(e.target.value)} data-testid="style-select">
                <SelectOption value="">Select style</SelectOption>
                <SelectOption>Minimal</SelectOption>
                <SelectOption>Bold</SelectOption>
                <SelectOption>Glam</SelectOption>
                <SelectOption>Editorial</SelectOption>
                <SelectOption>Vintage</SelectOption>
                <SelectOption>Boho</SelectOption>
                <SelectOption>Classic</SelectOption>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-2" htmlFor="budget">Budget</label>
              <Select id="budget" value={budget} onChange={(e)=>setBudget(e.target.value)} data-testid="budget-select">
                <SelectOption value="">Select budget</SelectOption>
                <SelectOption>Under ₹8,000</SelectOption>
                <SelectOption>₹8,000–₹25,000</SelectOption>
                <SelectOption>₹25,000–₹65,000</SelectOption>
                <SelectOption>₹65,000+</SelectOption>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-2" htmlFor="vibe">Optional stylist vibe</label>
              <Select id="vibe" value={vibePref} onChange={(e)=>setVibePref(e.target.value)} data-testid="vibe-select">
                <SelectOption value="">No preference</SelectOption>
                {Object.keys(VIBE_IMAGES).map(v => (
                  <SelectOption key={v}>{v}</SelectOption>
                ))}
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button data-testid="survey-submit-button" disabled={loading || !occasion || !style || !budget} className="button-pill" onClick={submit}>{loading? 'Scouting looks…' : 'See My Picks'}</Button>
          </CardFooter>
        </Card>
      </div>
      <ChatWidget />
    </div>
  );
};

const Recommendation = () => {
  useIdleReset();
  const { toggle, has, ids } = useWishlist();
  const params = useParams();
  const { state } = useLocation();
  const [data, setData] = useState(state || null);
  const [qr, setQr] = useState("");
  const sessionId = params.sessionId;

  const { ref: parallaxRef, offset } = useParallax();
  const passportLink = useMemo(()=> `${window.location.origin}/passport/${sessionId}`, [sessionId]);

  useEffect(()=>{
    if (!data && sessionId){
      axios.get(`${API}/passport/${sessionId}`).then(res => {
        const r = res.data;
        setData({
          session_id: r.session_id,
          engine: r.engine || 'rules',
          vibe: r.vibe,
          explanation: r.explanation,
          moodboard_image: VIBE_IMAGES[r.vibe] || VIBE_IMAGES["Everyday Chic"],
          recommendations: r.recommendations,
          created_at: r.created_at,
        });
      });
    }
  }, [sessionId, data]);

  useEffect(()=>{
    if (!sessionId) return;
    QRCode.toDataURL(passportLink, { margin: 1, width: 220 }).then(setQr).catch(()=>{});
  }, [passportLink, sessionId]);

  const openDetail = (p) => {};

  if (!data) return <div className="section">Loading…</div>;

  return (
    <div className="kiosk-frame section" data-testid="recommendation-screen">
      <div className="container max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="order-2 md:order-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="card-title text-4xl" data-testid="vibe-title">Your Style Match: {data.vibe}</h2>
                <p className="subcopy mt-2" data-testid="vibe-explanation">{data.explanation}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge engine={data.engine || 'rules'} />
                <div className="text-xs subcopy" data-testid="wishlist-count">Wishlist: {ids.length}</div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data.recommendations?.map((rec, idx) => (
                <Card key={rec.product.id} data-testid={`product-card-${idx}`} onClick={() => openDetail(rec.product)} className="cursor-pointer">
                  <img alt={rec.product.name} src={rec.product.image_url} className="w-full h-44 object-cover rounded-t-xl" />
                  <CardContent>
                    <div className="font-semibold flex items-center justify-between">
                      <span>{rec.product.name}</span>
                      <button
                        data-testid={`wishlist-toggle-${idx}`}
                        className={`ml-3 text-xs px-2 py-1 rounded-full ${has(rec.product.id)?'bg-emerald-100 text-emerald-800':'bg-neutral-100 text-neutral-700'}`}
                        onClick={(e)=>{ e.stopPropagation(); toggle(rec.product.id); }}
                      >{has(rec.product.id)? 'Saved' : 'Save'}</button>
                    </div>
                    <div className="text-sm subcopy">{nfINR.format(Math.round(rec.product.price * USD_TO_INR))}</div>
                    <div className="text-xs mt-2 text-neutral-600">{rec.reason}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-6">
            <div ref={parallaxRef} data-testid="moodboard-parallax" className="rounded-2xl overflow-hidden shadow-xl border border-neutral-200 will-change-transform" style={{transform:`translateY(${offset}px)`}}>
              <ChatInline onNewRecommendation={(rec) => {
                setData({
                  session_id: rec.session_id,
                  engine: rec.engine || 'ai',
                  vibe: rec.vibe,
                  explanation: rec.explanation,
                  moodboard_image: rec.moodboard_image,
                  recommendations: rec.recommendations,
                  created_at: rec.created_at,
                });
                QRCode.toDataURL(`${window.location.origin}/passport/${rec.session_id}`, { margin: 1, width: 220 }).then(setQr).catch(()=>{});
              }} />
            </div>
            <div className="mt-6 flex items-center gap-4">
              {qr && <img src={qr} alt="QR" className="w-[160px] h-[160px] border border-neutral-300 rounded-lg" data-testid="passport-qr"/>}
              <div>
                <div className="text-sm font-medium">Take it with you</div>
                <div className="text-xs subcopy break-all" data-testid="passport-link">{passportLink}</div>
                <div className="text-xs mt-2 text-neutral-600" data-testid="passport-cta-copy">Your picks are saved in your Jewelry Passport. Scan the QR to open it on your phone — continue exploring, save favorites, and purchase securely on Evol Jewels.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// New 8-Step Flow Component (Welcome + 4 Survey Pages + Recommendations + AI Chat + QR)
const NewFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // 0: Welcome, 1: Style, 2: Occasion, 3: Budget, 4: Metal, 5: Recommendations, 6: AI Chat, 7: QR
  const [showAttractMode, setShowAttractMode] = useState(false);
  const [surveyData, setSurveyData] = useState({
    style: "",
    occasion: "",
    budget: "",
    metal: ""
  });
  const [recommendations, setRecommendations] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Show attract mode after 30 seconds of inactivity on welcome screen
  const showAttract = () => {
    if (currentStep === 0) {
      setShowAttractMode(true);
    }
  };

  // Use attract mode on welcome screen, regular reset on other screens  
  useIdleAttract(showAttract, 30000); // 30 seconds to attract mode
  useIdleReset(90000); // 90 seconds to full reset

  const handleStart = () => {
    setCurrentStep(1);
  };

  const handleStyleNext = (style) => {
    setSurveyData(prev => ({ ...prev, style }));
    setCurrentStep(2);
  };

  const handleOccasionNext = (occasion) => {
    setSurveyData(prev => ({ ...prev, occasion }));
    setCurrentStep(3);
  };

  const handleOccasionBack = () => {
    setCurrentStep(1);
  };

  const handleBudgetNext = (budget) => {
    setSurveyData(prev => ({ ...prev, budget }));
    setCurrentStep(4);
  };

  const handleBudgetBack = () => {
    setCurrentStep(2);
  };

  const handleMetalNext = async (metal) => {
    const finalData = { ...surveyData, metal };
    setSurveyData(finalData);
    
    try {
      // Submit complete survey data to backend
      const payload = {
        occasion: finalData.occasion,
        style: finalData.style, 
        budget: finalData.budget,
        vibe_preference: null // Can be enhanced later
      };
      const response = await axios.post(`${API}/survey`, payload);
      setRecommendations(response.data);
      setSessionId(response.data.session_id);
      setCurrentStep(5); // Go to Recommendations next
    } catch (error) {
      console.error('Survey submission failed:', error);
    }
  };

  const handleMetalBack = () => {
    setCurrentStep(3);
  };

  const handleAIChatContinue = () => {
    setCurrentStep(7); // Go to QR
  };

  const handleGetOnPhone = () => {
    setCurrentStep(7); // Go to QR
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setSurveyData({ style: "", occasion: "", budget: "", metal: "" });
    setRecommendations(null);
    setSessionId(null);
    setSelectedProduct(null);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setCurrentStep(6); // Navigate to AI chat with product context
  };

  // General back navigation handler
  const handleGoBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Clear selectedProduct when going back from AI chat
      if (currentStep === 6) {
        setSelectedProduct(null);
      }
    }
  };

  // Specific back handlers for each step
  const handleStyleBack = () => {
    setCurrentStep(0); // Go back to Welcome
  };

  const handleRecommendationBack = () => {
    setCurrentStep(4); // Go back to Metal Type
  };

  const handleAIChatBack = () => {
    if (selectedProduct) {
      setCurrentStep(5); // Go back to Recommendations if coming from View Details
      setSelectedProduct(null);
    } else {
      setCurrentStep(4); // Go back to Metal Type if accessed directly
    }
  };

  const handleQRBack = () => {
    setCurrentStep(6); // Go back to AI Chat
  };

  const handleAttractExit = () => {
    setShowAttractMode(false);
  };

  return (
    <div data-testid="new-flow-container">
      {/* Celebrity Attract Mode Overlay */}
      {showAttractMode && (
        <CelebrityAttractMode onExit={handleAttractExit} />
      )}
      {currentStep === 0 && <WelcomeScreen onStart={handleStart} />}
      {currentStep === 1 && (
        <StylePreferencePage 
          onNext={handleStyleNext}
          onBack={handleStyleBack}
          initialValue={surveyData.style}
        />
      )}
      {currentStep === 2 && (
        <OccasionPage 
          onNext={handleOccasionNext}
          onBack={handleOccasionBack}
          initialValue={surveyData.occasion}
        />
      )}
      {currentStep === 3 && (
        <BudgetRangePage 
          onNext={handleBudgetNext}
          onBack={handleBudgetBack}
          initialValue={surveyData.budget}
        />
      )}
      {currentStep === 4 && (
        <MetalTypePage 
          onNext={handleMetalNext}
          onBack={handleMetalBack}
          initialValue={surveyData.metal}
        />
      )}
      {currentStep === 5 && recommendations && (
        <RecommendationScreen 
          data={recommendations.recommendations?.map(r => r.product) || []}
          onViewDetails={handleViewDetails}
          onGetOnPhone={handleGetOnPhone}
          onBack={handleRecommendationBack}
        />
      )}
      {currentStep === 6 && (
        <AIJewelryStylistPage 
          onContinue={handleAIChatContinue}
          onBack={handleAIChatBack}
          selectedProduct={selectedProduct}
        />
      )}
      {currentStep === 7 && sessionId && (
        <QRCodeScreen 
          sessionId={sessionId}
          onRestart={handleRestart}
          onBack={handleQRBack}
        />
      )}
    </div>
  );
};

// Passport
const Passport = () => {
  useIdleReset();
  const { toggle, has } = useWishlist();
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  useEffect(()=>{
    axios.get(`${API}/passport/${sessionId}`).then(res => setData(res.data)).catch(()=>{});
  }, [sessionId]);
  if (!data) return <div className="section">Loading…</div>;
  return (
    <div className="kiosk-frame section" data-testid="passport-screen">
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
          <Route path="/" element={<NewFlow />} />
          <Route path="/stylist" element={<StylistPage />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/recommendation/:sessionId" element={<Recommendation />} />
          <Route path="/passport/:sessionId" element={<Passport />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
