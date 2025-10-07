import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Celebrity moodboard data with high-quality jewelry inspiration
const CELEBRITY_MOODBOARDS = [
  {
    celebrity: "Emma Stone",
    image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&h=1600",
    style: "Editorial Chic",
    description: "Emma's minimalist diamond elegance at premieres",
    quote: "Jewelry that feels effortless but makes a statement",
    products: ["Diamond Studs", "Delicate Necklaces"],
    vibe: "Sophisticated simplicity meets red carpet glamour"
  },
  {
    celebrity: "Blake Lively",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&h=1600",
    style: "Hollywood Glam",
    description: "Blake's vintage-inspired luxury at fashion events", 
    quote: "The right jewelry transforms any outfit into magic",
    products: ["Statement Necklaces", "Vintage Rings"],
    vibe: "Old Hollywood glamour with modern sophistication"
  },
  {
    celebrity: "Margot Robbie",
    image: "https://images.unsplash.com/photo-1606623546924-a4f3ae5ea3e8?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&h=1600",
    style: "Hollywood Glam",
    description: "Margot's Chanel diamonds and luxury classics",
    quote: "Invest in jewelry pieces that will be treasured forever", 
    products: ["Tennis Bracelets", "Classic Rings"],
    vibe: "Timeless luxury with contemporary confidence"
  },
  {
    celebrity: "Zendaya",
    image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&h=1600",
    style: "Editorial Chic", 
    description: "Zendaya's bold contemporary jewelry at galas",
    quote: "Fashion and jewelry should express who you are",
    products: ["Modern Chains", "Statement Rings"],
    vibe: "Contemporary edge meets fearless self-expression"
  },
  {
    celebrity: "Cate Blanchett",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&h=1600",
    style: "Editorial Chic",
    description: "Cate's architectural jewelry at film festivals",
    quote: "I gravitate toward jewelry that feels like wearable art",
    products: ["Architectural Pieces", "Avant-garde Designs"],
    vibe: "Artistic sophistication meets fearless creativity"
  }
];

const CelebrityAttractMode = ({ onExit }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % CELEBRITY_MOODBOARDS.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleExit = () => {
    setIsVisible(false);
    setTimeout(onExit, 300); // Allow fade out animation
  };

  if (!isVisible) return null;

  const currentMoodboard = CELEBRITY_MOODBOARDS[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-black cursor-pointer"
      onClick={handleExit}
      data-testid="celebrity-attract-mode"
    >
      {/* Ambient background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full bg-gradient-to-br from-yellow-400/20 via-transparent to-yellow-600/20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(212, 175, 55, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.2) 0%, transparent 50%)`
          }}
        />
      </div>

      {/* Main slideshow content */}
      <div className="relative z-10 flex items-center justify-center h-full p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ 
              duration: 1,
              ease: "easeInOut"
            }}
            className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center"
          >
            {/* Celebrity Image */}
            <div className="relative">
              <motion.div 
                className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-yellow-400/30"
                animate={{ 
                  boxShadow: [
                    "0 25px 50px -12px rgba(212, 175, 55, 0.25)",
                    "0 25px 50px -12px rgba(212, 175, 55, 0.4)",
                    "0 25px 50px -12px rgba(212, 175, 55, 0.25)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <img 
                  src={currentMoodboard.image}
                  alt={`${currentMoodboard.celebrity} jewelry inspiration`}
                  className="w-full h-full object-cover"
                />
                
                {/* Image overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Style badge */}
                <div className="absolute top-6 right-6">
                  <div className="px-4 py-2 bg-yellow-400 text-black rounded-full text-sm font-bold tracking-wider">
                    {currentMoodboard.style}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Celebrity Info */}
            <div className="text-white space-y-6">
              {/* Celebrity name */}
              <motion.h1 
                className="text-6xl font-light text-yellow-400 mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                {currentMoodboard.celebrity}
              </motion.h1>

              {/* Description */}
              <motion.p 
                className="text-2xl text-gray-300 leading-relaxed"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {currentMoodboard.description}
              </motion.p>

              {/* Celebrity quote */}
              <motion.div
                className="border-l-4 border-yellow-400 pl-6 py-4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <p className="text-lg italic text-yellow-200 mb-2">
                  "{currentMoodboard.quote}"
                </p>
                <p className="text-sm text-gray-400">— {currentMoodboard.celebrity}</p>
              </motion.div>

              {/* Style vibe */}
              <motion.div
                className="bg-black/40 rounded-2xl p-6 border border-yellow-400/30"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.8 }}
              >
                <h3 className="text-yellow-400 font-semibold mb-2">Style Vibe</h3>
                <p className="text-gray-300">{currentMoodboard.vibe}</p>
              </motion.div>

              {/* Matching products */}
              <motion.div
                className="flex flex-wrap gap-3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.8 }}
              >
                {currentMoodboard.products.map((product, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-yellow-400/20 text-yellow-200 rounded-full text-sm border border-yellow-400/40"
                  >
                    {product}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Call to action overlay */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <div className="text-center">
          <motion.h2 
            className="text-4xl font-light text-yellow-400 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
            animate={{ 
              textShadow: [
                "0 0 20px rgba(212, 175, 55, 0.5)",
                "0 0 30px rgba(212, 175, 55, 0.7)", 
                "0 0 20px rgba(212, 175, 55, 0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨ Discover Your Celebrity Style ✨
          </motion.h2>
          <p className="text-xl text-gray-300">
            Touch anywhere to find jewelry that matches your vibe
          </p>
        </div>
      </motion.div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 right-8 flex space-x-2">
        {CELEBRITY_MOODBOARDS.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-yellow-400 scale-125' 
                : 'bg-yellow-400/40'
            }`}
          />
        ))}
      </div>

      {/* Evol Jewel branding */}
      <div className="absolute top-8 left-8">
        <h3 className="text-2xl font-light text-yellow-400" style={{ fontFamily: "'Playfair Display', serif" }}>
          Evol Jewel
        </h3>
        <p className="text-sm text-gray-400">Luxury Jewelry Experience</p>
      </div>
    </motion.div>
  );
};

export default CelebrityAttractMode;