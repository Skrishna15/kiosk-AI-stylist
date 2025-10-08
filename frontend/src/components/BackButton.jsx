import React from "react";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`fixed top-8 left-8 z-50 w-12 h-12 bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-yellow-400 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center group transition-all duration-300 ${className}`}
      data-testid="back-button"
    >
      <ArrowLeft 
        size={20} 
        className="text-gray-600 group-hover:text-yellow-600 transition-colors duration-300" 
      />
    </button>
  );
}