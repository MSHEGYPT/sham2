import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Truck,
  Phone,
  MapPin,
  IdCard,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Calculator,
  HelpCircle,
  Search,
  ExternalLink,
  Zap,
  Award,
  DollarSign,
  Briefcase,
  FileText,
  BadgeCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { StaffRole, OnboardingApplication } from '../types';

export const JobSeekerPortalView: React.FC = () => {
  const {
    onboardingApplications,
    submitOnboardingApplication,
    approveOnboardingApplication,
    setCurrentRole,
    navigateToView,
  } = useLogistics();

  const [activeTab, setActiveTab] = useState<'APPLY' | 'TRACK' | 'CALCULATOR' | 'FAQ'>('APPLY');

  // Application Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    phoneAlt: '',
    nationalId: '',
    desiredRole: 'COURIER' as StaffRole,
    assignedZone: 'مدينة نصر والقاهرة الجديدة',
    vehicleType: 'MOTORCYCLE' as 'MOTORCYCLE' | 'CAR' | 'VAN' | 'BICYCLE' | 'NONE',
    vehiclePlate: '',
    drivingLicenseNumber: '',
    emergencyContact: '',
    experienceYears: 2,
    previousCompanies: 'أوبر / طلبات / شركة شحن سابقة',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<OnboardingApplication | null>(null);

  // Tracking Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [trackedApp, setTrackedApp] = useState<OnboardingApplication | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Earnings Calculator State
  const [dailyShipments, setDailyShipments] = useState(30);
  const [workDaysPerMonth, setWorkDaysPerMonth] = useState(26);

  // Pre-calculated earnings
  const feePerDelivery = 22; // Average delivery fee commission
  const dailyFuelAllowance = 35; // EGP fuel support
  const dailyIncome = dailyShipments * feePerDelivery + dailyFuelAllowance;
  const monthlyGross = dailyIncome * workDaysPerMonth;
  const monthlyBonus = dailyShipments >= 30 ? 2500 : 1200;
  const totalEstimatedMonthly = monthlyGross + monthlyBonus;

  // Handle Application Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.nationalId) return;

    setIsSubmitting(true);
    try {
      const newApp = await submitOnboardingApplication({
        fullName: formData.fullName,
        phone: formData.phone,
        nationalId: formData.nationalId,
        desiredRole: formData.desiredRole,
        assignedZone: formData.assignedZone,
        vehicleType: formData.vehicleType,
        vehiclePlate: formData.vehiclePlate || 'أ ب ج 1234',
        drivingLicenseNumber: formData.drivingLicenseNumber || 'DL-98214',
        emergencyContact: formData.emergencyContact || 'الوالد / الأخ - 01099887766',
        criminalRecordStatus: 'CLEAN',
      });

      setSubmittedApp(newApp);
      setTrackedApp(newApp);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Tracking Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (!searchQuery.trim()) {
      setTrackedApp(null);
      return;
    }

    const clean = searchQuery.trim().toLowerCase();
    const found = onboardingApplications.find(
      (a) =>
        a.id.toLowerCase() === clean ||
        a.phone.includes(clean) ||
        a.nationalId.includes(clean) ||
        a.fullName.toLowerCase().includes(clean)
    );

    setTrackedApp(found || null);
  };

  // Fast track approval for live simulation demo
  const handleFastTrackApprove = (id: string) => {
    approveOnboardingApplication(id, 'تم التحقق من الوثائق والموافقة الفورية في محاكاة التعيين المباشر');
    const updated = onboardingApplications.find((a) => a.id === id);
    if (updated) {
      setTrackedApp({ ...updated, status: 'APPROVED' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* 1. HERO BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>بوابة التوظيف الرسمية والانضمام لكباتن مشاوير</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              ابدأ عملك اليوم ككابتن توصيل محترف بدخل شهري يصل إلى{' '}
              <span className="text-amber-400 underline decoration-amber-500/50">20,000 ج.م</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              تسجيل إلكتروني فوري مع فحص أمني ذكي، تأمين شامل، تسوية أرباح أسبوعية، وتطبيق ذكي متكامل برمز OTP يضمن حقك ونزاهتك 100%.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>قبول فوري خلال 24 ساعة</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 px-3 py-1.5 rounded-xl font-bold">
                <DollarSign className="w-3.5 h-3.5" />
                <span>حوافز وبونص يومي مجزي</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-300 bg-blue-950/60 border border-blue-800/60 px-3 py-1.5 rounded-xl font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>تسليم عهدة ومعدات حديثة</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 p-5 rounded-2xl shadow-xl flex flex-col gap-3 min-w-[260px] text-center shrink-0">
            <span className="text-xs text-slate-400 font-bold">متوسط دخل الكابتن النشط</span>
            <div className="text-3xl font-black text-amber-400 font-mono">
              15,500 <span className="text-xs font-bold text-white">ج.م / شهر</span>
            </div>
            <p className="text-[11px] text-slate-400">بناءً على 28-35 شحنة يومياً مع الحافز الأسبوعي</p>
            <button
              onClick={() => setActiveTab('CALCULATOR')}
              className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>احسب دخلك المتوقع الآن</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('APPLY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'APPLY'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          <span>تقديم طلب عمل جديد</span>
        </button>

        <button
          onClick={() => setActiveTab('TRACK')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'TRACK'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4 text-blue-400" />
          <span>متابعة حالة الطلب بالرقم القومي / الكود</span>
          {onboardingApplications.length > 0 && (
            <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {onboardingApplications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CALCULATOR')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'CALCULATOR'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>حاسبة أرباح ودخل الكابتن</span>
        </button>

        <button
          onClick={() => setActiveTab('FAQ')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'FAQ'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <span>الشروط والأوراق ومراحل التعيين</span>
        </button>
      </div>

      {/* 3. TAB 1: APPLY NOW FORM */}
      {activeTab === 'APPLY' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          {submittedApp ? (
            <div className="space-y-6 text-center max-w-xl mx-auto py-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-black uppercase text-emerald-600 tracking-wider">
                  تم استلام طلب العمل بنجاح
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  أهلاً بك يا كابتن {submittedApp.fullName}!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2">
                  تم إدراجك في قائمة المتقدمين المعتمدين، واجتاز طلبك فحص الذكاء الاصطناعي الأولي بنسبة جدارة{' '}
                  <span className="font-bold text-emerald-600 font-mono">{submittedApp.aiClearanceScore}%</span>.
                </p>
              </div>

              {/* Reference Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-right space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs text-slate-500">رقم مرجع الطلب (Application Ref):</span>
                  <span className="text-base font-black font-mono text-slate-900 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300">
                    {submittedApp.id}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">الوظيفة المتقدم لها:</span>
                  <span className="font-bold text-slate-800">
                    {submittedApp.desiredRole === 'COURIER'
                      ? 'مندوب توصيل ميداني (كابتن)'
                      : submittedApp.desiredRole === 'DISPATCHER'
                      ? 'مشرف فرز واستلام'
                      : 'خدمة عملاء ودعم لوجستي'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">المنطقة الجغرافية:</span>
                  <span className="font-bold text-slate-800">{submittedApp.assignedZone}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">المركبة المسجلة:</span>
                  <span className="font-bold text-slate-800">
                    {submittedApp.vehicleType === 'MOTORCYCLE'
                      ? 'دراجة نارية (موتوسيكل)'
                      : submittedApp.vehicleType === 'VAN'
                      ? 'سيارة فان مقفولة'
                      : submittedApp.vehicleType === 'CAR'
                      ? 'سيارة ملاكي'
                      : 'بدون مركبة'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">تقرير الفحص الأمني بالذكاء الاصطناعي:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {submittedApp.aiClearanceReport}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setTrackedApp(submittedApp);
                    setActiveTab('TRACK');
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  متابعة حالة الطلب ومراحل التعيين
                </button>

                <button
                  onClick={() => handleFastTrackApprove(submittedApp.id)}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Zap className="w-4 h-4" />
                  <span>محاكاة الاعتماد الفوري وتجربة تطبيق المندوب</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h3 className="text-lg font-black text-slate-900">استمارة تقديم طلب عمل جديد</h3>
                <p className="text-xs text-slate-500 mt-1">
                  يرجى كتابة بياناتك بدقة. يتم مراجعة الطلبات آلياً بواسطة نظام الذكاء الاصطناعي الأمني في مشاوير.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">الاسم الرباعي كما في بطاقة الرقم القومي *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="مثال: أحمد محمود إبراهيم خليل"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* 2. National ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">الرقم القومي (14 رقم) *</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="29801010101234"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* 3. Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">رقم الهاتف الأساسي (واتساب وتواصل) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01012345678"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* 4. Alternate Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">شخص للطوارئ / ضامن (الاسم ورقم الهاتف) *</label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="الوالد / الأخ - 01223344556"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* 5. Desired Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">الوظيفة المرغوبة في المنظومة *</label>
                  <select
                    value={formData.desiredRole}
                    onChange={(e) => setFormData({ ...formData, desiredRole: e.target.value as StaffRole })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="COURIER">مندوب شحن وتوصيل ميداني (كابتن حر أو دوام كامل)</option>
                    <option value="DISPATCHER">مشرف فرز ومستودع واستلام شحنات</option>
                    <option value="CUSTOMER_CARE">ممثل خدمة عملاء ودعم التجار</option>
                  </select>
                </div>

                {/* 6. Zone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">منطقة العمل أو النطاق الجغرافي المفضل *</label>
                  <select
                    value={formData.assignedZone}
                    onChange={(e) => setFormData({ ...formData, assignedZone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="مدينة نصر والتجمع الخامس والقاهرة الجديدة">مدينة نصر والتجمع الخامس والقاهرة الجديدة</option>
                    <option value="المعادي والمقطم وحلوان">المعادي والمقطم وحلوان</option>
                    <option value="الدقي والمهندسين والعجوزة">الدقي والمهندسين والعجوزة</option>
                    <option value="السادس من أكتوبر والشيخ زايد">السادس من أكتوبر والشيخ زايد</option>
                    <option value="شبرا ومصر الجديدة والزيتون">شبرا ومصر الجديدة والزيتون</option>
                    <option value="محافظة الإسكندرية (سموحة وميامى ووسط البلد)">الإسكندرية (سموحة وميامي ووسط البلد)</option>
                    <option value="محافظات الدلتا (المنصورة وطنطا والزقازيق)">الدلتا (المنصورة وطنطا والزقازيق)</option>
                    <option value="مدن القناة (الإسماعيلية وبورسعيد والسويس)">مدن القناة (الإسماعيلية وبورسعيد)</option>
                  </select>
                </div>

                {/* 7. Vehicle Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">نوع وسيلة التوصيل المتاحة لديك *</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="MOTORCYCLE">دراجة نارية (موتوسيكل) - الأكثر طلباً وأعلى دخلاً</option>
                    <option value="VAN">سيارة فان مقفولة (نقل بضائع كبيرة وكراتين)</option>
                    <option value="CAR">سيارة ملاكي</option>
                    <option value="BICYCLE">سكوتر كهربائي أو دراجة هوائية</option>
                    <option value="NONE">بدون وسيلة (شحن مترو ومشاة في الميادين المركزية)</option>
                  </select>
                </div>

                {/* 8. Vehicle Plate & License */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">رقم لوحة المركبة أو رقم رخصة القيادة</label>
                  <input
                    type="text"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    placeholder="مثال: أ ب ج 1234 أو رقم الرخصة"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Experience and Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">الخبرات السابقة في التوصيل أو التجارة الإلكترونية</label>
                <input
                  type="text"
                  value={formData.previousCompanies}
                  onChange={(e) => setFormData({ ...formData, previousCompanies: e.target.value })}
                  placeholder="مثال: سنتين مع طلبات وبوسطة ومطاعم"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Terms Checkbox */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <input type="checkbox" required id="termsCheck" className="mt-1 w-4 h-4 accent-amber-500 rounded" />
                <label htmlFor="termsCheck" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                  أقر بصحة البيانات المدخلة، وبخلو صحيفتي الجنائية من أي سوابق أو أحكام مخلة بالشرف، وأتعهد بالالتزام بسياسة النزاهة التامة (Zero Corruption) وتسليم الكاش COD فورياً واستخدام كود OTP مع العملاء.
                </label>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <span className="text-xs text-slate-400">
                  ⚡ يتم الرد آلياً عبر الذكاء الاصطناعي فور تقديم الطلب
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md hover:scale-[1.01] cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>جاري الفحص الأمني الذكي للطلب...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>إرسال طلب الانضمام والتوظيف الآن</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 4. TAB 2: TRACK APPLICATION STATUS */}
      {activeTab === 'TRACK' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-xl mx-auto space-y-4 text-center">
            <h3 className="text-lg font-black text-slate-900">متابعة حالة طلب التوظيف</h3>
            <p className="text-xs text-slate-500">
              أدخل رقم الهاتف أو الرقم القومي أو كود الطلب (مثل ONB-1234) لمعرفة مرحلة تعيينك واستلام العهدة.
            </p>

            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="أدخل الهاتف أو الرقم القومي أو كود الطلب..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>بحث</span>
              </button>
            </form>
          </div>

          {/* Quick List of existing applications if user didn't search yet */}
          {!trackedApp && !hasSearched && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                الطلبات المسجلة مؤخراً بالمنظومة (انقر للفحص المباشر):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {onboardingApplications.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setTrackedApp(app)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{app.fullName}</span>
                        <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                          {app.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {app.assignedZone} | {app.phone}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status === 'APPROVED' ? 'تم الاعتماد' : app.status === 'REJECTED' ? 'مرفوض' : 'قيد التدقيق'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracked Application Card */}
          {trackedApp && (
            <div className="max-w-2xl mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-slate-900">{trackedApp.fullName}</h4>
                    <span className="text-xs font-mono font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                      {trackedApp.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تاريخ التقديم: {trackedApp.submittedAt} | النطاق: {trackedApp.assignedZone}
                  </p>
                </div>

                <span
                  className={`text-xs font-black px-3 py-1.5 rounded-full ${
                    trackedApp.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : trackedApp.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {trackedApp.status === 'APPROVED'
                    ? '✓ تم الاعتماد رسمياً'
                    : trackedApp.status === 'REJECTED'
                    ? '✕ غير مستوفٍ للشروط'
                    : '⏳ قيد التدقيق الإداري والأمني'}
                </span>
              </div>

              {/* Recruitment Timeline (4 Steps) */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-slate-700">مراحل التدقيق والتعيين الميداني:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
                  {/* Step 1 */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <span className="font-bold block">1. استلام الطلب</span>
                    <span className="text-[10px] text-emerald-700">تم التسجيل بالمنظومة</span>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <span className="font-bold block">2. الفحص الأمني الذكي</span>
                    <span className="text-[10px] text-emerald-700">جدارة: {trackedApp.aiClearanceScore}%</span>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`p-3 rounded-xl border ${
                      trackedApp.status === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    {trackedApp.status === 'APPROVED' ? (
                      <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    ) : (
                      <Clock className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                    )}
                    <span className="font-bold block">3. تسليم العهدة</span>
                    <span className="text-[10px]">
                      {trackedApp.status === 'APPROVED' ? 'تم تسليم الحقيبة والطابعة' : 'بانتظار الحضور للمستودع'}
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div
                    className={`p-3 rounded-xl border ${
                      trackedApp.status === 'APPROVED'
                        ? 'bg-purple-50 border-purple-200 text-purple-900'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Truck className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <span className="font-bold block">4. بدء العمل</span>
                    <span className="text-[10px]">
                      {trackedApp.status === 'APPROVED' ? 'الدائرة الميدانية #4' : 'بعد اعتماد الإدارة'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action and simulation buttons */}
              {trackedApp.status === 'APPROVED' ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      تهانينا! حسابك مفعل الآن في أسطول التوصيل. يمكنك التبديل لتطبيق المندوب الميداني (الدائرة #4).
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentRole('COURIER');
                    }}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors shadow-xs"
                  >
                    الانتقال لتطبيق المندوب الميداني
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-amber-900">
                    <span className="font-bold">طلبك قيد المراجعة الإدارية.</span> يمكنك إجراء محاكاة للاعتماد وتجربة المنظومة فوراً:
                  </div>
                  <button
                    onClick={() => handleFastTrackApprove(trackedApp.id)}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Zap className="w-4 h-4" />
                    <span>محاكاة الاعتماد الآن</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: EARNINGS CALCULATOR */}
      {activeTab === 'CALCULATOR' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <h3 className="text-xl font-black text-slate-900">حاسبة أرباح ودخل كابتن مشاوير</h3>
            <p className="text-xs text-slate-500">
              الدخل الشفاف بدون خصومات عشوائية: عمولة تسليم عن كل شحنة + بدل وقود + حافز انتظام ومعدل تسليم أسبوعي.
            </p>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Sliders */}
            <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>عدد الشحنات المسلمة يومياً:</span>
                  <span className="text-amber-600 font-mono text-sm bg-amber-100 px-2 py-0.5 rounded">
                    {dailyShipments} شحنة / يوم
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={1}
                  value={dailyShipments}
                  onChange={(e) => setDailyShipments(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>10 شحنات (دوام جزئي)</span>
                  <span>30 شحنة (معدل طبيعي)</span>
                  <span>50 شحنة (كابتن محترف)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>أيام العمل في الشهر:</span>
                  <span className="text-blue-600 font-mono text-sm bg-blue-100 px-2 py-0.5 rounded">
                    {workDaysPerMonth} يوم
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={30}
                  step={1}
                  value={workDaysPerMonth}
                  onChange={(e) => setWorkDaysPerMonth(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>15 يوم (بارت تايم)</span>
                  <span>26 يوم (6 أيام أسبوعياً)</span>
                  <span>30 يوم</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3 space-y-1">
                <div>• عمولة الشحنة المتوسطة: 22 ج.م</div>
                <div>• بدل وقود وانتقال يومي: 35 ج.م</div>
                <div>• حافز التميز ونسبة التسليم العالية: حتى 2,500 ج.م شهرياً</div>
              </div>
            </div>

            {/* Calculations Outcome */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block text-center">
                صافي الدخل الشهري التقديري
              </span>

              <div className="text-center py-2">
                <div className="text-4xl font-black text-white font-mono tracking-tight">
                  {totalEstimatedMonthly.toLocaleString('ar-EG')} <span className="text-sm font-bold text-amber-400">ج.م</span>
                </div>
                <span className="text-xs text-emerald-400 font-bold mt-1 block">
                  ≈ {Math.round(totalEstimatedMonthly / 4).toLocaleString('ar-EG')} ج.م أسبوعياً
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>الدخل اليومي المتوسط:</span>
                  <span className="font-mono font-bold text-white">{dailyIncome.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>إجمالي العمولات الشهرية:</span>
                  <span className="font-mono font-bold text-white">{monthlyGross.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>بونص الكابتن المتميز:</span>
                  <span className="font-mono font-bold text-amber-400">{monthlyBonus.toLocaleString('ar-EG')} ج.م</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('APPLY')}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
              >
                <span>انضم الآن وابدأ العمل</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: REQUIREMENTS & FAQ */}
      {activeTab === 'FAQ' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <h3 className="text-xl font-black text-slate-900">الشروط والأوراق ومراحل التعيين</h3>
            <p className="text-xs text-slate-500">
              كل ما تحتاج لمعرفته قبل استلام خط سيرك الأول ومعدات العمل
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">الأوراق والمستندات المطلوبة</h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside pt-1">
                <li>أصل بطاقة الرقم القومي سارية</li>
                <li>فيش وتشبيه حديث موجه لمنظومة مشاوير</li>
                <li>رخصة القيادة ورخصة تسيير المركبة ساريتين</li>
                <li>إيصال مرافق حديث بعنوان السكن الحالي</li>
                <li>شهادة المؤهل أو الموقف من التجنيد</li>
              </ul>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">معدات العمل والعهدة الذكية</h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside pt-1">
                <li>حقيبة ظهر عازلة ومقاومة للأمطار مخصصة للطرود</li>
                <li>طابعة ملصقات باركود حرارية بلوتوث محمولة</li>
                <li>تطبيق الكابتن الذكي بتتبع GPS وخاصية OTP</li>
                <li>دعم فني ميداني متاح على مدار اليوم لحل النزاعات</li>
              </ul>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">ميثاق النزاهة (Zero Corruption)</h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside pt-1">
                <li>تسليم الطرود للعميل حصراً برمز OTP السري</li>
                <li>توريد المبالغ المحصلة COD في موعدها المحدد</li>
                <li>حظر تحصيل أي مبالغ إضافية فوق قيمة الفاتورة</li>
                <li>حوافز مادية دورية للكباتن أصحاب التقييم 5 نجوم</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
