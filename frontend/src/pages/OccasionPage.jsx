import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function OccasionPage({ onNext, onBack, initialValue }) {
  const [selected, setSelected] = useState(initialValue || "");

  const occasions = [
    {
      name: "Everyday",
      description: "Daily wear pieces for your regular activities",
      icon: "☀️",
      gradient: "from-blue-100 to-cyan-200"
    },
    {
      name: "Special Events",
      description: "Celebrations, parties, and memorable moments",
      icon: "✨",
      gradient: "from-purple-100 to-violet-200"
    },
    {
      name: "Work",
      description: "Professional settings and business meetings",
      icon: "💼",
      gradient: "from-gray-100 to-slate-200"
    },
    {
      name: "Romantic",
      description: "Date nights, anniversaries, and intimate occasions",
      icon: "💕",
      gradient: "from-red-100 to-pink-200"
    }
  ];

  const handleNext = () => {
    if (selected) {
      onNext(selected);
    }
  };

  return (
    <div className="min-h-screen bg-white" data-testid="occasion-page">
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
            <span className="text-xs font-medium tracking-[0.2em] text-neutral-300 uppercase">Step 2 of 4</span>
          </div>
          
          <h1 className="text-5xl font-light text-white mb-4" style={{fontFamily: "'Playfair Display', serif"}}>
            Perfect Occasion
          </h1>
          <p className="text-xl text-neutral-300 font-light">
            When will you be wearing your jewelry?
          </p>
        </motion.div>

        {/* Occasion Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {occasions.map((occasion, index) => (
            <motion.div
              key={occasion.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <button
                onClick={() => setSelected(occasion.name)}
                data-testid={`occasion-${occasion.name.toLowerCase().replace(' ', '-')}`}
                className={`w-full p-8 rounded-2xl border-2 transition-all duration-300 text-left group
                  ${selected === occasion.name 
                    ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20' 
                    : 'border-neutral-600/30 bg-neutral-800/50 hover:border-neutral-500 hover:bg-neutral-700/50'
                  }`}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${occasion.gradient} mb-4 flex items-center justify-center shadow-lg text-2xl`}>
                  {occasion.icon}
                </div>
                
                <h3 className="text-2xl font-medium text-white mb-2">{occasion.name}</h3>
                <p className="text-neutral-400 leading-relaxed">{occasion.description}</p>
                
                {selected === occasion.name && (
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
            data-testid="occasion-back-button"
            className="px-8 py-3 text-lg font-medium rounded-full bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600"
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!selected}
            data-testid="occasion-next-button"
            className={`px-10 py-4 text-lg font-medium rounded-full transition-all duration-300 
              ${selected 
                ? 'bg-yellow-400 hover:bg-yellow-500 text-black shadow-lg hover:shadow-xl' 
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
              }`}
          >
            Continue to Budget
          </Button>
        </motion.div>
      </div>
    </div>
  );
}