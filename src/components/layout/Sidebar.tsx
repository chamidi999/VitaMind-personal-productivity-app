import React from 'react';
import { 
  Zap, LayoutDashboard, CheckSquare, Flame, 
  Target, MessageSquare, ShieldAlert, Settings as SettingsIcon, LogOut 
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, View } from '../../types';

interface SidebarProps {
  user: User | null;
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, currentView, onViewChange, onLogout }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-72 border-r border-[#0f1458] flex-col p-6 fixed h-screen bg-[#191970] z-20">
      <div className="flex items-center gap-3 mb-12">
        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center">
          <Zap className="text-royal h-6 w-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">VitaMind</span>
      </div>

      <nav className="flex-1 space-y-2">
        <NavItem active={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <NavItem active={currentView === 'tasks'} onClick={() => onViewChange('tasks')} icon={<CheckSquare size={20} />} label="Tasks" />
        <NavItem active={currentView === 'habits'} onClick={() => onViewChange('habits')} icon={<Flame size={20} />} label="Habits" />
        <NavItem active={currentView === 'goals'} onClick={() => onViewChange('goals')} icon={<Target size={20} />} label="Goals" />
        <NavItem active={currentView === 'ai'} onClick={() => onViewChange('ai')} icon={<MessageSquare size={20} />} label="VitaMind" />
        {user?.role === 'admin' && (
          <NavItem active={currentView === 'admin'} onClick={() => onViewChange('admin')} icon={<ShieldAlert size={20} />} label="Admin Panel" />
        )}
        <NavItem active={currentView === 'settings'} onClick={() => onViewChange('settings')} icon={<SettingsIcon size={20} />} label="Settings" />
      </nav>

      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 p-2">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="User avatar"
              className="h-10 w-10 rounded-full object-cover border border-royal/20"
            />
          ) : (
            <div className="h-10 w-10 bg-royal/10 rounded-full flex items-center justify-center text-royal font-bold border border-royal/20">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
            <p className="text-xs text-blue-200 truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-blue-100 hover:bg-white/10 hover:text-white transition-all group font-bold"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="text-sm">Logout / Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group ${
        active 
          ? 'text-white bg-royal/25' 
          : 'text-blue-100 hover:text-white hover:bg-white/10'
      }`}
    >
      <div className={`${active ? 'text-royal' : 'group-hover:text-white'} transition-colors`}>
        {icon}
      </div>
      <span className="font-semibold text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute left-0 w-1 h-6 bg-royal rounded-r-full shadow-[0_0_10px_#4169e1]"
        />
      )}
    </button>
  );
}
