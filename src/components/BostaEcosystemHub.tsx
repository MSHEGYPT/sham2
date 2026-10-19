import React, { useState } from 'react';
import {
  Truck,
  Zap,
  Coins,
  RotateCcw,
  Package,
  Layers,
  CheckCircle2,
  MapPin,
  Bot,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Building,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Code2,
  Clock,
  Eye,
  Send,
  Download,
  Percent,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';

export const BostaEcosystemHub: React.FC = () => {
  const { governoratesCoverage, fulfillmentItems, requestMerchantPayout, activeMerchantId, merchants } = useLogistics();

  const currentMerchant = merchants.find((m) => m.id === activeMerchantId) || merchants[0];

  const [activeTab, setActiveTab] = useState<
    'NEXT_DAY_PAYOUT' | 'COVERAGE_MAP' | 'FULFILLMENT' | 'WHATSAPP_BOT' | 'INTEGRATIONS' | 'EXCHANGE'
  >('NEXT_DAY_PAYOUT');

  // Payout Simulator State
  const [payoutAmount, setPayoutAmount] = useState<number>(3500);
  const [payoutMethod, setPayoutMethod] = useState<'INSTAPAY' | 'BANK_TRANSFER' | 'FAWRY' | 'WALLET'>('INSTAPAY');
  const [accountDetails, setAccountDetails] = useState<string>('elegance.store@instapay');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  // Coverage filter
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  // WhatsApp Bot Simulator State
  const [botChatStep, setBotChatStep] = useState<number>(1);
  const [customerResponse, setCustomerResponse] = useState<string | null>(null);

  // Fulfillment Calculator State
  const [storedUnits, setStoredUnits] = useState<number>(500);
  const [monthlyOrders, setMonthlyOrders] = useState<number>(250);

  const handleSimulatePayout = (e: React.FormEvent) => {
    e.preventDefault();
    const res = requestMerchantPayout(currentMerchant.id, payoutAmount, payoutMethod, accountDetails);
    setPayoutSuccessMsg(res.message);
    setTimeout(() => {
      setPayoutSuccessMsg(null);
    }, 4500);
  };

  const filteredGovs = governoratesCoverage.filter((g) => {
    if (selectedRegion === 'ALL') return true;
    return g.region === selectedRegion;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-6">
      {/* Top Banner: Bosta-Style Innovation Benchmark */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>مستوحى من معايير رواد التكنولوجيا اللوجستية (Bosta Benchmark)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              منظومة الشحن المتطورة: سرعة، تكنولوجيا، وتحصيل فوري في 24 ساعة
            </h2>
            <p className="text-xs sm:text-sm text-rose-100 mt-2 max-w-2xl leading-relaxed">
              جمعنا أفضل ابتكارات منصة بوسطة العالمية (تحويل الكاش ثاني يوم، خدمة الاستبدال الفوري، بوت
              الواتساب الآلي، وتغطية 27 محافظة) مع درع مشاوير الرقمي لمنع الفساد وكود الأمان المشفر.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[11px] text-rose-200 block">نسبة نجاح التسليم:</span>
              <strong className="text-xl sm:text-2xl font-mono font-black text-amber-300">96.8%</strong>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[11px] text-rose-200 block">صرف الكاش (Payout):</span>
              <strong className="text-sm font-bold text-white">خلال 24 ساعة</strong>
            </div>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/20">
          <button
            onClick={() => setActiveTab('NEXT_DAY_PAYOUT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'NEXT_DAY_PAYOUT'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span>صرف الكاش ثاني يوم (Next-Day Payout)</span>
          </button>

          <button
            onClick={() => setActiveTab('COVERAGE_MAP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COVERAGE_MAP'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>تغطية 27 محافظة والمستودعات</span>
          </button>

          <button
            onClick={() => setActiveTab('EXCHANGE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'EXCHANGE'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-blue-500" />
            <span>الاستبدال الفوري ومعاينة الطرد</span>
          </button>

          <button
            onClick={() => setActiveTab('FULFILLMENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FULFILLMENT'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-500" />
            <span>التخزين والتغليف (Fulfillment)</span>
          </button>

          <button
            onClick={() => setActiveTab('WHATSAPP_BOT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'WHATSAPP_BOT'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>بوت واتساب الذكي للعملاء</span>
          </button>

          <button
            onClick={() => setActiveTab('INTEGRATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'INTEGRATIONS'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Code2 className="w-4 h-4 text-purple-400" />
            <span>الربط البرمجي (Shopify / Salla)</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-6">
        {/* 1. Next-Day Payout Feature (تحصيل الكاش في اليوم التالي مباشرة) */}
        {activeTab === 'NEXT_DAY_PAYOUT' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Explainer */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    💰
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      فلوس مبيعاتك في جيبك تاني يوم بدون تأخير
                    </h3>
                    <p className="text-xs text-slate-500">
                      ميزة بوسطة الأهم للتجار: لا داعي للانتظار أسبوعياً لصرف مستحقات الدفع عند الاستلام (COD).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">تحويل إنستاباي (InstaPay):</span>
                    <strong className="text-sm font-bold text-slate-900 block">لحظي (Real-Time)</strong>
                    <p className="text-[11px] text-slate-500">يصل حسابك خلال دقائق من تأكيد التسليم.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">صرف فوري (Fawry Cash):</span>
                    <strong className="text-sm font-bold text-slate-900 block">من أي منفذ فوري</strong>
                    <p className="text-[11px] text-slate-500">كود سحب فوري يصرف نقداً من 250,000 نقطة فوري.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">تحويل بنكي / محافظ ذكية:</span>
                    <strong className="text-sm font-bold text-slate-900 block">كافة البنوك المصرية</strong>
                    <p className="text-[11px] text-slate-500">فودافون كاش، أورنج، إي آند، والتحويل البنكي ACH.</p>
                  </div>
                </div>

                {/* Workflow Steps */}
                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" />
                    <span>دورة التحصيل السريع اليومية في مشاوير:</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>يستلم العميل الطرد ويدخل كود الأمان المشفر OTP لتحصيل الكاش.</li>
                    <li>يتم تقييد الكاش فوراً في محفظة التاجر كـ «رصيد متاح للصرف».</li>
                    <li>يتم تحويل الأرباح تلقائياً في دورة التحويل اليومية الساعة 10:00 صباحاً كل يوم.</li>
                  </ol>
                </div>
              </div>

              {/* Right: Interactive Instant Payout Simulator */}
              <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-black text-sm text-slate-900">محاكي السحب الفوري (Instant Payout)</h4>
                    <span className="text-[10px] text-slate-500">المتجر: {currentMerchant.brandName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    متاح 24/7
                  </span>
                </div>

                {payoutSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold text-center animate-in zoom-in-95">
                    {payoutSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleSimulatePayout} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">المبلغ المطلوب تحويله (ج.م):</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-base font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">طريقة التحويل:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPayoutMethod('INSTAPAY');
                          setAccountDetails('elegance.store@instapay');
                        }}
                        className={`p-2 rounded-xl text-center font-bold border cursor-pointer ${
                          payoutMethod === 'INSTAPAY'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        إنستاباي (IPA)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPayoutMethod('FAWRY');
                          setAccountDetails('كود سحب فوري رقمي');
                        }}
                        className={`p-2 rounded-xl text-center font-bold border cursor-pointer ${
                          payoutMethod === 'FAWRY'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        فوري كاش
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">عنوان الحساب / الرقم التعريفي:</label>
                    <input
                      type="text"
                      required
                      value={accountDetails}
                      onChange={(e) => setAccountDetails(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Coins className="w-4 h-4 text-amber-300" />
                    <span>تنفيذ التحويل الفوري الآن</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 2. Coverage Map & Egypt Governorates Matrix */}
        {activeTab === 'COVERAGE_MAP' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span>تغطية شاملة لكافة محافظات جمهورية مصر العربية (27 محافظة)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  شبكة أسطول تضم أكثر من 20 مستودع فرز وتوزيع ومحطات إقليمية لضمان أسرع مدة تسليم (SLA).
                </p>
              </div>

              {/* Region Filter */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { id: 'ALL', label: 'كافة المحافظات (27)' },
                  { id: 'CAIRO_GIZA', label: 'القاهرة الكبرى' },
                  { id: 'ALEXANDRIA', label: 'الإسكندرية والساحل' },
                  { id: 'DELTA', label: 'الدلتا' },
                  { id: 'CANAL', label: 'القناة' },
                  { id: 'UPPER_EGYPT', label: 'صعيد مصر' },
                  { id: 'FRONTIER', label: 'المحافظات الحدودية' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedRegion(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedRegion === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Governorates Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">المحافظة والمدن</th>
                    <th className="py-3 px-4">الإقليم</th>
                    <th className="py-3 px-4">مدة التوصيل المضمونة (SLA)</th>
                    <th className="py-3 px-4">سعر الشحن الأساسي</th>
                    <th className="py-3 px-4">المستودع الرئيسي المسؤول</th>
                    <th className="py-3 px-4">نسبة نجاح التسليم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredGovs.map((gov) => (
                    <tr key={gov.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{gov.nameAr}</td>
                      <td className="py-3 px-4 text-slate-500">{gov.regionLabelAr}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                            gov.deliverySlaHours === 24
                              ? 'bg-emerald-100 text-emerald-800'
                              : gov.deliverySlaHours === 48
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{gov.deliverySlaHours} ساعة {gov.isNextDayGuaranteed ? '(تاني يوم)' : ''}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{gov.baseFee} ج.م</td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">{gov.hubName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">{gov.successRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Exchange Orders & Customer Inspection (الاستبدال والمعاينة) */}
        {activeTab === 'EXCHANGE' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pillar 1: Exchange Service */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  خدمة الاستبدال الفوري (Exchange in 1 Visit)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  الحل الأمثل لمتاجر الملابس والأحذية: المندوب يقوم بتسليم القطعة البديلة (مثلاً مقاس أكبر)
                  واستلام القطعة القديمة من العميل في نفس الزيارة مع تحصيل أو رد فارق السعر، دون دفع تكلفة
                  شحنتين منفصلتين.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-800 block">مميزات خدمة الاستبدال:</span>
                  <p className="text-slate-600">✓ تقليل معدل المرتجعات النهائية بنسبة 65%.</p>
                  <p className="text-slate-600">✓ كود فحص ذكي للمندوب للتأكد من سلامة القطعة المرتجعة وبطاقتها.</p>
                  <p className="text-slate-600">✓ بوليصة واحدة مشتركة لتسليم الطرد الجديد واستلام القديم.</p>
                </div>
              </div>

              {/* Pillar 2: Open Package & Inspection */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  السماح بفتح الشحنة والمعاينة (Inspection on Delivery)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تمنح عملاءك الثقة التامة للشراء من متجرك الإلكتروني. يستطيع التاجر تحديد خيار «مسموح بالمعاينة»
                  عند إنشاء البوليصة، فينتظر المندوب فتح العميل للطرد والتأكد من المقاس والمواصفات قبل دفع الكاش.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-800 block">ضوابط المعاينة العادلة في مشاوير:</span>
                  <p className="text-slate-600">✓ المعاينة تتم بحضور المندوب وتقتصر على الفحص الظاهري والمقاس.</p>
                  <p className="text-slate-600">✓ في حال الرفض، يدفع العميل مصاريف الشحن فقط ويعود الطرد بحالته.</p>
                  <p className="text-slate-600">✓ توثيق المعاينة في تقرير الرحلة الميدانية للمندوب.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Warehousing & Fulfillment Service */}
        {activeTab === 'FULFILLMENT' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    📦
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      خدمات الوفاء بالطلبات والتخزين الذكي (Fulfillment by Sanad)
                    </h3>
                    <p className="text-xs text-slate-500">
                      خزن منتجاتك في مستودعاتنا المركزية، وسنقوم بالتعبئة، التغليف، وتجهيز الشحنة للشحن في أقل من 12 ساعة.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">سرعة التجهيز:</span>
                    <strong className="text-sm font-bold text-slate-900 block">خلال 12 ساعة فقط</strong>
                    <p className="text-[11px] text-slate-500">تجهيز الطرد فور تسجيل الطلب من متجرك.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">تغليف مخصص:</span>
                    <strong className="text-sm font-bold text-slate-900 block">بشعار علامتك التجارية</strong>
                    <p className="text-[11px] text-slate-500">صناديق كرتون، أكياس بولي، وفقاعات حماية.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">ربط المخزون الحي:</span>
                    <strong className="text-sm font-bold text-slate-900 block">تحديث رصيد لحظي</strong>
                    <p className="text-[11px] text-slate-500">مزامنة المخزون مع Shopify وWooCommerce.</p>
                  </div>
                </div>

                {/* Stored Inventory Table */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 mb-2">أمثلة لمنتجاتك المخزنة في المستودع الرئيسي:</h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">كود الصنف (SKU)</th>
                          <th className="py-2.5 px-3">اسم المنتج</th>
                          <th className="py-2.5 px-3">الرصيد المتاح</th>
                          <th className="py-2.5 px-3">الموقع بالمستودع</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {fulfillmentItems.slice(0, 3).map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.sku}</td>
                            <td className="py-2 px-3">{item.name}</td>
                            <td className="py-2 px-3">
                              <span className="font-mono font-bold text-emerald-600">{item.inStock} قطعة</span>
                            </td>
                            <td className="py-2 px-3 text-[11px] text-slate-500">{item.warehouseLocation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Fulfillment Fee Estimator */}
              <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-lg space-y-4 text-xs">
                <h4 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-100">
                  حاسبة تكلفة التخزين والـ Fulfillment
                </h4>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">عدد القطع المخزنة بالمستودع:</label>
                  <input
                    type="range"
                    min={100}
                    max={5000}
                    step={100}
                    value={storedUnits}
                    onChange={(e) => setStoredUnits(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between font-mono font-bold text-slate-800 mt-1">
                    <span>{storedUnits} قطعة</span>
                    <span className="text-[10px] text-slate-400">سعة المستودع</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الطلبات المشحونة شهرياً:</label>
                  <input
                    type="range"
                    min={50}
                    max={2000}
                    step={50}
                    value={monthlyOrders}
                    onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between font-mono font-bold text-slate-800 mt-1">
                    <span>{monthlyOrders} أوردر / شهر</span>
                    <span className="text-[10px] text-slate-400">حجم الشحن</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">تكلفة التخزين التقريبية:</span>
                    <strong className="font-mono text-slate-900">{(storedUnits * 1.2).toFixed(0)} ج.م / شهر</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">تكلفة التجهيز والتغليف لكل أوردر:</span>
                    <strong className="font-mono text-emerald-600">8.50 ج.م / طرد</strong>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer">
                  طلب نقل بضاعتك لمستودع مشاوير اليوم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Automated AI WhatsApp Bot Simulator */}
        {activeTab === 'WHATSAPP_BOT' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Bot className="w-4 h-4 text-emerald-600" />
                  <span>تكنولوجيا الذكاء الاصطناعي (Bosta Bots Benchmark)</span>
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  روبوت واتساب التفاعلي لتأكيد العناوين وجدولة التسليم آلياً
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  قبل خروج المندوب، يتواصل البوت الذكي تلقائياً مع العميل على واتساب لتأكيد العنوان، إرسال اللوكيشن،
                  أو تأجيل موعد الاستلام بدون أي تدخل بشري، مما يرفع نسبة التسليم الناجح إلى 96.8%.
                </p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>تأكيد الموعد المناسب للعميل في ثوانٍ.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>إرسال كود الـ OTP المشفر للعميل لحمايته من أي تلاعب.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>إمكانية تعديل العنوان أو طلب إعادة الجدولة بضغطة زر.</span>
                  </div>
                </div>
              </div>

              {/* Interactive WhatsApp Mockup */}
              <div className="max-w-sm mx-auto w-full bg-[#0b141a] rounded-3xl p-3 shadow-2xl border-4 border-slate-800 text-white">
                <div className="bg-[#202c33] p-3 rounded-2xl flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-xs">
                    مشاوير
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">مشاوير إكسبريس (بوت الشحن الآلي)</h4>
                    <span className="text-[10px] text-emerald-400">متصل الآن - حساب أعمال موثق ✓</span>
                  </div>
                </div>

                <div className="space-y-3 p-2 text-xs min-h-[220px]">
                  {/* Bot Message 1 */}
                  <div className="bg-[#202c33] p-3 rounded-2xl rounded-tr-xs text-slate-200 max-w-[85%] space-y-1">
                    <p>مرحباً يا فندم! 👋</p>
                    <p>شحنتك رقم <strong>SND-8041</strong> من متجر <strong>الأناقة العصري</strong> قيد التوزيع اليوم مع الكابتن أحمد فتحي.</p>
                    <p className="text-[10px] text-amber-300 font-bold pt-1">
                      كود الأمان السري الخاص بك للاستلام: 7492
                    </p>
                    <span className="text-[9px] text-slate-400 block text-left">10:15 ص</span>
                  </div>

                  {/* Customer Options */}
                  {botChatStep === 1 && (
                    <div className="space-y-1.5 pt-2 animate-in fade-in">
                      <button
                        onClick={() => {
                          setCustomerResponse('العنوان صحيح، في انتظار المندوب');
                          setBotChatStep(2);
                        }}
                        className="w-full py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-center font-bold text-xs cursor-pointer transition-colors"
                      >
                        ✅ تأكيد العنوان والاستلام اليوم
                      </button>

                      <button
                        onClick={() => {
                          setCustomerResponse('طلب تأجيل الميعاد لبكرة');
                          setBotChatStep(3);
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-center font-bold text-xs cursor-pointer transition-colors"
                      >
                        📅 تأجيل الاستلام ليوم غد
                      </button>
                    </div>
                  )}

                  {/* Reply from Customer */}
                  {customerResponse && (
                    <div className="bg-[#005c4b] p-2.5 rounded-2xl rounded-tl-xs text-white max-w-[80%] mr-auto text-left animate-in fade-in">
                      <span>{customerResponse}</span>
                      <span className="text-[9px] text-emerald-200 block text-right mt-0.5">10:16 ص ✓✓</span>
                    </div>
                  )}

                  {/* Bot Reply */}
                  {botChatStep === 2 && (
                    <div className="bg-[#202c33] p-3 rounded-2xl rounded-tr-xs text-slate-200 max-w-[85%] space-y-1 animate-in fade-in">
                      <p>تمام يا فندم! تم إخطار المندوب وسيتصل بحضرتك قبل الوصول بنصف ساعة. شكراً لك! 🚚</p>
                      <span className="text-[9px] text-slate-400 block text-left">10:16 ص</span>
                    </div>
                  )}

                  {botChatStep === 3 && (
                    <div className="bg-[#202c33] p-3 rounded-2xl rounded-tr-xs text-slate-200 max-w-[85%] space-y-1 animate-in fade-in">
                      <p>تم تحديث الموعد إلى غداً تلقائياً في خط سير المندوب وحفظ الطرد بأمان بالمستودع. شكراً لك! 📦</p>
                      <span className="text-[9px] text-slate-400 block text-left">10:16 ص</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-center">
                  <button
                    onClick={() => {
                      setBotChatStep(1);
                      setCustomerResponse(null);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    إعادة تشغيل المحاكاة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Integrations Hub */}
        {activeTab === 'INTEGRATIONS' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  الربط البرمجي السلس مع كبرى منصات التجارة الإلكترونية (Plugins & APIs)
                </h3>
                <p className="text-xs text-slate-500">
                  اربط متجرك بضغطة زر واحدة لتصدير الأوردرات تلقائياً وطباعة البوالص ومزامنة حالات التوصيل الحية.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 rounded text-slate-700">
                  REST API v2.4 Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: 'Shopify', desc: 'مزامنة تلقائية للأوردرات', badge: 'بلجن معتمد' },
                { name: 'WooCommerce', desc: 'إضافة ووكومرس الرسمية', badge: 'تثبيت بنقرة' },
                { name: 'Salla (سلة)', desc: 'ربط مباشر لمتجر سلة', badge: 'سحابي' },
                { name: 'Zid (زد)', desc: 'تطبيق مشاوير على متجر زد', badge: 'سحابي' },
                { name: 'EasyOrders', desc: 'لمتاجر السوشيال ميديا', badge: 'سريع' },
                { name: 'Custom API', desc: 'توثيق REST كامل مع Webhooks', badge: 'للمطورين' },
              ].map((plugin, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 hover:bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-400 transition-all text-center space-y-1.5 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs mx-auto">
                    {plugin.name.slice(0, 3)}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{plugin.name}</h4>
                  <p className="text-[10px] text-slate-500">{plugin.desc}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                    {plugin.badge}
                  </span>
                </div>
              ))}
            </div>

            {/* API Sample Code Box */}
            <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 font-mono text-xs space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span>نموذج الربط البرمجي لإنشاء شحنة (cURL / Fetch Request):</span>
                <span className="text-emerald-400">Endpoint: POST /api/v1/shipments/create</span>
              </div>
              <pre className="overflow-x-auto text-[11px] text-amber-300">
{`curl -X POST https://api.sanad.logistics/v1/shipments/create \\
  -H "Authorization: Bearer snd_live_key_98421" \\
  -H "Content-Type: application/json" \\
  -d '{
    "merchant_id": "${currentMerchant.id}",
    "recipient_name": "محمد حسن",
    "recipient_phone": "01099887766",
    "city": "القاهرة",
    "district": "المعادي",
    "cod_amount": 450,
    "order_type": "STANDARD",
    "allow_inspection": true
  }'`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
