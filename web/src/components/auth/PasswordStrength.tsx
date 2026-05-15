import {
  PASSWORD_REQUIREMENTS,
  PasswordChecks,
  STRENGTH_LABELS,
} from '@shared/validators/auth.rules';

const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];

interface PasswordStrengthProps {
  checks: PasswordChecks;
  strength: 0 | 1 | 2 | 3 | 4;
  visible: boolean;
}

export function PasswordStrength({ checks, strength, visible }: PasswordStrengthProps) {
  if (!visible) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= strength ? STRENGTH_COLORS[strength] : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-400">
        Seguridad: <span className="text-zinc-200">{STRENGTH_LABELS[strength]}</span>
      </p>
      <ul className="space-y-1">
        {PASSWORD_REQUIREMENTS.map(({ key, label }) => (
          <li
            key={key}
            className={`text-xs flex items-center gap-2 transition-colors ${
              checks[key] ? 'text-emerald-400' : 'text-zinc-500'
            }`}>
            <span className="w-4 text-center">{checks[key] ? '✓' : '○'}</span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}