import { Card } from '../Card';
import { Skeleton } from './Skeleton';

export function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-64 max-w-full mb-2" />
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="h-20 w-full mb-6 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton className="h-6 w-6 mb-3 rounded-md" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </Card>
        <Card>
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>
    </div>
  );
}
