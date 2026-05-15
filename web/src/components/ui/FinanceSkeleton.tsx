import { Card } from '../Card';
import { Skeleton } from './Skeleton';

export function FinanceSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-36 mb-6" />
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-28" />
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </Card>
        <Card>
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-10 w-full mb-3 rounded-lg" />
          <Skeleton className="h-10 w-full mb-2 rounded-lg" />
          <Skeleton className="h-10 w-full mb-3 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </Card>
      </div>
      <Card>
        <Skeleton className="h-6 w-24 mb-4" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between py-3 border-b border-white/5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </Card>
    </div>
  );
}
