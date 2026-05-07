import React, { useState } from 'react';
import { User, Shield, Info, Image, Bell, CreditCard, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types';

interface SettingsPanelProps {
  user: UserType;
  onUpdateUser: (data: Partial<UserType>) => Promise<void>;
  onClose: () => void;
  token: string;
}

export default function SettingsPanel({ user, onUpdateUser, onClose, token }: SettingsPanelProps) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [reminders, setReminders] = useState<Array<{ id: number; title: string; message: string; is_read: boolean; created_at: string }>>([]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please select JPG, PNG, or GIF image.');
      return;
    }
    if (file.size > 800 * 1024) {
      alert('Please select an image under 800KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdateUser({
      name,
      bio,
      ...(avatarUrl.startsWith('data:image/') ? { avatar_url: avatarUrl } : {})
    });
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  const tabs = [
    { id: 'profile', icon: <User size={18} />, label: 'Profile' },
    { id: 'account', icon: <Shield size={18} />, label: 'Security' },
    { id: 'notifications', icon: <Bell size={18} />, label: 'Reminders' },
    // { id: 'billing', icon: <CreditCard size={18} />, label: 'Premium' },
  ];

  const [activeTab, setActiveTab] = useState('profile');

  React.useEffect(() => {
    if (activeTab !== 'notifications') return;
    const loadReminders = async () => {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(data.filter((n: any) => n.type === 'task'));
      }
    };
    loadReminders().catch((e) => console.error('Failed to load reminders', e));
  }, [activeTab, token]);

  return (
    <div className="w-full relative">
      <button 
        onClick={onClose}
        className="absolute -top-12 right-0 p-2 text-gray-500 hover:text-white transition-colors"
        title="Close settings"
      >
        <X size={24} />
      </button>
      <div className="w-full flex flex-col md:flex-row items-start gap-10">
      <div className="w-full md:w-64 space-y-2 flex flex-col items-start">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === tab.id ? 'bg-royal text-white' : 'text-gray-500 hover:bg-white/5'}`}
          >
            {tab.icon}
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 w-full">
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
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile avatar"
                      className="h-20 w-20 rounded-full object-cover border-2 border-royal/30"
                    />
                  ) : (
                    <div className="h-20 w-20 bg-royal/10 rounded-full flex items-center justify-center text-royal font-black text-2xl border-2 border-royal/30">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <label className="text-royal text-sm font-bold hover:underline mb-1 flex items-center gap-2 cursor-pointer">
                      <Image size={14} /> Change Avatar
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
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
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-4 py-3 text-sm text-[#191970] placeholder:text-[#9CA3AF] focus:border-[#4169E1] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={user.email}
                      disabled
                      className="w-full bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl px-4 py-3 text-sm text-[#191970] placeholder:text-[#9CA3AF] cursor-not-allowed"
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
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-4 py-3 text-sm text-[#191970] placeholder:text-[#9CA3AF] focus:border-[#4169E1] outline-none resize-none"
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

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-white/5 rounded-3xl p-8"
            >
              <h3 className="text-xl font-bold mb-2">Task Deadline Reminders</h3>
              <p className="text-sm text-gray-500 mb-6">Automatic reminders are generated for 2 days before, 1 day before, and on due date.</p>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {reminders.length === 0 && (
                  <div className="text-sm text-gray-500 italic py-8 text-center">No reminder messages yet.</div>
                )}
                {reminders.map(reminder => (
                  <div key={reminder.id} className={`p-4 rounded-2xl border ${reminder.is_read ? 'border-white/5 bg-white/2' : 'border-royal/20 bg-royal/5'}`}>
                    <p className="font-bold text-sm mb-1">{reminder.title}</p>
                    <p className="text-xs text-gray-400">{reminder.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
}
