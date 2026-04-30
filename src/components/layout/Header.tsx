import React from 'react';
import { Search, Bell } from 'lucide-react';
import { format } from 'date-fns';
import NotificationCenter from '../NotificationCenter';

interface HeaderProps {
  viewTitle: string;
  notifications: any[];
  isNoteOpen: boolean;
  setIsNoteOpen: (open: boolean) => void;
  onReadNotification: (id: number) => Promise<void>;
}

export default function Header({ viewTitle, notifications, isNoteOpen, setIsNoteOpen, onReadNotification }: HeaderProps) {
  return (
    <header className="flex justify-between items-center mb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#191970]">{viewTitle}</h2>
        <p className="text-gray-600 mt-1">{format(new Date(), 'EEEE, MMMM do')}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search files..." 
            className="bg-card border border-gray-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-royal/50 w-64 transition-all"
          />
        </div>
        <button 
          onClick={() => setIsNoteOpen(!isNoteOpen)}
          className="h-11 w-11 bg-card border border-gray-200 rounded-2xl flex items-center justify-center text-gray-500 hover:text-[#191970] transition-colors relative group"
        >
           <Bell size={20} className="group-hover:rotate-12 transition-transform" />
           {notifications.some(n => !n.is_read) && (
             <span className="absolute top-3 right-3 h-2 w-2 bg-royal rounded-full border-2 border-white shadow-[0_0_8px_#4169e1]"></span>
           )}
        </button>
        <NotificationCenter 
          isOpen={isNoteOpen} 
          onClose={() => setIsNoteOpen(false)} 
          notifications={notifications} 
          onRead={onReadNotification}
        />
      </div>
    </header>
  );
}
