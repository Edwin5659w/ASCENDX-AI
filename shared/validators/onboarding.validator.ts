import { z } from 'zod';

export const onboardingFocusEnum = z.enum(['ESTUDIO', 'SALUD', 'FINANZAS', 'TRABAJO', 'PERSONAL']);

export type OnboardingFocus = z.infer<typeof onboardingFocusEnum>;

export const ONBOARDING_TEMPLATES: Record<
  OnboardingFocus,
  { label: string; goalTitle: string; taskTitles: [string, string]; habitName: string }
> = {
  ESTUDIO: {
    label: 'Estudio',
    goalTitle: 'Mejorar mi rendimiento académico',
    taskTitles: ['Revisar apuntes de hoy', 'Avanzar en el trabajo pendiente'],
    habitName: 'Estudiar 30 min sin distracciones',
  },
  SALUD: {
    label: 'Salud',
    goalTitle: 'Cuidar mi bienestar físico',
    taskTitles: ['Preparar comida saludable', 'Caminar 20 minutos'],
    habitName: 'Beber 2 litros de agua',
  },
  FINANZAS: {
    label: 'Finanzas',
    goalTitle: 'Ordenar mis finanzas personales',
    taskTitles: ['Registrar gastos de la semana', 'Revisar presupuesto mensual'],
    habitName: 'Anotar cada gasto del día',
  },
  TRABAJO: {
    label: 'Trabajo',
    goalTitle: 'Ser más productivo en mis proyectos',
    taskTitles: ['Definir 3 prioridades del día', 'Cerrar una tarea importante'],
    habitName: 'Planificar el día en 5 minutos',
  },
  PERSONAL: {
    label: 'Crecimiento personal',
    goalTitle: 'Construir mejores hábitos diarios',
    taskTitles: ['Leer 10 páginas', 'Reflexionar 5 minutos al final del día'],
    habitName: 'Meditar 10 minutos',
  },
};

export const onboardingSetupSchema = z.object({
  focus: onboardingFocusEnum,
  goalTitle: z.string().trim().min(3, 'El objetivo debe tener al menos 3 caracteres').max(200),
  taskTitles: z
    .array(z.string().trim().min(1, 'Cada tarea necesita un título').max(300))
    .min(1, 'Añade al menos una tarea')
    .max(3),
  habitName: z.string().trim().min(1, 'El hábito es obligatorio').max(100),
});

export type OnboardingSetupInput = z.infer<typeof onboardingSetupSchema>;
