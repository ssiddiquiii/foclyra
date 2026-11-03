'use client';

import React, { useRef } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';

export function GradualSpacing({
  text = 'Gradual Spacing',
  className = '',
  delayMultiple = 0.06,
  duration = 0.6,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={`flex space-x-1 justify-center ${className}`}>
      <AnimatePresence>
        {text.split('').map((char, i) => (
          <motion.span
            key={i}
            initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            exit="hidden"
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration, delay: i * delayMultiple, ease: [0.2, 0.65, 0.3, 0.9] }
            }
            className="inline-block"
          >
            {char === ' ' ? <span>&nbsp;</span> : char}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default GradualSpacing;

