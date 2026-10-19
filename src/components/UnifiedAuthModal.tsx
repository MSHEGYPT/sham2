import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Phone,
  ShieldCheck,
  Sparkles,
  Crown,
  UserCheck,
  Coins,
  Truck,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  KeyRound,
  IdCard,
  ChevronLeft,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { UserRole, StaffRole } from '../types';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'INSTANT_PORTAL' | 'LOGIN' | 'REGISTER';
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'INSTANT_PORTAL',
}) => {
  const { loginUser, loginWithGoogle, registerUser, quickSwitchUser, currentUser, navigateToView } = useLogistics();

  const [activeTab, setActiveTab] = useState<'INSTANT_PORTAL' | 'LOGIN' | 'REGISTER'>(defaultMode);
  const [selectedRole, setSelectedRole] = useState<string>('GENERAL_MANAGER');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setFeedbackNotice(null);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setFeedbackNotice(res.message);
        setTimeout(() => {
          onClose();
          setFeedbackNotice(null);
        }, 1400);
      } else {
        setFeedbackNotice(res.message || 'تعذر إتمام تسجيل الدخول عبر Google');
      }
    } catch (err: any) {
      setFeedbackNotice(err.message || 'خطأ في الاتصال بخدمة Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Register form state
  const [regForm, setRegForm] = useState({
    fullName: '',
    phone: '',
    nationalId: '',
    role: 'COURIER',
    zone: 'القاهرة الكبرى',
    vehicleType: 'MOTORCYCLE',
    vehiclePlate: '',
    businessType: 'ملابس وأزياء',
    brandName: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [clearanceCard, setClearanceCard] = useState<{
    title: string;
    persona: string;
    ringNumber: number;
    allowedIcons: string[];
    restrictedAbove: string[];
  } | null>(null);

  if (!isOpen) return null;

  const rolePortals = [
    {
      preset: 'OWNER' as const,
      ringNumber: 1,
      ringName: 'الدائرة الأولى: نواة المنظومة',
      title: 'المدير العام وصاحب المنظومة',
      persona: 'م. طارق العسقلاني',
      icon: Crown,
      badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-300',
      iconColor: 'text-amber-500 bg-amber-50',
      description: 'إشراف كامل على كافة العمليات، تفعيل درع النزاهة ومكافحة الفساد، ومراقبة أداء كافة المحافظات.',
      targetRole: 'ADMIN' as const,
      allowedIcons: ['درع النزاهة ومكافحة الفساد', 'الهيكل التنظيمي ورواتب الكادر', 'مصفوفة الشحنات والاستلامات', 'الخزينة والمالية', 'مستكشف دوائر البصلة', 'محاكاة تجربة أي دائرة'],
      restrictedAbove: ['لا توجد قيود - أعلى سلطة إدارية ورقابية في المنظومة'],
    },
    {
      preset: 'SUPERVISOR' as const,
      ringNumber: 2,
      ringName: 'الدائرة الثانية: الرقابة والإدارة',
      title: 'مشرف العمليات وكادر العمل',
      persona: 'أ. شريف البدري',
      icon: UserCheck,
      badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-300',
      iconColor: 'text-blue-500 bg-blue-50',
      description: 'مراجعة وتدقيق مستندات المناديب الجدد، توزيع الشحنات الجغرافية، ومتابعة انضباط الكادر.',
      targetRole: 'OPERATIONS' as const,
      allowedIcons: ['إدارة الشحنات والاستلامات', 'أسطول المناديب وتعيين المناطق', 'تسجيل واعتماد العاملين الجدد', 'جدول الأعمال والأرشفة', 'الخريطة الحرارية'],
      restrictedAbove: ['محظور الاطلاع على أسرار مكافحة الفساد والبلاغات السرية (خاص بالمالك)', 'محظور تعديل رواتب وهيكل الكادر العام'],
    },
    {
      preset: 'ACCOUNTANT' as const,
      ringNumber: 3,
      ringName: 'الدائرة الثالثة: المالية والخزينة',
      title: 'المحاسب والتدقيق المالي',
      persona: 'أ. محمود سراج',
      icon: Coins,
      badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
      iconColor: 'text-emerald-500 bg-emerald-50',
      description: 'إدارة توريد الكاش والعهدة، تسوية مستحقات المتاجر الفورية عبر إنستاباي، والتحكم بالخزينة.',
      targetRole: 'ACCOUNTANT' as const,
      allowedIcons: ['الخزينة والتسويات المالية', 'اعتماد تحويلات أرباح المتاجر (إنستاباي/بنك)', 'مراجعة عهد كاش المناديب المحصلة', 'التقارير المالية والفوترة'],
      restrictedAbove: ['محظور الاطلاع على الدائرة 1 (قرارات الإدارة العليا)', 'محظور الاطلاع على الدائرة 2 (توزيع الشحنات وتعيين الكادر)'],
    },
    {
      preset: 'COURIER' as const,
      ringNumber: 4,
      ringName: 'الدائرة الرابعة: العمليات الميدانية',
      title: 'المندوب والعامل الميداني',
      persona: 'ك. أحمد المنشاوي',
      icon: Truck,
      badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-300',
      iconColor: 'text-purple-500 bg-purple-50',
      description: 'استلام مهام التوصيل، ماسح الباركود، تأكيد التسليم بكود OTP، وإثبات المرتجعات الفورية.',
      targetRole: 'COURIER' as const,
      allowedIcons: ['مهام خط السير اليومي المسندة إليه فقط', 'ماسح الباركود وإثبات التسليم POD', 'العهدة النقدية المحصلة وحساب التوريد', 'الدعم الميداني للطوارئ'],
      restrictedAbove: ['محظور الاطلاع على الدائرة 3 (المالية والخزينة)', 'محظور الاطلاع على الدائرة 2 (إشراف العمليات والمناديب الآخرين)', 'محظور الاطلاع على الدائرة 1 (الإدارة العليا)'],
    },
    {
      preset: 'MERCHANT' as const,
      ringNumber: 5,
      ringName: 'الدائرة الخامسة: الشركاء والمتاجر',
      title: 'بوابة المتجر والتاجر',
      persona: 'متجر زارا مصر (MCH-101)',
      icon: Building2,
      badgeColor: 'bg-slate-500/10 text-slate-800 border-slate-300',
      iconColor: 'text-slate-700 bg-slate-100',
      description: 'حجز طلبات الاستلام، تحليل نصوص ورسائل الواتساب، ومتابعة تحصيل المبالغ والأرصدة.',
      targetRole: 'MERCHANT' as const,
      allowedIcons: ['إنشاء شحنة وطلب استلام', 'محلل رسائل الواتساب بالذكاء الاصطناعي', 'شحنات متجري وأرصدة COD', 'طلب سحب الأرباح فوراً', 'تتبع شحنة المتجر'],
      restrictedAbove: ['محظور الاطلاع على المنظومة الداخلية للشركة (المناديب والخزينة والعمليات والإدارة العليا)'],
    },
    {
      preset: 'CUSTOMER' as const,
      ringNumber: 5,
      ringName: 'الدائرة العامة: العملاء والزوار',
      title: 'الواجهة العامة والتتبع',
      persona: 'زائر / عميل مستلم',
      icon: Search,
      badgeColor: 'bg-amber-500/10 text-amber-800 border-amber-300',
      iconColor: 'text-amber-600 bg-amber-50',
      description: 'تتبع الشحنات المباشر، حاسبة تكاليف الشحن، تقديم الشكاوى، وطلب خدمات التوصيل.',
      targetRole: 'CUSTOMER' as const,
      allowedIcons: ['تتبع الشحنات برقم البوليصة', 'حاسبة الأسعار وتغطية المحافظات', 'مساعد مشاوير الذكي', 'تقديم الشكاوى'],
      restrictedAbove: ['الواجهة العامة - كافة الأدوات واللوحات الداخلية تتطلب تسجيل الدخول المعتمد'],
    },
  ];

  const handleInstantSwitch = (preset: 'OWNER' | 'SUPERVISOR' | 'ACCOUNTANT' | 'COURIER' | 'MERCHANT' | 'CUSTOMER') => {
    quickSwitchUser(preset);
    const selected = rolePortals.find((p) => p.preset === preset);
    if (selected) {
      setClearanceCard({
        title: selected.title,
        persona: selected.persona,
        ringNumber: selected.ringNumber,
        allowedIcons: selected.allowedIcons,
        restrictedAbove: selected.restrictedAbove,
      });
    }
    setFeedbackNotice(`تم تحليل الهوية واعتماد الرتبة: ${selected?.title}`);
    setTimeout(() => {
      onClose();
      setFeedbackNotice(null);
      setClearanceCard(null);
    }, 1400);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedbackNotice(null);
    setAiReport(null);

    try {
      const result = await loginUser(identifier || '01011122334', selectedRole);
      if (result.aiAudit) {
        setAiReport(result.aiAudit);
      }
      const selected = rolePortals.find((p) => p.targetRole === selectedRole || p.preset === selectedRole);
      if (selected) {
        setClearanceCard({
          title: selected.title,
          persona: selected.persona,
          ringNumber: selected.ringNumber,
          allowedIcons: selected.allowedIcons,
          restrictedAbove: selected.restrictedAbove,
        });
      }
      setFeedbackNotice(`تم التحقق من الهوية بنجاح وتعيين الصلاحيات الأمنية.`);
      setTimeout(() => {
        onClose();
        setFeedbackNotice(null);
        setClearanceCard(null);
      }, 1400);
    } catch (err) {
      console.error(err);
      setFeedbackNotice('حدث خطأ أثناء فحص الحساب.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.phone) return;

    setIsLoading(true);
    setFeedbackNotice(null);
    setAiReport(null);

    try {
      const result = await registerUser(regForm);
      if (result.aiAudit) {
        setAiReport(result.aiAudit);
      }
      setFeedbackNotice(result.message);
      setTimeout(() => {
        onClose();
        setFeedbackNotice(null);
      }, 1800);
    } catch (err) {
      console.error(err);
      setFeedbackNotice('فشل تسجيل الحساب، يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">بوابة الدخول والانضمام لمنظومة مشاوير</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                  نموذج الدوائر الأمنية
                </span>
              </div>
              <p className="text-xs text-slate-400">
                فرز دقيق للصلاحيات يضمن عزل كل دائرة وعرض الأدوات الخاصة بها فقط
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTab('INSTANT_PORTAL')}
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'INSTANT_PORTAL'
                ? 'border-amber-500 text-slate-950 bg-white font-black shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
            <span>الدخول الفوري حسب الدائرة</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGIN')}
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'LOGIN'
                ? 'border-amber-500 text-slate-950 bg-white font-black shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4 text-slate-600 shrink-0" />
            <span>تسجيل الدخول الرسمي</span>
          </button>

          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'REGISTER'
                ? 'border-amber-500 text-slate-950 bg-white font-black shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>طلب انضمام شريك جديد</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Notification Feedback Banner */}
          {feedbackNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
          )}

          {/* AI Access Audit Report */}
          {aiReport && (
            <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>تدقيق الأمان والذكاء الاصطناعي:</span>
                </span>
                <span className="font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400">
                  {aiReport.assignedRing?.ringName || 'الدائرة الأمنية المعتمدة'}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">{aiReport.aiSecurityAudit}</p>
            </div>
          )}

          {/* Google Sign-in with Firebase Auth */}
          <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-white border border-blue-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div className="text-right">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>تسجيل الدخول المعتمد بحساب Google</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold">
                    Firebase Auth
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  مصادقة آمنة وحفظ ومزامنة مستندات الحساب في قاعدة بيانات Cloud Firestore
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <span>دخول بحساب Google</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TAB 1: INSTANT ROLE PORTAL */}
          {activeTab === 'INSTANT_PORTAL' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                  اختر الدائرة التي ترغب في دخولها؛ سيتم تكييف كافة الأدوات والأيقونات بحسب هذا الدور حصراً:
                </span>
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">6 دوائر أمنية</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {rolePortals.map((portal) => {
                  const Icon = portal.icon;
                  const isCurrent =
                    currentUser.assignedRingLevel === portal.ringNumber &&
                    ((portal.preset === 'CUSTOMER' && currentUser.role === 'CUSTOMER') ||
                      (portal.preset === 'MERCHANT' && currentUser.role === 'MERCHANT') ||
                      (portal.preset === 'COURIER' && currentUser.role === 'COURIER') ||
                      (portal.preset === 'OWNER' && currentUser.role === 'ADMIN'));

                  return (
                    <div
                      key={portal.preset}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'border-amber-400 bg-amber-50/40 shadow-sm ring-1 ring-amber-400'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${portal.iconColor}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{portal.title}</h4>
                              <p className="text-[11px] text-slate-500">{portal.persona}</p>
                            </div>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${portal.badgeColor}`}>
                            دائرة #{portal.ringNumber}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {portal.description}
                        </p>
                      </div>

                      <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between">
                        {isCurrent ? (
                          <span className="text-xs font-black text-amber-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            أنت في هذه الدائرة حالياً
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">انتقال فوري وتكييف الواجهة</span>
                        )}

                        <button
                          onClick={() => handleInstantSwitch(portal.preset)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                          }`}
                        >
                          <span>{isCurrent ? 'تحديث الجلسة' : 'دخول فوري'}</span>
                          <ArrowRight className="w-3 h-3 shrink-0" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: OFFICIAL LOGIN */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  المستوى الوظيفي والدائرة الأمنية:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'GENERAL_MANAGER', label: 'المدير العام والمالك', ring: 'دائرة 1 (النواة)', icon: Crown },
                    { id: 'OPERATIONS_SUPERVISOR', label: 'مشرف العمليات', ring: 'دائرة 2 (الإدارية)', icon: UserCheck },
                    { id: 'ACCOUNTANT', label: 'المحاسب والمالية', ring: 'دائرة 3 (المالية)', icon: Coins },
                    { id: 'COURIER', label: 'مندوب التوصيل الميداني', ring: 'دائرة 4 (الميدان)', icon: Truck },
                    { id: 'MERCHANT', label: 'التاجر / المتجر', ring: 'دائرة 5 (الشركاء)', icon: Building2 },
                    { id: 'CUSTOMER', label: 'العميل وزائر التتبع', ring: 'دائرة 5 (الخارجية)', icon: User },
                  ].map((roleItem) => {
                    const Icon = roleItem.icon;
                    const isSelected = selectedRole === roleItem.id;
                    return (
                      <button
                        type="button"
                        key={roleItem.id}
                        onClick={() => setSelectedRole(roleItem.id)}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                            {roleItem.ring}
                          </span>
                        </div>
                        <div className="font-bold text-xs">{roleItem.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  رقم الهاتف أو المعرّف الوظيفي:
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="01xxxxxxxxx أو المعرف المسجل"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">كلمة المرور / الرمز السري:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-[11px] border border-slate-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  نظام التشفير الرقابي: يتم فحص صلاحيات الجلسة آلياً وعزل أي محاولة وصول خارج الدائرة المعتمدة.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                    <span>جاري التحقق عبر مدير العمليات الذكي...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تسجيل الدخول وفتح الدائرة الأمنية</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: REGISTER NEW PARTNER */}
          {activeTab === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الاسم بالكامل:</label>
                  <input
                    type="text"
                    required
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                    placeholder="الاسم الرباعي الرسمي"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع الحساب المطلوب:</label>
                  <select
                    value={regForm.role}
                    onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="COURIER">مندوب توصيل واستلام ميداني (الدائرة 4)</option>
                    <option value="MERCHANT">متجر / تاجر إلكتروني (الدائرة 5)</option>
                    <option value="OPERATIONS_SUPERVISOR">مشرف عمليات وتوزيع (الدائرة 2)</option>
                    <option value="ACCOUNTANT">محاسب ومدقق مالي (الدائرة 3)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الهاتف أو الواتساب:</label>
                  <input
                    type="tel"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الرقم القومي (للتدقيق الأمني):</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={regForm.nationalId}
                    onChange={(e) => setRegForm({ ...regForm, nationalId: e.target.value })}
                    placeholder="14 رقم بالبطاقة"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {regForm.role === 'COURIER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-200">
                  <div>
                    <label className="font-bold text-purple-900 block mb-1">وسيلة النقل:</label>
                    <select
                      value={regForm.vehicleType}
                      onChange={(e) => setRegForm({ ...regForm, vehicleType: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900"
                    >
                      <option value="MOTORCYCLE">دراجة نارية (موتوسيكل)</option>
                      <option value="CAR">سيارة ملاكي</option>
                      <option value="VAN">سيارة فان بضائع</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-purple-900 block mb-1">رقم اللوحة المعدنية:</label>
                    <input
                      type="text"
                      value={regForm.vehiclePlate}
                      onChange={(e) => setRegForm({ ...regForm, vehiclePlate: e.target.value })}
                      placeholder="مثال: س ق ص 718"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono"
                    />
                  </div>
                </div>
              )}

              {regForm.role === 'MERCHANT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">اسم المتجر أو البراند:</label>
                    <input
                      type="text"
                      value={regForm.brandName}
                      onChange={(e) => setRegForm({ ...regForm, brandName: e.target.value })}
                      placeholder="اسم العلامة التجارية"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">نوع المنتجات:</label>
                    <input
                      type="text"
                      value={regForm.businessType}
                      onChange={(e) => setRegForm({ ...regForm, businessType: e.target.value })}
                      placeholder="ملابس، إلكترونيات، عطور..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-xl text-amber-950 text-[11px] border border-amber-200">
                🛡️ سيقوم مدير العمليات الذكي بالتحقق الفوري من المستندات، وإرسال ملف العاملين للدائرة الإدارية
                للمراجعة والاعتماد النهائي.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                    <span>جاري تدقيق البيانات وتعيين الدائرة الأمنية...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>إنشاء الحساب والتحقق الذكي بالأهليّة</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
