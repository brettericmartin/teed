'use client';

import { useState, useEffect } from 'react';

interface ContentPerformanceTabProps {
  dateRange: '7d' | '30d' | '90d';
}

interface PageStat {
  page: string;
  views: number;
  unique_sessions: number;
}

interface ContentData {
  pages: PageStat[];
}

export default function ContentPerformanceTab({ dateRange }: ContentPerformanceTabProps) {
  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics/content?range=${dateRange}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
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

  if (!data || !data.pages || data.pages.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No page view data yet. Page tracking events will appear here once instrumented pages are visited.
        </p>
      </div>
    );
  }

  const totalViews = data.pages.reduce((sum, p) => sum + p.views, 0);
  const totalSessions = data.pages.reduce((sum, p) => sum + p.unique_sessions, 0);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Page Views</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unique Sessions</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalSessions.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Tracked Pages</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.pages.length}</p>
        </div>
      </div>

      {/* Page Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Page Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Page</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Views</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Unique Sessions</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Views/Session</th>
              </tr>
            </thead>
            <tbody>
              {data.pages.map((page, i) => (
                <tr
                  key={page.page}
                  className={i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : ''}
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                    {page.page}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {page.views.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {page.unique_sessions.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {page.unique_sessions > 0 ? (page.views / page.unique_sessions).toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
