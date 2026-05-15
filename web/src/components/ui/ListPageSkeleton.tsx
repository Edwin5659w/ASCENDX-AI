import { Card } from '../Card';
import { Skeleton } from './Skeleton';

interface ListPageSkeletonProps {
  rows?: number;
  showToolbar?: boolean;
}

export function ListPageSkeleton({ rows = 4, showToolbar = true }: ListPageSkeletonProps) {
  return (
    <div>
      <Skeleton className="h-8 w-40 mb-6" />
      {showToolbar ? (
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>
      ) : null}
      <div className="grid gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Card key={i}>
            <div className="flex justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-[min(240px,60%)]" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
