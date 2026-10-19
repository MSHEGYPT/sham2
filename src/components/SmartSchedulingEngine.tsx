import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Users,
  Package,
  Calendar,
  Zap,
  Check,
  RotateCcw,
  Bike,
  Car,
  Truck,
  ShieldCheck,
  Layers,
  ChevronLeft,
  X,
  Gauge,
  Info,
  CalendarCheck,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { AgendaTask, Shipment, PickupSchedule, StaffMember } from '../types';

interface SmartSchedulingEngineProps {
  initialTaskId?: string | null;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const SmartSchedulingEngine: React.FC<SmartSchedulingEngineProps> = ({
  initialTaskId,
  onClose,
  isEmbedded = false,
}) => {
  const {
    agenda,
    shipments,
    pickups,
    staff,
    updateAgendaTask,
    updateShipmentSchedule,
    addAgendaTask,
  } = useLogistics();

  // Filter couriers
  const couriers = staff.filter((s) => s.role === 'COURIER');

  // Filter unscheduled items
  const pendingAgendaTasks = agenda.filter(
    (t) => t.status === 'NEW' || t.type === 'pickup_request' || t.type === 'order_inquiry'
  );
  const pendingShipments = shipments.filter(
    (s) => s.status === 'PENDING_PICKUP' || s.status === 'RECEIVED_IN_HUB'
  );

  // Active Selected Item State
  const [selectedItemType, setSelectedItemType] = useState<'AGENDA' | 'SHIPMENT' | 'CUSTOM'>(
    initialTaskId ? 'AGENDA' : 'AGENDA'
  );
  const [selectedItemId, setSelectedItemId] = useState<string>(initialTaskId || '');

  // Form Parameters for Scheduling
  const [formData, setFormData] = useState({
    titleOrClient: '',
    clientPhone: '',
    city: 'القاهرة',
    district: 'مدينة نصر',
    address: 'شارع عباس العقاد، متفرع من شارع الطيران',
    orderType: 'STANDARD' as 'STANDARD' | 'EXCHANGE' | 'RETURN',
    urgency: 'SAME_DAY' as 'URGENT' | 'SAME_DAY' | 'NEXT_DAY',
    targetDate: new Date().toISOString().slice(0, 10),
    preferredTimeframe: 'ANY' as 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANY',
  });

  // Scheduling State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [scheduleResult, setScheduleResult] = useState<any | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

  // Batch Mode
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchResults, setBatchResults] = useState<Array<any>>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Auto-populate form when selecting an agenda task or shipment
  useEffect(() => {
    if (selectedItemId && selectedItemType === 'AGENDA') {
      const task = agenda.find((t) => t.id === selectedItemId);
      if (task) {
        setFormData((prev) => ({
          ...prev,
          titleOrClient: task.clientName || task.title,
          clientPhone: task.clientPhone || '',
          city: task.rawDetails?.city || prev.city,
          district: task.rawDetails?.district || (task.summary?.includes('التجمع') ? 'التجمع الخامس' : task.summary?.includes('الجيزة') ? 'الدقي' : 'مدينة نصر'),
          address: task.rawDetails?.address || task.summary || 'عنوان العميل المسجل',
          urgency: task.priority === 'high' ? 'URGENT' : 'SAME_DAY',
        }));
        if (task.smartSchedule) {
          setScheduleResult({
            optimalPickupWindow: task.smartSchedule.optimalPickupWindow,
            optimalDeliveryWindow: task.smartSchedule.optimalDeliveryWindow,
            alternativeDeliveryWindow: task.smartSchedule.alternativeDeliveryWindow,
            recommendedCourier: {
              id: task.smartSchedule.recommendedCourierId,
              name: task.smartSchedule.recommendedCourierName,
              vehicleType: 'MOTORCYCLE',
              assignedZone: 'النطاق المعتمد',
              matchScore: task.smartSchedule.efficiencyScore || 95,
              selectionReason: task.smartSchedule.scheduleRationale,
            },
            trafficAssessment: {
              congestionLevel: task.smartSchedule.trafficLevel || 'MODERATE',
              congestionLevelAr: 'سيولة مقبولة خارج ساعات الذروة',
              peakHoursWarning: 'تم تفادي ساعات الذروة المسائية والصباحية',
              recommendedCorridor: task.smartSchedule.recommendedCorridor || 'المحاور السريعة البديلة',
              estimatedTransitMinutes: task.smartSchedule.estimatedTransitMinutes || 30,
              timeSavedMinutes: 25,
            },
            efficiencyScore: task.smartSchedule.efficiencyScore || 94,
            scheduleRationale: task.smartSchedule.scheduleRationale,
            actionSteps: [
              'تم اعتماد الموعد الموصى به وإسناده للمندوب',
              'إشعار المستلم برمز OTP ونافذة الوصول',
            ],
          });
          setIsApplied(true);
        } else {
          setScheduleResult(null);
          setIsApplied(false);
        }
      }
    } else if (selectedItemId && selectedItemType === 'SHIPMENT') {
      const shp = shipments.find((s) => s.trackingNumber === selectedItemId);
      if (shp) {
        setFormData((prev) => ({
          ...prev,
          titleOrClient: `${shp.merchantName} ➔ ${shp.recipientName}`,
          clientPhone: shp.recipientPhone || shp.merchantPhone,
          city: shp.city || 'القاهرة',
          district: shp.district || 'مدينة نصر',
          address: shp.address,
          orderType: shp.orderType || 'STANDARD',
          urgency: 'SAME_DAY',
        }));
        setScheduleResult(null);
        setIsApplied(false);
      }
    }
  }, [selectedItemId, selectedItemType, agenda, shipments]);

  // Trigger AI Smart Scheduling API
  const handleRunAiScheduling = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setIsApplied(false);
    setAppliedMessage(null);

    try {
      const response = await fetch('/api/ai/smart-scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderData: {
            trackingOrId: selectedItemId || 'MANUAL-ORD',
            titleOrClient: formData.titleOrClient || 'طلب شحن جديد',
            city: formData.city,
            district: formData.district,
            address: formData.address,
            orderType: formData.orderType,
            urgency: formData.urgency,
            targetDate: formData.targetDate,
            preferredTimeframe: formData.preferredTimeframe,
          },
          couriers: couriers.map((c) => ({
            id: c.id,
            name: c.name,
            assignedZone: c.assignedZone,
            vehicleType: c.vehicleType || 'MOTORCYCLE',
            status: c.status,
            rating: c.rating,
            activeTasksCount: shipments.filter(
              (s) => s.assignedCourierId === c.id && s.status === 'OUT_FOR_DELIVERY'
            ).length,
          })),
          trafficContext: {
            city: formData.city,
            district: formData.district,
            currentTimeHour: new Date().getHours(),
            preferredTimeframe: formData.preferredTimeframe,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('فشل استدعاء محرك الجدولة الذكية');
      }

      const data = await response.json();
      setScheduleResult(data);
    } catch (err: any) {
      console.error('Smart scheduling error:', err);
      setAnalysisError(err.message || 'حدث خطأ أثناء تحليل حركة المرور');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 1-Click Apply to the system
  const handleApplySchedule = () => {
    if (!scheduleResult) return;

    const courier = scheduleResult.recommendedCourier;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // If applied to an Agenda Task
    if (selectedItemType === 'AGENDA' && selectedItemId) {
      updateAgendaTask(selectedItemId, {
        status: 'IN_PROGRESS',
        assignedTo: courier.name,
        suggestedAction: `موعد الاستلام: ${scheduleResult.optimalPickupWindow} | التسليم: ${scheduleResult.optimalDeliveryWindow} (كابتن: ${courier.name})`,
        smartSchedule: {
          optimalPickupWindow: scheduleResult.optimalPickupWindow,
          optimalDeliveryWindow: scheduleResult.optimalDeliveryWindow,
          alternativeDeliveryWindow: scheduleResult.alternativeDeliveryWindow,
          recommendedCourierId: courier.id,
          recommendedCourierName: courier.name,
          trafficLevel: scheduleResult.trafficAssessment?.congestionLevel || 'MODERATE',
          estimatedTransitMinutes: scheduleResult.trafficAssessment?.estimatedTransitMinutes || 30,
          recommendedCorridor: scheduleResult.trafficAssessment?.recommendedCorridor,
          efficiencyScore: scheduleResult.efficiencyScore || 95,
          scheduleRationale: scheduleResult.scheduleRationale,
          appliedAt: now,
        },
      });

      // If there's an associated shipment tracking
      const matchingShipment = shipments.find(
        (s) => s.recipientPhone === formData.clientPhone || s.trackingNumber === selectedItemId
      );
      if (matchingShipment) {
        updateShipmentSchedule(matchingShipment.trackingNumber, {
          assignedCourierId: courier.id,
          assignedCourierName: courier.name,
          scheduledPickupDate: formData.targetDate,
          scheduledDeliveryWindow: scheduleResult.optimalDeliveryWindow,
          trafficNotes: scheduleResult.trafficAssessment?.recommendedCorridor,
        });
      }

      setIsApplied(true);
      setAppliedMessage(`تم اعتماد الجدولة بنجاح في جدول الأعمال وإسناد المهمة للكابتن (${courier.name})!`);
    } else if (selectedItemType === 'SHIPMENT' && selectedItemId) {
      // Direct shipment schedule
      updateShipmentSchedule(selectedItemId, {
        assignedCourierId: courier.id,
        assignedCourierName: courier.name,
        scheduledPickupDate: formData.targetDate,
        scheduledDeliveryWindow: scheduleResult.optimalDeliveryWindow,
        trafficNotes: `${scheduleResult.trafficAssessment?.recommendedCorridor || ''} (وفر: ${scheduleResult.trafficAssessment?.timeSavedMinutes || 20} دقيقة)`,
      });

      // Add task to agenda for logging
      addAgendaTask({
        title: `جدولة شحنة ذكية: ${selectedItemId}`,
        source: 'MANUAL',
        clientName: formData.titleOrClient,
        clientPhone: formData.clientPhone,
        type: 'pickup_request',
        priority: formData.urgency === 'URGENT' ? 'high' : 'medium',
        status: 'IN_PROGRESS',
        summary: `تمت جدولة الشحنة ${selectedItemId} بنافذة تسليم: ${scheduleResult.optimalDeliveryWindow} عبر الكابتن ${courier.name}. المسار المقترح: ${scheduleResult.trafficAssessment?.recommendedCorridor}.`,
        suggestedAction: `متابعة الاستلام في نافذة: ${scheduleResult.optimalPickupWindow}`,
        assignedTo: courier.name,
        smartSchedule: {
          optimalPickupWindow: scheduleResult.optimalPickupWindow,
          optimalDeliveryWindow: scheduleResult.optimalDeliveryWindow,
          alternativeDeliveryWindow: scheduleResult.alternativeDeliveryWindow,
          recommendedCourierId: courier.id,
          recommendedCourierName: courier.name,
          trafficLevel: scheduleResult.trafficAssessment?.congestionLevel || 'MODERATE',
          estimatedTransitMinutes: scheduleResult.trafficAssessment?.estimatedTransitMinutes || 30,
          recommendedCorridor: scheduleResult.trafficAssessment?.recommendedCorridor,
          efficiencyScore: scheduleResult.efficiencyScore || 95,
          scheduleRationale: scheduleResult.scheduleRationale,
          appliedAt: now,
        },
      });

      setIsApplied(true);
      setAppliedMessage(`تم تطبيق المواعيد وإسناد الشحنة (${selectedItemId}) للكابتن (${courier.name}) بنجاح!`);
    } else {
      // Custom task creation with AI schedule
      const createdTask = addAgendaTask({
        title: `طلب مجدول ذكياً: ${formData.titleOrClient}`,
        source: 'MANUAL',
        clientName: formData.titleOrClient,
        clientPhone: formData.clientPhone,
        type: 'pickup_request',
        priority: formData.urgency === 'URGENT' ? 'high' : 'medium',
        status: 'IN_PROGRESS',
        summary: `طلب مجدول ذكياً في ${formData.city} - ${formData.district}. الاستلام: ${scheduleResult.optimalPickupWindow}، التسليم: ${scheduleResult.optimalDeliveryWindow}.`,
        suggestedAction: `إشعار الكابتن ${courier.name} بالتحرك في النافذة المحددة لتفادي الزحام.`,
        assignedTo: courier.name,
        smartSchedule: {
          optimalPickupWindow: scheduleResult.optimalPickupWindow,
          optimalDeliveryWindow: scheduleResult.optimalDeliveryWindow,
          alternativeDeliveryWindow: scheduleResult.alternativeDeliveryWindow,
          recommendedCourierId: courier.id,
          recommendedCourierName: courier.name,
          trafficLevel: scheduleResult.trafficAssessment?.congestionLevel || 'MODERATE',
          estimatedTransitMinutes: scheduleResult.trafficAssessment?.estimatedTransitMinutes || 30,
          recommendedCorridor: scheduleResult.trafficAssessment?.recommendedCorridor,
          efficiencyScore: scheduleResult.efficiencyScore || 95,
          scheduleRationale: scheduleResult.scheduleRationale,
          appliedAt: now,
        },
      });

      setSelectedItemId(createdTask.id);
      setSelectedItemType('AGENDA');
      setIsApplied(true);
      setAppliedMessage(`تم حفظ الطلب واعتماد جدولته الذكية وإسناده للكابتن (${courier.name}) بنجاح!`);
    }
  };

  // Run Batch AI Dispatch for all pending shipments & requests
  const handleRunBatchDispatch = async () => {
    setIsBatchRunning(true);
    const queue = [...pendingShipments.slice(0, 5)];
    const generatedBatch: Array<any> = [];

    for (const shp of queue) {
      try {
        const res = await fetch('/api/ai/smart-scheduling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderData: {
              trackingOrId: shp.trackingNumber,
              titleOrClient: `${shp.merchantName} ➔ ${shp.recipientName}`,
              city: shp.city,
              district: shp.district,
              address: shp.address,
              orderType: shp.orderType || 'STANDARD',
              urgency: 'SAME_DAY',
              targetDate: new Date().toISOString().slice(0, 10),
            },
            couriers: couriers.map((c) => ({
              id: c.id,
              name: c.name,
              assignedZone: c.assignedZone,
              vehicleType: c.vehicleType,
              status: c.status,
            })),
          }),
        });
        const plan = await res.json();
        generatedBatch.push({
          trackingNumber: shp.trackingNumber,
          recipientName: shp.recipientName,
          district: shp.district,
          plan,
        });

        // Auto apply
        if (plan.recommendedCourier) {
          updateShipmentSchedule(shp.trackingNumber, {
            assignedCourierId: plan.recommendedCourier.id,
            assignedCourierName: plan.recommendedCourier.name,
            scheduledPickupDate: new Date().toISOString().slice(0, 10),
            scheduledDeliveryWindow: plan.optimalDeliveryWindow,
            trafficNotes: plan.trafficAssessment?.recommendedCorridor,
          });
        }
      } catch (err) {
        console.warn('Batch dispatch item failed', err);
      }
    }

    setBatchResults(generatedBatch);
    setIsBatchRunning(false);
    setShowBatchModal(true);
  };

  const currentHour = new Date().getHours();
  const isMorningPeak = currentHour >= 8 && currentHour <= 10;
  const isAfternoonPeak = currentHour >= 14 && currentHour <= 17;
  const isTrafficPeak = isMorningPeak || isAfternoonPeak;

  return (
    <div className={`space-y-5 ${isEmbedded ? '' : 'p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xl max-w-5xl mx-auto'}`}>
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-900/50 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shrink-0">
              <Zap className="w-6 h-6 text-slate-950 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg">محرّك الجدولة الذكية للطلبات وحركة المرور</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Gemini AI Traffic Optimizer
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                اقتراح أفضل أوقات الاستلام من التجار ومواعيد التسليم للعملاء بالذكاء الاصطناعي مع تفادي ساعات الذروة ومطابقة المناديب المتاحين.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Batch Scheduling Action */}
            <button
              onClick={handleRunBatchDispatch}
              disabled={isBatchRunning || pendingShipments.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="جدولة مجمعة للشحنات المعلقة بالكامل"
            >
              {isBatchRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري الجدولة المجمعة...</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>جدولة ذكية مجمعة ({pendingShipments.length})</span>
                </>
              )}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Traffic Radar & Egyptian Roads Heatmap Bar */}
      <div className="bg-gradient-to-l from-amber-500/10 via-slate-50 to-emerald-500/10 border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isTrafficPeak ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800">رادار حركة المرور الحية (شوارع ومحاور العاصمة والمحافظات):</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isTrafficPeak
                    ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isTrafficPeak ? '🔴 ساعات ذروة وكثافات متوقعة' : '🟢 سيولة مرورية ومحاور سالكة'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {isMorningPeak && 'ذروة الصباح (08:00 - 10:30 ص): كثافات على كوبري 6 أكتوبر ومحور 26 يوليو وصلاح سالم. يُفضل تأخير الاستلام إلى 10:30 ص.'}
                {isAfternoonPeak && 'ذروة الظهيرة (02:30 - 05:30 م): خروج المدارس والموظفين وميادين مدينة نصر والمعادي والمهندسين. يُوصى بالاعتماد على الدراجات النارية أو محاور شينزو آبي.'}
                {!isTrafficPeak && 'فترة الهدوء والسيولة المفتوحة: نافذة مثالية للاستلامات وشحن البضائع وتسليم العملاء بمعدل إنجاز 98% وبدون استهلاك زائد للوقود.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 overflow-x-auto text-[11px]">
            <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2 shadow-xs">
              <span className="text-slate-500">المناديب المتاحين الآن:</span>
              <strong className="text-emerald-700 font-mono text-xs">{couriers.filter(c => c.status !== 'SUSPENDED').length} كباتن</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2 shadow-xs">
              <span className="text-slate-500">الدراجات النارية:</span>
              <strong className="text-purple-700 font-mono text-xs">{couriers.filter(c => c.vehicleType === 'MOTORCYCLE').length} سريعة</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Order Selector & Input Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {/* Source Item Type Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                اختر مصدر الطلب أو المهمة المراد جدولتها:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setSelectedItemType('AGENDA'); setSelectedItemId(pendingAgendaTasks[0]?.id || ''); }}
                  className={`py-1.5 px-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedItemType === 'AGENDA' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  مهام الأجندة ({pendingAgendaTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedItemType('SHIPMENT'); setSelectedItemId(pendingShipments[0]?.trackingNumber || ''); }}
                  className={`py-1.5 px-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedItemType === 'SHIPMENT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  الشحنات المعلقة ({pendingShipments.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedItemType('CUSTOM'); setSelectedItemId(''); }}
                  className={`py-1.5 px-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedItemType === 'CUSTOM' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  طلب حر يدوي
                </button>
              </div>
            </div>

            {/* Quick Select from Agenda */}
            {selectedItemType === 'AGENDA' && pendingAgendaTasks.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اختر من مهام الأجندة المعلقة:
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {pendingAgendaTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.clientName}) - {t.priority === 'high' ? 'أولوية عالية' : 'عادية'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Select from Shipments */}
            {selectedItemType === 'SHIPMENT' && pendingShipments.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اختر شحنة في انتظار التوجيه والاستلام:
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {pendingShipments.map((s) => (
                    <option key={s.id} value={s.trackingNumber}>
                      {s.trackingNumber} - {s.merchantName} ➔ {s.recipientName} ({s.city} - {s.district})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form Fields: Details */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اسم العميل أو التاجر:
                </label>
                <input
                  type="text"
                  value={formData.titleOrClient}
                  onChange={(e) => setFormData({ ...formData, titleOrClient: e.target.value })}
                  placeholder="مثال: متجر شياكة ستور / أحمد فؤاد"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    المحافظة / المدينة:
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="القليوبية">القليوبية</option>
                    <option value="الدقهلية">الدقهلية (المنصورة)</option>
                    <option value="الغربية">الغربية (طنطا)</option>
                    <option value="الشرقية">الشرقية (الزقازيق)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    الحي / النطاق:
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="مثال: مدينة نصر، المعادي، الدقي"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  العنوان التفصيلي ونقاط الدلالة:
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="اسم الشارع ورقم العقار أو المعلم القريب"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    درجة الاستعجال:
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="SAME_DAY">توصيل نفس اليوم (معتاد)</option>
                    <option value="URGENT">شحنة عاجلة فورية (Express)</option>
                    <option value="NEXT_DAY">خلال 24-48 ساعة (Next-Day)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    الفترة المفضلة:
                  </label>
                  <select
                    value={formData.preferredTimeframe}
                    onChange={(e) => setFormData({ ...formData, preferredTimeframe: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="ANY">أي وقت يناسب سيولة المرور</option>
                    <option value="MORNING">صباحاً (قبل الظهر)</option>
                    <option value="AFTERNOON">ظهراً (بعد 12:00 م)</option>
                    <option value="EVENING">مساءً (بعد 05:00 م)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Launch AI Button */}
            <button
              type="button"
              onClick={handleRunAiScheduling}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري تحليل المرور ومطابقة المناديب بالذكاء الاصطناعي...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
                  <span>اقتراح أفضل أوقات الاستلام والتوصيل (Gemini AI)</span>
                </>
              )}
            </button>

            {analysisError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{analysisError}</span>
              </div>
            )}
          </div>

          {/* Available Couriers Roster Mini-Tray */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                أسطول الكباتن الجغرافي ({couriers.length})
              </span>
              <span className="text-[11px] text-slate-400">حالة التواجد والمركبة</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none pr-1">
              {couriers.map((c) => {
                const isMotorcycle = c.vehicleType === 'MOTORCYCLE';
                const isVan = c.vehicleType === 'VAN';
                const activeDeliveries = shipments.filter(
                  (s) => s.assignedCourierId === c.id && s.status === 'OUT_FOR_DELIVERY'
                ).length;

                const isRecommended = scheduleResult?.recommendedCourier?.id === c.id;

                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                      isRecommended
                        ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-400'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {isMotorcycle ? (
                          <Bike className="w-4 h-4 text-purple-700" />
                        ) : isVan ? (
                          <Truck className="w-4 h-4 text-blue-700" />
                        ) : (
                          <Car className="w-4 h-4 text-slate-700" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{c.name}</span>
                          {isRecommended && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-600 text-white font-bold">
                              مرشح AI
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{c.assignedZone}</div>
                      </div>
                    </div>

                    <div className="text-left text-[11px] shrink-0 font-mono">
                      <span className="text-slate-600">{activeDeliveries} مهام جارية</span>
                      <span className="block text-[10px] text-emerald-600 font-bold">⭐ {c.rating}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Smart Schedule Results & Dispatch Action (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {scheduleResult ? (
            <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-5 sm:p-6 space-y-5 animate-in fade-in duration-300">
              {/* Result Header Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      مقترح الجدولة الذكية المعتمد من الذكاء الاصطناعي
                    </h4>
                    <p className="text-xs text-slate-500">
                      محسوب بناءً على سيولة المحاور وساعات الذروة في {formData.district}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black font-mono">
                    الكفاءة: {scheduleResult.efficiencyScore || 94}%
                  </div>
                </div>
              </div>

              {/* Time Windows Grid: Pickup vs Delivery vs Alternative */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Optimal Pickup Window */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 p-4 rounded-xl border border-amber-200 relative overflow-hidden">
                  <div className="flex items-center justify-between text-amber-900 mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-amber-600" />
                      أفضل وقت للاستلام من المتجر:
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                      Pickup Window
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-1">
                    {scheduleResult.optimalPickupWindow}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>تجهيز الطرد وتفادي ازدحام الصباح الباكر</span>
                  </div>
                </div>

                {/* 2. Optimal Delivery Window */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 p-4 rounded-xl border border-emerald-200 relative overflow-hidden">
                  <div className="flex items-center justify-between text-emerald-900 mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-emerald-600" />
                      أفضل وقت للتسليم للعميل:
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      Delivery Window
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-1">
                    {scheduleResult.optimalDeliveryWindow}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>تسليم سريع قبل ذروة الظهيرة والانصراف</span>
                  </div>
                </div>
              </div>

              {/* Alternative Window */}
              {scheduleResult.alternativeDeliveryWindow && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    نافذة بديلة مسائية (في حال رغبة العميل):
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    {scheduleResult.alternativeDeliveryWindow}
                  </span>
                </div>
              )}

              {/* Recommended Courier Card */}
              {scheduleResult.recommendedCourier && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      المندوب الأنسب للطلب بناءً على النطاق والمركبة:
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold font-mono">
                      توافق {scheduleResult.recommendedCourier.matchScore || 95}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white border border-indigo-200 flex items-center justify-center shadow-xs">
                        {scheduleResult.recommendedCourier.vehicleType === 'MOTORCYCLE' ? (
                          <Bike className="w-5 h-5 text-purple-700" />
                        ) : (
                          <Truck className="w-5 h-5 text-blue-700" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          الكابتن: {scheduleResult.recommendedCourier.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {scheduleResult.recommendedCourier.assignedZone || `${formData.city} - ${formData.district}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-left text-xs text-slate-600">
                      <span className="text-[11px] block text-slate-400">وسيلة النقل</span>
                      <strong className="text-indigo-950">
                        {scheduleResult.recommendedCourier.vehicleType === 'MOTORCYCLE' ? 'دراجة نارية (تفادي الزحام)' : 'فان سريعة'}
                      </strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-lg border border-indigo-100 leading-relaxed mt-2">
                    💡 <strong>سبب الاختيار:</strong> {scheduleResult.recommendedCourier.selectionReason}
                  </p>
                </div>
              )}

              {/* Traffic Analysis & Route Advice */}
              {scheduleResult.trafficAssessment && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-amber-600" />
                      تقييم حركة المرور ومحور السير المقترح:
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      وفر متوقع: {scheduleResult.trafficAssessment.timeSavedMinutes || 25} دقيقة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">المسار / المحور الموصى به:</span>
                      <strong className="text-slate-900">
                        {scheduleResult.trafficAssessment.recommendedCorridor || 'المحاور السريعة المباشرة'}
                      </strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">تحذير ساعات الذروة:</span>
                      <span className="text-rose-700 font-medium">
                        {scheduleResult.trafficAssessment.peakHoursWarning || 'تجنب ساعات الذروة المسائية'}
                      </span>
                    </div>
                  </div>

                  {scheduleResult.scheduleRationale && (
                    <div className="text-[11px] text-slate-600 pt-1 leading-relaxed">
                      {scheduleResult.scheduleRationale}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons: Apply & Dispatch */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  {isApplied ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {appliedMessage || 'تم اعتماد وتطبيق الجدولة الذكية بنجاح!'}
                    </span>
                  ) : (
                    <span>الضغط على الاعتماد سيقوم بإسناد المندوب وتثبيت المواعيد وإشعار الأطراف.</span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleRunAiScheduling}
                    disabled={isAnalyzing}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة التحليل</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplySchedule}
                    disabled={isApplied}
                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      isApplied
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        <span>تم التطبيق في المنظومة</span>
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="w-4 h-4 text-amber-400" />
                        <span>اعتماد الجدولة وإسناد الطلب للمندوب</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State / How AI Scheduling Works */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">بانتظار تشغيل التحليل الذكي للطلب</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  قم باختيار المهمة أو الشحنة المعلقة من القائمة الجانبية واضغط على "اقتراح أفضل أوقات الاستلام والتوصيل" لتحليل ساعات الذروة وكثافات المرور واقتراح المندوب الأقرب فورياً.
                </p>
              </div>

              {/* 3 Step Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-right">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center mb-1">1</div>
                  <h5 className="font-bold text-slate-900 text-xs">قراءة معطيات المرور</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">تفادي كوبري أكتوبر ومحور 26 يوليو في فترات الذروة الصباحية والمسائية.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center mb-1">2</div>
                  <h5 className="font-bold text-slate-900 text-xs">مطابقة المناديب</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">اختيار الكابتن الأقرب بنوع المركبة الملائم (دراجة نارية أو سيارة).</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center mb-1">3</div>
                  <h5 className="font-bold text-slate-900 text-xs">اعتماد فوري بنقرة</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">تحديث البوليصة والأجندة وتثبيت الموعد الموصى به للمستلم.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Results Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">نتائج الجدولة الذكية المجمعة</h3>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>تم إسناد وجدولة {batchResults.length} شحنات بنجاح وفق خطة التفويج وتفادي ساعات الذروة!</span>
              </div>

              <div className="space-y-2">
                {batchResults.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-500" />
                        <span>{item.trackingNumber}</span>
                        <span className="text-slate-500">({item.district})</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        الاستلام: {item.plan?.optimalPickupWindow} ➔ التسليم: {item.plan?.optimalDeliveryWindow}
                      </div>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                        كابتن: {item.plan?.recommendedCourier?.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-left">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                إغلاق والعودة للأجندة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
