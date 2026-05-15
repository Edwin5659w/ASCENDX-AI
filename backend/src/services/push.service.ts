import { env } from '../config/env';
import { prisma } from '../lib/prisma';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

export interface ExpoPushMessage extends ExpoPushPayload {
  to: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data?: ExpoPushTicket | ExpoPushTicket[];
}

function normalizeResponse(json: ExpoPushResponse): ExpoPushTicket[] {
  const d = json.data;
  if (!d) return [];
  return Array.isArray(d) ? d : [d];
}

export const pushService = {
  /**
   * Envía notificaciones vía Expo Push API.
   * @see https://docs.expo.dev/push-notifications/sending-notifications/
   */
  async send(messages: ExpoPushMessage[]): Promise<{ ok: boolean; tickets: ExpoPushTicket[] }> {
    if (messages.length === 0) {
      return { ok: true, tickets: [] };
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${env.EXPO_ACCESS_TOKEN}`;
    }

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    });

    let parsed: ExpoPushResponse = {};
    try {
      parsed = (await res.json()) as ExpoPushResponse;
    } catch {
      /* ignore */
    }

    const tickets = normalizeResponse(parsed);
    if (!res.ok) {
      const errMsg = tickets[0]?.message ?? `HTTP ${res.status}`;
      console.warn('[ascendx] Expo push HTTP error:', errMsg);
      return { ok: false, tickets: tickets.length ? tickets : [{ status: 'error', message: errMsg }] };
    }

    const failed = tickets.some((t) => t.status === 'error');
    if (failed) {
      console.warn('[ascendx] Expo push ticket error:', tickets);
    }

    return { ok: !failed, tickets };
  },

  async sendToUser(userId: string, payload: ExpoPushPayload): Promise<{ sent: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });
    const to = user?.pushToken;
    if (!to) {
      return { sent: false };
    }

    const { ok } = await this.send([
      {
        to,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: payload.sound ?? 'default',
      },
    ]);

    return { sent: ok };
  },
};
