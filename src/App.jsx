import { useState } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";

import AuthScreen from "./views/AuthScreen";
import Dashboard from "./views/Dashboard";
import Transactions from "./views/Transactions";

// NEW FEATURES
import BudgetPlanner from "./views/BudgetPlanner";
import SavingsGoals from "./views/SavingsGoals";
import InvestmentPortfolio from "./views/InvestmentPortfolio";
import Analytics from "./views/Analytics";
import AIAdvisor from "./views/AIAdvisor";

import AddModal from "./components/AddModal";
import ThemePanel from "./components/ThemePanel";
import { Toast } from "./components/UI";

function LoadingScreen() {
  const { T } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h1>💰 FinTrack</h1>
      <p>Loading...</p>
    </div>
  );
}

function AppShell() {
  const { T } = useTheme();
  const { user, signOut } = useAuth();

  const [view, setView] = useState("dashboard");
  const [addOpen, setAddOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const navBtn = (id, title) => (
    <button
      key={id}
      onClick={() => setView(id)}
      style={{
        background: view === id ? T.accent : "transparent",
        color: view === id ? "#fff" : T.text,
        border: "none",
        padding: "8px 14px",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {title}
    </button>
  );

  return (
    <AppProvider>
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          color: T.text,
          fontFamily: T.sans,
        }}
      >
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "16px 24px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <h2 style={{ marginRight: 20 }}>💰 FinTrack</h2>

          {navBtn("dashboard", "Dashboard")}
          {navBtn("transactions", "Transactions")}
          {navBtn("budget", "Budget")}
          {navBtn("goals", "Goals")}
          {navBtn("portfolio", "Portfolio")}
          {navBtn("analytics", "Analytics")}
          {navBtn("ai", "AI Advisor")}

          <div style={{ flex: 1 }} />

          <button onClick={() => setThemeOpen(true)}>
            🎨 Theme
          </button>

          <button onClick={() => setAddOpen(true)}>
            + Add
          </button>

          <button onClick={signOut}>
            Sign Out
          </button>
        </nav>

        <main
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: 24,
          }}
        >
          {view === "dashboard" && <Dashboard />}

          {view === "transactions" && <Transactions />}

          {view === "budget" && <BudgetPlanner />}

          {view === "goals" && <SavingsGoals />}

          {view === "portfolio" && <InvestmentPortfolio />}

          {view === "analytics" && <Analytics />}

          {view === "ai" && <AIAdvisor />}
        </main>

        <AddModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
        />

        <ThemePanel
          open={themeOpen}
          onClose={() => setThemeOpen(false)}
        />

        <Toast />
      </div>
    </AppProvider>
  );
}

function AuthGate() {
  const { user } = useAuth();

  if (user === undefined) {
    return <LoadingScreen />;
  }

  return user ? <AppShell /> : <AuthScreen />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}