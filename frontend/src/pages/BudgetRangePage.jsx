import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function BudgetRangePage({ onNext, onBack, initialValue }) {
  const [selected, setSelected] = useState(initialValue || "");

  const budgets = [
    {
      name: "Under ₹8,000",
      description: "Perfect starter pieces and everyday essentials",
      range: "Entry Level",
      gradient: "from-green-100 to-emerald-200",
      popular: false
    },
    {
      name: "₹8,000–₹25,000", 
      description: "Quality pieces for regular wear and gifting",
      range: "Popular Choice",
      gradient: "from-blue-100 to-indigo-200",
      popular: true
    },
    {
      name: "₹25,000–₹65,000",
      description: "Premium jewelry for special occasions",
      range: "Premium",
      gradient: "from-purple-100 to-violet-200",
      popular: false
    },
    {
      name: "₹65,000+",
      description: "Luxury pieces and investment jewelry",
      range: "Luxury",
      gradient: "from-amber-100 to-yellow-200",
      popular: false
    }
  ];

  const handleNext = () => {
    if (selected) {
      onNext(selected);
    }
  };

  return (
    <div className="min-h-screen bg-white" data-testid="budget-range-page">
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
            <span className="text-xs font-medium tracking-[0.2em] text-yellow-700 uppercase">Step 3 of 4</span>
          </div>
          
          <h1 className="text-5xl font-light mb-4" style={{
            fontFamily: "'Playfair Display', serif",
            background: "linear-gradient(135deg, #d4af37 0%, #b8860b 50%, #daa520 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Your Budget Range
          </h1>
          <p className="text-xl text-gray-600 font-light">
            What investment level are you comfortable with?
          </p>
        </motion.div>

        {/* Budget Options */}
        <div className="space-y-4 mb-12">
          {budgets.map((budget, index) => (
            <motion.div
              key={budget.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <button
                onClick={() => setSelected(budget.name)}
                data-testid={`budget-${budget.name.toLowerCase().replace(/[^\w]/g, '-')}`}
                className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group flex items-center
                  ${selected === budget.name 
                    ? 'border-yellow-400 bg-yellow-50 shadow-lg shadow-yellow-400/20' 
                    : 'border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50'
                  }`}
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${budget.gradient} flex items-center justify-center shadow-lg mr-6 border-2 border-yellow-200`}>
                  <div className="text-xl font-semibold text-gray-700">₹</div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-medium text-gray-800">{budget.name}</h3>
                    {budget.popular && (
                      <span className="px-3 py-1 text-xs font-medium bg-yellow-400 text-white rounded-full">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{budget.description}</p>
                  <span className="text-yellow-600 text-sm font-medium">{budget.range}</span>
                </div>
                
                {selected === budget.name && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center ml-4"
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
            data-testid="budget-back-button"
            className="px-8 py-3 text-lg font-medium rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300"
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!selected}
            data-testid="budget-next-button"
            className={`px-10 py-4 text-lg font-medium rounded-full transition-all duration-300 
              ${selected 
                ? 'bg-yellow-400 hover:bg-yellow-500 text-white shadow-lg hover:shadow-xl' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            Continue to Metal Type
          </Button>
        </motion.div>
      </div>
    </div>
  );
}