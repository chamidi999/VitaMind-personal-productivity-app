import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Flame, Trash2 } from 'lucide-react';
import { Habit } from '../../types';

interface HabitsViewProps {
  habits: Habit[];
  onAdd: (name: string) => Promise<void>;
  onComplete: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
}

export default function HabitsView({ habits, onAdd, onComplete, onDelete, onUpdate }: HabitsViewProps) {
  const [newName, setNewName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName);
    setNewName('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-8 overflow-x-hidden px-0">
      <div className="bg-card p-8 rounded-3xl border border-white/5">
        <h3 className="text-xl font-bold text-[#191970] mb-6">New Ritual</h3>
        <form onSubmit={handleSubmit} className="flex flex-col min-[420px]:flex-row gap-3 min-[420px]:items-center">
          <input 
            type="text" 
            placeholder="Atomic habit name..." 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full min-[420px]:flex-1 bg-background border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-royal/50 outline-none"
          />
          <button type="submit" className="h-11 w-full min-[420px]:w-auto bg-royal text-white px-4 md:px-8 rounded-lg font-bold text-sm sm:text-base hover:bg-royal-light transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus size={20} /> Create
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {habits.map(habit => (
          <HabitItem 
            key={habit.id} 
            habit={habit} 
            onComplete={onComplete} 
            onDelete={onDelete} 
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </motion.div>
  );
}

function HabitItem({ habit, onComplete, onDelete, onUpdate }: { 
  habit: Habit, 
  onComplete: (id: number) => Promise<void>, 
  onDelete: (id: number) => Promise<void>,
  onUpdate: (id: number, name: string) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(habit.name);

  const save = async () => {
    if (name !== habit.name) {
      await onUpdate(habit.id, name);
    }
    setIsEditing(false);
  };

  const isDoneToday = habit.last_completed && (typeof habit.last_completed === 'string' ? habit.last_completed : (habit.last_completed as any).toISOString()).split('T')[0] === new Date().toISOString().split('T')[0];

  return (
    <div className="bg-card p-6 rounded-3xl border border-white/5 flex items-center justify-between group relative">
      <div className="flex-1">
        {isEditing ? (
          <input 
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={save}
            onKeyPress={e => e.key === 'Enter' && save()}
            className="bg-background text-[#191970] font-bold text-lg px-2 py-1 rounded w-full border border-royal/50"
          />
        ) : (
          <h4 
            className="text-lg font-bold text-[#191970] cursor-pointer hover:text-royal transition-colors" 
            onClick={() => setIsEditing(true)}
          >
            {habit.name}
          </h4>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Flame size={16} className={habit.streak > 0 ? "text-orange-500" : "text-gray-700"} />
          <span className="text-sm font-semibold text-gray-700">{habit.streak} day streak</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => !isDoneToday && onComplete(habit.id)}
          disabled={!!isDoneToday}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            isDoneToday
              ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
              : 'bg-royal text-white hover:bg-royal-light'
          }`}
        >
          {isDoneToday ? 'Locked' : 'Execute'}
        </button>
        <button 
          onClick={() => onDelete(habit.id)}
          className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-500/10 rounded-xl"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
