import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function WelcomeScreen({ onStart }){
  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden bg-white" 
      data-testid="welcome-screen-page"
    >
      {/* Elegant background elements */}
      <motion.div 
        className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-15"
        style={{background: "radial-gradient(circle, #d4af37 0%, transparent 70%)"}}
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15]
        }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
      />
      
      <motion.div 
        className="absolute bottom-32 right-16 w-72 h-72 rounded-full opacity-10"
        style={{background: "radial-gradient(circle, #d4af37 0%, transparent 60%)"}}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.10, 0.20, 0.10]
        }} 
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} 
      />

      {/* Jewelry showcase images removed for cleaner design */}

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-400/30 bg-yellow-50/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              <span className="text-xs font-medium tracking-[0.2em] text-yellow-700 uppercase">Welcome to</span>
            </div>
          </motion.div>
          
          {/* Brand name with luxury typography */}
          <motion.h1 
            className="text-8xl md:text-9xl font-light mb-6 tracking-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: "linear-gradient(135deg, #d4af37 0%, #b8860b 50%, #daa520 100%)",
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
            className="text-2xl text-gray-700 mb-4 font-light tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            Discover your perfect piece
          </motion.p>
          
          <motion.p 
            className="text-xl text-gray-800 mb-12 max-w-lg mx-auto font-medium leading-relaxed"
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
              className="group relative px-10 py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white font-medium tracking-wide border border-yellow-300 rounded-full hover:shadow-2xl hover:shadow-yellow-400/30 transition-all duration-500 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3 text-lg font-semibold">
                Start Your Journey
                <motion.div
                  className="w-1 h-1 rounded-full bg-white"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </motion.div>
          
          {/* Refined instruction */}
          <motion.p 
            className="text-base text-gray-700 font-medium tracking-wide"
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
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-50/80 backdrop-blur-sm border border-yellow-200">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
          <span className="text-xs text-yellow-700 tracking-widest font-medium">LUXURY JEWELRY EXPERIENCE</span>
        </div>
      </div>
    </div>
  );
}
