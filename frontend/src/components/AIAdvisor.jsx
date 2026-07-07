import React, { useState, useEffect } from 'react';
import { backendApi } from '../api/axiosConfig';
import SpendingRegret from './SpendingRegret';

const AIAdvisor = () => {
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [error, setError] = useState('');
  const [regret, setRegret] = useState([]);
  const [marketAdvisor, setMarketAdvisor] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, recRes, marketRes] = await Promise.all([
        backendApi.get('/dashboard/summary'),
        backendApi.get('/recommendations'),
        backendApi.get('/recommendations/market-advisor'),
      ]);
      setSummary(summaryRes.data);
      setRecommendations(recRes.data || []);
      setMarketAdvisor(marketRes.data);
      setError('');
    } catch {
      setError('Could not load advisor data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const generateScore = async () => {
    setScoring(true);
    try {
      const [scoreRes, recRes] = await Promise.all([
        backendApi.post('/ai/stability-score'),
        backendApi.post('/recommendations/generate'),
      ]);
      setScoreResult(scoreRes.data);
      setRecommendations(recRes.data || []);
      const summaryRes = await backendApi.get('/dashboard/summary');
      setSummary(summaryRes.data);
      setError('');
    } catch {
      setError('AI service unavailable. Ensure the Python service is running.');
    } finally {
      setScoring(false);
    }
  };

  const fetchRegret = async () => {
    setLoading(true);
    try {
      const res = await backendApi.post('/recommendations/regret');
      setRegret(res.data || []);
      setError('');
    } catch (e) {
      setError('Could not compute spending regret.');
    } finally {
      setLoading(false);
    }
  };

  const typeConfig = {
    critical: { border: 'border-red-200', bg: 'bg-red-50', title: 'text-red-700', body: 'text-red-600', badge: 'bg-red-100 text-red-700', label: 'Critical' },
    warning: { border: 'border-amber-200', bg: 'bg-amber-50', title: 'text-amber-700', body: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', label: 'Warning' },
    success: { border: 'border-green-200', bg: 'bg-green-50', title: 'text-green-700', body: 'text-green-600', badge: 'bg-green-100 text-green-700', label: 'Good' },
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
      {/* Header */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-800 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              AI Guardian
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Family Financial Guardian</h1>
            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300">Your AI guardian delivers stability scoring, risk alerts, and explainable recommendations for family finances.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button onClick={fetchRegret} disabled={loading} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50">
              {loading ? 'Analysing...' : 'Analyze Spending Regret'}
            </button>
            <button onClick={generateScore} disabled={scoring} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:hover:scale-100">
              {scoring ? 'Calculating...' : 'Refresh Insights'}
            </button>
          </div>
        </div>
      </section>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium shadow-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Metric label="Current AI Score" value={`${summary?.stabilityScore || 0}/100`} />
        <Metric label="Weather Forecast" value={summary?.weatherForecast || 'Not calculated'} />
        <Metric label="Shock Resistance" value={`${Number(summary?.shockResistanceIndex || 0).toFixed(2)} months`} />
      </div>

      {scoreResult && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[32px] p-6 lg:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.15)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 border border-slate-700/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -z-0 translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 relative z-10">
            <div>
              <p className="text-blue-300 text-[11px] font-bold uppercase tracking-widest mb-3">AI Stability Score</p>
              <div className="flex items-baseline gap-1">
                <p className="text-7xl font-bold tracking-tight text-white">{scoreResult.financial_stability_score}</p>
                <span className="text-3xl text-slate-400 font-medium">/100</span>
              </div>
              <p className="text-blue-200 text-sm mt-4">Outlook: <strong className="text-white text-base">{scoreResult.financial_weather_forecast}</strong></p>
              {scoreResult.risk_alert && (
                <div className="mt-5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md px-4 py-3 text-sm text-slate-100 flex items-start gap-3">
                  <span className="text-amber-400 text-lg leading-none">⚠️</span>
                  <p className="font-medium leading-relaxed">{scoreResult.risk_alert}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DarkMetric label="Savings Rate" value={`${scoreResult.savings_rate || 0}%`} />
              <DarkMetric label="Debt Ratio" value={`${scoreResult.debt_to_income_ratio || 0}%`} />
              <DarkMetric label="Monthly Surplus" value={`₹${Number(scoreResult.monthly_surplus || 0).toLocaleString('en-IN')}`} />
              <DarkMetric label="Liquidity Shield" value={`${Number(summary?.shockResistanceIndex || 0).toFixed(1)} months`} />
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-slate-950/50 border border-slate-700/50 p-6 relative z-10 backdrop-blur-md">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <span className="text-blue-400 text-base">🧠</span> XAI Reasoning Engine
            </p>
            <div className="space-y-3">
              <p className="text-sm text-slate-200 leading-relaxed font-mono">{scoreResult.explainable_ai?.logic || 'AI reasoning will appear here once the score is calculated.'}</p>
              {scoreResult.shock_resistance_logic && (
                <p className="text-sm text-slate-300 leading-relaxed font-mono pt-3 border-t border-slate-800/80">{scoreResult.shock_resistance_logic}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Wealth Architect & Market Advisor */}
      {marketAdvisor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white/85 backdrop-blur rounded-[32px] border border-slate-200/80 p-6 lg:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.05)] relative overflow-hidden group hover:border-emerald-300 transition-colors duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-lg">💰</div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Lazy Money Detector</p>
              </div>
              {marketAdvisor.hasLazyMoney && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Idle Cash Alert</span>
              )}
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-5">{marketAdvisor.lazyMoneyAlert}</p>
            
            {marketAdvisor.hasLazyMoney && (
              <div className="mb-5 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Emergency Fund</span>
                  <span className="text-emerald-600">Idle Cash</span>
                </div>
                <div className="h-3 w-full bg-emerald-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-slate-300" style={{ width: `${(marketAdvisor.emergencyFundTarget / (marketAdvisor.totalLiquidSavings || 1)) * 100}%` }}></div>
                  <div className="h-full bg-emerald-500 flex-1"></div>
                </div>
                <p className="text-xs text-right font-medium text-emerald-600">₹{Math.round(marketAdvisor.lazyMoney).toLocaleString('en-IN')} uninvested</p>
              </div>
            )}
            
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <p className="text-sm font-semibold text-emerald-800 leading-relaxed">
                <span className="text-base mr-2">💡</span>
                {marketAdvisor.lazyMoneyRecommendation}
              </p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-[32px] border border-slate-800 p-6 lg:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-20 -z-0 translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg">📈</div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Market Wealth Architect</p>
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                Current Market: {marketAdvisor.marketTrend}
              </div>
              <p className="text-lg font-semibold text-white mb-6 leading-snug">{marketAdvisor.marketOpportunityAlert}</p>
              
              <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-5 backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Smart Action Required</p>
                <p className="text-sm font-medium text-indigo-100 leading-relaxed">{marketAdvisor.smartInvestRecommendation}</p>
                <button className="mt-4 w-full rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition shadow-lg">Start SIP Now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white/50 backdrop-blur rounded-[32px] border border-slate-200/80 p-16 text-center shadow-sm min-h-[300px] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-200/80 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Analysing your financial data...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white/50 backdrop-blur rounded-[32px] border border-slate-200/80 p-16 text-center shadow-sm min-h-[300px] flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🤖</div>
          <p className="text-slate-500 text-sm mb-5">No saved recommendations yet. Run the AI Guardian to generate insights.</p>
          <button onClick={generateScore} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-md">Generate Recommendations</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {recommendations.map((rec, i) => {
            const c = typeConfig[rec.type] || typeConfig.warning;
            return (
              <div key={rec.id || i} className={`rounded-[24px] border ${c.border} ${c.bg} p-6 shadow-sm hover:shadow-md transition-shadow duration-300`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h3 className={`text-base font-bold ${c.title}`}>{rec.title}</h3>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest self-start sm:self-auto ${c.badge}`}>{c.label}</span>
                </div>
                <p className={`text-sm leading-relaxed ${c.body}`}>{rec.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Spending regret results */}
      {regret && regret.length > 0 && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SpendingRegret data={regret} />
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="bg-white/85 backdrop-blur rounded-[24px] border border-slate-200/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
  </div>
);

const DarkMetric = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-lg font-bold text-white mt-1 break-words">{value}</p>
  </div>
);

export default AIAdvisor;