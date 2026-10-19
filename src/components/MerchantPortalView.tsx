import React, { useState } from 'react';
import {
  Building2,
  Package,
  Plus,
  Coins,
  CheckCircle2,
  RotateCcw,
  Clock,
  Sparkles,
  Phone,
  Calendar,
  FileText,
  KeyRound,
  ShieldCheck,
  QrCode,
  Wallet,
  Zap,
  Eye,
  ArrowUpRight,
  ExternalLink,
  Code2,
  X,
  CreditCard,
  Layers,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { Shipment } from '../types';
import { ShipmentQrModal } from './ShipmentQrModal';
import { SmartComplaintsAiDesk } from './SmartComplaintsAiDesk';

interface MerchantPortalViewProps {
  onOpenOrderParser: () => void;
  onOpenNewPickup: () => void;
}

export const MerchantPortalView: React.FC<MerchantPortalViewProps> = ({
  onOpenOrderParser,
  onOpenNewPickup,
}) => {
  const {
    merchants,
    activeMerchantId,
    setActiveMerchantId,
    shipments,
    fulfillmentItems,
    payoutTransactions,
    requestMerchantPayout,
    registerMerchant,
    simulateEventNotification,
  } = useLogistics();

  const [activeTab, setActiveTab] = useState<'SHIPMENTS' | 'PAYOUT_WALLET' | 'FULFILLMENT' | 'INTEGRATIONS' | 'COMPLAINTS'>('SHIPMENTS');
  const [selectedQrShipment, setSelectedQrShipment] = useState<Shipment | null>(null);
  const [complaintTracking, setComplaintTracking] = useState<string>('');

  // New Merchant Registration Modal State
  const [isRegisterStoreModalOpen, setIsRegisterStoreModalOpen] = useState(false);
  const [newStoreForm, setNewStoreForm] = useState({
    name: '',
    brandName: '',
    phone: '',
    city: 'القاهرة',
    address: '',
    businessType: 'ملابس وأزياء إلكترونية',
    bankOrInstaPay: '',
  });
  const [registerNotice, setRegisterNotice] = useState<string | null>(null);

  // Instant Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(2500);
  const [payoutMethod, setPayoutMethod] = useState<'INSTAPAY' | 'BANK_TRANSFER' | 'FAWRY' | 'WALLET'>('INSTAPAY');
  const [accountDetails, setAccountDetails] = useState('elegance.store@instapay');
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  const currentMerchant =
    merchants.find((m) => m.id === activeMerchantId) || merchants[0];

  const merchantShipments = shipments.filter(
    (s) => s.merchantId === currentMerchant.id || s.merchantName === currentMerchant.brandName
  );

  const myFulfillmentItems = fulfillmentItems.filter(
    (f) => f.merchantId === currentMerchant.id
  );

  const myPayouts = payoutTransactions.filter(
    (p) => p.merchantId === currentMerchant.id || p.merchantName === currentMerchant.brandName
  );

  const activeCount = merchantShipments.filter(
    (s) => s.status === 'OUT_FOR_DELIVERY' || s.status === 'PENDING_PICKUP' || s.status === 'RECEIVED_IN_HUB'
  ).length;

  const deliveredCount = merchantShipments.filter((s) => s.status === 'DELIVERED').length;
  const returnedCount = merchantShipments.filter(
    (s) => s.status === 'RETURN_PENDING' || s.status === 'RETURNED_TO_MERCHANT'
  ).length;

  const totalDeliveredCOD = merchantShipments
    .filter((s) => s.status === 'DELIVERED')
    .reduce((acc, s) => acc + (s.collectedAmount || s.codAmount), 0);

  const totalShippingFees = merchantShipments
    .filter((s) => s.status === 'DELIVERED')
    .reduce((acc, s) => acc + s.shippingFee, 0);

  const netPayable = Math.max(0, totalDeliveredCOD - totalShippingFees);

  const handleExecutePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount <= 0) return;
    const res = requestMerchantPayout(currentMerchant.id, payoutAmount, payoutMethod, accountDetails);
    setPayoutNotice(res.message);
    setTimeout(() => {
      setPayoutNotice(null);
      setIsPayoutModalOpen(false);
    }, 2500);
  };

  const handleRegisterNewStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreForm.name || !newStoreForm.brandName || !newStoreForm.phone) return;

    const newMerchant = registerMerchant({
      name: newStoreForm.name,
      brandName: newStoreForm.brandName,
      phone: newStoreForm.phone,
      city: newStoreForm.city,
      address: newStoreForm.address || 'المقر الرئيسي للمتجر',
      businessType: newStoreForm.businessType,
      bankOrInstaPay: newStoreForm.bankOrInstaPay,
    });

    setRegisterNotice(`تم تسجيل المتجر (${newMerchant.brandName}) بنجاح وتفعيله بالمنظومة!`);
    setTimeout(() => {
      setRegisterNotice(null);
      setIsRegisterStoreModalOpen(false);
      setNewStoreForm({
        name: '',
        brandName: '',
        phone: '',
        city: 'القاهرة',
        address: '',
        businessType: 'ملابس وأزياء إلكترونية',
        bankOrInstaPay: '',
      });
    }, 2200);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Merchant Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl shadow-xs">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{currentMerchant.brandName}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                تاجر معتمد
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              المالك: {currentMerchant.name} | المقر: {currentMerchant.city} - {currentMerchant.address}
            </p>
          </div>
        </div>

        {/* Store Selector & Quick Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
            <span className="text-[11px] text-slate-500">تبديل المتجر:</span>
            <select
              value={currentMerchant.id}
              onChange={(e) => setActiveMerchantId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brandName || m.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsRegisterStoreModalOpen(true)}
            className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
            title="تسجيل متجر أو براند جديد بالمنظومة"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل متجر جديد</span>
          </button>

          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Coins className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>طلب سحب فوري (InstaPay)</span>
          </button>

          <button
            onClick={onOpenOrderParser}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-slate-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>المحلل الذكي للواتساب</span>
          </button>

          <button
            onClick={onOpenNewPickup}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>طلب استلام فوري</span>
          </button>

          {/* Quick Real-Time Toast Simulation for Merchant */}
          <button
            onClick={() => simulateEventNotification('DELIVERED_MERCHANT')}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="تجربة إشعار فوري لحظي بتسليم شحنة وإيداع الكاش بالمحفظة"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">محاكاة إشعار تسليم</span>
          </button>
        </div>
      </div>

      {/* Financial Statement & Guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">صافي مستحقات الكاش الجاهزة للصرف</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {netPayable.toLocaleString('ar-EG')} ج.م
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>صرف فوري خلال 24 ساعة (InstaPay / فوري)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">الشحنات النشطة قيد التوزيع</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 font-mono">{activeCount} شحنة</div>
          <div className="text-[11px] text-slate-500 mt-1">مع مناديب الشركة في الميدان</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">إجمالي الشحنات المسلمة</span>
            <CheckCircle2 className="w-4 h-4 text-slate-800" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{deliveredCount} طرد</div>
          <div className="text-[11px] text-slate-500 mt-1">مؤكدة برموز الأمان OTP</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">نسبة المرتجعات الموثقة</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {merchantShipments.length > 0
              ? `${Math.round((returnedCount / merchantShipments.length) * 100)}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {returnedCount} طرود مرتجعة مع توثيق الأسباب
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Bosta Ecosystem Integration) */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveTab('SHIPMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'SHIPMENTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-amber-400" />
          <span>شحنات المتجر ({merchantShipments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PAYOUT_WALLET')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PAYOUT_WALLET'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>محفظة الكاش والصرف الفوري (Next-Day Payout)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black">
            24 ساعة
          </span>
        </button>

        <button
          onClick={() => setActiveTab('FULFILLMENT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'FULFILLMENT'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>مستودع التخزين والـ Fulfillment ({myFulfillmentItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('INTEGRATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'INTEGRATIONS'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>ربط المتاجر (Shopify / Salla / API)</span>
        </button>
      </div>

      {/* Tab 1: Shipments Table */}
      {activeTab === 'SHIPMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                قائمة شحنات وبوالص {currentMerchant.brandName}
              </h3>
              <p className="text-[11px] text-slate-500">
                تشمل طلبات التوصيل العادي، الاستبدال الفوري، وخدمة معاينة الطرد المعتمدة
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              إجمالي الشحنات: {merchantShipments.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/50 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4">رقم البوليصة</th>
                  <th className="py-3 px-4">المستلم والمدينة</th>
                  <th className="py-3 px-4">المحتويات والنوع</th>
                  <th className="py-3 px-4">مبلغ التحصيل (COD)</th>
                  <th className="py-3 px-4">رمز الأمان (OTP)</th>
                  <th className="py-3 px-4">حالة الشحنة</th>
                  <th className="py-3 px-4">المعاينة والاستبدال</th>
                  <th className="py-3 px-4">طابع QR</th>
                  <th className="py-3 px-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {merchantShipments.map((shp) => {
                  const isDelivered = shp.status === 'DELIVERED';
                  const isReturn =
                    shp.status === 'RETURN_PENDING' || shp.status === 'RETURNED_TO_MERCHANT';

                  return (
                    <tr key={shp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {shp.trackingNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{shp.recipientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {shp.recipientPhone} ({shp.city})
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-800">
                        <div>{shp.itemsDescription}</div>
                        {shp.orderType === 'EXCHANGE' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1 mt-0.5">
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>استبدال فوري</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {shp.codAmount} ج.م
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {shp.otpSecret}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isReturn
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {shp.status === 'DELIVERED'
                            ? 'تم التسليم ✓'
                            : shp.status === 'OUT_FOR_DELIVERY'
                            ? 'مع المندوب للتوزيع'
                            : shp.status === 'PENDING_PICKUP'
                            ? 'قيد الاستلام من المتجر'
                            : 'مرتجع موثق'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 text-[10px]">
                          {shp.allowInspection !== false && (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>مسموح بالمعاينة</span>
                            </span>
                          )}
                          {shp.orderType === 'EXCHANGE' && (
                            <span className="text-blue-700 font-bold flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" />
                              <span>استلام المرتجع</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setSelectedQrShipment(shp)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="عرض وطباعة طابع الشحن ورمز QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>طابع QR</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {shp.createdAt.slice(0, 10)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {merchantShipments.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">لم يتم تسجيل شحنات لهذا المتجر بعد</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Next-Day COD Payout Wallet (Bosta Wallet Benchmark) */}
      {activeTab === 'PAYOUT_WALLET' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Wallet Balance Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">محفظة الكاش الإلكترونية</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  صرف يومي نشط
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">الرصيد المتاح للصرف الآن:</span>
                <strong className="text-3xl font-mono font-black text-amber-400">
                  {netPayable.toLocaleString('ar-EG')} ج.م
                </strong>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">دورة التحويل القادمة:</span>
                <strong className="text-emerald-400">غداً 10:00 ص تلقائياً</strong>
              </div>

              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Coins className="w-4 h-4 text-slate-950" />
                <span>طلب سحب فوري عبر إنستاباي / فوري</span>
              </button>
            </div>

            {/* Instant Payout Options */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>قنوات استلام الكاش والأرباح بدون انتظار</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">إنستاباي (InstaPay)</span>
                  <p className="text-[11px] text-slate-500">تحويل لحظي مباشر إلى عنوان الدفع اللحظي (IPA) أو رقم الموبايل المسجل.</p>
                  <span className="text-[10px] font-bold text-emerald-600 block pt-1">السرعة: أقل من 5 دقائق</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">فوري كاش (Fawry)</span>
                  <p className="text-[11px] text-slate-500">استلام الكاش نقداً من أي تاجر فوري عبر كود الصرف الرقمي المؤمّن.</p>
                  <span className="text-[10px] font-bold text-emerald-600 block pt-1">السرعة: كود سحب لحظي</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">الحساب البنكي (ACH)</span>
                  <p className="text-[11px] text-slate-500">تحويل إلى البنك التجاري الدولي، البنك الأهلي، بنك مصر، وكافة البنوك.</p>
                  <span className="text-[10px] font-bold text-emerald-600 block pt-1">السرعة: نفس اليوم</span>
                </div>
              </div>

              {/* Payout Security Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  ميثاق النزاهة: كل مليم محصل من العميل بكود OTP يتم تقييده لحظياً ولا يمكن المساس به من أي مندوب أو مشرف.
                </span>
              </div>
            </div>
          </div>

          {/* Payout Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900">سجل التحويلات والمستحقات المصروفة للمتجر</h4>
              <span className="text-[11px] text-slate-500 font-mono">العمليات: {myPayouts.length}</span>
            </div>

            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/50 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-2.5 px-4">رقم العملية</th>
                  <th className="py-2.5 px-4">المبلغ المحول</th>
                  <th className="py-2.5 px-4">طريقة التحويل</th>
                  <th className="py-2.5 px-4">بيانات الحساب / الكود</th>
                  <th className="py-2.5 px-4">الحالة</th>
                  <th className="py-2.5 px-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {myPayouts.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{tx.referenceNumber}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{tx.amount.toLocaleString('ar-EG')} ج.م</td>
                    <td className="py-3 px-4 font-medium">{tx.method}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{tx.accountDetails}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        تم التحويل بنجاح ✓
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{tx.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Fulfillment & Warehousing Inventory */}
      {activeTab === 'FULFILLMENT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>مستودع التخزين والـ Fulfillment المركزي</span>
              </h3>
              <p className="text-xs text-slate-500">
                منتجاتك المخزنة في مستودع مشاوير الرئيسي. يتم تعبئة وتغليف وشحن أي طلب تلقائياً في أقل من 12 ساعة.
              </p>
            </div>
            <button
              onClick={onOpenNewPickup}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إرسال بضاعة جديدة للمستودع</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {fulfillmentItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 hover:border-blue-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{item.sku}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    متاح {item.inStock} قطعة
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.name}</h4>
                <p className="text-[11px] text-slate-500">{item.category}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[10px]">{item.warehouseLocation}</span>
                  <strong className="font-mono text-slate-900">{item.priceEgp} ج.م</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: E-Commerce Integrations */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs animate-in fade-in">
          <div>
            <h3 className="font-black text-base text-slate-900">
              ربط متجرك مع منصات التجارة الإلكترونية (One-Click Store Integration)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              مزامنة فورية للطلبات، سحب العناوين وأرقام الهواتف تلقائياً، وطباعة بوالص الشحن بضغطة زر واحدة.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Shopify', status: 'متصل ✓', api: 'shp_key_live_901' },
              { name: 'WooCommerce', status: 'متاح للربط', api: 'wc_plugin_v2' },
              { name: 'Salla (سلة)', status: 'متاح للربط', api: 'salla_oauth' },
              { name: 'Zid (زد)', status: 'متاح للربط', api: 'zid_app_v1' },
            ].map((conn, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{conn.name}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      conn.status.includes('متصل')
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {conn.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">مزامنة الطلبات وتحديث الحالات تلقائياً عبر Webhooks.</p>
                <button className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer">
                  إعدادات الربط
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Instant Payout Request (Bosta InstaPay Cashout) */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">طلب سحب فوري لمستحقات المتجر</h3>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePayout} className="p-5 space-y-4 text-xs">
              {payoutNotice ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold rounded-xl text-center">
                  {payoutNotice}
                </div>
              ) : (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-950 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-800 block">الرصيد الجاهز للصرف:</span>
                      <strong className="text-lg font-mono font-black text-emerald-700">
                        {netPayable.toLocaleString('ar-EG')} ج.م
                      </strong>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-200/60 text-emerald-900">
                      تحويل خلال 24 ساعة
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">المبلغ المراد سحبه (ج.م):</label>
                    <input
                      type="number"
                      required
                      max={netPayable || 5000}
                      min={100}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">طريقة الاستلام الفوري:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPayoutMethod('INSTAPAY');
                          setAccountDetails('elegance.store@instapay');
                        }}
                        className={`p-2.5 rounded-xl text-center font-bold border cursor-pointer ${
                          payoutMethod === 'INSTAPAY'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        إنستاباي (InstaPay)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPayoutMethod('FAWRY');
                          setAccountDetails('كود سحب فوري رقمي');
                        }}
                        className={`p-2.5 rounded-xl text-center font-bold border cursor-pointer ${
                          payoutMethod === 'FAWRY'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        فوري كاش (Fawry)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">معلومات الحساب / عنوان الدفع:</label>
                    <input
                      type="text"
                      required
                      value={accountDetails}
                      onChange={(e) => setAccountDetails(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPayoutModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                      تأكيد التحويل الفوري
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* New Merchant Registration Modal */}
      {isRegisterStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">تسجيل متجر أو براند جديد</h3>
                  <p className="text-xs text-slate-500">انضم لمنظومة مشاوير للشحن الفوري والتوريد اليومي</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterStoreModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registerNotice ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">{registerNotice}</h4>
                <p className="text-xs text-emerald-700">جاري نقلك فوراً إلى لوحة تحكم المتجر الجديد...</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterNewStore} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">اسم المتجر / البراند التجاري *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: متجر الأناقة للأزياء"
                      value={newStoreForm.brandName}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, brandName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">اسم المالك / المدير المسؤول *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: م. طارق الشناوي"
                      value={newStoreForm.name}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">رقم الهاتف والواتساب *</label>
                    <input
                      type="tel"
                      required
                      placeholder="01012345678"
                      value={newStoreForm.phone}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">المحافظة / المدينة *</label>
                    <select
                      value={newStoreForm.city}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
                      <option value="القاهرة">القاهرة</option>
                      <option value="الجيزة">الجيزة</option>
                      <option value="الإسكندرية">الإسكندرية</option>
                      <option value="القليوبية">القليوبية</option>
                      <option value="الشرقية">الشرقية</option>
                      <option value="الدقهلية">الدقهلية</option>
                      <option value="الغربية">الغربية</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">عنوان المستودع أو مقر الاستلام الافتراضي</label>
                  <input
                    type="text"
                    placeholder="مثال: التجمع الخامس - مول تريفيوم - مكتب 204"
                    value={newStoreForm.address}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">طبيعة المنتجات والنشاط</label>
                    <input
                      type="text"
                      placeholder="مثال: ملابس، إلكترونيات، مستحضرات"
                      value={newStoreForm.businessType}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, businessType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">حساب إنستاباي / التحويل البنكي لتحصيل الكاش</label>
                    <input
                      type="text"
                      placeholder="store@instapay أو رقم IBAN"
                      value={newStoreForm.bankOrInstaPay}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, bankOrInstaPay: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRegisterStoreModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl cursor-pointer shadow-xs transition-transform hover:scale-[1.01]"
                  >
                    تأكيد التسجيل وتفعيل المتجر
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Shipment QR Code Waybill Modal */}
      <ShipmentQrModal
        shipment={selectedQrShipment}
        isOpen={!!selectedQrShipment}
        onClose={() => setSelectedQrShipment(null)}
      />
    </div>
  );
};
