import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  clearAuthState,
  formatRoleLabel,
  getDashboardPathForRole,
  getAuthToken,
  getCurrentUser,
  hasAnyRole,
  isAdmin,
  USER_ROLES,
} from '../utils/auth';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notificationService';

const NOTIFICATION_POLL_INTERVAL_MS = 15000;

const formatNotificationTime = (value) => {
  if (!value) {
    return 'Just now';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Sidebar = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentRole = currentUser.userRole || USER_ROLES.USER;
  const hasManagerAccess = hasAnyRole(currentRole, [USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER]);
  const hasAdminAccess = isAdmin(currentRole);
  const displayName = currentUser.userName || 'User';
  const displayRole = formatRoleLabel(currentRole);
  const avatarLetter = (displayName.charAt(0) || 'U').toUpperCase();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [hasFreshNotification, setHasFreshNotification] = useState(false);
  const notificationPanelRef = useRef(null);
  const previousUnreadCountRef = useRef(0);
  const hasHydratedNotificationsRef = useRef(false);
  const eventSourceRef = useRef(null);

  const handleLogout = () => {
    clearAuthState();
    navigate('/login', { replace: true });
  };

  const resolveNotificationPath = (notification) => {
    const entityType = notification.entityType || '';

    if (entityType === 'BOOKING') {
      if (currentRole === USER_ROLES.ASSET_MANAGER) {
        return '/dashboard/asset-manager/bookings';
      }

      if (hasAdminAccess && ['BOOKING_CREATED', 'BOOKING_CANCELLED'].includes(notification.type)) {
        return '/admin/bookings';
      }
      return '/bookings';
    }

    if (entityType === 'USER') {
      if (hasAdminAccess && notification.type === 'USER_REGISTERED') {
        return '/users';
      }

      return getDashboardPathForRole(currentRole);
    }

    if (['ASSET', 'ASSET_TYPE', 'LOCATION'].includes(entityType)) {
      return hasManagerAccess ? '/assets' : '/asset-list';
    }

    return getDashboardPathForRole(currentRole);
  };

  const loadNotifications = async ({ silent = true } = {}) => {
    if (!silent) {
      setLoadingNotifications(true);
    }

    setNotificationError('');

    try {
      const [countResponse, notificationsResponse] = await Promise.all([
        getUnreadNotificationCount(),
        getNotifications({ limit: 20 }),
      ]);

      const nextUnreadCount = Number(countResponse.data?.unreadCount || 0);
      if (
        hasHydratedNotificationsRef.current &&
        nextUnreadCount > previousUnreadCountRef.current
      ) {
        setHasFreshNotification(true);
      }

      previousUnreadCountRef.current = nextUnreadCount;
      hasHydratedNotificationsRef.current = true;
      setUnreadCount(nextUnreadCount);
      setNotifications(notificationsResponse.data || []);
    } catch (error) {
      if (!silent) {
        setNotificationError('Failed to load notifications.');
      }
    } finally {
      if (!silent) {
        setLoadingNotifications(false);
      }
    }
  };

  useEffect(() => {
    loadNotifications({ silent: false });

    const intervalId = setInterval(() => {
      loadNotifications({ silent: true });
    }, NOTIFICATION_POLL_INTERVAL_MS);

    const token = getAuthToken();
    if (token) {
      const eventSource = new EventSource(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/notifications/stream?token=${encodeURIComponent(token)}`
      );

      eventSource.onmessage = () => {
        // Default events are not used, but keep the connection alive for browser compatibility.
      };

      eventSource.addEventListener('connected', () => {
        // Connection established.
      });

      eventSource.addEventListener('notification', (event) => {
        try {
          const notification = JSON.parse(event.data);
          setNotifications((previousNotifications) => {
            const nextNotifications = [
              notification,
              ...previousNotifications.filter((item) => item.id !== notification.id),
            ];
            return nextNotifications.slice(0, 20);
          });

          setUnreadCount((previousCount) => previousCount + (notification.isRead ? 0 : 1));
          previousUnreadCountRef.current += notification.isRead ? 0 : 1;
          if (!isNotificationPanelOpen) {
            setHasFreshNotification(true);
          }
        } catch (error) {
          // Ignore malformed stream payloads and rely on the next refresh.
        }
      });

      eventSource.addEventListener('unread-count', (event) => {
        try {
          const payload = JSON.parse(event.data);
          const nextUnreadCount = Number(payload.unreadCount || 0);
          setUnreadCount(nextUnreadCount);
          previousUnreadCountRef.current = nextUnreadCount;
        } catch (error) {
          // Ignore malformed stream payloads.
        }
      });

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
      };

      eventSourceRef.current = eventSource;
    }

    return () => {
      clearInterval(intervalId);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target)
      ) {
        setIsNotificationPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleNotifications = () => {
    const nextOpen = !isNotificationPanelOpen;
    setIsNotificationPanelOpen(nextOpen);

    if (nextOpen) {
      setHasFreshNotification(false);
      loadNotifications({ silent: false });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      previousUnreadCountRef.current = 0;
      setHasFreshNotification(false);
    } catch (error) {
      setNotificationError('Failed to mark notifications as read.');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((previousNotifications) =>
          previousNotifications.map((item) =>
            item.id === notification.id
              ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
              : item
          )
        );
        setUnreadCount((previousCount) => Math.max(0, previousCount - 1));
        previousUnreadCountRef.current = Math.max(0, previousUnreadCountRef.current - 1);
      } catch (error) {
        setNotificationError('Failed to mark notification as read.');
      }
    }

    const targetPath = resolveNotificationPath(notification);
    setIsNotificationPanelOpen(false);
    navigate(targetPath);
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '\u25A6',
      path: getDashboardPathForRole(currentRole),
    },
  ];

  //sidebar role-based visibility control
  if (hasManagerAccess) {
    menuItems.push({ id: 'assets', label: 'Assets', icon: '\u25A3', path: '/assets' });
  }

  if (currentRole === USER_ROLES.USER) {
    menuItems.push({ id: 'asset-list', label: 'Asset List', icon: '\u25A8', path: '/asset-list' });
    menuItems.push({ id: 'my-tickets', label: 'My Tickets', icon: '\u25A9', path: '/tickets/my' });
  }

  if (currentRole === USER_ROLES.TECHNICIAN) {
    menuItems.push({ id: 'tech-tickets', label: 'Assigned Tasks', icon: '\u25A9', path: '/dashboard/technician/tickets' });
  }

  if (currentRole === USER_ROLES.ASSET_MANAGER) {
    menuItems.push({ id: 'asset-manager-bookings', label: 'Booking Requests', icon: '\u25A4', path: '/dashboard/asset-manager/bookings' });
  }

  if (hasManagerAccess) {
    menuItems.push({ id: 'booking-analytics', label: 'Booking Analytics', icon: '\u25A0', path: '/booking-analytics' });
  }

  if (hasAdminAccess) {
    menuItems.push({ id: 'admin-bookings', label: 'Booking Requests', icon: '\u25A4', path: '/admin/bookings' });
    menuItems.push({ id: 'tickets', label: 'Incident Tickets', icon: '\u25A9', path: '/tickets' });
    menuItems.push({ id: 'audit-logs', label: 'Audit Logs', icon: '\u25A5', path: '/admin/audit-logs' });
    menuItems.push({ id: 'users', label: 'User Management', icon: '\u25A7', path: '/users' });
    menuItems.push({ id: 'settings', label: 'Settings', icon: '\u2699', path: '/settings' });
  }

  return (
    <aside className="relative flex h-screen w-64 shrink-0 flex-col bg-gray-900 text-white xl:w-72">
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Operations Hub</h2>
            <p className="mt-1 text-xs text-gray-500">Smart Campus Portal</p>
          </div>

          <div className="relative" ref={notificationPanelRef}>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className="relative rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 transition hover:border-blue-400 hover:text-white"
              aria-label="Notifications"
              title="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
              </svg>

              {unreadCount > 0 ? (
                <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}

              {hasFreshNotification ? (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400" />
              ) : null}
            </button>

            {isNotificationPanelOpen ? (
              <div className="absolute left-0 top-12 z-50 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-gray-200 bg-white text-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    <p className="text-xs text-slate-500">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </p>
                  </div>

                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-100"
                    >
                      Mark All Read
                    </button>
                  ) : null}
                </div>

                {notificationError ? (
                  <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
                    {notificationError}
                  </div>
                ) : null}

                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifications ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">Loading notifications...</p>
                  ) : null}

                  {!loadingNotifications && notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
                  ) : null}

                  {!loadingNotifications
                    ? notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full border-b border-gray-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                            notification.isRead ? 'bg-white' : 'bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                            {!notification.isRead ? (
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{notification.message}</p>
                          <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </button>
                      ))
                    : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `block w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-gray-800 p-4">
        <div className="flex items-center space-x-3 rounded-lg bg-gray-800 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold uppercase">
            {avatarLetter}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-gray-400">{displayRole}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-300 transition hover:border-red-400 hover:text-red-300"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
