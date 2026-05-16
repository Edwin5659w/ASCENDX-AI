import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 flex items-center justify-center mb-4 relative overflow-hidden">
        <div className="absolute inset-0 brand-skeleton opacity-30" aria-hidden />
        <Icon className="text-cyan-400 relative z-10" size={28} />
      </div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      {description && <p className="text-zinc-500 text-sm max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
