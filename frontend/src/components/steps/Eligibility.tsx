import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CheckCircle2, Circle, FileText, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { NumberField } from '@/components/NumberField';
import { RulesGate } from '@/components/RulesGate';
import { SelectField } from '@/components/SelectField';
import { StepShell } from '@/components/StepShell';
import { YesNo } from '@/components/YesNo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { EMPLOYMENT_STATUSES, LOAN_PURPOSES, type EmploymentStatus, type LoanProduct, type LoanPurpose, type ValidationRules } from '@/lib/api/contracts';
import { hasApiProduct, mapEligibilityRequest, mapRateRequest, purposesFor } from '@/lib/api/mapLoan';
import { ageBand } from '@/lib/api/rulesSchema';
import { asksMaritalQuestion, asksSalaryQuestion, docsFor, LOAN_MAP } from '@/lib/loans';
import { basicsSchema, translateIssue, validate } from '@/lib/schemas';
import { makeReference, simulateSubmit, simulateUpload, validateFile } from '@/lib/upload';
import { cn, formatBytes, formatZAR } from '@/lib/utils';
import { useSim } from '@/state/SimulatorContext';
import { useLoanApi } from '@/state/loanApiStore';
import type { Flow } from './types';

const asStatus = (value: string): EmploymentStatus | null => EMPLOYMENT_STATUSES.find((item) => item === value) ?? null;
const asPurpose = (value: string): LoanPurpose | null => LOAN_PURPOSES.find((item) => item === value) ?? null;

function BasicsFields({ flow, rules, products }: { flow: Flow; rules: ValidationRules; products: LoanProduct[] }) {
  const { t } = useTranslation();
  const { state, update } = useSim();
  if (!state.loanType) return null;
  const cfg = LOAN_MAP[state.loanType];
  const askSalary = asksSalaryQuestion(cfg);
  const askMarital = asksMaritalQuestion(cfg);
  const purposes = purposesFor(state.loanType, products);
  const { age, confirmed, salaryIntoCapitec, married, employmentStatus, employmentDuration, creditScore, loanPurpose } = state.elig;
  const errors = validate(basicsSchema(cfg, { askSalary, askMarital }, rules, purposes), {
    age, confirmed, salaryIntoCapitec, married, employmentStatus, employmentDuration, creditScore, loanPurpose,
  });
  const patch = (p: Partial<typeof state.elig>) => update((s) => ({ ...s, elig: { ...s.elig, ...p } }));
  const toggle = (id: string, on: boolean) => patch({ confirmed: on ? Array.from(new Set([...confirmed, id])) : confirmed.filter((c) => c !== id) });
  const err = (key: string) => (errors[key] ? translateIssue(t, errors[key]) : undefined);
  const { min: ageMin, max: ageMax } = ageBand(rules);

  return (
    <StepShell title={t('elig.basics.title')} description={t('elig.basics.desc', { loan: t(`loans.${cfg.id}.name`).toLowerCase() })} onBack={flow.back} onNext={flow.next} nextDisabled={Object.keys(errors).length > 0}>
      <NumberField
        id="age" label={t('fields.age')} prefix="" suffix={t('common.years')} placeholder="30"
        hint={t('fields.ageHintBand', { min: ageMin, max: ageMax })}
        value={age} onChange={(v) => patch({ age: v })} error={err('age')}
      />
      <SelectField
        id="employmentStatus"
        label={t('fields.employmentStatus')}
        placeholder={t('common.choose')}
        hint={rules.personalInfo.employmentStatus.errorMessage}
        value={employmentStatus}
        options={rules.personalInfo.employmentStatus.options.map((value) => ({ value, label: t(`employment.${value}`, { defaultValue: value }) }))}
        onChange={(value) => patch({ employmentStatus: asStatus(value) })}
        error={err('employmentStatus')}
      />
      <NumberField
        id="employmentDuration" label={t('fields.employmentDuration')} prefix="" suffix={t('fields.months')} placeholder="12"
        hint={rules.personalInfo.employmentDuration.errorMessage}
        value={employmentDuration} onChange={(v) => patch({ employmentDuration: v })} error={err('employmentDuration')}
      />
      <NumberField
        id="creditScore" label={`${t('fields.creditScore')} (${t('common.optional')})`} prefix="" placeholder="650"
        hint={rules.financialInfo.creditScore.errorMessage}
        value={creditScore} onChange={(v) => patch({ creditScore: v })} error={err('creditScore')}
      />
      {purposes.length > 0 && (
        <SelectField
          id="loanPurpose"
          label={t('fields.loanPurpose')}
          placeholder={t('common.choose')}
          hint={t('v.purpose')}
          value={loanPurpose}
          options={purposes.map((value) => ({ value, label: t(`purpose.${value}`, { defaultValue: value }) }))}
          onChange={(value) => patch({ loanPurpose: asPurpose(value) })}
          error={err('loanPurpose')}
        />
      )}
      {askSalary && <YesNo id="salaryIntoCapitec" label={t('elig.basics.salary')} value={salaryIntoCapitec} onChange={(v) => patch({ salaryIntoCapitec: v })} />}
      {askMarital && <YesNo id="married" label={t('elig.basics.married')} value={married} onChange={(v) => patch({ married: v })} />}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold">{t('elig.basics.confirm')}</legend>
        {cfg.requirements.map((r) => (
          <div key={r} className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox id={`req-${r}`} checked={confirmed.includes(r)} onCheckedChange={(c) => toggle(r, c === true)} />
            <label htmlFor={`req-${r}`} className="cursor-pointer text-sm leading-6">{t(`req.${r}`)}</label>
          </div>
        ))}
      </fieldset>
      <p className="text-xs text-muted-foreground">{t('elig.basics.note')}</p>
    </StepShell>
  );
}

export function BasicsStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  const { state } = useSim();
  if (!state.loanType) return null;
  return (
    <RulesGate title={t('elig.basics.title')} description={t('elig.basics.desc', { loan: t(`loans.${state.loanType}.name`).toLowerCase() })} onBack={flow.back}>
      {(rules, products) => <BasicsFields flow={flow} rules={rules} products={products} />}
    </RulesGate>
  );
}

export function DecisionStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  const { state } = useSim();
  const runDecision = useLoanApi((s) => s.runDecision);
  const status = useLoanApi((s) => s.decisionStatus);
  const eligibility = useLoanApi((s) => s.eligibility);
  const rate = useLoanApi((s) => s.rate);
  const decisionError = useLoanApi((s) => s.decisionError);

  useEffect(() => {
    const request = mapEligibilityRequest(state);
    const rateRequest = mapRateRequest(state);
    if (!request || !rateRequest) return;
    void runDecision(request, rateRequest);
  }, [state, runDecision]);

  const ready = status === 'ready' && eligibility && rate;
  const eligible = !!eligibility?.eligibilityResult.isEligible;
  const retry = () => {
    const request = mapEligibilityRequest(state);
    const rateRequest = mapRateRequest(state);
    if (request && rateRequest) void runDecision(request, rateRequest);
  };

  return (
    <StepShell
      title={t('elig.decision.title')}
      description={t('elig.decision.desc')}
      onBack={flow.back}
      onNext={status === 'error' ? retry : flow.next}
      nextLabel={status === 'error' ? t('flow.retry') : undefined}
      nextDisabled={status === 'loading' || (status !== 'error' && (!ready || !eligible))}
      busy={status === 'loading'}
    >
      {status === 'loading' && (
        <p role="status" className="flex items-center gap-2 font-semibold"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{t('elig.decision.loading')}</p>
      )}
      {status === 'error' && <p role="alert" className="text-sm font-medium text-accent">{decisionError || t('elig.decision.error')}</p>}
      {ready && (
        <div className="space-y-4" data-testid="eligibility-decision" data-eligible={String(eligible)}>
          <div className={cn('rounded-lg border p-4', eligible ? 'border-success/40 bg-success/10' : 'border-accent/40 bg-accent/10')} role="status">
            <p className="font-bold">{eligible ? t('elig.decision.eligibleTitle') : t('elig.decision.ineligibleTitle')}</p>
            <p className="mt-1 text-sm">{eligibility.eligibilityResult.decisionReason}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.decision.likelihood')}</dt><dd className="font-bold" data-testid="approval-likelihood">{eligibility.eligibilityResult.approvalLikelihood}%</dd></div>
            <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.decision.risk')}</dt><dd className="font-bold">{t(`elig.decision.riskLabel.${eligibility.eligibilityResult.riskCategory}`)}</dd></div>
            <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.decision.recommended')}</dt><dd className="font-bold">{formatZAR(eligibility.recommendedLoan.recommendedAmount)}</dd></div>
            <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.decision.max')}</dt><dd className="font-bold">{formatZAR(eligibility.recommendedLoan.maxAmount)}</dd></div>
            <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.decision.rate')}</dt><dd className="font-bold">{rate.interestRate}%</dd></div>
            <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.decision.instalment')}</dt><dd className="font-bold" data-testid="api-instalment">{formatZAR(rate.monthlyPayment, true)}</dd></div>
            <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.decision.total')}</dt><dd className="font-bold">{formatZAR(rate.totalRepayment, true)}</dd></div>
            <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.decision.score')}</dt><dd className="font-bold">{t(`elig.decision.scoreLabel.${eligibility.affordabilityAnalysis.affordabilityScore}`)}</dd></div>
            <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.decision.disposable')}</dt><dd className="font-bold">{formatZAR(eligibility.affordabilityAnalysis.disposableIncome)}</dd></div>
            <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.decision.dti')}</dt><dd className="font-bold">{eligibility.affordabilityAnalysis.debtToIncomeRatio}%</dd></div>
          </dl>
          <div className="max-h-80 overflow-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <caption className="px-3 py-2 text-left font-semibold">{t('elig.decision.schedule')}</caption>
              <thead className="sticky top-0 bg-card text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">{t('elig.decision.month')}</th>
                  <th className="px-3 py-2 font-semibold">{t('elig.decision.payment')}</th>
                  <th className="px-3 py-2 font-semibold">{t('elig.decision.principal')}</th>
                  <th className="px-3 py-2 font-semibold">{t('elig.decision.interest')}</th>
                  <th className="px-3 py-2 font-semibold">{t('elig.decision.balance')}</th>
                </tr>
              </thead>
              <tbody>
                {rate.paymentSchedule.map((row) => (
                  <tr key={row.month} className="border-t">
                    <td className="px-3 py-2">{row.month}</td>
                    <td className="px-3 py-2">{formatZAR(row.payment, true)}</td>
                    <td className="px-3 py-2">{formatZAR(row.principal, true)}</td>
                    <td className="px-3 py-2">{formatZAR(row.interest, true)}</td>
                    <td className="px-3 py-2">{formatZAR(row.balance, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </StepShell>
  );
}

export function DocumentStep({ docId, position, total, flow }: { docId: string; position: number; total: number; flow: Flow }) {
  const { t } = useTranslation();
  const { state, update } = useSim();
  const cfg = state.loanType ? LOAN_MAP[state.loanType] : null;
  const def = cfg?.docs.find((d) => d.id === docId);
  const optional = !!def?.optional;
  const doc = state.elig.docs[docId];
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = progress !== null;

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    const invalid = validateFile(file);
    if (invalid) { toast.error(t(invalid), { description: file.name }); return; }
    setProgress(0);
    try {
      const meta = await simulateUpload(file, setProgress);
      update((s) => ({ ...s, elig: { ...s.elig, docs: { ...s.elig.docs, [docId]: meta } } }));
      toast.success(t('toast.uploaded'), { description: file.name });
    } catch {
      toast.error(t('toast.uploadFailed'), { description: file.name });
    } finally {
      setProgress(null);
    }
  }

  const remove = () => {
    update((s) => { const { [docId]: _gone, ...rest } = s.elig.docs; return { ...s, elig: { ...s.elig, docs: rest } }; });
    toast.info(t('toast.removed'));
  };

  return (
    <StepShell
      title={t(`docs.${docId}.name`)}
      description={t(`docs.${docId}.hint`)}
      onBack={flow.back}
      onNext={flow.next}
      nextLabel={optional && !doc ? t('common.skip') : undefined}
      nextDisabled={!doc && !optional}
      busy={uploading}
    >
      <p className="text-sm font-semibold text-primary">{t('docs.counter', { n: position, m: total })}{optional ? ` · ${t('common.optional')}` : ''}</p>

      {!doc && !uploading && (
        <label
          htmlFor={`file-${docId}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFile(e.dataTransfer.files?.[0]); }}
          className={cn('flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-secondary',
            dragging ? 'border-primary bg-secondary' : 'border-input')}
        >
          <UploadCloud className="h-10 w-10 text-primary" aria-hidden />
          <span className="font-semibold">{t('upload.cta')}</span>
          <span className="text-sm text-muted-foreground">{t('upload.rules')}</span>
        </label>
      )}

      <input
        ref={inputRef}
        id={`file-${docId}`}
        data-testid="file-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="sr-only"
        disabled={uploading}
        onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />

      {uploading && (
        <div className="space-y-2 rounded-lg border p-4" role="status" aria-live="polite">
          <div className="flex items-center gap-2 text-sm font-semibold"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{t('upload.uploading')} {progress}%</div>
          <Progress value={progress} aria-label={t('upload.uploading')} />
        </div>
      )}

      {doc && !uploading && (
        <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 p-4" data-testid="uploaded-file">
          <FileText className="h-8 w-8 shrink-0 text-success" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{doc.name}</p>
            <p className="text-sm text-muted-foreground">{formatBytes(doc.size)} · {t('upload.done')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}><RefreshCw className="h-4 w-4" aria-hidden />{t('upload.replace')}</Button>
          <Button variant="ghost" size="sm" onClick={remove} aria-label={t('upload.remove')}><Trash2 className="h-4 w-4" aria-hidden /></Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t('upload.simulated')}</p>
    </StepShell>
  );
}

export function ReviewStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  const { state, update } = useSim();
  const decision = useLoanApi((s) => s.eligibility);
  const rate = useLoanApi((s) => s.rate);
  const [busy, setBusy] = useState(false);
  if (!state.loanType) return null;
  const cfg = LOAN_MAP[state.loanType];
  const docs = docsFor(cfg, { ...state.elig, amount: state.loan.amount });
  const missing = docs.filter((d) => !d.optional && !state.elig.docs[d.id]);

  async function submit() {
    setBusy(true);
    try {
      await simulateSubmit();
      update((s) => ({ ...s, phase: 'submitted', step: 0, submission: { reference: makeReference(), at: new Date().toISOString() } }));
      toast.success(t('toast.submitted'));
    } catch {
      toast.error(t('toast.submitFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <StepShell title={t('elig.review.title')} description={t('elig.review.desc')} onBack={flow.back} onNext={submit} nextLabel={t('elig.review.submit')} nextVariant="accent" nextDisabled={missing.length > 0} busy={busy}>
      {decision && (
        <div className="rounded-lg border p-3 text-sm" data-testid="review-decision">
          <p className="font-semibold">{decision.eligibilityResult.isEligible ? t('elig.decision.eligibleTitle') : t('elig.decision.ineligibleTitle')}</p>
          <p className="text-muted-foreground">{decision.eligibilityResult.decisionReason}</p>
        </div>
      )}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.review.loan')}</dt><dd className="font-bold">{t(`loans.${cfg.id}.name`)}</dd></div>
        <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.review.amount')}</dt><dd className="font-bold">{formatZAR(state.loan.amount ?? 0)}</dd></div>
        <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.review.term')}</dt><dd className="font-bold">{t('fields.termValue', { months: state.loan.months ?? 0 })}</dd></div>
        <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('results.instalment')}</dt><dd className="font-bold" data-testid="review-instalment">{rate ? formatZAR(rate.monthlyPayment, true) : '–'}</dd></div>
      </dl>
      {docs.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">{t('elig.review.empty')}</p>
      ) : (
        <ul className="space-y-2" aria-label={t('elig.review.docs')}>
          {docs.map((d) => {
            const up = state.elig.docs[d.id];
            const idx = (hasApiProduct(state.loanType) ? 2 : 1) + docs.findIndex((x) => x.id === d.id);
            return (
              <li key={d.id} className="flex items-center gap-3 rounded-lg border p-3">
                {up ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />}
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{t(`docs.${d.id}.name`)}</span>
                  <span className="block truncate text-sm text-muted-foreground">{up ? up.name : d.optional ? t('elig.review.skipped') : t('elig.review.missing')}</span>
                </span>
                {!up && !d.optional && <Button size="sm" variant="outline" onClick={() => flow.goTo(idx)}>{t('elig.review.add')}</Button>}
              </li>
            );
          })}
        </ul>
      )}
    </StepShell>
  );
}
