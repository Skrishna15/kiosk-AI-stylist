import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import { ChevronDown, ChevronUp, Star, Shield, Truck } from "lucide-react";

export default function RecommendationScreen({ data, onViewDetails, onGetOnPhone, onBack }){
  const [expandedCards, setExpandedCards] = useState(new Set());
  return (
    <div className="kiosk-frame container py-10 space-y-6" data-testid="recommendation-screen-page">
      {/* Back Button */}
      {onBack && <BackButton onClick={onBack} />}
      
      <div>
        <div className="text-sm tracking-widest text-neutral-500">Your Perfect Matches</div>
        <h2 className="card-title text-4xl mt-2">Tailored to your preferences</h2>
        <div className="text-sm text-gray-600 mt-2">Click on any product to chat with our AI stylist about it</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {data?.map((p, idx)=> (
          <div key={p.id} className="rounded-xl border border-neutral-200 overflow-hidden bg-white/90 shadow-sm" data-testid={`rec-card-${idx}`}>
            <img src={p.image_url} alt={p.name} className="w-full h-64 object-cover" />
            <div className="p-4">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm subcopy">{p.description || 'Beautifully crafted piece for your look.'}</div>
              <div className="text-sm mt-2">₹{Math.round(p.price*83).toLocaleString('en-IN')}</div>
              <div className="mt-3 space-y-2">
                <Button 
                  onClick={()=> onViewDetails(p)} 
                  data-testid={`rec-view-${idx}`} 
                  className="w-full px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-800 rounded-full font-medium transition-all border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
                >
                  View Details
                </Button>
                <Button 
                  onClick={()=> onViewDetails(p)} 
                  data-testid={`rec-chat-${idx}`} 
                  className="w-full px-4 py-2 text-sm bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="text-lg">💬</span>
                  Chat with AI Stylist
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <Button data-testid="get-on-phone-button" className="button-pill" onClick={onGetOnPhone}>Get These Results on Your Phone</Button>
      </div>
    </div>
  );
}