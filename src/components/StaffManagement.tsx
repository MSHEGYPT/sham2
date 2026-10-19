import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Coins,
  CheckCircle,
  Truck,
  Phone,
  MapPin,
  Star,
  Award,
  AlertTriangle,
  Building,
  UserCheck,
  UserX,
  Plus,
  X,
  BarChart3,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { StaffMember, StaffRole } from '../types';

export const StaffManagement: React.FC = () => {
  const { staff, addStaffMember, toggleStaffStatus, recordCashDeposit, setActiveAdminTab } = useLogistics();

  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [depositModalStaff, setDepositModalStaff] = useState<StaffMember | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositNotice, setDepositNotice] = useState<string | null>(null);

  // New staff form state
  const [formData, setFormData] = useState({
    name: '',
    role: 'COURIER' as StaffRole,
    phone: '',
    nationalId: '',
    department: 'أسطول التوصيل الميداني',
    assignedZone: 'القاهرة الكبرى',
    vehicleType: 'MOTORCYCLE' as StaffMember['vehicleType'],
    vehiclePlate: '',
    maxCashLimit: 3000,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE' as StaffMember['status'],
    joinedDate: new Date().toISOString().slice(0, 10),
    currentCashHeld: 0,
  });

  const departmentList = [
    { id: 'ALL', label: 'كافة الأقسام والموظفين' },
    { id: 'OPERATIONS', label: 'العمليات والتوزيع' },
    { id: 'COURIER', label: 'أسطول المناديب الميداني' },
    { id: 'FINANCE', label: 'المالية والخزينة' },
    { id: 'CARE', label: 'خدمة العملاء والتحقق' },
    { id: 'MANAGEMENT', label: 'الإدارة العليا' },
  ];

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery) ||
      member.assignedZone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (selectedDepartment === 'ALL') return true;
    if (selectedDepartment === 'COURIER') return member.role === 'COURIER';
    if (selectedDepartment === 'OPERATIONS')
      return member.role === 'OPERATIONS_SUPERVISOR' || member.role === 'DISPATCHER';
    if (selectedDepartment === 'FINANCE') return member.role === 'ACCOUNTANT';
    if (selectedDepartment === 'CARE') return member.role === 'CUSTOMER_CARE';
    if (selectedDepartment === 'MANAGEMENT') return member.role === 'GENERAL_MANAGER';

    return true;
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    addStaffMember({
      name: formData.name,
      role: formData.role,
      phone: formData.phone,
      nationalId: formData.nationalId || '29000000000000',
      department:
        formData.role === 'COURIER'
          ? 'أسطول التوصيل الميداني'
          : formData.role === 'ACCOUNTANT'
          ? 'المالية والخزينة'
          : formData.role === 'CUSTOMER_CARE'
          ? 'خدمة العملاء والتحقق'
          : 'إدارة العمليات',
      assignedZone: formData.assignedZone,
      status: formData.status,
      vehicleType: formData.role === 'COURIER' ? formData.vehicleType : 'NONE',
      vehiclePlate: formData.vehiclePlate,
      currentCashHeld: 0,
      maxCashLimit: Number(formData.maxCashLimit) || 3000,
      joinedDate: formData.joinedDate,
      avatar: formData.avatar,
    });

    setIsAddModalOpen(false);
    setFormData({
      name: '',
      role: 'COURIER',
      phone: '',
      nationalId: '',
      department: 'أسطول التوصيل الميداني',
      assignedZone: 'القاهرة الكبرى',
      vehicleType: 'MOTORCYCLE',
      vehiclePlate: '',
      maxCashLimit: 3000,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      joinedDate: new Date().toISOString().slice(0, 10),
      currentCashHeld: 0,
    });
  };

  const handleDepositCash = () => {
    if (!depositModalStaff || depositAmount <= 0) return;
    const res = recordCashDeposit(depositModalStaff.id, depositAmount);
    setDepositNotice(res.message);
    setTimeout(() => {
      setDepositNotice(null);
      setDepositModalStaff(null);
      setDepositAmount(0);
    }, 1500);
  };

  const totalHeldCashInFleet = staff
    .filter((s) => s.role === 'COURIER')
    .reduce((acc, curr) => acc + curr.currentCashHeld, 0);

  const couriersWithAlerts = staff.filter((s) => s.fraudAlertsCount > 0);

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">إجمالي كادر الشركة</span>
            <Users className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{staff.length} موظف</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {staff.filter((s) => s.role === 'COURIER').length} مندوب توصيل ميداني
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">إجمالي العهد النقدية في الميدان</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {totalHeldCashInFleet.toLocaleString('ar-EG')} ج.م
          </div>
          <div className="text-[11px] text-slate-500 mt-1">مبالغ COD محصلة تنتظر التوريد للخزينة</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">معدل نجاح التسليم الجماعي</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">97.8%</div>
          <div className="text-[11px] text-slate-500 mt-1">نسبة تسليم دقيقة بدون مرتجعات وهمية</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">مؤشر الرقابة ونزاهة الكادر</span>
            <ShieldAlert className="w-4 h-4 text-slate-800" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {couriersWithAlerts.length === 0 ? (
              <span className="text-emerald-600">صفر شبهات</span>
            ) : (
              <span className="text-rose-600">{couriersWithAlerts.length} تحت الرقابة</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">متابعة دقيقة لحركة الأموال وكود الأمان</div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Department Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          {departmentList.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDepartment(dept.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedDepartment === dept.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الهاتف، أو المنطقة..."
            className="flex-1 md:w-64 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />

          <button
            onClick={() => setActiveAdminTab('COURIER_REPORTS')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-colors shrink-0 shadow-xs cursor-pointer"
            title="عرض وتوليد تقارير الأداء الأسبوعية للمناديب ومعدلات التأخير (Recharts)"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-950" />
            <span>تقارير أداء المناديب</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      {/* Staff Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((member) => {
          const isCourier = member.role === 'COURIER';
          const isHeldNearLimit =
            isCourier && member.currentCashHeld >= member.maxCashLimit * 0.85;

          return (
            <div
              key={member.id}
              className={`bg-white rounded-xl border transition-all p-4 flex flex-col justify-between ${
                member.status === 'SUSPENDED'
                  ? 'border-rose-300 bg-rose-50/20 opacity-75'
                  : member.fraudAlertsCount > 0
                  ? 'border-rose-400 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{member.department}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      member.status === 'ACTIVE' || member.status === 'ON_DUTY'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : member.status === 'SUSPENDED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {member.status === 'ACTIVE'
                      ? 'نشط بالخدمة'
                      : member.status === 'ON_DUTY'
                      ? 'في الميدان'
                      : member.status === 'SUSPENDED'
                      ? 'موقوف إدارياً'
                      : 'في استراحة'}
                  </span>
                </div>

                {/* Role and Zone */}
                <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1.5 border border-slate-100 mb-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Phone className="w-3 h-3" />
                      الهاتف:
                    </span>
                    <span className="font-mono font-medium text-slate-900">{member.phone}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3 h-3" />
                      النطاق الجغرافي:
                    </span>
                    <span className="font-medium text-slate-800">{member.assignedZone}</span>
                  </div>

                  {member.vehicleType && member.vehicleType !== 'NONE' && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Truck className="w-3 h-3" />
                        المركبة:
                      </span>
                      <span className="font-medium text-slate-800">
                        {member.vehicleType === 'MOTORCYCLE'
                          ? 'دراجة نارية'
                          : member.vehicleType === 'CAR'
                          ? 'سيارة'
                          : 'فان'}{' '}
                        {member.vehiclePlate ? `(${member.vehiclePlate})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Courier Cash Held & Anti-Corruption Guard */}
                {isCourier && (
                  <div
                    className={`p-2.5 rounded-lg border mb-3 text-xs ${
                      isHeldNearLimit
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        العهدة النقدية الحالية:
                      </span>
                      <strong className="font-mono text-sm font-bold">
                        {member.currentCashHeld.toLocaleString('ar-EG')} ج.م
                      </strong>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${
                          isHeldNearLimit ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (member.currentCashHeld / (member.maxCashLimit || 3000)) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>الحد الأقصى المسموح: {member.maxCashLimit} ج.م</span>
                      {member.currentCashHeld > 0 && (
                        <button
                          onClick={() => {
                            setDepositModalStaff(member);
                            setDepositAmount(member.currentCashHeld);
                          }}
                          className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                        >
                          توريد للخزينة
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery and Rating Metrics */}
                {isCourier && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">التسليمات</span>
                      <strong className="text-slate-800 font-mono font-bold">
                        {member.totalDelivered}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">نسبة النجاح</span>
                      <strong className="text-emerald-700 font-mono font-bold">
                        {member.successRate}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">التقييم</span>
                      <span className="text-amber-600 font-bold flex items-center justify-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {member.rating}
                      </span>
                    </div>
                  </div>
                )}

                {/* Fraud Warnings if any */}
                {member.fraudAlertsCount > 0 && (
                  <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>تنبيه سلوكي مسجل: قيد المراجعة في غرفة الرقابة ومكافحة الفساد</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleStaffStatus(member.id)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                    member.status === 'SUSPENDED'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                  }`}
                >
                  {member.status === 'SUSPENDED' ? (
                    <>
                      <UserCheck className="w-3 h-3" />
                      <span>إلغاء الإيقاف</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-3 h-3" />
                      <span>إيقاف إداري مؤقت</span>
                    </>
                  )}
                </button>

                <span className="text-[10px] text-slate-400">انضم في: {member.joinedDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Staff Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">تسجيل موظف أو مندوب جديد بالهيكل التنظيمي</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الاسم الكامل:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: أحمد عبد الله"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">المسمى الوظيفي:</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as StaffRole })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="COURIER">مندوب توصيل واستلام (ميداني)</option>
                    <option value="OPERATIONS_SUPERVISOR">مشرف عمليات وتوزيع</option>
                    <option value="ACCOUNTANT">محاسب ومدقق خزينة</option>
                    <option value="CUSTOMER_CARE">خدمة عملاء وتحقق</option>
                    <option value="GENERAL_MANAGER">إدارة عليا</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الهاتف:</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الرقم القومي (للتوثيق):</label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="14 رقم"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نطاق التغطية / المنطقة:</label>
                  <input
                    type="text"
                    value={formData.assignedZone}
                    onChange={(e) => setFormData({ ...formData, assignedZone: e.target.value })}
                    placeholder="مثال: المعادي والمقطم"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    سقف العهدة النقدية المسموح (ج.م):
                  </label>
                  <input
                    type="number"
                    value={formData.maxCashLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, maxCashLimit: Number(e.target.value) })
                    }
                    placeholder="3000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              {formData.role === 'COURIER' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">نوع وسيلة النقل:</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicleType: e.target.value as StaffMember['vehicleType'],
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900"
                    >
                      <option value="MOTORCYCLE">دراجة نارية (موتوسيكل)</option>
                      <option value="CAR">سيارة خاصة</option>
                      <option value="VAN">سيارة فان نقل بضائع</option>
                      <option value="BICYCLE">دراجة هوائية</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">رقم اللوحة المعدنية:</label>
                    <input
                      type="text"
                      value={formData.vehiclePlate}
                      onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                      placeholder="مثال: س ق ص 718"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle className="w-4 h-4 text-amber-400" />
                  <span>حفظ الموظف وتوليد الحساب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cash Deposit to Treasury (توريد العهدة) */}
      {depositModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">توريد عهدة نقدية إلى الخزينة المركزية</h3>
              </div>
              <button
                onClick={() => setDepositModalStaff(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {depositNotice ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold">
                  {depositNotice}
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-slate-600">
                      اسم المندوب: <strong className="text-slate-900">{depositModalStaff.name}</strong>
                    </p>
                    <p className="text-slate-600 mt-1">
                      إجمالي النقدية المحصلة في عهدته حالياً:{' '}
                      <strong className="text-amber-800 font-mono text-sm">
                        {depositModalStaff.currentCashHeld.toLocaleString('ar-EG')} ج.م
                      </strong>
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      المبلغ المورد نقداً إلى الخزينة الآن (ج.م):
                    </label>
                    <input
                      type="number"
                      max={depositModalStaff.currentCashHeld}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-base font-bold"
                    />
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-900 text-[11px] border border-amber-200">
                    🛡️ سيتم إصدار إيصال تسوية رقمي وتحديث رصيد المندوب فوراً وإسقاط أي تنبيهات احتجاز نقدية.
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setDepositModalStaff(null)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleDepositCash}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>تأكيد الإيداع في الخزينة</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
