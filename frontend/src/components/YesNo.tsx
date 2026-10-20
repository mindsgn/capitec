import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function YesNo({ id, label, value, onChange }: { id: string; label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <div role="radiogroup" aria-labelledby={`${id}-l`} className="space-y-2">
      <p id={`${id}-l`} className="text-sm font-semibold">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={value === v}
            data-testid={`${id}-${v ? 'yes' : 'no'}`}
            onClick={() => onChange(v)}
            className={cn('h-12 rounded-md border-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              value === v ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background hover:bg-secondary')}
          >
            {v ? t('common.yes') : t('common.no')}
          </button>
        ))}
      </div>
    </div>
  );
}
