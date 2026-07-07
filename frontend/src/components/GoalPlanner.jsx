import React, { useState, useEffect } from 'react';
import { backendApi } from '../api/axiosConfig';

const GoalPlanner = () => {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
  const [error, setError] = useState('');

  const fetchGoals = async () => {
    try {
      const [goalsRes, summaryRes] = await Promise.all([
        backendApi.get('/goal'),
        backendApi.get('/dashboard/summary'),
      ]);
      setGoals(goalsRes.data);
      setSummary(summaryRes.data);
    } catch {
      setError('Could not load goals or summary. Ensure backend is running.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await backendApi.post('/goal', formData);
      setShowModal(false);
      setFormData({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
      fetchGoals();
    } catch { setError('Failed to create goal.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try { await backendApi.delete(`/goal/${id}`); fetchGoals(); }
    catch { setError('Failed to delete.'); }
  };

  const getProgress = (cur, tgt) => Math.min(100, Math.round((cur / tgt) * 100));
  const barColor = (pct) => pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';

  const inputCls = "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-finBlue focus:outline-none focus:ring-1 focus:ring-finBlue";
  const labelCls = "block text-sm font-medium text-slate-700";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
      {/* Header */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-800 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              Future Planning
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Goal Planner & Savings</h1>
            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300">AI-powered savings projection and intelligent feasibility analysis for your life goals.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 hover:scale-[1.02] shadow-lg">
            <span className="text-lg leading-none">+</span> New Goal
          </button>
        </div>
      </section>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium shadow-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-slate-200/80 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Syncing your goals...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const pct = getProgress(Number(goal.currentAmount), Number(goal.targetAmount));
            const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);
            const monthlySurplus = Number(summary?.cashFlow || 0);
            const now = new Date();
            const target = goal.targetDate ? new Date(goal.targetDate) : null;
            const monthsUntilTarget = target ? Math.max(1, Math.ceil(((target.getFullYear() - now.getFullYear()) * 12) + (target.getMonth() - now.getMonth()))) : null;
            const requiredMonthly = monthsUntilTarget ? Math.ceil(remaining / monthsUntilTarget) : null;
            const shortfall = requiredMonthly && monthlySurplus ? Math.max(0, requiredMonthly - monthlySurplus) : null;

            return (
              <div key={goal.id} className="bg-white/85 backdrop-blur rounded-[24px] border border-slate-200/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{goal.name}</h3>
                  <button onClick={() => handleDelete(goal.id)} className="text-xs text-rose-500 hover:text-rose-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 px-3 py-1.5 rounded-full">
                    Remove
                  </button>
                </div>

                <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <span>₹{Number(goal.currentAmount).toLocaleString('en-IN')} Saved</span>
                  <span>Target: ₹{Number(goal.targetAmount).toLocaleString('en-IN')}</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 to-cyan-400`} style={{ width: `${pct}%` }}></div>
                </div>

                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span className="text-blue-600 font-bold">{pct}% complete</span>
                  <span>Due: {goal.targetDate}</span>
                </div>

                <div className="mt-5 p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-cyan-300"></div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                    <span className="text-lg mr-1 align-middle">🤖</span> AI Projection
                  </p>
                  <div className="grid grid-cols-2 gap-y-3 text-sm text-slate-700">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Remaining</p>
                      <p className="font-semibold">₹{remaining.toLocaleString('en-IN')}</p>
                    </div>
                    {monthsUntilTarget ? (
                      <>
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Timeline</p>
                          <p className="font-semibold">{monthsUntilTarget} months</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Required / mo</p>
                          <p className="font-semibold">₹{requiredMonthly?.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Current Surplus</p>
                          <p className="font-semibold text-emerald-600">₹{monthlySurplus.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-200/80 mt-1">
                          {shortfall > 0 ? (
                            <div className="flex items-start gap-2 text-rose-600">
                              <span className="text-base leading-none">⚠️</span>
                              <p className="text-[13px] font-medium leading-tight">Shortfall of ₹{shortfall.toLocaleString('en-IN')} per month. Target may be at risk.</p>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 text-emerald-600">
                              <span className="text-base leading-none">✨</span>
                              <p className="text-[13px] font-medium leading-tight">On track. Your current monthly surplus safely covers the requirement.</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2 text-[13px] text-slate-500 italic mt-1">No target date set. Add a date to see AI monthly projections.</div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {monthsUntilTarget && shortfall > 0 ? (
                      <button onClick={() => alert(`To hit "${goal.name}", consider reducing discretionary expenses by ₹${shortfall.toLocaleString('en-IN')} or extending the target date.`)}
                        className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm">Get Fix Ideas</button>
                    ) : (
                      <button onClick={() => alert('You are safely on track. You can allocate extra surplus here to finish earlier!')}
                        className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm">Accelerate</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {goals.length === 0 && (
            <div className="col-span-1 md:col-span-2 bg-white/50 backdrop-blur rounded-[24px] border border-slate-200/80 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🎯</div>
              <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">No goals created yet. Define your first financial milestone and let AI help you track it.</p>
              <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-md">Create First Goal</button>
            </div>
          )}

          {goals.length > 0 && (
            <div onClick={() => setShowModal(true)}
              className="rounded-[24px] border-2 border-dashed border-slate-200/80 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-blue-300 hover:shadow-[0_12px_40px_rgba(37,99,235,0.06)] transition-all duration-300 p-12 min-h-[300px] group">
              <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xl text-slate-400 group-hover:text-blue-500 group-hover:border-blue-200 transition-colors shadow-sm mb-3">
                +
              </div>
              <p className="text-slate-500 text-sm font-semibold group-hover:text-blue-600 transition-colors">Add Another Goal</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-[32px] border border-slate-200/80 shadow-[0_25px_80px_rgba(0,0,0,0.15)] p-8 w-full max-w-md transform transition-all scale-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">New Goal</h3>
              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-lg">🎯</div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { name: 'name',          label: 'Goal Name',          type: 'text',   placeholder: 'e.g. Emergency Fund' },
                { name: 'targetAmount',  label: 'Target Amount (₹)',  type: 'number' },
                { name: 'currentAmount', label: 'Current Savings (₹)', type: 'number' },
                { name: 'targetDate',    label: 'Target Date',         type: 'date' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder || ''} required
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-400"
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })} />
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all">Save Goal</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalPlanner;
