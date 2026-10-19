export type UserRole = 'ADMIN' | 'OPERATIONS' | 'ACCOUNTANT' | 'COURIER' | 'MERCHANT' | 'CUSTOMER' | 'JOB_SEEKER';

export type StaffRole = 'GENERAL_MANAGER' | 'OPERATIONS_SUPERVISOR' | 'DISPATCHER' | 'ACCOUNTANT' | 'CUSTOMER_CARE' | 'COURIER';

// Onion Rings Model Levels (نموذج دوائر البصلة متحدة المركز للصلاحيات)
export type OnionRingLevel = 1 | 2 | 3 | 4 | 5;

export interface OnionRingDefinition {
  level: OnionRingLevel;
  ringId: 'CORE_OWNER' | 'ADMIN_SUPERVISION' | 'FINANCE_TREASURY' | 'FIELD_WORKERS' | 'EXTERNAL_PARTNERS';
  nameAr: string;
  badgeAr: string;
  descriptionAr: string;
  primaryRoles: string[];
  color: string;
  borderColor: string;
  bgGradient: string;
  allowedCapabilities: string[];
  restrictedCapabilities: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole | StaffRole;
  emailOrPhone: string;
  nationalId?: string;
  department: string;
  assignedRingLevel: OnionRingLevel;
  ringName: string;
  avatar: string;
  joinedDate: string;
  token?: string;
  vehiclePlate?: string;
  isAuthenticated?: boolean;
  hierarchyRank?: number; // 1: Owner/Admin, 2: Supervisor, 3: Accountant, 4: Courier, 5: Merchant, 0: Guest
  firebaseUid?: string;
  isGoogleUser?: boolean;
}

export interface WorkerTask {
  id: string;
  title: string;
  taskType: 'DELIVERY_DISPATCH' | 'PICKUP_COLLECTION' | 'RETURN_HANDOVER' | 'MAINTENANCE_INSPECTION';
  assignedCourierId: string;
  assignedCourierName: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  dueDate: string;
  timeWindow: string;
  location: string;
  relatedShipmentTracking?: string;
  expectedCod?: number;
  notes?: string;
  completedAt?: string;
}

export interface OnboardingApplication {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string;
  desiredRole: StaffRole;
  assignedZone: string;
  vehicleType: 'MOTORCYCLE' | 'CAR' | 'VAN' | 'BICYCLE' | 'NONE';
  vehiclePlate?: string;
  drivingLicenseNumber?: string;
  criminalRecordStatus: 'CLEAN' | 'PENDING_CHECK' | 'FLAGGED';
  emergencyContact: string;
  aiClearanceScore: number; // 0 to 100
  aiClearanceReport: string;
  status: 'PENDING_AUDIT' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  nationalId: string;
  department: string;
  assignedZone: string;
  status: 'ACTIVE' | 'ON_DUTY' | 'ON_BREAK' | 'SUSPENDED';
  vehicleType?: 'MOTORCYCLE' | 'CAR' | 'VAN' | 'BICYCLE' | 'NONE';
  vehiclePlate?: string;
  currentCashHeld: number; // المبلغ النقدي في جعبته حالياً من تحصيلات COD
  maxCashLimit: number; // الحد الأقصى المسموح باحتجازه قبل التوريد الإجباري
  totalDelivered: number;
  successRate: number; // percentage
  rating: number; // out of 5
  joinedDate: string;
  avatar: string;
  fraudAlertsCount: number;
  ringLevel: OnionRingLevel;
}

export type ShipmentStatus =
  | 'PENDING_PICKUP'        // في انتظار الاستلام من المتجر
  | 'RECEIVED_IN_HUB'       // تم الاستلام وتخزينها في المستودع الرئيسي
  | 'OUT_FOR_DELIVERY'      // مع المندوب وفي طريقها للعميل
  | 'DELIVERED'             // تم التسليم بنجاح
  | 'PARTIAL_DELIVERY'      // تسليم جزئي لبعض البنود
  | 'RETURN_PENDING'        // مرتجع قيد الإرجاع للمستودع
  | 'RETURNED_TO_MERCHANT'  // تم إرجاعها رسمياً للتاجر
  | 'CANCELLED';            // ملغاة

export interface ShipmentEvent {
  id: string;
  timestamp: string;
  status: ShipmentStatus;
  actorName: string;
  actorRole: string;
  notes: string;
  otpVerified?: boolean;
  collectedAmount?: number;
  location?: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
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
  codAmount: number; // مبلغ التحصيل المطلوب
  collectedAmount?: number; // المبلغ الفعلي المحصل
  shippingFee: number;
  merchantShare: number; // codAmount - shippingFee
  status: ShipmentStatus;
  otpSecret: string; // كود سري من 4 أرقام يصل للعميل لمنع ادعاء التسليم أو الفساد
  assignedCourierId?: string;
  assignedCourierName?: string;
  scheduledPickupDate: string;
  deliveredAt?: string;
  returnReason?: string;
  returnNotes?: string;
  orderType?: 'STANDARD' | 'EXCHANGE' | 'RETURN'; // نوع الطلب: عادي، استبدال، مرتجع
  allowInspection?: boolean; // السماح للعميل بفتح الطرد والمعاينة قبل الاستلام (Bosta Feature)
  exchangeDetails?: string; // تفاصيل القطعة المسترجعة في طلبات الاستبدال
  coordinates?: { lat: number; lng: number }; // الإحداثيات الجغرافية على الخريطة
  scheduledDeliveryWindow?: string; // نافذة التسليم المجدولة ذكياً
  trafficNotes?: string; // ملاحظات حركة المرور
  timeline: ShipmentEvent[];
  createdAt: string;
}

// Bosta-Inspired E-Commerce Fulfillment & Inventory
export interface FulfillmentItem {
  id: string;
  sku: string;
  name: string;
  merchantId: string;
  category: string;
  inStock: number;
  reserved: number;
  warehouseLocation: string;
  unitWeightKg: number;
  priceEgp: number;
}

// Bosta-Inspired Next-Day COD Payout Wallet Transaction
export interface PayoutTransaction {
  id: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  method: 'INSTAPAY' | 'BANK_TRANSFER' | 'FAWRY' | 'WALLET';
  referenceNumber: string;
  status: 'COMPLETED' | 'PROCESSING';
  accountDetails: string;
  createdAt: string;
}

// Bosta-Inspired Egypt 27 Governorates Coverage & Hubs
export interface GovernorateCoverage {
  code: string;
  nameAr: string;
  region: 'CAIRO_GIZA' | 'ALEXANDRIA' | 'DELTA' | 'CANAL' | 'UPPER_EGYPT' | 'FRONTIER';
  regionLabelAr: string;
  deliverySlaHours: number; // 24, 48, 72
  baseFee: number;
  hubName: string;
  activeCouriers: number;
  successRate: number; // e.g. 97.2
  isNextDayGuaranteed: boolean;
}

export interface PickupSchedule {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  merchantPhone: string;
  city: string;
  scheduledDate: string;
  scheduledTimeWindow: string; // e.g. "12:00 م - 02:00 م"
  expectedParcelsCount: number;
  actualCollectedCount?: number;
  assignedCourierId?: string;
  assignedCourierName?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  receiptNumber?: string;
}

export interface AgendaTask {
  id: string;
  title: string;
  source: 'AI_CHAT' | 'WHATSAPP_PARSER' | 'WEB_FORM' | 'MERCHANT_APP' | 'MANUAL';
  clientName: string;
  clientPhone: string;
  type: 'merchant_partnership' | 'pickup_request' | 'order_inquiry' | 'complaint_fraud' | 'general';
  priority: 'high' | 'medium' | 'low';
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
  summary: string;
  suggestedAction: string;
  assignedTo?: string;
  createdAt: string;
  smartSchedule?: {
    optimalPickupWindow?: string;
    optimalDeliveryWindow?: string;
    alternativeDeliveryWindow?: string;
    recommendedCourierId?: string;
    recommendedCourierName?: string;
    trafficLevel?: 'LIGHT' | 'MODERATE' | 'HEAVY' | 'CRITICAL_PEAK';
    estimatedTransitMinutes?: number;
    recommendedCorridor?: string;
    efficiencyScore?: number;
    scheduleRationale?: string;
    appliedAt?: string;
  };
  rawDetails?: any;
}

export interface FraudAnomaly {
  id: string;
  timestamp: string;
  type: 'CASH_HOLD' | 'SUSPICIOUS_RETURN' | 'PRICE_TAMPERING' | 'OTP_BYPASS_ATTEMPT' | 'TIME_DISTANCE_MISMATCH';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  employeeName: string;
  employeeId?: string;
  shipmentTracking?: string;
  description: string;
  evidence: string;
  status: 'PENDING_INVESTIGATION' | 'JUSTIFIED' | 'PENALTY_APPLIED' | 'CLEARED';
  notes?: string;
}

export interface WhistleblowerReport {
  id: string;
  timestamp: string;
  reporterType: 'CUSTOMER' | 'MERCHANT' | 'STAFF' | 'ANONYMOUS';
  reporterContact?: string;
  targetEmployeeName: string;
  category: 'BRIBERY' | 'OVERCHARGING' | 'THEFT_TAMPERING' | 'HARASSMENT' | 'OTHER';
  description: string;
  status: 'UNDER_REVIEW' | 'CONFIRMED' | 'DISMISSED';
  priority: 'HIGH' | 'CRITICAL';
}

export interface Merchant {
  id: string;
  name: string;
  brandName: string;
  phone: string;
  city: string;
  address: string;
  businessType: string;
  activeShipmentsCount: number;
  deliveredCount: number;
  returnRate: number;
  pendingBalance: number; // مستحقات كاش تنتظر التوريد لحسابه
  rating: number;
}

export interface NavigationHistoryEntry {
  id: string;
  role: UserRole;
  adminTab?: string;
  modalOpen?: string | null;
  label: string;
  timestamp: number;
}

export interface MerchantRegistrationData {
  name: string;
  brandName: string;
  phone: string;
  city: string;
  address: string;
  businessType: string;
  bankOrInstaPay?: string;
  notes?: string;
}

export interface JobApplicantData {
  fullName: string;
  phone: string;
  nationalId: string;
  desiredRole: StaffRole;
  assignedZone: string;
  vehicleType: 'MOTORCYCLE' | 'CAR' | 'VAN' | 'BICYCLE' | 'NONE';
  vehiclePlate?: string;
  drivingLicenseNumber?: string;
  emergencyContact: string;
  experienceYears?: number;
  notes?: string;
}

export type NotificationType =
  | 'NEW_DELIVERY_ORDER'    // أمر توصيل جديد للكابتن
  | 'STATUS_CHANGE'         // تغير حالة الشحنة
  | 'NEW_PICKUP'            // طلب استلام بضائع من متجر
  | 'PAYOUT_PROCESSED'      // تحويل مستحقات COD للتاجر
  | 'OTP_VERIFIED'          // تم تأكيد التسليم بكود OTP
  | 'SMART_SCHEDULE_UPDATE' // تحديث الجدولة الذكية وتفادي الذروة
  | 'ALERT_WARNING'         // تنبيه تشغيلي أو إرجاع
  | 'PROXIMITY_ALERT';      // تنبيه اقتراب جغرافي من نقطة الاستلام أو التوصيل

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  createdAt: number;
  targetRole: 'MERCHANT' | 'COURIER' | 'ALL' | 'ADMIN';
  targetUserId?: string;
  read: boolean;
  priority?: 'high' | 'normal' | 'urgent';
  relatedTrackingNumber?: string;
  relatedOrderId?: string;
  meta?: {
    codAmount?: number;
    district?: string;
    city?: string;
    merchantName?: string;
    recipientName?: string;
    statusLabel?: string;
    courierName?: string;
    distanceMeters?: number;
    stopType?: 'DELIVERY' | 'PICKUP';
    phone?: string;
    otpSecret?: string;
    address?: string;
  };
}
