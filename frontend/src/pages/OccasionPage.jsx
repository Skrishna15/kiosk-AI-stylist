import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";

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
      {/* Back Button */}
      <BackButton onClick={onBack} />
      
      <div className="container mx-auto px-8 py-16 max-w-4xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-300 bg-yellow-50 backdrop-blur-sm mb-4">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
            <span className="text-xs font-medium tracking-[0.2em] text-yellow-700 uppercase">Step 2 of 4</span>
          </div>
          
          <h1 className="text-5xl font-light mb-4" style={{
            fontFamily: "'Playfair Display', serif",
            background: "linear-gradient(135deg, #d4af37 0%, #b8860b 50%, #daa520 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Perfect Occasion
          </h1>
          <p className="text-xl text-gray-600 font-light">
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
                    ? 'border-yellow-400 bg-yellow-50 shadow-lg shadow-yellow-400/20' 
                    : 'border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50'
                  }`}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${occasion.gradient} mb-4 flex items-center justify-center shadow-lg text-2xl border-2 border-yellow-200`}>
                  {occasion.icon}
                </div>
                
                <h3 className="text-2xl font-medium text-gray-800 mb-2">{occasion.name}</h3>
                <p className="text-gray-600 leading-relaxed">{occasion.description}</p>
                
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
            className="px-8 py-3 text-lg font-medium rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300"
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!selected}
            data-testid="occasion-next-button"
            className={`px-10 py-4 text-lg font-medium rounded-full transition-all duration-300 
              ${selected 
                ? 'bg-yellow-400 hover:bg-yellow-500 text-white shadow-lg hover:shadow-xl' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            Continue to Budget
          </Button>
        </motion.div>
      </div>
    </div>
  );
}