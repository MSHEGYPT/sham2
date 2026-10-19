import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Crown,
  UserCheck,
  Coins,
  Truck,
  Users,
  Lock,
  Sparkles,
  Layers,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { ONION_RINGS_CONFIG } from '../data/initialData';
import { OnionRingLevel } from '../types';

interface OnionRingNavigatorProps {
  onSelectRing?: (level: OnionRingLevel) => void;
}

export const OnionRingNavigator: React.FC<OnionRingNavigatorProps> = ({ onSelectRing }) => {
  const { currentRingLevel, setCurrentRingLevel, currentUser, quickSwitchUser } = useLogistics();

  const isOwner = currentUser.assignedRingLevel === 1;

  const currentRingConfig = ONION_RINGS_CONFIG.find((r) => r.level === currentRingLevel) || ONION_RINGS_CONFIG[0];

  const handleRingClick = (level: OnionRingLevel) => {
    // If owner, can freely navigate to any ring!
    // If not owner, cannot navigate deeper into more privileged rings than their assigned clearance.
    if (isOwner || level >= currentUser.assignedRingLevel) {
      setCurrentRingLevel(level);
      if (onSelectRing) onSelectRing(level);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
              Onion Layer Security & Role Hierarchy
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>هندسة «دوائر البصلة الأمنية» المتداخلة</span>
            {isOwner && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                صاحب المنظومة (صلاحيات مطلقة)
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            المنظومة مصممة كطبقات متحدة المركز تبدأ من النواة (المدير العام) وتتفرع للرقابة الإدارية،
            المالية، الميدانية، والشركاء. يمتلك المدير مفاتيح النفاذ لكافة الدوائر.
          </p>
        </div>

        {/* Current Active User Clearance Badge */}
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 shrink-0 text-right">
          <div className="text-[10px] text-slate-400 mb-0.5">المستخدم النشط حالياً:</div>
          <strong className="text-xs text-white block truncate max-w-[200px]">{currentUser.name}</strong>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>الدائرة الحالية: مستوى {currentRingLevel}</span>
          </div>
        </div>
      </div>

      {/* Visual Onion Rings Grid / Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {ONION_RINGS_CONFIG.map((ring) => {
          const isCurrentActive = currentRingLevel === ring.level;
          const isUserAssigned = currentUser.assignedRingLevel === ring.level;
          const isLockedForUser = !isOwner && ring.level < currentUser.assignedRingLevel;

          return (
            <button
              key={ring.level}
              onClick={() => handleRingClick(ring.level)}
              disabled={isLockedForUser}
              className={`text-right p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer text-xs ${
                isCurrentActive
                  ? `${ring.borderColor} bg-slate-800/90 shadow-lg scale-102 ring-2 ring-amber-400/40`
                  : isLockedForUser
                  ? 'border-slate-800 bg-slate-950/40 opacity-40 cursor-not-allowed'
                  : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/70'
              }`}
            >
              {/* Level Pill */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
                      ring.level === 1
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : ring.level === 2
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : ring.level === 3
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : ring.level === 4
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    دائرة #{ring.level}
                  </span>

                  {isLockedForUser ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ) : ring.level === 1 ? (
                    <Crown className="w-4 h-4 text-amber-400" />
                  ) : ring.level === 2 ? (
                    <UserCheck className="w-4 h-4 text-blue-400" />
                  ) : ring.level === 3 ? (
                    <Coins className="w-4 h-4 text-emerald-400" />
                  ) : ring.level === 4 ? (
                    <Truck className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Users className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <h4 className="font-black text-white text-xs sm:text-sm mt-1">{ring.nameAr.split('(')[0]}</h4>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {ring.descriptionAr}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">
                  {ring.level === 1
                    ? 'المدير العام'
                    : ring.level === 2
                    ? 'المشرفون'
                    : ring.level === 3
                    ? 'المحاسبون'
                    : ring.level === 4
                    ? 'العاملون'
                    : 'الشركاء'}
                </span>
                {isCurrentActive && (
                  <span className="font-bold text-amber-400">معاينة الدائرة ✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Ring Detailed Capabilities & Security Specs */}
      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">مواصفات الدائرة الأمنية:</span>
              <h4 className="text-base font-black text-white">{currentRingConfig.nameAr}</h4>
            </div>
            <p className="text-xs text-slate-300 mt-1">{currentRingConfig.descriptionAr}</p>
          </div>

          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-900 text-slate-200 border border-slate-700 shrink-0">
            {currentRingConfig.badgeAr}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Allowed Capabilities */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>الصلاحيات الممنوحة في هذه الدائرة:</span>
            </span>
            <ul className="space-y-1.5 text-slate-300">
              {currentRingConfig.allowedCapabilities.map((cap, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Restricted Capabilities */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-rose-400 flex items-center gap-1.5 mb-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>الصلاحيات المحجوبة في هذه الدائرة:</span>
            </span>
            <ul className="space-y-1.5 text-slate-400">
              {currentRingConfig.restrictedCapabilities.map((cap, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span>
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
