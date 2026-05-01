import React, { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Milestone } from 'lucide-react';
import { Milestone as MilestoneType } from '../types';

interface MilestoneListProps {
  milestones: MilestoneType[];
  onToggle: (id: number, isCompleted: boolean) => void;
  onDelete: (id: number) => void;
  onAdd: (title: string) => void;
}

export default function MilestoneList({ milestones, onToggle, onDelete, onAdd }: MilestoneListProps) {
  const [newMilestone, setNewMilestone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    onAdd(newMilestone);
    setNewMilestone('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Milestone size={18} className="text-royal" />
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Key Milestones</h4>
      </div>

      <div className="space-y-2">
        {milestones.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-midnight/50 rounded-xl border border-white/5 group hover:border-white/10 transition-all">
            <button 
              onClick={() => onToggle(m.id, !m.is_completed)}
              className={`transition-colors ${m.is_completed ? 'text-emerald-500' : 'text-gray-600 hover:text-white'}`}
            >
              {m.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </button>
            <span className={`flex-1 text-sm ${m.is_completed ? 'text-gray-600 line-through' : 'text-white'}`}>
              {m.title}
            </span>
            <button 
              onClick={() => onDelete(m.id)}
              className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-500/10 rounded-lg cursor-pointer"
              title="Delete milestone"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <input 
          type="text" 
          value={newMilestone}
          onChange={e => setNewMilestone(e.target.value)}
          placeholder="New milestone..."
          className="flex-1 bg-background border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#191970] placeholder:text-gray-400 focus:ring-2 focus:ring-royal/50 outline-none"
        />
        <button 
          type="submit"
          disabled={!newMilestone.trim()}
          className="bg-royal text-white px-3 py-2.5 rounded-xl hover:bg-royal-light transition-colors disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
}
