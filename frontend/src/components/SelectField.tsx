import { Label } from '@/components/ui/label';

interface Option { value: string; label: string }

interface Props {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  options: Option[];
  error?: string;
  hint?: string;
  placeholder: string;
}

/** Native select that stores an empty string as "not chosen". Errors show only after a value is chosen. */
export function SelectField({ id, label, value, onChange, options, error, hint, placeholder }: Props) {
  const showError = !!error && !!value;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        data-testid={id}
        value={value ?? ''}
        aria-invalid={showError}
        aria-describedby={`${id}-desc`}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-12 w-full rounded-md border border-input bg-background px-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-accent"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <p id={`${id}-desc`} className={showError ? 'text-sm font-medium text-accent' : 'text-sm text-muted-foreground'} role={showError ? 'alert' : undefined}>
        {showError ? error : hint}
      </p>
    </div>
  );
}
