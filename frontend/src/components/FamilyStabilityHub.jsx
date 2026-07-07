import React, { useEffect, useState } from 'react';
import { backendApi } from '../api/axiosConfig';

/* ─── tiny styled input used in every edit form ─────────────────────── */
const Input = ({ label, type = 'number', value, onChange, placeholder, accent = 'focus:ring-emerald-500' }) => (
  <div>
    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 ${accent}`}
    />
  </div>
);

/* ─── dark-themed input for Marriage card ────────────────────────────── */
const DarkInput = ({ label, type = 'number', value, onChange, placeholder }) => (
  <div>
    <label className="block text-[10px] uppercase font-bold text-pink-300 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
    />
  </div>
);

/* ─── small save / cancel button row ─────────────────────────────────── */
const EditButtons = ({ onSave, onCancel, saving, saveLabel = 'Save', bg = 'bg-emerald-600 hover:bg-emerald-700' }) => (
  <div className="flex gap-2 mt-3">
    <button onClick={onCancel} disabled={saving} className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition">
      Cancel
    </button>
    <button onClick={onSave} disabled={saving} className={`flex-1 rounded-xl ${bg} px-3 py-1.5 text-xs font-semibold text-white transition`}>
      {saving ? 'Saving…' : saveLabel}
    </button>
  </div>
);

const FamilyStabilityHub = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  /* ── per-card editing state ── */
  const [editEmergency, setEditEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({ emergencyBufferMonths: '' });
  const [savingEmergency, setSavingEmergency] = useState(false);

  const [editChild, setEditChild] = useState(false);
  const [childForm, setChildForm] = useState({ childEducationTarget: '', childTimelineYears: '', childSavedAmount: '', childSavedLocation: '' });
  const [savingChild, setSavingChild] = useState(false);

  const [editIncome, setEditIncome] = useState(false);
  const [incomeMembers, setIncomeMembers] = useState([{ memberName: '', income: '' }]);
  const [savingIncome, setSavingIncome] = useState(false);

  const [editMarriage, setEditMarriage] = useState(false);
  const [marriageForm, setMarriageForm] = useState({ cost: '', timelineMonths: '', marriageSavedAmount: '', marriageSavedLocation: '' });
  const [savingMarriage, setSavingMarriage] = useState(false);

  /* ── Future Plans ── */
  const [futurePlans, setFuturePlans] = useState([]);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlanIdx, setEditingPlanIdx] = useState(null);
  const [planForm, setPlanForm] = useState({ title: '', emoji: '🎯', targetAmount: '', timelineMonths: '', priority: 'Medium', notes: '', savedAmount: '' });
  const [savingPlans, setSavingPlans] = useState(false);

  const PLAN_EMOJIS = ['🎯','🏠','🚗','✈️','📚','💻','💍','🏥','🌴','🎓','👴','👶','🏋️','🎸','🛶','⛷️'];
  const PRIORITIES  = ['High','Medium','Low'];
  const PRIORITY_COLORS = { High: 'bg-rose-100 text-rose-700 border-rose-200', Medium: 'bg-amber-100 text-amber-700 border-amber-200', Low: 'bg-emerald-100 text-emerald-700 border-emerald-200' };

  const user   = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  /* ── load / reload ── */
  const loadData = async () => {
    try {
      const res = await backendApi.get(`/family/stability/${userId}`);
      setData(res.data);
      // restore saved future plans from family_info
      try {
        const fi = JSON.parse(res.data?.familyInfoJson || '{}');
        setFuturePlans(fi.futurePlans || []);
      } catch { setFuturePlans([]); }
    } catch {
      setError('Failed to load family stability data. Please add income & expense data first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) { setError('User not logged in'); setLoading(false); return; }
    loadData();
  }, [userId]);

  /* ── save helpers ── */
  const mergeSettings = (patch) => {
    // read current saved family_info JSON and merge new keys
    let base = {};
    try { base = JSON.parse(data?.familyInfoJson || '{}'); } catch { /* noop */ }
    return { ...base, ...patch };
  };

  const saveSettings = async (patch) => {
    const payload = mergeSettings(patch);
    await backendApi.post(`/family/settings/${userId}`, payload);
    await loadData();
  };

  const handleSaveEmergency = async () => {
    setSavingEmergency(true);
    try {
      await saveSettings({ emergencyBufferMonths: Number(emergencyForm.emergencyBufferMonths) });
      setEditEmergency(false);
    } catch { alert('Failed to save emergency settings.'); }
    finally { setSavingEmergency(false); }
  };

  const handleSaveChild = async () => {
    setSavingChild(true);
    try {
      await saveSettings({
        childEducationTarget: Number(childForm.childEducationTarget),
        childTimelineYears:   Number(childForm.childTimelineYears),
        childSavedAmount:     Number(childForm.childSavedAmount),
        childSavedLocation:   childForm.childSavedLocation,
      });
      setEditChild(false);
    } catch { alert('Failed to save child education settings.'); }
    finally { setSavingChild(false); }
  };

  const handleSaveIncome = async () => {
    setSavingIncome(true);
    try {
      const cleaned = incomeMembers
        .filter(m => m.memberName.trim())
        .map(m => ({ memberName: m.memberName.trim(), income: Number(m.income) || 0 }));
      await saveSettings({ customIncomes: cleaned });
      setEditIncome(false);
    } catch { alert('Failed to save income members.'); }
    finally { setSavingIncome(false); }
  };

  const handleSaveMarriage = async () => {
    setSavingMarriage(true);
    try {
      await backendApi.post(`/family/marriage/${userId}`, {
        cost:           Number(marriageForm.cost),
        timelineMonths: Number(marriageForm.timelineMonths),
      });
      await saveSettings({
        marriageSavedAmount: Number(marriageForm.marriageSavedAmount),
        marriageSavedLocation: marriageForm.marriageSavedLocation
      });
      setEditMarriage(false);
    } catch { alert('Failed to save marriage plan.'); }
    finally { setSavingMarriage(false); }
  };

  /* ── Future Plans handlers ── */
  const savePlansToServer = async (plans) => {
    setSavingPlans(true);
    try {
      await saveSettings({ futurePlans: plans });
      setFuturePlans(plans);
    } catch { alert('Failed to save plans.'); }
    finally { setSavingPlans(false); }
  };

  const openAddPlan = () => {
    setPlanForm({ title: '', emoji: '🎯', targetAmount: '', timelineMonths: '', priority: 'Medium', notes: '', savedAmount: '' });
    setEditingPlanIdx(null);
    setShowAddPlan(true);
  };

  const openEditPlan = (idx) => {
    setPlanForm({ ...futurePlans[idx] });
    setEditingPlanIdx(idx);
    setShowAddPlan(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.title.trim() || !planForm.targetAmount) return;
    const newPlan = {
      ...planForm,
      targetAmount: Number(planForm.targetAmount),
      savedAmount: Number(planForm.savedAmount || 0),
      timelineMonths: Number(planForm.timelineMonths) || 12,
      createdAt: editingPlanIdx !== null ? futurePlans[editingPlanIdx].createdAt : new Date().toISOString(),
    };
    const updated = editingPlanIdx !== null
      ? futurePlans.map((p, i) => i === editingPlanIdx ? newPlan : p)
      : [...futurePlans, newPlan];
    await savePlansToServer(updated);
    setShowAddPlan(false);
  };

  const handleDeletePlan = async (idx) => {
    const updated = futurePlans.filter((_, i) => i !== idx);
    await savePlansToServer(updated);
  };

  /* ── open-edit helpers (pre-fill from existing data) ── */
  const openEmergency = () => {
    setEmergencyForm({ emergencyBufferMonths: data?.emergencyBufferMonths || 6 });
    setEditEmergency(true);
  };
  const openChild = () => {
    const parsed = JSON.parse(data?.familyInfoJson || '{}');
    setChildForm({
      childEducationTarget: data?.childEducationTarget || 500000,
      childTimelineYears:   data?.childTimelineYears   || 20,
      childSavedAmount:     parsed.childSavedAmount || 0,
      childSavedLocation:   parsed.childSavedLocation || '',
    });
    setEditChild(true);
  };
  const openIncome = () => {
    const existing = data?.incomeShares?.length
      ? data.incomeShares.map(s => ({ memberName: s.memberName, income: '' }))
      : [{ memberName: '', income: '' }];
    setIncomeMembers(existing);
    setEditIncome(true);
  };
  const openMarriage = () => {
    const parsed = JSON.parse(data?.familyInfoJson || '{}');
    setMarriageForm({
      cost:           data?.marriageCostEstimate  || 500000,
      timelineMonths: data?.monthsToSaveForMarriage || 24,
      marriageSavedAmount: parsed.marriageSavedAmount || 0,
      marriageSavedLocation: parsed.marriageSavedLocation || '',
    });
    setEditMarriage(true);
  };

  /* ── add / remove income member row ── */
  const addMember   = () => setIncomeMembers([...incomeMembers, { memberName: '', income: '' }]);
  const removeMember = (i) => setIncomeMembers(incomeMembers.filter((_, idx) => idx !== i));
  const updateMember = (i, key, val) => {
    const copy = [...incomeMembers];
    copy[i] = { ...copy[i], [key]: val };
    setIncomeMembers(copy);
  };

  /* ── Loading / error states ── */
  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Loading family insights…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="mx-auto max-w-lg mt-16 text-center p-8 rounded-[28px] bg-white/85 backdrop-blur border border-rose-200/80 shadow-sm">
      <div className="text-4xl mb-4">🏠</div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Family Hub Unavailable</h2>
      <p className="text-sm text-slate-500">{error}</p>
    </div>
  );

  if (!data) return null;

  const {
    stabilityScore, stabilityLevel, riskLevel, riskReason, preventiveSuggestion,
    survivalDays, emergencySavingsRequired, childReady, monthlySavingsNeeded,
    incomeShares, overallIncomeStability, singleIncomeDependency, dependencyImpact,
    emergencyReadinessScore, emergencySuggestions, recommendations,
    marriagePlanScore, marriageCostEstimate, monthsToSaveForMarriage, marriageRecommendations,
    emergencyBufferMonths,
  } = data;

  const parsedInfo = JSON.parse(data.familyInfoJson || '{}');
  const childSavedAmount = Number(parsedInfo.childSavedAmount || 0);
  const childSavedLocation = parsedInfo.childSavedLocation || '';
  const marriageSavedAmount = Number(parsedInfo.marriageSavedAmount || 0);
  const marriageSavedLocation = parsedInfo.marriageSavedLocation || '';

  const scoreColor = stabilityLevel === 'Green'
    ? { text: 'text-emerald-400', badge: 'bg-emerald-900/40 text-emerald-300', ring: 'ring-emerald-500/20' }
    : stabilityLevel === 'Yellow'
    ? { text: 'text-amber-400',   badge: 'bg-amber-900/40 text-amber-300',     ring: 'ring-amber-500/20' }
    : { text: 'text-rose-400',    badge: 'bg-rose-900/40 text-rose-300',        ring: 'ring-rose-500/20' };

  const riskConfig = riskLevel === 'Low'
    ? { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', icon: '🟢', text: 'text-emerald-700' }
    : riskLevel === 'Medium'
    ? { bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200',   icon: '🟡', text: 'text-amber-700' }
    : { bg: 'from-rose-50 to-red-50',     border: 'border-rose-200',     icon: '🔴', text: 'text-rose-700' };

  const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

  /* ── shared card wrapper ── */
  const Card = ({ children, className = '' }) => (
    <div className={`rounded-[20px] border border-slate-200/80 bg-white/85 backdrop-blur p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ icon, label, title, onEdit }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-base border border-slate-100">{icon}</div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
        </div>
      </div>
      {onEdit && (
        <button onClick={onEdit} className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition">
          ✏️ Edit
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-5 lg:p-6">

      {/* ── Header ── */}
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Family Stability Hub
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Family Financial Stability</h1>
            <p className="mt-1.5 text-xs leading-6 text-slate-400">
              AI-powered insights. Edit any card to personalise goals and targets.
            </p>
          </div>
          <div className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-5 py-3 ring-4 ${scoreColor.ring}`}>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Stability Score</p>
              <p className={`text-3xl font-bold mt-0.5 ${scoreColor.text}`}>
                {stabilityScore}<span className="text-base text-slate-500">/100</span>
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${scoreColor.badge}`}>{stabilityLevel}</span>
          </div>
        </div>
      </section>

      {/* ── Early Warning Banner ── */}
      <div className={`flex items-start gap-4 rounded-[22px] border ${riskConfig.border} bg-gradient-to-r ${riskConfig.bg} p-4`}>
        <span className="text-xl mt-0.5">{riskConfig.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${riskConfig.text}`}>Risk Level: {riskLevel} — {riskReason}</p>
          <p className="text-xs text-slate-600 mt-1 leading-5">{preventiveSuggestion}</p>
        </div>
      </div>

      {/* ── Row 1: Survival + Emergency Readiness ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Survival / Emergency Fund */}
        <Card>
          <CardHeader icon="🛡️" label="Emergency Fund" title="Survival Runway" onEdit={openEmergency} />
          {editEmergency ? (
            <>
              <Input
                label={`Buffer Target (months) — currently ${emergencyBufferMonths}`}
                value={emergencyForm.emergencyBufferMonths}
                onChange={e => setEmergencyForm({ emergencyBufferMonths: e.target.value })}
                placeholder="e.g. 6"
                accent="focus:ring-emerald-500"
              />
              <EditButtons
                onSave={handleSaveEmergency}
                onCancel={() => setEditEmergency(false)}
                saving={savingEmergency}
                bg="bg-emerald-600 hover:bg-emerald-700"
              />
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-bold text-slate-900">{survivalDays}</span>
                <span className="text-sm text-slate-400 font-medium">days covered</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${survivalDays >= 180 ? 'bg-emerald-500' : survivalDays >= 90 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, (survivalDays / 365) * 100)}%` }}
                />
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500">Additional savings needed ({emergencyBufferMonths}-month buffer)</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{fmt(emergencySavingsRequired)}</p>
              </div>
            </>
          )}
        </Card>

        {/* Emergency Readiness Score */}
        <Card>
          <CardHeader icon="🚨" label="Emergency Readiness" title="Preparedness Score" />
          <div className="relative flex items-center justify-center mb-3">
            <svg viewBox="0 0 120 65" className="w-44">
              <path d="M 12 58 A 48 48 0 0 1 108 58" fill="none" stroke="#F1F5F9" strokeWidth="12" strokeLinecap="round" />
              <path d="M 12 58 A 48 48 0 0 1 108 58" fill="none"
                stroke={emergencyReadinessScore >= 70 ? '#22C55E' : emergencyReadinessScore >= 40 ? '#F59E0B' : '#EF4444'}
                strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${(emergencyReadinessScore / 100) * 150.8} 150.8`} />
            </svg>
            <div className="absolute bottom-2 text-center">
              <p className="text-2xl font-bold text-slate-900 leading-none">{emergencyReadinessScore}</p>
              <p className="text-[10px] text-slate-400 font-bold">/100</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center leading-5">{emergencySuggestions}</p>
        </Card>
      </div>

      {/* ── Row 2: Child Education + Multi-Income ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Child Education */}
        <Card>
          <CardHeader icon="👶" label="Child Future" title="Education Readiness" onEdit={openChild} />
          {editChild ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Education Target per Child (Rs.)"
                  value={childForm.childEducationTarget}
                  onChange={e => setChildForm({ ...childForm, childEducationTarget: e.target.value })}
                  placeholder="e.g. 500000"
                  accent="focus:ring-emerald-500"
                />
                <Input
                  label="Years to Save"
                  value={childForm.childTimelineYears}
                  onChange={e => setChildForm({ ...childForm, childTimelineYears: e.target.value })}
                  placeholder="e.g. 20"
                  accent="focus:ring-emerald-500"
                />
                <Input
                  label="Amount Saved So Far (Rs.)"
                  value={childForm.childSavedAmount}
                  onChange={e => setChildForm({ ...childForm, childSavedAmount: e.target.value })}
                  placeholder="e.g. 50000"
                  accent="focus:ring-emerald-500"
                />
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Where is it saved?</label>
                  <input
                    type="text"
                    value={childForm.childSavedLocation}
                    onChange={e => setChildForm({ ...childForm, childSavedLocation: e.target.value })}
                    placeholder="e.g. SBI Fixed Deposit"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <EditButtons
                onSave={handleSaveChild}
                onCancel={() => setEditChild(false)}
                saving={savingChild}
                bg="bg-emerald-600 hover:bg-emerald-700"
              />
            </>
          ) : (
            <>
              <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${childReady ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                <span className="text-2xl">{childReady ? '✅' : '❌'}</span>
                <div>
                  <p className={`text-sm font-bold ${childReady ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {childReady ? 'On Track for Education Goals' : 'Savings Gap Detected'}
                  </p>
                  {!childReady && monthlySavingsNeeded > 0 && (
                    <p className="text-xs mt-0.5 text-slate-500">Save {fmt(monthlySavingsNeeded)}/month</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-5">
                Target: {fmt(data?.childEducationTarget)} per child · {data?.childTimelineYears || 20} years
              </p>
              {childSavedAmount > 0 && (
                <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Saved: {fmt(childSavedAmount)}</span>
                    <span>{Math.min(100, Math.round((childSavedAmount / (data?.childEducationTarget || 500000)) * 100))}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, (childSavedAmount / (data?.childEducationTarget || 500000)) * 100)}%` }} />
                  </div>
                  {childSavedLocation && <p className="text-[10px] text-slate-500 font-medium">📍 {childSavedLocation}</p>}
                </div>
              )}
            </>
          )}
        </Card>

        {/* Multi-Income Analyzer */}
        <Card>
          <CardHeader icon="💼" label="Multi-Income" title="Income Diversification" onEdit={openIncome} />
          {editIncome ? (
            <>
              <div className="space-y-2 mb-2">
                {incomeMembers.map((m, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <Input label={i === 0 ? 'Member Name' : ''} type="text" value={m.memberName} onChange={e => updateMember(i, 'memberName', e.target.value)} placeholder="e.g. Spouse" accent="focus:ring-emerald-500" />
                    <Input label={i === 0 ? 'Monthly Income (Rs.)' : ''} value={m.income} onChange={e => updateMember(i, 'income', e.target.value)} placeholder="e.g. 40000" accent="focus:ring-emerald-500" />
                    <button onClick={() => removeMember(i)} className="mb-0 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 px-2 py-2 text-sm transition">✕</button>
                  </div>
                ))}
              </div>
              <button onClick={addMember} className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold mt-1 mb-1">+ Add member</button>
              <EditButtons
                onSave={handleSaveIncome}
                onCancel={() => setEditIncome(false)}
                saving={savingIncome}
                bg="bg-emerald-600 hover:bg-emerald-700"
              />
            </>
          ) : (
            <>
              {singleIncomeDependency && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 mb-3">
                  <span>⚠️</span>
                  <p className="text-xs font-semibold text-amber-700">Single Income Dependency Risk</p>
                </div>
              )}
              <div className="space-y-2.5 mb-3">
                {incomeShares?.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-600">{s.memberName}</span>
                      <span className="font-bold text-slate-800">{s.contributionPct?.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.contributionPct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 leading-5">{overallIncomeStability} — {dependencyImpact}</p>
            </>
          )}
        </Card>
      </div>

      {/* ── Marriage Plan ── */}
      <div className="rounded-[24px] bg-gradient-to-br from-pink-950 via-rose-900 to-slate-900 border border-pink-800/30 p-5 lg:p-6 text-white shadow-[0_16px_50px_rgba(136,19,55,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500 rounded-full blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center text-base">💍</div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-pink-300">Marriage Plan</p>
                <p className="text-sm font-semibold">Wedding Financial Planner</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!editMarriage ? (
                <button onClick={openMarriage} className="rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-semibold transition">
                  ✏️ Edit Plan
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditMarriage(false)} disabled={savingMarriage} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20 transition">Cancel</button>
                  <button onClick={handleSaveMarriage} disabled={savingMarriage} className="rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold hover:bg-pink-600 transition">
                    {savingMarriage ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
              <div className="rounded-full bg-white/10 border border-white/10 px-3 py-1">
                <span className="text-xs font-bold text-pink-200">{marriagePlanScore}/100 score</span>
              </div>
            </div>
          </div>

          {editMarriage ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 bg-white/5 p-4 rounded-2xl border border-white/10">
              <DarkInput label="Target Budget (Rs.)" value={marriageForm.cost} onChange={e => setMarriageForm({ ...marriageForm, cost: e.target.value })} placeholder="e.g. 500000" />
              <DarkInput label="Timeline (Months)" value={marriageForm.timelineMonths} onChange={e => setMarriageForm({ ...marriageForm, timelineMonths: e.target.value })} placeholder="e.g. 24" />
              <DarkInput label="Amount Saved So Far (Rs.)" value={marriageForm.marriageSavedAmount} onChange={e => setMarriageForm({ ...marriageForm, marriageSavedAmount: e.target.value })} placeholder="e.g. 100000" />
              <div>
                <label className="block text-[10px] uppercase font-bold text-pink-300 mb-1">Where is it saved?</label>
                <input
                  type="text"
                  value={marriageForm.marriageSavedLocation}
                  onChange={e => setMarriageForm({ ...marriageForm, marriageSavedLocation: e.target.value })}
                  placeholder="e.g. Mutual Fund"
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-pink-300 font-bold">Target Cost</p>
                  <p className="text-xl font-bold mt-1">{fmt(marriageCostEstimate)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-pink-300 font-bold">Months to Save</p>
                  <p className="text-xl font-bold mt-1">{monthsToSaveForMarriage > 0 ? `${monthsToSaveForMarriage} mo.` : 'Goal Met ✓'}</p>
                </div>
              </div>
              {marriageSavedAmount > 0 && (
                <div className="mb-5 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                  <div className="flex justify-between text-[10px] text-pink-200 mb-1">
                    <span>Saved: {fmt(marriageSavedAmount)}</span>
                    <span>{Math.min(100, Math.round((marriageSavedAmount / Math.max(1, marriageCostEstimate)) * 100))}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-pink-500 rounded-full transition-all" style={{ width: `${Math.min(100, (marriageSavedAmount / Math.max(1, marriageCostEstimate)) * 100)}%` }} />
                  </div>
                  {marriageSavedLocation && <p className="text-[10px] text-pink-300">📍 {marriageSavedLocation}</p>}
                </div>
              )}
            </>
          )}

          {marriageRecommendations?.length > 0 && (
            <div className="space-y-2">
              {marriageRecommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-pink-100 leading-5">
                  <span className="text-pink-400 mt-0.5 font-bold">→</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── My Future Plans Board ── */}
      <div className="rounded-[24px] border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 via-white to-violet-50/60 backdrop-blur p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-base">🗺️</div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">Future Planning</p>
              <p className="text-sm font-bold text-slate-800">My Goals & Plans</p>
            </div>
          </div>
          <button
            onClick={openAddPlan}
            className="flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white transition shadow-sm"
          >
            <span className="text-base leading-none">+</span> Add Plan
          </button>
        </div>

        {/* Add / Edit Form */}
        {showAddPlan && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-700 mb-3">{editingPlanIdx !== null ? 'Edit Plan' : 'New Plan'}</p>

            {/* Emoji picker */}
            <div className="mb-3">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Pick an icon</label>
              <div className="flex flex-wrap gap-2">
                {PLAN_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setPlanForm({ ...planForm, emoji: e })}
                    className={`text-xl rounded-xl p-1.5 border-2 transition ${
                      planForm.emoji === e ? 'border-emerald-500 bg-emerald-50' : 'border-transparent hover:border-slate-200'
                    }`}
                  >{e}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Input label="Goal Title" type="text" value={planForm.title} onChange={e => setPlanForm({ ...planForm, title: e.target.value })} placeholder="e.g. Buy a House" accent="focus:ring-emerald-500" />
              <Input label="Target Amount (Rs.)" value={planForm.targetAmount} onChange={e => setPlanForm({ ...planForm, targetAmount: e.target.value })} placeholder="e.g. 2000000" accent="focus:ring-emerald-500" />
              <Input label="Timeline (Months)" value={planForm.timelineMonths} onChange={e => setPlanForm({ ...planForm, timelineMonths: e.target.value })} placeholder="e.g. 36" accent="focus:ring-emerald-500" />
              <Input label="Saved So Far (Rs.)" value={planForm.savedAmount} onChange={e => setPlanForm({ ...planForm, savedAmount: e.target.value })} placeholder="e.g. 50000" accent="focus:ring-emerald-500" />
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      onClick={() => setPlanForm({ ...planForm, priority: p })}
                      className={`flex-1 rounded-xl border px-2 py-1.5 text-xs font-semibold transition ${
                        planForm.priority === p ? PRIORITY_COLORS[p] : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Notes (optional)</label>
              <textarea
                value={planForm.notes}
                onChange={e => setPlanForm({ ...planForm, notes: e.target.value })}
                placeholder="Any details about this goal…"
                rows={2}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <EditButtons onSave={handleSavePlan} onCancel={() => setShowAddPlan(false)} saving={savingPlans} saveLabel={editingPlanIdx !== null ? 'Update' : 'Add Goal'} bg="bg-emerald-600 hover:bg-emerald-700" />
          </div>
        )}

        {/* Plans Grid */}
        {futurePlans.length === 0 && !showAddPlan ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-sm font-semibold text-slate-500">No plans yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first future goal — house, car, travel, retirement…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {futurePlans.map((plan, idx) => {
              const monthlyIncome = data ? (data.incomeShares?.reduce((s, sh) => s + (sh.contributionPct / 100), 0) || 1) : 1;
              // rough monthly savings needed = target / timeline
              const remaining = Math.max(0, plan.targetAmount - (plan.savedAmount || 0));
              const monthly = plan.timelineMonths > 0 ? Math.ceil(remaining / plan.timelineMonths) : remaining;
              const progressPct = Math.min(100, Math.round(((plan.savedAmount || 0) / Math.max(1, plan.targetAmount)) * 100));
              return (
                <div key={idx} className="relative rounded-2xl border border-white bg-white p-4 shadow-sm hover:shadow-md transition group">
                  {/* priority badge */}
                  <span className={`absolute top-3 right-3 rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLORS[plan.priority] || PRIORITY_COLORS.Medium}`}>
                    {plan.priority}
                  </span>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{plan.emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-800 pr-12">{plan.title}</p>
                      <p className="text-xs text-slate-400">{plan.timelineMonths} months away</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 mb-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Target</p>
                    <p className="text-base font-bold text-slate-900">Rs. {Number(plan.targetAmount).toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">≈ Rs. {monthly.toLocaleString('en-IN')}/mo needed</p>
                  </div>

                  {/* progress bar (placeholder 0%) */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>

                  {plan.notes && (
                    <p className="text-xs text-slate-400 italic leading-4 mb-3">{plan.notes}</p>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => openEditPlan(idx)} className="flex-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 py-1.5 transition">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDeletePlan(idx)} className="rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-xs font-semibold text-rose-500 px-3 py-1.5 transition">
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── AI Recommendations ── */}
      {recommendations?.length > 0 && (
        <div className="rounded-[24px] border border-slate-200/80 bg-white/85 backdrop-blur p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-base">🧠</div>
            <p className="text-sm font-bold text-slate-800">AI Recommendations</p>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <span className="text-blue-500 text-sm font-bold mt-0.5">{i + 1}.</span>
                <p className="text-xs text-slate-600 leading-5">{r}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyStabilityHub;
