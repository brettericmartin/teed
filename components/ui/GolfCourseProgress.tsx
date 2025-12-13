'use client';

interface GolfCourseProgressProps {
  current: number;
  total: number;
  className?: string;
}

/**
 * Golf-themed progress bar showing a ball moving along a fairway toward a flag.
 * Used during bulk link import to show overall completion progress.
 */
export function GolfCourseProgress({ current, total, className = '' }: GolfCourseProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const isComplete = current >= total && total > 0;

  return (
    <div className={`relative h-10 ${className}`}>
      {/* Fairway track */}
      <div className="absolute inset-y-2 left-0 right-8 bg-[var(--teed-green-3)] rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className="h-full bg-gradient-to-r from-[var(--teed-green-6)] to-[var(--teed-green-8)] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />

        {/* Subtle grass texture lines */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 w-0.5 h-2 bg-[var(--teed-green-11)] -translate-y-1/2"
              style={{ left: `${(i + 1) * 11}%` }}
            />
          ))}
        </div>
      </div>

      {/* Golf ball moving along the track */}
      <div
        className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-10"
        style={{ left: `calc(${Math.min(Math.max(percentage, 3), 92)}% - 12px)` }}
      >
        <div
          className={`w-6 h-6 rounded-full bg-white shadow-md border-2 ${
            isComplete ? 'border-[var(--teed-green-9)]' : 'border-gray-300'
          } flex items-center justify-center ${
            !isComplete && percentage > 0 ? 'animate-ball-roll-progress' : ''
          }`}
        >
          {/* Dimple pattern */}
          <div className="relative w-4 h-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-200" />
            <div className="absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full bg-gray-200" />
            <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Flag at the end */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
        <div className="relative">
          {/* Flagpole */}
          <div className="w-0.5 h-7 bg-gray-600 rounded-full" />
          {/* Flag */}
          <div
            className={`absolute -top-0.5 left-0.5 w-5 h-3 ${
              isComplete
                ? 'bg-[var(--teed-green-9)]'
                : 'bg-red-500'
            } transition-colors duration-300`}
            style={{
              clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
            }}
          />
          {/* Hole */}
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-1 bg-gray-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default GolfCourseProgress;
