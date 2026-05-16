interface BrandLoaderProps {
  className?: string;
  label?: string;
}

export function BrandLoader({ className = '', label }: BrandLoaderProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} role="status" aria-live="polite">
      <div className="brand-loader" aria-hidden />
      {label ? <p className="text-sm text-zinc-500">{label}</p> : null}
    </div>
  );
}
