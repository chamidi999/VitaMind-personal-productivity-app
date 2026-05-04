import React from 'react';
import { motion } from 'motion/react';
import { MoreVertical, Plus, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Task } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTask: (id: number, status: Task['status']) => void;
  onDeleteTask: (id: number) => void;
  onAddTask: (status: Task['status']) => void;
  onEditTask: (task: Task) => void;
}

export default function KanbanBoard({ tasks, onUpdateTask, onDeleteTask, onAddTask, onEditTask }: KanbanBoardProps) {
  const columns: { id: Task['status']; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-royal' },
    { id: 'completed', title: 'Completed', color: 'bg-emerald-500' },
  ];

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'low': return 'text-emerald-500 bg-emerald-500/10';
      default: return 'text-gray-700 bg-gray-500/10';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start content-start justify-items-start">
      {columns.map(column => (
        <div key={column.id} className="bg-card/50 border border-white/5 rounded-3xl flex flex-col max-h-[80vh]">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-card/30 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#191970]">{column.title}</h3>
              <span className="bg-white/5 px-2 py-0.5 rounded-full text-xs text-gray-700">
                {tasks.filter(t => t.status === column.id).length}
              </span>
            </div>
            <button 
              onClick={() => onAddTask(column.id)}
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-700 hover:text-[#191970] transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {tasks.filter(t => t.status === column.id).map(task => (
              <motion.div 
                layoutId={`task-${task.id}`}
                key={task.id}
                onClick={() => onEditTask(task)}
                className="bg-card p-4 rounded-2xl border border-white/5 shadow-sm group hover:border-royal/30 transition-all cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${getTaskPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <div className="flex items-center gap-2 relative z-20">
                    <button 
                      onClick={(e) => { 
                        e.preventDefault();
                        e.stopPropagation(); 
                        onDeleteTask(task.id); 
                      }}
                      className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-500/10 rounded-lg cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button className="text-gray-600 hover:text-[#191970] opacity-0 group-hover:opacity-100 transition-opacity p-1.5">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <h4 className="font-semibold text-sm mb-2 text-[#191970] leading-tight">{task.title}</h4>
                <div className="flex items-center gap-3 text-[11px] text-gray-700">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{task.due_date || 'No date'}</span>
                  </div>
                  {task.category && (
                    <div className="flex items-center gap-1">
                       <span className="w-1 h-1 rounded-full bg-royal"></span>
                       <span>{task.category}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex gap-2">
                   {column.id !== 'todo' && (
                     <button 
                      onClick={(e) => { e.stopPropagation(); onUpdateTask(task.id, 'todo'); }}
                      className="text-[10px] font-bold text-gray-700 hover:text-[#191970] transition-colors"
                     >
                       Move to Todo
                     </button>
                   )}
                   {column.id !== 'in-progress' && (
                     <button 
                      onClick={(e) => { e.stopPropagation(); onUpdateTask(task.id, 'in-progress'); }}
                      className="text-[10px] font-bold text-[#4169E1] hover:text-blue-700 transition-colors"
                     >
                       Move to In Progress
                     </button>
                   )}
                   {column.id !== 'completed' && (
                     <button 
                      onClick={(e) => { e.stopPropagation(); onUpdateTask(task.id, 'completed'); }}
                      className="text-[10px] font-bold text-[#4169E1] hover:text-blue-700 transition-colors"
                     >
                       Complete
                     </button>
                   )}
                </div>
              </motion.div>
            ))}
            {tasks.filter(t => t.status === column.id).length === 0 && (
              <div className="border border-dashed border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center opacity-30">
                <AlertCircle size={24} className="mb-2 text-gray-700" />
                <p className="text-xs text-gray-700">No tasks in {column.title}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
