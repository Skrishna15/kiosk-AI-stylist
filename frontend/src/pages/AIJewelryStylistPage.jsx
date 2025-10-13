import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, Mic, MicOff } from "lucide-react";
import BackButton from "@/components/BackButton";
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || "";

// Voice Input Component
const VoiceInputButton = ({ onTranscript, isLoading }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const speechRecognition = new SpeechRecognition();
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'en-IN'; // Indian English for better local accent recognition
      
      speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };
      
      speechRecognition.onend = () => {
        setIsListening(false);
      };
      
      speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      setRecognition(speechRecognition);
    }
  }, [onTranscript]);

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Don't render if speech recognition is not supported
  if (!isSupported) return null;

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      disabled={isLoading}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
        isListening 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-2 border-gray-200'
      }`}
      title={isListening ? "Tap to stop recording" : "Tap to speak your message"}
      data-testid="voice-input-button"
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
};

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
      return `Great choice! 😍 The ${selectedProduct.name} has amazing ${celebrityVibe} vibes. What drew you to this piece?`;
    }
    return `Hey! 👋 Love your ${celebrityVibe} style - so chic! Ready to find your perfect piece?`;
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
        `Which celebs would totally rock this piece?`,
        "How do I style this for maximum impact?",
        "What makes this so special?",
        "Tell me more about this piece", 
        "How can I get this?",
        "What's the vibe behind this design?"
      ];
    }
    return [
      "Which celebrity am I channeling?",
      "What's hot on red carpets right now?",
      "How do I accessorize like an A-lister?", 
      "I'm ready to shop - what next?",
      "What would you pick for me?",
      "Show me the perfect piece!"
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
        if (question.includes("celebs would") || question.includes("celebrities wear")) {
          response = `Yes! 🌟 Emma Stone would totally rock this - it's got her effortless elegance. Blake Lively too! Pure A-list energy.`;
        } else if (question.includes("style this") || question.includes("maximum impact")) {
          response = `Let it be the star! 💫 Sleek updo, minimal other jewelry. Think Audrey Hepburn vibes - confident and chic!`;
        } else if (question.includes("special") || question.includes("makes this")) {
          response = `It's luxe enough for big moments but wearable for everyday! 😍 At ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')}, you're getting that celebrity confidence.`;
        } else if (question.includes("events")) {
          response = `Celebrities would absolutely wear the ${selectedProduct.name} to premieres, award ceremonies, fashion week events, and exclusive galas. It has that versatile elegance that works for both daytime red carpet events and evening black-tie affairs - perfect for your celebrity-inspired wardrobe!`;
        } else if (question.includes("get this") || question.includes("purchase") || question.includes("how can I")) {
          response = `Absolutely! 🎉 I'll give you a QR code at the end - it saves all our chat and takes you straight to secure checkout!`;
        } else if (question.includes("Tell me more") || question.includes("about this piece")) {
          response = `It's one of my favorites! 😊 Makes you feel instantly confident. At ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')}, you're investing in that "wow" feeling.`;
        } else {
          response = `It has that red carpet magnetism! 💎 Pure main character energy - which is exactly what you deserve!`;
        }
      } else {
        // General celebrity stylist responses
        if (question.includes("celebrity am I") || question.includes("style matches")) {
          const celebrityMatch = getCelebrityStyleMatch();
          const celebrityData = {
            "Hollywood Glam": { celebrity: "Blake Lively" },
            "Editorial Chic": { celebrity: "Emma Stone" },
            "Vintage Romance": { celebrity: "Margot Robbie" },
            "Boho Luxe": { celebrity: "Zendaya" }
          };
          const match = celebrityData[celebrityMatch] || celebrityData["Hollywood Glam"];
          response = `You're totally channeling ${match.celebrity}! 🌟 That ${celebrityMatch} vibe is so chic!`;
        } else if (question.includes("hot on red carpets") || question.includes("trending")) {
          response = "Classic Hollywood glamour with modern twists! 🍵 Statement earrings, delicate layers, vintage vibes. Margot and Zendaya are nailing it!";
        } else if (question.includes("accessorize like") || question.includes("A-lister")) {
          response = "Secret: Less is more, but make it LUXE! 💎 Pick ONE star piece. Quality over quantity, always!";
        } else if (question.includes("Hollywood glamour")) {
          response = "Our Hollywood glamour collection captures that timeless elegance of Audrey Hepburn meets modern-day Cate Blanchett. These pieces are designed to give you that red-carpet confidence and sophistication that celebrity stylists are known for creating.";
        } else if (question.includes("celebrity stylist recommend")) {
          response = `As your celebrity stylist AI, I'd recommend pieces that match your ${getCelebrityStyleMatch()} aesthetic. These selections are inspired by what top Hollywood stylists choose for their A-list clients - elegant, sophisticated, and perfectly suited to your personal vibe.`;
        } else if (question.includes("ready to shop") || question.includes("what next") || question.includes("purchase")) {
          response = `Yes! 🛍️ You'll get a QR code at the end - your VIP pass to personalized shopping!`;
        } else if (question.includes("pick for me") || question.includes("recommend")) {
          response = `Based on your ${getCelebrityStyleMatch()} vibe, I see gorgeous pieces in your future! 😍 Main character energy all the way!`;
        } else {
          response = "Current trend: timeless elegance meets modern edge! ✨ Think Vogue shoot vibes - sophisticated but never stuffy!";
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

  const getContextualFallback = (userInput, selectedProduct) => {
    const input = userInput.toLowerCase();
    
    // Purchase intent responses
    if (detectPurchaseIntent(input)) {
      const responses = [
        "Ready for some sparkle? ✨ You'll get a QR code at the end that makes shopping super easy!",
        "Love that you want to treat yourself! 💎 I'll hook you up with the purchase link!",
        "Yes! Let's make it yours! 🛍️ QR code coming up for easy checkout!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Style-related questions
    if (input.includes('style') || input.includes('look') || input.includes('wear')) {
      const responses = [
        "Your style is absolutely gorgeous! 😍 Let me think of the perfect styling tips...",
        "Great style question! 💫 You have such a good eye for elegance!",
        "Love how thoughtful you are about styling! ✨ That's what makes great fashion sense!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Celebrity-related questions  
    if (input.includes('celebrity') || input.includes('star') || input.includes('famous')) {
      const responses = [
        "Ooh, celebrity inspiration! 🌟 You're totally thinking like a stylist!",
        "Yes! Celebrity styling is my favorite topic! 💫 Great question!",
        "Love the celebrity angle! ⭐ You have that A-list mindset!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Product-specific questions
    if (selectedProduct && (input.includes('this') || input.includes('piece') || input.includes('ring') || input.includes('necklace'))) {
      const responses = [
        `The ${selectedProduct.name} is such a beautiful choice! 😍 What specifically interests you about it?`,
        `Great eye! The ${selectedProduct.name} is definitely a showstopper! 💎`,
        `You picked an amazing piece! ✨ The ${selectedProduct.name} has incredible elegance!`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Occasion-related questions
    if (input.includes('occasion') || input.includes('event') || input.includes('party') || input.includes('wedding')) {
      const responses = [
        "Perfect question! 🎉 The right jewelry can totally transform your look for any occasion!",
        "Love that you're thinking about occasions! ✨ That's how you nail the perfect style!",
        "Great approach! 💫 Matching jewelry to your event shows real style sense!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Budget-related questions
    if (input.includes('budget') || input.includes('expensive') || input.includes('cheap') || input.includes('afford')) {
      const responses = [
        "Smart thinking about budget! 💰 Great jewelry is an investment in yourself!",
        "Love that you're being thoughtful about this! 💎 Quality pieces are always worth it!",
        "Good question! ✨ The right piece at the right price - that's perfect shopping!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Generic positive responses for other questions
    const genericResponses = [
      "That's such a thoughtful question! 😊 You really know how to pick great jewelry!",
      "I love your curiosity! ✨ You're going to find the perfect piece!",
      "Great question! 💫 Your attention to detail shows amazing style sense!",
      "You're asking all the right questions! 🌟 That's what I love to see!",
      "Perfect question! 💎 You clearly have great taste in jewelry!",
      "Love how you think! ⭐ You're going to look absolutely stunning!",
      "Such a smart question! 😍 You really understand what makes jewelry special!"
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
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
          response = `Love that you want the ${selectedProduct.name}! 💕 I'll give you a QR code at the end - makes shopping super easy!`;
        } else {
          response = `Yay for treating yourself! 🎉 You'll get a QR code with all your picks saved and ready to go!`;
        }
      } else {
        // Call the AI API for non-purchase queries
        const response_data = await axios.post(`${API}/ai/vibe`, {
          occasion: "Special Events",
          style: "Modern", 
          budget: "₹25,000–₹65,000",
          query: userInput
        });
        
        response = `${response_data.data.explanation || response_data.data.vibe}`;
        
        // Add purchase guidance if the AI response might have sparked interest
        if (selectedProduct) {
          response += ` Want it? I'll hook you up with the QR code! 😊`;
        }
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response
      }]);
    } catch (error) {
      // Dynamic fallback responses based on user input
      let fallbackResponse = getContextualFallback(userInput, selectedProduct);
      
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
      {/* Back Button */}
      {onBack && <BackButton onClick={onBack} />}
      
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
              placeholder="Type your message or tap the microphone to speak..."
              className="flex-1 px-6 py-4 border border-yellow-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-lg"
              data-testid="chat-input"
            />
            
            {/* Voice Input Button */}
            <VoiceInputButton 
              onTranscript={setInput}
              isLoading={loading}
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