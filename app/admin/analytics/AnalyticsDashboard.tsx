'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminRole } from '@/lib/types/admin';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dynamic from 'next/dynamic';

const GrowthFunnelTab = dynamic(() => import('./components/GrowthFunnelTab'), { ssr: false });
const RetentionTab = dynamic(() => import('./components/RetentionTab'), { ssr: false });
const ContentPerformanceTab = dynamic(() => import('./components/ContentPerformanceTab'), { ssr: false });
const FeatureAdoptionTab = dynamic(() => import('./components/FeatureAdoptionTab'), { ssr: false });
const LiveActivityTab = dynamic(() => import('./components/LiveActivityTab'), { ssr: false });

type AdminTab = 'overview' | 'growth' | 'retention' | 'content' | 'features' | 'live';

interface AnalyticsDashboardProps {
  adminRole: AdminRole;
}

interface CostSummary {
  model: string;
  total_calls: number;
  total_tokens: number;
  total_cost_cents: number;
  avg_cost_per_call: number;
  [key: string]: string | number;
}

interface TopUser {
  user_id: string;
  handle: string;
  total_calls: number;
  total_cost_cents: number;
  [key: string]: string | number;
}

interface DailyTrend {
  date: string;
  total_calls: number;
  total_tokens: number;
  total_cost_cents: number;
  error_count: number;
  [key: string]: string | number;
}

interface EngagementData {
  totalBagViews: number;
  totalLinkClicks: number;
  discoveryVisits: number;
  uniqueVisitors: number;
  loggedInViews: number;
  anonymousViews: number;
  loggedInVisitors: number;
  anonymousVisitors: number;
  engagementByDay: { date: string; views: number; clicks: number }[];
  topBags: { bag_id: string; code: string; count: number }[];
  topReferrers: { domain: string; count: number }[];
}

interface PlatformStats {
  totalUsers: number;
  totalBags: number;
  totalItems: number;
  publicBags: number;
}

interface AnalyticsData {
  costSummary: CostSummary[];
  topUsers: TopUser[];
  dailyTrend: DailyTrend[];
  totalCost: number;
  totalCalls: number;
  totalErrors: number;
  engagement: EngagementData;
  platform: PlatformStats;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function formatCost(cents: number): string {
  if (cents < 100) {
    return `${cents}¢`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'growth', label: 'Growth & Funnels' },
  { id: 'retention', label: 'Retention' },
  { id: 'content', label: 'Content' },
  { id: 'features', label: 'Features' },
  { id: 'live', label: 'Live' },
];

export default function AnalyticsDashboard({ adminRole }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
        <p className="text-yellow-600 dark:text-yellow-400">No analytics data available yet.</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          API usage tracking has been enabled. Data will appear here as AI features are used.
        </p>
      </div>
    );
  }

  const engagement = data.engagement || { totalBagViews: 0, totalLinkClicks: 0, discoveryVisits: 0, uniqueVisitors: 0, loggedInViews: 0, anonymousViews: 0, loggedInVisitors: 0, anonymousVisitors: 0, engagementByDay: [], topBags: [], topReferrers: [] };
  const platform = data.platform || { totalUsers: 0, totalBags: 0, totalItems: 0, publicBags: 0 };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Date Range Selector — visible on all tabs except Live */}
      {activeTab !== 'live' && (
        <div className="flex justify-end">
          <div className="inline-flex rounded-md shadow-sm">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${
                  range === '7d' ? 'rounded-l-md' : ''
                } ${
                  range === '90d' ? 'rounded-r-md' : ''
                } border border-gray-300 dark:border-gray-600`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Non-overview tabs */}
      {activeTab === 'growth' && <GrowthFunnelTab dateRange={dateRange} />}
      {activeTab === 'retention' && <RetentionTab dateRange={dateRange} />}
      {activeTab === 'content' && <ContentPerformanceTab dateRange={dateRange} />}
      {activeTab === 'features' && <FeatureAdoptionTab dateRange={dateRange} />}
      {activeTab === 'live' && <LiveActivityTab />}

      {/* Overview tab — original content */}
      {activeTab === 'overview' && <div className="space-y-8">

      {/* Platform Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Platform Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-[var(--teed-green-9)]">{formatNumber(platform.totalUsers)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{formatNumber(platform.totalBags)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Bags</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{formatNumber(platform.totalItems)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600">{formatNumber(platform.publicBags)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Public Bags</p>
          </div>
        </div>
      </div>

      {/* Site Engagement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Bag Views"
          value={formatNumber(engagement.totalBagViews)}
          subtitle={`${dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : 'Last 90 days'}`}
          color="blue"
        />
        <SummaryCard
          title="Link Clicks"
          value={formatNumber(engagement.totalLinkClicks)}
          subtitle="Affiliate link clicks"
          color="green"
        />
        <SummaryCard
          title="Discovery Visits"
          value={formatNumber(engagement.discoveryVisits)}
          subtitle="Discovery page views"
          color="purple"
        />
        <SummaryCard
          title="Click Rate"
          value={engagement.totalBagViews > 0 ? `${((engagement.totalLinkClicks / engagement.totalBagViews) * 100).toFixed(1)}%` : '0%'}
          subtitle="Clicks per view"
          color={engagement.totalLinkClicks > 0 ? 'green' : 'blue'}
        />
      </div>

      {/* Viewer Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Views by Auth Status
          </h2>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Logged In', value: engagement.loggedInViews, fill: '#0088FE' },
                    { name: 'Anonymous', value: engagement.anonymousViews, fill: '#8884D8' },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  <Cell fill="#0088FE" />
                  <Cell fill="#8884D8" />
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#0088FE]" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Logged In</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">{formatNumber(engagement.loggedInViews)}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({engagement.totalBagViews > 0 ? ((engagement.loggedInViews / engagement.totalBagViews) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#8884D8]" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Anonymous</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-purple-600">{formatNumber(engagement.anonymousViews)}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({engagement.totalBagViews > 0 ? ((engagement.anonymousViews / engagement.totalBagViews) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unique Visitors Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Unique Visitors by Auth Status
          </h2>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Logged In', value: engagement.loggedInVisitors, fill: '#00C49F' },
                    { name: 'Anonymous', value: engagement.anonymousVisitors, fill: '#FF8042' },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  <Cell fill="#00C49F" />
                  <Cell fill="#FF8042" />
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00C49F]" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Logged In</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">{formatNumber(engagement.loggedInVisitors)}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({engagement.uniqueVisitors > 0 ? ((engagement.loggedInVisitors / engagement.uniqueVisitors) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF8042]" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Anonymous</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-orange-600">{formatNumber(engagement.anonymousVisitors)}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({engagement.uniqueVisitors > 0 ? ((engagement.anonymousVisitors / engagement.uniqueVisitors) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Trend Chart */}
      {engagement.engagementByDay.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Engagement
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagement.engagementByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line type="monotone" dataKey="views" name="Bag Views" stroke="#0088FE" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="clicks" name="Link Clicks" stroke="#00C49F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Bags and Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed Bags */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Viewed Bags
          </h2>
          {engagement.topBags.length > 0 ? (
            <div className="space-y-3">
              {engagement.topBags.slice(0, 5).map((bag, index) => (
                <div key={bag.bag_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <span className="font-medium text-gray-900 dark:text-white">/{bag.code}</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{formatNumber(bag.count)} views</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data yet</p>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Traffic Sources
          </h2>
          {engagement.topReferrers.length > 0 ? (
            <div className="space-y-3">
              {engagement.topReferrers.slice(0, 5).map((ref, index) => (
                <div key={ref.domain} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{ref.domain}</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{formatNumber(ref.count)} visits</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No referrer data yet</p>
          )}
        </div>
      </div>

      {/* AI Cost Summary Cards */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">AI Usage & Costs</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Cost"
          value={formatCost(data.totalCost)}
          subtitle={`${dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : 'Last 90 days'}`}
          color="blue"
        />
        <SummaryCard
          title="API Calls"
          value={formatNumber(data.totalCalls)}
          subtitle="Total requests"
          color="green"
        />
        <SummaryCard
          title="Error Rate"
          value={data.totalCalls > 0 ? `${((data.totalErrors / data.totalCalls) * 100).toFixed(1)}%` : '0%'}
          subtitle={`${data.totalErrors} errors`}
          color={data.totalErrors > 0 ? 'red' : 'green'}
        />
        <SummaryCard
          title="Avg Cost/Call"
          value={data.totalCalls > 0 ? formatCost(Math.round(data.totalCost / data.totalCalls)) : '0¢'}
          subtitle="Per API request"
          color="purple"
        />
      </div>

      {/* Cost by Model Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cost by Model
        </h2>
        {data.costSummary.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.costSummary}
                  dataKey="total_cost_cents"
                  nameKey="model"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {data.costSummary.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCost(value)}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-4">
              {data.costSummary.map((item, index) => (
                <div
                  key={item.model}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.model || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatNumber(item.total_calls)} calls • {formatNumber(item.total_tokens)} tokens
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCost(item.total_cost_cents)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ~{formatCost(Math.round(item.avg_cost_per_call))}/call
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No cost data available for this period
          </p>
        )}
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Daily API Usage
        </h2>
        {data.dailyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#F3F4F6' }}
                itemStyle={{ color: '#F3F4F6' }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number, name: string) => {
                  if (name === 'Cost') return formatCost(value);
                  return formatNumber(value);
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_calls"
                name="API Calls"
                stroke="#0088FE"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="total_cost_cents"
                name="Cost"
                stroke="#00C49F"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="error_count"
                name="Errors"
                stroke="#FF8042"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No daily trend data available for this period
          </p>
        )}
      </div>

      {/* Top Users by API Spend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Users by API Spend
        </h2>
        {data.topUsers.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topUsers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="handle"
                  stroke="#9CA3AF"
                  tickFormatter={(value) => `@${value || 'unknown'}`}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#F3F4F6' }}
                  itemStyle={{ color: '#F3F4F6' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Cost') return formatCost(value);
                    return value;
                  }}
                  labelFormatter={(value) => `@${value}`}
                />
                <Legend />
                <Bar
                  dataKey="total_cost_cents"
                  name="Cost"
                  fill="#8884D8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="total_calls"
                  name="API Calls"
                  fill="#82CA9D"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      API Calls
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.topUsers.map((user, index) => (
                    <tr key={user.user_id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        @{user.handle || 'unknown'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                        {formatNumber(user.total_calls)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white text-right">
                        {formatCost(user.total_cost_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No user spend data available for this period
          </p>
        )}
      </div>
    </div>}
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
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  const valueColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${valueColorClasses[color]}`}>{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}
