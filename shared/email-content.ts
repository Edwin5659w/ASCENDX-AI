import { XP } from './retention';
import { PRO_VALUE_PROPS } from './retention-playbook';

function layout(body: string, ctaUrl?: string, ctaLabel?: string): string {
  const cta = ctaUrl
    ? `<p style="margin:28px 0;"><a href="${ctaUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;">${ctaLabel ?? 'Abrir ASCENDX'}</a></p>`
    : '';
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#18181b;line-height:1.55;">
      <p style="font-size:13px;color:#71717a;margin-bottom:20px;">ASCENDX · Tu Life OS</p>
      ${body}
      ${cta}
      <p style="font-size:12px;color:#a1a1aa;margin-top:32px;border-top:1px solid #e4e4e7;padding-top:16px;">
        Recibes esto porque tienes cuenta en ASCENDX. Puedes desactivar emails en Perfil.
      </p>
    </div>
  `;
}

export const EMAIL_SUBJECTS = {
  welcome: 'Tu ascenso empieza ahora — ASCENDX',
  day1_nudge: 'Tu primera victoria te espera (+10 XP)',
  day3_upgrade: 'Vas bien. ¿Listo para desbloquear Pro?',
  streak_at_risk: '🔥 Tu racha está en riesgo — un tap la salva',
  dormant_7d: 'Tu mentor IA extraña tus datos reales',
  pro_welcome: '¡Bienvenido a ASCENDX Pro! 🎉',
  pro_winback: 'Tu Pro terminó — volvemos cuando quieras',
} as const;

export function buildWelcomeEmail(name: string, appUrl: string): { subject: string; html: string } {
  const first = name.split(/\s+/)[0] || 'viajero';
  return {
    subject: EMAIL_SUBJECTS.welcome,
    html: layout(
      `
      <p style="font-size:20px;font-weight:700;">Hola ${first} 👋</p>
      <p>Acabas de unirte a ASCENDX — objetivos, tareas, hábitos y mentor IA en un solo flujo.</p>
      <p><strong>Tu misión hoy (2 minutos):</strong></p>
      <ul style="padding-left:20px;color:#3f3f46;">
        <li>Completa el onboarding rápido (+${XP.ONBOARDING_COMPLETE} XP)</li>
        <li>Marca tu primera tarea (+${XP.TASK_COMPLETE} XP)</li>
        <li>Registra tu hábito del día (+${XP.HABIT_COMPLETE} XP)</li>
      </ul>
      <p>La ciencia es simple: <em>micro-victorias diarias</em> crean identidad. Nosotros las medimos en XP.</p>
      `,
      `${appUrl}/onboarding`,
      'Configurar mi espacio (30 seg)',
    ),
  };
}

export function buildDay1NudgeEmail(name: string, appUrl: string): { subject: string; html: string } {
  const first = name.split(/\s+/)[0] || 'viajero';
  return {
    subject: EMAIL_SUBJECTS.day1_nudge,
    html: layout(
      `
      <p style="font-size:18px;font-weight:700;">${first}, tu +${XP.TASK_COMPLETE} XP está a un tap</p>
      <p>Ayer creaste tu espacio pero aún no has completado una tarea. Es normal — el primer paso es el más difícil.</p>
      <p>Abre ASCENDX, elige <strong>una</strong> tarea pequeña y márcala hecha. Verás subir tu XP al instante.</p>
      `,
      `${appUrl}/tasks`,
      'Completar mi primera tarea',
    ),
  };
}

export function buildDay3UpgradeEmail(name: string, appUrl: string): { subject: string; html: string } {
  const first = name.split(/\s+/)[0] || 'viajero';
  const bullets = PRO_VALUE_PROPS.map((p) => `<li>${p}</li>`).join('');
  return {
    subject: EMAIL_SUBJECTS.day3_upgrade,
    html: layout(
      `
      <p style="font-size:18px;font-weight:700;">${first}, llevas 3 días construyendo hábito 🚀</p>
      <p>Estás usando ASCENDX como debe ser. Pro desbloquea:</p>
      <ul style="padding-left:20px;color:#3f3f46;">${bullets}</ul>
      <p><strong>$4.99/mes</strong> — menos que un café, más impacto que otra app olvidada.</p>
      `,
      `${appUrl}/pricing`,
      'Ver plan Pro',
    ),
  };
}

export function buildStreakAtRiskEmail(
  name: string,
  habitName: string,
  streak: number,
  appUrl: string,
): { subject: string; html: string } {
  const first = name.split(/\s+/)[0] || 'viajero';
  return {
    subject: EMAIL_SUBJECTS.streak_at_risk,
    html: layout(
      `
      <p style="font-size:18px;font-weight:700;">${first}, tu racha de ${streak} días en "${habitName}" puede romperse hoy</p>
      <p>La pérdida aversiva funciona: perder una racha duele más que ganarla. Toma 30 segundos y márcalo ahora.</p>
      <p>Si tienes escudo de racha, se usará automáticamente si faltas — pero hoy aún puedes ganar +${XP.HABIT_COMPLETE} XP.</p>
      `,
      `${appUrl}/habits`,
      'Marcar hábito ahora',
    ),
  };
}

export function buildDormantEmail(name: string, appUrl: string): { subject: string; html: string } {
  const first = name.split(/\s+/)[0] || 'viajero';
  return {
    subject: EMAIL_SUBJECTS.dormant_7d,
    html: layout(
      `
      <p style="font-size:18px;font-weight:700;">${first}, hace una semana que no te vemos</p>
      <p>Tu mentor IA necesita datos recientes para darte un plan útil. Sin actividad, vuelve a ser un chat genérico.</p>
      <p>Vuelve hoy: bonus de login +${XP.DAILY_LOGIN} XP y un plan del día basado en <em>tus</em> objetivos.</p>
      `,
      appUrl,
      'Volver a ASCENDX',
    ),
  };
}

export function buildProWelcomeEmail(name: string, appUrl: string): { subject: string; html: string } {
  const first = name.split(/\s+/)[0] || 'viajero';
  return {
    subject: EMAIL_SUBJECTS.pro_welcome,
    html: layout(
      `
      <p style="font-size:20px;font-weight:700;">¡Gracias, ${first}! Ya eres Pro 🎉</p>
      <p>Tu suscripción está activa. Desbloqueaste:</p>
      <ul style="padding-left:20px;color:#3f3f46;">
        ${PRO_VALUE_PROPS.map((p) => `<li>${p}</li>`).join('')}
      </ul>
      <p>+2 escudos de racha añadidos a tu cuenta.</p>
      `,
      `${appUrl}/dashboard`,
      'Ir al dashboard',
    ),
  };
}

export function buildProWinbackEmail(name: string, appUrl: string): { subject: string; html: string } {
  const first = name.split(/\s+/)[0] || 'viajero';
  return {
    subject: EMAIL_SUBJECTS.pro_winback,
    html: layout(
      `
      <p style="font-size:18px;font-weight:700;">${first}, tu Pro ha finalizado</p>
      <p>Volviste al plan Gratis. Tus datos, rachas y XP siguen intactos.</p>
      <p>Cuando quieras retomar Pro, puedes reactivarlo en un click desde Perfil.</p>
      `,
      `${appUrl}/pricing`,
      'Reactivar Pro',
    ),
  };
}
