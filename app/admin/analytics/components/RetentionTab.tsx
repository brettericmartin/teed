'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RetentionTabProps {
  dateRange: '7d' | '30d' | '90d';
}

interface ActiveUserMetric {
  metric_date: string;
  dau: number;
  wau: number;
  mau: number;
}

interface CohortRow {
  cohort_week: string;
  week_number: number;
  cohort_size: number;
  retained_users: number;
  retention_rate: number;
}

interface HealthSegment {
  segment: string;
  user_count: number;
  percentage: number;
}

interface RetentionData {
  activeUsers: ActiveUserMetric[];
  cohortRetention: CohortRow[];
  healthSegments: HealthSegment[];
  stickiness: number;
}

const SEGMENT_COLORS: Record<string, string> = {
  power: '#10B981',
  regular: '#3B82F6',
  casual: '#F59E0B',
  dormant: '#F97316',
  churned: '#EF4444',
};

const SEGMENT_LABELS: Record<string, string> = {
  power: 'Power (24h)',
  regular: 'Regular (7d)',
  casual: 'Casual (30d)',
  dormant: 'Dormant (30-90d)',
  churned: 'Churned (90d+)',
};

export default function RetentionTab({ dateRange }: RetentionTabProps) {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics/retention?range=${dateRange}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500 text-center py-8">No retention data available</p>;
  }

  // Build cohort grid: rows = cohort weeks, columns = week numbers
  const cohortWeeks = [...new Set(data.cohortRetention.map(r => r.cohort_week))].sort();
  const maxWeekNumber = Math.max(0, ...data.cohortRetention.map(r => r.week_number));
  const cohortGrid = cohortWeeks.map(week => {
    const rows = data.cohortRetention.filter(r => r.cohort_week === week);
    const size = rows[0]?.cohort_size || 0;
    const cells: (number | null)[] = [];
    for (let w = 0; w <= maxWeekNumber; w++) {
      const row = rows.find(r => r.week_number === w);
      cells.push(row ? row.retention_rate : null);
    }
    return { week, size, cells };
  });

  // Format active users for chart — only show every Nth date to avoid clutter
  const activeUsersChart = (data.activeUsers || []).map(m => ({
    date: m.metric_date?.split('T')[0]?.slice(5) || m.metric_date,
    DAU: m.dau,
    WAU: m.wau,
    MAU: m.mau,
  }));

  return (
    <div className="space-y-8">
      {/* Stickiness KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">DAU/MAU Stickiness</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {Math.round(data.stickiness * 100)}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Latest DAU / WAU / MAU</p>
          {activeUsersChart.length > 0 ? (
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {activeUsersChart[activeUsersChart.length - 1].DAU} / {activeUsersChart[activeUsersChart.length - 1].WAU} / {activeUsersChart[activeUsersChart.length - 1].MAU}
            </p>
          ) : (
            <p className="text-gray-400 mt-1">No data</p>
          )}
        </div>
      </div>

      {/* DAU/WAU/MAU Chart */}
      {activeUsersChart.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Users Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeUsersChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="DAU" stroke="#EF4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="WAU" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="MAU" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* User Health Segments */}
      {data.healthSegments && data.healthSegments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Health Segments</h3>
          <div className="space-y-3">
            {data.healthSegments.map(seg => (
              <div key={seg.segment} className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {SEGMENT_LABELS[seg.segment] || seg.segment}
                </div>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(seg.percentage, 2)}%`,
                      backgroundColor: SEGMENT_COLORS[seg.segment] || '#6B7280',
                    }}
                  />
                </div>
                <div className="w-20 text-right text-sm text-gray-600 dark:text-gray-400">
                  {seg.user_count} ({seg.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cohort Retention Grid */}
      {cohortGrid.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Cohort Retention</h3>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 text-gray-500 dark:text-gray-400">Cohort</th>
                  <th className="text-center p-2 text-gray-500 dark:text-gray-400">Size</th>
                  {Array.from({ length: maxWeekNumber + 1 }, (_, i) => (
                    <th key={i} className="text-center p-2 text-gray-500 dark:text-gray-400">W{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortGrid.map(row => (
                  <tr key={row.week}>
                    <td className="p-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {row.week?.split('T')[0]?.slice(5) || row.week}
                    </td>
                    <td className="p-2 text-center text-gray-700 dark:text-gray-300">{row.size}</td>
                    {row.cells.map((rate, i) => (
                      <td
                        key={i}
                        className="p-2 text-center font-medium"
                        style={{
                          backgroundColor: rate !== null
                            ? `rgba(59, 130, 246, ${Math.max(rate / 100, 0.05)})`
                            : 'transparent',
                          color: rate !== null ? (rate > 50 ? 'white' : '#1F2937') : '#9CA3AF',
                        }}
                      >
                        {rate !== null ? `${rate}%` : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
