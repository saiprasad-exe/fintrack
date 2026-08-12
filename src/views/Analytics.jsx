// ─────────────────────────────────────────────────────────────────────────────
//  src/views/Analytics.jsx
//  Advanced analytics: 12-month trend, forecast, daily heatmap, top merchants,
//  savings rate trend, net worth over time, category YoY comparison
// ─────────────────────────────────────────────────────────────────────────────

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  AreaChart, Area, Cell,
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { ChartCard } from "../components/UI";
import { INCOME_CATS, fmt } from "../services/constants";

// Simple linear regression for forecasting
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept, predict: (x) => Math.max(0, slope * x + intercept) };
}

export default function Analytics() {
  const { T } = useTheme();
  const { transactions } = useApp();

  const ttip = {
    contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text },
    formatter: (v) => fmt(v),
  };

  // ── Build 12-month history ────────────────────────────────────────────────
  const now = new Date();
  const monthKeys = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      idx: 12 - i,
    });
  }

  const monthMap = {};
  monthKeys.forEach(({ key, label, idx }) => {
    monthMap[key] = { label, idx, income: 0, expense: 0, savings: 0 };
  });

  transactions.forEach((t) => {
    const key = t.date?.slice(0, 7);
    if (!monthMap[key]) return;
    if (INCOME_CATS.has(t.category)) monthMap[key].income += t.amount;
    else monthMap[key].expense += t.amount;
  });

  const history = Object.values(monthMap).map((m) => ({
    ...m,
    savings: m.income - m.expense,
    savingsRate: m.income > 0 ? ((m.income - m.expense) / m.income) * 100 : 0,
  }));

  // ── Forecast next 3 months (linear regression on expenses) ───────────────
  const expensePoints = history
    .filter((m) => m.expense > 0)
    .map((m, i) => ({ x: i, y: m.expense }));

  const incomePoints = history
    .filter((m) => m.income > 0)
    .map((m, i) => ({ x: i, y: m.income }));

  const expReg = linearRegression(expensePoints);
  const incReg = linearRegression(incomePoints);

  const forecast = [1, 2, 3].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const x = history.length + offset - 1;
    return {
      label,
      forecastExpense: expReg ? expReg.predict(x) : null,
      forecastIncome: incReg ? incReg.predict(x) : null,
    };
  });

  const combinedTrend = [
    ...history.map((m) => ({ label: m.label, income: m.income || null, expense: m.expense || null })),
    ...forecast.map((f) => ({ label: f.label, forecastExpense: f.forecastExpense, forecastIncome: f.forecastIncome })),
  ];

  // ── Top 5 spending categories (all time) ─────────────────────────────────
  const catTotals = Object.entries(
    transactions
      .filter((t) => !INCOME_CATS.has(t.category))
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // ── Daily spending heatmap (last 30 days) ────────────────────────────────
  const dailySpend = {};
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 29);
  transactions.forEach((t) => {
    const d = new Date(t.date);
    if (!INCOME_CATS.has(t.category) && d >= thirtyDaysAgo) {
      dailySpend[t.date] = (dailySpend[t.date] || 0) + t.amount;
    }
  });

  const heatmapDays = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    heatmapDays.push({ date: key, amount: dailySpend[key] || 0, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) });
  }
  const maxDaily = Math.max(...heatmapDays.map((d) => d.amount), 1);

  // ── Net worth over time (cumulative) ─────────────────────────────────────
  let cumulative = 0;
  const netWorthTrend = history.map((m) => {
    cumulative += m.savings;
    return { label: m.label, netWorth: cumulative };
  });

  // ── Avg monthly income / expense ─────────────────────────────────────────
  const activeMonths = history.filter((m) => m.income > 0 || m.expense > 0);
  const avgIncome = activeMonths.length ? activeMonths.reduce((a, m) => a + m.income, 0) / activeMonths.length : 0;
  const avgExpense = activeMonths.length ? activeMonths.reduce((a, m) => a + m.expense, 0) / activeMonths.length : 0;
  const avgSavings = avgIncome - avgExpense;

  // ── Insights ──────────────────────────────────────────────────────────────
  const insights = [];
  if (avgSavings > 0) insights.push(`💚 You save an average of ${fmt(avgSavings)} per month.`);
  if (avgIncome > 0) insights.push(`📊 Average savings rate: ${((avgSavings / avgIncome) * 100).toFixed(1)}%.`);
  if (expReg?.slope > 0) insights.push(`⚠️ Your expenses are trending up by ~${fmt(expReg.slope)}/month.`);
  if (expReg?.slope < 0) insights.push(`✅ Your expenses are trending down — great work!`);
  const forecastedExp = expReg ? expReg.predict(history.length + 1) : null;
  if (forecastedExp) insights.push(`📅 Next month forecast: ~${fmt(forecastedExp)} in expenses.`);
  if (catTotals[0]) insights.push(`🏷 Biggest spend category: ${catTotals[0].name} (${fmt(catTotals[0].value)} total).`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "Avg Monthly Income", value: avgIncome, color: T.green },
          { label: "Avg Monthly Expense", value: avgExpense, color: T.red },
          { label: "Avg Monthly Savings", value: avgSavings, color: avgSavings >= 0 ? T.accent : T.red },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: "18px 22px", flex: 1, minWidth: 160 }}>
            <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <div style={{ color, fontSize: 22, fontWeight: 700, fontFamily: T.mono }}>{fmt(value)}</div>
          </div>
        ))}
      </div>

      {/* AI-style insights */}
      {insights.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20 }}>
          <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>📊 Key Insights</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ color: T.text, fontSize: 14, padding: "8px 12px", background: T.surface, borderRadius: T.radius * 0.6, borderLeft: `3px solid ${T.accent}` }}>
                {ins}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12-month trend + 3-month forecast */}
      <ChartCard title="12-Month Trend + 3-Month Forecast" empty={history.every(m => !m.income && !m.expense) ? "No data yet" : null}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={combinedTrend}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...ttip} />
            <Legend wrapperStyle={{ color: T.textDim, fontSize: 12 }} />
            <ReferenceLine x={history[history.length - 1]?.label} stroke={T.border} strokeDasharray="4 4" label={{ value: "Today", fill: T.muted, fontSize: 10 }} />
            <Line type="monotone" dataKey="income" stroke={T.green} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="expense" stroke={T.red} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="forecastIncome" stroke={T.green} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast Income" connectNulls />
            <Line type="monotone" dataKey="forecastExpense" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast Expense" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Net worth + savings rate */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ChartCard title="Cumulative Net Worth" empty={netWorthTrend.every(m => !m.netWorth) ? "No data" : null}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={netWorthTrend}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={T.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...ttip} />
              <Area type="monotone" dataKey="netWorth" stroke={T.accent} fill="url(#nwGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Savings Rate (%)" empty={history.every(m => !m.income) ? "No data" : null}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={history}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} formatter={(v) => `${v.toFixed(1)}%`} />
              <ReferenceLine y={0} stroke={T.border} />
              <Bar dataKey="savingsRate" radius={[3, 3, 0, 0]} name="Savings Rate">
                {history.map((m, i) => <Cell key={i} fill={m.savingsRate >= 0 ? T.green : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top categories bar */}
      <ChartCard title="Top Expense Categories (All Time)" empty={catTotals.length === 0 ? "No data" : null}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={catTotals} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fill: T.text, fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip {...ttip} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={T.accent} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Daily heatmap */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20 }}>
        <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
          Daily Spending — Last 30 Days
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {heatmapDays.map((d) => {
            const intensity = d.amount / maxDaily;
            const bg = d.amount === 0 ? T.surface : `rgba(239,68,68,${0.15 + intensity * 0.75})`;
            return (
              <div key={d.date} title={`${d.label}: ${fmt(d.amount)}`}
                style={{ width: 28, height: 28, borderRadius: 4, background: bg, cursor: "default", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, color: intensity > 0.5 ? "#fff" : T.muted }}>{new Date(d.date).getDate()}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <span style={{ color: T.muted, fontSize: 11 }}>Low</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
            <div key={v} style={{ width: 16, height: 16, borderRadius: 3, background: `rgba(239,68,68,${0.15 + v * 0.75})` }} />
          ))}
          <span style={{ color: T.muted, fontSize: 11 }}>High</span>
        </div>
      </div>
    </div>
  );
}
