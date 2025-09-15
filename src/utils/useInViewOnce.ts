import { useEffect, useRef, useState } from 'react';

export function useInViewOnce(rootMargin = '600px') {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!ref.current || shown) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [shown, rootMargin]);

  return { ref, shown };
}
