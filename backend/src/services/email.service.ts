import { Resend } from 'resend';
import { env } from '../config/env';
import {
  buildDay1NudgeEmail,
  buildDay3UpgradeEmail,
  buildDormantEmail,
  buildProWelcomeEmail,
  buildProWinbackEmail,
  buildStreakAtRiskEmail,
  buildWelcomeEmail,
} from '@ascendx/shared/email-content';

let resend: Resend | null = null;

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

function appUrl(): string {
  return env.WEB_APP_ORIGIN.replace(/\/$/, '');
}

async function send(to: string, subject: string, html: string): Promise<boolean> {
  const client = getClient();
  const from = env.RESEND_FROM;
  if (!client || !from) return false;

  const { error } = await client.emails.send({ from, to, subject, html });
  if (error) {
    console.error('[ascendx] Resend error:', error);
    return false;
  }
  return true;
}

export const emailService = {
  isConfigured(): boolean {
    return Boolean(env.RESEND_API_KEY && env.RESEND_FROM);
  },

  async sendPasswordReset(to: string, resetLink: string, displayName: string): Promise<boolean> {
    const safeName = displayName.split(/\s+/)[0] || 'Ascendx';
    return send(
      to,
      'Restablece tu contraseña — ASCENDX',
      `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
          <p style="font-size: 18px; font-weight: 600;">Hola ${safeName},</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña en ASCENDX.</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}" style="display: inline-block; background: #7c3aed; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Restablecer contraseña</a>
          </p>
          <p style="font-size: 13px; color: #71717a;">Si no solicitaste esto, ignora este mensaje. El enlace expira en 1 hora.</p>
        </div>
      `,
    );
  },

  async sendWelcome(to: string, name: string): Promise<boolean> {
    const { subject, html } = buildWelcomeEmail(name, appUrl());
    return send(to, subject, html);
  },

  async sendDay1Nudge(to: string, name: string): Promise<boolean> {
    const { subject, html } = buildDay1NudgeEmail(name, appUrl());
    return send(to, subject, html);
  },

  async sendDay3Upgrade(to: string, name: string): Promise<boolean> {
    const { subject, html } = buildDay3UpgradeEmail(name, appUrl());
    return send(to, subject, html);
  },

  async sendStreakAtRisk(to: string, name: string, habitName: string, streak: number): Promise<boolean> {
    const { subject, html } = buildStreakAtRiskEmail(name, habitName, streak, appUrl());
    return send(to, subject, html);
  },

  async sendDormant(to: string, name: string): Promise<boolean> {
    const { subject, html } = buildDormantEmail(name, appUrl());
    return send(to, subject, html);
  },

  async sendProWelcome(to: string, name: string): Promise<boolean> {
    const { subject, html } = buildProWelcomeEmail(name, appUrl());
    return send(to, subject, html);
  },

  async sendProWinback(to: string, name: string): Promise<boolean> {
    const { subject, html } = buildProWinbackEmail(name, appUrl());
    return send(to, subject, html);
  },
};
