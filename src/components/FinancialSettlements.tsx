import React, { useState } from 'react';
import {
  Coins,
  Building,
  Truck,
  CheckCircle2,
  FileText,
  ArrowUpRight,
  Download,
  AlertCircle,
  Receipt,
  Search,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';

export const FinancialSettlements: React.FC = () => {
  const { merchants, staff, shipments, recordCashDeposit } = useLogistics();

  const [activeTab, setActiveTab] = useState<'MERCHANTS' | 'COURIERS'>('MERCHANTS');
  const [settledNotice, setSettledNotice] = useState<string | null>(null);

  const couriers = staff.filter((s) => s.role === 'COURIER');

  const totalCollectedCOD = shipments
    .filter((s) => s.status === 'DELIVERED')
    .reduce((acc, s) => acc + (s.collectedAmount || s.codAmount), 0);

  const totalShippingRevenue = shipments
    .filter((s) => s.status === 'DELIVERED')
    .reduce((acc, s) => acc + s.shippingFee, 0);

  const totalMerchantNetPayable = merchants.reduce((acc, m) => acc + m.pendingBalance, 0);

  const totalCashHeldInFleet = couriers.reduce((acc, c) => acc + c.currentCashHeld, 0);

  const handleSettleMerchant = (merchantName: string, amount: number) => {
    setSettledNotice(`تم تسجيل تحويل مبلغ ${amount.toLocaleString('ar-EG')} ج.م إلى حساب متجر ${merchantName} بنجاح وإرسال إشعار فوري.`);
    setTimeout(() => setSettledNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">إجمالي النقدية المحصلة (COD)</span>
            <Coins className="w-4 h-4 text-slate-800" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalCollectedCOD.toLocaleString('ar-EG')} ج.م
          </div>
          <div className="text-[11px] text-slate-500 mt-1">عن الشحنات المسلمة رسمياً برموز OTP</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">إيرادات الشركة من الشحن</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {totalShippingRevenue.toLocaleString('ar-EG')} ج.م
          </div>
          <div className="text-[11px] text-slate-500 mt-1">رسوم التوصيل والخدمات اللوجستية</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">مستحقات التجار المعلقة</span>
            <Building className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800 font-mono">
            {totalMerchantNetPayable.toLocaleString('ar-EG')} ج.م
          </div>
          <div className="text-[11px] text-slate-500 mt-1">صافي كاش مستحق للتجار بالكامل</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">العهد النقدية في الميدان</span>
            <Truck className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {totalCashHeldInFleet.toLocaleString('ar-EG')} ج.م
          </div>
          <div className="text-[11px] text-slate-500 mt-1">تنتظر التوريد لخزينة الشركة</div>
        </div>
      </div>

      {settledNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
          ✓ {settledNotice}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('MERCHANTS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MERCHANTS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          كشوف حساب وتسويات التجار ({merchants.length})
        </button>

        <button
          onClick={() => setActiveTab('COURIERS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'COURIERS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          كشوف عهد وخزينة المناديب ({couriers.length})
        </button>
      </div>

      {/* Merchants Ledger */}
      {activeTab === 'MERCHANTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4">اسم المتجر والمالك</th>
                  <th className="py-3 px-4">الهاتف والمدينة</th>
                  <th className="py-3 px-4">الطرود المسلمة</th>
                  <th className="py-3 px-4">معدل المرتجع</th>
                  <th className="py-3 px-4">الرصيد المعلق للصرف</th>
                  <th className="py-3 px-4 text-center">إجراء التسوية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{m.brandName || m.name}</div>
                      <span className="text-[11px] text-slate-500">{m.businessType}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono">{m.phone}</div>
                      <span className="text-[11px] text-slate-500">{m.city}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {m.deliveredCount} طرد
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-800">{m.returnRate}%</td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-sm">
                      {m.pendingBalance.toLocaleString('ar-EG')} ج.م
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleSettleMerchant(m.brandName || m.name, m.pendingBalance)}
                        disabled={m.pendingBalance <= 0}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        تحويل المستحقات كاش
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Couriers Ledger */}
      {activeTab === 'COURIERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4">اسم المندوب</th>
                  <th className="py-3 px-4">الهاتف والمنطقة</th>
                  <th className="py-3 px-4">العهدة الحالية</th>
                  <th className="py-3 px-4">سقف العهدة</th>
                  <th className="py-3 px-4">حالة الرقابة</th>
                  <th className="py-3 px-4 text-center">إجراء التوريد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {couriers.map((c) => {
                  const isNearLimit = c.currentCashHeld >= (c.maxCashLimit || 3000) * 0.85;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono">{c.phone}</div>
                        <span className="text-[11px] text-slate-500">{c.assignedZone}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700 text-sm">
                        {c.currentCashHeld.toLocaleString('ar-EG')} ج.م
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-800">
                        {c.maxCashLimit} ج.م
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isNearLimit
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isNearLimit ? 'تجاوز وشيك للسقف' : 'سليم ومنضبط'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => recordCashDeposit(c.id, c.currentCashHeld)}
                          disabled={c.currentCashHeld <= 0}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          استلام كامل العهدة
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
