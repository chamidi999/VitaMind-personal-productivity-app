import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Target, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import MilestoneList from '../MilestoneList';
import { Goal } from '../../types';

interface GoalsViewProps {
  goals: Goal[];
  onAdd: (data: Partial<Goal>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onAddMilestone: (goalId: number, title: string) => Promise<void>;
  onToggleMilestone: (id: number, isCompleted: boolean) => Promise<void>;
  onDeleteMilestone: (id: number) => Promise<void>;
}

export default function GoalsView({ 
  goals, 
  onAdd, 
  onDelete, 
  onAddMilestone, 
  onToggleMilestone, 
  onDeleteMilestone 
}: GoalsViewProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [targetDate, setTargetDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, category, target_date: targetDate });
    setTitle('');
    setTargetDate('');
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl space-y-8">
      <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-white/5">
        <div>
          <h2 className="text-2xl font-bold text-white">Vision Horizon</h2>
          <p className="text-gray-400 text-sm">Design your ultimate future architecture.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-royal text-white px-6 py-3 rounded-xl font-bold hover:bg-royal-light transition-all flex items-center gap-2"
        >
          <Plus size={20} /> {isAdding ? 'Close' : 'New Goal'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card p-8 rounded-3xl border border-white/5 mb-8">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Master TypeScript 5.0"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Target Date</label>
                  <input 
                    type="date" 
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 outline-none"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button type="submit" className="bg-royal text-white px-10 py-3 rounded-xl font-bold hover:bg-royal-light transition-all">
                    Launch Objective
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {goals.map(goal => (
          <div key={goal.id} className="bg-card rounded-3xl border border-white/5 overflow-hidden group">
            <div className="p-6 flex items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-royal/10 rounded-2xl flex items-center justify-center text-royal">
                   <Target size={24} />
                 </div>
                 <div>
                   <h4 className="text-xl font-bold text-white">{goal.title}</h4>
                   <p className="text-sm text-gray-500">Target: {goal.target_date || 'Ongoing'}</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-6">
                 <div className="hidden md:block w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-royal transition-all duration-1000" 
                    style={{ width: `${goal.progress}%` }}
                   />
                 </div>
                 <div className="flex items-center gap-2">
                   {goal.status === 'completed' && <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]"></div>}
                   <button 
                    onClick={() => onDelete(goal.id)}
                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-500/10 rounded-xl"
                   >
                     <Trash2 size={20} />
                   </button>
                   <button 
                    onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                    className="p-2 text-gray-500 hover:text-white"
                   >
                     {expandedGoal === goal.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                   </button>
                 </div>
               </div>
            </div>

            <AnimatePresence>
              {expandedGoal === goal.id && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-white/5 bg-white/2"
                >
                  <div className="p-8">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Milestones Architecture</h5>
                    <MilestoneList 
                      milestones={goal.milestones}
                      onToggle={onToggleMilestone}
                      onDelete={onDeleteMilestone}
                      onAdd={(mTitle) => onAddMilestone(goal.id, mTitle)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
