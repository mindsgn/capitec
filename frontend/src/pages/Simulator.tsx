import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ExpensesStep, IncomeStep, LoanDetailsStep, LoanTypeStep } from '@/components/steps/Affordability';
import { BasicsStep, DocumentStep, ReviewStep } from '@/components/steps/Eligibility';
import { ResultsStep } from '@/components/steps/Results';
import { SubmittedView } from '@/components/steps/Submitted';
import type { Flow } from '@/components/steps/types';
import { eligibilitySteps, overallProgress } from '@/lib/flow';
import { LOAN_TYPES, type LoanTypeId } from '@/lib/loans';
import { AFFORDABILITY_STEPS } from '@/lib/state';
import { cn } from '@/lib/utils';
import { useSim } from '@/state/SimulatorContext';

const LAST_AFFORDABILITY = AFFORDABILITY_STEPS.length - 1;

export default function Simulator() {
  const { t } = useTranslation();
  const { state, update, selectLoanType, reset } = useSim();
  const reduce = useReducedMotion();
  const [params, setParams] = useSearchParams();

  // Deep link from the landing page: /simulator?type=personal
  useEffect(() => {
    const type = params.get('type');
    if (!type) return;
    if ((LOAN_TYPES as readonly string[]).includes(type) && state.loanType !== type) {
      selectLoanType(type as LoanTypeId);
      update((s) => ({ ...s, phase: 'affordability', step: 1 }));
    }
    params.delete('type');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Repair impossible saved states (e.g. past the first step without a loan type).
  useEffect(() => {
    if (state.loanType === null && (state.phase !== 'affordability' || state.step > 0)) update((s) => ({ ...s, phase: 'affordability', step: 0 }));
  }, [state.loanType, state.phase, state.step, update]);

  const ids: string[] = state.phase === 'affordability' ? [...AFFORDABILITY_STEPS] : eligibilitySteps(state);
  const idx = Math.min(state.step, ids.length - 1);
  const stepId = ids[idx];
  const { index, total } = overallProgress(state);

  const prev = useRef(index);
  const dir = index >= prev.current ? 1 : -1;
  useEffect(() => { prev.current = index; }, [index]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.querySelector<HTMLElement>('[data-step-title]')?.focus({ preventScroll: true });
  }, [state.phase, stepId, reduce]);

  const flow: Flow = {
    next: () => update((s) => {
      if (s.phase === 'affordability') return s.step >= LAST_AFFORDABILITY ? { ...s, phase: 'eligibility', step: 0 } : { ...s, step: s.step + 1 };
      return { ...s, step: Math.min(s.step + 1, eligibilitySteps(s).length - 1) };
    }),
    back: () => update((s) => {
      if (s.step > 0) return { ...s, step: s.step - 1 };
      return s.phase === 'eligibility' ? { ...s, phase: 'affordability', step: LAST_AFFORDABILITY } : s;
    }),
    goTo: (step) => update((s) => ({ ...s, step })),
  };

  const variants: Variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -48 }),
  };

  function renderStep() {
    switch (stepId) {
      case 'loanType': return <LoanTypeStep flow={flow} />;
      case 'income': return <IncomeStep flow={flow} />;
      case 'expenses': return <ExpensesStep flow={flow} />;
      case 'loanDetails': return <LoanDetailsStep flow={flow} />;
      case 'results': return <ResultsStep flow={flow} />;
      case 'basics': return <BasicsStep flow={flow} />;
      case 'review': return <ReviewStep flow={flow} />;
      default: return <DocumentStep key={stepId} docId={stepId.replace('doc:', '')} position={idx} total={ids.length - 2} flow={flow} />;
    }
  }

  const submitted = state.phase === 'submitted';
  const phases = [
    { id: 'affordability', label: t('phase.affordability') },
    { id: 'eligibility', label: t('phase.eligibility') },
  ] as const;

  return (
    <div className="bg-secondary/50">
      <Seo title={t('seo.simulator.title')} description={t('seo.simulator.desc')} path="/simulator" />
      <div className="container py-8 sm:py-12">
        <h1 className="sr-only">{t('seo.simulator.h1')}</h1>
        {!submitted && (
          <div className="mx-auto mb-6 w-full max-w-2xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <ol className="flex gap-2" aria-label={t('phase.label')}>
                {phases.map((p) => (
                  <li key={p.id} aria-current={state.phase === p.id ? 'step' : undefined}
                    className={cn('rounded-full px-4 py-1.5 text-sm font-semibold', state.phase === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    {p.label}
                  </li>
                ))}
              </ol>
              <Button variant="ghost" size="sm" onClick={() => { if (window.confirm(t('flow.confirmReset'))) { reset(); toast.info(t('toast.reset')); } }}>
                <RotateCcw className="h-4 w-4" aria-hidden />{t('flow.startOver')}
              </Button>
            </div>
            <Progress value={Math.round((index / total) * 100)} aria-label={t('flow.progress')} />
            <p className="text-xs text-muted-foreground" aria-live="polite">{t('flow.stepOf', { n: index + 1, total })}</p>
          </div>
        )}
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div key={`${state.phase}:${stepId}`} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}>
            {submitted ? <SubmittedView /> : renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
