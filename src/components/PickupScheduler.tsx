import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Truck,
  Plus,
  CheckCircle2,
  Package,
  Building,
  Phone,
  MapPin,
  FileCheck,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { PickupSchedule } from '../types';

export const PickupScheduler: React.FC = () => {
  const { pickups, merchants, staff, addPickupSchedule, updatePickupStatus } = useLogistics();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TODAY' | 'COMPLETED'>('ALL');
  const [completeModalPickup, setCompleteModalPickup] = useState<PickupSchedule | null>(null);
  const [actualParcelsCount, setActualParcelsCount] = useState<number>(0);

  // New Pickup Form state
  const [form, setForm] = useState({
    merchantId: merchants[0]?.id || 'MCH-101',
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTimeWindow: '02:00 م - 04:00 م',
    expectedParcelsCount: 10,
    assignedCourierId: '',
    notes: '',
  });

  const couriers = staff.filter((s) => s.role === 'COURIER' && s.status !== 'SUSPENDED');
  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredPickups = pickups.filter((p) => {
    if (activeFilter === 'TODAY') return p.scheduledDate === todayStr;
    if (activeFilter === 'COMPLETED') return p.status === 'COMPLETED';
    return true;
  });

  const handleCreatePickup = (e: React.FormEvent) => {
    e.preventDefault();
    const m = merchants.find((x) => x.id === form.merchantId) || merchants[0];
    const c = couriers.find((x) => x.id === form.assignedCourierId);

    addPickupSchedule({
      merchantId: m.id,
      merchantName: m.brandName || m.name,
      merchantPhone: m.phone,
      merchantAddress: m.address,
      city: m.city,
      scheduledDate: form.scheduledDate,
      scheduledTimeWindow: form.scheduledTimeWindow,
      expectedParcelsCount: Number(form.expectedParcelsCount) || 1,
      assignedCourierId: form.assignedCourierId || undefined,
      assignedCourierName: c?.name || undefined,
      status: 'SCHEDULED',
      notes: form.notes,
    });

    setIsAddModalOpen(false);
    setForm({
      merchantId: merchants[0]?.id || 'MCH-101',
      scheduledDate: todayStr,
      scheduledTimeWindow: '02:00 م - 04:00 م',
      expectedParcelsCount: 10,
      assignedCourierId: '',
      notes: '',
    });
  };

  const handleConfirmCompletion = () => {
    if (!completeModalPickup) return;
    updatePickupStatus(completeModalPickup.id, 'COMPLETED', actualParcelsCount);
    setCompleteModalPickup(null);
  };

  const totalExpectedParcels = pickups.reduce((acc, p) => acc + p.expectedParcelsCount, 0);
  const totalCompletedParcels = pickups
    .filter((p) => p.status === 'COMPLETED')
    .reduce((acc, p) => acc + (p.actualCollectedCount || p.expectedParcelsCount), 0);

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">مواعيد الاستلام المجدولة</span>
            <Calendar className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{pickups.length} جولات</div>
          <div className="text-[11px] text-slate-500 mt-1">تنسيق فوري مع مقرات المتاجر</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">الطرود المتوقع استلامها اليوم</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {totalExpectedParcels} طرد
          </div>
          <div className="text-[11px] text-slate-500 mt-1">جاهزة للتوزيع السريع خلال 24 ساعة</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">تم توريدها للمستودع الرئيسي</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {totalCompletedParcels} طرد
          </div>
          <div className="text-[11px] text-slate-500 mt-1">مع إيصالات استلام إلكترونية معتمدة</div>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            كافة المواعيد ({pickups.length})
          </button>
          <button
            onClick={() => setActiveFilter('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'TODAY'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            مواعيد اليوم
          </button>
          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'COMPLETED'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المكتملة
          </button>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>جدولة استلام فوري من متجر</span>
        </button>
      </div>

      {/* Pickups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPickups.map((p) => {
          const isDone = p.status === 'COMPLETED';
          const isInProgress = p.status === 'IN_PROGRESS';

          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : isInProgress
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{p.merchantName}</h4>
                      <span className="text-[11px] text-slate-500 font-mono">{p.merchantPhone}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800'
                        : isInProgress
                        ? 'bg-amber-100 text-amber-900 animate-pulse'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isDone ? 'تم الاستلام والتوريد' : isInProgress ? 'جاري الاستلام' : 'مجدول'}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1.5 border border-slate-100 my-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      التاريخ والنافذة:
                    </span>
                    <span className="font-bold text-slate-800">
                      {p.scheduledDate} ({p.scheduledTimeWindow})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3 h-3" />
                      المقر:
                    </span>
                    <span className="text-slate-800">{p.merchantAddress}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Package className="w-3 h-3" />
                      عدد الطرود:
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {p.actualCollectedCount !== undefined
                        ? `${p.actualCollectedCount} طرد مستلم فعلياً`
                        : `${p.expectedParcelsCount} طرد متوقع`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Truck className="w-3 h-3" />
                      المندوب المكلف:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {p.assignedCourierName || 'لم يُحدد'}
                    </span>
                  </div>
                </div>

                {p.receiptNumber && (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center justify-between mb-2">
                    <span>رقم إيصال الاستلام:</span>
                    <strong className="font-mono">{p.receiptNumber}</strong>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!isDone && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCompleteModalPickup(p);
                      setActualParcelsCount(p.expectedParcelsCount);
                    }}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تأكيد الاستلام بالمستودع</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Add Scheduled Pickup */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">جدولة استلام فوري من مقر تاجر</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePickup} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اختر التاجر:</label>
                <select
                  value={form.merchantId}
                  onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brandName || m.name} ({m.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ الاستلام:</label>
                  <input
                    type="date"
                    required
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">النافذة الزمنية:</label>
                  <select
                    value={form.scheduledTimeWindow}
                    onChange={(e) => setForm({ ...form, scheduledTimeWindow: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="11:00 ص - 01:00 م">11:00 ص - 01:00 م (صباحي)</option>
                    <option value="02:00 م - 04:00 م">02:00 م - 04:00 م (ظهراً)</option>
                    <option value="05:00 م - 07:00 م">05:00 م - 07:00 م (مسائي)</option>
                    <option value="08:00 م - 10:00 م">08:00 م - 10:00 م (ليلي)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">عدد الطرود المتوقع:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.expectedParcelsCount}
                    onChange={(e) => setForm({ ...form, expectedParcelsCount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">المندوب المكلف:</label>
                  <select
                    value={form.assignedCourierId}
                    onChange={(e) => setForm({ ...form, assignedCourierId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="">إسناد تلقائي حسب المنطقة</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.assignedZone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ملاحظات التنسيق:</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="مثال: يرجى إحضار حقائب شحن إضافية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                >
                  تأكيد الجدولة وإخطار التاجر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Pickup & Issue Digital Receipt */}
      {completeModalPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">تأكيد استلام الطرود وإصدار الإيصال</h3>
              </div>
              <button
                onClick={() => setCompleteModalPickup(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700">
                المتجر: <strong>{completeModalPickup.merchantName}</strong>
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  العدد الفعلي للطرود المستلمة بعد الفرز:
                </label>
                <input
                  type="number"
                  min={1}
                  value={actualParcelsCount}
                  onChange={(e) => setActualParcelsCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-base font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setCompleteModalPickup(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmCompletion}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  إصدار إيصال الاستلام الرقمي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
