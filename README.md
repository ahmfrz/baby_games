# Baby Games Platform

A modular, extensible game platform for toddlers built with vanilla JavaScript, HTML, and CSS. Designed for enterprise-grade scalability with easy addition of new games.

## 🎮 Features

- **Alphabet & Numbers Learning Game** (Included)
  - Display letters A-Z or numbers 0-9
  - Visual feedback (correct answer shows picture, incorrect shows visual cue)
  - Audio feedback (success/fail sounds)
  - Score tracking
  - Device-aware input (keyboard on desktop, buttons on mobile)

- **Extensible Architecture**
  - Plugin-based game system (GameModule base class)
  - Centralized GameRegistry for game management
  - Shared services: AudioManager, InputManager, StorageManager, AssetManager, DeviceDetector, AdManager

- **Ready for Monetization**
  - AdManager abstraction layer (disabled in Phase 1)
  - Support for multiple ad networks (Google AdSense, AdMob, etc.)
  - Ad-safe UI zones (ads don't interfere with game UI)

- **Mobile & Desktop Support**
  - Responsive design (works on phones, tablets, desktops)
  - Touch-friendly buttons for mobile
  - Keyboard input for desktop
  - Auto-detection of device type

## 🚀 Quick Start

### Option 1: Local Development (Recommended)

**Prerequisites:**
- Python 3.x (for local server) OR Node.js (for http-server)

**Steps:**

1. Clone/download this repository
2. Navigate to project directory:
   ```bash
   cd baby_games
   ```

3. Start a local server:

   **Using Python 3:**
   ```bash
   python -m http.server 8000
   ```

   **Using Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```

   **Using Node.js (http-server):**
   ```bash
   npx http-server -p 8000
   ```

4. Open browser: `http://localhost:8000`

### Option 2: Direct File Opening

You can also open `index.html` directly in your browser, but some features (asset loading, audio) may not work due to CORS restrictions.

## 📁 Project Structure

```
baby_games/
├── index.html                           # Main HTML file
├── js/
│   └── main.js                         # Platform entry point
├── core/
│   ├── GameModule.js                   # Base class for all games
│   ├── GameRegistry.js                 # Game registration & instantiation
│   └── EventEmitter.js                 # Event system
├── services/
│   ├── AudioManager.js                 # Audio playback
│   ├── InputManager.js                 # Keyboard & button input
│   ├── StorageManager.js               # localStorage wrapper
│   ├── AssetManager.js                 # Image/asset loading
│   ├── DeviceDetector.js               # Mobile/desktop detection
│   └── AdManager.js                    # Ad network integration
├── styles/
│   └── main.css                        # Global styles
├── games/
│   └── alphabet-learner/
│       ├── AlphabetLearnerGame.js      # Game logic
│       ├── styles.css                  # Game-specific styles
│       ├── manifest.json               # Asset registry
│       └── assets/
│           ├── images/                 # Letter/number pictures
│           └── sounds/                 # Audio files
├── config/
│   └── ads.json                        # Ad configuration
└── README.md                           # This file
```

## 🎯 How to Add Assets

The game uses a **manifest-based asset system** for flexibility.

### 1. Prepare Images

- Get images from free sources: [Unsplash](https://unsplash.com), [Pixabay](https://pixabay.com), [Pexels](https://pexels.com)
- Recommended size: 256x256px or larger (will be scaled to fit)
- Recommended format: PNG (transparent background)

Example: `A-apple.png`, `B-ball.png`, etc.

### 2. Prepare Sounds

- Get sounds from: [Freesound.org](https://freesound.org), [Zapsplat](https://www.zapsplat.com)
- Recommended format: MP3 (good browser support)
- Recommended sounds:
  - `success.mp3` - Happy chime/bell sound (1-2 seconds)
  - `fail.mp3` - Sad/buzzer sound (1-2 seconds)

### 3. Organize Files

Place assets in the game's asset directory:

```
games/alphabet-learner/assets/
├── images/
│   ├── A-apple.png
│   ├── B-ball.png
│   ├── C-cat.png
│   ...
│   ├── 0-zero.png
│   ├── 1-one.png
│   ...
└── sounds/
    ├── success.mp3
    └── fail.mp3
```

### 4. Update Manifest

Edit `games/alphabet-learner/manifest.json`:

```json
{
  "characters": [
    {
      "char": "A",
      "imagePath": "assets/images/A-apple.png",
      "name": "Apple"
    },
    {
      "char": "B",
      "imagePath": "assets/images/B-ball.png",
      "name": "Ball"
    },
    ...
  ],
  "sounds": {
    "success": "assets/sounds/success.mp3",
    "fail": "assets/sounds/fail.mp3"
  }
}
```

## 🕹️ How to Add a New Game

### Step 1: Create Game Directory

```
games/my-new-game/
├── MyNewGame.js
├── styles.css
├── manifest.json
└── assets/
```

### Step 2: Implement Game Class

Create `games/my-new-game/MyNewGame.js`:

```javascript
import { GameModule } from '../../core/GameModule.js';

export class MyNewGame extends GameModule {
  static metadata = {
    id: 'my-new-game',
    name: '🎮 My New Game',
    description: 'Description of game',
    version: '1.0.0',
    author: 'Your Name',
    assetPath: '/games/my-new-game/'
  };

  async initialize() {
    // Load assets, setup UI
  }

  start() {
    // Start game loop
  }

  pause() {
    // Pause game
  }

  stop() {
    // Cleanup
  }

  reset() {
    // Reset to initial state
  }
}
```

### Step 3: Register Game

In `js/main.js`, add:

```javascript
import { MyNewGame } from '../games/my-new-game/MyNewGame.js';

// In registerGames() method:
gameRegistry.register(MyNewGame);
```

**That's it!** The game will automatically appear on the launcher screen.

## 🚀 Deployment

### Option 1: Netlify (Recommended)

1. Create account at [netlify.com](https://netlify.com)
2. Connect your Git repository OR drag-drop `baby_games` folder
3. Netlify auto-deploys on push
4. Get free HTTPS domain: `yoursite.netlify.app`

### Option 2: GitHub Pages

1. Push code to GitHub repository
2. Go to repo settings → GitHub Pages
3. Select `main` branch as source
4. Get free HTTPS domain: `yourname.github.io/baby_games`

### Option 3: Vercel

1. Create account at [vercel.com](https://vercel.com)
2. Import Git repository
3. Deploy with one click
4. Get free HTTPS domain

## 💰 Monetization (Phase 2)

Ad integration is built into the platform but **disabled by default** (Phase 1).

### To Enable Ads (Phase 2):

1. Edit `config/ads.json`:
   ```json
   {
     "enabled": true,
     "networks": {
       "google-adsense": {
         "enabled": true,
         "clientId": "ca-pub-YOUR-CLIENT-ID"
       }
     }
   }
   ```

2. Set up ad network account:
   - [Google AdSense](https://adsense.google.com) (web)
   - [Google AdMob](https://admob.google.com) (mobile)

3. Ad placements:
   - **Banner ads**: Bottom of screen (safe zone, doesn't block game UI)
   - **Interstitial ads**: Between game rounds
   - **Rewarded ads**: Optional, for future features

## 📊 Local Data

Game progress is saved locally in browser:

```javascript
// Access via browser DevTools → Application → Local Storage
babyGames_lastGameScore: {"score": 15, "duration": 45000, ...}
babyGames_inputPreference: true  // User's device preference (buttons vs keyboard)
```

## 🛠️ Development

### File Structure Philosophy

- **Core**: Platform framework (GameModule, GameRegistry, EventEmitter)
- **Services**: Reusable functionality (audio, input, storage, ads)
- **Games**: Game implementations (must extend GameModule)
- **Assets**: Game-specific media (organized per-game for scalability)

### Adding Debug Info

Open browser console and run:

```javascript
window.babyGamesPlatform.services  // Access all services
window.babyGamesPlatform.currentGame  // Current running game
gameRegistry.listGames()  // List all registered games
```

## 🎨 Customization

### Colors & Theme

Edit `styles/main.css` `:root` section:

```css
:root {
  --primary-pink: #ff6b9d;
  --primary-blue: #4ecdc4;
  --primary-yellow: #ffe66d;
  /* ... more colors ... */
}
```

### Fonts

Default: `Segoe UI` → Change in `styles/main.css`

### Button Sizes

Edit in `styles/main.css`:

```css
--button-size-small: 40px;
--button-size-medium: 60px;
--button-size-large: 80px;
```

## ✅ Testing Checklist

Before deploying:

- [ ] Keyboard input works (A-Z, 0-9)
- [ ] On-screen buttons work on mobile/tablet
- [ ] Audio plays (success/fail sounds)
- [ ] Pictures load correctly
- [ ] Score increments
- [ ] Progress persists (reload page, score still there)
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Works on iPhone/Android
- [ ] Back button returns to launcher
- [ ] No console errors

## 🐛 Troubleshooting

### Audio not playing?

- Check browser console for errors
- Ensure audio files are in correct path
- Try different audio format (MP3 vs OGG)
- Some browsers require user interaction before playing audio (click before testing)

### Images not loading?

- Check file paths in `manifest.json`
- Ensure images are in `assets/images/` directory
- Try different image format (PNG vs JPG)
- Check browser console for 404 errors

### Game not showing?

- Open browser DevTools (F12) → Console tab
- Check for errors
- Verify game is registered in `js/main.js`
- Ensure manifest.json is valid JSON

### Buttons too small on mobile?

- Edit `games/alphabet-learner/styles.css`
- Increase `min-width` and `min-height` of `.char-button`

## 📝 License

This project is open source and free to use and modify.

## ❤️ Notes

Built with love for toddlers and young learners. Simple, colorful, and fun!

---

**Questions or issues?** Check the console (F12) for detailed error messages, or review the code comments for guidance.
