import { Card } from './Card';
import { Skeleton } from './ui/Skeleton';

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <Skeleton className="h-8 w-48 mb-4" />
      <Card className="mb-4 shrink-0 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>
      <div className="flex-1 space-y-3 mb-4 pr-2">
        <Skeleton className="h-16 w-[70%] rounded-2xl" />
        <Skeleton className="h-20 w-[75%] ml-auto rounded-2xl" />
        <Skeleton className="h-14 w-[65%] rounded-2xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}
