import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Flame, Target, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { format } from 'date-fns';

import { User, Task, Habit, Goal, DashboardStats, ChatMessage, Notification } from './types';
import { api } from './services/api';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AuthView from './components/views/AuthView';
import DashboardView from './components/views/DashboardView';
import TasksView from './components/views/TasksView';
import HabitsView from './components/views/HabitsView';
import GoalsView from './components/views/GoalsView';
import AIOracleView from './components/views/AIOracleView';
import ReportsView from './components/views/ReportsView';
import SettingsPanel from './components/SettingsPanel';
import AdminPanel from './components/AdminPanel';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const location = useLocation();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userContextSummary, setUserContextSummary] = useState<any>(null);
  
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('todo');

  const [aiInput, setAiInput] = useState('');
  const [aiChat, setAiChat] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      const t = await api.tasks.list(token).catch(() => []);
      const h = await api.habits.list(token).catch(() => []);
      const g = await api.goals.list(token).catch(() => []);
      const s = await api.stats.get(token).catch(() => null);
      const contextSummary = await api.user.contextSummary(token).catch(() => null);
      
      setTasks(t);
      setHabits(h);
      setGoals(g || []);
      setStats(s);
      setUserContextSummary(contextSummary);
      
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
  }, [token]);

  useEffect(() => {
    console.log('DEBUG [App]: token effect triggered', { hasToken: Boolean(token) });
    if (token) {
      loadInitialData();
    }
  }, [token, refreshData]);

  const loadInitialData = async () => {
    if (!token) return;
    try {
      const u = await api.auth.me(token);
      if (u.id) {
        setUser(u);
        await refreshData();
      } else {
        handleLogout();
      }
    } catch (e) {
      handleLogout();
    }
  };

  const handleCompleteHabit = async (id: number) => {
    if (!token) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const previousHabits = habits;

    setHabits((current) =>
      current.map((habit) =>
        habit.id === id
          ? { ...habit, streak: habit.streak + 1, last_completed: today }
          : habit
      )
    );

    try {
      await api.habits.complete(token, id);
      await refreshData();
    } catch (error) {
      console.error('Habit completion failed:', error);
      setHabits(previousHabits);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    console.log('DEBUG [App]: handleLogin invoked', { email });
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
      const message = e instanceof Error ? e.message : '';
      if (message.toLowerCase().includes('failed to fetch')) {
        return 'Unable to connect to server. Please check your network and try again.';
      }
      return 'Login request failed. Please try again.';
    }
  };

  const handleRegister = async (name: string, email: string, pass: string, role: 'user' | 'admin', adminKey?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass, role, adminKey })
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
      const message = e instanceof Error ? e.message : '';
      if (message.toLowerCase().includes('failed to fetch')) {
        return 'Unable to connect to server. Please check your network and try again.';
      }
      return 'Registration request failed. Please try again.';
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

  const handleToggleMilestone = async (id: number, isCompleted: boolean) => {
    if (!token) return;

    const previousGoals = goals;

    setGoals(prevGoals =>
      prevGoals.map(goal => {
        const updatedMilestones = goal.milestones.map(m =>
          m.id === id ? { ...m, is_completed: isCompleted } : m
        );
        const totalMilestones = updatedMilestones.length;
        const completedMilestones = updatedMilestones.filter(m => m.is_completed).length;
        const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

        return {
          ...goal,
          milestones: updatedMilestones,
          progress
        };
      })
    );

    try {
      await api.milestones.update(token, id, isCompleted);
      await refreshData();
    } catch (error) {
      setGoals(previousGoals);
      console.error('Failed to toggle milestone', error);
    }
  };

  const askAI = async (e: React.FormEvent) => {
    console.log('DEBUG [App]: askAI submit', { aiInput });
    e.preventDefault();
    if (!aiInput.trim() || !token) return;

    const userMsg: ChatMessage = { role: 'user', content: aiInput };
    setAiChat(prev => [...prev, userMsg]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const normalizedInput = aiInput.trim();
      const isLikelyUrl = /(?:https?:\/\/|www\.|localhost|(?:[a-z0-9-]+\.)+[a-z]{2,})(?:[/:?#]|$)/i.test(normalizedInput);
      const isLikelyNonsense = normalizedInput.length < 3 || (!/[a-zA-Z]/.test(normalizedInput) && !/\d{2,}/.test(normalizedInput));

      const prioritizedTasks = tasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => {
          const priorityRank = { high: 1, medium: 2, low: 3 } as const;
          const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        })
        .slice(0, 5)
        .map(task => `${task.title} (priority: ${task.priority}, due: ${task.due_date || 'none'})`);
      const topTaskTitle = tasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => {
          const priorityRank = { high: 1, medium: 2, low: 3 } as const;
          const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        })[0]?.title || 'your highest-priority task';

      if (isLikelyUrl || isLikelyNonsense) {
        setAiChat(prev => [...prev, {
          role: 'ai',
          content: `Strategist, that looks like invalid input. Please ask a specific productivity question so I can help you execute ${topTaskTitle}.`
        }]);
        return;
      }

      const systemInstruction = `SYSTEM ROLE: You are the VitaMind Lifestyle Oracle.
MISSION: You now have full access to the user's Tasks, Habits, and Vision Goals. Your mission is to help the user align their daily actions (Tasks/Habits) with their long-term Vision Goals.
CRITICAL RULE: You must only discuss topics related to productivity, time management, tasks, habits, and personal goals.
If a user asks about anything outside this domain (e.g., politics, celebrities, general knowledge, math, or external links like "http://localhost"), you must politely but firmly decline.
Response for Out-of-Domain queries: "Strategist, my neural processors are dedicated exclusively to your lifestyle optimization. I cannot assist with [User's Topic], but I am ready to help you conquer your pending objectives like [Top Task]."
INVALID INPUT RULE: If the user message contains a URL, random symbols, or nonsensical text, treat it as Invalid Input and respond briefly: ask for a specific productivity-related question tied to their dashboard tasks.
REFUSAL STYLE: Keep refusals brief (1-2 sentences), stay in character, and redirect to dashboard data (especially Top Pending Tasks).
TASK NAMING RULE: You now have access to specific task names. Never say "Task 1" or placeholders. Use exact task titles from context (for example, "task5" or "Cardio Session") when giving advice.
USER CONTEXT: Name: ${user?.name}, Tasks: ${tasks.length}, Habits: ${habits.length}, Goals: ${goals.length}, Top Pending Tasks: ${prioritizedTasks.join('; ') || 'None'}, Top Habits: ${userContextSummary?.topHabits?.map((h: any) => `${h.name} (${h.streak})`).join('; ') || 'None'}, Active Goals: ${userContextSummary?.activeGoals?.map((g: any) => `${g.title} (${g.progress}%)`).join('; ') || 'None'}`;

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

  const renderView = () => (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <DashboardView
            stats={stats}
            tasks={tasks}
            habits={habits}
            contextSummary={userContextSummary}
            onViewChange={(view) => navigate(view === 'ai' ? '/oracle' : `/${view}`)}
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
        }
      />
      <Route
        path="/tasks"
        element={
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
        }
      />
      <Route
        path="/habits"
        element={
          <HabitsView
            habits={habits}
            onAdd={(n) => api.habits.create(token, { name: n }).then(refreshData)}
            onComplete={handleCompleteHabit}
            onDelete={(id) => api.habits.delete(token, id).then(refreshData)}
            onUpdate={(id, n) => api.habits.update(token, id, { name: n }).then(refreshData)}
          />
        }
      />
      <Route
        path="/goals"
        element={
          <GoalsView
            goals={goals}
            onAdd={(d) => api.goals.create(token, d).then(refreshData)}
            onDelete={(id) => api.goals.delete(token, id).then(refreshData)}
            onAddMilestone={(id, t) => api.goals.addMilestone(token, id, t).then(refreshData)}
            onToggleMilestone={handleToggleMilestone}
            onDeleteMilestone={(id) => api.milestones.delete(token, id).then(refreshData)}
          />
        }
      />
      <Route
        path="/oracle"
        element={
          <AIOracleView
            chat={aiChat}
            input={aiInput}
            isLoading={isAiLoading}
            contextSummary={userContextSummary}
            onInputChange={setAiInput}
            onSubmit={askAI}
          />
        }
      />
      <Route path="/reports" element={<ReportsView />} />
      <Route path="/settings" element={<SettingsPanel user={user} token={token} onUpdateUser={(d) => api.auth.updateProfile(token, d).then(loadInitialData)} onClose={() => navigate('/dashboard')} />} />
      <Route path="/admin" element={
        user?.role === 'admin' ? <AdminPanel token={token} /> : <Navigate to="/dashboard" replace />
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );


const getViewTitle = (pathname: string) => ({
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/habits': 'Habits',
  '/goals': 'Goals',
  '/oracle': 'VitaMind',
  '/reports': 'Reports & Insights',
  '/settings': 'Settings',
  '/admin': 'Admin Panel'
}[pathname] || 'Dashboard');
  return (
    <div className="h-screen bg-background text-foreground flex font-sans selection:bg-royal/20 overflow-hidden">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-72 pt-24 md:pt-8 pb-6 h-screen overflow-hidden max-w-full">
        <div className="w-full px-6 md:px-10 h-full flex flex-col">
          <Header 
            viewTitle={getViewTitle(location.pathname)}
            notifications={notifications}
            isNoteOpen={isNoteOpen}
            setIsNoteOpen={setIsNoteOpen}
            setNotifications={setNotifications}
            token={token}
            onReadNotification={async (id) => {
              await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
              await refreshData();
            }}
          />

          <AnimatePresence mode="wait">
            <div key={location.pathname} className="flex-1 overflow-y-auto pr-1 max-w-full overflow-x-hidden py-6">{renderView()}</div>
          </AnimatePresence>
        </div>
      </main>

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
                <QuickActionBtn onClick={() => { navigate('/dashboard'); setIsQuickActionOpen(false); }} label="Dashboard" color="bg-royal" icon={<Plus size={18} />} />
                <QuickActionBtn onClick={() => { navigate('/tasks'); setIsQuickActionOpen(false); }} label="Tasks" color="bg-indigo-500" icon={<Plus size={18} />} />
                <QuickActionBtn onClick={() => { navigate('/habits'); setIsQuickActionOpen(false); }} label="Habits" color="bg-orange-500" icon={<Flame size={18} />} />
                <QuickActionBtn onClick={() => { navigate('/goals'); setIsQuickActionOpen(false); }} label="Goals" color="bg-emerald-500" icon={<Target size={18} />} />
                <QuickActionBtn onClick={() => { navigate('/oracle'); setIsQuickActionOpen(false); }} label="AI Mind" color="bg-purple-500" icon={<Plus size={18} />} />
                <QuickActionBtn onClick={() => { navigate('/reports'); setIsQuickActionOpen(false); }} label="Reports" color="bg-cyan-600" icon={<BarChart3 size={18} />} />
                <QuickActionBtn onClick={() => { navigate('/settings'); setIsQuickActionOpen(false); }} label="Settings" color="bg-slate-500" icon={<Plus size={18} />} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
          className={`h-14 w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${isQuickActionOpen ? 'bg-midnight text-white rotate-45' : 'bg-royal text-white shadow-royal/30'}`}
        >
          <Plus size={32} />
        </button>
      </div>

      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTaskModalOpen(false)} className="absolute inset-0 bg-midnight/30 backdrop-blur-sm" />
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
                await refreshData();
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
