interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({ prompts, onSelect, disabled }: SuggestedPromptsProps) {
  if (!prompts.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {prompts.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(p)}
          className="text-left text-xs px-3 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 disabled:opacity-50 transition-colors">
          {p}
        </button>
      ))}
    </div>
  );
}
