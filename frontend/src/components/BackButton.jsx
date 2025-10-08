import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ onClick, className = "" }) {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed top-8 left-8 z-50 w-12 h-12 bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-yellow-400 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center group transition-all duration-300 ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      data-testid="back-button"
    >
      <ArrowLeft 
        size={20} 
        className="text-gray-600 group-hover:text-yellow-600 transition-colors duration-300" 
      />
    </motion.button>
  );
}