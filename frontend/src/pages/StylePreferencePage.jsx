import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";

export default function StylePreferencePage({ onNext, onBack, initialValue }) {
  const [selected, setSelected] = useState(initialValue || "");

  const styles = [
    {
      name: "Classic",
      description: "Timeless elegance with traditional designs",
      gradient: "from-amber-100 to-yellow-200"
    },
    {
      name: "Modern", 
      description: "Contemporary and sleek minimalist pieces",
      gradient: "from-slate-100 to-gray-200"
    },
    {
      name: "Vintage",
      description: "Romantic heritage with nostalgic charm",
      gradient: "from-rose-100 to-pink-200"
    },
    {
      name: "Bohemian",
      description: "Free-spirited with artistic flair",
      gradient: "from-emerald-100 to-teal-200"
    }
  ];

  const handleNext = () => {
    if (selected) {
      onNext(selected);
    }
  };

  return (
    <div className="min-h-screen bg-white" data-testid="style-preference-page">
      {/* Back Button */}
      {/* {onBack && <BackButton onClick={onBack} />} */}
      
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
            <span className="text-xs font-medium tracking-[0.2em] text-yellow-700 uppercase">Step 1 of 4</span>
          </div>
          
          <h1 className="text-5xl font-light mb-4" style={{
            fontFamily: "'Playfair Display', serif",
            background: "linear-gradient(135deg, #d4af37 0%, #b8860b 50%, #daa520 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Your Style Preference
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Choose the style that speaks to your personality
          </p>
        </motion.div>

        {/* Style Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {styles.map((style, index) => (
            <motion.div
              key={style.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <button
                onClick={() => setSelected(style.name)}
                data-testid={`style-${style.name.toLowerCase()}`}
                className={`w-full p-8 rounded-2xl border-2 transition-all duration-300 text-left group
                  ${selected === style.name 
                    ? 'border-yellow-400 bg-yellow-50 shadow-lg shadow-yellow-400/20' 
                    : 'border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50'
                  }`}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${style.gradient} mb-4 flex items-center justify-center shadow-lg`}>
                  <div className="w-8 h-8 rounded-full bg-white/80"></div>
                </div>
                
                <h3 className="text-2xl font-medium text-gray-800 mb-2">{style.name}</h3>
                <p className="text-gray-600 leading-relaxed">{style.description}</p>
                
                {selected === style.name && (
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
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Button
            onClick={handleNext}
            disabled={!selected}
            data-testid="style-next-button"
            className={`px-10 py-4 text-lg font-medium rounded-full transition-all duration-300 
              ${selected 
                ? 'bg-yellow-400 hover:bg-yellow-500 text-white shadow-lg hover:shadow-xl' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            Continue to Occasion
          </Button>
        </motion.div>
      </div>
    </div>
  );
}