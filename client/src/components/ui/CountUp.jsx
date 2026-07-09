import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export default function CountUp({ end, duration = 2, className = '' }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const animation = animate(count, end, { duration });
    return animation.stop;
  }, [end, duration, count]);

  useEffect(() => {
    return rounded.on('change', (latest) => {
      setDisplay(latest);
    });
  }, [rounded]);

  return <motion.span className={className}>{display}</motion.span>;
}
