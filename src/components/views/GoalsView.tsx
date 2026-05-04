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
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onAdd({ title, description, category, target_date: targetDate });
    setTitle('');
    setDescription('');
    setTargetDate('');
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1200px] ml-0 w-full space-y-6 overflow-x-hidden px-0 pt-20 md:pt-10 pb-8">
      <div className="flex flex-wrap sm:flex-nowrap justify-between items-start sm:items-center gap-4 bg-card p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        <div>
          <h2 className="text-2xl font-bold text-[#191970]">Vision Horizon</h2>
          <p className="text-gray-700 text-sm">Design your ultimate future architecture.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="h-11 bg-royal text-white px-4 md:px-6 rounded-lg font-bold text-sm sm:text-base hover:bg-royal-light transition-all flex items-center justify-center gap-2 whitespace-nowrap"
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
                  <label className="block text-xs font-bold text-[#191970] uppercase tracking-widest mb-2">Title</label>
                  <input 
                    type="text" 
                    placeholder="Set a new target..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-[#191970] uppercase tracking-widest mb-2">Description</label>
                  <input 
                    type="text" 
                    placeholder="Optional details..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#191970] uppercase tracking-widest mb-2">Target Date</label>
                  <input 
                    type="date" 
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 outline-none"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button type="submit" className="h-11 bg-royal text-white px-4 md:px-10 rounded-lg font-bold text-sm sm:text-base hover:bg-royal-light transition-all flex items-center justify-center whitespace-nowrap">
                    Launch Objective
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 md:gap-5">
        {goals.map(goal => {
          const totalMilestones = goal.milestones?.length || 0;
          const completedMilestones = goal.milestones?.filter(m => m.is_completed).length || 0;
          const finalProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
          return (
          <div key={goal.id} className="bg-card rounded-2xl border border-gray-200/80 shadow-[0_1px_5px_rgba(15,23,42,0.06)] overflow-hidden group">
            <div className="p-4 md:p-5 flex items-center justify-between gap-3 md:gap-4">
              <div className="min-w-0 flex-1 flex items-center gap-3 md:gap-4">
                <div className="h-11 w-11 md:h-12 md:w-12 bg-royal/10 rounded-xl flex items-center justify-center text-royal shrink-0">
                  <Target size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base md:text-lg font-bold text-[#191970] truncate">{goal.title}</h4>
                  <div className="mt-1 flex items-center gap-3">
                    <p className="text-xs md:text-sm text-gray-700 truncate">Target: {goal.target_date || 'Ongoing'}</p>
                    {goal.status === 'completed' && <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981] shrink-0"></div>}
                  </div>
                  <div className="mt-2 h-2.5 w-full max-w-md bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#191970] transition-all duration-500 ease-out" 
                      style={{ width: `${finalProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <button 
                  onClick={() => onDelete(goal.id)}
                  className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                  className="p-2 text-gray-700 hover:text-[#191970]"
                >
                  {expandedGoal === goal.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
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
                    <h5 className="text-xs font-bold text-[#191970] uppercase tracking-widest mb-6">Milestones Architecture</h5>
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
          );
        })}
      </div>
    </motion.div>
  );
}
