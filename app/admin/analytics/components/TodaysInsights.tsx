'use client';

interface InsightMetrics {
  bagViews: number;
  linkClicks: number;
  discoveryVisits: number;
  uniqueVisitors: number;
}

interface TodaysInsightsProps {
  current: InsightMetrics;
  previous: InsightMetrics;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) {
    return <span className="text-xs text-gray-400">--</span>;
  }
  if (previous === 0) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-green-600 dark:text-green-400">
        <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        New
      </span>
    );
  }

  const pct = ((current - previous) / previous) * 100;
  const isUp = pct >= 0;

  return (
    <span className={`inline-flex items-center text-xs font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
      {isUp ? (
        <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      ) : (
        <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
      )}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

const CARDS: { key: keyof InsightMetrics; label: string; color: string }[] = [
  { key: 'bagViews', label: 'Bag Views', color: 'from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800' },
  { key: 'linkClicks', label: 'Link Clicks', color: 'from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800' },
  { key: 'discoveryVisits', label: 'Discovery Visits', color: 'from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800' },
  { key: 'uniqueVisitors', label: 'Unique Visitors', color: 'from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800' },
];

const VALUE_COLORS: Record<string, string> = {
  bagViews: 'text-blue-600 dark:text-blue-400',
  linkClicks: 'text-green-600 dark:text-green-400',
  discoveryVisits: 'text-purple-600 dark:text-purple-400',
  uniqueVisitors: 'text-amber-600 dark:text-amber-400',
};

export default function TodaysInsights({ current, previous }: TodaysInsightsProps) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Today&apos;s Insights
        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">vs previous 24h</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CARDS.map(({ key, label, color }) => (
          <div
            key={key}
            className={`bg-gradient-to-br ${color} rounded-lg border p-4`}
          >
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${VALUE_COLORS[key]}`}>
              {formatNumber(current[key])}
            </p>
            <div className="mt-1">
              <DeltaBadge current={current[key]} previous={previous[key]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
