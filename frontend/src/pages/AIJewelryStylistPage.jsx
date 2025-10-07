import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || "";

export default function AIJewelryStylistPage({ onContinue, onBack, selectedProduct }) {
  const getCelebrityStyleMatch = () => {
    // Map survey preferences to celebrity styles
    const styleMap = {
      "Classic": "Hollywood Glam",
      "Modern": "Editorial Chic", 
      "Vintage": "Vintage Romance",
      "Bohemian": "Boho Luxe"
    };
    return styleMap["Modern"] || "Hollywood Glam"; // Default fallback
  };

  const getInitialMessage = () => {
    const celebrityVibe = getCelebrityStyleMatch();
    
    if (selectedProduct) {
      return `Hello! I see you're interested in the ${selectedProduct.name}. This beautiful piece costs ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')} and perfectly captures the ${celebrityVibe} aesthetic - just like what you'd see on red carpets and in celebrity style magazines. What would you like to know about this piece?`;
    }
    return `Hello! I'm your personal celebrity stylist AI. Based on your style preferences, I'm seeing a strong ${celebrityVibe} vibe - the same sophisticated elegance we see with A-list celebrities at premieres and fashion week. I've curated these pieces to match your celebrity-inspired aesthetic. What questions do you have about achieving this red-carpet worthy look?`;
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: getInitialMessage()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

  const getQuickQuestions = () => {
    if (selectedProduct) {
      return [
        `What celebrities wear pieces like ${selectedProduct.name}?`,
        "How can I style this like a red carpet look?",
        "What makes this piece celebrity-worthy?",
        "Which events would celebrities wear this to?", 
        "How to achieve the Hollywood glamour with this?",
        "What's the celebrity inspiration behind this?"
      ];
    }
    return [
      "Which celebrity style matches my vibe?",
      "What's trending on red carpets this season?",
      "How do A-list celebrities accessorize?", 
      "Show me Hollywood glamour pieces",
      "What would my celebrity stylist recommend?",
      "Match me to celebrity fashion trends"
    ];
  };

  const quickQuestions = getQuickQuestions();

  const handleQuickQuestion = async (question) => {
    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setShowQuickQuestions(false); // Hide quick questions after selection
    
    try {
      let response = "";
      
      if (selectedProduct) {
        // Product-specific celebrity responses
        if (question.includes("celebrities wear")) {
          response = `The ${selectedProduct.name} has that timeless elegance we see on red carpets! Think Emma Stone's sophisticated premieres or Blake Lively's Met Gala looks. This ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')} piece captures the same refined glamour that celebrity stylists choose for A-list events.`;
        } else if (question.includes("red carpet look")) {
          response = `To achieve a red carpet look with the ${selectedProduct.name}, pair it with a classic updo to showcase the piece's elegance. Keep other jewelry minimal - let this be your statement piece, just like celebrity stylists do for award shows. The key is confidence and letting the jewelry elevate your entire look!`;
        } else if (question.includes("celebrity-worthy")) {
          response = `The ${selectedProduct.name} has that perfect balance of luxury and wearability that celebrity stylists love. At ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')}, it offers the same sophistication you see in Vogue spreads and Hollywood premieres. The craftsmanship and design align with what A-list celebrities choose for their most important moments.`;
        } else if (question.includes("events")) {
          response = `Celebrities would absolutely wear the ${selectedProduct.name} to premieres, award ceremonies, fashion week events, and exclusive galas. It has that versatile elegance that works for both daytime red carpet events and evening black-tie affairs - perfect for your celebrity-inspired wardrobe!`;
        } else if (question.includes("Hollywood glamour")) {
          response = `To achieve Hollywood glamour with the ${selectedProduct.name}, think Old Hollywood meets modern sophistication. Style it with classic silhouettes, elegant updos, and timeless makeup. This piece captures that Audrey Hepburn meets modern-day Cate Blanchett aesthetic that never goes out of style.`;
        } else {
          response = `The celebrity inspiration behind the ${selectedProduct.name} comes from that effortless luxury we see on fashion week front rows and movie premieres. It embodies the same refined elegance that celebrity stylists choose when they want their clients to look sophisticated and timeless at high-profile events.`;
        }
      } else {
        // General responses when no product selected
        if (question.includes("diamond ring")) {
          response = "The Classic Diamond Solitaire Ring features a brilliant cut diamond that maximizes sparkle and light reflection. Given your preference for classic style, this timeless piece would complement any outfit and can transition beautifully from day to evening wear.";
        } else if (question.includes("trending")) {
          response = "This season, we're seeing a rise in minimalist designs, stackable rings, and vintage-inspired pieces. Layered necklaces and mixed metal combinations are also very popular right now.";
        } else if (question.includes("choose between")) {
          response = "I'd be happy to help you compare pieces! Could you tell me more about the specific items you're considering and what occasions you'll be wearing them for?";
        } else if (question.includes("care instructions")) {
          response = "For most fine jewelry: Clean with mild soap and warm water, store separately to avoid scratches, and have pieces professionally cleaned every 6 months. Avoid exposure to chemicals and remove before swimming or exercising.";
        } else if (question.includes("sizing")) {
          response = "For rings, measure your finger at the end of the day when it's slightly swollen. The ring should slide on easily but require slight pressure to remove. I can help you with a detailed sizing guide!";
        } else {
          response = "That's a great question! I'd love to help you explore custom design options. We can create unique pieces tailored to your style preferences and budget.";
        }
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm here to help with any jewelry questions you have. What would you like to know more about?" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Call the AI API
      const response = await axios.post(`${API}/ai/vibe`, {
        occasion: "Special Events",
        style: "Modern", 
        budget: "₹25,000–₹65,000",
        query: input
      });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Based on your query, here's my recommendation: ${response.data.explanation || response.data.vibe}` 
      }]);
    } catch (error) {
      // Fallback response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Thank you for your question! Based on your preferences, I'd recommend exploring our curated collection that matches your style and budget. Each piece is selected to complement your sophisticated taste." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white" data-testid="ai-jewelry-stylist-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-6 border-b border-yellow-200">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold text-lg">✨</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Jewelry Stylist</h1>
              <p className="text-yellow-100 text-sm">Get personalized advice about your jewelry selections</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="container mx-auto max-w-4xl p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-yellow-200 p-6 mb-6">
          {/* Messages */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-3 max-w-md ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">🤖</span>
                    </div>
                  )}
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">👤</span>
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl ${
                    message.role === 'user' 
                      ? 'bg-gray-100 text-gray-800 border border-gray-200' 
                      : 'bg-yellow-50 text-gray-800 border border-yellow-200'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div className="mb-6">
            <p className="text-yellow-600 font-medium mb-3 text-center">Or choose a quick question:</p>
            <div className="grid grid-cols-2 gap-3">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="p-3 text-sm bg-yellow-50 hover:bg-yellow-100 text-gray-800 rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors"
                  data-testid={`quick-question-${index}`}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about jewelry, styling, or these recommendations"
              className="flex-1 px-4 py-3 border border-yellow-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              data-testid="chat-input"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              data-testid="send-button"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={onContinue}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white px-8 py-4 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all"
            data-testid="continue-to-phone-button"
          >
            Continue to Get Results on Phone
          </Button>
        </div>
      </div>
    </div>
  );
}