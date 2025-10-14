# Evol Jewels AI-Powered Stylist Kiosk

## Product Overview

The Evol Jewels AI-Powered Stylist Kiosk is a luxury, interactive jewelry recommendation system designed for in-store deployment on 55-inch vertical touchscreen displays (1080x1920px). The application provides personalized, celebrity-inspired jewelry recommendations through an elegant white & gold interface, combining AI-powered conversations with intelligent product matching.

## Key Features

### 🎯 Personalized Recommendation Engine
- **8-Step User Journey**: Welcome → Style Preference → Occasion → Budget → Metal Type → Recommendations → AI Stylist Chat → QR Code
- **Smart Filtering**: Multi-dimensional product matching based on:
  - Style preferences (Classic, Modern, Vintage, Bohemian)
  - Occasion types (Special Events, Romantic, Everyday, Work)
  - Budget ranges (₹10K-₹60K, ₹60K-₹1L, ₹1L-₹2L, ₹2L-₹4L)
  - Metal types (Yellow Gold, White Gold, Rose Gold, Platinum)
- **Celebrity-Inspired Vibes**: Products tagged with celebrity styling influences (Hollywood Glam, Editorial Chic, Vintage Romance, Boho Luxe)

### 💬 AI-Powered Jewelry Stylist
- **Natural Conversations**: Human-like chat interface powered by Groq AI (Llama 3.3 70B)
- **Multi-AI Fallback System**: 
  - Primary: Groq (ultra-fast inference)
  - Fallback: xAI Grok
  - Fallback: OpenAI GPT-4o-mini
  - Final: Intelligent rule-based responses
- **Professional Persona**: Warm, knowledgeable, and conversational stylist personality
- **Voice Input Support**: Web Speech API integration for hands-free interaction
- **Product Context**: AI has access to user preferences and selected products

### 🎨 Luxury User Experience
- **Premium Design**: White & gold color scheme with Playfair Display and Inter typography
- **Smooth Animations**: Framer Motion for elegant transitions and micro-interactions
- **Touch-Optimized**: Large, accessible buttons and intuitive navigation
- **Back Navigation**: Comprehensive back button system with state persistence
- **Auto-Reset**: 60-second inactivity timeout returns to welcome screen

### 💎 Product Catalog
- **55 Products**: 45 authentic Evol Jewels products + 9 luxury mock items + 1 custom option
- **Price Range**: ₹14,998 to ₹380,000
- **Categories**: Rings, Necklaces, Earrings, Bracelets, Complete Sets
- **Real Product Data**: Authentic CDN images, actual pricing, product URLs
- **Custom Jewelry Option**: "Design Your Dream Piece" for bespoke creations

### 📱 Digital Passport & QR Integration
- **Jewelry Passport**: Personalized QR code containing:
  - User style preferences and survey data
  - Recommended products with images and prices
  - Direct link to Evol Jewels website
  - Session timestamp and vibe analysis
- **Instant Shopping**: Scan QR to continue shopping on mobile or web
- **Feedback Collection**: 5-point emoji rating system (Heart, ThumbsUp, Meh, HelpCircle, ThumbsDown)

### 🎭 Celebrity Style Database
- **5 Celebrity Profiles**: Emma Stone, Blake Lively, Cate Blanchett, Margot Robbie, Zendaya
- **Style Matching**: Products aligned with celebrity fashion aesthetics
- **Inspirational Guidance**: AI references celebrity styles in recommendations

## Product Specifications

### Display Requirements
- **Resolution**: 1080 x 1920 pixels (portrait orientation)
- **Screen Size**: 55-inch vertical touchscreen display
- **Aspect Ratio**: 9:16 (optimized for kiosk mode)

### Performance
- **Page Load Time**: < 2 seconds
- **AI Response Time**: 1-3 seconds (Groq), 3-5 seconds (fallbacks)
- **Auto-Reset**: 60 seconds of inactivity
- **Session Management**: UUID-based with MongoDB storage

### Data & Analytics
- **Session Tracking**: Complete user journey tracking
- **Product Analytics**: View counts, selection patterns, budget preferences
- **Feedback Analytics**: Customer satisfaction ratings
- **AI Usage Metrics**: Source tracking (Groq/Grok/OpenAI/Fallback)

## Target Users

### Primary Users
- **Engagement Shoppers**: Customers seeking engagement rings
- **Gift Buyers**: People shopping for special occasions (birthdays, anniversaries, weddings)
- **Self-Purchasers**: Individuals treating themselves to luxury jewelry

### Use Cases
1. **In-Store Discovery**: Customers browse and get personalized recommendations
2. **Expert Guidance**: AI stylist provides professional advice and styling tips
3. **Decision Support**: Compare products, understand styles, get budget guidance
4. **Seamless Checkout**: QR code enables easy transition from kiosk to online purchase

## Value Propositions

### For Customers
- **Personalized Experience**: Tailored recommendations based on individual preferences
- **Expert Guidance**: Professional stylist advice without wait times
- **Pressure-Free Shopping**: Explore options at own pace without sales pressure
- **Convenient Purchase**: QR code makes checkout seamless across devices

### For Evol Jewels
- **Enhanced Customer Engagement**: Interactive experience increases time in store
- **Data-Driven Insights**: Collect valuable customer preference data
- **Reduced Staff Burden**: AI handles initial consultations
- **Omnichannel Integration**: Seamless bridge between physical and digital shopping
- **Brand Differentiation**: Cutting-edge technology positions brand as innovative

## Business Impact

### Metrics Tracked
- **Engagement Rate**: Sessions initiated vs. foot traffic
- **Completion Rate**: Users who complete full journey
- **Conversion Intent**: QR code scans indicating purchase interest
- **Average Session Duration**: Time spent on kiosk
- **Product View Distribution**: Most viewed/recommended products
- **Budget Insights**: Preferred price ranges
- **Customer Satisfaction**: Feedback ratings

### Expected Outcomes
- Increase customer engagement by 40%+
- Reduce staff consultation time by 30%+
- Capture customer preference data for marketing
- Drive online traffic through QR code conversions
- Enhance brand perception as tech-forward luxury jeweler

## Deployment Model

### Hardware Requirements
- 55" vertical touchscreen kiosk
- Internet connectivity (WiFi or Ethernet)
- Minimum 4GB RAM, 2-core CPU
- 20GB storage space

### Software Requirements
- Modern web browser (Chrome, Edge, Safari)
- Kubernetes container environment
- MongoDB database
- Supervisor process manager

### Maintenance
- **Content Updates**: Product catalog refresh via admin API
- **AI Model Updates**: Automatic via API key rotation
- **Analytics Export**: Session data available via database queries
- **System Monitoring**: Supervisor logs and health checks

## Future Enhancements (Roadmap)

### Phase 2
- Multi-language support (Hindi, regional languages)
- Virtual try-on using AR/camera
- Product availability checking with inventory system
- Direct in-store staff notification for assistance

### Phase 3
- Facial recognition for returning customers
- Social media integration (share recommendations)
- Video testimonials from celebrity stylists
- Integration with CRM for personalized follow-ups

### Phase 4
- Machine learning for improved recommendations
- A/B testing framework for UX optimization
- Advanced analytics dashboard for store managers
- Cross-store data aggregation and insights

## Support & Documentation

### User Support
- **In-Kiosk Help**: Contextual help buttons throughout journey
- **AI Fallbacks**: Always provides response even if AI unavailable
- **Staff Assistance**: Clear "Call for Help" option
- **Error Handling**: Graceful degradation with user-friendly messages

### Technical Support
- **Deployment Guide**: Step-by-step setup instructions
- **API Documentation**: Complete endpoint reference
- **Troubleshooting Guide**: Common issues and solutions
- **Monitoring Dashboard**: Real-time system health status

## Compliance & Security

### Data Privacy
- **GDPR Compliant**: No personally identifiable information stored
- **Anonymous Sessions**: UUID-based tracking only
- **Data Retention**: 90-day automatic cleanup
- **Secure Storage**: Encrypted API keys in environment variables

### Security Measures
- **HTTPS Only**: All communications encrypted
- **API Key Rotation**: Regular credential updates
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Sanitized user inputs

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Developed for**: Evol Jewels  
**Platform**: Web-based Progressive Web App (PWA)
