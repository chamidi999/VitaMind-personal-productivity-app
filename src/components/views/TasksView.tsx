import React from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Filter } from 'lucide-react';
import KanbanBoard from '../KanbanBoard';
import { Task } from '../../types';

interface TasksViewProps {
  tasks: Task[];
  onUpdateTask: (id: number, status: Task['status']) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
  onAddTask: (status: Task['status']) => void;
  onEditTask: (task: Task) => void;
}

export default function TasksView({ tasks, onUpdateTask, onDeleteTask, onAddTask, onEditTask }: TasksViewProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 max-w-full overflow-x-hidden"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-3xl border border-white/5">
        <div>
          <h2 className="text-2xl font-bold text-[#191970] mb-1">Strategic Operations</h2>
          <p className="text-sm text-gray-700">Manage your active mission parameters.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
            <input 
              type="text" 
              placeholder="Search objectives..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-royal/50 outline-none transition-all"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-700 hover:text-[#191970] transition-colors">
            <Filter size={20} />
          </button>
          <button 
            onClick={() => onAddTask('todo')}
            className="h-11 bg-royal text-white px-5 rounded-lg font-bold hover:bg-royal-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-royal/20 whitespace-nowrap"
          >
            <Plus size={18} /> New Task
          </button>
        </div>
      </div>

      <KanbanBoard 
        tasks={filteredTasks} 
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
      />
    </motion.div>
  );
}
