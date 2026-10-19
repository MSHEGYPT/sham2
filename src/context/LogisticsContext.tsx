import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  StaffMember,
  Shipment,
  PickupSchedule,
  AgendaTask,
  FraudAnomaly,
  WhistleblowerReport,
  Merchant,
  ShipmentStatus,
  UserRole,
  OnionRingLevel,
  AuthUser,
  WorkerTask,
  OnboardingApplication,
  FulfillmentItem,
  PayoutTransaction,
  GovernorateCoverage,
  NavigationHistoryEntry,
  MerchantRegistrationData,
  JobApplicantData,
  AppNotification,
} from '../types';
import {
  INITIAL_STAFF,
  INITIAL_MERCHANTS,
  INITIAL_SHIPMENTS,
  INITIAL_PICKUPS,
  INITIAL_AGENDA,
  INITIAL_FRAUD_ANOMALIES,
  INITIAL_WHISTLEBLOWER_REPORTS,
  INITIAL_WORKER_TASKS,
  INITIAL_ONBOARDING_APPLICATIONS,
  ONION_RINGS_CONFIG,
  EGYPT_GOVERNORATES_COVERAGE,
  INITIAL_FULFILLMENT_ITEMS,
  INITIAL_PAYOUT_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';
import { soundManager } from '../utils/audioChime';
import { signInWithGoogle, logoutFromFirebase, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LogisticsContextType {
  // Authentication & Onion Rings
  currentUser: AuthUser;
  currentRingLevel: OnionRingLevel;
  setCurrentRingLevel: (level: OnionRingLevel) => void;
  loginUser: (identifier: string, role: UserRole | string) => Promise<{ success: boolean; aiAudit?: any }>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string; error?: string }>;
  registerUser: (formData: any) => Promise<{ success: boolean; aiAudit?: any; message: string }>;
  logoutUser: () => void;
  quickSwitchUser: (presetId: 'OWNER' | 'SUPERVISOR' | 'ACCOUNTANT' | 'COURIER' | 'MERCHANT' | 'CUSTOMER') => void;

  // Active Role and Persona
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeCourierId: string;
  setActiveCourierId: (id: string) => void;
  activeMerchantId: string;
  setActiveMerchantId: (id: string) => void;

  // Navigation & History Tracking (إجراء الرجوع وسجل التنقل)
  navigationHistory: NavigationHistoryEntry[];
  canGoBack: boolean;
  previousPageLabel: string | null;
  goBack: () => void;
  navigateToView: (role: UserRole, adminTab?: string, label?: string) => void;
  activeAdminTab: string;
  setActiveAdminTab: (tab: any) => void;
  getRoleLabel: (role: UserRole, adminTab?: string) => string;

  // Hierarchical Access & Visibility Guards (الرؤية الهرمية - محدش يشوف خصائص الدائرة الأعلى)
  canAccessRole: (role: UserRole) => boolean;
  canAccessCircle: (ringLevel: OnionRingLevel) => boolean;
  canAccessAdminTab: (tab: string) => boolean;
  clearanceNotice: string | null;
  setClearanceNotice: (notice: string | null) => void;

  // Data
  staff: StaffMember[];
  merchants: Merchant[];
  shipments: Shipment[];
  pickups: PickupSchedule[];
  agenda: AgendaTask[];
  fraudAnomalies: FraudAnomaly[];
  whistleblowerReports: WhistleblowerReport[];
  workerTasks: WorkerTask[];
  onboardingApplications: OnboardingApplication[];

  // Bosta-Inspired Capabilities: Fulfillment, Next-Day Payouts, Governorates Coverage
  fulfillmentItems: FulfillmentItem[];
  payoutTransactions: PayoutTransaction[];
  governoratesCoverage: GovernorateCoverage[];
  requestMerchantPayout: (
    merchantId: string,
    amount: number,
    method: 'INSTAPAY' | 'BANK_TRANSFER' | 'FAWRY' | 'WALLET',
    accountDetails: string
  ) => { success: boolean; message: string; transaction?: PayoutTransaction };
  registerMerchant: (data: MerchantRegistrationData) => Merchant;

  // Onion Rings Operations
  addWorkerTask: (task: Omit<WorkerTask, 'id'>) => WorkerTask;
  updateWorkerTaskStatus: (id: string, status: WorkerTask['status']) => void;
  submitOnboardingApplication: (app: Omit<OnboardingApplication, 'id' | 'submittedAt' | 'status' | 'aiClearanceScore' | 'aiClearanceReport'>) => Promise<OnboardingApplication>;
  approveOnboardingApplication: (id: string, reviewerNotes?: string) => void;
  rejectOnboardingApplication: (id: string, reviewerNotes?: string) => void;

  // Actions
  addStaffMember: (data: Omit<StaffMember, 'id' | 'totalDelivered' | 'successRate' | 'rating' | 'fraudAlertsCount' | 'ringLevel'> & { ringLevel?: OnionRingLevel }) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  toggleStaffStatus: (id: string) => void;

  addShipment: (data: {
    merchantId: string;
    merchantName: string;
    merchantPhone: string;
    recipientName: string;
    recipientPhone: string;
    recipientPhoneAlt?: string;
    city: string;
    district: string;
    address: string;
    itemsDescription: string;
    itemQuantity: number;
    codAmount: number;
    shippingFee: number;
    assignedCourierId?: string;
    scheduledPickupDate?: string;
    orderType?: 'STANDARD' | 'EXCHANGE' | 'RETURN';
    allowInspection?: boolean;
    exchangeDetails?: string;
  }) => Shipment;

  verifyAndDeliverShipment: (
    trackingNumber: string,
    otpCode: string,
    collectedAmount: number,
    courierName: string,
    courierId: string
  ) => { success: boolean; message: string };

  recordReturnOrPartial: (
    trackingNumber: string,
    type: 'PARTIAL_DELIVERY' | 'RETURN_PENDING' | 'RETURNED_TO_MERCHANT',
    reason: string,
    notes: string,
    actorName: string,
    partialAmount?: number
  ) => void;

  assignShipmentCourier: (trackingNumber: string, courierId: string) => void;

  addPickupSchedule: (data: Omit<PickupSchedule, 'id'>) => void;
  updatePickupStatus: (id: string, status: PickupSchedule['status'], actualCount?: number) => void;

  addAgendaTask: (task: Omit<AgendaTask, 'id' | 'createdAt'>) => AgendaTask;
  updateAgendaStatus: (id: string, status: AgendaTask['status']) => void;
  updateAgendaTask: (id: string, updates: Partial<AgendaTask>) => void;
  updateShipmentSchedule: (
    trackingNumber: string,
    updates: {
      assignedCourierId?: string;
      assignedCourierName?: string;
      scheduledPickupDate?: string;
      scheduledDeliveryWindow?: string;
      trafficNotes?: string;
    }
  ) => void;

  addWhistleblowerReport: (report: Omit<WhistleblowerReport, 'id' | 'timestamp' | 'status'>) => void;

  recordCashDeposit: (courierId: string, amount: number) => { success: boolean; message: string };

  runAiFraudAudit: () => Promise<any>;

  // Real-Time Toast Notifications System
  notifications: AppNotification[];
  activeToasts: AppNotification[];
  unreadNotificationsCount: number;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'timestamp' | 'read'>) => AppNotification;
  dismissToast: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  simulateEventNotification: (preset: 'NEW_ORDER_COURIER' | 'DELIVERED_MERCHANT' | 'RETURN_WARNING' | 'SMART_SCHEDULE' | 'COURIER_PROXIMITY_DELIVERY' | 'COURIER_PROXIMITY_PICKUP') => void;
  triggerProximityAlert: (params: {
    courierId?: string;
    courierName?: string;
    stopType: 'DELIVERY' | 'PICKUP';
    title: string;
    targetName: string;
    address: string;
    distanceMeters: number;
    phone?: string;
    trackingNumber?: string;
    codAmount?: number;
    otpSecret?: string;
    parcelsCount?: number;
  }) => AppNotification;

  getShipmentByTracking: (trackingNumber: string) => Shipment | undefined;
  resetToDemoData: () => void;
}

export const DEFAULT_GUEST_USER: AuthUser = {
  id: 'USR-GUEST-00',
  name: 'زائر عام (غير مسجل)',
  role: 'CUSTOMER',
  emailOrPhone: '',
  department: 'البوابة العامة والتتبع',
  assignedRingLevel: 5,
  ringName: 'الدائرة العامة (الزوار والعملاء)',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  joinedDate: new Date().toISOString().slice(0, 10),
  isAuthenticated: false,
  hierarchyRank: 0,
};

export const DEFAULT_OWNER_USER: AuthUser = {
  id: 'USR-ROOT-01',
  name: 'م. طارق العسقلاني (صاحب المنظومة والمدير العام)',
  role: 'ADMIN',
  emailOrPhone: '01011122334',
  nationalId: '28905141203491',
  department: 'الإدارة العليا المركزية',
  assignedRingLevel: 1, // النواة
  ringName: 'الدائرة الأولى (نواة المنظومة - المدير العام وصاحب الموقع)',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  joinedDate: '2023-01-15',
  isAuthenticated: true,
  hierarchyRank: 1,
};

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistent storage helper
  const loadStorage = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(`sanad_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  // Auth & Onion Ring Level - Defaults to Public Guest if not previously authenticated
  const [currentUser, setCurrentUser] = useState<AuthUser>(() =>
    loadStorage('current_user', DEFAULT_GUEST_USER)
  );
  const [currentRingLevel, setCurrentRingLevel] = useState<OnionRingLevel>(
    currentUser.assignedRingLevel || 5
  );

  // Active Role and Personas
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (currentUser.isAuthenticated && currentUser.role) {
      if (currentUser.role === 'ADMIN') return 'ADMIN';
      if (currentUser.role === 'OPERATIONS' || currentUser.role === 'OPERATIONS_SUPERVISOR') return 'OPERATIONS';
      if (currentUser.role === 'ACCOUNTANT') return 'ACCOUNTANT';
      if (currentUser.role === 'COURIER') return 'COURIER';
      if (currentUser.role === 'MERCHANT') return 'MERCHANT';
    }
    return 'CUSTOMER';
  });
  const [activeAdminTab, setActiveAdminTab] = useState<string>('SHIPMENTS');
  const [activeCourierId, setActiveCourierId] = useState<string>('STF-04');
  const [activeMerchantId, setActiveMerchantId] = useState<string>('MCH-101');
  const [clearanceNotice, setClearanceNotice] = useState<string | null>(null);

  // Strict Hierarchical Guard: Check if current user is allowed to access targetRole
  const canAccessRole = (role: UserRole): boolean => {
    if (role === 'CUSTOMER' || role === 'JOB_SEEKER') return true; // Public homepage and job applicant portal are accessible to everyone
    if (!currentUser.isAuthenticated) return false; // Non-authenticated users cannot access any internal circle
    const rank = currentUser.hierarchyRank ?? (currentUser.assignedRingLevel || 0);

    // Rank 1 (Owner / Admin) can access all roles
    if (rank === 1) return true;

    // Rank 2 (Operations / Supervisor) can access Operations, Courier, Merchant, Customer. CANNOT access Admin root.
    if (rank === 2) {
      return role === 'OPERATIONS' || role === 'COURIER' || role === 'MERCHANT';
    }

    // Rank 3 (Accountant) can ONLY access Accountant
    if (rank === 3) {
      return role === 'ACCOUNTANT';
    }

    // Rank 4 (Courier) can ONLY access Courier
    if (rank === 4) {
      return role === 'COURIER';
    }

    // Rank 5 (Merchant) can ONLY access Merchant
    if (rank === 5) {
      return role === 'MERCHANT';
    }

    return false;
  };

  // Strict Hierarchical Guard for Onion Ring Levels
  const canAccessCircle = (ringLevel: OnionRingLevel): boolean => {
    if (!currentUser.isAuthenticated) return false;
    const rank = currentUser.hierarchyRank ?? (currentUser.assignedRingLevel || 0);
    if (rank === 1) return true; // Owner has full oversight
    if (rank === 2) return ringLevel >= 2; // Supervisor can access ring 2..5, but NOT ring 1
    return rank === ringLevel; // Lower circles can only access their designated circle
  };

  // Strict Hierarchical Guard for Admin/Operations sub-tabs
  const canAccessAdminTab = (tab: string): boolean => {
    if (!currentUser.isAuthenticated) return false;
    const rank = currentUser.hierarchyRank ?? (currentUser.assignedRingLevel || 0);
    if (rank === 1) return true; // Owner has all tabs
    if (rank === 2) {
      // Supervisor: can access operations tabs, NOT Fraud shield (whistleblower confidential) or Staff salaries
      return ['SHIPMENTS', 'ONBOARDING_SUPERVISION', 'WORKER_OPERATIONS', 'AGENDA', 'PICKUPS', 'COURIER_REPORTS'].includes(tab);
    }
    if (rank === 3) {
      // Accountant: can access Finance, Shipments and Courier Reports
      return ['FINANCE', 'SHIPMENTS', 'COURIER_REPORTS'].includes(tab);
    }
    return false;
  };

  // Navigation History Stack (سجل التنقل وإجراء الرجوع)
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([]);

  const getRoleLabel = (role: UserRole, adminTab?: string): string => {
    if (role === 'CUSTOMER') return 'الصفحة الرئيسية للزوار';
    if (role === 'JOB_SEEKER') return 'بوابة التوظيف وطلب العمل الجديد';
    if (role === 'MERCHANT') return 'بوابة التاجر والمتجر';
    if (role === 'COURIER') return 'دائرة العمليات الميدانية للمندوب';
    if (role === 'ADMIN' || role === 'OPERATIONS' || role === 'ACCOUNTANT') {
      const tab = adminTab || activeAdminTab;
      switch (tab) {
        case 'SHIPMENTS': return 'الشحنات والاستلامات';
        case 'ONBOARDING_SUPERVISION': return 'الدائرة الإدارية ورقابة العاملين';
        case 'WORKER_OPERATIONS': return 'دائرة مهام الأعمال والبيانات';
        case 'AGENDA': return 'جدول الأعمال والأرشفة';
        case 'FRAUD_SHIELD': return 'درع النزاهة ومكافحة الفساد';
        case 'STAFF': return 'الهيكل التنظيمي وكادر الشركة';
        case 'PICKUPS': return 'جدولة استلام الشحنات';
        case 'FINANCE': return 'الخزينة والتسويات المالية';
        case 'COURIER_REPORTS': return 'تقارير أداء المناديب الأسبوعية';
        default: return 'لوحة إدارة المنظومة';
      }
    }
    return 'الرئيسية';
  };

  const navigateToView = (targetRole: UserRole, targetTab?: string, label?: string) => {
    // Check hierarchical role clearance
    if (!canAccessRole(targetRole)) {
      setClearanceNotice(
        `عفواً، هذه الواجهة مخصصة للدائرة الأمنية الأعلى. رتبتك الحالية هي: (${currentUser.name} - الدائرة #${currentUser.assignedRingLevel}). لا يمكن تخطي التدرج الهرمي للصلاحيات.`
      );
      return;
    }

    // Check tab clearance if targetTab is requested
    if (targetTab && !canAccessAdminTab(targetTab)) {
      setClearanceNotice(
        `عفواً، هذا القسم يتطلب صلاحيات الدائرة الأولى (المدير العام والمالك). رتبتك الحالية لا تتيح لك الوصول لهذا الإجراء.`
      );
      return;
    }

    setClearanceNotice(null);
    const entry: NavigationHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: currentRole,
      adminTab: activeAdminTab,
      label: label || getRoleLabel(currentRole, activeAdminTab),
      timestamp: Date.now(),
    };

    setNavigationHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === currentRole && last.adminTab === activeAdminTab) {
        return prev;
      }
      return [...prev.slice(-15), entry];
    });

    setCurrentRole(targetRole);
    if (targetTab) {
      setActiveAdminTab(targetTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (navigationHistory.length === 0) return;
    const historyCopy = [...navigationHistory];
    const previousEntry = historyCopy.pop();
    if (!previousEntry) return;

    setNavigationHistory(historyCopy);
    setCurrentRole(previousEntry.role);
    if (previousEntry.adminTab) {
      setActiveAdminTab(previousEntry.adminTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canGoBack = navigationHistory.length > 0;
  const previousPageLabel = navigationHistory.length > 0
    ? navigationHistory[navigationHistory.length - 1].label
    : null;

  useEffect(() => {
    const handlePopState = () => {
      if (navigationHistory.length > 0) {
        goBack();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigationHistory]);


  // Core Data
  const [staff, setStaff] = useState<StaffMember[]>(() => loadStorage('staff', INITIAL_STAFF));
  const [merchants, setMerchants] = useState<Merchant[]>(() => loadStorage('merchants', INITIAL_MERCHANTS));
  const [shipments, setShipments] = useState<Shipment[]>(() => loadStorage('shipments', INITIAL_SHIPMENTS));
  const [pickups, setPickups] = useState<PickupSchedule[]>(() => loadStorage('pickups', INITIAL_PICKUPS));
  const [agenda, setAgenda] = useState<AgendaTask[]>(() => loadStorage('agenda', INITIAL_AGENDA));
  const [fraudAnomalies, setFraudAnomalies] = useState<FraudAnomaly[]>(() =>
    loadStorage('fraud', INITIAL_FRAUD_ANOMALIES)
  );
  const [whistleblowerReports, setWhistleblowerReports] = useState<WhistleblowerReport[]>(() =>
    loadStorage('whistleblower', INITIAL_WHISTLEBLOWER_REPORTS)
  );
  const [workerTasks, setWorkerTasks] = useState<WorkerTask[]>(() =>
    loadStorage('worker_tasks', INITIAL_WORKER_TASKS)
  );
  const [onboardingApplications, setOnboardingApplications] = useState<OnboardingApplication[]>(() =>
    loadStorage('onboarding_apps', INITIAL_ONBOARDING_APPLICATIONS)
  );

  // Bosta-Inspired Capabilities State
  const [fulfillmentItems, setFulfillmentItems] = useState<FulfillmentItem[]>(() =>
    loadStorage('fulfillment_items', INITIAL_FULFILLMENT_ITEMS)
  );
  const [payoutTransactions, setPayoutTransactions] = useState<PayoutTransaction[]>(() =>
    loadStorage('payout_transactions', INITIAL_PAYOUT_TRANSACTIONS)
  );
  const [governoratesCoverage] = useState<GovernorateCoverage[]>(EGYPT_GOVERNORATES_COVERAGE);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('sanad_current_user', JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('sanad_staff', JSON.stringify(staff));
  }, [staff]);
  useEffect(() => {
    localStorage.setItem('sanad_merchants', JSON.stringify(merchants));
  }, [merchants]);
  useEffect(() => {
    localStorage.setItem('sanad_shipments', JSON.stringify(shipments));
  }, [shipments]);
  useEffect(() => {
    localStorage.setItem('sanad_pickups', JSON.stringify(pickups));
  }, [pickups]);
  useEffect(() => {
    localStorage.setItem('sanad_agenda', JSON.stringify(agenda));
  }, [agenda]);
  useEffect(() => {
    localStorage.setItem('sanad_fraud', JSON.stringify(fraudAnomalies));
  }, [fraudAnomalies]);
  useEffect(() => {
    localStorage.setItem('sanad_whistleblower', JSON.stringify(whistleblowerReports));
  }, [whistleblowerReports]);
  useEffect(() => {
    localStorage.setItem('sanad_worker_tasks', JSON.stringify(workerTasks));
  }, [workerTasks]);
  useEffect(() => {
    localStorage.setItem('sanad_onboarding_apps', JSON.stringify(onboardingApplications));
  }, [onboardingApplications]);
  useEffect(() => {
    localStorage.setItem('sanad_fulfillment_items', JSON.stringify(fulfillmentItems));
  }, [fulfillmentItems]);
  useEffect(() => {
    localStorage.setItem('sanad_payout_transactions', JSON.stringify(payoutTransactions));
  }, [payoutTransactions]);

  // Notifications & Real-Time Toasts State
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadStorage('notifications', INITIAL_NOTIFICATIONS)
  );
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [isSoundEnabled, setIsSoundEnabledState] = useState<boolean>(() => soundManager.isSoundEnabled);

  const setIsSoundEnabled = (enabled: boolean) => {
    setIsSoundEnabledState(enabled);
    soundManager.setSoundEnabled(enabled);
  };

  useEffect(() => {
    localStorage.setItem('sanad_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const dismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setActiveToasts([]);
  };

  const addNotification = (
    notifData: Omit<AppNotification, 'id' | 'createdAt' | 'timestamp' | 'read'>
  ): AppNotification => {
    const id = `NTF-${Date.now().toString().slice(-5)}`;
    const newNotif: AppNotification = {
      ...notifData,
      id,
      timestamp: 'الآن',
      createdAt: Date.now(),
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Push into active floating toasts (limit up to 4 concurrent toasts)
    setActiveToasts((prev) => [newNotif, ...prev.slice(0, 3)]);

    // Play pleasant domain-specific chime sound
    if (notifData.type === 'PROXIMITY_ALERT') {
      soundManager.play('proximity');
    } else if (notifData.type === 'NEW_DELIVERY_ORDER') {
      soundManager.play('new_order');
    } else if (notifData.type === 'OTP_VERIFIED' || notifData.type === 'PAYOUT_PROCESSED') {
      soundManager.play('delivered');
    } else if (notifData.type === 'ALERT_WARNING') {
      soundManager.play('warning');
    } else {
      soundManager.play('status_change');
    }

    // Auto dismiss toast after 7.5 seconds for proximity alerts or 6.5s
    const dismissDuration = notifData.type === 'PROXIMITY_ALERT' ? 8000 : 6500;
    setTimeout(() => {
      dismissToast(id);
    }, dismissDuration);

    return newNotif;
  };

  const triggerProximityAlert = (params: {
    courierId?: string;
    courierName?: string;
    stopType: 'DELIVERY' | 'PICKUP';
    title: string;
    targetName: string;
    address: string;
    distanceMeters: number;
    phone?: string;
    trackingNumber?: string;
    codAmount?: number;
    otpSecret?: string;
    parcelsCount?: number;
  }) => {
    const isPickup = params.stopType === 'PICKUP';
    const distText =
      params.distanceMeters < 1000
        ? `${Math.round(params.distanceMeters)} متر`
        : `${(params.distanceMeters / 1000).toFixed(1)} كم`;

    return addNotification({
      type: 'PROXIMITY_ALERT',
      title: isPickup ? '🏬 اقتربت من نقطة استلام البضائع!' : '📍 اقتربت من موقع تسليم العميل!',
      message: isPickup
        ? `أنت على بُعد ${distText} من متجر "${params.targetName}" (${params.address}). المطلوب استلام ${params.parcelsCount || 1} طرد وتوثيق الاستلام.`
        : `أنت على بُعد ${distText} من العميل "${params.targetName}" (${params.address}). يرجى الاستعداد للاتصال وطلب كود OTP وتحصيل ${params.codAmount || 0} ج.م نقداً.`,
      targetRole: 'COURIER',
      targetUserId: params.courierId,
      priority: 'urgent',
      relatedTrackingNumber: params.trackingNumber,
      meta: {
        courierName: params.courierName,
        recipientName: !isPickup ? params.targetName : undefined,
        merchantName: isPickup ? params.targetName : undefined,
        distanceMeters: Math.round(params.distanceMeters),
        stopType: params.stopType,
        phone: params.phone,
        otpSecret: params.otpSecret,
        codAmount: params.codAmount,
        address: params.address,
        statusLabel: isPickup ? 'في نطاق الاستلام' : 'في نطاق التسليم',
      },
    });
  };

  const simulateEventNotification = (
    preset:
      | 'NEW_ORDER_COURIER'
      | 'DELIVERED_MERCHANT'
      | 'RETURN_WARNING'
      | 'SMART_SCHEDULE'
      | 'COURIER_PROXIMITY_DELIVERY'
      | 'COURIER_PROXIMITY_PICKUP'
  ) => {
    const randNum = Math.floor(8050 + Math.random() * 1500);
    const tracking = `SND-${randNum}`;
    const targetCourier = staff.find((s) => s.id === activeCourierId) || staff.find((s) => s.role === 'COURIER') || staff[0];
    const targetMerchant = merchants.find((m) => m.id === activeMerchantId) || merchants[0];

    if (preset === 'COURIER_PROXIMITY_DELIVERY') {
      const activeDelivery = shipments.find(
        (s) => s.status === 'OUT_FOR_DELIVERY' && (s.assignedCourierId === targetCourier.id || s.assignedCourierName === targetCourier.name)
      ) || shipments.find((s) => s.status === 'OUT_FOR_DELIVERY') || shipments[0];

      triggerProximityAlert({
        courierId: targetCourier.id,
        courierName: targetCourier.name,
        stopType: 'DELIVERY',
        title: 'تسليم طرد',
        targetName: activeDelivery.recipientName,
        address: `${activeDelivery.city} - ${activeDelivery.district || activeDelivery.address}`,
        distanceMeters: Math.floor(180 + Math.random() * 150),
        phone: activeDelivery.recipientPhone,
        trackingNumber: activeDelivery.trackingNumber,
        codAmount: activeDelivery.codAmount,
        otpSecret: activeDelivery.otpSecret,
      });
    } else if (preset === 'COURIER_PROXIMITY_PICKUP') {
      const activePickup = pickups.find((p) => p.status !== 'COMPLETED') || pickups[0];

      triggerProximityAlert({
        courierId: targetCourier.id,
        courierName: targetCourier.name,
        stopType: 'PICKUP',
        title: 'استلام بضائع',
        targetName: activePickup?.merchantName || targetMerchant.brandName,
        address: activePickup ? `${activePickup.city} - ${activePickup.merchantAddress}` : 'شارع النصر، المعادي',
        distanceMeters: Math.floor(220 + Math.random() * 120),
        phone: activePickup?.merchantPhone || targetMerchant.phone,
        trackingNumber: `PCK-${randNum}`,
        parcelsCount: activePickup?.expectedParcelsCount || 4,
      });
    } else if (preset === 'NEW_ORDER_COURIER') {
      addNotification({
        type: 'NEW_DELIVERY_ORDER',
        title: 'أمر توصيل جديد للكابتن 🛵',
        message: `تم إسناد شحنة جديدة إليك #${tracking} إلى العميل أ. حاتم رضوان (مدينة نصر) - المطلوب تحصيله: 640 ج.م نقداً`,
        targetRole: 'COURIER',
        targetUserId: targetCourier.id,
        priority: 'urgent',
        relatedTrackingNumber: tracking,
        meta: {
          codAmount: 640,
          district: 'مدينة نصر',
          city: 'القاهرة',
          courierName: targetCourier.name,
          recipientName: 'أ. حاتم رضوان',
          statusLabel: 'أمر تسليم جديد',
        },
      });
    } else if (preset === 'DELIVERED_MERCHANT') {
      addNotification({
        type: 'OTP_VERIFIED',
        title: 'تم تسليم الشحنة بنجاح وتوريد الكاش 💰',
        message: `تم تسليم الشحنة #${tracking} بكود OTP وتأكيد توريد مبلغ 950 ج.م لمحفظة المتجر (${targetMerchant.brandName}).`,
        targetRole: 'MERCHANT',
        targetUserId: targetMerchant.id,
        priority: 'high',
        relatedTrackingNumber: tracking,
        meta: {
          codAmount: 950,
          merchantName: targetMerchant.brandName,
          statusLabel: 'تم التسليم بنجاح',
        },
      });
    } else if (preset === 'RETURN_WARNING') {
      addNotification({
        type: 'ALERT_WARNING',
        title: 'تنبيه: تسجيل شحنة مرتجعة ⚠️',
        message: `الشحنة #${tracking} تم تسجيلها كمرتجع بسبب "عدم رد العميل على الهاتف بعد 3 محاولات اتصال موثقة".`,
        targetRole: 'MERCHANT',
        targetUserId: targetMerchant.id,
        priority: 'high',
        relatedTrackingNumber: tracking,
        meta: {
          statusLabel: 'مرتجع قيد الإرجاع',
        },
      });
    } else if (preset === 'SMART_SCHEDULE') {
      addNotification({
        type: 'SMART_SCHEDULE_UPDATE',
        title: 'اعتماد جدولة ذكية وتفادي الذروة ⚡',
        message: `تم تحديد أفضل نافذة استلام لشحنتك #${tracking} بين (10:30 ص - 12:00 م) لتفادي كثافات كوبري أكتوبر.`,
        targetRole: 'ALL',
        priority: 'normal',
        relatedTrackingNumber: tracking,
        meta: {
          courierName: targetCourier.name,
          statusLabel: 'تمت الجدولة الذكية',
        },
      });
    }
  };

  const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

  // Unified Login with AI Security verification
  const loginUser = async (identifier: string, roleRequested: UserRole | string) => {
    let targetUser: AuthUser = { ...DEFAULT_OWNER_USER };
    let ring: OnionRingLevel = 1;

    if (roleRequested === 'ADMIN' || roleRequested === 'GENERAL_MANAGER') {
      targetUser = {
        ...DEFAULT_OWNER_USER,
        isAuthenticated: true,
        hierarchyRank: 1,
      };
      ring = 1;
      setCurrentRole('ADMIN');
    } else if (roleRequested === 'OPERATIONS_SUPERVISOR' || roleRequested === 'OPERATIONS') {
      const s = staff.find((x) => x.role === 'OPERATIONS_SUPERVISOR') || staff[1];
      targetUser = {
        id: s.id,
        name: s.name,
        role: 'OPERATIONS',
        emailOrPhone: s.phone,
        nationalId: s.nationalId,
        department: s.department,
        assignedRingLevel: 2,
        ringName: 'الدائرة الإدارية والرقابية (المشرفون)',
        avatar: s.avatar,
        joinedDate: s.joinedDate,
        isAuthenticated: true,
        hierarchyRank: 2,
      };
      ring = 2;
      setCurrentRole('OPERATIONS');
    } else if (roleRequested === 'ACCOUNTANT') {
      const s = staff.find((x) => x.role === 'ACCOUNTANT') || staff[2];
      targetUser = {
        id: s.id,
        name: s.name,
        role: 'ACCOUNTANT',
        emailOrPhone: s.phone,
        nationalId: s.nationalId,
        department: s.department,
        assignedRingLevel: 3,
        ringName: 'الدائرة المالية وتدقيق الخزينة',
        avatar: s.avatar,
        joinedDate: s.joinedDate,
        isAuthenticated: true,
        hierarchyRank: 3,
      };
      ring = 3;
      setCurrentRole('ACCOUNTANT');
    } else if (roleRequested === 'COURIER') {
      const s = staff.find((x) => x.role === 'COURIER') || staff[3];
      targetUser = {
        id: s.id,
        name: s.name,
        role: 'COURIER',
        emailOrPhone: s.phone,
        nationalId: s.nationalId,
        department: s.department,
        assignedRingLevel: 4,
        ringName: 'دائرة العمليات الميدانية والمناديب',
        avatar: s.avatar,
        joinedDate: s.joinedDate,
        vehiclePlate: s.vehiclePlate,
        isAuthenticated: true,
        hierarchyRank: 4,
      };
      ring = 4;
      setCurrentRole('COURIER');
      setActiveCourierId(s.id);
    } else if (roleRequested === 'MERCHANT') {
      const m = merchants[0];
      targetUser = {
        id: m.id,
        name: m.brandName || m.name,
        role: 'MERCHANT',
        emailOrPhone: m.phone,
        department: 'شبكة المتاجر المتعاقدة',
        assignedRingLevel: 5,
        ringName: 'الدائرة الخارجية (الشركاء والعملاء)',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        joinedDate: '2023-10-01',
        isAuthenticated: true,
        hierarchyRank: 5,
      };
      ring = 5;
      setCurrentRole('MERCHANT');
      setActiveMerchantId(m.id);
    } else {
      targetUser = {
        id: 'USR-CUST-99',
        name: 'عميل المنصة (زائر وتتبع)',
        role: 'CUSTOMER',
        emailOrPhone: identifier || '01000000000',
        department: 'بوابة التتبع العامة',
        assignedRingLevel: 5,
        ringName: 'الدائرة الخارجية (الشركاء والعملاء)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        joinedDate: new Date().toISOString().slice(0, 10),
        isAuthenticated: false,
        hierarchyRank: 0,
      };
      ring = 5;
      setCurrentRole('CUSTOMER');
    }

    setCurrentUser(targetUser);
    setCurrentRingLevel(ring);

    // Call AI access manager to log clearance
    let aiAudit = null;
    try {
      const res = await fetch('/api/ai/access-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN',
          userData: { name: targetUser.name, phone: targetUser.emailOrPhone, id: targetUser.id },
          requestedRole: roleRequested,
        }),
      });
      aiAudit = await res.json();
    } catch (e) {
      console.warn('AI Access audit fallback active', e);
    }

    return { success: true, aiAudit };
  };

  // Unified Registration with AI screening
  const registerUser = async (formData: any) => {
    const role = formData.role || 'COURIER';
    let assignedRing: OnionRingLevel = 4;
    if (role === 'GENERAL_MANAGER' || role === 'ADMIN') assignedRing = 1;
    else if (role === 'OPERATIONS_SUPERVISOR') assignedRing = 2;
    else if (role === 'ACCOUNTANT') assignedRing = 3;
    else if (role === 'MERCHANT' || role === 'CUSTOMER') assignedRing = 5;

    let aiAudit = null;
    try {
      const res = await fetch('/api/ai/access-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGISTER_ONBOARDING',
          userData: formData,
          requestedRole: role,
        }),
      });
      aiAudit = await res.json();
    } catch (e) {
      console.warn('AI Access audit fallback active', e);
    }

    // If it's a courier or field worker, create an Onboarding Application for supervisor approval
    if (role === 'COURIER' || role === 'DISPATCHER') {
      const newApp: OnboardingApplication = {
        id: `ONB-${Date.now().toString().slice(-4)}`,
        fullName: formData.fullName || formData.name,
        phone: formData.phone,
        nationalId: formData.nationalId || '29000000000000',
        desiredRole: role,
        assignedZone: formData.zone || 'القاهرة الكبرى',
        vehicleType: formData.vehicleType || 'MOTORCYCLE',
        vehiclePlate: formData.vehiclePlate || 'س ق ص 111',
        drivingLicenseNumber: formData.drivingLicense || 'DL-PENDING',
        criminalRecordStatus: 'CLEAN',
        emergencyContact: formData.emergencyPhone || '01000000000',
        aiClearanceScore: aiAudit?.accessGranted ? 95 : 85,
        aiClearanceReport: aiAudit?.aiSecurityAudit || 'تم الفحص المبدئي بنجاح بواسطة الذكاء الاصطناعي وجاري المراجعة الإدارية.',
        status: 'PENDING_AUDIT',
        submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };

      setOnboardingApplications((prev) => [newApp, ...prev]);

      // Add to agenda for supervisors!
      addAgendaTask({
        title: `طلب انضمام عامل جديد: ${newApp.fullName}`,
        source: 'WEB_FORM',
        clientName: newApp.fullName,
        clientPhone: newApp.phone,
        type: 'general',
        priority: 'high',
        status: 'NEW',
        summary: `متقدم لدور: ${newApp.desiredRole} في منطقة: ${newApp.assignedZone} - تقييم الذكاء الاصطناعي: ${newApp.aiClearanceScore}%`,
        suggestedAction: 'مراجعة الأوراق والرقم القومي في الدائرة الإدارية والاعتماد.',
      });

      return {
        success: true,
        aiAudit,
        message: 'تم تسجيل بياناتك بنجاح وإرسال ملفك إلى الدائرة الإدارية لتدقيق الأوراق واعتماد حسابك.',
      };
    }

    // If merchant, add merchant
    if (role === 'MERCHANT') {
      const newMerchant: Merchant = {
        id: `MCH-${Date.now().toString().slice(-3)}`,
        name: formData.fullName || formData.name,
        brandName: formData.brandName || formData.fullName,
        phone: formData.phone,
        city: formData.city || 'القاهرة',
        address: formData.address || 'العنوان الرئيسي',
        businessType: formData.businessType || 'متجر إلكتروني',
        activeShipmentsCount: 0,
        deliveredCount: 0,
        returnRate: 0,
        pendingBalance: 0,
        rating: 5.0,
      };
      setMerchants((prev) => [newMerchant, ...prev]);
    }

    return {
      success: true,
      aiAudit,
      message: 'تم إنشاء الحساب بنجاح وتعيين الدائرة الأمنية وفق الصلاحيات المحددة.',
    };
  };

  // Google Sign-In with Firebase Auth & Firestore Persistence
  const loginWithGoogle = async (): Promise<{ success: boolean; message: string; error?: string }> => {
    try {
      const res = await signInWithGoogle();
      if (!res.success || !res.user) {
        return { success: false, message: 'تعذر إتمام تسجيل الدخول عبر Google', error: res.error };
      }
      const fbUser = res.user;

      let assignedRole: UserRole = 'CUSTOMER';
      let hierarchyRank = 0;
      let assignedRingLevel: OnionRingLevel = 5;
      let ringName = 'الدائرة الخامسة: الشركاء والعملاء';
      let department = 'الخدمات اللوجستية';

      const email = fbUser.email?.toLowerCase() || '';
      if (email.includes('admin') || email.includes('owner') || email === 'cado111113@gmail.com') {
        assignedRole = 'ADMIN';
        hierarchyRank = 1;
        assignedRingLevel = 1;
        ringName = 'الدائرة الأولى: نواة المنظومة (المالك)';
        department = 'الإدارة العليا والمتابعة الرقمية';
      } else if (email.includes('merchant') || email.includes('shop') || email.includes('store')) {
        assignedRole = 'MERCHANT';
        hierarchyRank = 5;
        assignedRingLevel = 5;
        ringName = 'الدائرة الخامسة: المتاجر والشركاء';
        department = 'بوابة المتاجر والشحنات';
      } else {
        assignedRole = 'MERCHANT';
        hierarchyRank = 5;
        assignedRingLevel = 5;
        ringName = 'الدائرة الخامسة: المتاجر والشركاء';
        department = 'بوابة المتاجر والشحنات';
      }

      const googleUser: AuthUser = {
        id: `USR-FB-${fbUser.uid.slice(0, 8)}`,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'مستخدم Google المعتمد',
        role: assignedRole,
        emailOrPhone: fbUser.email || fbUser.phoneNumber || '',
        department,
        assignedRingLevel,
        ringName,
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        joinedDate: new Date().toISOString().slice(0, 10),
        isAuthenticated: true,
        hierarchyRank,
        firebaseUid: fbUser.uid,
        isGoogleUser: true,
      };

      // Persist profile to Firestore
      try {
        await setDoc(doc(db, 'users', fbUser.uid), {
          id: googleUser.id,
          name: googleUser.name,
          email: fbUser.email,
          role: assignedRole,
          hierarchyRank,
          assignedRingLevel,
          ringName,
          photoURL: fbUser.photoURL,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore write note:', firestoreErr);
      }

      setCurrentUser(googleUser);
      setCurrentRole(assignedRole);
      setCurrentRingLevel(assignedRingLevel);
      setClearanceNotice(null);
      localStorage.setItem('sanad_current_user', JSON.stringify(googleUser));

      return {
        success: true,
        message: `تم التحقق بنجاح عبر Google Firebase (${googleUser.name}) مع اعتماد ${ringName}`,
      };
    } catch (err: any) {
      console.error('loginWithGoogle error:', err);
      return { success: false, message: 'حدث خطأ أثناء الاتصال بخدمة Google Firebase', error: err.message };
    }
  };

  const logoutUser = () => {
    logoutFromFirebase().catch(() => {});
    setCurrentUser(DEFAULT_GUEST_USER);
    setCurrentRingLevel(5);
    setCurrentRole('CUSTOMER');
    setNavigationHistory([]);
    setClearanceNotice(null);
    localStorage.removeItem('sanad_current_user');
  };

  // Quick 1-click switcher between personas for demo/testing
  const quickSwitchUser = (presetId: 'OWNER' | 'SUPERVISOR' | 'ACCOUNTANT' | 'COURIER' | 'MERCHANT' | 'CUSTOMER') => {
    switch (presetId) {
      case 'OWNER':
        setCurrentUser(DEFAULT_OWNER_USER);
        setCurrentRingLevel(1);
        setCurrentRole('ADMIN');
        break;
      case 'SUPERVISOR':
        loginUser('01122334455', 'OPERATIONS_SUPERVISOR');
        break;
      case 'ACCOUNTANT':
        loginUser('01233445566', 'ACCOUNTANT');
        break;
      case 'COURIER':
        loginUser('01099887766', 'COURIER');
        break;
      case 'MERCHANT':
        loginUser('01022331199', 'MERCHANT');
        break;
      case 'CUSTOMER':
        loginUser('01000000000', 'CUSTOMER');
        break;
    }
  };

  // Worker Tasks Management
  const addWorkerTask = (taskData: Omit<WorkerTask, 'id'>) => {
    const newTask: WorkerTask = {
      ...taskData,
      id: `TSK-WRK-${Date.now().toString().slice(-4)}`,
    };
    setWorkerTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateWorkerTaskStatus = (id: string, status: WorkerTask['status']) => {
    setWorkerTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              completedAt: status === 'COMPLETED' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined,
            }
          : t
      )
    );
  };

  // Onboarding Applications
  const submitOnboardingApplication = async (
    appData: Omit<OnboardingApplication, 'id' | 'submittedAt' | 'status' | 'aiClearanceScore' | 'aiClearanceReport'>
  ) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let clearanceScore = 94;
    let clearanceReport = 'اجتاز الفحص الأولي للذكاء الاصطناعي بنجاح: الرقم القومي غير مكرر بالسجلات، السجل خالي من المخالفات.';

    try {
      const res = await fetch('/api/ai/access-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ONBOARDING_APPLICATION_AUDIT',
          userData: appData,
          requestedRole: appData.desiredRole,
        }),
      });
      const data = await res.json();
      if (data.aiSecurityAudit) clearanceReport = data.aiSecurityAudit;
    } catch (e) {
      console.warn(e);
    }

    const newApp: OnboardingApplication = {
      ...appData,
      id: `ONB-${Date.now().toString().slice(-4)}`,
      submittedAt: now,
      status: 'PENDING_AUDIT',
      aiClearanceScore: clearanceScore,
      aiClearanceReport: clearanceReport,
    };

    setOnboardingApplications((prev) => [newApp, ...prev]);
    return newApp;
  };

  const approveOnboardingApplication = (id: string, reviewerNotes?: string) => {
    const app = onboardingApplications.find((a) => a.id === id);
    if (!app) return;

    setOnboardingApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'APPROVED',
              reviewedBy: currentUser.name,
              reviewNotes: reviewerNotes || 'تم الاعتماد وإصدار بطاقة الهوية الرقمية بالدائرة الميدانية.',
            }
          : a
      )
    );

    // Automatically add to staff list!
    addStaffMember({
      name: app.fullName,
      role: app.desiredRole,
      phone: app.phone,
      nationalId: app.nationalId,
      department: app.desiredRole === 'COURIER' ? 'أسطول التوصيل الميداني' : 'إدارة العمليات',
      assignedZone: app.assignedZone,
      status: 'ACTIVE',
      vehicleType: app.vehicleType,
      vehiclePlate: app.vehiclePlate,
      currentCashHeld: 0,
      maxCashLimit: 3000,
      joinedDate: new Date().toISOString().slice(0, 10),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      ringLevel: 4,
    });
  };

  const rejectOnboardingApplication = (id: string, reviewerNotes?: string) => {
    setOnboardingApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'REJECTED',
              reviewedBy: currentUser.name,
              reviewNotes: reviewerNotes || 'تم الرفض لعدم استيفاء الشروط أو نقص المستندات.',
            }
          : a
      )
    );
  };

  // Staff Management
  const addStaffMember = (data: Omit<StaffMember, 'id' | 'totalDelivered' | 'successRate' | 'rating' | 'fraudAlertsCount' | 'ringLevel'> & { ringLevel?: OnionRingLevel }) => {
    let assignedRing: OnionRingLevel = data.ringLevel || 4;
    if (data.role === 'GENERAL_MANAGER') assignedRing = 1;
    else if (data.role === 'OPERATIONS_SUPERVISOR' || data.role === 'CUSTOMER_CARE') assignedRing = 2;
    else if (data.role === 'ACCOUNTANT') assignedRing = 3;

    const newStaff: StaffMember = {
      ...data,
      id: `STF-0${staff.length + 1}`,
      totalDelivered: 0,
      successRate: 100,
      rating: 5.0,
      fraudAlertsCount: 0,
      ringLevel: assignedRing,
    };
    setStaff((prev) => [newStaff, ...prev]);
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const toggleStaffStatus = (id: string) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus = s.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  // Shipment Actions
  const addShipment = (data: {
    merchantId: string;
    merchantName: string;
    merchantPhone: string;
    recipientName: string;
    recipientPhone: string;
    recipientPhoneAlt?: string;
    city: string;
    district: string;
    address: string;
    itemsDescription: string;
    itemQuantity: number;
    codAmount: number;
    shippingFee: number;
    assignedCourierId?: string;
    scheduledPickupDate?: string;
    orderType?: 'STANDARD' | 'EXCHANGE' | 'RETURN';
    allowInspection?: boolean;
    exchangeDetails?: string;
  }) => {
    const trackingSeq = Math.floor(8000 + Math.random() * 1900);
    const trackingNumber = `SND-${trackingSeq}`;
    const otpSecret = generateOtp();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let assignedCourierName = '';
    if (data.assignedCourierId) {
      const c = staff.find((s) => s.id === data.assignedCourierId);
      if (c) assignedCourierName = c.name;
    }

    const newShipment: Shipment = {
      id: `SHP-${Date.now().toString().slice(-4)}`,
      trackingNumber,
      merchantId: data.merchantId,
      merchantName: data.merchantName,
      merchantPhone: data.merchantPhone,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      recipientPhoneAlt: data.recipientPhoneAlt,
      city: data.city,
      district: data.district,
      address: data.address,
      itemsDescription: data.itemsDescription,
      itemQuantity: data.itemQuantity,
      codAmount: data.codAmount,
      shippingFee: data.shippingFee,
      merchantShare: data.codAmount - data.shippingFee,
      status: data.assignedCourierId ? 'OUT_FOR_DELIVERY' : 'PENDING_PICKUP',
      otpSecret,
      assignedCourierId: data.assignedCourierId,
      assignedCourierName,
      scheduledPickupDate: data.scheduledPickupDate || now.slice(0, 10),
      orderType: data.orderType || 'STANDARD',
      allowInspection: data.allowInspection ?? true,
      exchangeDetails: data.exchangeDetails,
      createdAt: now,
      timeline: [
        {
          id: `EVT-${Date.now()}`,
          timestamp: now,
          status: 'PENDING_PICKUP',
          actorName: data.merchantName,
          actorRole: 'التاجر',
          notes: `تم إنشاء الشحنة بنجاح برقم تتبع ${trackingNumber}. ${data.orderType === 'EXCHANGE' ? 'طلب استبدال فوري.' : ''} ${data.allowInspection ? 'مسموح بالمعاينة.' : 'غير مسموح بالمعاينة.'}`,
        },
      ],
    };

    setShipments((prev) => [newShipment, ...prev]);

    // Update merchant active count
    setMerchants((prev) =>
      prev.map((m) =>
        m.id === data.merchantId ? { ...m, activeShipmentsCount: m.activeShipmentsCount + 1 } : m
      )
    );

    // Also automatically create a task for the assigned courier in their ring!
    if (data.assignedCourierId) {
      addWorkerTask({
        title: `توصيل طرد ${trackingNumber} إلى ${data.recipientName} ${data.orderType === 'EXCHANGE' ? '(استبدال فوري)' : ''}`,
        taskType: 'DELIVERY_DISPATCH',
        assignedCourierId: data.assignedCourierId,
        assignedCourierName,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: data.scheduledPickupDate || now.slice(0, 10),
        timeWindow: 'خلال اليوم',
        location: `${data.city} - ${data.district}`,
        relatedShipmentTracking: trackingNumber,
        expectedCod: data.codAmount,
        notes: `محتويات: ${data.itemsDescription} ${data.allowInspection ? '| المعاينة مسموحة' : ''}`,
      });

      // Notification for Courier: New delivery order
      addNotification({
        type: 'NEW_DELIVERY_ORDER',
        title: 'أمر توصيل جديد للكابتن 🛵',
        message: `تم إسناد شحنة جديدة إليك #${trackingNumber} في (${data.district}) - تحصيل COD: ${data.codAmount} ج.م`,
        targetRole: 'COURIER',
        targetUserId: data.assignedCourierId,
        priority: 'urgent',
        relatedTrackingNumber: trackingNumber,
        meta: {
          codAmount: data.codAmount,
          district: data.district,
          city: data.city,
          courierName: assignedCourierName,
          recipientName: data.recipientName,
          statusLabel: 'أمر تسليم جديد',
        },
      });
    }

    // Notification for Merchant: New shipment registered
    addNotification({
      type: 'STATUS_CHANGE',
      title: 'تم تسجيل طلب الشحن بنجاح 📦',
      message: `تم إنشاء الشحنة #${trackingNumber} إلى ${data.recipientName} (${data.district}) بقيمة تحصيل ${data.codAmount} ج.م`,
      targetRole: 'MERCHANT',
      targetUserId: data.merchantId,
      priority: 'normal',
      relatedTrackingNumber: trackingNumber,
      meta: {
        codAmount: data.codAmount,
        district: data.district,
        city: data.city,
        merchantName: data.merchantName,
        recipientName: data.recipientName,
        statusLabel: 'في انتظار الاستلام',
      },
    });

    return newShipment;
  };

  // Bosta-Inspired Next-Day COD Payout Request
  const requestMerchantPayout = (
    merchantId: string,
    amount: number,
    method: 'INSTAPAY' | 'BANK_TRANSFER' | 'FAWRY' | 'WALLET',
    accountDetails: string
  ) => {
    const merchant = merchants.find((m) => m.id === merchantId) || merchants[0];
    const prefix = method === 'INSTAPAY' ? 'IPN' : method === 'FAWRY' ? 'FWR' : 'BNK';
    const referenceNumber = `${prefix}-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newTx: PayoutTransaction = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      merchantId,
      merchantName: merchant.brandName || merchant.name,
      amount,
      method,
      referenceNumber,
      status: 'COMPLETED',
      accountDetails,
      createdAt: now,
    };

    setPayoutTransactions((prev) => [newTx, ...prev]);

    // Add to agenda for operations & finance records
    addAgendaTask({
      title: `تحويل مستحقات تاجر فوري: ${merchant.brandName} (${amount} ج.م)`,
      source: 'MERCHANT_APP',
      clientName: merchant.brandName,
      clientPhone: merchant.phone,
      type: 'general',
      priority: 'high',
      status: 'RESOLVED',
      summary: `تم التحويل عبر ${method} للحساب: ${accountDetails} برقم مرجعي: ${referenceNumber}`,
      suggestedAction: 'تقييد العملية في ميزان المراجعة اليومي.',
    });

    return {
      success: true,
      message: `تم تحويل مبلغ ${amount.toLocaleString('ar-EG')} ج.م بنجاح إلى حساب ${accountDetails} عبر ${method} (رقم مرجعي: ${referenceNumber}).`,
      transaction: newTx,
    };
  };

  const registerMerchant = (data: MerchantRegistrationData): Merchant => {
    const newId = `MCH-${Date.now().toString().slice(-4)}`;
    const newMerchant: Merchant = {
      id: newId,
      name: data.name,
      brandName: data.brandName,
      phone: data.phone,
      city: data.city,
      address: data.address,
      businessType: data.businessType || 'تجارة إلكترونية عامة',
      activeShipmentsCount: 0,
      deliveredCount: 0,
      returnRate: 0,
      pendingBalance: 0,
      rating: 5.0,
    };

    setMerchants((prev) => [newMerchant, ...prev]);
    setActiveMerchantId(newId);

    // Automatically create a notification task in operations agenda
    addAgendaTask({
      title: `انضمام تاجر جديد للمنظومة: ${data.brandName}`,
      source: 'MERCHANT_APP',
      clientName: data.brandName,
      clientPhone: data.phone,
      type: 'merchant_partnership',
      priority: 'high',
      status: 'NEW',
      summary: `تم تسجيل متجر (${data.brandName}) لصاحبه (${data.name}) في ${data.city} - ${data.address}. النشاط: ${data.businessType}. وسيلة التحويل / إنستاباي: ${data.bankOrInstaPay || 'لم تسجل بعد'}.`,
      suggestedAction: 'تواصل منسق العمليات لتأكيد أول استلام شحنات (First Pickup) وتسليم بوالص الشحن.',
    });

    return newMerchant;
  };

  const verifyAndDeliverShipment = (
    trackingNumber: string,
    otpCode: string,
    collectedAmount: number,
    courierName: string,
    courierId: string
  ): { success: boolean; message: string } => {
    const shipment = shipments.find((s) => s.trackingNumber === trackingNumber);
    if (!shipment) {
      return { success: false, message: 'الشحنة غير موجودة' };
    }

    // Anti-fraud check: Validate OTP
    if (shipment.otpSecret.trim() !== otpCode.trim()) {
      const anomaly: FraudAnomaly = {
        id: `ANOM-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: 'OTP_BYPASS_ATTEMPT',
        severity: 'CRITICAL',
        employeeName: courierName,
        employeeId: courierId,
        shipmentTracking: trackingNumber,
        description: `محاولة تأكيد تسليم خاطئة برمز أمان غير متطابق (أُدخل: ${otpCode}، الصحيح: ${shipment.otpSecret}). حظر النظام العملية لمنع الادعاء الوهمي بالتسليم.`,
        evidence: `فشل مطابقة الرمز السري لشحنة بقيمة ${shipment.codAmount} ج.م للعميل ${shipment.recipientName}`,
        status: 'PENDING_INVESTIGATION',
      };
      setFraudAnomalies((prev) => [anomaly, ...prev]);

      setStaff((prev) =>
        prev.map((s) => (s.id === courierId ? { ...s, fraudAlertsCount: s.fraudAlertsCount + 1 } : s))
      );

      return {
        success: false,
        message: 'عفواً! رمز الأمان (OTP) غير صحيح! لا يمكن تأكيد التسليم إلا بالرمز السري المستلم لدى العميل لمنع التلاعب.',
      };
    }

    // Anti-fraud check: Check price discrepancy
    if (collectedAmount !== shipment.codAmount) {
      const diffAnomaly: FraudAnomaly = {
        id: `ANOM-${Date.now()}-DIFF`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: 'PRICE_TAMPERING',
        severity: 'HIGH',
        employeeName: courierName,
        employeeId: courierId,
        shipmentTracking: trackingNumber,
        description: `فارق في المبلغ المحصل: الفاتورة مسجلة بقيمة ${shipment.codAmount} ج.م بينما تم تحصيل ${collectedAmount} ج.م من العميل.`,
        evidence: `فرق مالي قدره ${collectedAmount - shipment.codAmount} ج.م`,
        status: 'PENDING_INVESTIGATION',
      };
      setFraudAnomalies((prev) => [diffAnomaly, ...prev]);
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Update shipment
    setShipments((prev) =>
      prev.map((s) => {
        if (s.trackingNumber === trackingNumber) {
          return {
            ...s,
            status: 'DELIVERED',
            collectedAmount,
            deliveredAt: now,
            timeline: [
              ...s.timeline,
              {
                id: `EVT-${Date.now()}`,
                timestamp: now,
                status: 'DELIVERED',
                actorName: courierName,
                actorRole: 'المندوب',
                notes: `تم التحقق بنجاح من رمز الأمان OTP (${otpCode}) وتسليم الطرد للعميل وتحصيل مبلغ ${collectedAmount} ج.م نقداً.`,
                otpVerified: true,
                collectedAmount,
              },
            ],
          };
        }
        return s;
      })
    );

    // Update courier cash-on-hand
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === courierId) {
          const newCash = s.currentCashHeld + collectedAmount;
          return {
            ...s,
            currentCashHeld: newCash,
            totalDelivered: s.totalDelivered + 1,
          };
        }
        return s;
      })
    );

    // Update worker task
    setWorkerTasks((prev) =>
      prev.map((t) =>
        t.relatedShipmentTracking === trackingNumber
          ? { ...t, status: 'COMPLETED', completedAt: now }
          : t
      )
    );

    // Update merchant pending balance & delivered stats
    setMerchants((prev) =>
      prev.map((m) => {
        if (m.id === shipment.merchantId) {
          const merchantNet = collectedAmount - shipment.shippingFee;
          return {
            ...m,
            deliveredCount: m.deliveredCount + 1,
            activeShipmentsCount: Math.max(0, m.activeShipmentsCount - 1),
            pendingBalance: m.pendingBalance + merchantNet,
          };
        }
        return m;
      })
    );

    // Toast for Merchant: Delivery confirmed and COD credited
    addNotification({
      type: 'OTP_VERIFIED',
      title: 'تم تسليم الشحنة بنجاح وتوريد الكاش 💰',
      message: `تم تسليم الشحنة #${trackingNumber} بكود OTP وتأكيد توريد مبلغ ${collectedAmount} ج.م لحساب محفظتك.`,
      targetRole: 'MERCHANT',
      targetUserId: shipment.merchantId,
      priority: 'high',
      relatedTrackingNumber: trackingNumber,
      meta: {
        codAmount: collectedAmount,
        recipientName: shipment.recipientName,
        statusLabel: 'تم التسليم بنجاح',
      },
    });

    // Toast for Courier: OTP confirmed & cash logged
    addNotification({
      type: 'OTP_VERIFIED',
      title: 'إتمام ناجح للشحنة بكود الأمان ✅',
      message: `تم التحقق بنجاح من كود OTP للشحنة #${trackingNumber} وإضافة ${collectedAmount} ج.م لعهدتك النقدية.`,
      targetRole: 'COURIER',
      targetUserId: courierId,
      priority: 'normal',
      relatedTrackingNumber: trackingNumber,
      meta: {
        codAmount: collectedAmount,
        statusLabel: 'تم التسليم بنجاح',
      },
    });

    return { success: true, message: 'تم تأكيد التسليم بنجاح وتحديث العهدة النقدية ومستحقات التاجر.' };
  };

  const recordReturnOrPartial = (
    trackingNumber: string,
    type: 'PARTIAL_DELIVERY' | 'RETURN_PENDING' | 'RETURNED_TO_MERCHANT',
    reason: string,
    notes: string,
    actorName: string,
    partialAmount: number = 0
  ) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const targetShipment = shipments.find((s) => s.trackingNumber === trackingNumber);

    setShipments((prev) =>
      prev.map((s) => {
        if (s.trackingNumber === trackingNumber) {
          return {
            ...s,
            status: type,
            returnReason: reason,
            returnNotes: notes,
            collectedAmount: partialAmount,
            timeline: [
              ...s.timeline,
              {
                id: `EVT-${Date.now()}`,
                timestamp: now,
                status: type,
                actorName,
                actorRole: 'العمليات / المندوب',
                notes: `تسجيل حالة ${type === 'PARTIAL_DELIVERY' ? 'تسليم جزئي' : 'مرتجع'}: ${reason}. ${notes}`,
                collectedAmount: partialAmount,
              },
            ],
          };
        }
        return s;
      })
    );

    // Toast notification for Merchant & Operations
    if (targetShipment) {
      addNotification({
        type: 'ALERT_WARNING',
        title: 'تنبيه: تسجيل شحنة مرتجعة ⚠️',
        message: `الشحنة #${trackingNumber} تم تسجيلها كـ (${type === 'PARTIAL_DELIVERY' ? 'تسليم جزئي' : 'مرتجع'}). السبب: ${reason}`,
        targetRole: 'MERCHANT',
        targetUserId: targetShipment.merchantId,
        priority: 'high',
        relatedTrackingNumber: trackingNumber,
        meta: {
          statusLabel: type === 'PARTIAL_DELIVERY' ? 'تسليم جزئي' : 'مرتجع',
          recipientName: targetShipment.recipientName,
        },
      });
    }
  };

  const assignShipmentCourier = (trackingNumber: string, courierId: string) => {
    const courier = staff.find((s) => s.id === courierId);
    if (!courier) return;

    const targetShipment = shipments.find((s) => s.trackingNumber === trackingNumber);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setShipments((prev) =>
      prev.map((s) => {
        if (s.trackingNumber === trackingNumber) {
          return {
            ...s,
            assignedCourierId: courierId,
            assignedCourierName: courier.name,
            status: 'OUT_FOR_DELIVERY',
            timeline: [
              ...s.timeline,
              {
                id: `EVT-${Date.now()}`,
                timestamp: now,
                status: 'OUT_FOR_DELIVERY',
                actorName: 'مشرف التوزيع',
                actorRole: 'العمليات',
                notes: `تم إسناد الشحنة للكابتن ${courier.name} وتغيير الحالة إلى "مع المندوب للتوزيع".`,
              },
            ],
          };
        }
        return s;
      })
    );

    // Toast for Courier: New delivery order
    addNotification({
      type: 'NEW_DELIVERY_ORDER',
      title: 'أمر توصيل جديد للكابتن 🛵',
      message: `تم إسناد الشحنة #${trackingNumber} إليك لتوصيلها إلى ${targetShipment?.recipientName || 'العميل'} (${targetShipment?.district || ''})`,
      targetRole: 'COURIER',
      targetUserId: courierId,
      priority: 'urgent',
      relatedTrackingNumber: trackingNumber,
      meta: {
        codAmount: targetShipment?.codAmount,
        district: targetShipment?.district,
        city: targetShipment?.city,
        courierName: courier.name,
        recipientName: targetShipment?.recipientName,
        statusLabel: 'مع المندوب للتوزيع',
      },
    });

    // Toast for Merchant: Out for delivery
    if (targetShipment) {
      addNotification({
        type: 'STATUS_CHANGE',
        title: 'شحنتك خرجت للتوصيل 🚀',
        message: `الشحنة #${trackingNumber} مع الكابتن ${courier.name} وفي طريقها للعميل (${targetShipment.recipientName}).`,
        targetRole: 'MERCHANT',
        targetUserId: targetShipment.merchantId,
        priority: 'high',
        relatedTrackingNumber: trackingNumber,
        meta: {
          courierName: courier.name,
          recipientName: targetShipment.recipientName,
          statusLabel: 'مع المندوب للتوزيع',
        },
      });
    }
  };

  const addPickupSchedule = (data: Omit<PickupSchedule, 'id'>) => {
    const newPickup: PickupSchedule = {
      ...data,
      id: `PCK-${Date.now().toString().slice(-4)}`,
    };
    setPickups((prev) => [newPickup, ...prev]);

    // Toast notification for Couriers
    addNotification({
      type: 'NEW_PICKUP',
      title: 'طلب استلام بضائع جديد 📦',
      message: `طلب استلام بضائع مجدول من مقر "${data.merchantName}" (${data.expectedParcelsCount} طرد) في ${data.city}.`,
      targetRole: 'COURIER',
      priority: 'normal',
    });
  };

  const updatePickupStatus = (id: string, status: PickupSchedule['status'], actualCount?: number) => {
    setPickups((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status,
            actualCollectedCount: actualCount !== undefined ? actualCount : p.actualCollectedCount,
          };
        }
        return p;
      })
    );
  };

  const addAgendaTask = (task: Omit<AgendaTask, 'id' | 'createdAt'>): AgendaTask => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newTask: AgendaTask = {
      ...task,
      id: `TSK-${Date.now().toString().slice(-4)}`,
      createdAt: now,
    };
    setAgenda((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateAgendaStatus = (id: string, status: AgendaTask['status']) => {
    setAgenda((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const updateAgendaTask = (id: string, updates: Partial<AgendaTask>) => {
    setAgenda((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const updateShipmentSchedule = (
    trackingNumber: string,
    updates: {
      assignedCourierId?: string;
      assignedCourierName?: string;
      scheduledPickupDate?: string;
      scheduledDeliveryWindow?: string;
      trafficNotes?: string;
    }
  ) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setShipments((prev) =>
      prev.map((s) => {
        if (s.trackingNumber === trackingNumber) {
          const courier = updates.assignedCourierId ? staff.find((st) => st.id === updates.assignedCourierId) : null;
          const assignedCourierName = updates.assignedCourierName || courier?.name || s.assignedCourierName;

          return {
            ...s,
            assignedCourierId: updates.assignedCourierId || s.assignedCourierId,
            assignedCourierName,
            scheduledPickupDate: updates.scheduledPickupDate || s.scheduledPickupDate,
            scheduledDeliveryWindow: updates.scheduledDeliveryWindow || s.scheduledDeliveryWindow,
            trafficNotes: updates.trafficNotes || s.trafficNotes,
            status: updates.assignedCourierId ? 'OUT_FOR_DELIVERY' : s.status,
            timeline: [
              ...s.timeline,
              {
                id: `EVT-${Date.now()}`,
                timestamp: now,
                status: updates.assignedCourierId ? 'OUT_FOR_DELIVERY' : s.status,
                actorName: 'محرّك الجدولة الذكية (AI Dispatch)',
                actorRole: 'نظام الجدولة الذكية',
                notes: `تم اعتماد الجدولة الذكية: نافذة التسليم (${updates.scheduledDeliveryWindow || 'محددة'}) مع الكابتن (${assignedCourierName || 'قيد الإسناد'}). ${updates.trafficNotes ? `ملاحظة المرور: ${updates.trafficNotes}` : ''}`,
              },
            ],
          };
        }
        return s;
      })
    );

    // Toast notification for smart schedule update
    addNotification({
      type: 'SMART_SCHEDULE_UPDATE',
      title: 'تحديث الجدولة الذكية للشحنة ⏰',
      message: `تم تحديث خط سير وموعد الشحنة #${trackingNumber}: نافذة التسليم (${updates.scheduledDeliveryWindow || 'المقترحة'})`,
      targetRole: 'ALL',
      priority: 'normal',
      relatedTrackingNumber: trackingNumber,
    });
  };

  const addWhistleblowerReport = (report: Omit<WhistleblowerReport, 'id' | 'timestamp' | 'status'>) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newReport: WhistleblowerReport = {
      ...report,
      id: `REP-${Date.now().toString().slice(-4)}`,
      timestamp: now,
      status: 'UNDER_REVIEW',
    };
    setWhistleblowerReports((prev) => [newReport, ...prev]);
  };

  const recordCashDeposit = (courierId: string, amount: number) => {
    const courier = staff.find((s) => s.id === courierId);
    if (!courier) return { success: false, message: 'الموظف غير موجود' };

    if (amount <= 0) return { success: false, message: 'المبلغ غير صالح' };

    const remainingCash = Math.max(0, courier.currentCashHeld - amount);

    setStaff((prev) =>
      prev.map((s) => (s.id === courierId ? { ...s, currentCashHeld: remainingCash } : s))
    );

    return {
      success: true,
      message: `تم توريد مبلغ ${amount} ج.م لخزينة الشركة بنجاح. المتبقي في عهدة ${courier.name}: ${remainingCash} ج.م`,
    };
  };

  const runAiFraudAudit = async () => {
    try {
      const response = await fetch('/api/ai/fraud-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditData: {
            activeCouriers: staff.filter((s) => s.role === 'COURIER').map((c) => ({
              name: c.name,
              id: c.id,
              currentCashHeld: c.currentCashHeld,
              maxLimit: c.maxCashLimit,
              fraudAlerts: c.fraudAlertsCount,
            })),
            recentShipments: shipments.slice(0, 10).map((s) => ({
              tracking: s.trackingNumber,
              status: s.status,
              cod: s.codAmount,
              collected: s.collectedAmount,
              courier: s.assignedCourierName,
              returnReason: s.returnReason,
            })),
            currentAnomaliesCount: fraudAnomalies.length,
          },
        }),
      });

      if (!response.ok) throw new Error('فشل الفحص الرقابي');
      const result = await response.json();
      return result;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const getShipmentByTracking = (trackingNumber: string) => {
    return shipments.find((s) => s.trackingNumber.toUpperCase() === trackingNumber.trim().toUpperCase());
  };

  const resetToDemoData = () => {
    setStaff(INITIAL_STAFF);
    setMerchants(INITIAL_MERCHANTS);
    setShipments(INITIAL_SHIPMENTS);
    setPickups(INITIAL_PICKUPS);
    setAgenda(INITIAL_AGENDA);
    setFraudAnomalies(INITIAL_FRAUD_ANOMALIES);
    setWhistleblowerReports(INITIAL_WHISTLEBLOWER_REPORTS);
    setWorkerTasks(INITIAL_WORKER_TASKS);
    setOnboardingApplications(INITIAL_ONBOARDING_APPLICATIONS);
    setFulfillmentItems(INITIAL_FULFILLMENT_ITEMS);
    setPayoutTransactions(INITIAL_PAYOUT_TRANSACTIONS);
    setCurrentUser(DEFAULT_OWNER_USER);
    setCurrentRingLevel(1);
    setCurrentRole('ADMIN');
    localStorage.clear();
  };

  return (
    <LogisticsContext.Provider
      value={{
        currentUser,
        currentRingLevel,
        setCurrentRingLevel,
        loginUser,
        loginWithGoogle,
        registerUser,
        logoutUser,
        quickSwitchUser,
        currentRole,
        setCurrentRole,
        navigationHistory,
        canGoBack,
        previousPageLabel,
        goBack,
        navigateToView,
        activeAdminTab,
        setActiveAdminTab,
        getRoleLabel,
        canAccessRole,
        canAccessCircle,
        canAccessAdminTab,
        clearanceNotice,
        setClearanceNotice,
        activeCourierId,
        setActiveCourierId,
        activeMerchantId,
        setActiveMerchantId,
        staff,
        merchants,
        shipments,
        pickups,
        agenda,
        fraudAnomalies,
        whistleblowerReports,
        workerTasks,
        onboardingApplications,
        fulfillmentItems,
        payoutTransactions,
        governoratesCoverage,
        requestMerchantPayout,
        registerMerchant,
        addWorkerTask,
        updateWorkerTaskStatus,
        submitOnboardingApplication,
        approveOnboardingApplication,
        rejectOnboardingApplication,
        addStaffMember,
        updateStaffMember,
        toggleStaffStatus,
        addShipment,
        verifyAndDeliverShipment,
        recordReturnOrPartial,
        assignShipmentCourier,
        addPickupSchedule,
        updatePickupStatus,
        addAgendaTask,
        updateAgendaStatus,
        updateAgendaTask,
        updateShipmentSchedule,
        addWhistleblowerReport,
        recordCashDeposit,
        runAiFraudAudit,
        getShipmentByTracking,
        resetToDemoData,

        // Real-Time Toast Notifications
        notifications,
        activeToasts,
        unreadNotificationsCount,
        isSoundEnabled,
        setIsSoundEnabled,
        addNotification,
        dismissToast,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        simulateEventNotification,
        triggerProximityAlert,
      }}
    >
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
