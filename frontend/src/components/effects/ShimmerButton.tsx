import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Common = { className?: string; children: React.ReactNode };
type AsLink = Common & { to: string; onClick?: never };
type AsButton = Common & { to?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>;

const base =
  'group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/** Shimmer call-to-action, modelled on Magic UI "Shimmer Button". Renders a router link when `to` is set. */
export function ShimmerButton(props: AsLink | AsButton) {
  const { className, children } = props;
  const inner = (
    <>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      <span aria-hidden className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent motion-reduce:hidden" />
    </>
  );
  if (props.to !== undefined) return <Link to={props.to} className={cn(base, className)}>{inner}</Link>;
  const { to: _to, className: _c, children: _ch, ...rest } = props as AsButton;
  return <button type="button" className={cn(base, className)} {...rest}>{inner}</button>;
}
