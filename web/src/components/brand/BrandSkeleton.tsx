interface BrandSkeletonProps {
  className?: string;
}

export function BrandSkeleton({ className = '' }: BrandSkeletonProps) {
  return <div className={`rounded-lg brand-skeleton ${className}`} aria-hidden />;
}
