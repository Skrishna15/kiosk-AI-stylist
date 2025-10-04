import { useEffect, useMemo, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import QRCode from "qrcode";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

const Welcome = () => {
  const navigate = useNavigate();
  useEffect(() => {
    axios.get(`${API}/health`).catch(() => {});
  }, []);
  return (
    <div className="kiosk-container ej-gradient-accent" data-testid="welcome-screen">
      <section className="hero section">
        <div className="container grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="hero-title text-5xl md:text-6xl leading-tight" data-testid="welcome-title">
              Meet Your Celebrity Stylist
            </h1>
            <p className="subcopy mt-4 text-lg" data-testid="welcome-subcopy">
              Personalized jewelry picks inspired by red carpet vibes. In under 60 seconds.
            </p>
            <div className="mt-8 flex gap-3">
              <Button data-testid="start-survey-button" className="button-pill" onClick={() => navigate("/survey")}>Start</Button>
              <a className="link-underline self-center text-sm" href="#learn" data-testid="learn-more-link">Learn more</a>
            </div>
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

const Survey = () => {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section" data-testid="survey-screen">
      <div className="container max-w-2xl">
        <Card>
          <CardHeader>
            <h2 className="card-title text-3xl">Quick Style Survey</h2>
            <p className="subcopy mt-1">Answer 3 questions to get your vibe and picks.</p>
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
                <SelectOption>Under $100</SelectOption>
                <SelectOption>$100–$300</SelectOption>
                <SelectOption>$300–$800</SelectOption>
                <SelectOption>$800+</SelectOption>
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
    </div>
  );
};

const Recommendation = () => {
  const params = useParams();
  const [data, setData] = useState(null);
  const [qr, setQr] = useState("");
  const sessionId = params.sessionId;

  const passportLink = useMemo(()=> `${window.location.origin}/passport/${sessionId}`, [sessionId]);

  useEffect(()=>{
    const stateData = window.history.state && window.history.state.usr;
    if (stateData) setData(stateData);
    else if (sessionId){
      axios.get(`${API}/passport/${sessionId}`).then(res => {
        const r = res.data;
        setData({
          session_id: r.session_id,
          vibe: r.vibe,
          explanation: r.explanation,
          moodboard_image: VIBE_IMAGES[r.vibe] || VIBE_IMAGES["Everyday Chic"],
          recommendations: r.recommendations,
          created_at: r.created_at,
        });
      });
    }
  }, [sessionId]);

  useEffect(()=>{
    if (!sessionId) return;
    QRCode.toDataURL(passportLink, { margin: 1, width: 220 }).then(setQr).catch(()=>{});
  }, [passportLink, sessionId]);

  if (!data) return <div className="section">Loading…</div>;

  return (
    <div className="section" data-testid="recommendation-screen">
      <div className="container max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="order-2 md:order-1">
            <h2 className="card-title text-4xl" data-testid="vibe-title">Your Style Match: {data.vibe}</h2>
            <p className="subcopy mt-2" data-testid="vibe-explanation">{data.explanation}</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data.recommendations?.map((rec, idx) => (
                <Card key={rec.product.id} data-testid={`product-card-${idx}`}>
                  <img alt={rec.product.name} src={rec.product.image_url} className="w-full h-44 object-cover rounded-t-xl" />
                  <CardContent>
                    <div className="font-semibold">{rec.product.name}</div>
                    <div className="text-sm subcopy">${rec.product.price.toFixed(2)}</div>
                    <div className="text-xs mt-2 text-neutral-600">{rec.reason}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-neutral-200">
              <img alt={data.vibe} src={data.moodboard_image} className="w-full h-[520px] object-cover" data-testid="vibe-moodboard-image" />
            </div>
            <div className="mt-6 flex items-center gap-4">
              {qr && <img src={qr} alt="QR" className="w-[160px] h-[160px] border border-neutral-300 rounded-lg" data-testid="passport-qr"/>}
              <div>
                <div className="text-sm font-medium">Take it with you</div>
                <div className="text-xs subcopy break-all" data-testid="passport-link">{passportLink}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Passport = () => {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  useEffect(()=>{
    axios.get(`${API}/passport/${sessionId}`).then(res => setData(res.data)).catch(()=>{});
  }, [sessionId]);
  if (!data) return <div className="section">Loading…</div>;
  return (
    <div className="section" data-testid="passport-screen">
      <div className="container max-w-3xl">
        <h2 className="card-title text-3xl">Jewelry Passport</h2>
        <p className="subcopy">Session: {data.session_id}</p>
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
                    <div className="font-semibold">{rec.product.name}</div>
                    <div className="text-sm subcopy">${rec.product.price.toFixed(2)}</div>
                  </CardContent>
                </Card>
              ))}
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
          <Route path="/survey" element={<Survey />} />
          <Route path="/recommendation/:sessionId" element={<Recommendation />} />
          <Route path="/passport/:sessionId" element={<Passport />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
