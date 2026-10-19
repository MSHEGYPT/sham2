import React from 'react';
import {
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  Zap,
  X,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Volume2,
  VolumeX,
  Radio,
  MapPin,
  Navigation,
  Phone,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { AppNotification } from '../types';

export const ToastNotificationContainer: React.FC = () => {
  const {
    activeToasts,
    dismissToast,
    currentRole,
    navigateToView,
    activeAdminTab,
  } = useLogistics();

  if (activeToasts.length === 0) return null;

  return (
    <div
      dir="rtl"
      className="fixed top-4 left-4 sm:top-5 sm:left-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none select-none"
      aria-live="polite"
    >
      {activeToasts.map((toast) => {
        const isCourierOrder = toast.type === 'NEW_DELIVERY_ORDER';
        const isOtpVerified = toast.type === 'OTP_VERIFIED';
        const isWarning = toast.type === 'ALERT_WARNING';
        const isSmartSchedule = toast.type === 'SMART_SCHEDULE_UPDATE';
        const isProximityAlert = toast.type === 'PROXIMITY_ALERT';

        // Role-based badge styling
        const isForCourier = toast.targetRole === 'COURIER' || isProximityAlert;
        const isForMerchant = toast.targetRole === 'MERCHANT';

        // Border & Background accents
        const bgClass = isProximityAlert
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white border-amber-500/90 shadow-2xl shadow-amber-950/60 ring-2 ring-amber-500/40'
          : isCourierOrder
          ? 'bg-purple-950/95 text-white border-purple-500/80 shadow-purple-900/30'
          : isOtpVerified
          ? 'bg-slate-900/95 text-white border-emerald-500/80 shadow-emerald-900/30'
          : isWarning
          ? 'bg-slate-900/95 text-white border-rose-500/80 shadow-rose-900/30'
          : isSmartSchedule
          ? 'bg-slate-900/95 text-white border-amber-500/80 shadow-amber-900/30'
          : 'bg-slate-900/95 text-white border-indigo-500/80 shadow-indigo-900/30';

        const iconBgClass = isProximityAlert
          ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/30'
          : isCourierOrder
          ? 'bg-purple-500 text-white'
          : isOtpVerified
          ? 'bg-emerald-500 text-slate-950 font-bold'
          : isWarning
          ? 'bg-rose-500 text-white font-bold'
          : isSmartSchedule
          ? 'bg-amber-400 text-slate-950 font-bold'
          : 'bg-indigo-500 text-white font-bold';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in overflow-hidden relative group hover:scale-[1.01] ${bgClass}`}
          >
            {/* Top Row: Type, Target Role Badge & Close Button */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${iconBgClass}`}
                >
                  {isProximityAlert ? (
                    <Radio className="w-4 h-4 animate-pulse" />
                  ) : isCourierOrder ? (
                    <Truck className="w-4 h-4" />
                  ) : isOtpVerified ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isSmartSchedule ? (
                    <Zap className="w-4 h-4" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs">{toast.title}</span>
                  {isProximityAlert && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      <span>تنبيه اقتراب GPS 📍</span>
                    </span>
                  )}
                  {isForCourier && !isProximityAlert && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10px] font-bold">
                      خاص بالكابتن 🛵
                    </span>
                  )}
                  {isForMerchant && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[10px] font-bold">
                      خاص بالتاجر 🏪
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {toast.timestamp}
                </span>

                <button
                  onClick={() => dismissToast(toast.id)}
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="إغلاق الإشعار"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <p className="text-xs text-slate-200 leading-relaxed pr-10">
              {toast.message}
            </p>

            {/* Meta Tags Details (Distance, COD, District, Tracking, Phone) */}
            {toast.meta && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] mt-2.5 pt-2 border-t border-white/10 pr-10">
                {toast.meta.distanceMeters !== undefined && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 font-mono flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-amber-400" />
                    <span>المسافة: {toast.meta.distanceMeters} متر</span>
                  </span>
                )}
                {toast.meta.codAmount !== undefined && toast.meta.codAmount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    تحصيل COD: {toast.meta.codAmount} ج.م
                  </span>
                )}
                {toast.meta.district && (
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                    النطاق: {toast.meta.district}
                  </span>
                )}
                {toast.meta.recipientName && (
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                    العميل: {toast.meta.recipientName}
                  </span>
                )}
                {toast.meta.merchantName && (
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                    التاجر: {toast.meta.merchantName}
                  </span>
                )}
                {toast.relatedTrackingNumber && (
                  <span className="font-mono text-[10px] text-amber-400 mr-auto font-bold">
                    #{toast.relatedTrackingNumber}
                  </span>
                )}
              </div>
            )}

            {/* Interactive View Navigation & Direct Call Actions */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                {toast.meta?.phone && (
                  <a
                    href={`tel:${toast.meta.phone}`}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>اتصال ({toast.meta.phone})</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isForCourier && currentRole !== 'COURIER' && (
                  <button
                    onClick={() => {
                      dismissToast(toast.id);
                      navigateToView('COURIER', undefined, 'تطبيق المندوب الميداني');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>فتح تطبيق المندوب</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}

                {isForMerchant && currentRole !== 'MERCHANT' && (
                  <button
                    onClick={() => {
                      dismissToast(toast.id);
                      navigateToView('MERCHANT', undefined, 'بوابة التاجر');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>فتح لوحة التاجر</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}

                {currentRole === 'ADMIN' && (
                  <button
                    onClick={() => {
                      dismissToast(toast.id);
                      navigateToView('ADMIN', 'AGENDA', 'جدول الأعمال');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    عرض في جدول الأعمال
                  </button>
                )}
              </div>
            </div>

            {/* Auto-Dismiss Animated Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div
                className={`h-full ${
                  isProximityAlert
                    ? 'bg-amber-400'
                    : isCourierOrder
                    ? 'bg-purple-400'
                    : isOtpVerified
                    ? 'bg-emerald-400'
                    : isWarning
                    ? 'bg-rose-400'
                    : 'bg-amber-400'
                }`}
                style={{
                  animation: `${isProximityAlert ? 'toastProgress 8s' : 'toastProgress 6.5s'} linear forwards`,
                }}
              />
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes toastProgress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
    </div>
  );
};
