import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function MetalTypePage({ onNext, onBack, initialValue }) {
  const [selected, setSelected] = useState(initialValue || "");

  const metals = [
    {
      name: "Gold",
      description: "Classic warmth with timeless appeal",
      color: "#FFD700",
      characteristics: "Luxurious • Durable • Investment Value",
      gradient: "from-yellow-200 to-amber-300"
    },
    {
      name: "Silver",
      description: "Cool elegance with versatile styling", 
      color: "#C0C0C0",
      characteristics: "Versatile • Affordable • Modern",
      gradient: "from-gray-200 to-slate-300"
    },
    {
      name: "Platinum",
      description: "Premium metal with sophisticated finish",
      color: "#E5E4E2", 
      characteristics: "Rare • Hypoallergenic • Prestigious",
      gradient: "from-gray-100 to-neutral-200"
    },
    {
      name: "Rose Gold",
      description: "Romantic blush with contemporary charm",
      color: "#E8B4A0",
      characteristics: "Trendy • Romantic • Unique",
      gradient: "from-rose-200 to-pink-300"
    }
  ];

  const handleNext = () => {
    if (selected) {
      onNext(selected);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" data-testid="metal-type-page">
      <div className="container mx-auto px-8 py-16 max-w-4xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-600/30 bg-neutral-800/50 backdrop-blur-sm mb-4">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
            <span className="text-xs font-medium tracking-[0.2em] text-neutral-300 uppercase">Step 4 of 4</span>
          </div>
          
          <h1 className="text-5xl font-light text-white mb-4" style={{fontFamily: "'Playfair Display', serif"}}>
            Preferred Metal Type
          </h1>
          <p className="text-xl text-neutral-300 font-light">
            Which metal best complements your style?
          </p>
        </motion.div>

        {/* Metal Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {metals.map((metal, index) => (
            <motion.div
              key={metal.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <button
                onClick={() => setSelected(metal.name)}
                data-testid={`metal-${metal.name.toLowerCase().replace(' ', '-')}`}
                className={`w-full p-8 rounded-2xl border-2 transition-all duration-300 text-left group
                  ${selected === metal.name 
                    ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20' 
                    : 'border-neutral-600/30 bg-neutral-800/50 hover:border-neutral-500 hover:bg-neutral-700/50'
                  }`}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${metal.gradient} mb-4 flex items-center justify-center shadow-lg border-2`}
                     style={{ borderColor: metal.color }}>
                  <div 
                    className="w-8 h-8 rounded-full shadow-inner"
                    style={{ backgroundColor: metal.color }}
                  ></div>
                </div>
                
                <h3 className="text-2xl font-medium text-white mb-2">{metal.name}</h3>
                <p className="text-neutral-400 leading-relaxed mb-3">{metal.description}</p>
                <p className="text-sm text-neutral-500 font-light">{metal.characteristics}</p>
                
                {selected === metal.name && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </motion.div>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Navigation */}
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Button
            onClick={onBack}
            data-testid="metal-back-button"
            className="px-8 py-3 text-lg font-medium rounded-full bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600"
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!selected}
            data-testid="metal-next-button"
            className={`px-10 py-4 text-lg font-medium rounded-full transition-all duration-300 
              ${selected 
                ? 'bg-yellow-400 hover:bg-yellow-500 text-black shadow-lg hover:shadow-xl' 
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
              }`}
          >
            See My Recommendations
          </Button>
        </motion.div>
      </div>
    </div>
  );
}