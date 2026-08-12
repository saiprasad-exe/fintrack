// ─────────────────────────────────────────────────────────────────────────────
//  src/views/AIAdvisor.jsx
//  AI Financial Advisor powered by Google Gemini API
//  Sends anonymized transaction summary for personalized advice
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { INCOME_CATS, fmt } from "../services/constants";
import { GoogleGenAI } from "@google/genai";

// ── Paste your Gemini API key here (get free key at aistudio.google.com) ────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log("Gemini Key:", GEMINI_API_KEY);

// Build a compact financial summary to send as context
function buildContext(transactions) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totals = transactions.reduce(
    (acc, t) => {
      if (INCOME_CATS.has(t.category)) acc.income += t.amount;
      else { acc.expense += t.amount; acc.cats[t.category] = (acc.cats[t.category] || 0) + t.amount; }
      return acc;
    },
    { income: 0, expense: 0, cats: {} }
  );

  const thisMonth = transactions
    .filter((t) => t.date?.startsWith(currentMonth))
    .reduce((acc, t) => {
      if (INCOME_CATS.has(t.category)) acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });

  const topCats = Object.entries(totals.cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}: ₹${Math.round(v)}`)
    .join(", ");

  return `
User's financial snapshot (all amounts in INR):
- Total transactions: ${transactions.length}
- Total income (all time): ₹${Math.round(totals.income)}
- Total expenses (all time): ₹${Math.round(totals.expense)}
- Net savings (all time): ₹${Math.round(totals.income - totals.expense)}
- This month income: ₹${Math.round(thisMonth.income)}
- This month expenses: ₹${Math.round(thisMonth.expense)}
- Top expense categories: ${topCats || "none yet"}
- Savings rate: ${totals.income > 0 ? ((totals.income - totals.expense) / totals.income * 100).toFixed(1) : 0}%
`.trim();
}

const SUGGESTIONS = [
  "How can I improve my savings rate?",
  "Where am I overspending?",
  "Give me a monthly budget plan",
  "How do I build an emergency fund?",
  "Tips to reduce my top expense category",
  "Am I on track financially?",
];

export default function AIAdvisor() {
  const { T } = useTheme();
  const { transactions } = useApp();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm your AI Financial Advisor. I've analyzed your transaction history and I'm ready to give you personalized advice.\n\nI can see you have **${transactions.length} transactions** recorded. Ask me anything about your finances!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

const send = async (text) => {
  const userMsg = text || input.trim();

  if (!userMsg || loading) return;

  setInput("");
  setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
  setLoading(true);

  try {
    if (!GEMINI_API_KEY) {
      const demo = getDemoResponse(userMsg, transactions);
      setMessages((prev) => [...prev, { role: "assistant", content: demo }]);
      setLoading(false);
      return;
    }

    const context = buildContext(transactions);

    const prompt = `
You are an expert personal financial advisor.

Below is the user's financial summary.

${context}

Answer the user's question using ONLY this information whenever possible.
Be practical, concise and give actionable suggestions.

User Question:
${userMsg}
`;

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const response = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: prompt,
});

const reply = response.text;

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: reply,
      },
    ]);
  } catch (err) {
    console.error(err);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `❌ ${err.message}`,
      },
    ]);
  }

  setLoading(false);
};

  // Demo responses when no API key is set
  function getDemoResponse(msg, txns) {
    const lower = msg.toLowerCase();
    const totals = txns.reduce((acc, t) => {
      if (INCOME_CATS.has(t.category)) acc.income += t.amount;
      else { acc.expense += t.amount; acc.cats[t.category] = (acc.cats[t.category] || 0) + t.amount; }
      return acc;
    }, { income: 0, expense: 0, cats: {} });
    const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income * 100).toFixed(1) : 0;
    const topCat = Object.entries(totals.cats).sort((a, b) => b[1] - a[1])[0];

    if (lower.includes("savings") || lower.includes("save")) {
      return `Your current savings rate is **${savingsRate}%**. A healthy target is 20-30%.\n\n**Quick wins:**\n- Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings\n- Automate a fixed transfer to savings on salary day\n- Your biggest expense category is **${topCat?.[0] || "unknown"}** — even a 10% cut there would meaningfully boost savings\n\n*(Add your Gemini API key for personalized AI advice!)*`;
    }
    if (lower.includes("budget")) {
      return `Based on your spending patterns, here's a suggested monthly budget:\n\n- **Income target:** ${fmt(totals.income / Math.max(1, txns.length / 10))}/month\n- **Essentials (50%):** Housing, Food, Transport\n- **Discretionary (30%):** Entertainment, Shopping\n- **Savings/Investments (20%):** Emergency fund first, then SIPs\n\nTrack against the Budget Planner tab to stay on course!\n\n*(Add your Gemini API key for personalized AI advice!)*`;
    }
    if (lower.includes("emergency") || lower.includes("fund")) {
      return `An emergency fund should cover **3-6 months of expenses**.\n\n**Your estimated monthly expenses:** ${fmt(totals.expense / Math.max(1, txns.length / 10))}\n**Target emergency fund:** ${fmt((totals.expense / Math.max(1, txns.length / 10)) * 6)}\n\nKeep it in a high-yield savings account or liquid mutual fund. Use the Savings Goals tab to track your progress!\n\n*(Add your Gemini API key for personalized AI advice!)*`;
    }
    return `Based on your ${txns.length} transactions, your net savings are **${fmt(totals.income - totals.expense)}** with a savings rate of **${savingsRate}%**.\n\nFor personalized AI advice, add your free Gemini API key at [aistudio.google.com](https://aistudio.google.com) into the \`GEMINI_API_KEY\` variable in \`src/views/AIAdvisor.jsx\`.`;
  }

  const R = Math.min(T.radius * 0.6, 10);

  // Markdown-lite renderer (bold, newlines, bullets)
  const renderText = (text) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={i} style={{ marginBottom: line === "" ? 8 : 0 }}>
          {parts.map((p, j) =>
            p.startsWith("**") && p.endsWith("**")
              ? <strong key={j}>{p.slice(2, -2)}</strong>
              : p
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", minHeight: 500 }}>

      {/* Header */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 28 }}>🤖</div>
        <div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>AI Financial Advisor</div>
          <div style={{ color: T.muted, fontSize: 12 }}>
            Powered by Gemini · Analyzing {transactions.length} transactions ·{" "}
            {!GEMINI_API_KEY
              ? <span style={{ color: "#f59e0b" }}>⚠ Demo mode — add API key for full AI</span>
              : <span style={{ color: T.green }}>✓ AI active</span>
            }
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "75%",
              background: m.role === "user" ? T.accent : T.card,
              border: `1px solid ${m.role === "user" ? "transparent" : T.border}`,
              borderRadius: T.radius,
              padding: "12px 16px",
              color: m.role === "user" ? "#fff" : T.text,
              fontSize: 14,
              lineHeight: 1.6,
            }}>
              {renderText(m.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: "12px 20px", color: T.muted, fontSize: 14 }}>
              <span style={{ animation: "pulse 1s infinite" }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length <= 2 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 99, color: T.textDim, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask anything about your finances…"
          style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: R, color: T.text, padding: "12px 16px", fontSize: 14, outline: "none", fontFamily: T.sans }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? T.muted : T.accent, border: "none", borderRadius: R, color: "#fff", padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
