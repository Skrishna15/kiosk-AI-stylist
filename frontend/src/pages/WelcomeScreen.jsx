import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function WelcomeScreen({ onStart }){
  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"}} data-testid="welcome-screen-page">
      {/* Background animated blurs */}
      <motion.div className="absolute -top-20 -right-10 w-80 h-80 rounded-full" style={{background:"rgba(200,169,126,0.18)"}} animate={{ y: [0, 10, -10, 0]}} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute -bottom-24 -left-8 w-96 h-96 rounded-full" style={{background:"rgba(31,62,55,0.12)"}} animate={{ y: [0, -12, 12, 0]}} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />

      {/* Main content centered vertically */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm tracking-widest text-neutral-500 mb-2">Welcome to</p>
          <h1 className="text-7xl md:text-8xl font-serif font-light text-neutral-900 mb-8">Evol Jewel</h1>
          <p className="text-2xl text-neutral-700 mb-4">Discover your perfect piece</p>
          <p className="text-lg text-neutral-600 mb-12 max-w-md mx-auto">Let us help you find jewelry that matches your unique style.</p>
          
          <div className="mb-8">
            <Button 
              data-testid="start-journey-button" 
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 text-lg rounded-full font-medium transition-colors"
              onClick={onStart}
            >
              Start Your Journey
            </Button>
          </div>
          
          <p className="text-sm text-neutral-400">Touch to begin</p>
        </div>

        {/* Hero image positioned appropriately for portrait layout */}
        <div className="absolute top-16 right-8 w-80 h-96 rounded-2xl overflow-hidden shadow-xl border border-neutral-200/50 opacity-90">
          <img 
            alt="Luxury jewelry" 
            src="https://images.unsplash.com/photo-1616837874254-8d5aaa63e273?crop=entropy&cs=srgb&fm=jpg&q=85" 
            className="w-full h-full object-cover" 
          />
        </div>
      </div>
    </div>
  );
}
