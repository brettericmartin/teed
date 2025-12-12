'use client';

import { useEffect, useState } from 'react';

interface GolfSuccessProps {
  size?: 'sm' | 'md' | 'lg';
  onComplete?: () => void;
  className?: string;
}

const sizeMap = {
  sm: { ball: 14, tee: { width: 10, height: 8 } },
  md: { ball: 18, tee: { width: 14, height: 12 } },
  lg: { ball: 24, tee: { width: 18, height: 16 } },
};

export function GolfSuccess({
  size = 'md',
  onComplete,
  className = ''
}: GolfSuccessProps) {
  const [phase, setPhase] = useState<'drop' | 'settle' | 'teeoff'>('drop');
  const dimensions = sizeMap[size];

  useEffect(() => {
    // Animation sequence: drop (0.35s) -> settle (0.3s) -> tee off (0.4s)
    const settleTimer = setTimeout(() => setPhase('settle'), 350);
    const teeoffTimer = setTimeout(() => setPhase('teeoff'), 650);
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 1050);

    return () => {
      clearTimeout(settleTimer);
      clearTimeout(teeoffTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      role="status"
      aria-label="Success"
      className={`inline-flex items-end justify-center overflow-hidden ${className}`}
      style={{
        height: dimensions.ball + dimensions.tee.height + 8,
        width: dimensions.ball + 40, // Extra width for tee-off trajectory
      }}
    >
      <div style={{ position: 'relative' }}>
        {/* Tee */}
        <div style={{
          width: dimensions.tee.width,
          height: dimensions.tee.height,
          background: 'var(--sand-9)',
          clipPath: 'polygon(0% 0%, 100% 0%, 75% 50%, 65% 100%, 35% 100%, 25% 50%)',
          animation: 'tee-fade-in 0.2s ease-out forwards',
        }} />
        {/* Ball */}
        <div
          style={{
            position: 'absolute',
            bottom: dimensions.tee.height - 2,
            left: '50%',
            width: dimensions.ball,
            height: dimensions.ball,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, white, var(--grey-3))',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            animation: phase === 'teeoff'
              ? 'ball-tee-off 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
              : 'ball-drop-precise 0.35s ease-out forwards',
            opacity: phase === 'drop' ? 0 : 1,
          }}
        />
      </div>
      <span className="sr-only">Success</span>
    </div>
  );
}

export default GolfSuccess;
