export interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  plan?: 'FREE' | 'PRO';
  referralCode?: string;
  streakShields?: number;
  subscriptionStatus?: 'NONE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  subscriptionPeriodEnd?: string | null;
  emailOptIn?: boolean;
  dailyFocus?: string | null;
  dailyFocusDate?: string | null;
  onboardingDone?: boolean;
  productTourDone?: boolean;
  pushToken?: string | null;
  preferredCurrency?: string;
  tradingJournalEnabled?: boolean;
  proTrialEndsAt?: string | null;
  themePreference?: 'dark' | 'light';
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  referralBonus?: number;
}

export interface GamificationPayload {
  xpGained: number;
  leveledUp: boolean;
  level: number;
  xp: number;
  streakShieldUsed?: boolean;
  dailyBonus?: boolean;
  message?: string;
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
  planUsage?: PlanUsage;
  firstStepsBonus?: { xpGained: number; message: string } | null;
  ascendScore?: number;
  ascendLabel?: string;
  ascendTips?: string[];
  morningRitualDone?: boolean;
}

export interface BillingStatus {
  plan: 'FREE' | 'PRO';
  subscriptionStatus: 'NONE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  subscriptionPeriodEnd: string | null;
  billingConfigured: boolean;
  hasStripeCustomer: boolean;
  iapConfigured?: boolean;
  subscriptionProvider?: string | null;
}

export interface PlanUsage {
  plan: 'FREE' | 'PRO';
  limits: {
    aiChatPerDay: number;
    maxGoals: number;
    maxHabits: number;
    streakShieldsPerMonth: number;
    weeklyRecap: boolean;
    tradingJournal: boolean;
  };
  usage: {
    aiChatToday: number;
    goals: number;
    habits: number;
    referrals: number;
  };
}

export interface WeeklyRecapResult {
  headline: string;
  highlights: string[];
  score: number;
  encouragement: string;
}

export interface ReferralInfo {
  referralCode: string;
  referralCount: number;
  bonusXp: number;
  trialDays: number;
  shareMessage: string;
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
  gamification?: GamificationPayload;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'DAILY' | 'WEEKLY';
  streak: number;
  userId: string;
  lastCompletedAt?: string | null;
  completedToday?: boolean;
  reminderEnabled?: boolean;
  reminderHour?: number | null;
  reminderMinute?: number | null;
  weekHistory?: boolean[];
  weekCompletionRate?: number;
  streakMilestone?: number | null;
  gamification?: GamificationPayload;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  pnl: number | null;
  emotionTag: string | null;
  note: string | null;
  tradedAt: string;
}

export interface TradeSummary {
  totalTrades: number;
  totalPnl: number;
  wins: number;
  losses: number;
  breakEven: number;
}

export interface FinanceRecord {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  note?: string | null;
  createdAt: string;
}

export interface FinanceCategoryTotal {
  category: string;
  total: number;
}

export interface FinanceMonthTotal {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
  totalRecords: number;
  savingsRate: number;
  expenseByCategory: FinanceCategoryTotal[];
  incomeByCategory: FinanceCategoryTotal[];
  monthly: FinanceMonthTotal[];
  budget503020: { needs: number; wants: number; savings: number } | null;
  topExpenseCategory: string | null;
}

export interface AIInsight {
  id: string;
  userId: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}
