import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Footer, Header } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { SimulatorProvider } from '@/state/SimulatorContext';

const Landing = lazy(() => import('@/pages/Landing'));
const Simulator = lazy(() => import('@/pages/Simulator'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function PageSkeleton() {
  return (
    <div className="container space-y-4 py-16" role="status" aria-busy="true">
      <Skeleton className="h-10 w-2/3" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  return (
    <SimulatorProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow">{t('nav.skip')}</a>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="main" className="flex-1">
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/simulator" element={<Simulator />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
      <Toaster position="top-center" richColors closeButton toastOptions={{ duration: 4000 }} />
    </SimulatorProvider>
  );
}
