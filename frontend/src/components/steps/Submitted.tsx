import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LOAN_MAP } from '@/lib/loans';
import { useSim } from '@/state/SimulatorContext';

export function SubmittedView() {
  const { t } = useTranslation();
  const { state, reset } = useSim();
  const reduce = useReducedMotion();
  const cfg = state.loanType ? LOAN_MAP[state.loanType] : null;
  const ref = state.submission?.reference ?? '—';
  return (
    <Card className="mx-auto w-full max-w-2xl text-center">
      <CardHeader className="items-center">
        <motion.span initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
          <CheckCircle2 className="h-16 w-16 text-success" aria-hidden />
        </motion.span>
        <CardTitle tabIndex={-1} data-step-title>{t('done.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{t('done.body', { loan: cfg ? t(`loans.${cfg.id}.name`).toLowerCase() : '' })}</p>
        <p className="rounded-lg bg-secondary p-4">{t('done.reference')} <strong data-testid="reference" className="font-mono text-lg">{ref}</strong></p>
        <p className="text-sm text-muted-foreground">{t('done.note')}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => { reset(); toast.info(t('toast.reset')); }}>{t('done.again')}</Button>
          <Link to="/" className={buttonVariants({ variant: 'outline' })}>{t('done.home')}</Link>
        </div>
      </CardContent>
    </Card>
  );
}
