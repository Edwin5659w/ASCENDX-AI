export interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  onboardingDone?: boolean;
  pushToken?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UserBadgeDto {
  slug: string;
  title: string;
  subtitle: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface UserStats {
  totalGoals: number;
  completedTasks: number;
  totalTasks: number;
  activeHabits: number;
  habitsCompletedToday: number;
  financeRecordsCount: number;
  totalXp: number;
  level: number;
  longestStreak: number;
  financeBalance: number;
  badges: UserBadgeDto[];
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
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  goalId?: string | null;
  userId: string;
  dueDate?: string | null;
  streakCount: number;
  goal?: { id: string; title: string };
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'DAILY' | 'WEEKLY';
  streak: number;
  completedToday?: boolean;
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
