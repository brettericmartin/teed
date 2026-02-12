'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GrowthFunnelTabProps {
  dateRange: '7d' | '30d' | '90d';
}

interface FunnelStage {
  stage: string;
  user_count: number;
}

interface GrowthData {
  activationFunnel: FunnelStage[];
  betaPipeline: { stage: string; count: number }[];
  dailySignups: { date: string; count: number }[];
}

const STAGE_LABELS: Record<string, string> = {
  signed_up: 'Signed Up',
  created_bag: 'Created Bag',
  added_item: 'Added Item',
  made_public: 'Made Public',
  got_view: 'Got First View',
};

export default function GrowthFunnelTab({ dateRange }: GrowthFunnelTabProps) {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics/growth?range=${dateRange}`)
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
    return <p className="text-gray-500 text-center py-8">No growth data available</p>;
  }

  const funnelData = (data.activationFunnel || []).map(s => ({
    name: STAGE_LABELS[s.stage] || s.stage,
    users: s.user_count,
  }));

  // Calculate conversion rates between stages
  const conversions = funnelData.map((stage, i) => {
    if (i === 0 || funnelData[i - 1].users === 0) return { ...stage, rate: 100 };
    return { ...stage, rate: Math.round((stage.users / funnelData[0].users) * 100) };
  });

  return (
    <div className="space-y-8">
      {/* Activation Funnel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activation Funnel</h3>

        {funnelData.length > 0 ? (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [value, 'Users']} />
                  <Bar dataKey="users" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Funnel steps with conversion rates */}
            <div className="mt-6 space-y-2">
              {conversions.map((stage, i) => (
                <div key={stage.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stage.users}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{stage.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">No funnel data yet</p>
        )}
      </div>

      {/* Beta Pipeline */}
      {data.betaPipeline && data.betaPipeline.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Beta Application Pipeline</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.betaPipeline.map((stage) => (
              <div key={stage.stage} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stage.count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{stage.stage.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Signups */}
      {data.dailySignups && data.dailySignups.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily New Users</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailySignups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
