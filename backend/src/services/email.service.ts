import { Resend } from 'resend';
import { env } from '../config/env';

let resend: Resend | null = null;

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

export const emailService = {
  isConfigured(): boolean {
    return Boolean(env.RESEND_API_KEY && env.RESEND_FROM);
  },

  async sendPasswordReset(to: string, resetLink: string, displayName: string): Promise<boolean> {
    const client = getClient();
    const from = env.RESEND_FROM;
    if (!client || !from) {
      return false;
    }

    const safeName = displayName.split(/\s+/)[0] || 'Ascendx';

    const { error } = await client.emails.send({
      from,
      to,
      subject: 'Restablece tu contraseña — ASCENDX',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
          <p style="font-size: 18px; font-weight: 600;">Hola ${safeName},</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña en ASCENDX.</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}" style="display: inline-block; background: #7c3aed; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Restablecer contraseña</a>
          </p>
          <p style="font-size: 13px; color: #71717a;">Si no solicitaste esto, puedes ignorar este mensaje. El enlace expira en 1 hora.</p>
          <p style="font-size: 12px; color: #a1a1aa; word-break: break-all;">${resetLink}</p>
        </div>
      `,
    });

    if (error) {
      console.error('[ascendx] Resend error:', error);
      return false;
    }

    return true;
  },
};
