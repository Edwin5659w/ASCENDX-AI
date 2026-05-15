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
      <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
        <Icon className="text-violet-400" size={28} />
      </div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      {description && <p className="text-zinc-500 text-sm max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
