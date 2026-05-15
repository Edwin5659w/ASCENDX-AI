import { Card } from './Card';
import { Skeleton } from './ui/Skeleton';

export function ProfileSkeleton() {
  return (
    <div className="max-w-lg">
      <Skeleton className="h-8 w-32 mb-6" />
      <Card className="text-center mb-4">
        <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-56 mx-auto" />
      </Card>
      <Card className="mb-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </Card>
      <Card className="space-y-3 mb-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex justify-between py-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </Card>
    </div>
  );
}
