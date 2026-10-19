import React, { useState } from 'react';
import {
  CalendarCheck,
  Sparkles,
  UserCheck,
  CheckCircle,
  Clock,
  Archive,
  Phone,
  ArrowUpRight,
  Plus,
  X,
  AlertCircle,
  Building,
  User,
  ShieldAlert,
  Zap,
  Navigation,
  Truck,
  Gauge,
  Calendar,
  Check,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { AgendaTask } from '../types';
import { SmartSchedulingEngine } from './SmartSchedulingEngine';

export const OperationsAgenda: React.FC = () => {
  const { agenda, updateAgendaStatus, addAgendaTask, staff, shipments } = useLogistics();

  const [activeMainTab, setActiveMainTab] = useState<'LIST' | 'SCHEDULER'>('LIST');
  const [activeSchedulingTaskId, setActiveSchedulingTaskId] = useState<string | null>(null);
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);

  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    clientName: '',
    clientPhone: '',
    type: 'merchant_partnership' as AgendaTask['type'],
    priority: 'high' as AgendaTask['priority'],
    summary: '',
    suggestedAction: '',
  });

  const filteredAgenda = agenda.filter((task) => {
    if (filterType !== 'ALL' && task.type !== filterType) return false;
    if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.clientName) return;

    addAgendaTask({
      title: newTask.title,
      source: 'MANUAL',
      clientName: newTask.clientName,
      clientPhone: newTask.clientPhone,
      type: newTask.type,
      priority: newTask.priority,
      status: 'NEW',
      summary: newTask.summary || newTask.title,
      suggestedAction: newTask.suggestedAction || 'متابعة مباشرة مع العميل',
    });

    setIsAddModalOpen(false);
    setNewTask({
      title: '',
      clientName: '',
      clientPhone: '',
      type: 'merchant_partnership',
      priority: 'high',
      summary: '',
      suggestedAction: '',
    });
  };

  const newTasksCount = agenda.filter((t) => t.status === 'NEW').length;
  const inProgressCount = agenda.filter((t) => t.status === 'IN_PROGRESS').length;
  const partnershipCount = agenda.filter((t) => t.type === 'merchant_partnership').length;

  return (
    <div className="space-y-5">
      {/* Main Mode Switcher: Daily Agenda List vs AI Smart Scheduling Engine */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab('LIST')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'LIST'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-amber-400" />
            <span>جدول الأعمال والمهام اليومية</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-amber-300 font-mono">
              {agenda.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveMainTab('SCHEDULER');
              setActiveSchedulingTaskId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'SCHEDULER'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Zap className="w-4 h-4 text-slate-950 fill-current" />
            <span>محرّك الجدولة الذكية للطلبات وحركة المرور (AI Scheduler)</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-950 text-amber-300 text-[10px] font-bold">
              AI
            </span>
          </button>
        </div>

        {activeMainTab === 'LIST' && (
          <button
            onClick={() => {
              setActiveSchedulingTaskId(null);
              setIsSchedulerModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>نافذة الجدولة المباشرة</span>
          </button>
        )}
      </div>

      {/* VIEW 1: Smart Scheduling Engine Full View */}
      {activeMainTab === 'SCHEDULER' ? (
        <SmartSchedulingEngine
          isEmbedded={true}
          initialTaskId={activeSchedulingTaskId}
          onClose={() => setActiveMainTab('LIST')}
        />
      ) : (
        /* VIEW 2: Standard Operations Agenda List */
        <>
          {/* Smart Traffic & Courier Scheduling Promotional Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-indigo-900 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
                <Gauge className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">الجدولة الذكية للطلبات وتفادي ساعات الذروة (AI Smart Scheduling)</h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                    نشط بالذكاء الاصطناعي
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  يقوم الذكاء الاصطناعي بدراسة كثافات محاور القاهرة والجيزة، واقتراح أفضل نوافذ الاستلام من المتاجر والتسليم للعملاء مع مطابقة أقرب كابتن ونوع مركبته.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveMainTab('SCHEDULER');
                setActiveSchedulingTaskId(null);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-current" />
              <span>تشغيل محرّك الجدولة الذكية</span>
            </button>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">مهام وطلبات جديدة غير مفروزة</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{newTasksCount} طلبات</div>
              <div className="text-[11px] text-slate-500 mt-1">مؤرشفة آلياً بواسطة المساعد الذكي</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">طلبات تعاقد وشراكة تجارية</span>
                <Building className="w-4 h-4 text-slate-800" />
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                {partnershipCount} تجار
              </div>
              <div className="text-[11px] text-slate-500 mt-1">متاجر إلكترونية ترغب في الانضمام للشبكة</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">قيد المتابعة من الإدارة</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-600 font-mono">{inProgressCount} مهام</div>
              <div className="text-[11px] text-slate-500 mt-1">معينة للمشرفين والمسؤولين</div>
            </div>
          </div>

      {/* Filter and Action Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Type Filter */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'كافة المعاملات' },
            { id: 'merchant_partnership', label: 'شراكة مع تاجر' },
            { id: 'pickup_request', label: 'طلب استلام فوري' },
            { id: 'order_inquiry', label: 'استفسار وتتبع عميل' },
            { id: 'complaint_fraud', label: 'شكاوى ونزاهة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>إضافة مهمة يدوية لجدول الأعمال</span>
        </button>
      </div>

      {/* Agenda Items List */}
      <div className="space-y-3">
        {filteredAgenda.map((task) => {
          const isNew = task.status === 'NEW';
          const isInProgress = task.status === 'IN_PROGRESS';
          const isResolved = task.status === 'RESOLVED';
          const isPartnership = task.type === 'merchant_partnership';
          const isComplaint = task.type === 'complaint_fraud';

          return (
            <div
              key={task.id}
              className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-all ${
                isNew
                  ? 'border-amber-300 bg-amber-50/15'
                  : isComplaint
                  ? 'border-rose-300 bg-rose-50/10'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPartnership
                        ? 'bg-amber-100 text-amber-800'
                        : isComplaint
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {isPartnership ? (
                      <Building className="w-5 h-5" />
                    ) : isComplaint ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <CalendarCheck className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                      {task.source === 'AI_CHAT' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          أرشفة ذكية من الدردشة
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          task.priority === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        أولوية {task.priority === 'high' ? 'عالية' : 'عادية'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>العميل / التاجر: <strong className="text-slate-800">{task.clientName}</strong></span>
                      {task.clientPhone && (
                        <>
                          <span>·</span>
                          <span className="font-mono flex items-center gap-1 text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {task.clientPhone}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-[11px] font-mono text-slate-400 block">{task.createdAt}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block ${
                      isNew
                        ? 'bg-amber-100 text-amber-900 animate-pulse'
                        : isInProgress
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isNew ? 'جديد (ينتظر التعيين)' : isInProgress ? 'قيد المعالجة' : 'تم الإنجاز'}
                  </span>
                </div>
              </div>

              {/* Summary and AI Action */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5 my-3">
                <p className="leading-relaxed">{task.summary}</p>
                <div className="pt-1.5 border-t border-slate-200 flex items-center gap-1 text-emerald-800 font-semibold text-[11px]">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>الإجراء المقترح: {task.suggestedAction}</span>
                </div>
              </div>

              {/* AI Smart Schedule Badge & Windows */}
              {task.smartSchedule && (
                <div className="bg-gradient-to-r from-indigo-50/90 via-emerald-50/60 to-indigo-50/90 border border-indigo-200 p-3 rounded-xl my-2.5 text-xs text-indigo-950 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-[11px] text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      الجدولة الذكية المعتمدة (تفادي ساعات الذروة):
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                      كفاءة {task.smartSchedule.efficiencyScore || 94}%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white/85 p-2 rounded-lg border border-indigo-100 flex items-center justify-between">
                      <span className="text-slate-500">نافذة الاستلام:</span>
                      <strong className="font-mono text-slate-900">{task.smartSchedule.optimalPickupWindow}</strong>
                    </div>
                    <div className="bg-white/85 p-2 rounded-lg border border-indigo-100 flex items-center justify-between">
                      <span className="text-slate-500">نافذة التسليم:</span>
                      <strong className="font-mono text-emerald-800">{task.smartSchedule.optimalDeliveryWindow}</strong>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-600 pt-1 gap-1">
                    <span>الكابتن المسند: <strong className="text-slate-900">{task.smartSchedule.recommendedCourierName || task.assignedTo}</strong></span>
                    {task.smartSchedule.recommendedCorridor && (
                      <span className="text-indigo-800 font-medium">المسار: {task.smartSchedule.recommendedCorridor}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Status Change Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-2">
                <span className="text-[11px] text-slate-400">
                  {task.assignedTo ? `مكلف بها: ${task.assignedTo}` : 'غير معينة لموظف محدد'}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* AI Smart Scheduling Action Button */}
                  <button
                    onClick={() => {
                      setActiveSchedulingTaskId(task.id);
                      setIsSchedulerModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="تحليل حركة المرور واقتراح موعد استلام وتسليم مثالي للكابتن"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>جدولة ذكية بالـ AI</span>
                  </button>

                  {isNew && (
                    <button
                      onClick={() => updateAgendaStatus(task.id, 'IN_PROGRESS')}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      بدء التنفيذ وتكليف موظف
                    </button>
                  )}

                  {!isResolved && (
                    <button
                      onClick={() => updateAgendaStatus(task.id, 'RESOLVED')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      تأكيد الحل والإغلاق
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredAgenda.length === 0 && (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
            <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">لا توجد مهام في جدول الأعمال تطابق الفلتر الحالي</p>
          </div>
        )}
      </div>

      {/* Modal: Add Manual Agenda Task */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">إدراج مهمة بجدول أعمال الإدارة</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان المعاملة / الطلب:</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="مثال: تعاقد مع متجر أحذية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم الطرف المعني:</label>
                  <input
                    type="text"
                    required
                    value={newTask.clientName}
                    onChange={(e) => setNewTask({ ...newTask, clientName: e.target.value })}
                    placeholder="اسم التاجر أو العميل"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الهاتف:</label>
                  <input
                    type="tel"
                    value={newTask.clientPhone}
                    onChange={(e) => setNewTask({ ...newTask, clientPhone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تصنيف الطلب:</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="merchant_partnership">شراكة مع تاجر</option>
                    <option value="pickup_request">طلب استلام أوردرات</option>
                    <option value="order_inquiry">استفسار شحنة</option>
                    <option value="complaint_fraud">شكوى نزاهة</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">درجة الأهمية:</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="high">عالية (فورية)</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">عادية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">تفاصيل وموجز الطلب:</label>
                <textarea
                  rows={3}
                  value={newTask.summary}
                  onChange={(e) => setNewTask({ ...newTask, summary: e.target.value })}
                  placeholder="اكتب تفاصيل ما تم الاتفاق عليه..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                ></textarea>
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
                  حفظ في جدول الأعمال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

      {/* Modal: AI Smart Scheduling Direct Popup */}
      {isSchedulerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-5xl my-auto animate-in fade-in zoom-in-95">
            <SmartSchedulingEngine
              isEmbedded={false}
              initialTaskId={activeSchedulingTaskId}
              onClose={() => setIsSchedulerModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
