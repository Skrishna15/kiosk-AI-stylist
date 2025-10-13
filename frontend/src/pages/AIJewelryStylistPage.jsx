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
      return `Oh, excellent choice! 😍 The ${selectedProduct.name} caught your eye - I totally get why! At ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')}, this piece has that perfect ${celebrityVibe} energy. It's the kind of jewelry that makes you feel like you're walking a red carpet, you know? What's drawing you to this particular piece?`;
    }
    return `Hey there! 👋 I'm absolutely loving your style choices so far - you've got that gorgeous ${celebrityVibe} aesthetic going on! It reminds me of how effortlessly chic celebrities look at premieres. I've picked some pieces that'll give you that same sophisticated confidence. What do you think? Ready to find your perfect match?`;
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
          response = `Oh my gosh, yes! 🌟 I can totally see Emma Stone wearing the ${selectedProduct.name} to a premiere - it has that effortless sophistication she's known for. And Blake Lively? She'd absolutely nail this at the Met Gala! At ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')}, you're getting that same A-list elegance. Want to make it yours? I'll hook you up with a QR code to get it!`;
        } else if (question.includes("style this") || question.includes("maximum impact")) {
          response = `Ooh, I love this question! 💫 Here's the secret: let the ${selectedProduct.name} be your star. Pair it with a sleek updo so nothing competes with its beauty. Keep other jewelry super minimal - think Audrey Hepburn vibes. The magic is in the confidence you wear it with! Trust me, you'll feel like you're walking your own red carpet. Ready to make heads turn?`;
        } else if (question.includes("special") || question.includes("makes this")) {
          response = `What doesn't make it special, honestly! 😍 The ${selectedProduct.name} has this incredible balance - it's luxurious enough for your biggest moments but wearable enough that you won't save it for "someday." At ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')}, you're investing in that same sophisticated energy celebrities bring to every red carpet. It's crafted to make YOU the main character!`;
        } else if (question.includes("events")) {
          response = `Celebrities would absolutely wear the ${selectedProduct.name} to premieres, award ceremonies, fashion week events, and exclusive galas. It has that versatile elegance that works for both daytime red carpet events and evening black-tie affairs - perfect for your celebrity-inspired wardrobe!`;
        } else if (question.includes("get this") || question.includes("purchase") || question.includes("how can I")) {
          response = `Yes! I'm so excited you want the ${selectedProduct.name}! 🎉 Here's what we'll do - at the end of our chat, I'll give you a special QR code that's like your personal shopping pass. It takes you straight to Evol Jewels where everything about your style preferences and our conversation is saved. Super easy, super secure, and totally personalized just for you!`;
        } else if (question.includes("Tell me more") || question.includes("about this piece")) {
          response = `Oh, where do I even start? 😊 The ${selectedProduct.name} is honestly one of my favorites! It has this amazing way of making whoever wears it feel instantly more confident. At ₹${Math.round(selectedProduct.price*83).toLocaleString('en-IN')}, you're not just buying jewelry - you're investing in that feeling of walking into any room and knowing you look absolutely incredible. What specific details are you most curious about?`;
        } else {
          response = `You know what I love about the ${selectedProduct.name}? 💎 It has that same magnetic quality that makes celebrities stop traffic on red carpets. There's something about the design that just screams "main character energy" - which is exactly what you deserve! It's inspired by those iconic fashion moments that we still talk about years later.`;
        }
      } else {
        // General celebrity stylist responses
        if (question.includes("celebrity am I") || question.includes("style matches")) {
          const celebrityMatch = getCelebrityStyleMatch();
          const celebrityData = {
            "Hollywood Glam": { celebrity: "Blake Lively", signature: "that effortless vintage glamour", quote: "The right jewelry can transform any outfit into something magical" },
            "Editorial Chic": { celebrity: "Emma Stone", signature: "minimalist pieces that still make a statement", quote: "I love jewelry that feels effortless but still makes a statement" },
            "Vintage Romance": { celebrity: "Margot Robbie", signature: "timeless pieces with serious staying power", quote: "I believe in investing in jewelry pieces that will be treasured forever" },
            "Boho Luxe": { celebrity: "Zendaya", signature: "bold pieces that show personality", quote: "Fashion and jewelry should be fun and express who you are" }
          };
          const match = celebrityData[celebrityMatch] || celebrityData["Hollywood Glam"];
          response = `OMG, you are totally channeling ${match.celebrity} energy! 🌟 You both have that amazing ${celebrityMatch} vibe with ${match.signature}. She once said "${match.quote}" and honestly? That's SO you! Your jewelry choices should feel authentically yours.`;
        } else if (question.includes("hot on red carpets") || question.includes("trending")) {
          response = "Okay, so the red carpet tea right now? 🍵 Everyone's going back to classic Hollywood glamour but with a modern twist! I'm seeing statement earrings that actually make statements, delicate layers that look effortless, and vintage-inspired pieces that feel fresh. Margot Robbie's Chanel moments? *Chef's kiss* And don't get me started on Zendaya's bold-but-elegant game!";
        } else if (question.includes("accessorize like") || question.includes("A-lister")) {
          response = "Here's the celebrity styling secret: 'Less is more, but make it LUXURIOUS!' 💎 The pros always pick ONE statement piece to be the star - maybe killer earrings with hair swept back, or a show-stopping necklace with a simple dress. The trick is making sure your jewelry elevates the whole look instead of fighting for attention. Quality over quantity, always!";
        } else if (question.includes("Hollywood glamour")) {
          response = "Our Hollywood glamour collection captures that timeless elegance of Audrey Hepburn meets modern-day Cate Blanchett. These pieces are designed to give you that red-carpet confidence and sophistication that celebrity stylists are known for creating.";
        } else if (question.includes("celebrity stylist recommend")) {
          response = `As your celebrity stylist AI, I'd recommend pieces that match your ${getCelebrityStyleMatch()} aesthetic. These selections are inspired by what top Hollywood stylists choose for their A-list clients - elegant, sophisticated, and perfectly suited to your personal vibe.`;
        } else if (question.includes("ready to shop") || question.includes("what next") || question.includes("purchase")) {
          response = `Yess! I love your energy! 🛍️ Here's the deal - when we're done chatting, you'll get this amazing QR code that's basically your VIP pass to everything we've talked about. It saves all your style preferences, our whole conversation, everything! Then you can shop on Evol Jewels' site with all your personalized picks ready to go. It's like having your own personal shopping experience!`;
        } else if (question.includes("pick for me") || question.includes("recommend")) {
          response = `Oh honey, based on our chat, I'm seeing some absolutely gorgeous pieces in your future! 😍 You have this incredible ${getCelebrityStyleMatch()} energy that deserves jewelry with the same sophistication. I'm thinking pieces that make you feel like the main character in your own story - you know, that confident, effortless elegance that makes heads turn!`;
        } else {
          response = "You know what's so exciting about jewelry trends right now? ✨ We're seeing this beautiful blend of timeless elegance with just the right amount of modern edge. The kind of pieces that would look perfect in a Vogue shoot or at a movie premiere - sophisticated but never stuffy. That's exactly the vibe I'm getting from your style choices!";
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
          response = `Aw, I'm so happy you love the ${selectedProduct.name}! 💕 Here's what we'll do - when we're all done chatting, you'll get this super cool QR code that's like your personal shopping key. Just scan it and boom - your Jewelry Passport opens up with everything about this piece and our whole conversation saved. It makes shopping so much easier and more personal!`;
        } else {
          response = `This is so exciting - I love when someone's ready to treat themselves! 🎉 At the end of our chat, I'll give you a special QR code that opens your personal Jewelry Passport. It's got all your style preferences, our conversation, and your perfect matches all saved and ready to go. Shopping has never felt so personalized!`;
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