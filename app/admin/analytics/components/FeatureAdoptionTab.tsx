'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FeatureAdoptionTabProps {
  dateRange: '7d' | '30d' | '90d';
}

interface FeatureStat {
  feature: string;
  unique_users: number;
  total_events: number;
}

interface FeaturesData {
  features: FeatureStat[];
}

const FEATURE_LABELS: Record<string, string> = {
  bag_created: 'Create Bag',
  item_added: 'Add Item',
  search_performed: 'Search',
  bag_shared: 'Share Bag',
  bag_cloned: 'Clone Bag',
  item_copied_to_bag: 'Copy Item to Bag',
  paste_detected: 'Paste Detection',
  settings_saved: 'Save Settings',
  social_link_clicked: 'Social Link Click',
  bag_saved: 'Save/Bookmark Bag',
  bag_unsaved: 'Unsave Bag',
  user_followed: 'Follow User',
  user_unfollowed: 'Unfollow User',
  item_viewed: 'View Item Detail',
  profile_viewed: 'View Profile',
  cta_clicked: 'CTA Click',
  user_signed_up: 'Sign Up',
  user_logged_in: 'Log In',
  beta_applied: 'Beta Application',
  referral_shared: 'Referral Share',
};

export default function FeatureAdoptionTab({ dateRange }: FeatureAdoptionTabProps) {
  const [data, setData] = useState<FeaturesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics/features?range=${dateRange}`)
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

  if (!data || !data.features || data.features.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No feature adoption data yet. Events will appear here as users interact with features.
        </p>
      </div>
    );
  }

  const chartData = data.features.map(f => ({
    name: FEATURE_LABELS[f.feature] || f.feature.replace(/_/g, ' '),
    users: f.unique_users,
    events: f.total_events,
  }));

  return (
    <div className="space-y-8">
      {/* Feature Usage Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feature Usage (Unique Users)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number, name: string) => [value, name === 'users' ? 'Unique Users' : 'Total Events']} />
              <Bar dataKey="users" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Details Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feature Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Feature</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Unique Users</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Total Events</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Events/User</th>
              </tr>
            </thead>
            <tbody>
              {data.features.map((f, i) => (
                <tr
                  key={f.feature}
                  className={i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : ''}
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                    {FEATURE_LABELS[f.feature] || f.feature.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {f.unique_users.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {f.total_events.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {f.unique_users > 0 ? (f.total_events / f.unique_users).toFixed(1) : '—'}
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
