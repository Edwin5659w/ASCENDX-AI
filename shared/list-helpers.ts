import type { PaginatedResult } from './pagination';

export function isPaginated<T>(data: T[] | PaginatedResult<T>): data is PaginatedResult<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    'items' in data &&
    'hasMore' in data
  );
}

export function normalizeListResponse<T>(data: T[] | PaginatedResult<T>) {
  if (isPaginated(data)) {
    return { items: data.items, hasMore: data.hasMore, total: data.total };
  }
  return { items: data, hasMore: false, total: data.length };
}

export function listQueryString(page: number, limit = 50) {
  return `?page=${page}&limit=${limit}`;
}
