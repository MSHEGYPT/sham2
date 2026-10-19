import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Truck,
  Phone,
  MapPin,
  Sparkles,
  AlertTriangle,
  Clock,
  IdCard,
  Plus,
  X,
  Coins,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { OnboardingApplication, StaffMember } from '../types';

export const StaffOnboardingAndSupervisionRing: React.FC = () => {
  const {
    onboardingApplications,
    approveOnboardingApplication,
    rejectOnboardingApplication,
    staff,
    fraudAnomalies,
    submitOnboardingApplication,
    recordCashDeposit,
  } = useLogistics();

  const [activeTab, setActiveTab] = useState<'APPLICATIONS' | 'SUPERVISION'>('APPLICATIONS');
  const [selectedApp, setSelectedApp] = useState<OnboardingApplication | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);

  // Manual Onboarding form state
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    nationalId: '',
    desiredRole: 'COURIER' as const,
    assignedZone: 'مدينة نصر والقاهرة الجديدة',
    vehicleType: 'MOTORCYCLE' as const,
    vehiclePlate: '',
    drivingLicenseNumber: '',
    emergencyContact: '',
  });

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const pendingApps = onboardingApplications.filter((a) => a.status === 'PENDING_AUDIT');
  const couriers = staff.filter((s) => s.role === 'COURIER');

  const handleApprove = (id: string) => {
    approveOnboardingApplication(id);
    setActionNotice('تم اعتماد العامل بنجاح وضمه رسمياً لدائرة العمليات الميدانية.');
    setSelectedApp(null);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleReject = (id: string) => {
    rejectOnboardingApplication(id);
    setActionNotice('تم رفض الطلب لعدم مطابقة المعايير.');
    setSelectedApp(null);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.nationalId) return;

    await submitOnboardingApplication({
      ...form,
      criminalRecordStatus: 'CLEAN',
    });

    setIsManualAddOpen(false);
    setActionNotice('تم تسجيل العامل وإجراء الفحص الأمني الذكي وإدراجه في جدول المراجعة.');
    setForm({
      fullName: '',
      phone: '',
      nationalId: '',
      desiredRole: 'COURIER',
      assignedZone: 'مدينة نصر والقاهرة الجديدة',
      vehicleType: 'MOTORCYCLE',
      vehiclePlate: '',
      drivingLicenseNumber: '',
      emergencyContact: '',
    });
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Ring Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-blue-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <UserCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-blue-300 tracking-wider uppercase">
              الدائرة الإدارية والرقابية (Onion Ring #2)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            تسجيل وتدقيق العاملين الجدد والرقابة اللحظية الميدانية
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            مراجعة طلبات الانضمام بالذكاء الاصطناعي، التحقق من السجل الجنائي ورخص المركبات، ومراقبة
            حركة النقدية وسلوك المناديب لمنع أي تلاعب أو فساد.
          </p>
        </div>

        <button
          onClick={() => setIsManualAddOpen(true)}
          className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>تسجيل وتدقيق عامل جديد</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center animate-in fade-in">
          ✓ {actionNotice}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">طلبات العاملين قيد التدقيق</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {pendingApps.length} طلبات
          </div>
          <div className="text-[11px] text-slate-500 mt-1">تنتظر مراجعة المشرف الإداري</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">المناديب النشطون في الميدان</span>
            <Truck className="w-4 h-4 text-slate-800" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {couriers.filter((c) => c.status === 'ON_DUTY').length} مناديب
          </div>
          <div className="text-[11px] text-slate-500 mt-1">من إجمالي {couriers.length} مندوب معتمد</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">مؤشر النزاهة والانضباط</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">99.1%</div>
          <div className="text-[11px] text-slate-500 mt-1">التزام كامل برمز الأمان وتوريد الكاش</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'APPLICATIONS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          طلبات انضمام العاملين والتدقيق الأمني ({onboardingApplications.length})
        </button>

        <button
          onClick={() => setActiveTab('SUPERVISION')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SUPERVISION'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          شاشة الرقابة على العاملين وتتبع السلوك ({couriers.length})
        </button>
      </div>

      {/* TAB 1: APPLICATIONS & ONBOARDING AUDIT */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onboardingApplications.map((app) => {
              const isPending = app.status === 'PENDING_AUDIT';
              const isApproved = app.status === 'APPROVED';

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isPending
                      ? 'border-amber-300 bg-amber-50/10'
                      : isApproved
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">{app.id}</span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{app.fullName}</h4>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isPending
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isPending ? 'قيد التدقيق' : isApproved ? 'معتمد رسمياً ✓' : 'مرفوض'}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 mb-3">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Phone className="w-3 h-3" />
                          الهاتف:
                        </span>
                        <span className="font-mono font-bold text-slate-900">{app.phone}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1 text-slate-500">
                          <IdCard className="w-3 h-3" />
                          الرقم القومي:
                        </span>
                        <span className="font-mono text-slate-800">{app.nationalId}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3" />
                          النطاق:
                        </span>
                        <span className="text-slate-800">{app.assignedZone}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Truck className="w-3 h-3" />
                          المركبة:
                        </span>
                        <span className="text-slate-800">
                          {app.vehicleType === 'MOTORCYCLE' ? 'موتوسيكل' : 'سيارة'} ({app.vehiclePlate || 'بدون لوحة'})
                        </span>
                      </div>
                    </div>

                    {/* AI Clearance Badge */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1 mb-3">
                      <div className="flex items-center justify-between font-bold text-blue-900">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          فحص الذكاء الاصطناعي للأهلية:
                        </span>
                        <span className="font-mono text-xs">{app.aiClearanceScore}%</span>
                      </div>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        {app.aiClearanceReport}
                      </p>
                    </div>
                  </div>

                  {/* Actions for supervisor */}
                  {isPending && (
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleReject(app.id)}
                        className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        رفض الطلب
                      </button>

                      <button
                        onClick={() => handleApprove(app.id)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>اعتماد وإصدار هوية المندوب</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE SUPERVISION DESK */}
      {activeTab === 'SUPERVISION' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <h4 className="font-bold text-slate-900">
              سجل المراقبة اللحظية للعاملين والمناديب الميدانيين ({couriers.length})
            </h4>
            <span className="text-slate-500">
              مراقبة النقدية في الميدان لمنع احتجاز الأموال لأكثر من 24 ساعة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/50 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4">اسم المندوب</th>
                  <th className="py-3 px-4">الهاتف والنطاق</th>
                  <th className="py-3 px-4">العهدة النقدية الميدانية</th>
                  <th className="py-3 px-4">نسبة التسليم</th>
                  <th className="py-3 px-4">مؤشر الرقابة والشبهات</th>
                  <th className="py-3 px-4 text-center">إجراء المشرف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {couriers.map((c) => {
                  const isNearLimit = c.currentCashHeld >= (c.maxCashLimit || 3000) * 0.85;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          لوحة: {c.vehiclePlate || 'دراجة نارية'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono">{c.phone}</div>
                        <span className="text-[11px] text-slate-500">{c.assignedZone}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-sm">
                        <span className={isNearLimit ? 'text-rose-600' : 'text-slate-900'}>
                          {c.currentCashHeld.toLocaleString('ar-EG')} ج.م
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          من حد أقصى {c.maxCashLimit} ج.م
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {c.successRate}%
                      </td>

                      <td className="py-3.5 px-4">
                        {c.fraudAlertsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {c.fraudAlertsCount} تنبيه سلوك مشبوه
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            سليم تماماً
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => recordCashDeposit(c.id, c.currentCashHeld)}
                          disabled={c.currentCashHeld <= 0}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                        >
                          مطالبة وتوريد كاش
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

      {/* Modal: Manual Add Worker by Supervisor */}
      {isManualAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">تسجيل وتدقيق عامل جديد في الدائرة الإدارية</h3>
              </div>
              <button
                onClick={() => setIsManualAddOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الاسم الرباعي الرسمي:</label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="مثال: يوسف خالد إبراهيم"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الهاتف الشخصي:</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الرقم القومي (14 رقم):</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={form.nationalId}
                    onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                    placeholder="29xxxxxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">النطاق الجغرافي المكلف به:</label>
                  <input
                    type="text"
                    value={form.assignedZone}
                    onChange={(e) => setForm({ ...form, assignedZone: e.target.value })}
                    placeholder="مثال: المهندسين والدقي"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">وسيلة التوصيل:</label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900"
                  >
                    <option value="MOTORCYCLE">دراجة نارية (موتوسيكل)</option>
                    <option value="CAR">سيارة ملاكي</option>
                    <option value="VAN">سيارة فان</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم اللوحة المعدنية:</label>
                  <input
                    type="text"
                    value={form.vehiclePlate}
                    onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                    placeholder="س ق ص 718"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-blue-950 text-[11px] border border-blue-200">
                🛡️ سيقوم الذكاء الاصطناعي بإجراء فحص أمني وتدقيق الرقم القومي ورقم اللوحة وإصدار تقرير الأهلية فوراً.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  إدراج وفحص أمني
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
