import { useRef, useState, useEffect } from 'react';

export default function EventCardAnimationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlaySize, setOverlaySize] = useState<number>(0);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        const max = Math.max(offsetWidth, offsetHeight);
        const requiredSize = Math.ceil(max * 1.42);
        setOverlaySize(requiredSize);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="p-1 rounded-2xl shadow-md relative overflow-hidden"
    >
      {overlaySize > 0 && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-emerald-500 via-gray-900 to-gray-900 -z-10 animate-slow-spin"
          style={{
            width: `${overlaySize}px`,
            height: `${overlaySize}px`,
          }}
        />
      )}
      {children}
    </div>
  );
}
