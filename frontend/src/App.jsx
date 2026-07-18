import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Auth from './components/Auth';
import Profile from './components/Profile';
import GoalPlanner from './components/GoalPlanner';
import ScenarioSimulator from './components/ScenarioSimulator';
import FinancialData from './components/FinancialData';
import AIAdvisor from './components/AIAdvisor';
import ReportCenter from './components/ReportCenter';
import FamilyStabilityHub from './components/FamilyStabilityHub';
import { backendApi } from './api/axiosConfig';
import { exportPDF as runExportPDF } from './utils/pdfExport';

const CHART_COLORS = ['#2563EB', '#14B8A6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9'];

// ─── Tooltip style ─────────────────────────────
const TT = { borderRadius: '10px', background: '#ffffff', border: '1px solid #E2E8F0', color: '#0F172A', fontSize: 12, boxShadow: '0 14px 32px rgba(15, 23, 42, 0.12)' };

// ─── KPI Card ─────────────────────────────────
const KPICard = ({ title, value, sub, color = 'text-slate-900', trend, icon, accent = 'bg-slate-100 text-slate-700' }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">{title}</p>
        <p className={`mt-3 text-2xl font-semibold ${color} leading-none`}>{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${accent}`}>{icon}</div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      {trend !== undefined && (
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </span>
      )}
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  </div>
);

// ─── Dashboard ────────────────────────────────
const Dashboard = () => {
  const [summary, setSummary]     = useState(null);
  const [forecast, setForecast]   = useState(null);
  const [aiScore, setAiScore]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [scoring, setScoring]     = useState(false);
  const [forecasting, setForecasting] = useState(false);
  const [error, setError]         = useState('');
  const [exporting, setExporting] = useState(false);
  const [scoreMsg, setScoreMsg]   = useState('');

  const loadSummary = useCallback(async () => {
    try {
      const r = await backendApi.get('/dashboard/summary');
      setSummary(r.data);
    } catch {
      setError('Could not reach the backend. Please ensure the server is running and log in again.');
    }
  }, []);

  const refreshForecast = useCallback(async () => {
    setForecasting(true);
    try { const r = await backendApi.post('/ai/forecast'); setForecast(r.data); } catch {}
    setForecasting(false);
  }, []);

  const refreshScore = useCallback(async () => {
    setScoring(true);
    setScoreMsg('');
    try {
      const r = await backendApi.post('/ai/stability-score');
      setAiScore(r.data);
      await loadSummary(); // refresh sidebar score
      setScoreMsg('✅ AI Score updated!');
      setTimeout(() => setScoreMsg(''), 3000);
    } catch { setScoreMsg('❌ Could not reach AI service.'); }
    setScoring(false);
  }, [loadSummary]);

  const load = useCallback(async () => {
    setLoading(true);
    await loadSummary();
    setLoading(false);
    refreshForecast();
  }, [loadSummary, refreshForecast]);

  useEffect(() => { load(); }, [load]);

  const exportPDF = () => runExportPDF(summary, forecast, setExporting);

  const monthly = summary
    ? Object.entries(summary.monthlyTrend || {}).map(([month, v]) => ({
        month, income: v.income || 0, expense: v.expense || 0,
        cashFlow: (v.income || 0) - (v.expense || 0),
      }))
    : [];

  const pieData  = summary ? Object.entries(summary.expenseByCategory || {}).map(([name, value]) => ({ name, value })) : [];
  const nwData   = monthly.map((d, i) => ({ month: d.month, netWorth: summary ? Math.round(Number(summary.netWorth) * (0.7 + 0.03 * i)) : 0 }));
  const fcData   = forecast?.predictions ? [
    { period: '1M',  income: forecast.predictions.next_1_month.income,  expense: forecast.predictions.next_1_month.expense },
    { period: '3M',  income: forecast.predictions.next_3_months.income, expense: forecast.predictions.next_3_months.expense },
    { period: '6M',  income: forecast.predictions.next_6_months.income, expense: forecast.predictions.next_6_months.expense },
  ] : [];

  const guardianAlert    = forecast?.guardian_alert || summary?.riskAlert || 'Keep reviewing income and expenses monthly.';
  const predictedCashFlow = forecast?.predicted_cash_flow;
  const sc = aiScore?.financial_stability_score ?? summary?.stabilityScore;
  const scoreColor = sc >= 70 ? 'text-emerald-600' : sc >= 40 ? 'text-amber-600' : 'text-rose-600';
  const wx = aiScore?.financial_weather_forecast ?? summary?.weatherForecast;
  const wxEmoji = wx === 'Stable' ? '☀️' : wx === 'Caution' ? '⛅' : '⛈️';
  const sri = aiScore?.shock_resistance_index ?? summary?.shockResistanceIndex ?? 0;
  const savingsRate = aiScore?.savings_rate ?? null;
  const dti = aiScore?.debt_to_income_ratio ?? null;
  const alertColor = guardianAlert?.toLowerCase().includes('high-risk') || guardianAlert?.toLowerCase().includes('projected expenses may')
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : guardianAlert?.toLowerCase().includes('caution')
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (loading) return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/80 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
        <h2 className="text-lg font-semibold text-slate-900">Preparing your workspace</h2>
        <p className="mt-2 text-sm text-slate-500">Syncing your latest financial insights…</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">

      {/* ── Hero Banner ─────────────────────────── */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-800 p-6 text-white shadow-[0_25px_80px_rgba(15,23,42,0.2)] lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-100">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
              AI Wealth Command Center
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Make every financial move feel deliberate and informed.</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">Monitor cash flow, predict risk, and steer your goals with a calm, premium dashboard built for modern families.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={exportPDF} disabled={exporting} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {exporting ? 'Exporting…' : 'Export PDF'}
              </button>
              <button onClick={refreshScore} disabled={scoring} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60">
                <svg className={`h-4 w-4 ${scoring ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {scoring ? 'Calculating…' : 'Refresh AI Score'}
              </button>
              <button onClick={refreshForecast} disabled={forecasting} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60">
                <svg className={`h-4 w-4 ${forecasting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {forecasting ? 'Forecasting…' : 'Run Forecast'}
              </button>
            </div>
            {scoreMsg && <p className="mt-3 text-sm text-cyan-200">{scoreMsg}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-300">AI Score</p>
              <p className={`mt-2 text-3xl font-bold ${sc >= 70 ? 'text-emerald-300' : sc >= 40 ? 'text-amber-300' : 'text-rose-300'}`}>{sc ?? '—'}<span className="text-lg font-normal text-slate-300">/100</span></p>
              <p className="mt-1 text-sm text-slate-300">Stability Index</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-300">AI Outlook</p>
              <p className="mt-2 text-2xl font-semibold text-white">{wxEmoji} {wx || '—'}</p>
              <p className="mt-1 text-sm text-slate-300">Weather Forecast</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-300">Shock Resistance</p>
              <p className="mt-2 text-2xl font-semibold text-white">{Number(sri).toFixed(1)} <span className="text-base font-normal text-slate-300">mo</span></p>
              <p className="mt-1 text-sm text-slate-300">Liquid runway</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-300">Goals Active</p>
              <p className="mt-2 text-2xl font-semibold text-white">{summary?.goalCount ?? '—'}</p>
              <p className="mt-1 text-sm text-slate-300">Being tracked</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Error Banner ─────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {/* ── KPI Row ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KPICard title="Total Income"    value={fmt(summary?.totalIncome)}   sub="All time"     color="text-emerald-600" icon="💰" accent="bg-emerald-50 text-emerald-600" />
        <KPICard title="Total Expenses"  value={fmt(summary?.totalExpense)}  sub="All time"     color="text-rose-600"    icon="💸" accent="bg-rose-50 text-rose-600" />
        <KPICard title="Net Worth"       value={fmt(summary?.netWorth)}      sub="Assets − Liab" color="text-slate-900"   icon="🏦" accent="bg-slate-100 text-slate-700" />
        <KPICard title="Monthly Surplus" value={fmt(summary?.cashFlow)}      sub="Income − Exp"  color={Number(summary?.cashFlow) >= 0 ? 'text-emerald-600' : 'text-rose-600'} icon="📈" accent={Number(summary?.cashFlow) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} />
        <KPICard title="Savings Rate"    value={savingsRate != null ? `${Number(savingsRate).toFixed(1)}%` : '—'} sub="(Income−Exp)/Inc" color={Number(savingsRate) >= 20 ? 'text-emerald-600' : Number(savingsRate) >= 10 ? 'text-amber-600' : 'text-rose-600'} icon="🏦" accent="bg-teal-50 text-teal-600" />
        <KPICard title="Debt-to-Income"  value={dti != null ? `${Number(dti).toFixed(1)}%` : '—'}             sub="Liab / Income"   color={Number(dti) < 30 ? 'text-emerald-600' : Number(dti) < 50 ? 'text-amber-600' : 'text-rose-600'}  icon="📊" accent="bg-purple-50 text-purple-600" />
      </div>

      {/* ── Guardian Alert ───────────────────── */}
      <div className={`flex items-start gap-4 rounded-2xl border p-4 ${alertColor}`}>
        <div className="text-2xl mt-0.5">{guardianAlert?.toLowerCase().includes('high-risk') ? '🚨' : guardianAlert?.toLowerCase().includes('caution') ? '⚠️' : '✅'}</div>
        <div>
          <p className="text-sm font-semibold">Guardian Alert</p>
          <p className="mt-1 text-sm leading-6">{guardianAlert}</p>
        </div>
      </div>

      {/* ── Charts Row 1 ─────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-0 shadow-[0_16px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Income vs Expenses</h2>
            <p className="mt-0.5 text-xs text-slate-500">Monthly comparison — last 12 months</p>
          </div>
          <div className="p-5">
            {monthly.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No monthly data yet. Add income &amp; expenses to see trends.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={60} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TT} formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="income" fill="#2563EB" radius={[6, 6, 0, 0]} name="Income" maxBarSize={28} />
                  <Bar dataKey="expense" fill="#14B8A6" radius={[6, 6, 0, 0]} name="Expense" maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-0 shadow-[0_16px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Cash Flow Trend</h2>
            <p className="mt-0.5 text-xs text-slate-500">Monthly net surplus / deficit</p>
          </div>
          <div className="p-5">
            {monthly.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data available yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="cfG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={60} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TT} formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Area type="monotone" dataKey="cashFlow" stroke="#2563EB" strokeWidth={2.4} fill="url(#cfG)" name="Cash Flow" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ─────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-0 shadow-[0_16px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Expense Breakdown</h2>
            <p className="mt-0.5 text-xs text-slate-500">By category — all time</p>
          </div>
          <div className="p-5">
            {pieData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No expenses recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={84} innerRadius={46} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={TT} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-0 shadow-[0_16px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Net Worth Trajectory</h2>
            <p className="mt-0.5 text-xs text-slate-500">Projected cumulative portfolio value</p>
          </div>
          <div className="p-5">
            {nwData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data available yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={nwData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={70} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TT} formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Line type="monotone" dataKey="netWorth" stroke="#0EA5E9" strokeWidth={2.5} dot={{ r: 3, fill: '#0EA5E9', strokeWidth: 0 }} name="Net Worth" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── AI Forecast Panel ────────────────── */}
      {forecasting && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
          Running ensemble ML forecast (XGBoost + Random Forest + Gradient Boosting + Ridge)…
        </div>
      )}

      {fcData.length > 0 && (
        <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-0 shadow-[0_16px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">🔮 AI Income &amp; Expense Forecast</h2>
              <p className="mt-0.5 text-xs text-slate-500">XGBoost ensemble — projected for next 1, 3, and 6 months. Confidence: {forecast?.confidence_level ? `${(Number(forecast.confidence_level) * 100).toFixed(0)}%` : '—'}</p>
            </div>
            <button onClick={refreshForecast} disabled={forecasting} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50">
              <svg className={`h-3 w-3 ${forecasting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Re-run
            </button>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {fcData.map(item => {
                const surplus = Number(item.income) - Number(item.expense);
                return (
                  <div key={item.period} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-500">{item.period} Forecast</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Income</span>
                        <span className="text-sm font-semibold text-emerald-600">₹{Number(item.income).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Expense</span>
                        <span className="text-sm font-semibold text-rose-600">₹{Number(item.expense).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                        <span className="text-xs font-medium text-slate-600">Surplus</span>
                        <span className={`text-sm font-bold ${surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{surplus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={fcData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={70} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TT} formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="income" fill="#2563EB" radius={[6, 6, 0, 0]} name="Predicted Income" maxBarSize={40} />
                <Bar dataKey="expense" fill="#14B8A6" radius={[6, 6, 0, 0]} name="Predicted Expense" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── AI Stability Score Breakdown ─────── */}
      {aiScore && (
        <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-5 shadow-[0_16px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-lg text-white">🤖</div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">AI Stability Score — Detailed Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Weighted scoring algorithm: Savings Rate + DTI + Net Worth</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Score</p>
              <p className={`mt-1 text-2xl font-bold ${scoreColor}`}>{aiScore.financial_stability_score}/100</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Outlook</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">{wxEmoji} {aiScore.financial_weather_forecast}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Shock Resistance</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">{Number(aiScore.shock_resistance_index || 0).toFixed(1)} months</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly Surplus</p>
              <p className={`mt-1 text-lg font-semibold ${Number(aiScore.monthly_surplus) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{Number(aiScore.monthly_surplus || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          {aiScore.explainable_ai?.logic && (
            <p className="mt-4 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700 leading-6">
              <span className="font-semibold">XAI Logic: </span>{aiScore.explainable_ai.logic}
            </p>
          )}
        </div>
      )}

      {/* ── Projected Cash Flow ──────────────── */}
      {predictedCashFlow && (
        <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-5 shadow-[0_16px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">📊 Projected Cash Flow</h3>
          <p className="text-xs text-slate-500 mb-4">Net surplus forecast based on ML predictions</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Next 1 Month', val: predictedCashFlow.next_1_month },
              { label: 'Next 3 Months', val: predictedCashFlow.next_3_months },
              { label: 'Next 6 Months', val: predictedCashFlow.next_6_months },
            ].map(({ label, val }) => (
              <div key={label} className={`rounded-2xl border p-4 ${Number(val) >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`mt-1 text-xl font-bold ${Number(val) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs mt-1 text-slate-500">{Number(val) >= 0 ? 'Surplus ✅' : 'Deficit ⚠️'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sidebar Nav Item ─────────────────────────
const NavItem = ({ to, icon, label, badge, path }) => {
  const active = path === to;
  return (
    <Link to={to} className={active ? 'flex items-center gap-3 rounded-2xl bg-white/15 px-3 py-2.5 text-sm font-medium text-white shadow-sm' : 'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white'}>
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-sm">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-200">{badge}</span>}
    </Link>
  );
};

// ─── AppContent ───────────────────────────────
const AppContent = () => {
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    return t && u ? JSON.parse(u) : null;
  });
  const loc = useLocation();

  const onLogin  = (u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); };
  const onLogout = () => { setUser(null); localStorage.removeItem('token'); localStorage.removeItem('user'); };

  const nav = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/data',      icon: '💼', label: 'Portfolio & Cashflow' },
    { to: '/simulator', icon: '🔮', label: 'Scenario Simulator' },
    { to: '/profile',   icon: '👤', label: 'Profile' },
    { to: '/goals',     icon: '🎯', label: 'Goal Planner & Savings' },
    { to: '/advisor',   icon: '🤖', label: 'AI Advisor', badge: 'AI' },
    { to: '/family-hub', icon: '🏠', label: 'Family Hub' },
    { to: '/reports',   icon: '📄', label: 'Reports', badge: 'NEW' },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_45%,_#f8fafc_100%)] text-slate-900">
      {user ? (
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-slate-200/80 bg-slate-950 px-4 py-5 text-slate-100 lg:flex">
            <Link to="/dashboard" className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-black text-white">CC</div>
              <div>
                <p className="text-base font-semibold tracking-tight text-white">CashCompass<span className="text-cyan-300">.ai</span></p>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Wealth OS</p>
              </div>
            </Link>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4" id="sidebar-score">
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">AI Stability Score</p>
              <p className="mt-2 text-2xl font-semibold text-white" id="sidebar-score-value">
                {(() => { try { const s = JSON.parse(localStorage.getItem('user') || '{}'); return s?.stabilityScore ?? '—'; } catch { return '—'; } })()}
              </p>
              <p className="mt-1 text-sm text-slate-300">Click <em>Refresh AI Score</em> to update</p>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">Main menu</p>
              <div className="space-y-1">
                {nav.map(n => <NavItem key={n.to} {...n} path={loc.pathname} />)}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-semibold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              <button onClick={onLogout} className="mt-3 flex w-full items-center justify-start gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/70 px-6 py-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{nav.find(n => n.to === loc.pathname)?.label || 'CashCompass.ai'}</p>
                  <p className="text-sm text-slate-500">Everything in sync — no surprises.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-semibold text-white">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700">Hi, {user.name?.split(' ')[0]} 👋</span>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile"   element={<Profile />} />
                <Route path="/data"      element={<FinancialData />} />
                <Route path="/simulator" element={<ScenarioSimulator />} />
                <Route path="/goals"     element={<GoalPlanner />} />
                <Route path="/advisor"   element={<AIAdvisor />} />
                <Route path="/family-hub" element={<FamilyStabilityHub />} />
                <Route path="/reports"   element={<ReportCenter />} />
                <Route path="*"          element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Auth onLogin={onLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  );
};

export default function App() {
  return <Router><AppContent /></Router>;
}
