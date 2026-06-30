import { useCallback } from 'react';

interface LoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  label?: string;
}

export function LoadMoreButton({ hasMore, loading, onLoadMore, label = 'Cargar más' }: LoadMoreProps) {
  if (!hasMore) return null;
  return (
    <button
      type="button"
      onClick={onLoadMore}
      disabled={loading}
      className="w-full mt-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:text-white hover:border-violet-500/40 disabled:opacity-50">
      {loading ? 'Cargando...' : label}
    </button>
  );
}

export function useListFetcher<T>(apiList: (page: number, limit: number) => Promise<T[] | import('@shared/pagination').PaginatedResult<T>>) {
  return useCallback((page: number, limit: number) => apiList(page, limit), [apiList]);
}
