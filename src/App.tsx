import React, { useState, useEffect } from 'react';
import { Plus, Flame, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { format } from 'date-fns';

// Types & Services
import { User, Task, Habit, Goal, DashboardStats, ChatMessage, View } from './types';
import { api } from './services/api';

// Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AuthView from './components/views/AuthView';
import DashboardView from './components/views/DashboardView';
import TasksView from './components/views/TasksView';
import HabitsView from './components/views/HabitsView';
import GoalsView from './components/views/GoalsView';
import AIOracleView from './components/views/AIOracleView';
import SettingsPanel from './components/SettingsPanel';
import AdminPanel from './components/AdminPanel';

// AI Config
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // UI States
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('todo');

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [aiChat, setAiChat] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  const loadInitialData = async () => {
    if (!token) return;
    try {
      const u = await api.auth.me(token);
      if (u.id) {
        setUser(u);
        refreshData();
      } else {
        handleLogout();
      }
    } catch (e) {
      handleLogout();
    }
  };

  const refreshData = async () => {
    if (!token) return;
    try {
      // Fetch core data
      const t = await api.tasks.list(token).catch(() => []);
      const h = await api.habits.list(token).catch(() => []);
      const g = await api.goals.list(token).catch(() => []);
      const s = await api.stats.get(token).catch(() => null);
      
      setTasks(t);
      setHabits(h);
      setGoals(g || []);
      setStats(s);
      
      const nRes = await fetch('/api/notifications', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (nRes.ok) {
        const n = await nRes.json();
        setNotifications(n);
      }
    } catch (e) {
      console.error('Refresh failed', e);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return null;
      }
      return data.error || 'Login failed';
    } catch (e) {
      return 'Connection timed out. Please try again.';
    }
  };

  const handleRegister = async (name: string, email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return null;
      }
      return data.error || 'Registration failed';
    } catch (e) {
      return 'Connection timed out. Please try again.';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description || '');
    setNewTaskPriority(task.priority);
    setNewTaskDueDate(task.due_date || format(new Date(), 'yyyy-MM-dd'));
    setNewTaskStatus(task.status);
    setIsTaskModalOpen(true);
  };

  const askAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || !token) return;

    const userMsg: ChatMessage = { role: 'user', content: aiInput };
    setAiChat(prev => [...prev, userMsg]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const systemInstruction = `SYSTEM ROLE: You are the VitaMind Lifestyle Oracle. 
MANDATE: You ONLY discuss personal productivity, the VitaMind app's features (Kanban, Habits, Vision Goals, Pomodoro), and strategies based on user data.
ENFORCEMENT: If asked out-of-scope questions, guide back to productivity.
USER CONTEXT: Name: ${user?.name}, Tasks: ${tasks.length}, Habits: ${habits.length}, Goals: ${goals.length}`;

      const contents = aiChat.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      contents.push({ role: 'user', parts: [{ text: aiInput }] });

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents as any,
        config: { systemInstruction } as any
      });
      
      setAiChat(prev => [...prev, { role: 'ai', content: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (e) {
      setAiChat(prev => [...prev, { role: 'ai', content: "Neural-link disrupted. Try again later." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!token || !user) {
    return <AuthView onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            stats={stats} 
            tasks={tasks} 
            habits={habits} 
            onViewChange={setCurrentView} 
            onAddTask={() => {
                setEditingTask(null);
                setNewTaskTitle('');
                setNewTaskDescription('');
                setNewTaskPriority('medium');
                setNewTaskDueDate(format(new Date(), 'yyyy-MM-dd'));
                setIsTaskModalOpen(true);
            }} 
            onEditTask={handleEditTask}
          />
        );
      case 'tasks':
        return (
          <TasksView 
            tasks={tasks} 
            onUpdateTask={(id, s) => api.tasks.update(token, id, { status: s }).then(refreshData)}
            onDeleteTask={(id) => api.tasks.delete(token, id).then(refreshData)}
            onAddTask={(s) => { 
                setNewTaskStatus(s); 
                setEditingTask(null);
                setNewTaskTitle('');
                setNewTaskDescription('');
                setNewTaskPriority('medium');
                setNewTaskDueDate(format(new Date(), 'yyyy-MM-dd'));
                setIsTaskModalOpen(true); 
            }}
            onEditTask={handleEditTask}
          />
        );
      case 'habits':
        return (
          <HabitsView 
            habits={habits}
            onAdd={(n) => api.habits.create(token, { name: n }).then(refreshData)}
            onComplete={(id) => api.habits.complete(token, id).then(refreshData)}
            onDelete={(id) => api.habits.delete(token, id).then(refreshData)}
            onUpdate={(id, n) => api.habits.update(token, id, { name: n }).then(refreshData)}
          />
        );
      case 'goals':
        return (
          <GoalsView 
            goals={goals}
            onAdd={(d) => api.goals.create(token, d).then(refreshData)}
            onDelete={(id) => api.goals.delete(token, id).then(refreshData)}
            onAddMilestone={(id, t) => api.goals.addMilestone(token, id, t).then(refreshData)}
            onToggleMilestone={(id, c) => api.milestones.update(token, id, c).then(refreshData)}
            onDeleteMilestone={(id) => api.milestones.delete(token, id).then(refreshData)}
          />
        );
      case 'ai':
        return (
          <AIOracleView 
            chat={aiChat} 
            input={aiInput} 
            isLoading={isAiLoading}
            onInputChange={setAiInput}
            onSubmit={askAI}
          />
        );
      case 'settings':
        return <SettingsPanel user={user} onUpdateUser={(d) => api.auth.updateProfile(token, d).then(loadInitialData)} onClose={() => setCurrentView('dashboard')} />;
      case 'admin':
        return <AdminPanel token={token} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-background text-[#191970] flex font-sans selection:bg-royal/20 overflow-hidden">
      <Sidebar user={user} currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-72 px-4 pt-24 pb-6 md:p-10 h-screen overflow-hidden max-w-full">
        <Header 
          viewTitle={currentView.charAt(0).toUpperCase() + currentView.slice(1)}
          notifications={notifications}
          isNoteOpen={isNoteOpen}
          setIsNoteOpen={setIsNoteOpen}
          onReadNotification={async (id) => {
            await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
            refreshData();
          }}
        />

        <AnimatePresence mode="wait">
          <div key={currentView} className="h-[calc(100vh-6rem)] overflow-y-auto pr-1 max-w-full overflow-x-hidden">{renderView()}</div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-4 md:bottom-10 md:right-10 z-60">
        <AnimatePresence>
          {isQuickActionOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsQuickActionOpen(false)}
                className="fixed inset-0 z-[-1] bg-black/20 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-20 right-0 space-y-4"
              >
                <QuickActionBtn onClick={() => { setCurrentView('dashboard'); setIsQuickActionOpen(false); }} label="Dashboard" color="bg-royal" icon={<Plus size={18} />} />
                <QuickActionBtn onClick={() => { setCurrentView('tasks'); setIsQuickActionOpen(false); }} label="Tasks" color="bg-indigo-500" icon={<Plus size={18} />} />
                <QuickActionBtn onClick={() => { setCurrentView('habits'); setIsQuickActionOpen(false); }} label="Habits" color="bg-orange-500" icon={<Flame size={18} />} />
                <QuickActionBtn onClick={() => { setCurrentView('goals'); setIsQuickActionOpen(false); }} label="Goals" color="bg-emerald-500" icon={<Target size={18} />} />
                <QuickActionBtn onClick={() => { setCurrentView('ai'); setIsQuickActionOpen(false); }} label="AI Mind" color="bg-purple-500" icon={<Plus size={18} />} />
                <QuickActionBtn onClick={() => { setCurrentView('settings'); setIsQuickActionOpen(false); }} label="Settings" color="bg-slate-500" icon={<Plus size={18} />} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
          className={`h-14 w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${isQuickActionOpen ? 'bg-[#191970] text-white rotate-45' : 'bg-royal text-white shadow-royal/30'}`}
        >
          <Plus size={32} />
        </button>
      </div>

      {/* New/Edit Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTaskModalOpen(false)} className="absolute inset-0 bg-[#191970]/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card w-full max-w-lg p-8 rounded-3xl border border-gray-200 shadow-xl relative z-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-royal via-purple-500 to-emerald-500"></div>
              <h3 className="text-xl font-bold mb-6 text-[#191970]">{editingTask ? 'Modify Objective' : 'Initialize Objective'}</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const taskData = { 
                  title: newTaskTitle, 
                  description: newTaskDescription,
                  status: newTaskStatus, 
                  priority: newTaskPriority, 
                  due_date: newTaskDueDate 
                };
                
                if (editingTask) {
                    await api.tasks.update(token, editingTask.id, taskData);
                } else {
                    await api.tasks.create(token, taskData);
                }
                
                setIsTaskModalOpen(false);
                refreshData();
              }} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Title</label>
                  <input 
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Operational objective..."
                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-gray-700 outline-none focus:ring-2 focus:ring-royal/50 transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Tactical Description</label>
                  <textarea 
                    value={newTaskDescription}
                    onChange={e => setNewTaskDescription(e.target.value)}
                    placeholder="Describe the mission parameters..."
                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-gray-700 outline-none focus:ring-2 focus:ring-royal/50 transition-all min-h-25 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Priority Level</label>
                    <select 
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value as Task['priority'])}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-gray-700 outline-none focus:ring-2 focus:ring-royal/50 transition-all appearance-none"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Deadline</label>
                    <input 
                      type="date"
                      value={newTaskDueDate}
                      onChange={e => setNewTaskDueDate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-gray-700 outline-none focus:ring-2 focus:ring-royal/50 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-6 py-3 text-gray-500 font-bold hover:text-[#191970] transition-colors">Abort Mission</button>
                  <button type="submit" className="bg-royal text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-royal/20 hover:bg-blue-600 transition-all active:scale-95">
                    {editingTask ? 'Save Changes' : 'Confirm Deployment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickActionBtn({ onClick, label, color, icon }: any) {
  return (
    <div className="flex items-center gap-3 justify-end group cursor-pointer" onClick={onClick}>
      <span className="bg-card/95 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-200 text-[10px] text-[#191970] font-black uppercase tracking-widest opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {label}
      </span>
      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${color}`}>
        {icon}
      </div>
    </div>
  );
}
