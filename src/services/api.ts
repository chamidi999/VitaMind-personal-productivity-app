import { User, Task, Habit, Goal, DashboardStats } from '../types';

const getHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

const fetchWithTimeout = async (url: string, options: any = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Server returned an error');
    }
    return response.json();
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

export const api = {
  auth: {
    me: (token: string) => fetchWithTimeout('/api/auth/me', { headers: getHeaders(token) }),
    updateProfile: (token: string, data: Partial<User>) => 
      fetchWithTimeout('/api/auth/profile', { 
        method: 'PATCH', 
        headers: getHeaders(token), 
        body: JSON.stringify(data) 
      }),
  },
  tasks: {
    list: (token: string) => fetchWithTimeout('/api/tasks', { headers: getHeaders(token) }),
    create: (token: string, data: Partial<Task>) => 
      fetchWithTimeout('/api/tasks', { 
        method: 'POST', 
        headers: getHeaders(token), 
        body: JSON.stringify(data) 
      }),
    update: (token: string, id: number, data: Partial<Task>) => 
      fetchWithTimeout(`/api/tasks/${id}`, { 
        method: 'PATCH', 
        headers: getHeaders(token), 
        body: JSON.stringify(data) 
      }),
    delete: (token: string, id: number) => 
      fetchWithTimeout(`/api/tasks/${id}`, { method: 'DELETE', headers: getHeaders(token) }),
  },
  habits: {
    list: (token: string) => fetchWithTimeout('/api/habits', { headers: getHeaders(token) }),
    create: (token: string, data: { name: string; category?: string }) => 
      fetchWithTimeout('/api/habits', { 
        method: 'POST', 
        headers: getHeaders(token), 
        body: JSON.stringify(data) 
      }),
    update: (token: string, id: number, data: { name: string }) =>
        fetchWithTimeout(`/api/habits/${id}`, {
            method: 'PATCH',
            headers: getHeaders(token),
            body: JSON.stringify(data)
        }),
    complete: (token: string, id: number) => 
      fetchWithTimeout(`/api/habits/${id}/complete`, { method: 'POST', headers: getHeaders(token) }),
    delete: (token: string, id: number) => 
      fetchWithTimeout(`/api/habits/${id}`, { method: 'DELETE', headers: getHeaders(token) }),
  },
  goals: {
    list: (token: string) => fetchWithTimeout('/api/goals', { headers: getHeaders(token) }),
    create: (token: string, data: Partial<Goal>) => 
      fetchWithTimeout('/api/goals', { 
        method: 'POST', 
        headers: getHeaders(token), 
        body: JSON.stringify(data) 
      }),
    delete: (token: string, id: number) => 
      fetchWithTimeout(`/api/goals/${id}`, { method: 'DELETE', headers: getHeaders(token) }),
    addMilestone: (token: string, goalId: number, title: string) => 
      fetchWithTimeout(`/api/goals/${goalId}/milestones`, { 
        method: 'POST', 
        headers: getHeaders(token), 
        body: JSON.stringify({ title }) 
      }),
  },
  milestones: {
    update: (token: string, id: number, isCompleted: boolean) => 
      fetchWithTimeout(`/api/milestones/${id}`, { 
        method: 'PATCH', 
        headers: getHeaders(token), 
        body: JSON.stringify({ is_completed: isCompleted }) 
      }),
    delete: (token: string, id: number) => 
      fetchWithTimeout(`/api/milestones/${id}`, { method: 'DELETE', headers: getHeaders(token) }),
  },
  stats: {
    get: (token: string) => fetchWithTimeout('/api/user-stats', { headers: getHeaders(token) }),
  },
  user: {
    contextSummary: (token: string) => fetchWithTimeout('/api/context-summary', { headers: getHeaders(token) }),
  }
};
