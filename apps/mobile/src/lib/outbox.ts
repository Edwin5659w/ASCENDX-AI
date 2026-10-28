import { useSyncExternalStore } from 'react';
import { ApiError, apiRequest } from './api';
import { readJson, removeKey, writeJson } from './local-store';
import { invalidate } from './query';

/**
 * RF-29: movimientos creados sin conexión. Se guardan en el teléfono con su
 * client_op_id y se envían al volver la conexión. Como la API es idempotente
 * por client_op_id (RNF-12), reintentar nunca crea el movimiento dos veces.
 *
 * Estados:
 * - pendiente: esperando conexión.
 * - revisar: la API avisó de un posible duplicado (RF-09); el usuario decide.
 * - error: la API lo rechazó (p. ej. la meta ya no existe); el usuario lo corrige o descarta.
 */
export interface OutboxItem {
  clientOpId: string;
  /** Cuerpo de POST /transactions */
  body: Record<string, unknown> & { clientOpId: string; type: string; amount: number; date: string };
  /** Texto para mostrar en la lista («Gasto · Mercado») */
  label: string;
  createdAt: number;
  status: 'pendiente' | 'revisar' | 'error';
  message?: string;
}

const KEY = 'outbox';
let items: OutboxItem[] = [];
let loaded = false;
let syncing: Promise<SyncResult> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

async function save(next: OutboxItem[]) {
  items = next;
  emit();
  await writeJson(KEY, items);
}

export async function loadOutbox() {
  if (loaded) return items;
  items = (await readJson<OutboxItem[]>(KEY)) ?? [];
  loaded = true;
  emit();
  return items;
}

export async function enqueueMovement(body: OutboxItem['body'], label: string) {
  await loadOutbox();
  if (items.some((item) => item.clientOpId === body.clientOpId)) return;
  await save([...items, { clientOpId: body.clientOpId, body, label, createdAt: Date.now(), status: 'pendiente' }]);
}

export async function discardMovement(clientOpId: string) {
  await save(items.filter((item) => item.clientOpId !== clientOpId));
}

/** El usuario confirma que no es un duplicado: se reenvía con confirmDuplicate. */
export async function confirmMovement(clientOpId: string) {
  await save(items.map((item) => (item.clientOpId === clientOpId ? { ...item, status: 'pendiente', body: { ...item.body, confirmDuplicate: true }, message: undefined } : item)));
  return syncOutbox();
}

export interface SyncResult {
  sent: number;
  offline: boolean;
}

/** Envía en orden los movimientos pendientes. Se detiene si no hay conexión. */
export function syncOutbox(): Promise<SyncResult> {
  syncing ??= (async () => {
    await loadOutbox();
    let sent = 0;
    let offline = false;
    for (const item of items.filter((i) => i.status === 'pendiente')) {
      try {
        await apiRequest('/transactions', { method: 'POST', body: item.body, auth: true });
        sent += 1;
        await save(items.filter((i) => i.clientOpId !== item.clientOpId));
      } catch (error) {
        if (error instanceof ApiError && (error.status === 0 || error.status >= 500 || error.status === 401)) {
          offline = true;
          break;
        }
        const review = error instanceof ApiError && error.code === 'POSSIBLE_DUPLICATE';
        await save(
          items.map((i) =>
            i.clientOpId === item.clientOpId
              ? { ...i, status: review ? 'revisar' : 'error', message: error instanceof Error ? error.message : 'No se pudo guardar' }
              : i,
          ),
        );
      }
    }
    if (sent) invalidate('dashboard', 'transactions', 'debts', 'debt:', 'goals', 'goal:', 'accounts', 'habits', 'assistant');
    return { sent, offline };
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

export async function clearOutbox() {
  items = [];
  loaded = false;
  emit();
  await removeKey(KEY);
}

export function useOutbox(): OutboxItem[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      if (!loaded) loadOutbox().catch(() => undefined);
      return () => listeners.delete(listener);
    },
    () => items,
    () => items,
  );
}
