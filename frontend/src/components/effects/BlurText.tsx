import { motion, useReducedMotion } from 'motion/react';

/** Word-by-word blur-in headline, modelled on React Bits "Blur Text". */
export function BlurText({ text, className, delay = 0.06 }: { text: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="mr-[0.25em] inline-block"
          initial={reduce ? false : { opacity: 0, filter: 'blur(10px)', y: 12 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ delay: i * delay, duration: 0.5, ease: 'easeOut' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
