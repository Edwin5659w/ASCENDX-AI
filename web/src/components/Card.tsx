export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#1c1c2e]/80 backdrop-blur p-5 ${className}`}>
      {children}
    </div>
  );
}
