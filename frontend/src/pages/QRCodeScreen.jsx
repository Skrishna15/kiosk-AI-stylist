import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

export default function QRCodeScreen({ sessionId, onRestart }){
  const [qr, setQr] = useState("");
  const link = useMemo(()=> `${window.location.origin}/passport/${sessionId}`, [sessionId]);
  useEffect(()=>{ if (sessionId) QRCode.toDataURL(link, { margin: 1, width: 240 }).then(setQr); }, [link, sessionId]);

  const [seconds, setSeconds] = useState(30);
  useEffect(()=>{
    const t = setInterval(()=> setSeconds(s=> s>0? s-1:s), 1000);
    return ()=> clearInterval(t);
  },[]);

  return (
    <div className="kiosk-frame container py-10 space-y-6" data-testid="qrcode-screen-page">
      <div>
        <div className="text-sm tracking-widest text-neutral-500">Almost Done!</div>
        <h2 className="card-title text-4xl mt-2">Scan to Save Your Matches</h2>
      </div>

      <div className="max-w-md mx-auto rounded-2xl border border-neutral-200 bg-white/90 shadow-sm p-6 flex flex-col items-center">
        {qr && <img alt="QR" src={qr} className="w-[220px] h-[220px]" data-testid="final-qr" />}
        <div className="text-sm subcopy mt-3 text-center">Open your camera and point to the code. Tap the link that appears.</div>
      </div>

      <div className="text-center text-sm subcopy">This screen will restart in {seconds}s</div>

      <div className="flex justify-center">
        <Button className="button-pill" data-testid="restart-now-button" onClick={onRestart}>Start Over Now</Button>
      </div>

      <div className="text-center text-xs text-neutral-500">Powered by Evol Jewel</div>
    </div>
  );
}
