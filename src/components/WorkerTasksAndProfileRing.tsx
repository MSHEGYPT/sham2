import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Package,
  Plus,
  KeyRound,
  IdCard,
  User,
  X,
  FileCheck,
  Save,
  RotateCcw,
  BarChart3,
  TrendingUp,
  ListTodo,
  Activity,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { WorkerTask } from '../types';
import { CourierPerformanceAnalytics } from './CourierPerformanceAnalytics';

export const WorkerTasksAndProfileRing: React.FC = () => {
  const {
    currentUser,
    workerTasks,
    addWorkerTask,
    updateWorkerTaskStatus,
    staff,
    updateStaffMember,
    recordCashDeposit,
    shipments,
    verifyAndDeliverShipment,
  } = useLogistics();

  // Find the staff profile matching current courier
  const currentCourier =
    staff.find((s) => s.id === currentUser.id || s.phone === currentUser.emailOrPhone) ||
    staff.find((s) => s.role === 'COURIER') ||
    staff[3];

  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'ANALYTICS' | 'TASKS'>('OVERVIEW');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TODO' | 'COMPLETED'>('ALL');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentCourier.name,
    phone: currentCourier.phone,
    nationalId: currentCourier.nationalId,
    vehicleType: currentCourier.vehicleType || 'MOTORCYCLE',
    vehiclePlate: currentCourier.vehiclePlate || 'س ق ص 718',
    assignedZone: currentCourier.assignedZone,
  });

  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    taskType: 'DELIVERY_DISPATCH' as WorkerTask['taskType'],
    priority: 'HIGH' as WorkerTask['priority'],
    timeWindow: 'خلال الوردية الحالية',
    location: currentCourier.assignedZone,
    expectedCod: 0,
    notes: '',
  });

  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Filter tasks for this worker
  const myTasks = workerTasks.filter(
    (t) => t.assignedCourierId === currentCourier.id || t.assignedCourierName === currentCourier.name
  );

  const displayedTasks = myTasks.filter((t) => {
    if (activeFilter === 'TODO') return t.status !== 'COMPLETED';
    if (activeFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  const todoCount = myTasks.filter((t) => t.status !== 'COMPLETED').length;
  const completedCount = myTasks.filter((t) => t.status === 'COMPLETED').length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStaffMember(currentCourier.id, {
      name: profileForm.name,
      phone: profileForm.phone,
      nationalId: profileForm.nationalId,
      vehicleType: profileForm.vehicleType as any,
      vehiclePlate: profileForm.vehiclePlate,
      assignedZone: profileForm.assignedZone,
    });
    setIsEditingProfile(false);
    setFeedbackNotice('تم تحديث وتسجيل بيانات المندوب والمركبة بنجاح في السجل المركزي.');
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title) return;

    addWorkerTask({
      title: newTaskForm.title,
      taskType: newTaskForm.taskType,
      assignedCourierId: currentCourier.id,
      assignedCourierName: currentCourier.name,
      status: 'TODO',
      priority: newTaskForm.priority,
      dueDate: new Date().toISOString().slice(0, 10),
      timeWindow: newTaskForm.timeWindow,
      location: newTaskForm.location,
      expectedCod: Number(newTaskForm.expectedCod) || 0,
      notes: newTaskForm.notes,
    });

    setIsNewTaskModalOpen(false);
    setNewTaskForm({
      title: '',
      taskType: 'DELIVERY_DISPATCH',
      priority: 'HIGH',
      timeWindow: 'خلال الوردية الحالية',
      location: currentCourier.assignedZone,
      expectedCod: 0,
      notes: '',
    });
    setFeedbackNotice('تمت إضافة المهمة لجدول أعمالك الميداني.');
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleDepositCash = () => {
    if (depositAmount <= 0) return;
    const res = recordCashDeposit(currentCourier.id, depositAmount);
    setFeedbackNotice(res.message);
    setIsDepositModalOpen(false);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const isNearLimit = currentCourier.currentCashHeld >= (currentCourier.maxCashLimit || 3000) * 0.85;

  return (
    <div className="space-y-6">
      {/* Ring Header */}
      <div className="bg-gradient-to-r from-purple-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-purple-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Truck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-purple-300 tracking-wider uppercase">
              دائرة العمليات الميدانية للعاملين (Onion Ring #4)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            مهام الأعمال اليومية وتسجيل بيانات العامل والمركبة
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            مساحة العمل المخصصة لمندوب التوصيل: متابعة خط السير والمهام الميدانية، تحديث بيانات
            المركبة، مراقبة العهدة النقدية، وتأكيد التسليمات برمز OTP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection(activeSection === 'ANALYTICS' ? 'OVERVIEW' : 'ANALYTICS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'ANALYTICS'
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                : 'bg-purple-800/80 hover:bg-purple-700 text-purple-200 border-purple-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>تحليلات أداء المناديب</span>
          </button>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            {isEditingProfile ? 'إلغاء التعديل' : 'تحديث بياناتي والمركبة'}
          </button>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مهمة لجدول أعمالي</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center animate-in fade-in">
          ✓ {feedbackNotice}
        </div>
      )}

      {/* Worker Digital Badge & Cash Metric Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Worker ID Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              بطاقة المندوب الرقمية المعتمدة
            </span>
            <IdCard className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-3">
            <img
              src={currentCourier.avatar}
              alt={currentCourier.name}
              className="w-12 h-12 rounded-xl object-cover border border-purple-300"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{currentCourier.name}</h4>
              <p className="text-[11px] text-slate-500 font-mono">هاتف: {currentCourier.phone}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>الرقم القومي:</span>
              <strong className="font-mono text-slate-900">{currentCourier.nationalId}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>المركبة واللوحة:</span>
              <strong className="text-slate-900">
                {currentCourier.vehicleType === 'MOTORCYCLE' ? 'موتوسيكل' : 'سيارة'} (
                {currentCourier.vehiclePlate || 'بدون لوحة'})
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>النطاق الميداني:</span>
              <strong className="text-slate-900">{currentCourier.assignedZone}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Cash Held & Limits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">العهدة النقدية في عهدتك الآن</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-amber-700 font-mono">
              {currentCourier.currentCashHeld.toLocaleString('ar-EG')} ج.م
            </div>
            <span className="text-xs text-slate-400 font-mono">
              الحد: {currentCourier.maxCashLimit} ج.م
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${isNearLimit ? 'bg-rose-500' : 'bg-amber-500'}`}
              style={{
                width: `${Math.min(
                  100,
                  (currentCourier.currentCashHeld / (currentCourier.maxCashLimit || 3000)) * 100
                )}%`,
              }}
            ></div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              {isNearLimit ? '⚠️ سقف العهدة مكتمل تقريباً' : 'ضمن الحدود الآمنة'}
            </span>
            {currentCourier.currentCashHeld > 0 && (
              <button
                onClick={() => {
                  setDepositAmount(currentCourier.currentCashHeld);
                  setIsDepositModalOpen(true);
                }}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                توريد للخزينة
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Performance & Deliveries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إحصائيات إنجاز المهام</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block">مهام قيد التنفيذ</span>
              <strong className="text-xl font-bold font-mono text-purple-700">{todoCount}</strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block">مهام منجزة</span>
              <strong className="text-xl font-bold font-mono text-emerald-700">
                {completedCount}
              </strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 text-center pt-1">
            نسبة نجاح التسليم الإجمالية: <strong className="text-emerald-700 font-mono">{currentCourier.successRate}%</strong>
          </div>
        </div>
      </div>

      {/* Edit Profile Panel (Collapsible) */}
      {isEditingProfile && (
        <div className="bg-white p-6 rounded-3xl border border-purple-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              تحديث وتسجيل بيانات العامل والمركبة في الدائرة
            </h3>
            <span className="text-xs text-slate-500">يتم التحقق تلقائياً من صحة البيانات</span>
          </div>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">الاسم الكامل:</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">رقم الهاتف:</label>
              <input
                type="tel"
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">الرقم القومي:</label>
              <input
                type="text"
                required
                maxLength={14}
                value={profileForm.nationalId}
                onChange={(e) => setProfileForm({ ...profileForm, nationalId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">نوع المركبة:</label>
              <select
                value={profileForm.vehicleType}
                onChange={(e) => setProfileForm({ ...profileForm, vehicleType: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
              >
                <option value="MOTORCYCLE">دراجة نارية (موتوسيكل)</option>
                <option value="CAR">سيارة ملاكي</option>
                <option value="VAN">سيارة فان بضائع</option>
                <option value="BICYCLE">دراجة هوائية</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">رقم اللوحة المعدنية:</label>
              <input
                type="text"
                value={profileForm.vehiclePlate}
                onChange={(e) => setProfileForm({ ...profileForm, vehiclePlate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">النطاق الجغرافي النشط:</label>
              <input
                type="text"
                value={profileForm.assignedZone}
                onChange={(e) => setProfileForm({ ...profileForm, assignedZone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              />
            </div>

            <div className="sm:col-span-3 pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>حفظ البيانات في السجل</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section Switcher Tabs: Analytics vs Tasks */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSection('OVERVIEW')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'OVERVIEW'
                ? 'bg-slate-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>عرض شامل (التحليلات والمهام)</span>
          </button>

          <button
            onClick={() => setActiveSection('ANALYTICS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'ANALYTICS'
                ? 'bg-purple-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span>تحليلات أداء المناديب (Courier Performance Analytics)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">Recharts</span>
          </button>

          <button
            onClick={() => setActiveSection('TASKS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'TASKS'
                ? 'bg-slate-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ListTodo className="w-4 h-4 text-emerald-600" />
            <span>جدول المهام الميدانية ({myTasks.length})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          {activeSection === 'ANALYTICS' && 'عرض الرسوم البيانية لتسليمات وتأخيرات أسطول المناديب'}
          {activeSection === 'TASKS' && 'متابعة وتأكيد تسليمات الطرود والمهام لوردية اليوم'}
          {activeSection === 'OVERVIEW' && 'المنظومة الميدانية: التحليلات البيانية وجدول المهام معاً'}
        </div>
      </div>

      {/* Courier Performance Analytics Dashboard Section */}
      {(activeSection === 'OVERVIEW' || activeSection === 'ANALYTICS') && (
        <div className="animate-in fade-in duration-200">
          <CourierPerformanceAnalytics />
        </div>
      )}

      {/* Tasks Section */}
      {(activeSection === 'OVERVIEW' || activeSection === 'TASKS') && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Task Filters & Action Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                كافة المهام ({myTasks.length})
              </button>

          <button
            onClick={() => setActiveFilter('TODO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'TODO'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            قيد التنفيذ ({todoCount})
          </button>

          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'COMPLETED'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المكتملة ({completedCount})
          </button>
        </div>

        <span className="text-xs text-slate-500">
          جدول مهامك الميدانية لوردية اليوم
        </span>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {displayedTasks.map((task) => {
          const isDone = task.status === 'COMPLETED';

          return (
            <div
              key={task.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDone ? 'border-emerald-200 bg-emerald-50/15' : 'border-slate-200'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      task.taskType === 'DELIVERY_DISPATCH'
                        ? 'bg-blue-100 text-blue-800'
                        : task.taskType === 'PICKUP_COLLECTION'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {task.taskType === 'DELIVERY_DISPATCH'
                      ? 'مهمة توصيل طرد'
                      : task.taskType === 'PICKUP_COLLECTION'
                      ? 'جولة استلام من متجر'
                      : 'توريد كاش للخزينة'}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400">{task.timeWindow}</span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {task.location}
                  </span>
                  {task.expectedCod && task.expectedCod > 0 && (
                    <span className="font-mono font-bold text-amber-700">
                      مبلغ التحصيل: {task.expectedCod} ج.م
                    </span>
                  )}
                </div>

                {task.notes && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    ملاحظات: {task.notes}
                  </p>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {!isDone ? (
                  <button
                    onClick={() => updateWorkerTaskStatus(task.id, 'COMPLETED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد إنجاز المهمة</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-100 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم الإنجاز {task.completedAt ? `(${task.completedAt.slice(11)})` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {displayedTasks.length === 0 && (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">لا توجد مهام في هذه الفئة حالياً</p>
          </div>
        )}
      </div>
      </div>
      )}

      {/* Modal: Add Custom Worker Task */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">إضافة مهمة ميدانية شخصية</h3>
              </div>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان المهمة:</label>
                <input
                  type="text"
                  required
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="مثال: المرور على متجر لاستلام كشف الحساب..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع المهمة:</label>
                  <select
                    value={newTaskForm.taskType}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, taskType: e.target.value as any })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="DELIVERY_DISPATCH">توصيل شحنة</option>
                    <option value="PICKUP_COLLECTION">جولة استلام</option>
                    <option value="RETURN_HANDOVER">توريد للمستودع</option>
                    <option value="MAINTENANCE_INSPECTION">صيانة أو فحص مركبة</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">التوقيت المتوقع:</label>
                  <input
                    type="text"
                    value={newTaskForm.timeWindow}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, timeWindow: e.target.value })}
                    placeholder="مثال: الساعة 03:00 م"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الموقع أو العنوان:</label>
                <input
                  type="text"
                  value={newTaskForm.location}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, location: e.target.value })}
                  placeholder="اسم الحي أو الشارع"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ملاحظات:</label>
                <input
                  type="text"
                  value={newTaskForm.notes}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })}
                  placeholder="أي تفاصيل خاصة بالمهمة..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                >
                  إضافة لجدول الأعمال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Deposit Cash to Treasury */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">توريد النقدية إلى الخزينة المركزية</h3>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">العهدة المتاحة للتوريد:</span>
                <strong className="text-lg font-mono font-bold text-amber-700">
                  {currentCourier.currentCashHeld.toLocaleString('ar-EG')} ج.م
                </strong>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  المبلغ المودع في الخزينة الآن (ج.م):
                </label>
                <input
                  type="number"
                  max={currentCourier.currentCashHeld}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-base font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDepositCash}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  تأكيد التوريد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
