import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CheckCircle2, Circle, FileText, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { NumberField } from '@/components/NumberField';
import { StepShell } from '@/components/StepShell';
import { YesNo } from '@/components/YesNo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { simulateLoan } from '@/lib/calc';
import { asksMaritalQuestion, asksSalaryQuestion, docsFor, LOAN_MAP } from '@/lib/loans';
import { basicsSchema, translateIssue, validate } from '@/lib/schemas';
import { makeReference, simulateSubmit, simulateUpload, validateFile } from '@/lib/upload';
import { cn, formatBytes, formatZAR } from '@/lib/utils';
import { useSim } from '@/state/SimulatorContext';
import type { Flow } from './types';

export function BasicsStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation();
  const { state, update } = useSim();
  if (!state.loanType) return null;
  const cfg = LOAN_MAP[state.loanType];
  const askSalary = asksSalaryQuestion(cfg);
  const askMarital = asksMaritalQuestion(cfg);
  const { age, confirmed, salaryIntoCapitec, married } = state.elig;
  const errors = validate(basicsSchema(cfg, { askSalary, askMarital }), { age, confirmed, salaryIntoCapitec, married });
  const patch = (p: Partial<typeof state.elig>) => update((s) => ({ ...s, elig: { ...s.elig, ...p } }));
  const toggle = (id: string, on: boolean) => patch({ confirmed: on ? Array.from(new Set([...confirmed, id])) : confirmed.filter((c) => c !== id) });

  return (
    <StepShell title={t('elig.basics.title')} description={t('elig.basics.desc', { loan: t(`loans.${cfg.id}.name`).toLowerCase() })} onBack={flow.back} onNext={flow.next} nextDisabled={Object.keys(errors).length > 0}>
      <NumberField
        id="age" label={t('fields.age')} prefix="" suffix={t('common.years')} placeholder="30"
        hint={cfg.maxAge < 100 ? t('fields.ageHintBand', { min: cfg.minAge, max: cfg.maxAge }) : t('fields.ageHintMin', { min: cfg.minAge })}
        value={age} onChange={(v) => patch({ age: v })} error={errors.age ? translateIssue(t, errors.age) : undefined}
      />
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
  const [busy, setBusy] = useState(false);
  if (!state.loanType) return null;
  const cfg = LOAN_MAP[state.loanType];
  const docs = docsFor(cfg, { ...state.elig, amount: state.loan.amount });
  const missing = docs.filter((d) => !d.optional && !state.elig.docs[d.id]);
  const quote = state.loan.amount && state.loan.months ? simulateLoan({ amount: state.loan.amount, months: state.loan.months, ratePct: cfg.rate }) : null;

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
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.review.loan')}</dt><dd className="font-bold">{t(`loans.${cfg.id}.name`)}</dd></div>
        <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.review.amount')}</dt><dd className="font-bold">{formatZAR(state.loan.amount ?? 0)}</dd></div>
        <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('elig.review.term')}</dt><dd className="font-bold">{t('fields.termValue', { months: state.loan.months ?? 0 })}</dd></div>
        <div className="rounded-lg border p-3"><dt className="text-muted-foreground">{t('results.instalment')}</dt><dd className="font-bold">{quote ? formatZAR(quote.instalment) : '–'}</dd></div>
      </dl>
      {docs.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">{t('elig.review.empty')}</p>
      ) : (
        <ul className="space-y-2" aria-label={t('elig.review.docs')}>
          {docs.map((d) => {
            const up = state.elig.docs[d.id];
            const idx = docs.findIndex((x) => x.id === d.id) + 1;
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
