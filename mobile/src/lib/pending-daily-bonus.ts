type DailyBonus = { message?: string; xpGained?: number } | null;

let pendingDailyBonus: DailyBonus = null;

export function setPendingDailyBonus(bonus: DailyBonus) {
  if (bonus?.xpGained) pendingDailyBonus = bonus;
}

export function consumePendingDailyBonus(): DailyBonus {
  const bonus = pendingDailyBonus;
  pendingDailyBonus = null;
  return bonus;
}
