import { useCallback, useEffect, useState } from 'react';
import { normalizeListResponse } from '../../../shared/list-helpers';
import type { PaginatedResult } from '../../../shared/pagination';

const PAGE_SIZE = 40;

export function usePaginatedList<T>(
  fetchPage: (page: number, limit: number) => Promise<T[] | PaginatedResult<T>>,
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const raw = await fetchPage(pageNum, PAGE_SIZE);
        const { items: batch, hasMore: more } = normalizeListResponse(raw);
        setItems((prev) => (append ? [...prev, ...batch] : batch));
        setHasMore(more);
        setPage(pageNum);
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

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  return { items, loading, loadingMore, hasMore, refresh, loadMore };
}

export { PAGE_SIZE };
