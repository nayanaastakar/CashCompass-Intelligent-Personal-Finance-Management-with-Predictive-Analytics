import React, { useEffect, useState } from 'react';
import { backendApi } from '../api/axiosConfig';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await backendApi.get('/auth/profile');
      setProfile(res.data);
      setEditData(res.data);
      setError('');
    } catch (err) {
      setError('Unable to load profile. Please sign in again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await backendApi.put('/auth/profile', {
        name: editData.name,
        age: editData.age,
        familySize: editData.familySize,
        employmentType: editData.employmentType,
      });
      await loadProfile();
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
    setError('');
  };

  if (loading && !profile) {
    return (
      <div className="p-6">
        <div className="text-slate-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
      {/* Header */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-800 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              Identity Center
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">My Profile</h1>
            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300">Review your account details and basic profile information used for personalization.</p>
          </div>
          <div className="flex gap-3">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 hover:scale-[1.02] shadow-lg">
                  Edit Profile
                </button>
                <button onClick={loadProfile} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 hover:scale-[1.02] shadow-lg">
                  Refresh Data
                </button>
              </>
            ) : (
              <>
                <button onClick={handleCancel} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-600 shadow-lg disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 hover:scale-[1.02] shadow-lg disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/85 backdrop-blur rounded-[32px] border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.05)] p-6 lg:p-8 relative overflow-hidden group hover:border-blue-300 transition-colors duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-cyan-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-lg">👤</div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Account Details</p>
          </div>
          
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Full Name</p>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editData.name || ''} 
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <p className="text-base font-semibold text-slate-800">{profile?.name || '—'}</p>
              )}
            </div>
            <div className="w-full h-px bg-slate-100"></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
              <p className="text-base font-semibold text-slate-500">{profile?.email || '—'} <span className="text-[10px] ml-2 text-slate-400 font-normal">(Cannot be changed)</span></p>
            </div>
            <div className="w-full h-px bg-slate-100"></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Employment Type</p>
              {isEditing ? (
                <select 
                  value={editData.employmentType || ''}
                  onChange={(e) => setEditData({...editData, employmentType: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select...</option>
                  <option value="SALARIED">Salaried</option>
                  <option value="BUSINESS_OWNER">Business Owner</option>
                  <option value="SELF_EMPLOYED">Self Employed</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                  <option value="STUDENT">Student</option>
                </select>
              ) : (
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{profile?.employmentType || 'Not set'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur rounded-[32px] border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.05)] p-6 lg:p-8 relative overflow-hidden group hover:border-indigo-300 transition-colors duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-lg">⚙️</div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Personal Factors</p>
          </div>
          
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Age</p>
              {isEditing ? (
                <input 
                  type="number" 
                  value={editData.age || ''} 
                  onChange={(e) => setEditData({...editData, age: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-base font-semibold text-slate-800">{profile?.age ?? '—'}</p>
              )}
            </div>
            <div className="w-full h-px bg-slate-100"></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Family Size</p>
              {isEditing ? (
                <input 
                  type="number" 
                  value={editData.familySize || ''} 
                  onChange={(e) => setEditData({...editData, familySize: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-base font-semibold text-slate-800">{profile?.familySize ?? '—'}</p>
              )}
            </div>
            <div className="w-full h-px bg-slate-100"></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">User Identifier</p>
              <p className="text-sm font-mono text-slate-500">{profile?.id || '—'} <span className="text-[10px] ml-2 text-slate-400 font-normal">(Cannot be changed)</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/85 backdrop-blur rounded-[32px] border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.05)] p-6 lg:p-8 relative overflow-hidden group hover:border-emerald-300 transition-colors duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-lg">🔒</div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Security & Preferences</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Two-Factor Authentication</p>
            <p className="text-xs text-slate-500 mb-3">Add an extra layer of security to your account.</p>
            <button className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">Enable 2FA</button>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Email Notifications</p>
            <p className="text-xs text-slate-500 mb-3">Manage your weekly reports and alerts.</p>
            <button className="rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-xs font-semibold hover:bg-emerald-100 transition">Manage Preferences</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
