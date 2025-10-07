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
        "How do I purchase this piece?", 
        "Is this available for order?",
        "What's the celebrity inspiration behind this?"
      ];
    }
    return [
      "Which celebrity style matches my vibe?",
      "What's trending on red carpets this season?",
      "How do A-list celebrities accessorize?", 
      "How can I buy these recommendations?",
      "What would my celebrity stylist recommend?",
      "Where can I purchase these pieces?"
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
          response = `The ${selectedProduct.name} has that timeless elegance we see on red carpets! Think Emma Stone's sophisticated premieres or Blake Lively's Met Gala looks. This ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')} piece captures the same refined glamour that celebrity stylists choose for A-list events. If you'd like to add this to your collection, I'll provide a QR code at the end that takes you to Evol Jewels' secure website for purchase.`;
        } else if (question.includes("red carpet look")) {
          response = `To achieve a red carpet look with the ${selectedProduct.name}, pair it with a classic updo to showcase the piece's elegance. Keep other jewelry minimal - let this be your statement piece, just like celebrity stylists do for award shows. The key is confidence and letting the jewelry elevate your entire look! Ready to make it yours? Just scan the QR code I'll provide to purchase securely through Evol Jewels.`;
        } else if (question.includes("celebrity-worthy")) {
          response = `The ${selectedProduct.name} has that perfect balance of luxury and wearability that celebrity stylists love. At ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')}, it offers the same sophistication you see in Vogue spreads and Hollywood premieres. The craftsmanship and design align with what A-list celebrities choose for their most important moments. When you're ready to purchase, scan the QR code for secure checkout on Evol Jewels' website.`;
        } else if (question.includes("events")) {
          response = `Celebrities would absolutely wear the ${selectedProduct.name} to premieres, award ceremonies, fashion week events, and exclusive galas. It has that versatile elegance that works for both daytime red carpet events and evening black-tie affairs - perfect for your celebrity-inspired wardrobe!`;
        } else if (question.includes("purchase this piece") || question.includes("available for order")) {
          response = `Absolutely! The ${selectedProduct.name} is available for purchase through Evol Jewels. At the end of our consultation, I'll provide you with a QR code that opens your personalized Jewelry Passport. This takes you directly to Evol Jewels' secure website where you can complete your purchase safely. All your styling preferences and our conversation will be saved to make checkout seamless and ensure you get exactly what matches your celebrity-inspired style!`;
        } else if (question.includes("Hollywood glamour")) {
          response = `To achieve Hollywood glamour with the ${selectedProduct.name}, think Old Hollywood meets modern sophistication. Style it with classic silhouettes, elegant updos, and timeless makeup. This piece captures that Audrey Hepburn meets modern-day Cate Blanchett aesthetic that never goes out of style.`;
        } else {
          response = `The celebrity inspiration behind the ${selectedProduct.name} comes from that effortless luxury we see on fashion week front rows and movie premieres. It embodies the same refined elegance that celebrity stylists choose when they want their clients to look sophisticated and timeless at high-profile events.`;
        }
      } else {
        // General celebrity stylist responses
        if (question.includes("celebrity style matches")) {
          response = `Based on your preferences, you have strong ${getCelebrityStyleMatch()} vibes! Think Blake Lively's effortless elegance or Emma Stone's sophisticated red carpet moments. Your style DNA matches celebrities who choose timeless pieces that make statements without being flashy.`;
        } else if (question.includes("red carpets this season")) {
          response = "This season on red carpets, we're seeing a return to classic Hollywood glamour with modern twists! Celebrities are choosing statement earrings, delicate layered necklaces, and vintage-inspired rings. Think Margot Robbie's Chanel moments or Zendaya's bold but elegant choices.";
        } else if (question.includes("A-list celebrities accessorize")) {
          response = "A-list celebrities follow the 'less is more but make it luxurious' rule. They choose one statement piece - like bold earrings with hair pulled back, or a stunning necklace with a simple dress. Celebrity stylists always ensure jewelry complements, never competes with, the overall look.";
        } else if (question.includes("Hollywood glamour")) {
          response = "Our Hollywood glamour collection captures that timeless elegance of Audrey Hepburn meets modern-day Cate Blanchett. These pieces are designed to give you that red-carpet confidence and sophistication that celebrity stylists are known for creating.";
        } else if (question.includes("celebrity stylist recommend")) {
          response = `As your celebrity stylist AI, I'd recommend pieces that match your ${getCelebrityStyleMatch()} aesthetic. These selections are inspired by what top Hollywood stylists choose for their A-list clients - elegant, sophisticated, and perfectly suited to your personal vibe.`;
        } else {
          response = "Right now, celebrity fashion trends are leaning toward timeless elegance with modern sophistication. Think pieces that would look perfect in Vogue or at a movie premiere - that's exactly what we've curated for your style preferences!";
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

  const detectPurchaseIntent = (message) => {
    const purchaseKeywords = [
      'buy', 'purchase', 'price', 'cost', 'order', 'get this', 'want this', 
      'how much', 'available', 'in stock', 'can i get', 'interested in buying',
      'where to buy', 'how to order', 'payment', 'checkout'
    ];
    return purchaseKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      let response = "";
      
      // Check for purchase intent
      if (detectPurchaseIntent(userInput)) {
        if (selectedProduct) {
          response = `I'm excited that you're interested in the ${selectedProduct.name}! To purchase this beautiful piece securely, you can scan the QR code that will appear at the end of our consultation. This will open your personalized Jewelry Passport where you can complete your purchase safely through Evol Jewels' official website. The QR code will save all your preferences and this specific product for easy checkout.`;
        } else {
          response = `I'm thrilled that you're interested in making a purchase! At the end of our consultation, you'll receive a QR code that opens your personalized Jewelry Passport. This will take you directly to Evol Jewels' secure website where you can purchase any of your recommended pieces safely. All your preferences and our conversation will be saved for a seamless shopping experience.`;
        }
      } else {
        // Call the AI API for non-purchase queries
        const response_data = await axios.post(`${API}/ai/vibe`, {
          occasion: "Special Events",
          style: "Modern", 
          budget: "₹25,000–₹65,000",
          query: userInput
        });
        
        response = `Based on your query, here's my recommendation: ${response_data.data.explanation || response_data.data.vibe}`;
        
        // Add purchase guidance if the AI response might have sparked interest
        if (selectedProduct) {
          response += ` If you're interested in purchasing, just let me know and I'll guide you to our secure checkout through your Jewelry Passport!`;
        }
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response
      }]);
    } catch (error) {
      // Fallback response with purchase guidance
      let fallbackResponse = "Thank you for your question! Based on your preferences, I'd recommend exploring our curated collection that matches your style and budget. Each piece is selected to complement your sophisticated taste.";
      
      if (detectPurchaseIntent(userInput)) {
        fallbackResponse = `I understand you're interested in making a purchase! At the end of our styling consultation, you'll receive a QR code that opens your personalized Jewelry Passport on Evol Jewels' secure website. This ensures a safe and seamless shopping experience with all your preferences saved.`;
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: fallbackResponse
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
    <div className="h-screen bg-white flex flex-col" data-testid="ai-jewelry-stylist-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-6 border-b border-yellow-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-yellow-600 font-bold text-lg">✨</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Your Celebrity Stylist AI</h1>
            <p className="text-yellow-100 text-sm">Matching your vibe to celebrity styles and red carpet glamour</p>
          </div>
        </div>
      </div>

      {/* Chat Area - Full Screen */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1 bg-white rounded-2xl shadow-lg border border-yellow-200 p-6 mb-6 flex flex-col">
          {/* Messages - Expandable */}
          <div className="space-y-4 mb-6 flex-1 overflow-y-auto">
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

          {/* Quick Questions - Only show if no messages yet or fewer than 3 messages */}
          {showQuickQuestions && messages.length <= 2 && (
            <div className="mb-6 flex-shrink-0">
              <p className="text-yellow-600 font-medium mb-3 text-center">Or choose a quick question:</p>
              <div className="grid grid-cols-2 gap-3">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="p-4 text-sm bg-yellow-50 hover:bg-yellow-100 text-gray-800 rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors"
                    data-testid={`quick-question-${index}`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area - Fixed at bottom */}
          <div className="flex gap-3 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about jewelry, styling, or celebrity looks..."
              className="flex-1 px-6 py-4 border border-yellow-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-lg"
              data-testid="chat-input"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              className="w-14 h-14 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              data-testid="send-button"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* Continue Button - Full width at bottom */}
        <div className="mt-6 flex-shrink-0">
          <Button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white px-8 py-5 rounded-2xl text-xl font-medium shadow-lg hover:shadow-xl transition-all"
            data-testid="continue-to-phone-button"
          >
            Continue to Get Results on Phone
          </Button>
        </div>
      </div>
    </div>
  );
}