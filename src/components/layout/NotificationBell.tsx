'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import { notificationApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  usePolling(() => {
    notificationApi.unreadCount()
      .then((res) => setUnreadCount(res.data.unread_count))
      .catch(() => {});
  }, 25000, !!user);

  const loadNotifications = () => {
    setLoading(true);
    notificationApi.list()
      .then((res) => setNotifications(res.data.results ?? res.data))
      .finally(() => setLoading(false));
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) loadNotifications();
  };

  const handleMarkRead = (id: number) => {
    notificationApi.markRead(id).then(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  const handleMarkAllRead = () => {
    notificationApi.markAllRead().then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    });
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-xl hover:bg-warm-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-warm-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl border border-warm-200 shadow-xl py-2 animate-fade-in z-50">
            <div className="flex items-center justify-between px-4 py-2 border-b border-warm-100">
              <span className="text-sm font-semibold text-warm-900">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-semibold text-primary-600 hover:underline">
                  Tout marquer lu
                </button>
              )}
            </div>
            {loading ? (
              <p className="text-sm text-warm-500 px-4 py-4 text-center">Chargement...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-warm-500 px-4 py-4 text-center">Aucune notification.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 text-sm border-b border-warm-50 hover:bg-warm-50 transition-colors',
                    !n.is_read && 'bg-primary-50'
                  )}
                >
                  <p className="font-semibold text-warm-900">{n.title}</p>
                  <p className="text-warm-600 text-xs mt-0.5">{n.message}</p>
                  <p className="text-warm-400 text-[11px] mt-1">
                    {new Date(n.created_at).toLocaleString('fr-FR')}
                  </p>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
