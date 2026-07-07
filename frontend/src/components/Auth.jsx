import React, { useState } from 'react';
import { backendApi } from '../api/axiosConfig';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (mode === 'signup') await backendApi.post('/auth/signup', form);
      const res = await backendApi.post('/auth/signin', { email: form.email, password: form.password });
      if (res.data.token) localStorage.setItem('token', res.data.token);
      onLogin({ id: res.data.id, name: res.data.name, email: res.data.email, age: res.data.age, familySize: res.data.familySize, employmentType: res.data.employmentType });
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_45%,_#f8fafc_100%)] p-4 sm:p-6 lg:p-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_100px_rgba(15,23,42,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-800 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.35),_transparent_35%)]"></div>
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-sm font-black">FG</div>
              <div>
                <p className="text-xl font-semibold tracking-tight">FinGuard.ai</p>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-300">Financial clarity for modern families</p>
              </div>
            </div>
            <h1 className="mt-10 max-w-md text-4xl font-semibold leading-tight">A calm, intelligent command center for your money.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">Track income, model future cash flow, and make confident decisions with AI-guided insights that feel clear, immediate, and trustworthy.</p>
            <div className="mt-8 space-y-3">
              {[
                { icon: '🤖', label: 'AI Stability Score', desc: 'Live health index for your financial plan' },
                { icon: '🧪', label: 'What-if Simulator', desc: 'Model emergencies and changing income' },
                { icon: '🎯', label: 'Goal Planner', desc: 'Visualize timelines with precision' },
              ].map(f => (
                <div key={f.label} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                  <span className="text-xl">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-sm text-slate-300">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-sm text-slate-400">© 2025 FinGuard.ai</p>
        </div>

        <div className="flex items-center justify-center bg-slate-50/70 p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-sm font-black text-white">FG</div>
              <span className="text-xl font-semibold tracking-tight text-slate-900">FinGuard<span className="text-blue-700">.ai</span></span>
            </div>
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Secure access</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">{mode === 'login' ? 'Sign in to continue your financial plan.' : 'Start with your email and password, then complete your profile later.'}</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <input type="email" required placeholder="you@example.com" className="form-input"
                  onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input type="password" required placeholder="••••••••" className="form-input"
                  onChange={e => set('password', e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="mt-2 w-full rounded-2xl bg-blue-700 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50">
                {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} className="font-semibold text-blue-700 hover:underline">
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
