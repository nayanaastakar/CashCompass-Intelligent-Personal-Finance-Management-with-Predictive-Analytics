import React, { useEffect, useState } from 'react';
import { backendApi } from '../api/axiosConfig';
import { Link } from 'react-router-dom';

const GoalVault = () => {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [g, s] = await Promise.all([backendApi.get('/goal'), backendApi.get('/dashboard/summary')]);
      setGoals(g.data || []);
      setSummary(s.data || null);
    } catch (e) {
      setError('Could not load vault data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-6">Loading Goal Vault...</div>;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Dream Goal Vault</h1>
        <Link to="/goals" className="text-sm text-finBlue">Manage Goals</Link>
      </div>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(g => (
          <div key={g.id} className="p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{g.name}</p>
                <p className="text-xs text-slate-500 mt-1">Target: ₹{Number(g.targetAmount).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right text-xs text-slate-500">Due: {g.targetDate || '—'}</div>
            </div>

            <div className="mt-3 text-sm text-slate-700">
              <p>Saved: ₹{Number(g.currentAmount).toLocaleString('en-IN')}</p>
              <p className="mt-1">Progress: {Math.min(100, Math.round((Number(g.currentAmount)/Number(g.targetAmount))*100))}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalVault;
