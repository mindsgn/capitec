import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextVariant?: 'default' | 'accent';
  busy?: boolean;
  showHint?: boolean;
}

/** Common frame for every step: title, content, and Back/Continue. Continue is greyed out until the step is valid. */
export function StepShell({ title, description, children, onBack, onNext, nextLabel, nextDisabled, nextVariant, busy, showHint = true }: Props) {
  const { t } = useTranslation();
  const disabled = !!nextDisabled || !!busy;
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle tabIndex={-1} data-step-title className="focus:outline-none">{title}</CardTitle>
        {description && <CardDescription className="text-base">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
      {onNext && (
        <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          {onBack ? (
            <Button variant="ghost" onClick={onBack} disabled={busy} className="order-2 sm:order-1"><ArrowLeft className="h-4 w-4" aria-hidden />{t('common.back')}</Button>
          ) : <span />}
          <div className="order-1 flex flex-col items-stretch gap-1 sm:order-2 sm:items-end">
            <Button variant={nextVariant} size="lg" onClick={onNext} disabled={disabled} aria-disabled={disabled}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {nextLabel ?? t('common.continue')}
              {!busy && <ArrowRight className="h-4 w-4" aria-hidden />}
            </Button>
            {showHint && nextDisabled && !busy && <p className="text-center text-xs text-muted-foreground sm:text-right" role="status">{t('common.fillRequired')}</p>}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
