import React, { useState, useMemo } from 'react';
import {
  Truck,
  ShieldCheck,
  Search,
  Building2,
  Package,
  Clock,
  Sparkles,
  CheckCircle2,
  MapPin,
  Phone,
  ArrowLeft,
  Coins,
  Lock,
  RotateCcw,
  Star,
  Users,
  Send,
  Loader2,
  Calendar,
  Zap,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  ArrowUpRight,
  TrendingUp,
  Filter,
  Smartphone,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  FileText,
  BadgePercent,
  SlidersHorizontal,
  CircleDot,
  Headphones,
  CheckCheck,
  Code2,
  Home,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { BostaEcosystemHub } from './BostaEcosystemHub';

interface LandingPageProps {
  onOpenAiChat: () => void;
  onOpenOrderParser: () => void;
  onOpenComplaintsDesk?: () => void;
  onOpenAuthModal?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAiChat,
  onOpenOrderParser,
  onOpenComplaintsDesk,
  onOpenAuthModal,
}) => {
  const {
    shipments,
    getShipmentByTracking,
    addAgendaTask,
    setCurrentRole,
    navigateToView,
    governoratesCoverage,
  } = useLogistics();

  // ----------------------------------------------------
  // HERO CONSOLE STATE (Tracking vs Calculator vs Fast Onboard)
  // ----------------------------------------------------
  const [heroTab, setHeroTab] = useState<'TRACK' | 'CALCULATOR' | 'ONBOARD'>('TRACK');

  // Tracking Search State
  const [trackingInput, setTrackingInput] = useState('');
  const [trackedShipment, setTrackedShipment] = useState<any>(null);
  const [trackError, setTrackError] = useState(false);

  // Instant Rate Calculator State
  const [calcOrigin, setCalcOrigin] = useState('CAI');
  const [calcDestination, setCalcDestination] = useState('GZA');
  const [calcWeight, setCalcWeight] = useState(1.5);
  const [calcServiceType, setCalcServiceType] = useState<
    'NEXT_DAY' | 'SAME_DAY' | 'EXCHANGE' | 'FRAGILE'
  >('NEXT_DAY');
  const [calcHasCod, setCalcHasCod] = useState(true);
  const [calcCodAmount, setCalcCodAmount] = useState(450);

  // Cashflow & COD Payout Simulator State
  const [simWeeklyShipments, setSimWeeklyShipments] = useState(180);
  const [simAvgCodValue, setSimAvgCodValue] = useState(550);
  const [simPayoutChannel, setSimPayoutChannel] = useState<'INSTAPAY' | 'WALLET' | 'BANK'>(
    'INSTAPAY'
  );

  // Egyptian Regional Coverage Matrix State
  const [coverageRegionFilter, setCoverageRegionFilter] = useState<string>('ALL');
  const [coverageSearchQuery, setCoverageSearchQuery] = useState('');

  // Interactive WhatsApp Simulator State
  const [whatsappStep, setWhatsappStep] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState(false);

  // API Integration Code Tab
  const [apiSnippetLang, setApiSnippetLang] = useState<'CURL' | 'NODE' | 'PYTHON'>('CURL');

  // Interactive FAQ State
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [faqCategory, setFaqCategory] = useState<'ALL' | 'COD' | 'RETURNS' | 'SERVICES' | 'TECH'>(
    'ALL'
  );

  // Partnership Application State
  const [partnerForm, setPartnerForm] = useState({
    brandName: '',
    ownerName: '',
    phone: '',
    city: 'القاهرة',
    businessType: 'ملابس وأزياء',
    expectedVolume: '150 - 400 شحنة شهرياً',
  });
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerEvaluation, setPartnerEvaluation] = useState<any>(null);

  // Advanced Benchmark Hub Toggle
  const [showBenchmarkHub, setShowBenchmarkHub] = useState(false);

  // ----------------------------------------------------
  // HANDLERS & CALCULATIONS
  // ----------------------------------------------------

  const handleTrackSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackingInput.trim()) return;
    const found = getShipmentByTracking(trackingInput.trim());
    if (found) {
      setTrackedShipment(found);
      setTrackError(false);
    } else {
      setTrackedShipment(null);
      setTrackError(true);
    }
  };

  const handleQuickTrackCode = (code: string) => {
    setTrackingInput(code);
    const found = getShipmentByTracking(code);
    if (found) {
      setTrackedShipment(found);
      setTrackError(false);
    } else {
      setTrackedShipment(null);
      setTrackError(true);
    }
  };

  // Calculate Shipping Rate based on selected governorate and parameters
  const calculatedShippingQuote = useMemo(() => {
    const destGov =
      governoratesCoverage.find((g) => g.code === calcDestination) ||
      governoratesCoverage[0];
    let base = destGov ? destGov.baseFee : 40;

    // Additional weight charge (> 2kg)
    if (calcWeight > 2) {
      base += Math.ceil(calcWeight - 2) * 8;
    }

    // Service speed / type adjustment
    if (calcServiceType === 'SAME_DAY') {
      base += 25;
    } else if (calcServiceType === 'EXCHANGE') {
      base += 15; // Doorstep try-on and exchange
    } else if (calcServiceType === 'FRAGILE') {
      base += 10;
    }

    // COD handling fee (free for standard volumes in Mashaweer)
    const codFee = calcHasCod ? 0 : 0;

    const totalFee = base + codFee;
    const sla =
      calcServiceType === 'SAME_DAY'
        ? 'خلال 8 - 12 ساعة (نفس اليوم)'
        : `${destGov?.deliverySlaHours || 24} ساعة`;

    return {
      baseFee: base,
      totalFee,
      sla,
      successRate: destGov?.successRate || 96.5,
      isNextDayGuaranteed: destGov?.isNextDayGuaranteed ?? true,
      hubName: destGov?.hubName || 'المستودع الرئيسي',
    };
  }, [calcDestination, calcWeight, calcServiceType, calcHasCod, governoratesCoverage]);

  // Cashflow & COD calculations
  const cashflowStats = useMemo(() => {
    const monthlyShipments = simWeeklyShipments * 4.2;
    const grossVolume = monthlyShipments * simAvgCodValue;
    const netCashReturn = grossVolume * 0.94; // After shipping
    const estimatedSavedReturns = Math.round(monthlyShipments * 0.08 * 85); // Saving 8% of returns worth 85 EGP avg delivery/waste
    const daysToPayout =
      simPayoutChannel === 'INSTAPAY'
        ? 'نفس اليوم / صباح الغد (أقل من 24 ساعة)'
        : simPayoutChannel === 'WALLET'
        ? 'خلال 24 ساعة مباشرة على المحفظة'
        : 'خلال 24 إلى 48 ساعة لحساب البنك';

    return {
      monthlyShipments: Math.round(monthlyShipments),
      grossVolume: Math.round(grossVolume),
      netCashReturn: Math.round(netCashReturn),
      estimatedSavedReturns,
      daysToPayout,
    };
  }, [simWeeklyShipments, simAvgCodValue, simPayoutChannel]);

  // Filtered Governorates
  const filteredGovernorates = useMemo(() => {
    return governoratesCoverage.filter((g) => {
      const matchesRegion =
        coverageRegionFilter === 'ALL' || g.region === coverageRegionFilter;
      const matchesQuery =
        !coverageSearchQuery.trim() ||
        g.nameAr.toLowerCase().includes(coverageSearchQuery.toLowerCase()) ||
        g.hubName.toLowerCase().includes(coverageSearchQuery.toLowerCase());
      return matchesRegion && matchesQuery;
    });
  }, [governoratesCoverage, coverageRegionFilter, coverageSearchQuery]);

  // Handle Partnership Application Submission
  const handlePartnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.brandName || !partnerForm.phone) return;

    setPartnerLoading(true);
    setPartnerEvaluation(null);

    try {
      const res = await fetch('/api/ai/partnership-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantInfo: partnerForm }),
      });
      const data = await res.json();
      setPartnerEvaluation(data);

      addAgendaTask({
        title: `طلب تعاقد متجر جديد: ${partnerForm.brandName}`,
        source: 'WEB_FORM',
        clientName: partnerForm.ownerName || partnerForm.brandName,
        clientPhone: partnerForm.phone,
        type: 'merchant_partnership',
        priority: 'high',
        status: 'NEW',
        summary: `نشاط: ${partnerForm.businessType} - الحجم: ${partnerForm.expectedVolume} - التقييم الذكي: ${data.partnershipTier}`,
        suggestedAction: 'تجهيز مسودة التعاقد وجدولة أول جولة استلام للمتجر.',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setPartnerLoading(false);
    }
  };

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // API Code snippets
  const getApiSnippet = () => {
    if (apiSnippetLang === 'CURL') {
      return `curl -X POST https://api.mashaweer-logistics.eg/v1/shipments \\
  -H "Authorization: Bearer sk_live_egypt_mashaweer_992" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient_name": "أحمد محمود",
    "recipient_phone": "01012345678",
    "governorate": "CAIRO",
    "district": "مدينة نصر",
    "address": "شارع عباس العقاد، عمارة 42",
    "items_description": "حذاء كاجوال جلد طبيعي مقاس 43",
    "cod_amount": 650,
    "allow_try_on": true,
    "speed": "NEXT_DAY"
  }'`;
    }
    if (apiSnippetLang === 'NODE') {
      return `import { MashaweerClient } from '@mashaweer/sdk';

const client = new MashaweerClient({
  apiKey: process.env.MASHAWEER_API_KEY
});

// إنشاء شحنة فورية مع خاصية المعاينة والدفع عند الاستلام
const shipment = await client.shipments.create({
  recipient: {
    name: 'أحمد محمود',
    phone: '01012345678',
    city: 'القاهرة',
    district: 'مدينة نصر',
    address: 'شارع عباس العقاد، عمارة 42'
  },
  codAmount: 650,
  allowDoorstepTryOn: true,
  items: [{ title: 'حذاء كاجوال جلد طبيعي', quantity: 1 }]
});

console.log('رقم البوليصة:', shipment.trackingNumber);
// كود الأمان المشفر OTP يرسل تلقائياً لهاتف العميل`;
    }
    return `import requests

url = "https://api.mashaweer-logistics.eg/v1/shipments"
headers = {
    "Authorization": "Bearer sk_live_egypt_mashaweer_992",
    "Content-Type": "application/json"
}
payload = {
    "recipient_name": "أحمد محمود",
    "recipient_phone": "01012345678",
    "governorate": "CAIRO",
    "cod_amount": 650,
    "allow_try_on": True
}

response = requests.post(url, json=payload, headers=headers)
print("Shipment Created:", response.json())`;
  };

  // FAQ data
  const faqList = [
    {
      category: 'COD',
      question: 'متى وكيف يتم تحويل أموال الدفع عند الاستلام (COD) لحساب المتجر؟',
      answer:
        'في مشاوير، يتم تحويل الكاش المحصل يومياً وبحد أقصى خلال 24 ساعة من تسليم الشحنة عبر شبكة المدفوعات اللحظية InstaPay أو المحافظ الإلكترونية (فودافون كاش، أورنج كاش، إي آند) أو الحساب البنكي (CIB، الأهلي، بنك مصر)، مع إشعار فوري وكشف حساب رقمي مفصل لكل بوليصة.',
    },
    {
      category: 'RETURNS',
      question: 'كيف تضمن شركة مشاوير عدم وجود مرتجعات كاذبة من المناديب؟',
      answer:
        'نطبق ميثاق "زيرو فساد" الصارم: لا يمكن لأي مندوب تسجيل مرتجع إلا بعد إثبات 3 محاولات اتصال هاتفية مسجلة في النظام وتطابق موقعه الجغرافي GPS عند عنوان العميل. كما يتواصل فريق التحقق الذكي هاتفياً مع العميل فوراً للتأكد قبل إعادة الطرد للمخزن.',
    },
    {
      category: 'SERVICES',
      question: 'ما هي خدمة "المعاينة والاستبدال الفوري على الباب" (Try-On & Exchange)؟',
      answer:
        'خدمة مبتكرة مخصصة لمتاجر الملابس والأحذية والإكسسوارات في مصر: ينتظر المندوب العميل حتى يجرب المقاس أو يعاين الخامات. وإذا رغب في تبديل المقاس، يسلم المندوب القطعة البديلة ويستلم المرتجع في نفس الزيارة وبدون تكلفة شحن إضافية مضاعفة!',
    },
    {
      category: 'SERVICES',
      question: 'ما هي مواعيد وطريقة طلب جولات الاستلام (Pickups) من المخزن؟',
      answer:
        'يمكنك جدولة جولة الاستلام بضغطة زر عبر لوحة تحكم التاجر أو الواتساب حتى الساعة 3:00 عصراً ليتم الاستلام في نفس اليوم. نوفر استلامات يومية مجانية للمتاجر المتعاقدة بأسطول سيارات وسكوترز مجهزة.',
    },
    {
      category: 'TECH',
      question: 'هل يمكن ربط متجري على شوبيفاي أو ووكومرس أو سلة تلقائياً؟',
      answer:
        'نعم، توفر مشاوير إضافات وتكاملات جاهزة (Plugins) لـ Shopify وWooCommerce وEasyOrders وYouCan وزد وسلة، بالإضافة إلى REST API متطور يتيح إنشاء البوليصات وطباعتها بباركود ذكي بنقرة واحدة.',
    },
    {
      category: 'COD',
      question: 'ما هو رمز الأمان الرقمي OTP وكيف يحمي حقوق التاجر والمشتري؟',
      answer:
        'هو كود سري من 4 أرقام يصل فقط إلى هاتف المشتري في رسالة نصية. لا يستطيع المندوب إغلاق الشحنة أو تسليمها إلا بعد طلب هذا الكود من العميل وإدخاله في تطبيقه الميداني، مما يقضي تماماً على النزاعات ومشاكل التسليم الوهمي.',
    },
  ];

  const filteredFaqs = useMemo(() => {
    return faqList.filter(
      (f) => faqCategory === 'ALL' || f.category === faqCategory
    );
  }, [faqCategory]);

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
      {/* ======================================================== */}
      {/* 1. TOP LIVE TICKER & TRUST ANNOUNCER */}
      {/* ======================================================== */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-amber-400 shrink-0">مباشر الآن:</span>
          <p className="truncate text-slate-300 font-medium text-[11px] sm:text-xs">
            تحصيل وتوريد فوري لكاش الـ COD عبر InstaPay | تسليم بضمان رمز الأمان OTP | تغطية شاملة لـ 27 محافظة مصرية
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-lg text-[11px] shadow-xs cursor-pointer transition-colors shrink-0"
            title="الصفحة الرئيسية (مشاوير)"
          >
            <Home className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <span>الرئيسية</span>
          </button>
          <button
            onClick={() => onOpenAuthModal?.()}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700 shrink-0"
            title="تسجيل الدخول وتحليل الهوية وفق نموذج الدوائر الأمنية"
          >
            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
            <span>تسجيل الدخول وتحديد الرتبة</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. HERO SECTION & INTERACTIVE CONSOLE */}
      {/* ======================================================== */}
      <section className="relative space-y-8 text-center max-w-5xl mx-auto px-2 sm:px-4">
        {/* Floating pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-amber-400 text-xs font-bold border border-slate-800 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>منظومة الشحن والتوصيل الرائدة للتجارة الإلكترونية في مصر</span>
          <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
            E-Commerce Logistics 2.0
          </span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight">
            شحن أسرع لمتاجرك، <br className="hidden sm:inline" />
            تحصيل كاش يومي <span className="text-amber-600 underline decoration-amber-300 decoration-wavy">بأمانة مطلقة</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            منظومة <strong className="text-slate-900">مشاوير</strong> تجمع بين سرعة التوصيل في نفس اليوم،
            وتوريد أموال الدفع عند الاستلام (COD) خلال 24 ساعة عبر إنستاباي، مع درع رقمي لمكافحة المرتجعات الكاذبة
            والتحقق بكود الأمان المشفر (OTP) لخدمة أكثر من 15,000 علامة تجارية في 27 محافظة.
          </p>
        </div>

        {/* Quick Highlights Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-700 font-semibold pt-1">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تسليم 98.4% من أول محاولة</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>توريد كاش يومي عبر InstaPay</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <RotateCcw className="w-4 h-4 text-blue-600" />
            <span>معاينة واستبدال فوري على الباب</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>ميثاق زيرو فساد ورمز أمان OTP</span>
          </div>
        </div>

        {/* Dedicated Dual Portals Gateway Banner (Merchants & Job Seekers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto pt-2">
          {/* Card 1: Merchant App Gateway */}
          <div
            onClick={() => navigateToView('MERCHANT', undefined, 'بوابة التاجر')}
            className="group p-5 bg-gradient-to-br from-white to-amber-50/60 rounded-3xl border-2 border-amber-300 hover:border-amber-500 shadow-md hover:shadow-xl transition-all cursor-pointer text-right flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
                <Building2 className="w-3 h-3 text-amber-700" />
                <span>للتجار وأصحاب المتاجر</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                🏪 تطبيق وبوابة التجار المعتمدة
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                سجل متجرك فوراً، اشحن لجميع المحافظات، واطلب تحصيل الكاش اليومي عبر InstaPay.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-400 group-hover:bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110">
              <ArrowLeft className="w-6 h-6 rotate-180" />
            </div>
          </div>

          {/* Card 2: Job Seeker Gateway */}
          <div
            onClick={() => navigateToView('JOB_SEEKER', undefined, 'بوابة التوظيف')}
            className="group p-5 bg-gradient-to-br from-white to-purple-50/60 rounded-3xl border-2 border-purple-300 hover:border-purple-500 shadow-md hover:shadow-xl transition-all cursor-pointer text-right flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black">
                <Truck className="w-3 h-3 text-purple-700" />
                <span>لطالبي العمل والكباتن الجدد</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                🛵 بوابة التوظيف وطلب عمل جديد
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                انضم لأسطول كباتن مشاوير بدخل يصل لـ 20,000 ج.م شهرياً مع فحص أمني وتعيين فوري.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-700 group-hover:bg-purple-800 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110">
              <ArrowLeft className="w-6 h-6 rotate-180" />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* HERO INTERACTIVE CONSOLE (Tabs: Track / Rate Calculator / Onboard) */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-2xl p-4 sm:p-7 text-right transition-all max-w-4xl mx-auto">
          {/* Tab Headers */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHeroTab('TRACK')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  heroTab === 'TRACK'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>تتبع شحنتك المباشر</span>
              </button>

              <button
                type="button"
                onClick={() => setHeroTab('CALCULATOR')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  heroTab === 'CALCULATOR'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>حاسبة الأسعار والمدة ⚡</span>
              </button>

              <button
                type="button"
                onClick={() => setHeroTab('ONBOARD')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  heroTab === 'ONBOARD'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>ابدأ الشحن كتاجر</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              {heroTab === 'TRACK'
                ? 'استعلام لحظي برقم البوليصة وكود الـ OTP'
                : heroTab === 'CALCULATOR'
                ? 'أسعار شفافة بدون أي رسوم خفية'
                : 'انضم لأسطول مشاوير في أقل من دقيقة'}
            </span>
          </div>

          {/* TAB 1: LIVE TRACKING CONSOLE */}
          {heroTab === 'TRACK' && (
            <div className="pt-6 space-y-5 animate-in fade-in duration-200">
              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-slate-200 focus-within:border-slate-900 rounded-2xl transition-all">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="أدخل رقم بوليصة الشحنة (مثال: SND-8041 أو SND-8042)..."
                    className="w-full bg-transparent text-sm text-slate-900 focus:outline-hidden font-mono font-bold"
                  />
                  {trackingInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingInput('');
                        setTrackedShipment(null);
                        setTrackError(false);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      مسح
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>تتبع الشحنة الآن</span>
                </button>
              </form>

              {/* Sample Tracking Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                <span className="font-bold text-slate-700">شحنات تجريبية للمعاينة الحية:</span>
                {[
                  { code: 'SND-8041', label: 'سلمت بنجاح (القاهرة)' },
                  { code: 'SND-8042', label: 'في الطريق مع المندوب' },
                  { code: 'SND-8044', label: 'طلب استبدال ملابس' },
                  { code: 'SND-8046', label: 'محصل 750 ج.م' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleQuickTrackCode(item.code)}
                    className="bg-slate-100 hover:bg-amber-100 hover:border-amber-300 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer"
                  >
                    {item.code} ({item.label})
                  </button>
                ))}
              </div>

              {/* Active Tracked Result Card */}
              {trackedShipment && (
                <div className="mt-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-200 p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-500 block">رقم بوليصة التتبع:</span>
                      <strong className="text-lg font-mono font-black text-slate-900">
                        {trackedShipment.trackingNumber}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                          trackedShipment.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : trackedShipment.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : trackedShipment.status === 'RETURNED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {trackedShipment.status === 'DELIVERED' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>تم التسليم بنجاح ✓</span>
                          </>
                        ) : trackedShipment.status === 'OUT_FOR_DELIVERY' ? (
                          <>
                            <Truck className="w-3.5 h-3.5 text-blue-700 animate-bounce" />
                            <span>في الطريق مع المندوب</span>
                          </>
                        ) : trackedShipment.status === 'RETURNED' ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 text-rose-700" />
                            <span>شحنة مرتجعة للمخزن</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>قيد التجهيز بالمستودع</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Parcel Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">العميل المستلم:</span>
                      <strong className="text-slate-900 font-bold">{trackedShipment.recipientName}</strong>
                      <span className="text-[10px] text-slate-500 block truncate">{trackedShipment.city} - {trackedShipment.district}</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">المتجر الراسل:</span>
                      <strong className="text-slate-900 font-bold">{trackedShipment.merchantName}</strong>
                      <span className="text-[10px] text-emerald-600 block">شريك موثق</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">مبلغ التحصيل (COD):</span>
                      <strong className="text-slate-900 font-mono font-bold text-sm">
                        {trackedShipment.codAmount} ج.م
                      </strong>
                      <span className="text-[10px] text-slate-500 block">
                        {trackedShipment.status === 'DELIVERED' ? 'تم التوريد للمحفظة' : 'نقداً أو InstaPay'}
                      </span>
                    </div>

                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                      <span className="text-amber-800 block text-[11px] font-bold">كود الأمان السري (OTP):</span>
                      <strong className="text-slate-950 font-mono font-black text-base tracking-widest">
                        {trackedShipment.otpSecret}
                      </strong>
                      <span className="text-[10px] text-amber-700 block">خاص بالعميل فقط لمنع التلاعب</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-800 block mb-2">
                      مراحل حركة الطرد والتحقق الميداني:
                    </span>
                    <div className="space-y-2 text-xs">
                      {trackedShipment.timeline?.map((evt: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1 bg-white p-2 rounded-lg border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{evt.notes}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{evt.timestamp}</span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              بواسطة: {evt.actorName} ({evt.actorRole})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Immediate Dispute Trigger */}
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      واجهت أي تأخير أو استفسار بخصوص هذه الشحنة؟
                    </span>
                    <button
                      type="button"
                      onClick={onOpenComplaintsDesk}
                      className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                      <span>تحدث مع مكتب الشكاوى وفض النزاعات الذكي</span>
                    </button>
                  </div>
                </div>
              )}

              {trackError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between">
                  <span>لم يتم العثور على بوليصة بهذا الرقم. تأكد من إدخال الرمز بصيغة SND-8041 أو تواصل مع الدعم.</span>
                  <button
                    type="button"
                    onClick={onOpenAiChat}
                    className="underline text-rose-900 cursor-pointer"
                  >
                    مساعدة فورية
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INSTANT RATE & SLA CALCULATOR */}
          {heroTab === 'CALCULATOR' && (
            <div className="pt-6 space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Destination Governorate */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    محافظة التسليم (27 محافظة):
                  </label>
                  <select
                    value={calcDestination}
                    onChange={(e) => setCalcDestination(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:border-slate-900"
                  >
                    {governoratesCoverage.map((gov) => (
                      <option key={gov.code} value={gov.code}>
                        {gov.nameAr} - ({gov.deliverySlaHours} ساعة)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Approximate Weight */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    وزن الطرد التقريبي ({calcWeight} كجم):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0.5}
                      max={15}
                      step={0.5}
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200 shrink-0">
                      {calcWeight} كجم
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0.5 كجم (ملابس)</span>
                    <span>5 كجم (أحذية/إلكترونيات)</span>
                    <span>15 كجم (كرتونة)</span>
                  </div>
                </div>

                {/* Service Type */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    نوع الخدمة وسرعة التسليم:
                  </label>
                  <select
                    value={calcServiceType}
                    onChange={(e) => setCalcServiceType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:border-slate-900"
                  >
                    <option value="NEXT_DAY">توصيل قياسي موثوق (Next-Day)</option>
                    <option value="SAME_DAY">شحن فوري نفس اليوم (القاهرة والجيزة)</option>
                    <option value="EXCHANGE">معاينة واستبدال فوري على الباب</option>
                    <option value="FRAGILE">طرد عالي الحساسية / زجاجي ومغلف</option>
                  </select>
                </div>
              </div>

              {/* COD Toggle & Value */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={calcHasCod}
                      onChange={(e) => setCalcHasCod(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>شحنة دفع عند الاستلام (COD) مع تحصيل كاش</span>
                  </label>
                  {calcHasCod && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">المبلغ المطلوب تحصيله:</span>
                      <input
                        type="number"
                        value={calcCodAmount}
                        onChange={(e) => setCalcCodAmount(Number(e.target.value))}
                        className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono font-bold text-slate-900 text-center"
                      />
                      <span className="text-slate-600 font-bold">ج.م</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  ✓ عمولة تحصيل الـ COD: 0% مجاناً لمشتركي باقات المتاجر
                </div>
              </div>

              {/* Instant Calculated Quote Result Box */}
              <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block">التكلفة التقديرية للشحنة:</span>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-3xl font-black font-mono text-amber-400">
                      {calculatedShippingQuote.totalFee}
                    </strong>
                    <span className="text-sm font-bold text-slate-300">جنيه مصري</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    المدة المتوقعة للتسليم: {calculatedShippingQuote.sla} (نسبة نجاح {calculatedShippingQuote.successRate}%)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHeroTab('ONBOARD')}
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm cursor-pointer transition-colors shadow-md"
                  >
                    شحن بهذا السعر وإنشاء حساب
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAiChat}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer transition-colors border border-slate-700"
                  >
                    عرض أسعار خاص لكميات الجملة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FAST ONBOARDING FORM */}
          {heroTab === 'ONBOARD' && (
            <div className="pt-6 space-y-5 animate-in fade-in duration-200">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="block text-slate-900 font-bold">تعاقد فوري واستلام أول شحنة اليوم:</strong>
                  <span>
                    سجل بيانات متجرك الآن، وسيقوم الذكاء الاصطناعي بدراسة احتياجاتك وتخصيص باقة أسعار وتحديد موعد أول Pickup فوراً!
                  </span>
                </div>
              </div>

              <form onSubmit={handlePartnershipSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم المتجر أو البراند:</label>
                  <input
                    type="text"
                    required
                    value={partnerForm.brandName}
                    onChange={(e) => setPartnerForm({ ...partnerForm, brandName: e.target.value })}
                    placeholder="مثال: فاشون هاوس، براند كيدز..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم المسؤول / صاحب المتجر:</label>
                  <input
                    type="text"
                    required
                    value={partnerForm.ownerName}
                    onChange={(e) => setPartnerForm({ ...partnerForm, ownerName: e.target.value })}
                    placeholder="اسمك الكريم"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الهاتف أو الواتساب:</label>
                  <input
                    type="tel"
                    required
                    value={partnerForm.phone}
                    onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">موقع المخزن الرئيسي للاستلام:</label>
                  <select
                    value={partnerForm.city}
                    onChange={(e) => setPartnerForm({ ...partnerForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900"
                  >
                    <option value="القاهرة">القاهرة الكبرى</option>
                    <option value="الجيزة">الجيزة و6 أكتوبر والشيخ زايد</option>
                    <option value="الإسكندرية">الإسكندرية والساحل</option>
                    <option value="الدلتا">الدلتا (طنطا / المنصورة / الزقازيق)</option>
                    <option value="الصعيد">محافظات الصعيد</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع المنتجات:</label>
                  <select
                    value={partnerForm.businessType}
                    onChange={(e) => setPartnerForm({ ...partnerForm, businessType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900"
                  >
                    <option value="ملابس وأزياء">ملابس وأزياء وأحذية (تتطلب معاينة واستبدال)</option>
                    <option value="إلكترونيات وهواتف">إلكترونيات وهواتف وإكسسوارات</option>
                    <option value="مستحضرات تجميل">مستحضرات تجميل وعناية</option>
                    <option value="عطور وساعات">عطور وساعات وهدايا</option>
                    <option value="أخرى">سلع استهلاكية أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">حجم الشحنات المتوقع شهرياً:</label>
                  <select
                    value={partnerForm.expectedVolume}
                    onChange={(e) => setPartnerForm({ ...partnerForm, expectedVolume: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900"
                  >
                    <option value="50 - 150 شحنة">من 50 إلى 150 شحنة شهرياً</option>
                    <option value="150 - 400 شحنة">من 150 إلى 400 شحنة شهرياً</option>
                    <option value="400 - 1000 شحنة">من 400 إلى 1000 شحنة شهرياً (أسعار VIP)</option>
                    <option value="أكثر من 1000 شحنة">أكثر من 1000 شحنة شهرياً (Enterprise)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={partnerLoading}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    {partnerLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>جاري دراسة البيانات وإصدار عرض الأسعار بالذكاء الاصطناعي...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>إرسال طلب التعاقد والحصول على باقة الأسعار فوراً</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Instant Evaluation Result */}
              {partnerEvaluation && (
                <div className="mt-4 p-5 bg-white text-slate-900 rounded-2xl border-2 border-emerald-400 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-bold text-sm">
                        مبروك! تم قبول طلبك في الباقة: {partnerEvaluation.partnershipTier}
                      </h4>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                      {partnerEvaluation.feasibilityStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {partnerEvaluation.welcomeLetter}
                  </p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 block mb-1">
                      مواعيد الاستلام المقترحة لمتجرك:
                    </span>
                    <p className="text-slate-700">{partnerEvaluation.pickupSchedule}</p>
                    <p className="text-emerald-700 font-semibold mt-1">
                      شروط التوريد اليومي: {partnerEvaluation.securityDepositOrLimit}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      تم تحويل ملفك لجدول مواعيد استلام الشحنات.
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenAuthModal?.()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>دخول بوابة التاجر المعتمدة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. LIVE TRUST NUMBERS & KEY PERFORMANCE INDICATORS */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-1 hover:border-amber-400 transition-all">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
              إجمالي الطرود المسلمة
            </span>
            <strong className="text-2xl sm:text-4xl font-black font-mono text-slate-900 block">
              +5.4M
            </strong>
            <p className="text-[11px] text-emerald-600 font-semibold">
              سُلّمت بنجاح لكافة محافظات مصر
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-1 hover:border-amber-400 transition-all">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
              نسبة نجاح التسليم
            </span>
            <strong className="text-2xl sm:text-4xl font-black font-mono text-emerald-600 block">
              98.4%
            </strong>
            <p className="text-[11px] text-slate-500">
              تسليم من أول محاولة بدون مرتجعات وهمية
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-1 hover:border-amber-400 transition-all">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
              دورة تحويل أموال COD
            </span>
            <strong className="text-2xl sm:text-4xl font-black font-mono text-amber-500 block">
              24 ساعة
            </strong>
            <p className="text-[11px] text-slate-500">
              إيداع يومي عبر InstaPay والمحافظ
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-1 hover:border-amber-400 transition-all">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
              شبكة التغطية الجغرافية
            </span>
            <strong className="text-2xl sm:text-4xl font-black font-mono text-blue-600 block">
              27 محافظة
            </strong>
            <p className="text-[11px] text-slate-500">
              أسطول وسيارات ومستودعات إقليمية
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. INTERACTIVE COD CASHFLOW & EARNINGS SIMULATOR */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-2 border border-amber-500/30">
                <Coins className="w-3.5 h-3.5" />
                <span>محاكي دورة الكاش وتحصيل الأموال (COD Cashflow Simulator)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                احسب سرعة دوران رأس مالك مع مشاوير
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                في السوق المصري، احتجاز أموال الـ COD يقتل السيولة! شاهد كيف تضمن لك مشاوير استرداد أموالك
                يومياً وتوفير آلاف الجنيهات المهدرة في المرتجعات.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 text-xs shrink-0">
              <span className="text-slate-400 px-2 font-bold">طريقة الاستلام:</span>
              <button
                type="button"
                onClick={() => setSimPayoutChannel('INSTAPAY')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  simPayoutChannel === 'INSTAPAY'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                InstaPay فوري
              </button>
              <button
                type="button"
                onClick={() => setSimPayoutChannel('WALLET')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  simPayoutChannel === 'WALLET'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                فودافون كاش
              </button>
              <button
                type="button"
                onClick={() => setSimPayoutChannel('BANK')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  simPayoutChannel === 'BANK'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                حساب بنكي
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Controls: Sliders */}
            <div className="space-y-6">
              {/* Slider 1: Weekly Shipments */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">متوسط عدد الشحنات الخارجة من متجرك أسبوعياً:</span>
                  <span className="text-amber-400 font-mono text-base">{simWeeklyShipments} شحنة/أسبوع</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={1200}
                  step={10}
                  value={simWeeklyShipments}
                  onChange={(e) => setSimWeeklyShipments(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>20 شحنة (متجر ناشئ)</span>
                  <span>500 شحنة (متجر متوسط)</span>
                  <span>1200 شحنة (براند كبير)</span>
                </div>
              </div>

              {/* Slider 2: Average Basket Value */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">متوسط سعر الطرد (قيمة التحصيل COD):</span>
                  <span className="text-amber-400 font-mono text-base">{simAvgCodValue} جنيه مصري</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={2500}
                  step={50}
                  value={simAvgCodValue}
                  onChange={(e) => setSimAvgCodValue(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>200 ج.م</span>
                  <span>1000 ج.م</span>
                  <span>2500 ج.م</span>
                </div>
              </div>

              {/* Comparison Callout */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>مقارنة دورة استلام الكاش:</span>
                  <span>مشاوير تفوز بفرق شاسع ⚡</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">مع الشركات التقليدية:</span>
                    <strong className="text-rose-400 font-bold block mt-0.5">من 14 إلى 28 يوماً</strong>
                    <span className="text-[10px] text-slate-500">تجميد للسيولة وأزمة شراء بضاعة</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                    <span className="text-[10px] text-emerald-300 block">مع منظومة مشاوير:</span>
                    <strong className="text-emerald-400 font-bold block mt-0.5">يومياً خلال 24 ساعة</strong>
                    <span className="text-[10px] text-emerald-200 font-mono">{cashflowStats.daysToPayout}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Display: Calculated Metrics Board */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-700 space-y-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                توقعات التدفقات النقدية الشهرية لمتجرك:
              </span>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">إجمالي كاش المبيعات الشهري:</span>
                    <strong className="text-2xl sm:text-3xl font-black font-mono text-white">
                      {cashflowStats.grossVolume.toLocaleString('ar-EG')} ج.م
                    </strong>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono">
                    ~{cashflowStats.monthlyShipments} طرد/شهر
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">صافي أرباحك المحولة لمحفظتك:</span>
                    <strong className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                      {cashflowStats.netCashReturn.toLocaleString('ar-EG')} ج.م
                    </strong>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    إيداع يومي بلا انقطاع
                  </span>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>وفر شهري في المرتجعات بفضل ميثاق زيرو فساد:</span>
                  </div>
                  <strong className="text-sm font-mono text-emerald-400 font-bold">
                    +{cashflowStats.estimatedSavedReturns.toLocaleString('ar-EG')} ج.م
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHeroTab('ONBOARD')}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm cursor-pointer transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>ابدأ الشحن واستلم أرباحك يومياً مع مشاوير</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. SOLUTIONS FOR EGYPTIAN MERCHANTS (THE 6 PILLARS) */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
            مميزات مصممة خصيصاً للتجارة الإلكترونية في مصر
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            حللنا أكبر 6 مشاكل تواجه التاجر المصري
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            بنينا منظومة مشاوير لتقضي على التلاعب، وتخفض المرتجعات، وتمنحك راحة بال مطلقة في إدارة الشحن.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Doorstep Try-On & Exchange */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-base">
                المعاينة والاستبدال الفوري على الباب
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ينتظر المندوب العميل حتى يجرب المقاس أو يعاين جودة المنتج. إذا رغب في استبدال المقاس،
                نسلمه القطعة الجديدة ونستلم القديمة في نفس الزيارة دون تحميل متجرك شحن مزدوج!
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-bold">
              <span>تزيد مبيعات الملابس والأحذية بـ 35%</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Next-Day COD via InstaPay */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Coins className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-base">
                تحصيل يومي فوري عبر InstaPay
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                لا ننتظر أسبوعاً أو شهراً لتحويل فلوس بضاعتك. كل شحنة تُسلّم وتُحصّل نقداً يتم توريدها
                لحسابك أو محفظتك الإلكترونية خلال 24 ساعة بكشف حساب شفاف وفوري.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-bold">
              <span>سيولة دائمة ومحفظة مالية رقمية</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Anti-Fake Returns */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-base">
                درع مكافحة المرتجعات الكاذبة
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ممنوع تماماً أن يسجل المندوب "العميل مغلق أو لا يرد" دون إثبات 3 مكالمات مسجلة ومطابقة موقعه
                GPS عند عمارة العميل، مع إعادة محاولة مجانية ومكالمة تأكيد من خدمة العملاء.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-rose-700 font-bold">
              <span>تخفيض المرتجعات لأقل من 3.2%</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: OTP Proof of Delivery */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-base">
                رمز أمان مشفر (OTP) على هاتف العميل
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                لا يمكن للمندوب تأكيد تسليم الشحنة أو إغلاقها في التطبيق إلا بعد إدخال الكود السري الخاص
                الذي يصل في رسالة لموبايل المشتري فقط. انتهى عصر "المندوب سلم ومحدش استلم".
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-700 font-bold">
              <span>حماية قانونية ومالية 100%</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 5: Same-Day Greater Cairo & Alex */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-base">
                شحن فوري في نفس اليوم (Same-Day)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                استلام الطرود صباحاً وتسليمها مساءً في القاهرة والجيزة ومدينة نصر والتجمع وأكتوبر والإسكندرية.
                سرعة فائقة تفاجئ عملاءك وتمنح متجرك أفضلية تنافسية كبرى.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-700 font-bold">
              <span>توصيل خلال ساعات معدودة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 6: Smart Warehousing & Fulfillment */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-base">
                التخزين والتعبئة الذكية (Fulfillment Hub)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                خزّن منتجاتك في مستودعاتنا المركزية، ونحن نتولى سحب الطلبات آلياً من متجرك وتجهيزها
                وتغليفها بأمان مع طباعة البوليصات وإرسالها للتوصيل فوراً دون أي إرهاق لفريقك.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-bold">
              <span>توفير 40% من تكاليف المخازن والعمالة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. INTERACTIVE WHATSAPP & REAL-TIME CUSTOMER JOURNEY SIMULATOR */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Smartphone className="w-4 h-4" />
                <span>تجربة العميل النهائي (End-User Experience)</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                شاهد كيف يشعر عميلك بالثقة عبر واتساب مشاوير التفاعلي
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                يتلقى المشتري في مصر إشعارات لحظية تبلغه بمكان الشحنة، ورقم المندوب المباشر، وكود الأمان، مع
                إمكانية تأكيد الموعد أو تغييره بنقرة واحدة لضمان أعلى نسبة استلام.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWhatsappStep(1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  whatsappStep === 1 ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                1. استلام الطلب
              </button>
              <button
                type="button"
                onClick={() => setWhatsappStep(2)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  whatsappStep === 2 ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                2. المندوب في الطريق
              </button>
              <button
                type="button"
                onClick={() => setWhatsappStep(3)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  whatsappStep === 3 ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                3. كود OTP والتسليم
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Interactive Phone Frame Simulation */}
            <div className="max-w-sm mx-auto w-full bg-slate-950 p-3 rounded-[36px] border-4 border-slate-700 shadow-2xl space-y-3">
              {/* WhatsApp Header */}
              <div className="bg-emerald-700 text-white p-3 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-900 flex items-center justify-center font-bold text-amber-300">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block font-bold">مشاوير لوجستكس مصر</strong>
                    <span className="text-[10px] text-emerald-100">نشط الآن (حساب تجاري موثق ✓)</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono opacity-80">11:42 ص</span>
              </div>

              {/* Chat Body */}
              <div className="bg-[#0b141a] p-3 rounded-2xl space-y-3 min-h-[280px] text-xs">
                {whatsappStep >= 1 && (
                  <div className="bg-[#202c33] text-slate-100 p-3 rounded-2xl rounded-tr-none space-y-2 border border-slate-800 shadow-xs animate-in fade-in">
                    <p className="font-bold text-emerald-400">
                      أهلاً بك يا أستاذ أحمد! 👋
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      شحنتك من متجر <strong>«إليجانس فاشون»</strong> رقم <span className="font-mono text-amber-400 font-bold">#SND-8041</span> تم استلامها وجاهزة للتوصيل إلى عنوانك في مدينة نصر.
                    </p>
                    <span className="text-[9px] text-slate-400 block text-left font-mono">11:42 ص ✓✓</span>
                  </div>
                )}

                {whatsappStep >= 2 && (
                  <div className="bg-[#202c33] text-slate-100 p-3 rounded-2xl rounded-tr-none space-y-2 border border-slate-800 shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                      <Truck className="w-3.5 h-3.5" />
                      <span>المندوب في طريقه إليك الآن!</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      المندوب <strong>حسام البدري</strong> (01099887766) سيتواصل معك خلال 30 دقيقة.
                    </p>
                    <div className="bg-slate-900/80 p-2 rounded-xl text-[10px] text-slate-300 flex justify-between">
                      <span>المبلغ المطلوب تجهيزه:</span>
                      <strong className="font-mono text-amber-400 font-bold">450 ج.م</strong>
                    </div>
                    <span className="text-[9px] text-slate-400 block text-left font-mono">12:15 م ✓✓</span>
                  </div>
                )}

                {whatsappStep >= 3 && (
                  <div className="bg-[#202c33] text-slate-100 p-3 rounded-2xl rounded-tr-none space-y-2 border border-emerald-600/40 shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                      <Lock className="w-3.5 h-3.5" />
                      <span>كود الأمان السري للتسليم (OTP)</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      برجاء إعطاء هذا الكود للمندوب فقط عند استلام وفحص الطرد:
                    </p>
                    <div className="text-center py-2 bg-slate-900 rounded-xl">
                      <span className="text-xl font-mono font-black tracking-widest text-amber-400">
                        7392
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 block text-left font-mono">12:30 م ✓✓</span>
                  </div>
                )}
              </div>

              {/* Step controller bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
                <span>المرحلة الحالية: {whatsappStep} من 3</span>
                <button
                  type="button"
                  onClick={() => setWhatsappStep(whatsappStep < 3 ? whatsappStep + 1 : 1)}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  {whatsappStep < 3 ? 'التالي: الخطوة التالية' : 'إعادة العرض من البداية'}
                </button>
              </div>
            </div>

            {/* Explanation & Value to Merchants */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                لماذا تقلل هذه التجربة المرتجعات بنسبة 40%؟
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                  <span>
                    <strong>تجهيز الكاش مسبقاً:</strong> يعرف المشتري المبلغ الدقيق المطلوب تحضيره نقداً أو عبر InstaPay قبل وصول المندوب بساعة.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                  <span>
                    <strong>رقم المندوب المباشر:</strong> يتيح للعميل التنسيق المباشر والرد على الاتصال دون تجاهل الأرقام الغريبة.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                  <span>
                    <strong>أمان كود OTP:</strong> يمنع نهائياً أي تلاعب أو تسليم خاطئ أو تسجيل مرتجع بدون رغبة العميل.
                  </span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setHeroTab('ONBOARD')}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <span>وفّر هذه التجربة لعملائك من اليوم</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. ALL 27 GOVERNORATES COVERAGE MATRIX & REGIONAL HUBS */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">
              تغطية جغرافية كاملة
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              شبكة مراكز التوزيع والمحافظات الـ 27
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              من الإسكندرية ومطروح وحتى الأقصر وأسوان، أسطولنا يغطي كل شبر في مصر بالتزام صارم بمواعيد الوصول.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={coverageSearchQuery}
                onChange={(e) => setCoverageSearchQuery(e.target.value)}
                placeholder="ابحث عن محافظتك..."
                className="bg-white border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'ALL', label: 'كافة محافظات مصر (27)' },
            { id: 'GREATER_CAIRO', label: 'القاهرة الكبرى والجيزة' },
            { id: 'ALEXANDRIA', label: 'الإسكندرية والساحل' },
            { id: 'DELTA_CANAL', label: 'الدلتا ومدن القناة' },
            { id: 'UPPER_EGYPT', label: 'شمال وجنوب الصعيد' },
            { id: 'FRONTIER', label: 'المحافظات الحدودية' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCoverageRegionFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                coverageRegionFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Governorates Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredGovernorates.map((gov) => (
            <div
              key={gov.code}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{gov.nameAr}</h4>
                  <span className="text-[11px] text-slate-400 block">{gov.hubName}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    gov.isNextDayGuaranteed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {gov.deliverySlaHours} ساعة
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block">سعر الشحن الأساسي:</span>
                  <strong className="text-slate-900 font-mono font-bold">{gov.baseFee} ج.م</strong>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 text-[10px] block">نسبة النجاح:</span>
                  <strong className="text-emerald-600 font-mono font-bold">{gov.successRate}%</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCalcDestination(gov.code);
                    setHeroTab('CALCULATOR');
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="text-amber-600 hover:text-amber-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>احسب السعر</span>
                  <ArrowLeft className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. SEAMLESS ECOMMERCE INTEGRATIONS & DEVELOPER API */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span>الربط البرمجي السلس (Instant Integrations & API)</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                اربط متجرك بضغطة زر أو ابدأ بالـ API في 5 دقائق
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                تكامل مباشر مع كافة منصات التجارة الإلكترونية، مع إمكانية رفع شيت إكسل بـ 1000 شحنة
                بضغطة واحدة وطباعة البوليصات فوراً.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setApiSnippetLang('CURL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                  apiSnippetLang === 'CURL' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                cURL
              </button>
              <button
                type="button"
                onClick={() => setApiSnippetLang('NODE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                  apiSnippetLang === 'NODE' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Node.js
              </button>
              <button
                type="button"
                onClick={() => setApiSnippetLang('PYTHON')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                  apiSnippetLang === 'PYTHON' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Python
              </button>
            </div>
          </div>

          {/* Supported Platforms Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center text-xs">
            {['Shopify', 'WooCommerce', 'EasyOrders', 'YouCan', 'زد / Zid', 'سلة / Salla'].map((platform) => (
              <div
                key={platform}
                className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 font-bold text-slate-200 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{platform}</span>
              </div>
            ))}
          </div>

          {/* Code Viewer Box */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-xs relative overflow-x-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-400 mb-3">
              <span>POST /v1/shipments - إنشاء بوليصة شحنة جديدة</span>
              <button
                type="button"
                onClick={() => handleCopySnippet(getApiSnippet())}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-sans font-bold cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-slate-300 text-left dir-ltr leading-relaxed">
              {getApiSnippet()}
            </pre>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 9. TESTIMONIALS FROM LEADING EGYPTIAN BRANDS */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
            قصص نجاح حقيقية
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ماذا يقول كبار التجار والبراندات عن مشاوير؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            أكثر من 15,000 علامة تجارية في مصر تعتمد على مشاوير لتسريع نموها واستقرار سيولتها.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                "كنا نعاني من تأخير تحصيل الكاش مع شركات الشحن لدرجة أننا كنا نتوقف عن شراء أقمشة جديدة. مع مشاوير،
                الفلوس بتدخل حسابنا كل يوم الصبح عبر InstaPay، ونسبة المرتجعات نزلت من 18% لأقل من 4%!"
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                م.ط
              </div>
              <div>
                <strong className="block text-slate-900 text-xs font-bold">م. طارق الصاوي</strong>
                <span className="text-[11px] text-slate-500">مؤسس براند كاجوال وير - القاهرة</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                "خدمة المعاينة والاستبدال الفوري على الباب فرقت جداً في ثقة عميلاتنا. الزبونة بتقيس العباية أو الفستان
                والمندوب بيبدل المقاس فورياً في نفس المشوار بدون أي تعقيد. أفضل شريك شحن في مصر بدون منازع."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                ن.ف
              </div>
              <div>
                <strong className="block text-slate-900 text-xs font-bold">أ. نورهان فهمي</strong>
                <span className="text-[11px] text-slate-500">مديرة سلسلة إليجانس كولكشن - الإسكندرية</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                "الربط مع شوبيفاي أخذ منا حرفياً 3 دقائق. بنصدر 400 بوليصة في اليوم بضغطة واحدة، ورمز الأمان OTP حمى
                شحناتنا الثمينة من أي فقدان أو نزاعات. الدعم الفني ومدير الحساب متعاونين لأقصى درجة."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                ك.ش
              </div>
              <div>
                <strong className="block text-slate-900 text-xs font-bold">كريم الشناوي</strong>
                <span className="text-[11px] text-slate-500">مدير العمليات في متجر تكنو زون - الجيزة</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 10. DEDICATED SMART COMPLAINTS & AI DISPUTES DESK */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className="text-xs font-black text-rose-400 uppercase tracking-wide">
                مكتب حل النزاعات وحماية حقوق الشحن
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              خدمة عملاء حازمة ومنصفة.. مشكلتك تنتهي في دقائق
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              سواء كنت تاجراً تنتظر تحصيل مبيعاتك، أو مشترياً تأخر طرده أو طلب منه المندوب أي مبالغ إضافية؛
              مكتب الشكاوى المباشر متاح لحظياً للتحقيق واتخاذ الإجراءات التأديبية والتعويض الفوري.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenComplaintsDesk}
            className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>فتح تذكرة أو شكوى فورية</span>
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 11. INTERACTIVE FREQUENTLY ASKED QUESTIONS (FAQ) */}
      {/* ======================================================== */}
      <section className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
            كل ما يدور في ذهنك
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            الأسئلة الشائعة حول خدمات مشاوير
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            إجابات واضحة وشفافة حول التحصيل، الأسعار، المرتجعات، والربط البرمجي.
          </p>
        </div>

        {/* FAQ Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {[
            { id: 'ALL', label: 'كافة الأسئلة' },
            { id: 'COD', label: 'تحصيل الكاش وInstaPay' },
            { id: 'RETURNS', label: 'المرتجعات وضمان OTP' },
            { id: 'SERVICES', label: 'الاستبدال والشحن السريع' },
            { id: 'TECH', label: 'الربط والتكامل التقني' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFaqCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                faqCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = expandedFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 font-bold text-slate-900 text-xs sm:text-sm cursor-pointer hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 12. ADVANCED BOSTA BENCHMARK HUB ACCORDION TOGGLE */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-slate-100 rounded-3xl p-4 sm:p-6 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>مركز الابتكارات اللوجستية المتقدمة (Bosta Ecosystem Hub)</span>
              </h3>
              <p className="text-xs text-slate-500">
                استعرض محاكي صرف الكاش الفوري، وبوت الواتساب الآلي، وحاسبة التخزين المركزي والتعبئة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowBenchmarkHub(!showBenchmarkHub)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
            >
              {showBenchmarkHub ? 'إخفاء المركز التفاعلي' : 'عرض المركز التفاعلي المتقدم'}
            </button>
          </div>

          {showBenchmarkHub && (
            <div className="pt-4 border-t border-slate-200 animate-in fade-in">
              <BostaEcosystemHub />
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 13. FINAL HIGH-IMPACT CALL TO ACTION */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center space-y-6 border border-amber-300">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest bg-slate-950 text-amber-400 px-3 py-1 rounded-full inline-block">
              ابدأ اليوم وانضم للنخبة
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              جاهز لنقل تجربة شحن متجرك إلى أعلى مستوى في مصر؟
            </h2>
            <p className="text-xs sm:text-sm text-slate-900 font-semibold max-w-xl mx-auto leading-relaxed">
              توقف عن إهدار أرباحك في المرتجعات وتأخير الكاش. انضم لآلاف المتاجر التي تثق في «مشاوير»
              لتوصيل طرودها بأمانة وسرعة مطلقة.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setHeroTab('ONBOARD');
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-2xl text-sm transition-all shadow-xl cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>أنشئ حساب تاجر مجاناً في دقيقة</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAuthModal?.()}
              className="px-6 py-4 bg-white/90 hover:bg-white text-slate-950 font-black rounded-2xl text-sm transition-all shadow-md cursor-pointer flex items-center gap-2 border border-slate-300"
            >
              <Lock className="w-4 h-4 text-amber-600" />
              <span>تسجيل دخول الشركاء والمتاجر</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAuthModal?.()}
              className="px-6 py-4 bg-slate-900/10 hover:bg-slate-900/20 text-slate-950 font-bold rounded-2xl text-sm transition-all cursor-pointer border border-slate-900/20 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>دخول الكادر الإداري والميداني</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
