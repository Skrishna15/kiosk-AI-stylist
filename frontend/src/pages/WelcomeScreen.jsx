import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function WelcomeScreen({ onStart }){
  return (
    <div className="kiosk-frame relative overflow-hidden ej-gradient-accent" data-testid="welcome-screen-page">
      {/* Background animated blurs */}
      <motion.div className="absolute -top-20 -right-10 w-80 h-80 rounded-full" style={{background:"rgba(200,169,126,0.18)"}} animate={{ y: [0, 10, -10, 0]}} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute -bottom-24 -left-8 w-96 h-96 rounded-full" style={{background:"rgba(31,62,55,0.12)"}} animate={{ y: [0, -12, 12, 0]}} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />

      <div className="container grid md:grid-cols-2 gap-10 items-center py-16">
        <div>
          <p className="text-sm tracking-widest text-neutral-500">Welcome to</p>
          <h1 className="hero-title text-6xl mt-2">Evol Jewel</h1>
          <p className="text-xl mt-6">Discover your perfect piece</p>
          <p className="subcopy mt-2">Let us help you find jewelry that matches your unique style.</p>
          <div className="mt-10">
            <Button data-testid="start-journey-button" className="button-pill" onClick={onStart}>Start Your Journey</Button>
          </div>
          <div className="mt-6 text-xs text-neutral-500">Touch to begin</div>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-xl border border-neutral-200">
          <img alt="Luxury jewelry" src="https://images.unsplash.com/photo-1616837874254-8d5aaa63e273?crop=entropy&cs=srgb&fm=jpg&q=85" className="w-full h-[640px] object-cover" />
        </div>
      </div>
    </div>
  );
}
