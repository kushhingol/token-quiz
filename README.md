# 🎮 Token Betting Quiz Game

> A real-time, multiplayer quiz game where teams bet tokens on their answers. Features a stunning retro 8-bit arcade aesthetic with synchronized gameplay, live leaderboards, and engaging sound effects.

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

![Token Quiz Banner](https://via.placeholder.com/800x200/1a1a2e/00ff88?text=🎮+TOKEN+BETTING+QUIZ+🪙)

## 📖 Overview

Token Betting Quiz is an interactive, real-time multiplayer quiz application designed for team-based competitions. Teams register, get approved by an admin, and compete by answering questions while strategically betting their tokens. The game features:

- **Real-time synchronization** - All teams see the same question at the exact same moment
- **Strategic betting** - Risk more tokens for bigger rewards
- **Live leaderboards** - Watch rankings update instantly
- **Retro arcade theme** - Nostalgic 8-bit/16-bit visual design with chiptune sounds
- **Mobile-first design** - Works seamlessly on all devices

---

## ✨ Key Features

| Feature                  | Description                                       |
| ------------------------ | ------------------------------------------------- |
| 🪙 **Token Betting**     | Bet 25, 50, 100, or 200 tokens per question       |
| ⏱️ **Synced Timers**     | 60-second countdown synchronized across all teams |
| 🏆 **Live Leaderboard**  | Real-time ranking updates                         |
| 📱 **Responsive Design** | Mobile-first, works on all screen sizes           |
| 🎨 **Retro Theme**       | 8-bit arcade aesthetic with neon colors           |
| 🔊 **Sound Effects**     | Retro chiptune sounds and background music        |
| 🌙 **Dark/Light Mode**   | Toggle between themes                             |
| ⚙️ **Configurable**      | Easily adjust questions, tokens, and timing       |
| 👥 **Admin Dashboard**   | Approve teams, control game flow, view analytics  |

---

## 🎯 Game Mechanics

| Setting           | Value                            |
| ----------------- | -------------------------------- |
| Total Questions   | 30 (configurable)                |
| Initial Tokens    | 3,000                            |
| Betting Options   | 25, 50, 100, 200                 |
| Time per Question | 60 seconds                       |
| Correct Answer    | Double your bet (+100% profit)   |
| Wrong Answer      | Lose your bet                    |
| No Answer/Timeout | No gain, no loss                 |
| Tiebreaker        | Fastest cumulative response time |

---

## 🏗️ Architecture

### Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + TypeScript + Vite + CSS3                        │
│  • Real-time state management with React Context            │
│  • Web Audio API for retro sound effects                    │
│  • Responsive mobile-first design                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                          │
│  Firestore (Real-time Database)                             │
│  • Real-time listeners for game state sync                  │
│  • Security rules for data protection                       │
│  • Anonymous authentication for teams                       │
└─────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
token-betting-quiz/
├── packages/
│   ├── web/                    # React Frontend Application
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   │   ├── layout/     # Header, Footer
│   │   │   │   └── ui/         # Loading screens, buttons
│   │   │   ├── pages/          # Route pages
│   │   │   │   ├── admin/      # Admin dashboard pages
│   │   │   │   └── *.tsx       # Team-facing pages
│   │   │   ├── contexts/       # React Context providers
│   │   │   │   ├── GameContext # Game state management
│   │   │   │   ├── SoundContext# Audio management
│   │   │   │   └── ThemeContext# Theme management
│   │   │   ├── services/       # Firebase service layer
│   │   │   └── styles/         # Global CSS & theme
│   │   └── public/             # Static assets
│   │
│   └── shared/                 # Shared TypeScript utilities
│       ├── types/              # Type definitions
│       ├── constants/          # Game constants
│       └── utils/              # Helper functions
│
├── firebase/
│   ├── firestore.rules         # Security rules
│   ├── firestore.indexes.json  # Database indexes
│   └── firebase.json           # Firebase configuration
│
├── data/
│   └── questions.json          # 30-question bank
│
└── config/
    └── game-config.json        # Game settings (configurable)
```

### Data Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Teams   │────▶│ Firebase │◀────│    Admin     │
│ (Players)│     │ Firestore│     │  Dashboard   │
└──────────┘     └──────────┘     └──────────────┘
     │                │                   │
     │    Real-time   │    Real-time      │
     │    Listeners   │    Listeners      │
     ▼                ▼                   ▼
┌──────────────────────────────────────────────┐
│           Synchronized Game State            │
│  • Current question index                    │
│  • Timer start timestamp                     │
│  • Team responses & scores                   │
│  • Live leaderboard rankings                 │
└──────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Firebase account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/token-betting-quiz.git
cd token-betting-quiz

# Install dependencies
pnpm install

# Set up environment variables
cp packages/web/.env.example packages/web/.env
# Edit .env with your Firebase config

# Start development server
pnpm dev
```

📚 **For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

---

## 🎮 How to Play

### For Teams

1. **Register** - Enter team name, leader, and members
2. **Wait** - Stay in the waiting room until admin approves
3. **Play** - Answer questions within 60 seconds
4. **Bet** - Choose how many tokens to risk (25, 50, 100, or 200)
5. **Win** - Correct answers double your bet!

### For Admins

1. Navigate to `/admin` to access the dashboard
2. Review and approve pending team registrations
3. Click "Start Game" to begin the quiz
4. Monitor the live leaderboard in real-time

---

## 🛠️ Configuration

### Game Settings

Edit `config/game-config.json` to customize:

```json
{
  "game": {
    "totalQuestions": 30,
    "questionTimeSeconds": 60,
    "initialTokenBalance": 3000,
    "bettingOptions": [25, 50, 100, 200],
    "payoutMultiplier": 2
  }
}
```

### Adding Questions

Edit `data/questions.json`:

```json
{
  "index": 1,
  "text": "Your question here?",
  "options": {
    "A": "Option A",
    "B": "Option B",
    "C": "Option C",
    "D": "Option D"
  },
  "correctAnswer": "B",
  "category": "Category Name"
}
```

---

## 🎨 Theme Customization

The retro theme uses CSS custom properties in `packages/web/src/styles/global.css`:

```css
:root {
  --color-primary: #00ff88; /* Neon green */
  --color-secondary: #ff6b6b; /* Coral red */
  --color-accent: #ffd93d; /* Gold */
  --color-neon: #00d4ff; /* Cyan */
  --font-retro: "Press Start 2P", cursive;
}
```

---

## 📦 Deployment

### Firebase Hosting

```bash
# Build the web app
pnpm build

# Deploy to Firebase
cd firebase
firebase deploy
```

---

## 🔒 Security

- Anonymous authentication for teams
- Firestore security rules prevent unauthorized access
- Teams can only submit one response per question
- Questions are only visible during active games
- Admin actions require admin privileges

---

## 📊 Question Bank

The included 30-question bank covers:

- **Frontend Rollback Procedures** (10 questions)
- **Severity Levels & Incident Classification** (10 questions)
- **Feature Tiers, Postmortems & SLAs** (10 questions)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use this for your own quiz games!

---

## 👨‍💻 Author

**Designed, Engineered & Coded with ❤️ by [Kush Hingol](https://www.linkedin.com/in/kush-hingol/)**

---

## 🔗 Links

- [Setup Guide](./SETUP_GUIDE.md)
- [Firebase Console](https://console.firebase.google.com)
- [React Documentation](https://react.dev)
