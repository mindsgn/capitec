import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StepShell } from '@/components/StepShell';
import type { LoanProduct, ValidationRules } from '@/lib/api/contracts';
import { useLoanApi } from '@/state/loanApiStore';

interface Props {
  title: string;
  description?: string;
  onBack?: () => void;
  children: (rules: ValidationRules, products: LoanProduct[]) => React.ReactNode;
}

/** Waits for products and validation rules before rendering a step that depends on them. */
export function RulesGate({ title, description, onBack, children }: Props) {
  const { t } = useTranslation();
  const status = useLoanApi((s) => s.status);
  const rules = useLoanApi((s) => s.rules);
  const products = useLoanApi((s) => s.products);
  const loadReference = useLoanApi((s) => s.loadReference);

  useEffect(() => { void loadReference(); }, [loadReference]);

  if (status === 'ready' && rules && products) return <>{children(rules, products)}</>;

  const failed = status === 'error';
  return (
    <StepShell
      title={title}
      description={description}
      onBack={onBack}
      onNext={failed ? () => void loadReference() : () => undefined}
      nextLabel={failed ? t('flow.retry') : undefined}
      nextDisabled={!failed}
    >
      <p role="status">{failed ? t('flow.rulesError') : t('flow.rulesLoading')}</p>
    </StepShell>
  );
}
