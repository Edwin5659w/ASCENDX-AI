import { FieldValidation } from '@shared/validators/auth.rules';

interface AuthTextFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  validation: FieldValidation;
  placeholder?: string;
  autoComplete?: string;
  rightElement?: React.ReactNode;
}

export function AuthTextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  validation,
  placeholder,
  autoComplete,
  rightElement,
}: AuthTextFieldProps) {
  const showError = validation.status === 'invalid';
  const showSuccess = validation.status === 'valid' && value.length > 0;

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all pointer-events-none ${
          value ? 'top-1.5 text-xs' : 'top-3.5 text-sm'
        } ${showError ? 'text-red-400' : showSuccess ? 'text-emerald-400' : 'text-zinc-500'}`}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={value ? placeholder : ''}
        autoComplete={autoComplete}
        className={`w-full bg-[#1c1c2e] rounded-lg px-3 pt-6 pb-2 text-white text-sm border-2 transition-colors focus:outline-none ${
          showError
            ? 'border-red-500/80 focus:border-red-400'
            : showSuccess
              ? 'border-emerald-500/50 focus:border-emerald-400'
              : 'border-white/10 focus:border-violet-500'
        } ${rightElement ? 'pr-10' : ''}`}
      />
      {rightElement ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span>
      ) : null}
      {showError && validation.message ? (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
          <span aria-hidden>⚠</span> {validation.message}
        </p>
      ) : null}
    </div>
  );
}
