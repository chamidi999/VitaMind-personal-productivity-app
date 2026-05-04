import React, { useState, useEffect } from 'react';
import { Users, Activity, ShieldAlert, MoreHorizontal, Ban } from 'lucide-react';
import { User } from '../types';

interface AdminPanelProps {
  token: string;
}

export default function AdminPanel({ token }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<{ users: { count: number }, tasks: { count: number } } | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const uRes = await fetch('/api/admin/users', { headers });
      const sRes = await fetch('/api/admin/stats', { headers });
      if (uRes.ok) setUsers(await uRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch (e) {
      console.error('Admin fetch error', e);
    }
  };

  const handleDeleteAccount = async (userId: number, name: string) => {
    const confirmed = window.confirm(`Delete account for ${name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to delete account');
        return;
      }
      await fetchAdminData();
    } catch (e) {
      alert('Failed to delete account');
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-white/5 rounded-3xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-royal/10 text-royal rounded-2xl">
              <Users size={24} />
            </div>
            <h4 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Total Users</h4>
          </div>
          <p className="text-4xl font-black">{stats?.users.count || 0}</p>
        </div>
        <div className="bg-card border border-white/5 rounded-3xl p-6">
           <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Activity size={24} />
            </div>
            <h4 className="text-gray-500 font-bold uppercase tracking-widest text-xs">System Workload</h4>
          </div>
          <p className="text-4xl font-black">{stats?.tasks.count || 0} Tasks</p>
        </div>
        <div className="bg-card border border-white/5 rounded-3xl p-6">
           <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
              <ShieldAlert size={24} />
            </div>
            <h4 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Security Status</h4>
          </div>
          <p className="text-4xl font-black uppercase text-emerald-500">Nominal</p>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-bold">User Directory</h3>
          <button className="bg-white/5 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">Export DB (JSON)</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">User Identity</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Role</th>
                <th className="px-8 py-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/2">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-royal/10 text-royal rounded-full flex items-center justify-center font-bold">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm tracking-tight">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Active
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${u.role === 'admin' ? 'bg-royal/10 text-royal' : 'bg-gray-500/10 text-gray-500'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                       <button
                          onClick={() => handleDeleteAccount(u.id, u.name)}
                          className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors"
                          title="Delete account"
                        >
                          <Ban size={16} />
                       </button>
                       <button className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors">
                          <MoreHorizontal size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
