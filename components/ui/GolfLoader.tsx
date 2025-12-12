'use client';

interface GolfLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'roll' | 'bounce';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: { ball: 16, tee: { width: 12, height: 10 } },
  md: { ball: 24, tee: { width: 14, height: 12 } },
  lg: { ball: 32, tee: { width: 18, height: 16 } },
  xl: { ball: 48, tee: { width: 24, height: 20 } },
};

export function GolfLoader({
  size = 'md',
  variant = 'roll',
  className = '',
  label = 'Loading'
}: GolfLoaderProps) {
  const dimensions = sizeMap[size];
  const dimpleSize = Math.max(2, Math.floor(dimensions.ball * 0.12));

  if (variant === 'roll') {
    // Simple rolling ball - replaces circular spinners
    return (
      <div
        role="status"
        aria-label={label}
        className={`inline-flex items-center justify-center ${className}`}
      >
        <div
          style={{
            width: dimensions.ball,
            height: dimensions.ball,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, white, var(--grey-3))',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            position: 'relative',
            animation: 'ball-roll-simple 0.8s linear infinite',
          }}
        >
          {/* Dimples to show rotation */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: dimpleSize,
            height: dimpleSize,
            borderRadius: '50%',
            background: 'var(--grey-4)',
          }} />
          <div style={{
            position: 'absolute',
            top: '45%',
            left: '65%',
            width: dimpleSize,
            height: dimpleSize,
            borderRadius: '50%',
            background: 'var(--grey-4)',
          }} />
          <div style={{
            position: 'absolute',
            top: '70%',
            left: '35%',
            width: dimpleSize,
            height: dimpleSize,
            borderRadius: '50%',
            background: 'var(--grey-4)',
          }} />
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // Bounce variant - ball bouncing on tee for multi-step processes
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex items-end justify-center ${className}`}
      style={{ height: dimensions.ball + dimensions.tee.height + 4 }}
    >
      <div style={{ position: 'relative' }}>
        {/* Tee */}
        <div style={{
          width: dimensions.tee.width,
          height: dimensions.tee.height,
          background: 'var(--sand-9)',
          clipPath: 'polygon(0% 0%, 100% 0%, 75% 50%, 65% 100%, 35% 100%, 25% 50%)',
        }} />
        {/* Ball bouncing */}
        <div
          style={{
            position: 'absolute',
            bottom: dimensions.tee.height - 2,
            left: '50%',
            width: dimensions.ball * 0.7,
            height: dimensions.ball * 0.7,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, white, var(--grey-3))',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            animation: 'ball-bounce-settle 1.5s ease-out infinite',
          }}
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default GolfLoader;
