# **Urban Safe AI**

A modern React + Vite web application aimed at enhancing urban safety through AI‑assisted reporting and interactive map tools.

Urban Safe AI provides users with a real‑time, responsive interface to search for locations, add safety reports, view notifications, and interact with geographic data — all wrapped in a sleek light/dark UI powered by React. ([GitHub][1])

---

## 🚀 Features

✨ **Responsive UI:** Built using React and Vite for fast performance and smooth development experience. ([GitHub][1])
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
cd urban_safe_ai
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

## ⚙️ Config & Environment

Create a `.env` file in the root if needed to store:

```
VITE_MAPS_API_KEY=your_google_maps_api_key
```

For integration with Google Places autocomplete or maps, your API key should have the appropriate Places API enabled.

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

---

If you want, I can help you:

✅ Create badges (build, license, version)
✅ Add screenshots & demo GIFs
✅ Add usage examples or live deployment instructions

Just tell me! 🫡

[1]: https://github.com/Tyiktze/urban_safe_ai "GitHub - Tyiktze/urban_safe_ai: yes"
