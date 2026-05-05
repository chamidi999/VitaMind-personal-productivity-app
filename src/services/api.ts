import { User, Task, Goal, Habit, DashboardStats, ContextSummary } from '../types';

const getHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
});

const fetchWithTimeout = async <T>(url: string, options: RequestInit = {}, timeout = 10000): Promise<T> => {
  console.log('DEBUG [API]: Request start', { url, method: options.method ?? 'GET', body: options.body });
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    const data = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.log('DEBUG [API]: Response received', { url, ok: response.ok, data });
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || 'Server returned an error');
    }
    return data as T;
  } catch (e) {
    clearTimeout(id);
    console.error('DEBUG [API]: Request failed', { url, error: e });
    throw e;
  }
};

export const api = {
  auth: {
    me: (token: string) => fetchWithTimeout<User>('/api/auth/me', { headers: getHeaders(token) }),
    updateProfile: (token: string, data: Partial<User>) =>
      fetchWithTimeout('/api/auth/profile', { method: 'PATCH', headers: getHeaders(token), body: JSON.stringify(data) })
  },
  tasks: {
    list: (token: string) => fetchWithTimeout<Task[]>('/api/tasks', { headers: getHeaders(token) }),
    create: (token: string, data: Partial<Task>) =>
      fetchWithTimeout('/api/tasks', { method: 'POST', headers: getHeaders(token), body: JSON.stringify(data) }),
    update: (token: string, id: number, data: Partial<Task>) =>
      fetchWithTimeout(`/api/tasks/${id}`, { method: 'PATCH', headers: getHeaders(token), body: JSON.stringify(data) }),
    delete: (token: string, id: number) => fetchWithTimeout(`/api/tasks/${id}`, { method: 'DELETE', headers: getHeaders(token) })
  },
  habits: {
    list: (token: string) => fetchWithTimeout<Habit[]>('/api/habits', { headers: getHeaders(token) }),
    create: (token: string, data: { name: string; category?: string }) =>
      fetchWithTimeout('/api/habits', { method: 'POST', headers: getHeaders(token), body: JSON.stringify(data) }),
    update: (token: string, id: number, data: { name: string }) =>
      fetchWithTimeout(`/api/habits/${id}`, { method: 'PATCH', headers: getHeaders(token), body: JSON.stringify(data) }),
    complete: (token: string, id: number) => fetchWithTimeout(`/api/habits/${id}/complete`, { method: 'POST', headers: getHeaders(token) }),
    delete: (token: string, id: number) => fetchWithTimeout(`/api/habits/${id}`, { method: 'DELETE', headers: getHeaders(token) })
  },
  goals: {
    list: (token: string) => fetchWithTimeout<Goal[]>('/api/goals', { headers: getHeaders(token) }),
    create: (token: string, data: Partial<Goal>) =>
      fetchWithTimeout('/api/goals', { method: 'POST', headers: getHeaders(token), body: JSON.stringify(data) }),
    delete: (token: string, id: number) => fetchWithTimeout(`/api/goals/${id}`, { method: 'DELETE', headers: getHeaders(token) }),
    addMilestone: (token: string, goalId: number, title: string) =>
      fetchWithTimeout(`/api/goals/${goalId}/milestones`, { method: 'POST', headers: getHeaders(token), body: JSON.stringify({ title }) })
  },
  milestones: {
    update: (token: string, id: number, isCompleted: boolean) =>
      fetchWithTimeout(`/api/milestones/${id}`, { method: 'PATCH', headers: getHeaders(token), body: JSON.stringify({ is_completed: isCompleted }) }),
    delete: (token: string, id: number) => fetchWithTimeout(`/api/milestones/${id}`, { method: 'DELETE', headers: getHeaders(token) })
  },
  stats: {
    get: (token: string) => fetchWithTimeout<DashboardStats>('/api/user-stats', { headers: getHeaders(token) })
  },
  user: {
    contextSummary: (token: string) => fetchWithTimeout<ContextSummary>('/api/context-summary', { headers: getHeaders(token) })
  }
};
