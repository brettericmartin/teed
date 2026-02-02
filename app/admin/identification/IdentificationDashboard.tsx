'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface TelemetryStats {
  totalEvents: number;
  byAction: { action: string; count: number }[];
  byStage: { stage: string; count: number }[];
  avgConfidence: number;
  avgTimeToDecision: number;
}

interface CorrectionStats {
  totalCorrections: number;
  byField: { field: string; count: number }[];
  recentCorrections: {
    input_value: string;
    original_brand: string;
    corrected_brand: string;
    original_name: string;
    corrected_name: string;
    created_at: string;
  }[];
}

interface LearnedProductStats {
  totalProducts: number;
  byCategory: { category: string; count: number }[];
  topBrands: { brand: string; count: number }[];
  recentlyLearned: {
    brand: string;
    name: string;
    category: string;
    occurrence_count: number;
    last_seen_at: string;
  }[];
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];

export default function IdentificationDashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryStats | null>(null);
  const [corrections, setCorrections] = useState<CorrectionStats | null>(null);
  const [learned, setLearned] = useState<LearnedProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch all stats in parallel
        const [telemetryRes, correctionsRes, learnedRes] = await Promise.all([
          fetch('/api/admin/identification/telemetry'),
          fetch('/api/admin/identification/corrections'),
          fetch('/api/admin/identification/learned'),
        ]);

        if (telemetryRes.ok) {
          setTelemetry(await telemetryRes.json());
        }
        if (correctionsRes.ok) {
          setCorrections(await correctionsRes.json());
        }
        if (learnedRes.ok) {
          setLearned(await learnedRes.json());
        }
      } catch (err) {
        setError('Failed to load analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Identifications"
          value={telemetry?.totalEvents || 0}
          subtitle="tracked events"
          color="blue"
        />
        <SummaryCard
          title="Avg Confidence"
          value={`${((telemetry?.avgConfidence || 0) * 100).toFixed(1)}%`}
          subtitle="across all identifications"
          color="green"
        />
        <SummaryCard
          title="User Corrections"
          value={corrections?.totalCorrections || 0}
          subtitle="items corrected"
          color="amber"
        />
        <SummaryCard
          title="Learned Products"
          value={learned?.totalProducts || 0}
          subtitle="in product library"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Actions Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            User Actions
          </h3>
          {telemetry?.byAction && telemetry.byAction.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={telemetry.byAction}
                  dataKey="count"
                  nameKey="action"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                >
                  {telemetry.byAction.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No telemetry data yet. User actions will appear here once tracking begins." />
          )}
        </div>

        {/* Stage Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Search Stage Reached
          </h3>
          {telemetry?.byStage && telemetry.byStage.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={telemetry.byStage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No stage data yet. This shows which pipeline stages resolve identifications." />
          )}
        </div>
      </div>

      {/* Learned Products by Category */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Learned Products by Category
        </h3>
        {learned?.byCategory && learned.byCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={learned.byCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No learned products yet. Products are learned automatically when identified with high confidence." />
        )}
      </div>

      {/* Recent Corrections */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Recent Corrections
        </h3>
        {corrections?.recentCorrections && corrections.recentCorrections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Input
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Original
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Corrected To
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {corrections.recentCorrections.map((c, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                      {c.input_value?.slice(0, 40)}...
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {c.original_brand} {c.original_name}
                    </td>
                    <td className="px-4 py-2 text-sm text-green-600">
                      {c.corrected_brand} {c.corrected_name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No corrections recorded yet. Corrections help improve future identifications." />
        )}
      </div>

      {/* Recently Learned Products */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Recently Learned Products
        </h3>
        {learned?.recentlyLearned && learned.recentlyLearned.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {learned.recentlyLearned.map((p, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {p.brand} {p.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {p.category} &bull; seen {p.occurrence_count}x
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No products learned yet." />
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      <div className="text-xs opacity-70 mt-1">{subtitle}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400 text-sm">
      {message}
    </div>
  );
}
