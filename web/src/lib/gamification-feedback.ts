import type { GamificationPayload } from '@shared/retention';
import { RETENTION_MESSAGES } from '@shared/retention';

export function applyGamificationFeedback(
  g: GamificationPayload | undefined | null,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
  refreshUser?: () => Promise<unknown>,
) {
  if (!g || !g.xpGained) return;

  showToast(g.message ?? `+${g.xpGained} XP`, 'success');

  if (g.leveledUp) {
    setTimeout(() => {
      showToast(RETENTION_MESSAGES.levelUp(g.level), 'success');
    }, 400);
  }

  if (refreshUser) void refreshUser();
}
