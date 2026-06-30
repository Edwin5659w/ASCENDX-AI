import type { OnboardingFocus } from './validators/onboarding.validator';

export type ProfileTemplateId = OnboardingFocus | 'EMPRENDEDOR' | 'FITNESS';

export interface ProfileTemplate {
  id: ProfileTemplateId;
  label: string;
  emoji: string;
  description: string;
  goalTitle: string;
  taskTitles: [string, string];
  habitName: string;
}

/** Plantillas extendidas — Estudiante/Finanzas/etc. vienen de ONBOARDING_TEMPLATES */
export const EXTENDED_PROFILE_TEMPLATES: Record<'EMPRENDEDOR' | 'FITNESS', ProfileTemplate> = {
  EMPRENDEDOR: {
    id: 'EMPRENDEDOR',
    label: 'Emprendedor',
    emoji: '🚀',
    description: 'Lanzar y hacer crecer tu proyecto',
    goalTitle: 'Hacer crecer mi negocio este trimestre',
    taskTitles: ['Contactar 3 clientes potenciales', 'Revisar métricas de la semana'],
    habitName: 'Bloque de trabajo profundo 45 min',
  },
  FITNESS: {
    id: 'FITNESS',
    label: 'Fitness',
    emoji: '💪',
    description: 'Constancia física y energía',
    goalTitle: 'Mejorar mi condición física en 90 días',
    taskTitles: ['Preparar ropa de entreno', 'Planificar comidas de la semana'],
    habitName: 'Entrenar o moverme 30 min',
  },
};
