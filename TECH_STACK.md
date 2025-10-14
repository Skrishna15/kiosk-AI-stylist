# Tech Stack - Evol Jewels AI Stylist Kiosk

## Architecture Overview

**Type**: Full-Stack Progressive Web Application (PWA)  
**Deployment**: Kubernetes Container Environment  
**Architecture Pattern**: RESTful API with React SPA Frontend

---

## Frontend Stack

### Core Framework
- **React** (v18.2.0) - UI component library
- **React Router DOM** (v6.x) - Client-side routing and navigation

### UI/UX Libraries
- **Shadcn/UI** - Accessible, customizable component library
  - Components: Button, Dialog, Carousel, Card, Badge, Progress, ScrollArea
- **Tailwind CSS** (v3.x) - Utility-first CSS framework
  - Custom configuration for 1080x1920 kiosk display
  - White & gold luxury color scheme
  - Custom fonts: Playfair Display (serif), Inter (sans-serif)
- **Framer Motion** (v11.x) - Animation and transitions library
  - Page transitions
  - Micro-interactions
  - Gesture handling
- **Lucide React** - Icon library (ArrowLeft, ArrowRight, Heart, Star, etc.)

### Build Tools & Development
- **Vite** - Fast build tool and development server
- **PostCSS** - CSS processing
- **Autoprefixer** - Browser compatibility for CSS
- **ESLint** - JavaScript/TypeScript linting
- **Yarn** - Package manager (v1.22.x)

### Browser APIs & Features
- **Web Speech API** (webkitSpeechRecognition) - Voice input for AI chat
- **localStorage** - Session state persistence
- **Fetch API** - HTTP requests to backend
- **QR Code Generation** - Digital passport QR codes

### State Management
- **React Hooks** (useState, useEffect, useCallback) - Component state
- **Context API** - Global state (if needed for future enhancements)
- **URL State** - Navigation and routing state

---

## Backend Stack

### Core Framework
- **FastAPI** (v0.104.x) - Modern Python web framework
  - Async/await support
  - Automatic API documentation (Swagger/OpenAPI)
  - Pydantic data validation
  - CORS middleware

### Database
- **MongoDB** (v6.x) - NoSQL document database
  - Collections: sessions, products, feedback
- **Motor** (v3.x) - Async MongoDB driver for Python
- **PyMongo** - MongoDB Python driver utilities

### AI & Machine Learning
- **Groq SDK** (v0.32.0) - Primary AI provider (ultra-fast inference)
  - Model: llama-3.3-70b-versatile
- **xAI SDK** (v1.2.0) - Secondary AI provider
  - Model: grok-beta
  - OpenAI-compatible API integration
- **OpenAI** (v2.3.0) - Tertiary AI provider
  - Model: gpt-4o-mini
  - AsyncOpenAI client for async operations
- **Emergent Integrations** - Universal LLM key support (optional)

### API & HTTP
- **Uvicorn** - ASGI server for FastAPI
- **Starlette** - ASGI framework (FastAPI dependency)
- **HTTPX** - Async HTTP client
- **Requests** - HTTP library for synchronous calls
- **AIOHTTP** - Async HTTP client/server

### Data Processing & Validation
- **Pydantic** (v2.12.x) - Data validation and settings management
  - BaseModel for API schemas
  - Field validation
  - Type hints enforcement
- **Python-dotenv** - Environment variable management
- **UUID** - Session ID generation

### Supporting Libraries
- **asyncio** - Asynchronous I/O
- **logging** - Application logging
- **datetime** - Timestamp management
- **pathlib** - File path operations
- **json** - JSON parsing and serialization
- **typing** - Type hints (List, Dict, Optional, etc.)

---

## DevOps & Infrastructure

### Container & Orchestration
- **Docker** - Containerization (implicit via Kubernetes)
- **Kubernetes** - Container orchestration
  - Pod management
  - Service routing
  - Ingress configuration
- **Supervisor** - Process control system
  - Frontend process management
  - Backend process management
  - Automatic restart on failure

### Process Management
- **supervisorctl** - Supervisor command-line interface
  - Start/stop/restart services
  - Status monitoring
  - Log management

### Web Server & Routing
- **Nginx** (implicit via Kubernetes ingress) - Reverse proxy
- **Ingress Rules**:
  - `/api/*` routes → Backend (port 8001)
  - `/*` routes → Frontend (port 3000)

### Environment Configuration
- **.env files** - Environment-specific configurations
  - `backend/.env` - Backend configuration
  - `frontend/.env` - Frontend configuration
- **Environment Variables**:
  - `MONGO_URL` - MongoDB connection string
  - `DB_NAME` - Database name
  - `GROQ_API_KEY` - Groq AI authentication
  - `XAI_API_KEY` - xAI Grok authentication
  - `OPENAI_API_KEY` - OpenAI authentication
  - `REACT_APP_BACKEND_URL` - Frontend API base URL
  - `CORS_ORIGINS` - CORS allowed origins

---

## Development Tools

### Code Quality
- **Python Ruff** - Fast Python linter
  - Syntax checking
  - Import sorting
  - Code style enforcement
- **ESLint** - JavaScript/TypeScript linter
- **Git** - Version control

### Testing (Available)
- **pytest** - Python testing framework (setup available)
- **Backend Testing Agent** - Automated curl-based API testing
- **Frontend Testing Agent** - Playwright-based UI testing

### Package Management
- **pip** - Python package installer
- **requirements.txt** - Python dependencies list
- **yarn** - JavaScript package manager
- **package.json** - JavaScript dependencies manifest

---

## Third-Party Integrations

### AI Providers
1. **Groq** (https://groq.com)
   - Primary AI for chat completions
   - Ultra-fast inference (<1s response time)
   - Model: Llama 3.3 70B Versatile

2. **xAI** (https://x.ai)
   - Fallback AI provider
   - Model: Grok Beta
   - OpenAI-compatible endpoint

3. **OpenAI** (https://openai.com)
   - Secondary fallback provider
   - Model: GPT-4o-mini

### CDN & Assets
- **Shopify CDN** (cdn.shopify.com) - Product images hosting
- **Unsplash** (images.unsplash.com) - Mock luxury product images

### External Links
- **Evol Jewels Website** (https://evoljewels.com) - Product URLs and custom jewelry links

---

## Data Models & Schemas

### Database Collections

#### Sessions Collection
```json
{
  "id": "uuid",
  "created_at": "ISO datetime",
  "survey": {
    "style": "string",
    "occasion": "string",
    "budget": "string",
    "metal": "string"
  },
  "vibe": "string",
  "explanation": "string",
  "engine": "string (ai|rules)",
  "recommendation_product_ids": ["uuid", ...]
}
```

#### Products Collection
```json
{
  "id": "uuid",
  "name": "string",
  "price": "float (USD)",
  "image_url": "string",
  "style_tags": ["string", ...],
  "occasion_tags": ["string", ...],
  "description": "string"
}
```

### API Schemas (Pydantic Models)

#### SurveyInput
- style: str
- occasion: str
- budget: str
- metal: str

#### Product
- id: str
- name: str
- price: float
- image_url: str
- style_tags: List[str]
- occasion_tags: List[str]
- description: str

#### RecommendationItem
- product: Product
- reason: str

#### RecommendationResponse
- session_id: str
- engine: str (ai|rules)
- vibe: str
- explanation: str
- moodboard_image: str
- recommendations: List[RecommendationItem]

#### ChatRequest
- messages: List[ChatMessage]
- temperature: float (default 0.8)
- max_tokens: int (default 200)

#### ChatMessage
- role: str (system|user|assistant)
- content: str

---

## API Endpoints

### Frontend API Routes

#### Survey & Recommendations
- `POST /api/survey` - Submit survey and get recommendations
- `GET /api/session/{session_id}` - Retrieve session data

#### Chat
- `POST /api/chat` - AI stylist chat endpoint

#### Admin
- `POST /api/admin/import-evol-products` - Import product catalog

#### Utilities
- `GET /api/celebrity-styles` - Get celebrity style database

---

## Environment Setup

### Development Environment
```bash
# Backend
cd /app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd /app/frontend
yarn install

# Start services
sudo supervisorctl start all
```

### Production Environment
- Kubernetes cluster with:
  - Backend pod (port 8001)
  - Frontend pod (port 3000)
  - MongoDB service
  - Ingress controller

---

## Performance Optimizations

### Frontend
- **Code Splitting**: Dynamic imports for routes
- **Image Optimization**: CDN-hosted images with lazy loading
- **CSS Optimization**: Tailwind JIT compiler
- **Bundle Size**: Minimized with Vite production build

### Backend
- **Async Operations**: All I/O operations use async/await
- **Connection Pooling**: MongoDB connection reuse
- **Caching**: In-memory product data (EVOL_PRODUCTS array)
- **Timeout Management**: AI requests capped at 15-20 seconds

### Database
- **Indexes**: UUID-based fast lookups
- **Data Structure**: Denormalized for read performance
- **Cleanup**: Automatic old session removal (90 days)

---

## Security Considerations

### API Security
- **CORS Configuration**: Restricted origins
- **Environment Variables**: Sensitive data not in code
- **API Key Rotation**: Regular credential updates
- **Input Validation**: Pydantic schemas prevent injection

### Data Security
- **No PII Storage**: Anonymous UUID-based sessions
- **HTTPS Only**: All communications encrypted
- **Secure Storage**: MongoDB with authentication
- **Rate Limiting**: Protection against abuse (future enhancement)

---

## Monitoring & Logging

### Application Logs
- **Supervisor Logs**:
  - `/var/log/supervisor/backend.err.log` - Backend errors
  - `/var/log/supervisor/backend.out.log` - Backend output
  - `/var/log/supervisor/frontend.err.log` - Frontend errors
  - `/var/log/supervisor/frontend.out.log` - Frontend output

### Log Levels
- **INFO**: General application flow
- **WARNING**: Non-critical issues (AI fallbacks)
- **ERROR**: Critical failures requiring attention

### Metrics Tracked
- AI provider usage (Groq/Grok/OpenAI/Fallback)
- Response times
- Error rates
- Product view counts
- Session completion rates

---

## Scalability

### Horizontal Scaling
- **Stateless Backend**: Can run multiple instances
- **Shared Database**: MongoDB handles concurrent connections
- **Load Balancing**: Kubernetes ingress distributes traffic

### Vertical Scaling
- **Resource Limits**: Configurable CPU/memory per pod
- **AI Rate Limits**: Handled gracefully with fallbacks
- **Database Indexing**: Optimized for high-volume queries

---

## Version Information

### Current Versions
- **Frontend Build**: Vite 5.x
- **Backend Framework**: FastAPI 0.104.x
- **Database**: MongoDB 6.x
- **AI SDKs**: Groq 0.32.0, xAI 1.2.0, OpenAI 2.3.0
- **Node**: v18.x
- **Python**: v3.11

### Browser Support
- Chrome 90+
- Edge 90+
- Safari 14+
- Firefox 88+

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Maintained By**: Development Team
