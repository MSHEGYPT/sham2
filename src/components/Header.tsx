import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Package,
  Truck,
  Building2,
  Sparkles,
  Bot,
  RefreshCw,
  Search,
  Layers,
  Crown,
  User,
  LogIn,
  LogOut,
  ChevronDown,
  Home,
  ArrowRight,
  UserCheck,
  Coins,
  MessageSquare,
  QrCode,
  Calendar,
  Lock,
  Headphones,
  SlidersHorizontal,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { UserRole } from '../types';
import { NotificationsCenterDropdown } from './NotificationsCenterDropdown';

interface HeaderProps {
  onOpenAiChat: () => void;
  onOpenOrderParser: () => void;
  onOpenTracking: () => void;
  onOpenNewPickup: () => void;
  onOpenAuthModal: () => void;
  onOpenComplaintsDesk: () => void;
  onToggleOnionView?: () => void;
  showOnionView?: boolean;
  onSelectAdminTab?: (tab: string) => void;
  ownerPreviewRole?: UserRole | null;
  onSwitchOwnerPreview?: (role: UserRole | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAiChat,
  onOpenOrderParser,
  onOpenTracking,
  onOpenNewPickup,
  onOpenAuthModal,
  onOpenComplaintsDesk,
  onToggleOnionView,
  showOnionView = false,
  onSelectAdminTab,
}) => {
  const {
    currentRole,
    currentUser,
    currentRingLevel,
    fraudAnomalies,
    resetToDemoData,
    logoutUser,
    staff,
    canGoBack,
    previousPageLabel,
    goBack,
    navigateToView,
    activeAdminTab,
    setActiveAdminTab,
    canAccessRole,
    canAccessCircle,
    canAccessAdminTab,
  } = useLogistics();

  // Dropdown states
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
      if (securityRef.current && !securityRef.current.contains(event.target as Node)) {
        setIsSecurityOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingAnomaliesCount = fraudAnomalies.filter((a) => a.status === 'PENDING_INVESTIGATION').length;
  const currentCourier = staff.find((s) => s.id === currentUser.id || s.phone === currentUser.emailOrPhone);

  const isOwner = currentUser.isAuthenticated && (currentUser.assignedRingLevel === 1 || currentUser.hierarchyRank === 1);
  const isSupervisor = currentUser.isAuthenticated && (currentUser.assignedRingLevel === 2 || currentUser.hierarchyRank === 2);
  const isAccountant = currentUser.isAuthenticated && (currentUser.assignedRingLevel === 3 || currentUser.hierarchyRank === 3);
  const isCourier = currentUser.isAuthenticated && (currentUser.assignedRingLevel === 4 || currentUser.hierarchyRank === 4);
  const isMerchant = currentUser.isAuthenticated && (currentUser.assignedRingLevel === 5 || currentUser.hierarchyRank === 5);
  const isGuestOrCustomer = !currentUser.isAuthenticated || currentRole === 'CUSTOMER';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* 1. TOP BAR - Role & Security Status (Clean, domain-focused, strictly visible by circle) */}

      {/* A. CUSTOMER / GUEST TOP BAR */}
      {isGuestOrCustomer && (
        <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-bold">مشاوير للخدمات اللوجستية:</span>
              <span className="text-slate-300 hidden sm:inline">
                توصيل فوري لجميع محافظات مصر مع تسليم آمن وتشفير OTP
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenComplaintsDesk}
                className="flex items-center gap-1 text-rose-300 hover:text-white transition-colors cursor-pointer font-bold"
              >
                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                <span>الشكاوى وحل النزاعات</span>
              </button>
              <span className="text-slate-700">|</span>
              <button
                onClick={onOpenAuthModal}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3 h-3 shrink-0" />
                <span>دخول الموظفين والشركاء (تحليل الهوية)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A2. JOB SEEKER TOP BAR */}
      {currentRole === 'JOB_SEEKER' && (
        <div className="bg-amber-950 text-amber-200 px-4 py-1.5 text-xs border-b border-amber-900">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-bold">بوابة التوظيف المفتوحة - انضم لكباتن مشاوير:</span>
              <span className="text-amber-100/90 hidden sm:inline">تعيين فوري، تأمين شامل، ودخل شهري يصل لـ 20,000 ج.م</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateToView('MERCHANT', undefined, 'بوابة التاجر')}
                className="text-amber-300 hover:text-white transition-colors cursor-pointer font-bold"
              >
                بوابة التجار
              </button>
              <span className="text-amber-800">|</span>
              <button
                onClick={() => navigateToView('CUSTOMER', undefined, 'الصفحة الرئيسية')}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. MERCHANT TOP BAR (الدائرة #5) */}
      {currentRole === 'MERCHANT' && (
        <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-400 font-bold">بوابة التاجر المعتمدة (الدائرة #5):</span>
              <span className="text-white font-medium">{currentUser.name}</span>
              <span className="text-emerald-400 font-medium hidden md:inline">· نظام التوريد اليومي ومحفظة COD نشط</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenComplaintsDesk}
                className="flex items-center gap-1 text-rose-300 hover:text-white transition-colors font-bold cursor-pointer"
              >
                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                <span>الشكاوى والدعم الفني</span>
              </button>
              <span className="text-slate-700">|</span>
              <button
                onClick={logoutUser}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3 shrink-0" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. COURIER TOP BAR (الدائرة #4) */}
      {currentRole === 'COURIER' && (
        <div className="bg-purple-950 text-slate-200 px-4 py-1.5 text-xs border-b border-purple-900">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <span className="text-purple-300 font-bold">دائرة العمليات الميدانية (الدائرة #4):</span>
              <span className="text-white font-medium">{currentUser.name}</span>
              {currentCourier && (
                <span className="text-amber-300 font-mono font-bold hidden sm:inline">
                  · العهدة النقدية: {currentCourier.currentCashHeld} ج.م / {currentCourier.maxCashLimit} ج.م
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenComplaintsDesk}
                className="flex items-center gap-1 text-rose-300 hover:text-white transition-colors font-bold cursor-pointer"
              >
                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                <span>الدعم والشكاوى الميدانية</span>
              </button>
              <span className="text-purple-800">|</span>
              <button
                onClick={logoutUser}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3 shrink-0" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. ACCOUNTANT TOP BAR (الدائرة #3) */}
      {currentRole === 'ACCOUNTANT' && (
        <div className="bg-emerald-950 text-slate-200 px-4 py-1.5 text-xs border-b border-emerald-900">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-bold">الدائرة المالية وتدقيق الخزينة (الدائرة #3):</span>
              <span className="text-white font-medium">{currentUser.name}</span>
              <span className="text-emerald-400 font-medium hidden md:inline">· تدقيق توريدات كاش المناديب وتسويات إنستاباي</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={logoutUser}
                className="flex items-center gap-1 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3 shrink-0" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E. OPERATIONS / SUPERVISOR TOP BAR (الدائرة #2) */}
      {currentRole === 'OPERATIONS' && (
        <div className="bg-blue-950 text-slate-200 px-4 py-1.5 text-xs border-b border-blue-900">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-blue-300 font-bold">مشرف العمليات والموارد (الدائرة #2):</span>
              <span className="text-white font-medium">{currentUser.name}</span>
              <span className="text-blue-300 font-medium hidden md:inline">· توزيع الشحنات الجغرافية وتعيين المناديب</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={logoutUser}
                className="flex items-center gap-1 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3 shrink-0" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F. ROOT OWNER & GENERAL MANAGER TOP BAR (الدائرة #1) */}
      {currentRole === 'ADMIN' && (
        <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-400 font-bold hidden sm:inline">نواة المنظومة والمدير العام (الدائرة #1)</span>
              <span className="text-slate-400 hidden md:inline">· إشراف كامل ورقابة مركزية</span>

              {pendingAnomaliesCount > 0 && (
                <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0"></span>
                  <span>{pendingAnomaliesCount} تنبيه سلوك</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-white font-bold truncate max-w-[130px]">
                  {currentUser.name.split('(')[0]}
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-400/10 px-1 rounded">
                  النواة #1
                </span>
              </div>

              <button
                onClick={resetToDemoData}
                title="استعادة البيانات التوضيحية الافتراضية"
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">استعادة البيانات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN NAV BAR - STRICTLY CUSTOMIZED BY USER RANK */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Right Section: Logo + Smart Back Button + Home */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Clickable Logo */}
            <button
              onClick={() => {
                navigateToView('CUSTOMER', undefined, 'الصفحة الرئيسية');
              }}
              className="flex items-center gap-2.5 text-right hover:opacity-90 transition-all cursor-pointer group focus:outline-none shrink-0"
              title="الصفحة الرئيسية - مشاوير"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 group-hover:bg-amber-500 flex items-center justify-center text-amber-400 group-hover:text-slate-950 shadow-sm transition-colors shrink-0">
                <Truck className="w-5 h-5 shrink-0" />
              </div>
              <div className="hidden sm:block text-right">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">
                    مَشَاوِيرْ
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                    لوجستكس
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal">
                  {currentRole === 'MERCHANT'
                    ? 'بوابة التاجر (الدائرة 5)'
                    : currentRole === 'COURIER'
                    ? 'دائرة المندوب (الدائرة 4)'
                    : currentRole === 'ACCOUNTANT'
                    ? 'الخزينة والمالية (الدائرة 3)'
                    : currentRole === 'OPERATIONS'
                    ? 'مشرف العمليات (الدائرة 2)'
                    : isOwner
                    ? 'نواة المنظومة والمدير العام'
                    : 'المنظومة اللوجستية الذكية'}
                </p>
              </div>
            </button>

            {/* Smart Back Button (Visible when history exists) */}
            {canGoBack && (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 transition-all shadow-xs cursor-pointer group shrink-0"
                title={`الرجوع إلى: ${previousPageLabel || 'الصفحة السابقة'}`}
              >
                <ArrowRight className="w-4 h-4 text-amber-700 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                <span className="font-bold">رجوع</span>
                {previousPageLabel && (
                  <span className="hidden md:inline text-amber-800 font-medium text-[11px] truncate max-w-[120px]">
                    ({previousPageLabel})
                  </span>
                )}
              </button>
            )}

            {/* Dedicated Home Icon Button */}
            <button
              onClick={() => navigateToView('CUSTOMER', undefined, 'الصفحة الرئيسية')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                currentRole === 'CUSTOMER'
                  ? 'bg-amber-400 text-slate-950 border border-amber-500 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="الصفحة الرئيسية العامة"
            >
              <Home className="w-4 h-4 text-slate-900 shrink-0" />
              <span className="hidden sm:inline">الرئيسية</span>
            </button>
          </div>

          {/* Left Section: STRICTLY CUSTOMIZED ICONS FOR EACH ROLE (محدش يشوف خصائص الدائرة الأعلى) */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* ==================================================== */}
            {/* 1. PUBLIC GUEST / CUSTOMER ICONS (قبل تسجيل الدخول) */}
            {/* ==================================================== */}
            {isGuestOrCustomer && (
              <>
                <button
                  onClick={() => navigateToView('MERCHANT', undefined, 'بوابة التاجر')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer shrink-0"
                  title="الانتقال إلى بوابة وتطبيق التجار"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>بوابة التجار</span>
                </button>

                <button
                  onClick={() => navigateToView('JOB_SEEKER', undefined, 'بوابة التوظيف')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer shrink-0"
                  title="التقديم على وظيفة كابتن توصيل أو كادر لوجستي"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>طلب عمل جديد</span>
                </button>

                <button
                  onClick={onOpenTracking}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer shrink-0"
                  title="تتبع شحنة مباشرة برقم البوليصة"
                >
                  <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="hidden md:inline">تتبع شحنتك</span>
                </button>

                <button
                  onClick={onOpenOrderParser}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer shrink-0"
                  title="محلل رسائل الواتساب واستخراج الطلبات بالذكاء الاصطناعي"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden lg:inline">محلل الواتساب</span>
                </button>

                <button
                  onClick={onOpenAiChat}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer shrink-0"
                  title="المساعد الذكي لمشاوير"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="hidden lg:inline">المساعد الذكي</span>
                </button>

                <button
                  onClick={onOpenComplaintsDesk}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 transition-all cursor-pointer shrink-0 border border-rose-200"
                  title="مكتب الشكاوى وحل النزاعات"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="hidden sm:inline">الشكاوى</span>
                </button>

                {/* Primary Entrance CTA: Login & Analyze Identity */}
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 transition-all shadow-sm cursor-pointer shrink-0 border border-amber-500"
                  title="تسجيل الدخول وتحليل الهوية أو عبر حساب Google"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>دخول المنظومة / Google</span>
                </button>
              </>
            )}

            {/* ==================================================== */}
            {/* 1.5. JOB SEEKER ICONS (بوابة التوظيف المفتوحة) */}
            {/* ==================================================== */}
            {currentRole === 'JOB_SEEKER' && (
              <>
                <button
                  onClick={() => navigateToView('MERCHANT', undefined, 'بوابة التاجر')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer shrink-0"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>بوابة التجار</span>
                </button>

                <button
                  onClick={onOpenAiChat}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all cursor-pointer shrink-0"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>مساعد التوظيف الذكي</span>
                </button>

                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 transition-all shadow-sm cursor-pointer shrink-0 border border-amber-500"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>دخول الموظفين والشركاء</span>
                </button>
              </>
            )}

            {/* ==================================================== */}
            {/* 2. COURIER FIELD ICONS (الدائرة #4 - العمليات الميدانية) */}
            {/* ==================================================== */}
            {currentRole === 'COURIER' && (
              <>
                <button
                  onClick={onOpenTracking}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-purple-900 hover:bg-purple-800 text-purple-200 transition-all cursor-pointer shrink-0 shadow-xs"
                  title="مسح باركود الشحنة وتأكيد التسليم"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">ماسح الباركود</span>
                </button>

                <button
                  onClick={onOpenComplaintsDesk}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 transition-all cursor-pointer shrink-0 border border-rose-200"
                  title="الدعم الميداني وحالات الطوارئ"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="hidden sm:inline">الدعم الميداني</span>
                </button>
              </>
            )}

            {/* ==================================================== */}
            {/* 3. MERCHANT ICONS (الدائرة #5 - الشركاء والمتاجر) */}
            {/* ==================================================== */}
            {currentRole === 'MERCHANT' && (
              <>
                <button
                  onClick={onOpenOrderParser}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all cursor-pointer shrink-0 border border-emerald-200"
                  title="تحليل رسائل الواتساب بالذكاء الاصطناعي واستخراج الطلبات"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden sm:inline">محلل الواتساب</span>
                </button>

                <button
                  onClick={onOpenTracking}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer shrink-0"
                  title="تتبع شحنة مباشرة"
                >
                  <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="hidden sm:inline">تتبع شحنة</span>
                </button>

                <button
                  onClick={onOpenComplaintsDesk}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 transition-all cursor-pointer shrink-0 border border-rose-200"
                  title="الشكاوى والدعم الفني للمتجر"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="hidden sm:inline">الدعم الفني</span>
                </button>
              </>
            )}

            {/* ==================================================== */}
            {/* 4. ACCOUNTANT ICONS (الدائرة #3 - المالية والخزينة) */}
            {/* ==================================================== */}
            {currentRole === 'ACCOUNTANT' && (
              <>
                <button
                  onClick={() => setActiveAdminTab('FINANCE')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                    activeAdminTab === 'FINANCE'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
                  }`}
                  title="الخزينة والتسويات المالية"
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">الخزينة والتسويات</span>
                </button>

                <button
                  onClick={() => setActiveAdminTab('SHIPMENTS')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                    activeAdminTab === 'SHIPMENTS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                  title="مراجعة تحصيلات الشحنات"
                >
                  <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">الشحنات</span>
                </button>
              </>
            )}

            {/* ==================================================== */}
            {/* 5. OPERATIONS SUPERVISOR ICONS (الدائرة #2 - الإشراف) */}
            {/* ==================================================== */}
            {currentRole === 'OPERATIONS' && (
              <>
                <button
                  onClick={() => setActiveAdminTab('SHIPMENTS')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                    activeAdminTab === 'SHIPMENTS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                  title="إدارة وتوزيع الشحنات"
                >
                  <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">الشحنات والتوزيع</span>
                </button>

                <button
                  onClick={() => setActiveAdminTab('ONBOARDING_SUPERVISION')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                    activeAdminTab === 'ONBOARDING_SUPERVISION'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-900'
                  }`}
                  title="رقابة وتعيين كادر العمل"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="hidden sm:inline">تسجيل العاملين</span>
                </button>

                <button
                  onClick={() => setActiveAdminTab('PICKUPS')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                    activeAdminTab === 'PICKUPS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                  title="جدولة استلام الشحنات"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="hidden sm:inline">الاستلامات</span>
                </button>
              </>
            )}

            {/* ==================================================== */}
            {/* 6. ADMIN / OWNER ICONS (الدائرة #1 - النواة والإدارة العليا) */}
            {/* ==================================================== */}
            {currentRole === 'ADMIN' && (
              <>
                {/* Unified Smart Tools Hub */}
                <div className="relative" ref={toolsRef}>
                  <button
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                      isToolsOpen
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                    title="قائمة الأدوات الذكية والمساعدات"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="hidden sm:inline">الأدوات الذكية</span>
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform shrink-0 ${isToolsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isToolsOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-slate-500 font-bold text-[11px] flex items-center justify-between">
                        <span>مركز الأدوات والذكاء الاصطناعي</span>
                        <Bot className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </div>

                      <div className="py-1 space-y-0.5">
                        <button
                          onClick={() => {
                            onOpenAiChat();
                            setIsToolsOpen(false);
                          }}
                          className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-amber-500 shrink-0" />
                            <div>
                              <div className="font-bold text-xs">مساعد مشاوير الذكي</div>
                              <div className="text-[10px] text-slate-500">استفسارات وتوجيه الطلبات</div>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            onOpenOrderParser();
                            setIsToolsOpen(false);
                          }}
                          className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div>
                              <div className="font-bold text-xs">محلل رسائل الواتساب</div>
                              <div className="text-[10px] text-slate-500">استخراج العناوين والطلبات آلياً</div>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            onOpenTracking();
                            setIsToolsOpen(false);
                          }}
                          className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-blue-500 shrink-0" />
                            <div>
                              <div className="font-bold text-xs">تتبع شحنة مباشرة</div>
                              <div className="text-[10px] text-slate-500">رقم البوليصة والحالة الحية</div>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            onOpenComplaintsDesk();
                            setIsToolsOpen(false);
                          }}
                          className="w-full text-right px-3 py-2 rounded-xl hover:bg-rose-50 flex items-center justify-between text-rose-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                            <div>
                              <div className="font-bold text-xs">مكتب الشكاوى وحل النزاعات</div>
                              <div className="text-[10px] text-rose-600">تحكيم ذكي بإشراف العمليات</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Core Security & Onion Rings Hub (خاص بالمالك فقط) */}
                <div className="relative" ref={securityRef}>
                  <button
                    onClick={() => setIsSecurityOpen(!isSecurityOpen)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                      isSecurityOpen || showOnionView
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                    title="الرقابة الأمنية ودوائر البصلة"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="hidden sm:inline">الأمان والدوائر</span>
                    {pendingAnomaliesCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                        {pendingAnomaliesCount}
                      </span>
                    )}
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isSecurityOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSecurityOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-slate-500 font-bold text-[11px] flex items-center justify-between">
                        <span>إدارة الأمان والدوائر الخمس</span>
                        <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      </div>

                      <div className="py-1 space-y-0.5">
                        <button
                          onClick={() => {
                            if (onSelectAdminTab) onSelectAdminTab('FRAUD_SHIELD');
                            setIsSecurityOpen(false);
                          }}
                          className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                            <div>
                              <div className="font-bold text-xs">درع مكافحة الفساد</div>
                              <div className="text-[10px] text-slate-500">كشف التلاعب السلوكي والمالي</div>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            if (onToggleOnionView) onToggleOnionView();
                            setIsSecurityOpen(false);
                          }}
                          className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                            <div>
                              <div className="font-bold text-xs">مستكشف دوائر البصلة</div>
                              <div className="text-[10px] text-slate-500">عرض الصلاحيات متحدة المركز</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {showOnionView ? 'إخفاء' : 'عرض'}
                          </span>
                        </button>

                        <div className="border-t border-slate-100 my-1 pt-1">
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400">
                            محاكاة تجربة أي طبقة (خاص بالمالك):
                          </div>

                          <button
                            onClick={() => {
                              navigateToView('MERCHANT', undefined, 'بوابة التاجر');
                              setIsSecurityOpen(false);
                            }}
                            className="w-full text-right px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
                          >
                            <span>معاينة طبقة التاجر</span>
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>

                          <button
                            onClick={() => {
                              navigateToView('COURIER', undefined, 'دائرة المندوب');
                              setIsSecurityOpen(false);
                            }}
                            className="w-full text-right px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
                          >
                            <span>معاينة طبقة المندوب الميداني</span>
                            <Truck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          </button>

                          <button
                            onClick={() => {
                              navigateToView('CUSTOMER', undefined, 'الصفحة الرئيسية');
                              setIsSecurityOpen(false);
                            }}
                            className="w-full text-right px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
                          >
                            <span>معاينة واجهة الزائر العام</span>
                            <Search className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Instant Real-Time Notifications Center */}
            <NotificationsCenterDropdown />

            {/* User Account / Identity Badge Button (Only for Authenticated Users) */}
            {currentUser.isAuthenticated && (
              <div className="relative" ref={roleRef}>
                <button
                  onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer bg-slate-900 text-white hover:bg-slate-800 shadow-xs shrink-0"
                  title="إدارة الحساب والرتبة"
                >
                  {currentUser.isGoogleUser ? (
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  ) : (
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="hidden md:inline font-bold">
                    {currentUser.name.split('(')[0]}
                  </span>
                  <span className="md:hidden">الحساب</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isRoleMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isRoleMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl mb-2 border border-slate-100">
                      <div className="font-black text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                        <span>{currentUser.department}</span>
                        <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded text-[10px]">
                          دائرة #{currentUser.assignedRingLevel}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          onOpenAuthModal();
                          setIsRoleMenuOpen(false);
                        }}
                        className="w-full text-right px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold flex items-center justify-between cursor-pointer"
                      >
                        <span>تبديل الدائرة الأمنية / دخول جديد</span>
                        <LogIn className="w-4 h-4 text-amber-700 shrink-0" />
                      </button>

                      <button
                        onClick={() => {
                          logoutUser();
                          setIsRoleMenuOpen(false);
                        }}
                        className="w-full text-right px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 font-bold flex items-center justify-between cursor-pointer"
                      >
                        <span>تسجيل الخروج والعودة للعامة</span>
                        <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
