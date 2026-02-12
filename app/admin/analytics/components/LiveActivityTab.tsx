'use client';

import { useState, useEffect, useRef } from 'react';

interface LiveEvent {
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
  user_handle: string | null;
  user_name: string | null;
}

interface LiveData {
  events: LiveEvent[];
}

const EVENT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  page_viewed: { icon: '👁', color: '#6B7280', label: 'Page View' },
  bag_viewed: { icon: '👜', color: '#3B82F6', label: 'Bag Viewed' },
  bag_created: { icon: '✨', color: '#10B981', label: 'Bag Created' },
  item_added: { icon: '➕', color: '#8B5CF6', label: 'Item Added' },
  user_signed_up: { icon: '🎉', color: '#F59E0B', label: 'Signed Up' },
  user_logged_in: { icon: '🔑', color: '#6366F1', label: 'Logged In' },
  search_performed: { icon: '🔍', color: '#EC4899', label: 'Search' },
  link_clicked: { icon: '🔗', color: '#14B8A6', label: 'Link Clicked' },
  profile_viewed: { icon: '👤', color: '#F97316', label: 'Profile Viewed' },
  user_followed: { icon: '➡️', color: '#22C55E', label: 'Followed' },
  user_unfollowed: { icon: '⬅️', color: '#EF4444', label: 'Unfollowed' },
  social_link_clicked: { icon: '🌐', color: '#0EA5E9', label: 'Social Click' },
  item_copied_to_bag: { icon: '📋', color: '#A855F7', label: 'Item Copied' },
  paste_detected: { icon: '📎', color: '#D946EF', label: 'Paste' },
  settings_saved: { icon: '⚙️', color: '#64748B', label: 'Settings' },
  affiliate_link_clicked: { icon: '💰', color: '#84CC16', label: 'Affiliate Click' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function LiveActivityTab() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = () => {
    fetch('/api/admin/analytics/live')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data || !data.events || data.events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Activity</h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No recent activity. Events will appear here in real-time as users interact with the platform.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Activity</h3>
        <span className="text-xs text-gray-400 ml-auto">Refreshes every 10s</span>
      </div>

      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {data.events.map((event, i) => {
          const config = EVENT_CONFIG[event.event_type] || { icon: '📌', color: '#6B7280', label: event.event_type };
          return (
            <div
              key={`${event.created_at}-${i}`}
              className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-lg flex-shrink-0" title={config.label}>{config.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {event.user_name || event.user_handle || 'Anonymous'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  {config.label}
                </span>
                {event.event_data && (
                  <span className="text-xs text-gray-400 ml-2 truncate">
                    {(() => {
                      const d = event.event_data;
                      if (d.page) return `${d.page}`;
                      if (d.bag_code) return `bag: ${d.bag_code}`;
                      if (d.query) return `"${d.query}"`;
                      if (d.profile_handle) return `@${d.profile_handle}`;
                      return '';
                    })()}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                {timeAgo(event.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
