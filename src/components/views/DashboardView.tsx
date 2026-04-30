import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Calendar, CheckSquare, Target, Activity, 
  ChevronRight, Flame, Clock, BrainCircuit 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { DashboardStats, Task, Habit, View } from '../../types';

interface DashboardProps {
  stats: DashboardStats | null;
  tasks: Task[];
  habits: Habit[];
  onViewChange: (view: View) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export default function DashboardView({ stats, tasks, habits, onViewChange, onAddTask, onEditTask }: DashboardProps) {
  const chartData = [
    { name: 'Mon', completion: 40 },
    { name: 'Tue', completion: 65 },
    { name: 'Wed', completion: 55 },
    { name: 'Thu', completion: 80 },
    { name: 'Fri', completion: 70 },
    { name: 'Sat', completion: 90 },
    { name: 'Sun', completion: 100 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome back, Strategist.</h2>
          <p className="text-gray-400">Your systems are performing at 92% efficiency today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onViewChange('tasks')}
            className="bg-royal/10 text-royal hover:bg-royal/20 px-4 py-2 rounded-xl font-semibold transition-all border border-royal/20 flex items-center gap-2"
          >
            <Clock size={18} /> Focus Mode
          </button>
          <button 
            onClick={onAddTask}
            className="bg-royal text-white hover:bg-royal-light px-4 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-royal/20 flex items-center gap-2"
          >
            <Plus size={18} /> New Objective
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'tasks', label: 'Active Tasks', value: stats?.tasks.total || 0, sub: `${stats?.tasks.completed || 0} completed`, icon: <CheckSquare className="text-royal" />, color: 'from-royal/20' },
          { id: 'habits', label: 'Habit Streak', value: Math.max(...habits.map(h => h.streak), 0), sub: 'Current highest', icon: <Flame className="text-orange-500" />, color: 'from-orange-500/20' },
          { id: 'goals', label: 'Vision Goals', value: stats?.goals.total || 0, sub: 'Long-term tracks', icon: <Target className="text-emerald-500" />, color: 'from-emerald-500/20' },
          { id: 'ai', label: 'Mind State', value: 'Flow', sub: 'Optimal performance', icon: <BrainCircuit className="text-purple-500" />, color: 'from-purple-500/20' },
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={() => onViewChange(stat.id as View)}
            className="bg-card p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors cursor-pointer active:scale-95"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${stat.color} to-transparent opacity-30 -mr-8 -mt-8 rounded-full blur-2xl group-hover:opacity-50 transition-opacity`}></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-white group-hover:text-royal transition-colors">{stat.value}</h3>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-white/10 transition-colors">
                {stat.icon}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 flex items-center gap-1 group-hover:text-gray-300 transition-colors">
              <Activity size={12} className="text-royal" /> {stat.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-card p-8 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">System Performance</h3>
            <select className="bg-white/5 border-none rounded-lg text-xs px-3 py-1 outline-none text-gray-400">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4169e1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4169e1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="completion" stroke="#4169e1" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Up Next Section */}
        <div className="bg-card p-8 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Priority Objectives</h3>
            <button onClick={() => onViewChange('tasks')} className="text-royal text-xs font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {tasks.filter(t => t.status !== 'completed').slice(0, 4).map(task => (
              <div 
                key={task.id} 
                onClick={() => onEditTask(task)}
                className="flex items-center gap-4 group cursor-pointer"
              >
                <div className="h-10 w-10 bg-royal/10 rounded-xl flex items-center justify-center text-royal group-hover:bg-royal/20 transition-colors">
                  <Calendar size={18} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-semibold text-sm text-white truncate group-hover:text-royal transition-colors">{task.title}</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{task.priority} Priority</p>
                </div>
                <ChevronRight size={16} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </div>
            ))}
            {tasks.filter(t => t.status !== 'completed').length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">All clear. Great job!</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
