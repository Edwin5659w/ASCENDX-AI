import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export type AscendxNotificationData = {
  type?: string;
  habitId?: string;
  taskId?: string;
};

/** Resuelve a qué pantalla ir según el payload de la notificación. */
export function routeForNotificationData(data: AscendxNotificationData | undefined | null): string | null {
  if (!data?.type) return null;
  switch (data.type) {
    case 'habit_reminder':
    case 'habit_completed':
      return '/(tabs)/habits';
    case 'task_due':
    case 'task_reminder':
      return '/(tabs)/tasks';
    case 'morning_ritual':
    case 'daily_bonus':
      return '/(tabs)';
    case 'streak_at_risk':
      return '/(tabs)/habits';
    case 'test':
      return '/(tabs)/profile';
    default:
      return '/(tabs)';
  }
}

function dataFromResponse(response: Notifications.NotificationResponse | null): AscendxNotificationData | null {
  if (!response) return null;
  const raw = response.notification.request.content.data;
  if (!raw || typeof raw !== 'object') return null;
  return raw as AscendxNotificationData;
}

/**
 * Escucha taps en notificaciones (app abierta o cold start) y navega.
 * Solo llamar cuando el usuario ya está autenticado y con onboarding listo.
 */
export function useNotificationNavigation(enabled: boolean) {
  const router = useRouter();
  const handledColdStart = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const navigate = (data: AscendxNotificationData | null) => {
      const href = routeForNotificationData(data);
      if (!href) return;
      router.push(href as never);
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigate(dataFromResponse(response));
    });

    if (!handledColdStart.current) {
      handledColdStart.current = true;
      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response) return;
        // Evitar re-navegar si la respuesta es vieja de otra sesión: solo si es reciente (~2 min)
        const stamped = response.notification.date;
        const ageMs = Date.now() - (typeof stamped === 'number' ? stamped : Date.now());
        if (ageMs > 2 * 60 * 1000) return;
        navigate(dataFromResponse(response));
      });
    }

    return () => sub.remove();
  }, [enabled, router]);
}
