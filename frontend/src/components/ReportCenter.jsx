import React, { useEffect, useState } from 'react';
import { backendApi } from '../api/axiosConfig';

const ReportCenter = () => {
  const [reports, setReports] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');
  const [error, setError] = useState('');

  const loadReports = async () => {
    try {
      const res = await backendApi.get('/reports');
      setReports(res.data);
      setError('');
    } catch {
      setError('Could not load report history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const generate = async (type) => {
    setGenerating(type);
    try {
      const res = await backendApi.post(`/reports/${type}?format=JSON`);
      setLatest(res.data);
      await loadReports();
    } catch {
      setError('Could not generate report.');
    } finally {
      setGenerating('');
    }
  };

  const downloadCsv = async (type) => {
    setGenerating(`${type}-csv`);
    try {
      const res = await backendApi.get(`/reports/${type}/csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `finguard-${type}-report.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not download CSV report.');
    } finally {
      setGenerating('');
    }
  };

  const downloadPdf = async (type) => {
    setGenerating(`${type}-pdf`);
    try {
      const res = await backendApi.get(`/reports/${type}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `finguard-${type}-report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      await loadReports();
    } catch {
      setError('Could not download PDF report.');
    } finally {
      setGenerating('');
    }
  };

  const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const reportTypes = ['monthly', 'quarterly', 'annual'];

  const typeConfig = {
    monthly:   { icon: '📅', gradient: 'from-blue-600 to-cyan-500',   badge: 'bg-blue-900/40 text-cyan-200',   desc: 'A detailed snapshot of this month — income, expenses, net worth, AI score, and all active goals.' },
    quarterly: { icon: '📊', gradient: 'from-violet-600 to-indigo-500', badge: 'bg-violet-900/40 text-indigo-200', desc: 'Three months of financial data in one report — trends, liability breakdown, and AI recommendations.' },
    annual:    { icon: '🏆', gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-900/40 text-amber-200',  desc: 'Your full year in review — wealth trajectory, savings rate, goal progress, and forecasts.' },
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-5 lg:p-6">

      {/* Header */}
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] lg:p-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-blue-200 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              Smart Report Center
            </div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Financial Intelligence Reports</h1>
            <p className="mt-1.5 text-xs leading-6 text-slate-400">Generate monthly, quarterly & annual PDF, CSV, and structured reports with full AI insights.</p>
          </div>
          <div className="flex gap-3">
            {['monthly','quarterly','annual'].map(t => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-center">
                <p className="text-lg">{typeConfig[t].icon}</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-medium shadow-sm">{error}</div>}

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map(type => {
          const cfg = typeConfig[type];
          return (
            <div key={type} className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/85 backdrop-blur shadow-[0_8px_30px_rgba(15,23,42,0.05)] flex flex-col group hover:shadow-[0_16px_50px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all duration-300">
              {/* Coloured top strip */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradient}`}></div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-xl shadow-md`}>{cfg.icon}</div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${cfg.badge}`}>{type}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 capitalize mb-1.5">{type} Report</h2>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{cfg.desc}</p>
                <div className="flex flex-col xl:flex-row gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => generate(type)} disabled={!!generating}
                    className={`flex-1 rounded-xl bg-gradient-to-r ${cfg.gradient} px-3 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition-opacity disabled:opacity-50`}>
                    {generating === type ? 'Generating...' : 'View Report'}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => downloadPdf(type)} disabled={!!generating}
                      className="flex-1 xl:flex-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                      {generating === `${type}-pdf` ? '...' : '↓ PDF'}
                    </button>
                    <button onClick={() => downloadCsv(type)} disabled={!!generating}
                      className="flex-1 xl:flex-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                      {generating === `${type}-csv` ? '...' : '↓ CSV'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {latest && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary metrics */}
          <div className="bg-white/85 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200/80 bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">Generated Report - {latest.period}</h2>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">Format: {latest.format}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
              <Metric label="Total Income" value={fmt(latest.totalIncome)} />
              <Metric label="Total Expenses" value={fmt(latest.totalExpense)} />
              <Metric label="Net Worth" value={fmt(latest.netWorth)} />
              <Metric label="Cash Flow" value={fmt(latest.cashFlow)} />
              <Metric label="Stability Score" value={`${latest.stabilityScore || 0}/100`} />
              <Metric label="Shock Resistance" value={`${Number(latest.shockResistanceIndex || 0).toFixed(2)} months`} />
              <Metric label="Goals" value={latest.goals?.length || 0} />
              <Metric label="Recommendations" value={latest.recommendations?.length || 0} />
            </div>
          </div>

          {/* Detailed Asset Breakdown */}
          {latest.assets && latest.assets.length > 0 && (
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200/80 bg-slate-50/50">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">Asset Breakdown ({latest.assets.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {latest.assets.map((a, i) => (
                  <div key={i} className="px-5 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{a.name}</p>
                      <p className="text-slate-500">{a.assetType}</p>
                    </div>
                    <span className="font-bold text-emerald-600">{fmt(a.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Liability Breakdown */}
          {latest.liabilities && latest.liabilities.length > 0 && (
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200/80 bg-slate-50/50">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">Liability Breakdown ({latest.liabilities.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {latest.liabilities.map((l, i) => (
                  <div key={i} className="px-5 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{l.name}</p>
                      <p className="text-slate-500">{l.liabilityType} | EMI: {fmt(l.emi)}</p>
                    </div>
                    <span className="font-bold text-rose-600">{fmt(l.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Goal Progress */}
          {latest.goals && latest.goals.length > 0 && (
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200/80 bg-slate-50/50">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">Goal Progress ({latest.goals.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {latest.goals.map((g, i) => {
                  const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                  return (
                    <div key={i} className="px-5 py-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <p className="font-bold text-slate-800">{g.name}</p>
                        <span className="text-blue-600 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                        <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>Saved: {fmt(g.currentAmount)}</span>
                        <span>Target: {fmt(g.targetAmount)}</span>
                        <span>Due: {g.targetDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {latest.recommendations && latest.recommendations.length > 0 && (
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200/80 bg-slate-50/50">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">AI Recommendations ({latest.recommendations.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {latest.recommendations.map((r, i) => {
                  const colors = r.type === 'critical' ? 'text-rose-700 bg-rose-50' : r.type === 'success' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50';
                  return (
                    <div key={i} className="px-5 py-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colors}`}>{r.type}</span>
                        <p className="text-xs font-bold text-slate-800">{r.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{r.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-[24px] border border-slate-200/80 bg-white/85 backdrop-blur shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-sm">🕘</div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">Report History</h2>
        </div>
        {loading ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-7 h-7 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium text-slate-400">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm font-semibold text-slate-500">No reports generated yet</p>
            <p className="text-xs text-slate-400 mt-1">Click View Report on any card above to generate your first report.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map(report => {
              const rCfg = typeConfig[report.reportType?.toLowerCase()] || { gradient: 'from-slate-600 to-slate-500', icon: '📄' };
              return (
                <div key={report.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${rCfg.gradient} flex items-center justify-center text-sm shrink-0`}>{rCfg.icon}</div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 capitalize">{report.reportType} Report — <span className="font-normal text-slate-500">{report.format}</span></p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{report.periodStart} → {report.periodEnd}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {report.generatedAt}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm hover:shadow transition-shadow">
    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-sm font-bold text-slate-900 mt-1.5 truncate">{value}</p>
  </div>
);

export default ReportCenter;
