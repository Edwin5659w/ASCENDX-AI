import { apiRequest, saveTokens, clearTokens, getRefreshToken } from './client';
import type {
  AuthResponse,
  User,
  UserStats,
  Goal,
  Task,
  Habit,
  FinanceRecord,
  FinanceSummary,
} from '../types';

export const authApi = {
  register: async (name: string, email: string, password: string) => {
    const data = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      public: true,
    });
    saveTokens(data.accessToken, data.refreshToken);
    return data;
  },
  login: async (email: string, password: string) => {
    const data = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      public: true,
    });
    saveTokens(data.accessToken, data.refreshToken);
    return data;
  },
  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiRequest<{ ok: boolean }>('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          public: true,
        });
      } catch {
        /* token ya inválido */
      }
    }
    clearTokens();
  },
  forgotPassword: (email: string) =>
    apiRequest<{ ok: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      public: true,
    }),
  resetPassword: (token: string, password: string) =>
    apiRequest<{ ok: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      public: true,
    }),
};

export const userApi = {
  me: () => apiRequest<User>('/user/me'),
  stats: () => apiRequest<UserStats>('/user/stats'),
  updateProfile: (data: { name?: string; onboardingDone?: boolean; pushToken?: string }) =>
    apiRequest<User>('/user/me', { method: 'PATCH', body: JSON.stringify(data) }),
  completeOnboarding: () => apiRequest<User>('/user/onboarding-complete', { method: 'POST' }),
  setupOnboarding: (data: {
    focus: string;
    goalTitle: string;
    taskTitles: string[];
    habitName: string;
  }) =>
    apiRequest<{ user: User }>('/user/onboarding-setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const goalsApi = {
  list: () => apiRequest<Goal[]>('/goals'),
  create: (data: { title: string; priority?: string }) =>
    apiRequest<Goal>('/goals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Goal>) =>
    apiRequest<Goal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest<void>(`/goals/${id}`, { method: 'DELETE' }),
};

export const tasksApi = {
  list: () => apiRequest<Task[]>('/tasks'),
  create: (data: { title: string; goalId?: string | null; dueDate?: string }) =>
    apiRequest<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Task>) =>
    apiRequest<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

export const habitsApi = {
  list: () => apiRequest<Habit[]>('/habits'),
  create: (data: { name: string; frequency?: 'DAILY' | 'WEEKLY' }) =>
    apiRequest<Habit>('/habits', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; frequency?: 'DAILY' | 'WEEKLY' }) =>
    apiRequest<Habit>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  complete: (id: string) => apiRequest<Habit>(`/habits/${id}/complete`, { method: 'POST' }),
  remove: (id: string) => apiRequest<void>(`/habits/${id}`, { method: 'DELETE' }),
};

export const financeApi = {
  list: () => apiRequest<FinanceRecord[]>('/finance'),
  summary: () => apiRequest<FinanceSummary>('/finance/summary'),
  create: (data: { type: 'INCOME' | 'EXPENSE'; amount: number; category: string; note?: string }) =>
    apiRequest<FinanceRecord>('/finance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ type: 'INCOME' | 'EXPENSE'; amount: number; category: string; note?: string }>) =>
    apiRequest<FinanceRecord>(`/finance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest<void>(`/finance/${id}`, { method: 'DELETE' }),
};

export type AIContextLevel = 'empty' | 'partial' | 'ready';

export interface AIContextMeta {
  contextLevel: AIContextLevel;
  suggestedPrompts: string[];
}

export const aiApi = {
  dailyPlan: () =>
    apiRequest<{
      plan: string;
      procrastinationWarning: string | null;
      contextLevel: AIContextLevel;
      suggestedPrompts: string[];
    }>('/ai/daily-plan'),
  context: () => apiRequest<AIContextMeta>('/ai/context'),
  chat: (message: string) =>
    apiRequest<{ reply: string } & AIContextMeta>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  insights: () => apiRequest<{ id: string; type: string; message: string; createdAt: string }[]>('/ai/insights'),
  chatHistory: () =>
    apiRequest<{ id: string; role: 'user' | 'assistant'; content: string; createdAt: string }[]>(
      '/ai/chat-history',
    ),
  clearChatHistory: () => apiRequest<{ ok: boolean }>('/ai/chat-history', { method: 'DELETE' }),
};
