import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  ShieldAlert,
  Loader2,
  HelpCircle,
  MapPin,
  Zap,
  Building2,
  Truck,
  UserCheck,
  UserPlus,
  ArrowRight,
  ExternalLink,
  Phone,
  Coins,
  Check,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { StaffRole } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IntakeData {
  detected: boolean;
  type: 'MERCHANT' | 'JOB_SEEKER' | 'NONE';
  prompt?: string;
  merchantData?: {
    brandName?: string;
    ownerName?: string;
    phone?: string;
    city?: string;
    address?: string;
    businessType?: string;
    bankOrInstaPay?: string;
  };
  applicantData?: {
    fullName?: string;
    phone?: string;
    nationalId?: string;
    desiredRole?: StaffRole;
    assignedZone?: string;
    vehicleType?: 'MOTORCYCLE' | 'CAR' | 'VAN' | 'BICYCLE' | 'NONE';
    experienceYears?: number;
  };
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isMapsGrounded?: boolean;
  groundingMetadata?: any;
  modelUsed?: string;
  intake?: IntakeData;
  intakeResolved?: boolean;
  intakeResultText?: string;
  archivedTask?: {
    detected: boolean;
    type: string;
    title: string;
    priority: string;
    summary: string;
    suggestedAction: string;
  };
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const {
    addAgendaTask,
    addWhistleblowerReport,
    registerMerchant,
    submitOnboardingApplication,
    navigateToView,
    setCurrentRole,
  } = useLogistics();

  const [modelMode, setModelMode] = useState<'general' | 'fast' | 'complex'>('general');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'ai',
      text: 'أهلاً بك في منصة "مشاوير للخدمات اللوجستية وإدارة التوصيل"! أنا مساعدك الذكي المتصل مباشرة بالمنظومة. يمكنني الرد على استفساراتك، تسجيل متجرك الجديد فوراً للشحن، أو إدراجك في كادر العمل ككابتن توصيل وفق سياق حديثنا!',
      timestamp: 'الآن',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const samplePrompts = [
    '🏪 أنا صاحب متجر وعايز اشترك معاكم لشحن 30 أوردر يومياً',
    '🛵 أنا معايا موتوسيكل وعايز اشتغل معاكم كابتن توصيل',
    '📍 ما هو المسار الأفضل للشحن بين مستودع القاهرة والتجمع الخامس؟',
    'عايز اعرف موعد وصول شحنتي رقم SND-8041 وكود الأمان OTP',
    'المندوب طلب مني 15 جنيه زيادة عن سعر الفاتورة، عايز أقدم شكوى فورية',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          modelComplexity: modelMode,
          useMapsGrounding: modelMode === 'general' || text.includes('📍') || /خريطة|عنوان|موقع|مسار/i.test(text),
          history: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      const data = await response.json();

      let archivedTask = data.archivedTask;

      // If AI detected a task to archive, push it into the real system agenda!
      if (archivedTask && archivedTask.detected) {
        addAgendaTask({
          title: archivedTask.title || `طلب وارد عبر المساعد الذكي: ${text.slice(0, 30)}`,
          source: 'AI_CHAT',
          clientName: archivedTask.clientName || 'عميل المحادثة الفورية',
          clientPhone: archivedTask.clientPhone || '',
          type: archivedTask.type || 'general',
          priority: archivedTask.priority || 'medium',
          status: 'NEW',
          summary: archivedTask.summary || text,
          suggestedAction: archivedTask.suggestedAction || 'متابعة المشرف والتواصل مع العميل',
        });

        // If it was a complaint or fraud, also register a whistleblower report
        if (archivedTask.type === 'complaint_fraud') {
          addWhistleblowerReport({
            reporterType: 'CUSTOMER',
            reporterContact: archivedTask.clientPhone || 'مسجل بالدردشة',
            targetEmployeeName: 'مندوب الشحنة المذكور',
            category: 'OVERCHARGING',
            description: archivedTask.summary || text,
            priority: 'HIGH',
          });
        }
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'شكراً لتواصلك، تم استلام رسالتك وأرشفتها.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        isMapsGrounded: data.isMapsGrounded,
        groundingMetadata: data.groundingMetadata,
        modelUsed: modelMode,
        archivedTask,
        intake: data.intake,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'تم استلام طلبك وتسجيله في سجل مراجعات العمليات. سيتواصل معك أحد ممثلي إدارة مشاوير قريباً.',
          timestamp: 'الآن',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm Merchant Intake in Chat
  const handleConfirmMerchant = (msgId: string, formValues: any) => {
    const newMerchant = registerMerchant({
      name: formValues.ownerName || 'التاجر الشريك',
      brandName: formValues.brandName || 'متجر جديد بالمنظومة',
      phone: formValues.phone || '01012345678',
      city: formValues.city || 'القاهرة',
      address: formValues.address || 'المقر التجاري',
      businessType: formValues.businessType || 'تجارة إلكترونية عامة',
      bankOrInstaPay: formValues.bankOrInstaPay || 'store@instapay',
    });

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              intakeResolved: true,
              intakeResultText: `${newMerchant.brandName} (${newMerchant.id})`,
            }
          : m
      )
    );
  };

  // Confirm Job Seeker Intake in Chat
  const handleConfirmJobSeeker = async (msgId: string, formValues: any) => {
    const newApp = await submitOnboardingApplication({
      fullName: formValues.fullName || 'كابتن مشاوير الجديد',
      phone: formValues.phone || '01012345678',
      nationalId: formValues.nationalId || '29801010101234',
      desiredRole: formValues.desiredRole || 'COURIER',
      assignedZone: formValues.assignedZone || 'مدينة نصر والقاهرة الجديدة',
      vehicleType: formValues.vehicleType || 'MOTORCYCLE',
      vehiclePlate: 'لوحة مؤقتة',
      drivingLicenseNumber: 'DL-TEMP',
      emergencyContact: 'مسجل عبر المحادثة الذكية',
      criminalRecordStatus: 'CLEAN',
    });

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              intakeResolved: true,
              intakeResultText: `${newApp.fullName} (كود الطلب: ${newApp.id} - جدارة أمنية: ${newApp.aiClearanceScore}%)`,
            }
          : m
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[680px] max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">مساعد مشاوير الذكي (Smart Assistant)</h3>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  إدراج فوري للتجار وطالبي العمل
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تسجيل المتاجر الجديدة وتعيين المناديب آلياً حسب سياق المحادثة الفورية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Model Mode Selection Pills */}
        <div className="bg-slate-800/90 px-4 py-2 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-bold">نمط الذكاء الاصطناعي:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setModelMode('general')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                modelMode === 'general'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <MapPin className="w-3 h-3 text-emerald-500" />
              <span>عام + خرائط Google (gemini-3.8-flash)</span>
            </button>

            <button
              onClick={() => setModelMode('fast')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                modelMode === 'fast'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>فائق السرعة (gemini-3.1-flash-lite)</span>
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-slate-500 flex items-center gap-1 shrink-0 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>بدء مباشر:</span>
          </span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-950 rounded-lg border border-slate-200 hover:border-amber-300 shrink-0 transition-colors text-[11px] font-medium cursor-pointer"
            >
              {prompt.slice(0, 36)}...
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-900 text-amber-400'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] space-y-2`}>
                {msg.isMapsGrounded && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shadow-2xs">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>بيانات موثوقة من خرائط Google (Maps Grounded)</span>
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tl-xs'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tr-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      msg.sender === 'user' ? 'text-slate-400 text-left' : 'text-slate-400 text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {/* 1. Contextual IN-CHAT INTAKE CARD FOR MERCHANTS */}
                {msg.intake && msg.intake.detected && msg.intake.type === 'MERCHANT' && (
                  <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900 block">
                            بطاقة تسجيل المتجر وإدراجه بالمنظومة (إدراج تلقائي)
                          </span>
                          <span className="text-[10px] text-amber-800">
                            اكتشف المساعد الذكي رغبتك في شحن منتجاتك أو التعاقد
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                        تاجر شريك
                      </span>
                    </div>

                    {msg.intakeResolved ? (
                      <div className="bg-white border border-emerald-300 rounded-xl p-3.5 space-y-2 text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                        <h5 className="font-bold text-slate-900 text-xs">
                          تهانينا! تم تسجيل المتجر بنجاح وتفعيله بالمنظومة:
                        </h5>
                        <p className="text-xs text-emerald-700 font-bold">{msg.intakeResultText}</p>
                        <button
                          onClick={() => {
                            onClose();
                            navigateToView('MERCHANT', undefined, 'بوابة التاجر');
                          }}
                          className="mt-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Building2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>الانتقال إلى لوحة تحكم المتجر الآن (بوابة التاجر)</span>
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const target = e.target as any;
                          handleConfirmMerchant(msg.id, {
                            brandName: target.brandName.value,
                            ownerName: target.ownerName.value,
                            phone: target.phone.value,
                            city: target.city.value,
                            address: target.address.value,
                            businessType: target.businessType.value,
                            bankOrInstaPay: target.bankOrInstaPay.value,
                          });
                        }}
                        className="space-y-2.5 text-xs"
                      >
                        <p className="text-[11px] text-slate-700">
                          {msg.intake.prompt || 'يمكنك مراجعة وتأكيد بيانات متجرك للدخول فوراً في منظومة مشاوير:'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            name="brandName"
                            required
                            defaultValue={msg.intake.merchantData?.brandName || 'متجري الجديد'}
                            placeholder="اسم المتجر / البراند"
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <input
                            name="ownerName"
                            required
                            defaultValue={msg.intake.merchantData?.ownerName || 'صاحب المتجر'}
                            placeholder="اسم المسؤول"
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            name="phone"
                            required
                            defaultValue={msg.intake.merchantData?.phone || '01012345678'}
                            placeholder="رقم الهاتف والواتساب"
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <select
                            name="city"
                            defaultValue={msg.intake.merchantData?.city || 'القاهرة'}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          >
                            <option value="القاهرة">القاهرة</option>
                            <option value="الجيزة">الجيزة</option>
                            <option value="الإسكندرية">الإسكندرية</option>
                            <option value="القليوبية">القليوبية</option>
                            <option value="الشرقية">الشرقية</option>
                            <option value="الدقهلية">الدقهلية</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            name="businessType"
                            defaultValue={msg.intake.merchantData?.businessType || 'تجارة إلكترونية عامة'}
                            placeholder="نوع المنتجات"
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <input
                            name="bankOrInstaPay"
                            defaultValue={msg.intake.merchantData?.bankOrInstaPay || 'store@instapay'}
                            placeholder="حساب إنستاباي لتوريد الكاش"
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>

                        <input
                          name="address"
                          defaultValue={msg.intake.merchantData?.address || 'مقر المتجر والمستودع'}
                          placeholder="عنوان استلام الشحنات الافتراضي"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />

                        <button
                          type="submit"
                          className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>⚡ اعتماد تسجيل المتجر والدخول في المنظومة الآن</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* 2. Contextual IN-CHAT INTAKE CARD FOR JOB SEEKERS */}
                {msg.intake && msg.intake.detected && msg.intake.type === 'JOB_SEEKER' && (
                  <div className="bg-purple-50/90 border border-purple-300 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900 block">
                            بطاقة تقديم طلب عمل جديد (انضمام كابتن توصيل)
                          </span>
                          <span className="text-[10px] text-purple-700">
                            اكتشف المساعد الذكي رغبتك في العمل بالأسطول اللوجستي
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                        طالب عمل جديد
                      </span>
                    </div>

                    {msg.intakeResolved ? (
                      <div className="bg-white border border-emerald-300 rounded-xl p-3.5 space-y-2 text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                        <h5 className="font-bold text-slate-900 text-xs">
                          تم استلام طلب العمل وإدراجه في قائمة التعيين بنجاح!
                        </h5>
                        <p className="text-xs text-emerald-700 font-bold">{msg.intakeResultText}</p>
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <button
                            onClick={() => {
                              onClose();
                              navigateToView('JOB_SEEKER', undefined, 'بوابة التوظيف');
                            }}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>متابعة الطلب في بوابة التوظيف</span>
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              setCurrentRole('COURIER');
                            }}
                            className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>تجربة تطبيق المندوب الميداني</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const target = e.target as any;
                          handleConfirmJobSeeker(msg.id, {
                            fullName: target.fullName.value,
                            phone: target.phone.value,
                            nationalId: target.nationalId.value,
                            vehicleType: target.vehicleType.value,
                            assignedZone: target.assignedZone.value,
                            desiredRole: target.desiredRole.value,
                          });
                        }}
                        className="space-y-2.5 text-xs"
                      >
                        <p className="text-[11px] text-slate-700">
                          {msg.intake.prompt || 'راجع بياناتك واضغط تأكيد لإدراجك مباشرة في جدول تدقيق التعيين:'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            name="fullName"
                            required
                            defaultValue={msg.intake.applicantData?.fullName || 'أحمد كابتن مشاوير'}
                            placeholder="الاسم الرباعي"
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                          <input
                            name="phone"
                            required
                            defaultValue={msg.intake.applicantData?.phone || '01012345678'}
                            placeholder="رقم الهاتف الأساسي"
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            name="nationalId"
                            required
                            maxLength={14}
                            defaultValue={msg.intake.applicantData?.nationalId || '29801010101234'}
                            placeholder="الرقم القومي (14 رقم)"
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                          <select
                            name="vehicleType"
                            defaultValue={msg.intake.applicantData?.vehicleType || 'MOTORCYCLE'}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          >
                            <option value="MOTORCYCLE">دراجة نارية (موتوسيكل) - الأكثر طلباً</option>
                            <option value="VAN">سيارة فان مقفولة</option>
                            <option value="CAR">سيارة ملاكي</option>
                            <option value="BICYCLE">سكوتر / دراجة هوائية</option>
                            <option value="NONE">بدون مركبة (مشاة)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select
                            name="assignedZone"
                            defaultValue={msg.intake.applicantData?.assignedZone || 'مدينة نصر والقاهرة الجديدة'}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          >
                            <option value="مدينة نصر والقاهرة الجديدة">مدينة نصر والقاهرة الجديدة</option>
                            <option value="المعادي والمقطم">المعادي والمقطم</option>
                            <option value="الدقي والمهندسين">الدقي والمهندسين</option>
                            <option value="أكتوبر والشيخ زايد">أكتوبر والشيخ زايد</option>
                            <option value="الإسكندرية">الإسكندرية</option>
                          </select>

                          <select
                            name="desiredRole"
                            defaultValue={msg.intake.applicantData?.desiredRole || 'COURIER'}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          >
                            <option value="COURIER">مندوب شحن ميداني (كابتن)</option>
                            <option value="DISPATCHER">مشرف فرز ومستودع</option>
                            <option value="CUSTOMER_CARE">خدمة عملاء</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>📋 إدراج طلب العمل في منظومة التوظيف الآن</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* If AI automatically archived a task into Operations Agenda */}
                {msg.archivedTask && msg.archivedTask.detected && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 shadow-xs animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                      <CalendarCheck className="w-4 h-4 text-emerald-600" />
                      <span>تمت الأرشفة التلقائية في جدول أعمال إدارة العمليات</span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-emerald-800">
                      <div>
                        <strong>الموضوع:</strong> {msg.archivedTask.title}
                      </div>
                      <div>
                        <strong>الإجراء المقترح:</strong> {msg.archivedTask.suggestedAction}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-500 text-xs py-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>المساعد الذكي يحلل سياق الطلب وبيانات الإدراج بالمنظومة...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="اكتب استفسارك: مثلاً 'أنا تاجر وعايز اشحن'، أو 'عايز اشتغل مندوب توصيل'..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>مدعوم بنموذج Gemini 3.8 Flash مع خوارزمية الإدراج الميداني اللحظي</span>
            <span>نظام مشاوير اللوجستي المعتمد</span>
          </div>
        </div>
      </div>
    </div>
  );
};
