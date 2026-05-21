import { Card } from '../Card';
import { Skeleton } from './Skeleton';

export function FinanceSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-12 w-full max-w-lg mb-6 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-28" />
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </Card>
        <Card className="lg:col-span-2">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </Card>
        <Card>
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </Card>
      </div>
      <Card className="mb-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-10 w-full mb-3 rounded-lg" />
        <Skeleton className="h-10 w-full mb-3 rounded-lg" />
        <Skeleton className="h-24 w-full mb-3 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </Card>
      <Card>
        <Skeleton className="h-6 w-24 mb-4" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between py-3 border-b border-white/5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}
