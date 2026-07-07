import React, { useEffect, useState } from 'react';
import { backendApi } from '../api/axiosConfig';

const SpendingRegret = ({ data }) => {
  const [goals, setGoals] = useState([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await backendApi.get('/goal');
        setGoals(res.data || []);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

  if (!data || data.length === 0) return null;

  const applySuggestion = async (d) => {
    if (goals.length === 0) return alert('No goals available to apply this suggestion.');
    const goalId = goals[0].id; // apply to primary goal
    const amount = Math.round((d.monthly_spend || 0) * 0.2);
    if (amount <= 0) return alert('Suggested amount is zero.');
    if (!window.confirm(`Apply ₹${amount} to goal "${goals[0].name}"?`)) return;
    setApplying(true);
    try {
      const res = await backendApi.post('/recommendations/apply', { goalId, amount, fromCategory: d.category });
      alert(`Applied ₹${amount} to "${res.data.name}". New saved: ₹${Number(res.data.currentAmount).toLocaleString('en-IN')}`);
    } catch (e) {
      alert('Failed to apply suggestion.');
    } finally { setApplying(false); }
  };

  return (
    <div className="bg-white/85 backdrop-blur rounded-[32px] border border-slate-200/80 p-6 lg:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">💸</span>
        <h3 className="text-xl font-bold text-slate-900">Spending Regret Analysis</h3>
      </div>
      <p className="text-sm text-slate-500 mb-6">Suggestions below show discretionary categories where modest reductions could meaningfully accelerate your primary goal.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.map((d, i) => (
          <div key={d.category || i} className="p-5 rounded-[24px] border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-colors duration-300 shadow-sm group">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <div className="inline-flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <p className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">{d.category}</p>
                </div>
                <p className="text-sm font-semibold text-rose-600">Monthly spend: ₹{Number(d.monthly_spend || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="sm:text-right">
                <div className="inline-flex items-center justify-center sm:justify-end gap-1.5 rounded-full bg-blue-50 px-3 py-1 mb-1">
                  <span className="text-blue-500 text-xs">✨</span>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-blue-700">{d.suggestion}</p>
                </div>
                <p className="text-xs font-medium text-slate-500">Accelerates goal by: <strong className="text-slate-700">{d.estimated_goal_months_saved || '—'}</strong></p>
              </div>
            </div>
            {d.rationale && (
              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <p className="text-[13px] text-slate-600 leading-relaxed italic">"{d.rationale}"</p>
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <button disabled={applying} onClick={() => applySuggestion(d)} 
                className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 w-full sm:w-auto">
                {applying ? 'Applying...' : 'Apply Suggestion to Goal'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingRegret;
