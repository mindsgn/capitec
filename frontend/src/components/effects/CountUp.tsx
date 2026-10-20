import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';

/** Count-up number, modelled on the React Bits "Count Up" component. */
export function CountUp({ value, format = (n) => Math.round(n).toString(), duration = 0.9, className }: {
  value: number; format?: (n: number) => string; duration?: number; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) { node.textContent = format(value); prev.current = value; return; }
    const controls = animate(prev.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => { prev.current = v; node.textContent = format(v); },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return <span ref={ref} className={className}>{format(value)}</span>;
}
