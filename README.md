# 💰 FinTrack — Financial Portfolio & Expense Tracker

A production-grade React + Firebase app with real-time sync, auth, charts, CSV/PDF export, and full theme customisation.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + Vite |
| Charts | Recharts |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Styling | Inline styles with dynamic theme tokens |

---

## Project Structure

```
fintrack/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                  # App entry point
    ├── App.jsx                   # Root: providers + auth gate + navbar
    ├── context/
    │   ├── ThemeContext.jsx       # Theme presets, accent, font, radius
    │   ├── AuthContext.jsx        # Firebase Auth (email + Google)
    │   └── AppContext.jsx         # Firestore CRUD, CSV import/export, analytics
    ├── components/
    │   ├── UI.jsx                 # Toast, StatCard, ChartCard
    │   ├── AddModal.jsx           # Add transaction modal
    │   └── ThemePanel.jsx         # Theme customisation side panel
    ├── views/
    │   ├── AuthScreen.jsx         # Sign in / Sign up / Reset password
    │   ├── Dashboard.jsx          # Charts and recent activity
    │   └── Transactions.jsx       # Table with filters, sort, import/export
    └── services/
        ├── firebase.js            # Firebase init (paste config here)
        └── constants.js           # Categories, palette, formatters
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Firebase project
1. Go to https://console.firebase.google.com
2. Create a new project
3. Add a **Web App** → copy the config object

### 3. Paste Firebase config
Open `src/services/firebase.js` and replace the placeholder values:
```js
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 4. Enable Authentication
Firebase Console → **Authentication** → Sign-in method → Enable:
- ✅ Email/Password
- ✅ Google

### 5. Create Firestore Database
Firebase Console → **Firestore Database** → Create database (production mode)

Then go to the **Rules** tab and paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/transactions/{txnId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

### 6. Run the app
```bash
npm run dev
```

---

## Features

- **Auth**: Email/password sign-up, Google sign-in, forgot password
- **Dashboard**: Balance/income/expense cards, monthly trend line chart, expense pie chart, spending bar chart, recent activity feed
- **Transactions**: Sortable table, search + filter by category/type, delete
- **Import**: Upload a `.csv` file (`Date, Description, Category, Amount`)
- **Export**: Download `.csv` or print-ready PDF report
- **Themes**: 6 presets (Dark, Light, Ocean, Solarized, Rose, Forest), custom accent color picker, 5 fonts, border radius slider
- **Sync**: All data stored in Firestore, synced in real-time across devices

---

## CSV Import Format

```csv
Date,Description,Category,Amount
2025-07-01,Rent,Housing,15000
2025-07-02,Groceries,Food,3200
2025-07-03,Salary,Salary,60000
```

Valid categories: `Food, Transport, Housing, Health, Entertainment, Shopping, Salary, Freelance, Other`
