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
      className="max-w-[1200px] w-full ml-0 mr-auto flex flex-col items-start space-y-10 overflow-x-hidden px-0"
    >
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-3xl border border-border">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Strategic Operations</h2>
          <p className="text-sm text-muted-foreground">Manage your active mission parameters.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search objectives..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-sm text-foreground focus:ring-2 focus:ring-royal/50 outline-none transition-all"
            />
          </div>
          <button className="p-2 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors">
            <Filter size={20} />
          </button>
          <button 
            onClick={() => onAddTask('todo')}
            className="btn-primary px-5 font-bold hover:bg-royal-light"
          >
            <Plus size={18} /> New Task
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1200px] ml-0">
        <KanbanBoard
          tasks={filteredTasks}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onAddTask={onAddTask}
          onEditTask={onEditTask}
        />
      </div>
    </motion.div>
  );
}
