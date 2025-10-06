import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function WelcomeScreen({ onStart }){
  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden" 
      style={{background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%, #0a0a0a 100%)"}} 
      data-testid="welcome-screen-page"
    >
      {/* Luxury background elements */}
      <motion.div 
        className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-10"
        style={{background: "radial-gradient(circle, #d4af37 0%, transparent 70%)"}}
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.15, 0.1]
        }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
      />
      
      <motion.div 
        className="absolute bottom-32 right-16 w-72 h-72 rounded-full opacity-8"
        style={{background: "radial-gradient(circle, #c0c0c0 0%, transparent 60%)"}}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.08, 0.12, 0.08]
        }} 
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} 
      />

      {/* Premium jewelry showcase */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-16 right-12 w-96 h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-neutral-700/30">
          <div className="relative h-full">
            <img 
              alt="Luxury pearl necklace" 
              src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBqZXdlbHJ5fGVufDB8fHx8MTc1OTc1NzU1Mnww&ixlib=rb-4.1.0&q=85" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>
        </div>
        
        {/* Secondary jewelry accent */}
        <div className="absolute bottom-20 left-8 w-72 h-72 rounded-2xl overflow-hidden shadow-xl border border-neutral-600/20 opacity-75">
          <img 
            alt="Blue gemstone ring" 
            src="https://images.unsplash.com/photo-1606623546924-a4f3ae5ea3e8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBqZXdlbHJ5fGVufDB8fHx8MTc1OTc1NzU1Mnww&ixlib=rb-4.1.0&q=85" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30"></div>
        </div>
      </div>

      {/* Main luxury content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-center">
        <div className="max-w-2xl mx-auto">
          {/* Premium brand introduction */}
          <motion.div 
            className="mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-600/30 bg-neutral-900/20 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              <span className="text-xs font-medium tracking-[0.2em] text-neutral-300 uppercase">Welcome to</span>
            </div>
          </motion.div>
          
          {/* Brand name with luxury typography */}
          <motion.h1 
            className="text-8xl md:text-9xl font-light text-white mb-6 tracking-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #d4af37 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.8 }}
          >
            Evol Jewel
          </motion.h1>
          
          {/* Luxury tagline */}
          <motion.p 
            className="text-2xl text-neutral-200 mb-4 font-light tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            Discover your perfect piece
          </motion.p>
          
          <motion.p 
            className="text-lg text-neutral-400 mb-12 max-w-lg mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4 }}
          >
            Experience curated luxury jewelry that reflects your unique sophistication and style.
          </motion.p>
          
          {/* Premium CTA button */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.6 }}
          >
            <button 
              data-testid="start-journey-button"
              onClick={onStart}
              className="group relative px-10 py-4 bg-gradient-to-r from-neutral-800 via-neutral-900 to-black text-white font-medium tracking-wide border border-neutral-600/30 rounded-full hover:shadow-2xl hover:shadow-yellow-400/20 transition-all duration-500 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3 text-lg">
                Start Your Journey
                <motion.div
                  className="w-1 h-1 rounded-full bg-yellow-400"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </motion.div>
          
          {/* Refined instruction */}
          <motion.p 
            className="text-sm text-neutral-500 font-light tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
          >
            Touch to begin your experience
          </motion.p>
        </div>
      </div>

      {/* Luxury brand watermark */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-neutral-700/20">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
          <span className="text-xs text-neutral-400 tracking-widest font-light">LUXURY JEWELRY EXPERIENCE</span>
        </div>
      </div>
    </div>
  );
}
