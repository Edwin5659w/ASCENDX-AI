import { listQuerySchema, type PaginatedResult } from '@ascendx/shared/pagination';

export function parseListQuery(query: Record<string, unknown>) {
  const parsed = listQuerySchema.safeParse(query);
  if (!parsed.success) return null;
  const { page, limit } = parsed.data;
  if (page == null && limit == null) return null;
  return { page: page ?? 1, limit: limit ?? 50 };
}

export type { PaginatedResult };
