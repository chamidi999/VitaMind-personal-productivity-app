import React, { useEffect, useState } from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from '../types';

interface NotificationCenterProps {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onRead: (id: number) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

export default function NotificationCenter({ notifications, setNotifications, onRead, isOpen, onClose, token }: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!isOpen || !token) return;

    const loadNotifications = async () => {
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    };

    loadNotifications().catch((error) => console.error('Failed to load notifications', error));
  }, [isOpen, token, setNotifications]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed top-20 right-10 w-96 bg-card border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-card/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-royal px-2 py-0.5 rounded-full text-xs font-black">{unreadCount} NEW</span>
                  )}
                </div>
                <button className="text-xs text-muted-foreground font-bold hover:text-foreground hover:underline">Mark all read</button>
              </div>

              <div className="max-h-125 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {notifications.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 italic text-sm">All caught up!</p>
                  </div>
                )}
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 rounded-2xl border transition-all ${n.is_read ? 'bg-transparent border-transparent' : 'bg-royal/5 border-royal/10'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-bold ${n.is_read ? 'text-gray-400' : 'text-white'}`}>{n.title}</h4>
                      <span className="text-[10px] text-gray-600 font-medium">2h ago</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${n.is_read ? 'text-gray-500' : 'text-gray-400'}`}>{n.message}</p>
                    <div className="mt-3 flex gap-4">
                       {!n.is_read && (
                         <button 
                          onClick={() => onRead(n.id)}
                          className="flex items-center gap-1.5 text-[11px] font-black text-muted-foreground hover:text-foreground"
                         >
                           <Check size={12} /> MARK AS READ
                         </button>
                       )}
                       <button className="flex items-center gap-1.5 text-[11px] font-black text-gray-500 hover:text-white">
                         <Trash2 size={12} /> REMOVE
                       </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-midnight/50 border-t border-white/5">
                <button className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                  View Notification History <ExternalLink size={12} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
