# Voice Shopping Assistant - Backend

Backend API for voice-controlled shopping assistant with price tracking functionality.

## Features

- 🔍 Web scraping from Flipshope for price history
- 📊 Price tracking and history
- 🤖 Puppeteer-based scraping with Cheerio fallback
- 🔄 REST API for frontend integration
- ⚡ Fast and efficient data extraction

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env` if needed

## Usage

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

Server will start on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "message": "Voice Shopping Assistant API is running",
  "timestamp": "2024-01-06T10:30:00.000Z",
  "uptime": 123.45
}
```

### Track Price
```
POST /api/track-price
Content-Type: application/json

{
  "url": "https://www.amazon.in/dp/B0XXXXXXXXX"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "title": "Product Name",
    "platform": "Amazon",
    "currentPrice": 25000,
    "lowestPrice": 23000,
    "availability": "In Stock",
    "priceHistory": [
      {
        "date": "Dec 1",
        "price": 24500
      }
    ]
  }
}
```

### Get Tracked Products
```
GET /api/tracked-products
```

## Project Structure

```
backend/
├── server.js                 # Main entry point
├── package.json             # Dependencies
├── .env                     # Environment variables
├── routes/
│   └── api.js              # API routes
├── controllers/
│   └── priceController.js  # Business logic
├── scrapers/
│   └── flipshopeScraper.js # Web scraping logic
├── utils/
│   ├── extractProductId.js # URL parsing
│   └── mockData.js         # Mock data generator
└── middleware/
    └── errorHandler.js      # Error handling
```

## How It Works

1. Frontend sends product URL to `/api/track-price`
2. Backend extracts product ID from URL
3. Constructs Flipshope URL
4. Scrapes data using Puppeteer (or Cheerio as fallback)
5. Returns price data with history to frontend

## Troubleshooting

### Puppeteer Issues

If Puppeteer fails to install or run:

```bash
# Install Chromium manually
npx puppeteer browsers install chrome

# Or use system Chrome
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

### Port Already in Use

Change the port in `.env`:
```
PORT=3001
```

### CORS Issues

Update `CORS_ORIGIN` in `.env`:
```
CORS_ORIGIN=http://localhost:8000
```

## Notes

- Scraping may fail if Flipshope changes their HTML structure
- Mock data is used as fallback when scraping fails
- For production, consider rate limiting and caching

## License

MIT