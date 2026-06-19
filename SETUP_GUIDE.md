# 🚀 Token Betting Quiz - Complete Setup Guide

This guide will walk you through setting up Firebase and running the Token Betting Quiz Game locally.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed ([download here](https://nodejs.org/))
- **pnpm** package manager (recommended)
  ```bash
  npm install -g pnpm
  ```
- A **Google account** for Firebase

---

## 🔥 Step 1: Create a Firebase Project

### 1.1 Go to Firebase Console

1. Open [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project")
3. Enter a project name (e.g., `token-betting-quiz`)
4. Disable Google Analytics (optional, not needed for this app)
5. Click **"Create project"**
6. Wait for the project to be created, then click **"Continue"**

### 1.2 Enable Authentication

1. In the Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Click on **"Anonymous"**
5. Toggle the **"Enable"** switch to ON
6. Click **"Save"**

### 1.3 Create Firestore Database

1. In the Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select a location closest to you (e.g., `us-central1` or `asia-south1`)
5. Click **"Enable"**

---

## 🔑 Step 2: Get Your Firebase Configuration Keys

### 2.1 Register a Web App

1. In the Firebase Console, click the **gear icon ⚙️** next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **web icon `</>`** to add a web app
5. Enter an app nickname (e.g., `token-quiz-web`)
6. **DO NOT** check "Also set up Firebase Hosting" (we'll do this later)
7. Click **"Register app"**

### 2.2 Copy Your Firebase Config

After registering, you'll see a code snippet like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB1234567890abcdefghijklmnop",
  authDomain: "token-betting-quiz.firebaseapp.com",
  projectId: "token-betting-quiz",
  storageBucket: "token-betting-quiz.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

**Keep this page open** - you'll need these values in the next step!

---

## 📁 Step 3: Configure the Project

### 3.1 Navigate to the Project

```bash
cd /Users/kushhingol/Desktop/work-repository/token-betting-quiz
```

### 3.2 Create Environment File

```bash
# Copy the example environment file
cp packages/web/.env.example packages/web/.env
```

### 3.3 Edit the Environment File

Open `packages/web/.env` in your editor and replace the placeholder values with your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyB1234567890abcdefghijklmnop
VITE_FIREBASE_AUTH_DOMAIN=token-betting-quiz.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=token-betting-quiz
VITE_FIREBASE_STORAGE_BUCKET=token-betting-quiz.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**⚠️ Important:** Replace the values above with YOUR actual Firebase config values!

---

## 📦 Step 4: Install Dependencies

```bash
# From the project root directory
cd /Users/kushhingol/Desktop/work-repository/token-betting-quiz

# Install all dependencies
pnpm install
```

If you don't have pnpm, you can use npm:

```bash
npm install
```

---

## 🏃 Step 5: Run the Development Server

```bash
# Start the development server
pnpm dev
```

Or with npm:

```bash
npm run dev
```

The app should now be running at: **http://localhost:5173**

---

## 🔒 Step 6: Deploy Firestore Security Rules (Optional but Recommended)

### 6.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 6.2 Login to Firebase

```bash
firebase login
```

### 6.3 Initialize Firebase in the Project

```bash
cd /Users/kushhingol/Desktop/work-repository/token-betting-quiz/firebase
firebase init
```

When prompted:

- Select **Firestore** (use spacebar to select, enter to confirm)
- Choose **Use an existing project** and select your project
- Accept the default file names for rules and indexes

### 6.4 Deploy Rules

```bash
firebase deploy --only firestore:rules
```

---

## 🎮 Step 7: Test the Application

1. Open **http://localhost:5173** in your browser
2. You should see the retro-themed landing page
3. Click **"JOIN GAME"** to test team registration
4. Click **"ADMIN PANEL"** to access admin features

---

## 📱 Available Routes

| Route                        | Description       |
| ---------------------------- | ----------------- |
| `/`                          | Landing page      |
| `/register`                  | Team registration |
| `/waiting/:gameId/:teamId`   | Waiting room      |
| `/game/:gameId/:teamId`      | Game play         |
| `/results/:gameId`           | Final results     |
| `/admin`                     | Admin dashboard   |
| `/admin/setup`               | Game setup        |
| `/admin/leaderboard/:gameId` | Live leaderboard  |

---

## 🐛 Troubleshooting

### "Cannot find module 'react'" errors

These are TypeScript errors that appear before dependencies are installed. Run:

```bash
pnpm install
```

### Firebase connection errors

1. Check that your `.env` file has the correct values
2. Make sure Authentication and Firestore are enabled in Firebase Console
3. Verify you're using the correct project ID

### Port already in use

If port 5173 is busy, Vite will automatically use the next available port (5174, 5175, etc.)

### CORS errors

Make sure your Firebase project's authorized domains include `localhost`

---

## 🚀 Deployment to Firebase Hosting

When ready to deploy:

```bash
# Build the production app
pnpm build

# Deploy to Firebase Hosting
cd firebase
firebase deploy --only hosting
```

---

## 📞 Need Help?

- Check the [Firebase Documentation](https://firebase.google.com/docs)
- Review the project's `README.md` for more details
- Check the browser console for error messages

---

Happy quizzing! 🎮🪙
