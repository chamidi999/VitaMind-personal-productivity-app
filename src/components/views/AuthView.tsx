import React, { useState } from 'react';
import { Zap, ShieldCheck } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

interface AuthViewProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (name: string, email: string, password: string) => Promise<string | null>;
}

export default function AuthView({ onLogin, onRegister }: AuthViewProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const schema = authMode === 'login' ? loginSchema : registerSchema;
    const result = schema.safeParse(authMode === 'login' ? { email, password } : { name, email, password });

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    let err;
    if (authMode === 'login') {
      err = await onLogin(email, password);
    } else {
      err = await onRegister(name, email, password);
    }

    if (err) setError(err);
  };

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4 font-sans selection:bg-royal/30">
      <div className="w-full max-w-md bg-card rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-10">
          <div className="flex justify-center mb-8">
            <div className="h-16 w-16 bg-royal rounded-2xl flex items-center justify-center shadow-lg shadow-royal/20">
              <Zap className="text-white h-10 w-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">VitaMind</h1>
          <p className="text-gray-400 text-center mb-8">Premium Lifestyle Management</p>
          
          <div className="flex bg-background/50 p-1 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${authMode === 'login' ? 'bg-royal text-white shadow-lg shadow-royal/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${authMode === 'register' ? 'bg-royal text-white shadow-lg shadow-royal/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Sign Up
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#D1D5DB] rounded-2xl px-5 py-3.5 text-[#191970] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#D1D5DB] rounded-2xl px-5 py-3.5 text-[#191970] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] transition-all"
                placeholder="name@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#D1D5DB] rounded-2xl px-5 py-3.5 text-[#191970] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm font-bold text-center bg-red-500/10 py-2 rounded-xl border border-red-500/20">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-royal hover:bg-royal-light text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-royal/20 transition-all active:scale-[0.98] mt-4"
            >
              {authMode === 'login' ? 'Sign In to Zenith' : 'Initialize Account'}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm">
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-gray-500 hover:text-royal font-medium transition-colors"
            >
              {authMode === 'login' ? "New operative? Initialize here" : "Return to active session"}
            </button>
          </div>
        </div>
        <div className="bg-royal/10 py-4 text-center border-t border-white/5">
           <div className="flex items-center justify-center gap-2 text-royal/70 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={14} /> Neural-Link Encrypted
           </div>
        </div>
      </div>
    </div>
  );
}
