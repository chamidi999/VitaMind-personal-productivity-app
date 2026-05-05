import React from 'react';
import { 
  Zap, LayoutDashboard, CheckSquare, Flame, 
  Target, MessageSquare, BarChart3, ShieldAlert, Settings as SettingsIcon, LogOut 
} from 'lucide-react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { User } from '../../types';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-72 border-r border-border flex-col p-6 fixed h-screen bg-card z-20">
      <div className="flex items-center gap-3 mb-12">
        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center">
          <Zap className="text-royal h-6 w-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">VitaMind</span>
      </div>

      <nav className="flex-1 space-y-2">
        <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <NavItem to="/tasks" icon={<CheckSquare size={20} />} label="Tasks" />
        <NavItem to="/habits" icon={<Flame size={20} />} label="Habits" />
        <NavItem to="/goals" icon={<Target size={20} />} label="Goals" />
        <NavItem to="/oracle" icon={<MessageSquare size={20} />} label="VitaMind" />
        <NavItem to="/reports" icon={<BarChart3 size={20} />} label="Reports" />
        {user?.role === 'admin' && (
          <NavItem to="/admin" icon={<ShieldAlert size={20} />} label="Admin Panel" />
        )}
        <NavItem to="/settings" icon={<SettingsIcon size={20} />} label="Settings" />
      </nav>

      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 p-2">
          <div className="h-10 w-10 bg-royal/10 rounded-full flex items-center justify-center text-royal font-bold border border-royal/20">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group ${
        isActive
          ? 'text-white bg-royal/25' 
          : 'text-blue-100 hover:text-white hover:bg-white/10'
      }`}
    >
      {({ isActive }) => (
        <>
          <div className={`${isActive ? 'text-royal' : 'group-hover:text-white'} transition-colors`}>
            {icon}
          </div>
          <span className="font-semibold text-sm">{label}</span>
          {isActive && (
            <motion.div 
              layoutId="nav-active"
              className="absolute left-0 w-1 h-6 bg-royal rounded-r-full shadow-[0_0_10px_#4169e1]"
            />
          )}
        </>
      )}
    </NavLink>
  );
}
