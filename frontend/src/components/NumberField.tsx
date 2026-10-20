import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  id: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}

/** Numeric input that stores `null` when empty. Errors only show once the user has typed something. */
export function NumberField({ id, label, value, onChange, error, hint, prefix = 'R', suffix, placeholder }: Props) {
  const showError = !!error && value !== null;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {prefix && <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">{prefix}</span>}
        <Input
          id={id}
          data-testid={id}
          type="number"
          inputMode="decimal"
          min={0}
          placeholder={placeholder ?? '0'}
          className={prefix ? 'pl-9' : undefined}
          value={value ?? ''}
          aria-invalid={showError}
          aria-describedby={`${id}-desc`}
          onChange={(e) => { const raw = e.target.value; onChange(raw === '' || Number.isNaN(Number(raw)) ? null : Number(raw)); }}
        />
        {suffix && <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>}
      </div>
      <p id={`${id}-desc`} className={showError ? 'text-sm font-medium text-accent' : 'text-sm text-muted-foreground'} role={showError ? 'alert' : undefined}>
        {showError ? error : hint}
      </p>
    </div>
  );
}
