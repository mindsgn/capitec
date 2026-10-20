import { Component, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearState } from '@/lib/storage';

class Boundary extends Component<WithTranslation & { children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.error(err); }
  render() {
    const { t } = this.props;
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-accent" aria-hidden />
        <h1 className="text-2xl font-bold">{t('error.title')}</h1>
        <p className="text-muted-foreground">{t('error.body')}</p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()}>{t('error.reload')}</Button>
          <Button variant="outline" onClick={() => { clearState(); window.location.assign('/'); }}>{t('error.reset')}</Button>
        </div>
      </div>
    );
  }
}
export const ErrorBoundary = withTranslation()(Boundary);
