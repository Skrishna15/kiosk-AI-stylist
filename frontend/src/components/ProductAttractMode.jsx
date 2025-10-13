import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ProductAttractMode = ({ products, onExit }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-advance slideshow every 4 seconds
  useEffect(() => {
    if (!products || products.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % products.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [products]);

  const handleExit = () => {
    setIsVisible(false);
    setTimeout(onExit, 300); // Allow fade out animation
  };

  if (!isVisible || !products || products.length === 0) return null;

  const currentProduct = products[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-black via-gray-900 to-black cursor-pointer"
      onClick={handleExit}
      data-testid="product-attract-mode"
    >
      {/* Ambient background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="w-full h-full bg-gradient-to-br from-yellow-400/20 via-transparent to-yellow-600/20"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 70%, rgba(212, 175, 55, 0.4) 0%, transparent 50%),
                             radial-gradient(circle at 70% 30%, rgba(212, 175, 55, 0.3) 0%, transparent 50%)`
          }}
        />
      </div>

      {/* Main slideshow content */}
      <div className="relative z-10 flex items-center justify-center h-full p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: -15 }}
            transition={{ 
              duration: 1.2,
              ease: "easeInOut"
            }}
            className="max-w-7xl w-full grid md:grid-cols-2 gap-16 items-center"
          >
            {/* Product Image */}
            <div className="relative">
              <motion.div 
                className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-yellow-400/40"
                animate={{ 
                  boxShadow: [
                    "0 25px 50px -12px rgba(212, 175, 55, 0.3)",
                    "0 25px 60px -12px rgba(212, 175, 55, 0.5)",
                    "0 25px 50px -12px rgba(212, 175, 55, 0.3)"
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <img 
                  src={currentProduct.image_url}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Image overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {/* Price badge */}
                <div className="absolute top-6 right-6">
                  <div className="px-6 py-3 bg-yellow-400 text-black rounded-full text-lg font-bold">
                    ₹{Math.round(currentProduct.price * 83).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Floating sparkles */}
                <motion.div
                  className="absolute top-1/4 left-1/4 text-yellow-400 text-2xl"
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute top-1/3 right-1/4 text-yellow-400 text-xl"
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 0.8, 0.3],
                    rotate: [0, -180, -360]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                >
                  💎
                </motion.div>
                <motion.div
                  className="absolute bottom-1/3 left-1/3 text-yellow-400 text-lg"
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.4, 0.9, 0.4],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 3.5, repeat: Infinity, delay: 2 }}
                >
                  ⭐
                </motion.div>
              </motion.div>
            </div>

            {/* Product Info */}
            <div className="text-white space-y-8">
              {/* Product name */}
              <motion.h1 
                className="text-7xl font-light text-yellow-400 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 1 }}
              >
                {currentProduct.name}
              </motion.h1>

              {/* Description */}
              <motion.p 
                className="text-2xl text-gray-300 leading-relaxed"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                {currentProduct.description || 'Exquisite craftsmanship meets timeless elegance'}
              </motion.p>

              {/* Features */}
              <motion.div
                className="bg-black/40 rounded-2xl p-8 border border-yellow-400/30"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 1 }}
              >
                <h3 className="text-yellow-400 font-semibold mb-4 text-xl">Why You'll Love This</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-300">
                    <span className="text-yellow-400">✨</span>
                    <span>Premium craftsmanship with attention to detail</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <span className="text-yellow-400">💎</span>
                    <span>Perfect for both special occasions and everyday elegance</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <span className="text-yellow-400">🎯</span>
                    <span>Matches your personal style preferences</span>
                  </div>
                </div>
              </motion.div>

              {/* Style tags */}
              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 1 }}
              >
                {currentProduct.style_tags?.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-6 py-3 bg-yellow-400/20 text-yellow-200 rounded-full text-lg border border-yellow-400/40"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Call to action overlay */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 p-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <div className="text-center">
          <motion.h2 
            className="text-5xl font-light text-yellow-400 mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
            animate={{ 
              textShadow: [
                "0 0 20px rgba(212, 175, 55, 0.5)",
                "0 0 40px rgba(212, 175, 55, 0.8)", 
                "0 0 20px rgba(212, 175, 55, 0.5)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ✨ Your Perfect Jewelry Awaits ✨
          </motion.h2>
          <p className="text-2xl text-gray-300 mb-4">
            Touch to explore your personalized recommendations
          </p>
          <p className="text-lg text-gray-400">
            Or chat with our AI stylist for expert advice
          </p>
        </div>
      </motion.div>

      {/* Slide indicators */}
      <div className="absolute bottom-12 right-12 flex space-x-3">
        {products.map((_, index) => (
          <motion.div
            key={index}
            className={`w-4 h-4 rounded-full transition-all duration-500 ${
              index === currentSlide 
                ? 'bg-yellow-400 scale-125' 
                : 'bg-yellow-400/40'
            }`}
            animate={index === currentSlide ? {
              boxShadow: ["0 0 0 0 rgba(212, 175, 55, 0.7)", "0 0 20px 10px rgba(212, 175, 55, 0)"]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Evol Jewel branding */}
      <div className="absolute top-12 left-12">
        <h3 className="text-3xl font-light text-yellow-400" style={{ fontFamily: "'Playfair Display', serif" }}>
          Evol Jewel
        </h3>
        <p className="text-lg text-gray-400">Curated Just for You</p>
      </div>
    </motion.div>
  );
};

export default ProductAttractMode;