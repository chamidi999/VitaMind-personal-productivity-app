import React, { useState } from 'react';
import { User, Shield, Info, Image, Bell, CreditCard, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types';

interface SettingsPanelProps {
  user: UserType;
  onUpdateUser: (data: Partial<UserType>) => Promise<void>;
  onClose: () => void;
}

export default function SettingsPanel({ user, onUpdateUser, onClose }: SettingsPanelProps) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdateUser({ name, bio });
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose(); // Close back to dashboard after save
    }, 1500);
  };

  const tabs = [
    { id: 'profile', icon: <User size={18} />, label: 'Profile' },
    { id: 'account', icon: <Shield size={18} />, label: 'Security' },
    { id: 'notifications', icon: <Bell size={18} />, label: 'Reminders' },
    { id: 'billing', icon: <CreditCard size={18} />, label: 'Premium' },
  ];

  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="max-w-4xl mx-auto relative">
      <button 
        onClick={onClose}
        className="absolute -top-12 right-0 p-2 text-gray-500 hover:text-white transition-colors"
        title="Close settings"
      >
        <X size={24} />
      </button>
      <div className="flex flex-col md:flex-row gap-10">
      <div className="w-full md:w-64 space-y-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-royal text-white' : 'text-gray-500 hover:bg-white/5'}`}
          >
            {tab.icon}
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card border border-white/5 rounded-3xl p-8"
            >
              <h3 className="text-xl font-bold mb-8">Public Profile</h3>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center gap-6 mb-8">
                  <div className="h-20 w-20 bg-royal/10 rounded-full flex items-center justify-center text-royal font-black text-2xl border-2 border-royal/30">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <button type="button" className="text-royal text-sm font-bold hover:underline mb-1 flex items-center gap-2">
                      <Image size={14} /> Change Avatar
                    </button>
                    <p className="text-gray-500 text-xs">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-midnight border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-royal/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={user.email}
                      disabled
                      className="w-full bg-midnight/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Short Bio</label>
                  <textarea 
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-midnight border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-royal/50 outline-none resize-none"
                  />
                </div>

                <div className="pt-4 flex justify-between items-center">
                   <AnimatePresence>
                     {showSuccess && (
                       <motion.span 
                         initial={{ opacity: 0, x: -10 }} 
                         animate={{ opacity: 1, x: 0 }} 
                         exit={{ opacity: 0 }}
                         className="text-emerald-500 text-sm font-bold flex items-center gap-2"
                       >
                         <CheckSquare size={16} /> Profile Updated Successfully
                       </motion.span>
                     )}
                   </AnimatePresence>
                   <button 
                    type="submit" 
                    disabled={isSaving}
                    className="bg-royal text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-royal/20 hover:bg-blue-600 transition-all disabled:opacity-50"
                   >
                     {isSaving ? 'Saving...' : 'Save Changes'}
                   </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-white/5 rounded-3xl p-8"
            >
              <h3 className="text-xl font-bold mb-8">Security & Access</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-midnight rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <button className="text-royal text-sm font-bold">Enable</button>
                </div>

                <div className="pt-8">
                  <h4 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">
                    <Info size={16} /> Dangerous Territory
                  </h4>
                  <div className="p-6 border border-red-500/20 rounded-2xl bg-red-500/5">
                    <p className="text-sm text-gray-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-6 py-2 rounded-xl text-sm font-bold transition-all">
                      Delete Account
                    </button>
                  </div>
                </div>

                <div className="pt-8 flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-royal text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-royal/20 hover:bg-blue-600 transition-all"
                  >
                    {isSaving ? 'Updating...' : 'Save Security Settings'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
}
