<div align="center">

# 💰 FinTrack
### Financial Portfolio & Expense Tracker

<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-Latest-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Firebase-Authentication-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
<img src="https://img.shields.io/badge/Firestore-Realtime-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
<img src="https://img.shields.io/badge/Recharts-Charts-8884D8?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />

---

### 📊 A Modern Personal Finance Dashboard Built with React & Firebase

Track income, expenses, budgets, analytics, and portfolio with beautiful charts, real-time cloud sync, authentication, and customizable themes.

**Built with ❤️ using React + Firebase**

</div>

---

# ✨ Features

## 🔐 Authentication

- Email & Password Login
- Google Sign-In
- Password Reset
- Secure Firebase Authentication
- Persistent Login Session

---

## 💸 Finance Dashboard

- 📈 Balance Overview
- 💰 Income Tracking
- 💳 Expense Tracking
- 📊 Monthly Analytics
- 📅 Recent Transactions
- 📉 Spending Trends

---

## 📊 Interactive Charts

- 📈 Monthly Trend Chart
- 🥧 Expense Distribution
- 📊 Category Spending
- 📉 Income vs Expense

Built with **Recharts**.

---

## 📂 Transaction Management

- Add Transactions
- Edit Transactions
- Delete Transactions
- Search Transactions
- Sort Data
- Category Filters
- Real-time Updates

---

## 📥 Import & Export

- Import CSV
- Export CSV
- Print-ready PDF Report

---

## 🎨 Theme Customization

Choose from beautiful built-in themes.

- 🌙 Dark
- ☀️ Light
- 🌊 Ocean
- 🌅 Solarized
- 🌹 Rose
- 🌲 Forest

Customize

- Accent Color
- Border Radius
- Font Family

---

## ☁️ Cloud Powered

Powered by Firebase.

- Firebase Authentication
- Cloud Firestore
- Real-time Sync
- Multi-device Access
- Secure Rules

---

# 🖼️ Preview

> Replace these images after deployment.

| Dashboard | Transactions |
|-----------|--------------|
| ![](screenshots/dashboard.png) | ![](screenshots/transactions.png) |

| Charts | Theme Panel |
|---------|-------------|
| ![](screenshots/charts.png) | ![](screenshots/theme.png) |

---

# 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| ⚛️ React 18 | Frontend |
| ⚡ Vite | Build Tool |
| 🔥 Firebase Auth | Authentication |
| ☁️ Cloud Firestore | Database |
| 📊 Recharts | Analytics |
| 🎨 CSS | Styling |

---

# 📁 Project Structure

```text
fintrack/
│
├── public/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── services/
│   ├── views/
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── vite.config.js
└── README.md
```

---

# 🚀 Getting Started

## 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/fintrack.git

cd fintrack
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Configure Firebase

Create

```
src/services/firebase.js
```

Paste your Firebase config.

```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

---

## 4️⃣ Enable Firebase Services

### Authentication

Enable

- Email/Password
- Google

---

### Firestore

Create Firestore Database.

Paste rules:

```javascript
rules_version = '2';

service cloud.firestore {

match /databases/{database}/documents {

match /users/{userId}/transactions/{txnId} {

allow read, write:
if request.auth != null
&& request.auth.uid == userId;

}

}

}
```

---

## 5️⃣ Start Development Server

```bash
npm run dev
```

Open

```
http://localhost:5173
```

---

# 📄 CSV Import Format

```csv
Date,Description,Category,Amount

2025-07-01,Rent,Housing,15000

2025-07-02,Groceries,Food,3200

2025-07-03,Salary,Salary,60000
```

Supported Categories

- Food
- Transport
- Housing
- Health
- Entertainment
- Shopping
- Salary
- Freelance
- Other

---

# 🔒 Firestore Security

```javascript
match /users/{userId}/transactions/{txnId} {

allow read, write:

if request.auth != null

&& request.auth.uid == userId;

}
```

---

# 📈 Roadmap

- ✅ Authentication
- ✅ Dashboard
- ✅ Charts
- ✅ CSV Import
- ✅ CSV Export
- ✅ PDF Export
- ✅ Theme Customization
- ✅ Firebase Sync

### Coming Soon

- Budget Planner
- Savings Goals
- Multiple Wallets
- AI Insights
- Notifications
- PWA Support
- Receipt Scanner
- Voice Transactions
- Multi-Currency
- Cloud Functions

---

# 🌟 Why This Project?

This project demonstrates production-ready frontend development using modern technologies.

Highlights include:

- Component-Based Architecture
- React Context API
- Firebase Authentication
- Firestore CRUD
- Real-Time Synchronization
- Interactive Data Visualization
- Responsive UI
- Theme Engine
- CSV & PDF Export
- Clean Code Structure

Perfect for showcasing **React**, **Firebase**, and **Frontend Engineering** skills.

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to your branch
5. Open a Pull Request

---

# 📜 License

Licensed under the **MIT License**.

---

<div align="center">

## ⭐ If you like this project, don't forget to star the repository!

Made with ❤️ by **Your Punyaslok**

</div>
