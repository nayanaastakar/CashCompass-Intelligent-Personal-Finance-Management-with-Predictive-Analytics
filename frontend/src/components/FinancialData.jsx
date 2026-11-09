import React, { useState, useEffect } from 'react';
import { backendApi } from '../api/axiosConfig';

const TAB_CONFIG = {
  Income:      { endpoint: '/income',    color: 'text-green-600',  badge: 'bg-green-100 text-green-700',  btn: 'bg-finBlue hover:bg-blue-900',   icon: '💰' },
  Expense:     { endpoint: '/expense',   color: 'text-red-600',    badge: 'bg-red-100 text-red-700',      btn: 'bg-finBlue hover:bg-blue-900',   icon: '💸' },
  Assets:      { endpoint: '/asset',     color: 'text-finTeal',    badge: 'bg-teal-100 text-teal-700',    btn: 'bg-finBlue hover:bg-blue-900',   icon: '🏦' },
  Liabilities: { endpoint: '/liability', color: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700',  btn: 'bg-finBlue hover:bg-blue-900',   icon: '📋' },
};

const FIELDS = {
  Income:      [
    { name: 'source',       label: 'Source',         type: 'text',   placeholder: 'e.g. Salary, Freelance' },
    { name: 'amount',       label: 'Amount (₹)',      type: 'number' },
    { name: 'dateReceived', label: 'Date Received',   type: 'date'   },
    { name: 'description',  label: 'Description',     type: 'text'   },
  ],
  Expense:     [
    { name: 'category',     label: 'Category',        type: 'text',   placeholder: 'e.g. Rent, Food, Transport' },
    { name: 'amount',       label: 'Amount (₹)',      type: 'number' },
    { name: 'dateIncurred', label: 'Date Incurred',   type: 'date'   },
    { name: 'description',  label: 'Description',     type: 'text'   },
  ],
  Assets:      [
    { name: 'name',         label: 'Asset Name',      type: 'text',   placeholder: 'e.g. Home, Savings Account' },
    { name: 'value',        label: 'Value (₹)',       type: 'number' },
    { name: 'type',         label: 'Type',            type: 'text',   placeholder: 'e.g. Liquid, Fixed, Investment' },
  ],
  Liabilities: [
    { name: 'name',         label: 'Liability Name',  type: 'text',   placeholder: 'e.g. Home Loan, Credit Card' },
    { name: 'amount',       label: 'Amount (₹)',      type: 'number' },
    { name: 'interestRate', label: 'Interest Rate (%)', type: 'number' },
  ],
};

const getDisplay = (tab, item) => {
  if (tab === 'Income')      return { primary: item.source,   secondary: item.dateReceived, amount: item.amount,  tag: 'Income'  };
  if (tab === 'Expense')     return { primary: item.category, secondary: item.dateIncurred, amount: item.amount,  tag: item.category };
  if (tab === 'Assets')      return { primary: item.name,     secondary: item.type,         amount: item.value,   tag: item.type };
  if (tab === 'Liabilities') return { primary: item.name,     secondary: `${item.interestRate}% p.a.`, amount: item.amount, tag: 'Debt' };
  return {};
};

const FinancialData = () => {
  const [activeTab, setActiveTab] = useState('Income');
  const [data, setData]           = useState([]);
  const [allTotals, setAllTotals] = useState({ Income: 0, Expense: 0, Assets: 0, Liabilities: 0 });
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData]   = useState({});
  const [error, setError]         = useState('');

  const cfg = TAB_CONFIG[activeTab];

  const fetchAllTotals = async () => {
    try {
      const [inc, exp, ast, liab] = await Promise.all([
        backendApi.get('/income').catch(() => ({ data: [] })),
        backendApi.get('/expense').catch(() => ({ data: [] })),
        backendApi.get('/asset').catch(() => ({ data: [] })),
        backendApi.get('/liability').catch(() => ({ data: [] })),
      ]);
      setAllTotals({
        Income: (inc.data || []).reduce((s, i) => s + Number(i.amount || 0), 0),
        Expense: (exp.data || []).reduce((s, i) => s + Number(i.amount || 0), 0),
        Assets: (ast.data || []).reduce((s, i) => s + Number(i.value || 0), 0),
        Liabilities: (liab.data || []).reduce((s, i) => s + Number(i.amount || 0), 0),
      });
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await backendApi.get(cfg.endpoint);
      setData(res.data);
      fetchAllTotals();
    } catch {
      setError('Failed to load data. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); setFormData({}); }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try { await backendApi.delete(`${cfg.endpoint}/${id}`); fetchData(); }
    catch { setError('Failed to delete record.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await backendApi.post(cfg.endpoint, formData);
      setShowModal(false);
      setFormData({});
      fetchData();
    } catch { setError('Failed to save record.'); }
  };

  const inputCls = "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-finBlue focus:outline-none focus:ring-1 focus:ring-finBlue placeholder-slate-400";
  const labelCls = "block text-sm font-medium text-slate-700";

  // Summary totals
  const total = data.reduce((sum, item) => {
    const v = activeTab === 'Assets' ? item.value : item.amount;
    return sum + Number(v || 0);
  }, 0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
      {/* Header */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-800 p-6 text-white shadow-[0_25px_80px_rgba(15,23,42,0.2)] lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-100">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              Wealth Core
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Portfolio & Cashflow</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">Manage your granular financial records to power the CashCompass AI forecasting engine.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 hover:scale-[1.02] shadow-lg">
            <span className="text-lg leading-none">+</span> Add {activeTab}
          </button>
        </div>
      </section>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium shadow-sm">{error}</div>}

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(TAB_CONFIG).map(([tab, c]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`text-left p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
              activeTab === tab 
                ? 'bg-gradient-to-br from-blue-600 to-cyan-500 border-transparent shadow-[0_12px_30px_rgba(37,99,235,0.2)] text-white' 
                : 'bg-white/85 backdrop-blur border-slate-200/80 hover:border-blue-400 shadow-[0_8px_30px_rgba(15,23,42,0.04)] text-slate-900'
            }`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${activeTab === tab ? 'text-blue-100' : 'text-slate-500'}`}>
              {c.icon} {tab}
            </p>
            <p className={`text-2xl font-semibold mt-2 ${activeTab === tab ? 'text-white' : 'text-slate-800'}`}>
              ₹{(allTotals[tab] ?? (activeTab === tab ? total : 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-slate-200/80 pb-1">
        {Object.keys(TAB_CONFIG).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
              activeTab === tab
                ? 'bg-white/85 backdrop-blur border-t border-x border-slate-200/80 text-blue-600 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] -mb-[1px]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
            }`}>
            {TAB_CONFIG[tab].icon} {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/85 backdrop-blur rounded-[24px] border border-slate-200/80 overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-slate-200/80 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Syncing {activeTab} records...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              {cfg.icon}
            </div>
            <p className="text-slate-500 text-sm mb-5">Your {activeTab.toLowerCase()} ledger is currently empty.</p>
            <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-md">
              Add First {activeTab}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/80">
                  <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em]">Name / Source</th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em]">Category / Date</th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(item => {
                  const d = getDisplay(activeTab, item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{d.primary}</td>
                      <td className={`px-6 py-4 text-sm font-semibold ${cfg.color}`}>
                        ₹{Number(d.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${cfg.badge}`}>{d.tag}</span>
                        <span className="ml-3 text-xs text-slate-400 font-medium">{d.secondary}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(item.id)} className="text-xs text-rose-500 hover:text-rose-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 px-3 py-1.5 rounded-full">
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/50 border-t border-slate-200/80">
                  <td className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Total ({data.length})</td>
                  <td className={`px-6 py-4 text-base font-bold ${cfg.color}`}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-[32px] border border-slate-200/80 shadow-[0_25px_80px_rgba(0,0,0,0.15)] p-8 w-full max-w-md transform transition-all scale-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add {activeTab}</h3>
              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-lg">{cfg.icon}</div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {FIELDS[activeTab].map(f => (
                <div key={f.name}>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder || ''}
                    required
                    step={f.type === 'number' ? '0.01' : undefined}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-400"
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all">Save Record</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialData;
