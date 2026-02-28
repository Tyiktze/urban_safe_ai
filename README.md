# **Urban Safe AI**

A modern React + Vite web application aimed at enhancing urban safety through AI‑assisted reporting and interactive map tools.

Urban Safe AI provides users with a real‑time, responsive interface to search for locations, add safety reports, view notifications, and interact with geographic data — all wrapped in a sleek light/dark UI powered by React.

---

## 🚀 Features

✨ **Responsive UI:** Built using React and Vite for fast performance and smooth development experience.
🗺️ **Search & Place Detection:** Integrated place autocomplete for user‑friendly location searching.
📍 **Report Submission:** Users can add reports about urban safety issues directly from the interface.
🔔 **Notifications Panel:** Displays system or user notifications with unread counts and interactive dismissal.
🌙 **Light/Dark Mode:** Theme toggle support to adapt to user preferences.
📱 **Interactive Map Views:** Real‑time maps (placeholder and embedded map components) for visual context.

---

## 🧠 How It Works

At its core, the repository is a React frontend scaffolded with Vite.

The app includes:

* **Header Component:** Search bar, notifications, and action buttons.
* **Map & Report Panels:** UI for displaying current urban safety data and reports.
* **Place Autocomplete:** Wrapped Google Maps place picker for location search (handled through a custom component).
* **Theme Toggle:** Responsive styling variables for day/night mode.

The UI is styled using CSS custom properties and designed for flexibility across devices.

---

## 🛠️ Getting Started

### **Prerequisites**

Make sure you have the following installed:

✔️ Node.js (v14+)
✔️ npm or yarn

---

### **Installation**

1. Clone the repository:

```bash
git clone https://github.com/Tyiktze/urban_safe_ai.git
cd ./urban_safe_ai
```

2. Install dependencies:

```bash
npm install
```

or

```bash
yarn
```

---

### **Running Locally**

Start the development server:

```bash
npm run dev
```

or

```bash
yarn dev
```

Open your browser and navigate to your local dev server (usually `http://localhost:5173`).

---

## 📦 Project Structure

```
urban_safe_ai/
├── public/
├── src/
│   ├── components/   # Reusable React components
│   ├── styles/       # Theme + layout CSS
│   └── App.jsx       # Main application entry
├── .env              # Environment variables
├── package.json
├── vite.config.js
└── README.md
```

---

# 🔐 Environment Variables Setup

This project requires several API keys and configuration values to function properly.

Create a `.env` file in the root of your project and add the following variables (Or replace the existing one with keys):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

VITE_GOOGLE_MAPS_API_KEY=
VITE_GEMINI_API_KEY=
VITE_OPENWEATHER_API_KEY=

VITE_FUNCTIONS_BASE_URL=
```

---

## 🔥 Firebase Configuration

Obtain from: **Firebase**

### Steps:

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project.
3. Click **Project Settings** (⚙️ icon).
4. Under **Your Apps**, register a Web App.
5. Firebase will generate a config object containing:

   * `apiKey`
   * `authDomain`
   * `projectId`
   * `storageBucket`
   * `messagingSenderId`
   * `appId`
   * `measurementId`

Copy those values into your `.env`.

---

## 🗺️ Google Maps API Key

Obtain from: **Google Cloud Platform**

### Steps:

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project.
3. Enable:

   * Maps JavaScript API
   * Places API (if using autocomplete)
4. Go to **APIs & Services → Credentials**
5. Create an API Key.
6. Restrict the key to:

   * HTTP referrers (recommended)
   * Only required APIs

Paste into:

```
VITE_GOOGLE_MAPS_API_KEY=
```

---

## 🤖 Gemini AI API Key

Obtain from: **Google AI Studio**

### Steps:

1. Visit [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google.
3. Go to **API Keys**
4. Create a new API key.

Paste into:

```
VITE_GEMINI_API_KEY=
```

---

## 🌦️ OpenWeatherMap API Key

Obtain from: **OpenWeather**

### Steps:

1. Go to [https://openweathermap.org/api](https://openweathermap.org/api)
2. Create a free account.
3. Navigate to **My API Keys**
4. Generate a key.

Paste into:

```
VITE_OPENWEATHER_API_KEY=
```

---

## ☁️ Firebase Cloud Functions Base URL

After deploying functions using:

```bash
firebase deploy --only functions
```

You will get a URL like:

```
https://us-central1-your_project_id.cloudfunctions.net
```

Set:

```
VITE_FUNCTIONS_BASE_URL=https://us-central1-your_project_id.cloudfunctions.net
```

---

# ⚠️ Security Notes

* Never commit `.env` files.
* Add `.env` to `.gitignore`.
* Restrict API keys in Google Cloud.
* Consider using different keys for development and production.

---

## 🎨 Theming & UI Notes

The app uses CSS variables (`:root`) to define light and dark theme values like background, text colors, and map UI styles — easily toggled using class names on the root container.

---

## 🧩 Contributing

Contributions are welcome! Here’s how you can help:

1. Fork the repository.
2. Create a new branch (e.g., `feature/add‑map‑filters`).
3. Commit your changes with clear messages.
4. Open a pull request for review.

---

## 🤝 License

Distributed under the *MIT License*. See the **LICENSE** file for more details.

---

## ❓ Questions / Feedback

Have ideas or suggestions? Open an issue or start a discussion!

## Firebase Setup

### Steps for firebase keys:

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create or select a project.
3. Click **Project Settings** (⚙️ icon).
4. Under **Your Apps**, register a Web App.
5. Firebase will generate a config object containing:

   * `apiKey`
   * `authDomain`
   * `projectId`
   * `storageBucket`
   * `messagingSenderId`
   * `appId`
   * `measurementId`

Copy those values into your `.env`.

### Steps for firebase aunthentication:

1. Go to Firebase Console https://console.firebase.google.com
2. Click Add Project
3. Enter project name
4. Disable Google Analytics (optional)
5. Click Create Project

### database explain:

1. users
    * avatar
    * created_at
    * email
    * joined_communities
    * reputation_score
    * role
    * updated_at
    * username
    
2. reports
    * areaName
    * audienceIds
    * category
    * createdAt
    * description
    * images
    * isClassifying
    * isFake
    * isPublic
    * isSolved
    * isUserMade
    * location
    * locationName
    * radius
    * severity
    * status
    * timestamp
    * title
    * updated_at
    * user_id

3. notifications
    * created_at
    * is_read
    * message
    * type
    * user_id

4. settings
    * dark_mode
    * map_style
    * notif_toggle
    * user_id

5. communities
    * color
    * created_at
    * description
    * isPrivate
    * location
    * memberCount
    * name
    * ownerId
    * tag

6. post_reports
    * post_id
    * reporter_id
    * timestamp
    
7. community_posts
    * author
    * avatar
    * category
    * comments
    * communityColor
    * communityId
    * communityName
    * content
    * dislikedBy
    * image
    * likedBy
       * 0
       * 1
    * likes
    * location
    * severity
    * timestamp
    * type

8. comments
    * author
    * report_id
    * text
    * timestamp
    * user_id

9. comment_reports
    * comment_id
    * reporter_id
    * timestamp
