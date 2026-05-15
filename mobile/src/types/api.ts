export interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UserStats {
  totalGoals: number;
  completedTasks: number;
  totalTasks: number;
  activeHabits: number;
  totalXp: number;
  level: number;
  longestStreak: number;
  financeBalance: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  progress: number;
  deadline?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  goalId?: string | null;
  userId: string;
  dueDate?: string | null;
  streakCount: number;
  createdAt: string;
  updatedAt: string;
  goal?: { id: string; title: string };
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'DAILY' | 'WEEKLY';
  streak: number;
  userId: string;
}

export interface FinanceRecord {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  note?: string | null;
  createdAt: string;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
  totalRecords: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
