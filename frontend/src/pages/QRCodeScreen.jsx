import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Heart, ThumbsUp, Meh, HelpCircle, ThumbsDown } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function QRCodeScreen({ sessionId, onRestart, onBack }){
  const [qr, setQr] = useState("");
  const [feedback, setFeedback] = useState(null);
  const link = useMemo(()=> `${window.location.origin}/passport/${sessionId}`, [sessionId]);
  useEffect(()=>{ if (sessionId) QRCode.toDataURL(link, { margin: 1, width: 240 }).then(setQr); }, [link, sessionId]);

  const [seconds, setSeconds] = useState(30);
  useEffect(()=>{
    const t = setInterval(()=> setSeconds(s=> s>0? s-1:s), 1000);
    return ()=> clearInterval(t);
  },[]);

  return (
    <div className="kiosk-frame container py-10 space-y-6" data-testid="qrcode-screen-page">
      {/* Back Button */}
      {onBack && <BackButton onClick={onBack} />}
      <div>
        <div className="text-sm tracking-widest text-neutral-500">Almost Done!</div>
        <h2 className="card-title text-4xl mt-2">Scan to Save Your Matches</h2>
      </div>

      <div className="max-w-md mx-auto rounded-2xl border border-neutral-200 bg-white/90 shadow-sm p-6 flex flex-col items-center">
        {qr && <img alt="QR" src={qr} className="w-[220px] h-[220px]" data-testid="final-qr" />}
        <div className="text-sm subcopy mt-3 text-center">Open your camera and point to the code. Tap the link that appears.</div>
      </div>

      {/* Feedback UI */}
      <div className="max-w-md mx-auto">
        <div className="text-sm font-medium mb-3 text-center">How helpful were these recommendations?</div>
        <div className="flex items-center justify-center gap-4" data-testid="qr-feedback">
          <button aria-label="Loved it" data-testid="qr-feedback-love" className={`h-10 w-10 rounded-full border flex items-center justify-center ${feedback==='love'?'bg-emerald-100 border-emerald-300':'border-neutral-300 hover:bg-neutral-50'}`} onClick={()=>setFeedback('love')}><Heart size={18} /></button>
          <button aria-label="Great" data-testid="qr-feedback-great" className={`h-10 w-10 rounded-full border flex items-center justify-center ${feedback==='up'?'bg-emerald-100 border-emerald-300':'border-neutral-300 hover:bg-neutral-50'}`} onClick={()=>setFeedback('up')}><ThumbsUp size={18} /></button>
          <button aria-label="Okay" data-testid="qr-feedback-okay" className={`h-10 w-10 rounded-full border flex items-center justify-center ${feedback==='meh'?'bg-emerald-100 border-emerald-300':'border-neutral-300 hover:bg-neutral-50'}`} onClick={()=>setFeedback('meh')}><Meh size={18} /></button>
          <button aria-label="Not sure" data-testid="qr-feedback-unsure" className={`h-10 w-10 rounded-full border flex items-center justify-center ${feedback==='help'?'bg-emerald-100 border-emerald-300':'border-neutral-300 hover:bg-neutral-50'}`} onClick={()=>setFeedback('help')}><HelpCircle size={18} /></button>
          <button aria-label="Didn't help" data-testid="qr-feedback-down" className={`h-10 w-10 rounded-full border flex items-center justify-center ${feedback==='down'?'bg-emerald-100 border-emerald-300':'border-neutral-300 hover:bg-neutral-50'}`} onClick={()=>setFeedback('down')}><ThumbsDown size={18} /></button>
        </div>
      </div>

      <div className="text-center text-sm subcopy">This screen will restart in {seconds}s</div>

      <div className="flex justify-center">
        <Button className="button-pill" data-testid="restart-now-button" onClick={onRestart}>Start Over Now</Button>
      </div>

      <div className="text-center text-xs text-neutral-500">Powered by Evol Jewel</div>
    </div>
  );
}
