export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  is_active?: boolean;
  bio?: string;
  avatar_url?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface Habit {
  id: number;
  name: string;
  streak: number;
  last_completed: string | null;
  category: string;
}

export interface Milestone {
  id: number;
  goal_id: number;
  title: string;
  is_completed: boolean;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  category: string;
  target_date: string;
  progress: number;
  status: string;
  milestones: Milestone[];
}

export interface DashboardStats {
  tasks: { total: number; completed: number };
  habits: { active: number };
  goals: { total: number };
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'task' | 'habit';
  is_read: boolean;
  created_at: string;
}

export type View = 'dashboard' | 'tasks' | 'habits' | 'goals' | 'ai' | 'settings' | 'admin';
