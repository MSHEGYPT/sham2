import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sparkles,
  ChevronDown,
  X,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { AppNotification } from '../types';

interface NotificationsCenterDropdownProps {
  buttonClassName?: string;
  isCompact?: boolean;
}

export const NotificationsCenterDropdown: React.FC<NotificationsCenterDropdownProps> = ({
  buttonClassName = '',
  isCompact = false,
}) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    simulateEventNotification,
    isSoundEnabled,
    setIsSoundEnabled,
    navigateToView,
    currentRole,
  } = useLogistics();

  const [isOpen, setIsOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<'ALL' | 'COURIER' | 'MERCHANT' | 'UNREAD'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (filterRole === 'UNREAD') return !n.read;
    if (filterRole === 'COURIER') return n.targetRole === 'COURIER' || n.targetRole === 'ALL';
    if (filterRole === 'MERCHANT') return n.targetRole === 'MERCHANT' || n.targetRole === 'ALL';
    return true;
  });

  return (
    <div className="relative inline-block text-right" ref={dropdownRef}>
      {/* Trigger Button with Badge Counter */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          buttonClassName ||
          (isOpen
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
        }`}
        title="مركز الإشعارات الفورية والتنبيهات المباشرة"
        aria-label="Notifications Center"
      >
        <div className="relative">
          <Bell className="w-4 h-4 text-amber-500" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
              {unreadNotificationsCount > 9 ? '+9' : unreadNotificationsCount}
            </span>
          )}
        </div>
        {!isCompact && (
          <span className="hidden sm:inline">الإشعارات</span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          dir="rtl"
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs">مركز الإشعارات الفورية</h4>
                <p className="text-[10px] text-slate-400">تنبيهات فورية للمناديب والتجار</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Sound Toggle */}
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isSoundEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-white/10 text-slate-400 hover:bg-white/20'
                }`}
                title={isSoundEnabled ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Simulation Toolbar - Test Live Toasts */}
          <div className="p-2.5 bg-gradient-to-r from-amber-500/10 via-slate-50 to-purple-500/10 border-b border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                محاكاة إشعار فوري حي (تجربة المناديب والتجار):
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => simulateEventNotification('NEW_ORDER_COURIER')}
                className="px-2 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200 text-[10px] font-bold text-right flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
              >
                <Truck className="w-3 h-3 text-purple-700 shrink-0" />
                <span className="truncate">أمر توصيل للكابتن 🛵</span>
              </button>

              <button
                onClick={() => simulateEventNotification('DELIVERED_MERCHANT')}
                className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 text-[10px] font-bold text-right flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                <span className="truncate">تسليم وتوريد COD 💰</span>
              </button>

              <button
                onClick={() => simulateEventNotification('RETURN_WARNING')}
                className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-200 text-[10px] font-bold text-right flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
              >
                <AlertTriangle className="w-3 h-3 text-rose-700 shrink-0" />
                <span className="truncate">تسجيل مرتجع ⚠️</span>
              </button>

              <button
                onClick={() => simulateEventNotification('SMART_SCHEDULE')}
                className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-[10px] font-bold text-right flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
              >
                <Zap className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">جدولة ذكية ⏰</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'ALL', label: `الكل (${notifications.length})` },
                { id: 'COURIER', label: 'المناديب 🛵' },
                { id: 'MERCHANT', label: 'التجار 🏪' },
                { id: 'UNREAD', label: `غير مقروء (${unreadNotificationsCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterRole(tab.id as any)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    filterRole === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer shrink-0"
                title="تحديد الكل كمقروء"
              >
                قراءة الكل
              </button>
            )}
          </div>

          {/* Notifications Items List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">لا توجد إشعارات تطابق الفلتر المحدد</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isCourier = notif.targetRole === 'COURIER';
                const isMerchant = notif.targetRole === 'MERCHANT';
                const isUrgent = notif.priority === 'urgent';

                return (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`p-3 text-xs transition-colors hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 ${
                      !notif.read ? 'bg-amber-50/40' : 'bg-white'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === 'NEW_DELIVERY_ORDER'
                          ? 'bg-purple-100 text-purple-700'
                          : notif.type === 'OTP_VERIFIED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : notif.type === 'ALERT_WARNING'
                          ? 'bg-rose-100 text-rose-700'
                          : notif.type === 'SMART_SCHEDULE_UPDATE'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {notif.type === 'NEW_DELIVERY_ORDER' ? (
                        <Truck className="w-3.5 h-3.5" />
                      ) : notif.type === 'OTP_VERIFIED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : notif.type === 'ALERT_WARNING' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : notif.type === 'SMART_SCHEDULE_UPDATE' ? (
                        <Zap className="w-3.5 h-3.5" />
                      ) : (
                        <Package className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {isCourier && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            مندوب 🛵
                          </span>
                        )}
                        {isMerchant && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                            تاجر 🏪
                          </span>
                        )}
                        {notif.relatedTrackingNumber && (
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                            #{notif.relatedTrackingNumber}
                          </span>
                        )}
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-auto"></span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <button
              onClick={clearAllNotifications}
              className="text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>مسح الكل</span>
            </button>

            <span className="text-slate-400 font-mono text-[10px]">
              {notifications.length} إشعار مسجل
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
