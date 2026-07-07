import React, { useEffect, useMemo, useState } from 'react';
import { backendApi } from '../api/axiosConfig';

const scenarioOptions = [
  { id: 'job_loss', label: 'Job Loss', detail: 'No income for 3 months' },
  { id: 'medical_emergency', label: 'Medical Emergency', detail: 'Large one-time health expense' },
  { id: 'income_drop', label: 'Income Drop', detail: '30% lower monthly income' },
  { id: 'emi_increase', label: 'EMI Increase', detail: 'Higher fixed debt payment' },
  { id: 'inflation', label: 'Inflation Shock', detail: '15% higher monthly expenses' },
  { id: 'market_crash', label: 'Market Crash', detail: '20% asset value drop' },
  { id: 'house_purchase', label: 'House Purchase', detail: 'Down payment, new loan, new EMI' },
  { id: 'custom', label: 'Custom Scenario', detail: 'Tune every input manually' },
];

const defaultInputs = {
  duration_months: 3,
  income_change_percent: 0,
  expense_change_percent: 0,
  one_time_expense: 0,
  liability_increase: 0,
  emi_increase: 0,
  asset_change_percent: 0,
};

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

const ScenarioSimulator = () => {
  const [scenarioType, setScenarioType] = useState('job_loss');
  const [inputs, setInputs] = useState(defaultInputs);
  const [baseline, setBaseline] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    backendApi.get('/dashboard/summary')
      .then(res => {
        setBaseline(res.data);
        setError('');
      })
      .catch(() => setError('Could not load your current financial baseline.'));
  }, []);

  const selectedScenario = useMemo(
    () => scenarioOptions.find(item => item.id === scenarioType) || scenarioOptions[0],
    [scenarioType]
  );

  const updateInput = (key, value) => {
    setInputs(current => ({ ...current, [key]: Number(value) || 0 }));
    if (scenarioType !== 'custom') setScenarioType('custom');
  };

  const runSimulation = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await backendApi.post('/ai/scenario', {
        scenario_type: scenarioType,
        ...inputs,
      });
      setResult(res.data);
    } catch {
      setError('Could not run personalized scenario simulation.');
    } finally {
      setLoading(false);
    }
  };

  const score = Number(result?.financial_stability_score || 0);
  const scoreTone = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
  const riskTone = result?.risk_level === 'RESILIENT'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : result?.risk_level === 'WATCH'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
      {/* Header */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-800 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              AI Simulator
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Personal Risk Simulator</h1>
            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300">
              Stress-test your own income, expenses, assets, debt, goals, and profile against financial shocks.
            </p>
          </div>
          {result && (
            <div className={`inline-flex items-center rounded-full border px-4 py-2 shadow-lg backdrop-blur ${riskTone.replace('bg-', 'bg-').replace('text-', 'text-').replace('border-', 'border-')}`}>
              <span className="text-sm font-bold uppercase tracking-wider">{result.risk_level}</span>
            </div>
          )}
        </div>
      </section>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium shadow-sm">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-6">
        <section className="bg-white/85 backdrop-blur rounded-[32px] border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.05)] p-6 lg:p-8 space-y-8">
          <div>
            <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">1. Select Scenario</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scenarioOptions.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScenarioType(item.id)}
                  className={`text-left rounded-2xl border p-4 transition-all duration-300 ${
                    scenarioType === item.id 
                      ? 'border-blue-500 bg-blue-50/50 shadow-[0_8px_20px_rgba(59,130,246,0.12)]' 
                      : 'border-slate-200 bg-white/50 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <span className={`block text-sm font-bold ${scenarioType === item.id ? 'text-blue-700' : 'text-slate-800'}`}>{item.label}</span>
                  <span className={`block text-[11px] mt-1 ${scenarioType === item.id ? 'text-blue-600/80' : 'text-slate-500'}`}>{item.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200/80 pt-6 space-y-4">
            <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">2. Fine-Tune Variables</h2>
            <div className="space-y-3">
              <NumberField label="Duration" suffix="months" value={inputs.duration_months} onChange={v => updateInput('duration_months', v)} />
              <NumberField label="Income Change" suffix="%" value={inputs.income_change_percent} onChange={v => updateInput('income_change_percent', v)} />
              <NumberField label="Expense Change" suffix="%" value={inputs.expense_change_percent} onChange={v => updateInput('expense_change_percent', v)} />
              <NumberField label="One-Time Expense" suffix="Rs." value={inputs.one_time_expense} onChange={v => updateInput('one_time_expense', v)} />
              <NumberField label="New Liability" suffix="Rs." value={inputs.liability_increase} onChange={v => updateInput('liability_increase', v)} />
              <NumberField label="Extra EMI" suffix="Rs./m" value={inputs.emi_increase} onChange={v => updateInput('emi_increase', v)} />
              <NumberField label="Asset Value Change" suffix="%" value={inputs.asset_change_percent} onChange={v => updateInput('asset_change_percent', v)} />
            </div>
          </div>

          {baseline && (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Current Baseline Profile</p>
              <div className="grid grid-cols-2 gap-3">
                <MiniMetric label="Score" value={`${baseline.stabilityScore || 0}/100`} />
                <MiniMetric label="Net Worth" value={fmt(baseline.netWorth)} />
                <MiniMetric label="Cash Flow" value={fmt(baseline.cashFlow)} />
                <MiniMetric label="Liabilities" value={fmt(baseline.totalLiabilities)} />
              </div>
            </div>
          )}

          <button
            onClick={runSimulation}
            disabled={loading || !baseline}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-4 text-sm font-bold text-white hover:shadow-[0_12px_30px_rgba(37,99,235,0.25)] hover:scale-[1.02] disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Running AI Engine...' : `Simulate ${selectedScenario.label}`}
          </button>
        </section>

        <section className="space-y-6">
          {!result && !loading && (
            <div className="bg-white/50 backdrop-blur rounded-[32px] border border-slate-200/80 p-16 text-center shadow-sm h-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🔮</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Ready to Simulate</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">Choose a scenario on the left and run the simulator to see how your finances would react to the shock.</p>
            </div>
          )}

          {loading && (
            <div className="bg-white/50 backdrop-blur rounded-[32px] border border-slate-200/80 p-16 text-center shadow-sm h-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Calculating Impact...</h3>
              <p className="text-slate-500 text-sm">Processing ensemble ML models and running constraint logic.</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white/85 backdrop-blur rounded-[32px] border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.05)] p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-cyan-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Projected Stability Score</p>
                    <div className="flex items-baseline gap-1">
                      <p className={`text-6xl font-bold tracking-tight ${scoreTone}`}>{score}</p>
                      <span className="text-2xl text-slate-300 font-medium">/100</span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600 max-w-sm">{result.financial_weather_forecast}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm min-w-[300px]">
                    <MiniMetric label="Survival" value={`${Number(result.projected?.survival_months || 0).toFixed(1)} months`} />
                    <MiniMetric label="Debt Ratio" value={pct((result.projected?.debt_to_income_ratio || 0) * 100)} />
                    <MiniMetric label="Projected Flow" value={fmt(result.projected?.cash_flow)} />
                    <MiniMetric label="Projected Worth" value={fmt(result.projected?.net_worth)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ComparisonPanel title="Baseline State" data={result.baseline} />
                <ComparisonPanel title="Post-Shock State" data={result.projected} highlight />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/85 backdrop-blur rounded-[24px] border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.05)] p-6">
                  <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Goal Impact Analysis</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniMetric label="Status" value={result.goal_impact?.status || 'NA'} />
                    <MiniMetric label="Monthly Gap" value={fmt(result.goal_impact?.monthly_gap)} />
                    <MiniMetric label="Needed Saving" value={fmt(result.goal_impact?.required_monthly_savings)} />
                    <MiniMetric label="Available Saving" value={fmt(result.goal_impact?.available_monthly_savings)} />
                  </div>
                </div>

                <div className="bg-white/85 backdrop-blur rounded-[24px] border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.05)] p-6">
                  <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Personalized Factors</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniMetric label="Employment" value={result.personalized_factors?.employment_type || 'UNKNOWN'} />
                    <MiniMetric label="Family Size" value={result.personalized_factors?.family_size || 0} />
                    <MiniMetric label="History" value={`${result.personalized_factors?.historical_months_used || 0} months`} />
                    <MiniMetric label="Active Goals" value={result.personalized_factors?.goal_count || 0} />
                  </div>
                </div>
              </div>

              <div className="bg-white/85 backdrop-blur rounded-[24px] border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.05)] p-6 lg:p-8">
                <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">AI Action Plan & Logic</h2>
                <div className="space-y-3">
                  {(result.action_plan || []).map((item, index) => (
                    <div key={index} className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 shadow-sm">
                      <span className="text-blue-500 shrink-0 text-base leading-none translate-y-0.5">🔹</span>
                      <p className="leading-relaxed font-medium">{item}</p>
                    </div>
                  ))}
                </div>
                {result.explainable_ai?.logic && (
                  <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -z-0 translate-x-1/2 -translate-y-1/2"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 relative z-10">AI Reasoning Engine</p>
                    <p className="text-sm text-slate-200 leading-relaxed relative z-10 font-mono">{result.explainable_ai.logic}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const NumberField = ({ label, suffix, value, onChange }) => (
  <label className="grid grid-cols-[1fr_130px] items-center gap-3 text-sm group">
    <span className="text-slate-600 font-medium text-[13px]">{label}</span>
    <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all group-hover:border-blue-300 group-hover:shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-right font-semibold text-slate-900 outline-none"
      />
      <span className="border-l border-slate-100 bg-slate-50 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 h-full flex items-center justify-center min-w-[45px]">{suffix}</span>
    </div>
  </label>
);

const MiniMetric = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-sm">
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-1 break-words text-[15px] font-bold text-slate-800">{value}</p>
  </div>
);

const ComparisonPanel = ({ title, data, highlight }) => (
  <div className={`rounded-[24px] border shadow-[0_12px_40px_rgba(15,23,42,0.04)] backdrop-blur p-6 relative overflow-hidden ${
    highlight 
      ? 'bg-blue-50/30 border-blue-200' 
      : 'bg-white/85 border-slate-200/80'
  }`}>
    {highlight && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-10 -z-10 translate-x-1/2 -translate-y-1/2"></div>}
    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">{title}</h2>
    <div className="grid grid-cols-2 gap-3">
      <MiniMetric label="Monthly Income" value={fmt(data?.monthly_income)} />
      <MiniMetric label="Monthly Expense" value={fmt(data?.monthly_expense)} />
      <MiniMetric label="Cash Flow" value={fmt(data?.cash_flow)} />
      <MiniMetric label="Liquid Assets" value={fmt(data?.liquid_assets)} />
      <MiniMetric label="Net Worth" value={fmt(data?.net_worth)} />
      <MiniMetric label="Liabilities" value={fmt(data?.liabilities)} />
    </div>
  </div>
);

export default ScenarioSimulator;