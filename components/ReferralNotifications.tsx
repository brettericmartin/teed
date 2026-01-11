'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Check, Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'referral_applied' | 'referral_approved';
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

interface ReferralNotificationsProps {
  applicationId: string;
  onNotification?: (notification: Notification) => void;
}

/**
 * DOCTRINE: Notifications are informational only, not engagement hooks.
 * No trophies, no urgency, no gamification.
 */
const NOTIFICATION_CONFIG = {
  referral_applied: {
    icon: UserPlus,
    bgColor: 'bg-[var(--teed-green-2)]',
    borderColor: 'border-[var(--teed-green-6)]',
    iconColor: 'text-[var(--teed-green-9)]',
    getMessage: (data: Record<string, any>) =>
      `${data.applicant_name || 'Someone'} applied using your referral link`,
  },
  referral_approved: {
    icon: Check,
    bgColor: 'bg-[var(--teed-green-2)]',
    borderColor: 'border-[var(--teed-green-6)]',
    iconColor: 'text-[var(--teed-green-9)]',
    getMessage: (data: Record<string, any>) =>
      `${data.applicant_name || 'Your referral'} was approved`,
  },
};

function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const config = NOTIFICATION_CONFIG[notification.type];
  const Icon = config.icon;

  useEffect(() => {
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        ${config.bgColor} ${config.borderColor}
        animate-slide-in-right
      `}
    >
      <div className={`p-2 rounded-full bg-white dark:bg-zinc-800 ${config.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {config.getMessage(notification.data)}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Just now
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-[var(--text-tertiary)]" />
      </button>
    </div>
  );
}

export default function ReferralNotifications({
  applicationId,
  onNotification,
}: ReferralNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/beta/notifications/${applicationId}?unread=true&limit=5`
      );
      if (!res.ok) return;

      const data = await res.json();
      const newNotifications = data.notifications || [];

      // Filter to only show notifications newer than last check
      const toShow = lastChecked
        ? newNotifications.filter(
            (n: Notification) => new Date(n.created_at) > new Date(lastChecked)
          )
        : newNotifications.slice(0, 3); // Show up to 3 on initial load

      if (toShow.length > 0) {
        setNotifications((prev) => [...toShow, ...prev].slice(0, 5));
        toShow.forEach((n: Notification) => onNotification?.(n));
      }

      setLastChecked(new Date().toISOString());
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [applicationId, lastChecked, onNotification]);

  useEffect(() => {
    // DOCTRINE: Fetch once on load only - no polling to pull users back
    fetchNotifications();
  }, [fetchNotifications]);

  const dismissNotification = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      // Mark as read in the background
      try {
        await fetch(`/api/beta/notifications/${applicationId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notification_ids: [notificationId] }),
        });
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    [applicationId]
  );

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast
            notification={notification}
            onDismiss={() => dismissNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}

// Badge component to show unread count
export function NotificationBadge({
  applicationId,
  className = '',
}: {
  applicationId: string;
  className?: string;
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // DOCTRINE: Fetch once on load only - no polling
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/beta/notifications/${applicationId}?unread=true&limit=1`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread_count || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notification count:', err);
      }
    };

    fetchCount();
  }, [applicationId]);

  if (unreadCount === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--teed-green-9)] text-white text-xs font-bold rounded-full flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    </div>
  );
}
