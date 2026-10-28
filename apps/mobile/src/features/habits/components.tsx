import { router } from 'expo-router';
import { NavRow } from '@/components/ui';
import { useQuery } from '@/lib/query';
import { getHabits } from './api';

/** Fila del panel con la racha semanal y los logros (RF-32). */
export function HabitsRow() {
  const { data } = useQuery('habits', getHabits);
  if (!data) return null;
  const { streak, earnedCount, achievements } = data;
  return (
    <NavRow
      icon="flame"
      title={streak.current ? `Racha de ${streak.current} ${streak.current === 1 ? 'semana' : 'semanas'}` : 'Empieza tu racha semanal'}
      subtitle={`${earnedCount} de ${achievements.length} logros${streak.current && !streak.activeThisWeek ? ' · registra algo esta semana para mantenerla' : ''}`}
      onPress={() => router.push('/achievements')}
    />
  );
}
