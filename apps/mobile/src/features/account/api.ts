import { apiRequest, type User } from '@/lib/api';

export interface ProfileChanges {
  name?: string;
  estimatedIncome?: number | null;
  estimatedFixedExpenses?: number | null;
  payDay?: number | null;
}

/** RF-04 */
export function updateProfile(changes: ProfileChanges) {
  return apiRequest<{ user: User }>('/me/profile', { method: 'PATCH', body: changes, auth: true });
}

/** RF-06: autorizar o revocar IA y OCR por separado. */
export function updateConsents(changes: { ia?: boolean; ocr?: boolean }) {
  return apiRequest<{ user: User }>('/me/consents', { method: 'PATCH', body: changes, auth: true });
}

/** RF-05 */
export function deleteAccount(password: string) {
  return apiRequest<void>('/me', { method: 'DELETE', body: { password }, auth: true });
}

/** RF-03 */
export function requestPasswordReset(email: string) {
  return apiRequest<{ message: string }>('/auth/password/forgot', { method: 'POST', body: { email } });
}

export function resetPassword(input: { email: string; code: string; newPassword: string }) {
  return apiRequest<void>('/auth/password/reset', { method: 'POST', body: input });
}
