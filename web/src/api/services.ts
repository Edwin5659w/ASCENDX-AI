import { apiRequest, saveTokens, clearTokens, getRefreshToken, getAccessToken } from './client';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
import type {
  AuthResponse,
  User,
  UserStats,
  Goal,
  Task,
  Habit,
  Trade,
  TradeSummary,
  FinanceRecord,
  FinanceSummary,
  WeeklyRecapResult,
  ReferralInfo,
  PlanUsage,
} from '../types';

export const authApi = {
  register: async (name: string, email: string, password: string, referralCode?: string) => {
    const data = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, referralCode: referralCode || undefined }),
      public: true,
    });
    saveTokens(data.accessToken, data.refreshToken);
    return data;
  },
  loginWithGoogle: async (idToken: string, referralCode?: string) => {
    const data = await apiRequest<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, referralCode: referralCode || undefined }),
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
  updateProfile: (data: {
    name?: string;
    onboardingDone?: boolean;
    productTourDone?: boolean;
    pushToken?: string;
    preferredCurrency?: string;
    tradingJournalEnabled?: boolean;
    dailyFocus?: string;
    emailOptIn?: boolean;
    themePreference?: 'dark' | 'light';
  }) =>
    apiRequest<User>('/user/me', { method: 'PATCH', body: JSON.stringify(data) }),
  completeOnboarding: () => apiRequest<User>('/user/onboarding-complete', { method: 'POST' }),
  completeProductTour: () => apiRequest<User>('/user/product-tour-complete', { method: 'POST' }),
  completeMorningRitual: () => apiRequest<{ ok: boolean }>('/user/morning-ritual-complete', { method: 'POST' }),
  search: (q: string) =>
    apiRequest<{
      goals: { id: string; title: string }[];
      tasks: { id: string; title: string; completed: boolean }[];
      habits: { id: string; name: string }[];
    }>(`/user/search?q=${encodeURIComponent(q)}`),
  accountabilityCode: () => apiRequest<{ code: string }>('/user/accountability/code'),
  accountabilityPartners: () =>
    apiRequest<{ id: string; name: string; ascendScore: number; ascendLabel: string }[]>(
      '/user/accountability/partners',
    ),
  linkAccountability: (code: string) =>
    apiRequest<{ partnerName: string; partnerId: string }>('/user/accountability/link', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  setupOnboarding: (data: {
    focus: string;
    goalTitle: string;
    taskTitles: string[];
    habitName: string;
    initialFinance?: { amount: number; category: string };
  }) =>
    apiRequest<{ user: User }>('/user/onboarding-setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ message: string }>('/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  weeklyRecap: () => apiRequest<WeeklyRecapResult>('/user/weekly-recap'),
  referral: () => apiRequest<ReferralInfo>('/user/referral'),
  plan: () => apiRequest<PlanUsage>('/user/plan'),
  setDailyFocus: (focus: string) =>
    apiRequest<User>('/user/daily-focus', {
      method: 'POST',
      body: JSON.stringify({ focus }),
    }),
  upgradePro: () => apiRequest<User>('/user/upgrade-pro', { method: 'POST' }),
  deleteAccount: (password: string) =>
    apiRequest<{ ok: boolean }>('/user/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    }),
  exportData: async () => {
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/user/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let message = 'Error al exportar datos';
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        /* raw response */
      }
      throw new Error(message);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascendx-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export const billingApi = {
  status: () => apiRequest<import('../types').BillingStatus>('/billing/status'),
  checkout: (interval: 'month' | 'year' = 'month') =>
    apiRequest<{ url: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ interval }),
    }),
  portal: () => apiRequest<{ url: string }>('/billing/portal', { method: 'POST' }),
  syncSession: (sessionId: string) =>
    apiRequest<{ user: User }>('/billing/sync-session', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
};

export const tradesApi = {
  list: () => apiRequest<Trade[]>('/trades'),
  summary: () => apiRequest<TradeSummary>('/trades/summary'),
  create: (data: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    pnl?: number;
    emotionTag?: string;
    note?: string;
  }) => apiRequest<Trade>('/trades', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest<void>(`/trades/${id}`, { method: 'DELETE' }),
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
  update: (
    id: string,
    data: {
      name?: string;
      frequency?: 'DAILY' | 'WEEKLY';
      reminderEnabled?: boolean;
      reminderHour?: number | null;
      reminderMinute?: number | null;
    },
  ) => apiRequest<Habit>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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
  aiUsage?: import('@shared/ai-prompts').AIUsage;
}

export const aiApi = {
  dailyPlan: () =>
    apiRequest<{
      plan: string;
      procrastinationWarning: string | null;
      contextLevel: AIContextLevel;
      suggestedPrompts: string[];
    }>('/ai/daily-plan'),
  usage: () => apiRequest<import('@shared/ai-prompts').AIUsage>('/ai/usage'),
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

export const publicApi = {
  stats: () =>
    apiRequest<{ users: number; tasksCompleted: number; habitsCompleted: number; tagline: string }>(
      '/public/stats',
      { public: true },
    ),
};
