import { useCallback, useState } from 'react';
import { normalizeListResponse } from '../../../shared/list-helpers';
import type { PaginatedResult } from '../../../shared/pagination';
import { formatApiError } from '../api/client';

const PAGE_SIZE = 40;

/**
 * Lista paginada sin fetch automático al montar — el screen dispara
 * `refresh()` en focus (throttled) o pull-to-refresh para evitar doble carga.
 */
export function usePaginatedList<T>(
  fetchPage: (page: number, limit: number) => Promise<T[] | PaginatedResult<T>>,
) {
  const [items, setItemsState] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const raw = await fetchPage(pageNum, PAGE_SIZE);
        const { items: batch, hasMore: more } = normalizeListResponse(raw);
        setItemsState((prev) => (append ? [...prev, ...batch] : batch));
        setHasMore(more);
        setPage(pageNum);
      } catch (e) {
        setError(formatApiError(e));
        if (!append) setItemsState([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [fetchPage],
  );

  const refresh = useCallback(() => loadPage(1, false), [loadPage]);
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    void loadPage(page + 1, true);
  }, [hasMore, loadingMore, loadPage, page]);

  const setItems = useCallback((updater: T[] | ((prev: T[]) => T[])) => {
    setItemsState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  return { items, setItems, loading, loadingMore, hasMore, error, refresh, loadMore };
}

export { PAGE_SIZE };
