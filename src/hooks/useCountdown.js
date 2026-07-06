import { useEffect, useState, useRef } from 'react';

/**
 * Returns a countdown string "Xh Ym" or "Xm Ys" until the given "HH:MM" time today.
 * If the time has already passed today, it counts to tomorrow's occurrence.
 */
export function useCountdown(timeTarget) {
  const [label, setLabel] = useState('');
  const interval = useRef(null);

  useEffect(() => {
    if (!timeTarget) {
      setLabel('');
      return;
    }

    const tick = () => {
      const now = new Date();
      let target;

      if (timeTarget instanceof Date) {
        target = timeTarget;
      } else if (typeof timeTarget === 'string' && timeTarget.includes(':')) {
        const [hour, minute] = timeTarget.split(':').map(Number);
        if (isNaN(hour) || isNaN(minute)) { setLabel(''); return; }
        target = new Date();
        target.setHours(hour, minute, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 1); // tomorrow
      } else {
        target = new Date(timeTarget);
      }

      if (isNaN(target.getTime())) { setLabel(''); return; }

      const diffMs = target - now;
      if (diffMs <= 0) {
        setLabel('Expired');
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      if (h > 0) setLabel(`${h}h ${m}m`);
      else if (m > 0) setLabel(`${m}m ${s}s`);
      else setLabel(`${s}s`);
    };

    tick();
    interval.current = setInterval(tick, 1000);
    return () => clearInterval(interval.current);
  }, [timeTarget]);

  return label;
}
