import React, { useState } from 'react';
import { LogisticsProvider, useLogistics } from './context/LogisticsContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { StaffManagement } from './components/StaffManagement';
import { ShipmentsManager } from './components/ShipmentsManager';
import { PickupScheduler } from './components/PickupScheduler';
import { ZeroCorruptionShield } from './components/ZeroCorruptionShield';
import { OperationsAgenda } from './components/OperationsAgenda';
import { FinancialSettlements } from './components/FinancialSettlements';
import { CourierAppView } from './components/CourierAppView';
import { MerchantPortalView } from './components/MerchantPortalView';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AiOrderParserModal } from './components/AiOrderParserModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { UnifiedAuthModal } from './components/UnifiedAuthModal';
import { OnionRingNavigator } from './components/OnionRingNavigator';
import { StaffOnboardingAndSupervisionRing } from './components/StaffOnboardingAndSupervisionRing';
import { WorkerTasksAndProfileRing } from './components/WorkerTasksAndProfileRing';
import { SmartComplaintsAiDesk } from './components/SmartComplaintsAiDesk';
import { JobSeekerPortalView } from './components/JobSeekerPortalView';
import { ToastNotificationContainer } from './components/ToastNotificationContainer';
import { WeeklyCourierPerformanceReport } from './components/WeeklyCourierPerformanceReport';
import {
  Package,
  Users,
  Calendar,
  ShieldAlert,
  CalendarCheck,
  Coins,
  Bot,
  Truck,
  Building2,
  Sparkles,
  Layers,
  UserCheck,
  ClipboardList,
  Crown,
  Home,
  ArrowRight,
  X,
  Lock,
  BarChart3,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    agenda,
    fraudAnomalies,
    onboardingApplications,
    activeAdminTab,
    setActiveAdminTab,
    canGoBack,
    previousPageLabel,
    goBack,
    navigateToView,
    getRoleLabel,
    canAccessRole,
    canAccessCircle,
    canAccessAdminTab,
    clearanceNotice,
    setClearanceNotice,
  } = useLogistics();

  // Modals state
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isOrderParserOpen, setIsOrderParserOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isComplaintsDeskOpen, setIsComplaintsDeskOpen] = useState(false);
  const [showOnionView, setShowOnionView] = useState(false);

  const pendingAnomaliesCount = fraudAnomalies.filter((a) => a.status === 'PENDING_INVESTIGATION').length;
  const newAgendaCount = agenda.filter((t) => t.status === 'NEW').length;
  const pendingOnboardingCount = onboardingApplications.filter((a) => a.status === 'PENDING_AUDIT').length;

  const isOwnerPreviewing = currentUser.assignedRingLevel === 1 && currentRole !== 'ADMIN';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Real-time Toast Notifications Container (Floating Top-Left) */}
      <ToastNotificationContainer />

      {/* Global Header */}
      <Header
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onOpenOrderParser={() => setIsOrderParserOpen(true)}
        onOpenTracking={() => setIsTrackingModalOpen(true)}
        onOpenNewPickup={() => {
          setActiveAdminTab('PICKUPS');
          if (currentRole === 'CUSTOMER') setCurrentRole('ADMIN');
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenComplaintsDesk={() => setIsComplaintsDeskOpen(true)}
        onToggleOnionView={() => setShowOnionView(!showOnionView)}
        showOnionView={showOnionView}
        onSelectAdminTab={(tab) => setActiveAdminTab(tab as any)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hierarchical Clearance Barrier Alert Banner */}
        {clearanceNotice && (
          <div className="bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold">{clearanceNotice}</span>
            </div>
            <button
              onClick={() => setClearanceNotice(null)}
              className="p-1 hover:bg-rose-100 rounded-lg text-rose-700 cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Owner Layer Simulation Alert Bar */}
        {isOwnerPreviewing && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm font-bold text-xs border border-amber-600">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-slate-950 text-amber-400">
                <Crown className="w-4 h-4" />
              </span>
              <span>
                أنت في "نمط معاينة تجربة الطبقة: (
                {currentRole === 'MERCHANT' ? 'التاجر' : currentRole === 'COURIER' ? 'المندوب الميداني' : 'الزائر العام'}
                )" بصفتك صاحب المنظومة والمدير العام. لن يرى أصحاب هذه الطبقة أية أدوات إدارية.
              </span>
            </div>

            <button
              onClick={() => setCurrentRole('ADMIN')}
              className="px-3 py-1 bg-slate-950 text-white hover:bg-slate-900 rounded-xl text-xs transition-colors cursor-pointer"
            >
              العودة للوحة الإدارة العامة الكاملة
            </button>
          </div>
        )}

        {/* Onion Ring Security Architecture Visualizer (can be toggled from header) */}
        {showOnionView && canAccessCircle(1) && (
          <div className="animate-in fade-in slide-in-from-top-3">
            <OnionRingNavigator
              onSelectRing={(level) => {
                if (level === 2) setActiveAdminTab('ONBOARDING_SUPERVISION');
                else if (level === 4) setActiveAdminTab('WORKER_OPERATIONS');
                else if (level === 3) setActiveAdminTab('FINANCE');
              }}
            />
          </div>
        )}

        {/* VIEW 1: Public Landing Page & Tracking */}
        {currentRole === 'CUSTOMER' && (
          <LandingPage
            onOpenAiChat={() => setIsAiChatOpen(true)}
            onOpenOrderParser={() => setIsOrderParserOpen(true)}
            onOpenComplaintsDesk={() => setIsComplaintsDeskOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* VIEW 2: Courier Field View & Tasks */}
        {currentRole === 'COURIER' && (
          <div className="space-y-6">
            {/* Courier Breadcrumbs & Back Bar */}
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs text-xs">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {canGoBack && (
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold border border-amber-300 rounded-xl transition-colors cursor-pointer shrink-0"
                    title={`الرجوع إلى: ${previousPageLabel || 'السابق'}`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                    <span>رجوع</span>
                    {previousPageLabel && <span className="hidden sm:inline text-amber-700 font-normal">({previousPageLabel})</span>}
                  </button>
                )}
                <button
                  onClick={() => navigateToView('CUSTOMER', undefined, 'الصفحة الرئيسية')}
                  className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>الرئيسية</span>
                </button>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-purple-700 shrink-0">دائرة العمليات الميدانية للمندوب (الدائرة #4)</span>
              </div>

              <span className="text-[11px] bg-purple-50 text-purple-800 font-bold px-3 py-1 rounded-full border border-purple-200 shrink-0 hidden sm:inline">
                الدائرة الأمنية #4
              </span>
            </div>

            <WorkerTasksAndProfileRing />
            <div className="pt-6 border-t border-slate-200">
              <CourierAppView />
            </div>
          </div>
        )}

        {/* VIEW 3: Merchant Portal View */}
        {currentRole === 'MERCHANT' && (
          <div className="space-y-6">
            {/* Merchant Breadcrumbs & Back Bar */}
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs text-xs">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {canGoBack && (
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold border border-amber-300 rounded-xl transition-colors cursor-pointer shrink-0"
                    title={`الرجوع إلى: ${previousPageLabel || 'السابق'}`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                    <span>رجوع</span>
                    {previousPageLabel && <span className="hidden sm:inline text-amber-700 font-normal">({previousPageLabel})</span>}
                  </button>
                )}
                <button
                  onClick={() => navigateToView('CUSTOMER', undefined, 'الصفحة الرئيسية')}
                  className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>الرئيسية</span>
                </button>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-slate-800 shrink-0">بوابة التاجر والمتجر (الدائرة #5)</span>
              </div>

              <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full border border-slate-200 shrink-0 hidden sm:inline">
                الشركاء التجاريين
              </span>
            </div>

            <MerchantPortalView
              onOpenOrderParser={() => setIsOrderParserOpen(true)}
              onOpenNewPickup={() => setIsAiChatOpen(true)}
            />
          </div>
        )}

        {/* VIEW 3.5: Job Seeker & Careers Portal */}
        {currentRole === 'JOB_SEEKER' && (
          <div className="space-y-6">
            {/* Job Seeker Breadcrumbs & Back Bar */}
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs text-xs">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {canGoBack && (
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold border border-amber-300 rounded-xl transition-colors cursor-pointer shrink-0"
                    title={`الرجوع إلى: ${previousPageLabel || 'السابق'}`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                    <span>رجوع</span>
                    {previousPageLabel && <span className="hidden sm:inline text-amber-700 font-normal">({previousPageLabel})</span>}
                  </button>
                )}
                <button
                  onClick={() => navigateToView('CUSTOMER', undefined, 'الصفحة الرئيسية')}
                  className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>الرئيسية</span>
                </button>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-amber-700 shrink-0">بوابة التوظيف وطلب العمل الجديد</span>
              </div>

              <span className="text-[11px] bg-amber-50 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200 shrink-0 hidden sm:inline">
                انضم لأسطول مشاوير
              </span>
            </div>

            <JobSeekerPortalView />
          </div>
        )}

        {/* VIEW 4: Operations & HQ (Admin / Supervisor / Accountant) */}
        {(currentRole === 'ADMIN' ||
          currentRole === 'OPERATIONS' ||
          currentRole === 'ACCOUNTANT') && (
          <div className="space-y-6">
            {/* Admin Breadcrumb Navigation & Quick Back Bar */}
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                {canGoBack && (
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold border border-amber-300 rounded-xl transition-colors cursor-pointer shrink-0"
                    title={`الرجوع إلى: ${previousPageLabel || 'السابق'}`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                    <span>رجوع</span>
                    {previousPageLabel && (
                      <span className="hidden sm:inline text-amber-800 font-normal">({previousPageLabel})</span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => navigateToView('CUSTOMER', undefined, 'الصفحة الرئيسية')}
                  className="text-slate-500 hover:text-slate-900 font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>الرئيسية</span>
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-slate-700 font-bold shrink-0">
                  لوحة الإدارة والعمليات (الدائرة #{currentUser.assignedRingLevel})
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-amber-600 font-black shrink-0">
                  {getRoleLabel(currentRole, activeAdminTab)}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-medium hidden md:flex items-center gap-1 shrink-0">
                <span>نموذج الدوائر الأمنية المعتمد</span>
              </div>
            </div>

            {/* Admin Internal Sub-nav Tabs - Structured, Responsive, and Never Overflowing */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => navigateToView('CUSTOMER', undefined, 'الصفحة الرئيسية')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 shadow-xs shrink-0"
                title="الانتقال إلى الصفحة الرئيسية العامة (واجهة مشاوير للزوار والتجار)"
              >
                <Home className="w-4 h-4 text-amber-700 shrink-0" />
                <span>الصفحة الرئيسية</span>
              </button>

              {canAccessAdminTab('SHIPMENTS') && (
                <button
                  onClick={() => setActiveAdminTab('SHIPMENTS')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeAdminTab === 'SHIPMENTS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>الشحنات والاستلامات والمرتجعات</span>
                </button>
              )}

              {canAccessAdminTab('ONBOARDING_SUPERVISION') && (
                <button
                  onClick={() => setActiveAdminTab('ONBOARDING_SUPERVISION')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeAdminTab === 'ONBOARDING_SUPERVISION'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>الدائرة الإدارية: تسجيل العاملين والرقابة</span>
                  {pendingOnboardingCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                      {pendingOnboardingCount}
                    </span>
                  )}
                </button>
              )}

              {canAccessAdminTab('WORKER_OPERATIONS') && (
                <button
                  onClick={() => setActiveAdminTab('WORKER_OPERATIONS')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeAdminTab === 'WORKER_OPERATIONS'
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>دائرة العاملين: مهام الأعمال والبيانات</span>
                </button>
              )}

              {canAccessAdminTab('AGENDA') && (
                <button
                  onClick={() => setActiveAdminTab('AGENDA')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeAdminTab === 'AGENDA'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>جدول الأعمال والأرشفة الذكية</span>
                  {newAgendaCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                      {newAgendaCount}
                    </span>
                  )}
                </button>
              )}

              {/* Fraud Shield - STRICTLY Core Ring 1 (Owner Only) */}
              {canAccessAdminTab('FRAUD_SHIELD') && (
                <button
                  onClick={() => setActiveAdminTab('FRAUD_SHIELD')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeAdminTab === 'FRAUD_SHIELD'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>درع النزاهة ومكافحة الفساد (خاص بالمالك)</span>
                  {pendingAnomaliesCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold shrink-0">
                      {pendingAnomaliesCount}
                    </span>
                  )}
                </button>
              )}

              {/* Staff Tree - STRICTLY Core Ring 1 (Owner Only) */}
              {canAccessAdminTab('STAFF') && (
                <button
                  onClick={() => setActiveAdminTab('STAFF')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeAdminTab === 'STAFF'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>الهيكل التنظيمي وكادر الشركة</span>
                </button>
              )}

              {canAccessAdminTab('PICKUPS') && (
                <button
                  onClick={() => setActiveAdminTab('PICKUPS')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeAdminTab === 'PICKUPS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>جدولة الاستلام من المتاجر</span>
                </button>
              )}

              {canAccessAdminTab('FINANCE') && (
                <button
                  onClick={() => setActiveAdminTab('FINANCE')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeAdminTab === 'FINANCE'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>الخزينة والتسويات المالية</span>
                </button>
              )}

              {canAccessAdminTab('COURIER_REPORTS') && (
                <button
                  onClick={() => setActiveAdminTab('COURIER_REPORTS')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeAdminTab === 'COURIER_REPORTS'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>تقارير أداء المناديب (Recharts)</span>
                </button>
              )}
            </div>

            {/* Sub-view Content with Hierarchical Access Enforcement */}
            {activeAdminTab === 'SHIPMENTS' && canAccessAdminTab('SHIPMENTS') && <ShipmentsManager />}
            {activeAdminTab === 'ONBOARDING_SUPERVISION' && canAccessAdminTab('ONBOARDING_SUPERVISION') && <StaffOnboardingAndSupervisionRing />}
            {activeAdminTab === 'WORKER_OPERATIONS' && canAccessAdminTab('WORKER_OPERATIONS') && <WorkerTasksAndProfileRing />}
            {activeAdminTab === 'AGENDA' && canAccessAdminTab('AGENDA') && <OperationsAgenda />}
            {activeAdminTab === 'FRAUD_SHIELD' && canAccessAdminTab('FRAUD_SHIELD') && <ZeroCorruptionShield />}
            {activeAdminTab === 'STAFF' && canAccessAdminTab('STAFF') && <StaffManagement />}
            {activeAdminTab === 'PICKUPS' && canAccessAdminTab('PICKUPS') && <PickupScheduler />}
            {activeAdminTab === 'FINANCE' && canAccessAdminTab('FINANCE') && <FinancialSettlements />}
            {activeAdminTab === 'COURIER_REPORTS' && canAccessAdminTab('COURIER_REPORTS') && <WeeklyCourierPerformanceReport />}
          </div>
        )}
      </main>

      {/* Floating AI Assistant Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsAiChatOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-slate-900 hover:bg-slate-800 text-white p-3.5 sm:px-4 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 transition-all hover:scale-105 cursor-pointer group"
        title="المساعد الذكي للرد على العملاء والتجار وأرشفة الطلبات"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-amber-400" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-ping"></span>
        </div>
        <span className="hidden sm:inline text-xs font-bold">مساعد مشاوير الذكي</span>
      </button>

      {/* Modals */}
      <UnifiedAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <AiAssistantModal isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
      <AiOrderParserModal isOpen={isOrderParserOpen} onClose={() => setIsOrderParserOpen(false)} />
      <OrderTrackingModal isOpen={isTrackingModalOpen} onClose={() => setIsTrackingModalOpen(false)} />
      {isComplaintsDeskOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <SmartComplaintsAiDesk
            isModal={true}
            onClose={() => setIsComplaintsDeskOpen(false)}
          />
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <LogisticsProvider>
      <MainContent />
    </LogisticsProvider>
  );
}
