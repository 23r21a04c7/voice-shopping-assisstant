# Voice Shopping Assistant - Frontend

Frontend interface for voice-controlled shopping assistant with price tracking.

## Features

- 🎤 Voice recognition for hands-free shopping
- 🛍️ Multi-platform search (Amazon, Flipkart, Myntra, Ajio)
- 📊 Real-time price tracking with interactive graphs
- 📱 Responsive design for mobile and desktop
- ⚡ Fast and intuitive user interface

## Setup

### Option 1: Using Python HTTP Server

```bash
cd frontend
python3 -m http.server 8000
```

Then open: `http://localhost:8000`

### Option 2: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

### Option 3: Using Node.js http-server

```bash
npm install -g http-server
cd frontend
http-server -p 8000
```

## Usage

### Voice Search

1. Click the purple microphone button
2. Say: "[product] in [platform]"
   - Example: "iPhone 16 in Flipkart"
   - Example: "Badminton shoes in Amazon"
3. The platform will open automatically with your search

### Price Tracking

1. Search for a product on Amazon/Flipkart
2. Copy the product URL
3. Paste it in the "Price Tracker" section
4. Click "Track Price"
5. View price history graph and analytics

## Browser Compatibility

### Voice Recognition Support
- ✅ Chrome (Recommended)
- ✅ Edge
- ⚠️ Safari (Limited)
- ❌ Firefox (No support)

### Requirements
- Modern browser with JavaScript enabled
- Microphone access for voice features
- Backend server running on port 3000

## Configuration

Edit `js/app.js` to change API endpoint:

```javascript
const API_URL = 'http://localhost:3000/api';
```

## Troubleshooting

### Microphone Not Working

**Error: "not-allowed"**
- Solution: Run on `http://localhost` or `https://`
- File protocol (`file://`) blocks microphone access

**Browser Permission**
1. Click lock icon in address bar
2. Allow microphone access
3. Refresh the page

### Backend Connection Failed

**Error: "Backend server not running"**
- Solution: Start backend server first
```bash
cd backend
node server.js
```

### CORS Errors

If you see CORS errors in console:
- Make sure backend is running
- Check `CORS_ORIGIN` in backend `.env`
- Should match your frontend URL

## Project Structure

```
frontend/
├── index.html          # Main HTML file
├── js/
│   └── app.js         # Application logic
├── css/               # (Optional) Custom styles
└── README.md          # This file
```

## Voice Commands

| Command | Action |
|---------|--------|
| "iPhone 16 in Flipkart" | Opens Flipkart with search |
| "Shoes in Amazon" | Opens Amazon with search |
| "Laptop" | Shows all platforms |

## Tips

- Speak clearly and naturally
- Use "in" or "on" to specify platform
- Wait for the red pulsing animation before speaking
- Click again to stop listening

## License

MIT