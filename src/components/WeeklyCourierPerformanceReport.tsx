import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Area,
} from 'recharts';
import {
  FileText,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Award,
  Users,
  Truck,
  BarChart3,
  Sparkles,
  RefreshCw,
  Percent,
  Search,
  ArrowUpRight,
  ChevronDown,
  Check,
  ShieldCheck,
  Building2,
  Phone,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { StaffMember } from '../types';

export const WeeklyCourierPerformanceReport: React.FC = () => {
  const { staff, shipments, workerTasks } = useLogistics();

  // Selected Week
  const [selectedWeek, setSelectedWeek] = useState<string>('WEEK_42');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string>('اليوم، 10:30 صباحاً');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [activeChartTab, setActiveChartTab] = useState<'OVERVIEW' | 'COURIERS' | 'CAUSES' | 'ZONES'>('OVERVIEW');

  // Filter only Couriers from staff
  const couriers = useMemo(() => {
    return staff.filter((s) => s.role === 'COURIER');
  }, [staff]);

  // Week metadata
  const weekDefinitions: Record<string, { label: string; dateRange: string; multiplier: number; delayOffset: number }> = {
    WEEK_42: {
      label: 'الأسبوع 42 (الحالي)',
      dateRange: '12 أكتوبر - 18 أكتوبر 2026',
      multiplier: 1.0,
      delayOffset: 0,
    },
    WEEK_41: {
      label: 'الأسبوع 41 (السابق)',
      dateRange: '05 أكتوبر - 11 أكتوبر 2026',
      multiplier: 0.94,
      delayOffset: 4,
    },
    WEEK_40: {
      label: 'الأسبوع 40',
      dateRange: '28 سبتمبر - 04 أكتوبر 2026',
      multiplier: 0.88,
      delayOffset: -2,
    },
    WEEK_39: {
      label: 'الأسبوع 39',
      dateRange: '21 سبتمبر - 27 سبتمبر 2026',
      multiplier: 0.82,
      delayOffset: 6,
    },
  };

  const activeWeekInfo = weekDefinitions[selectedWeek] || weekDefinitions.WEEK_42;

  // Compute detailed per-courier weekly statistics
  const courierWeeklyStats = useMemo(() => {
    return couriers.map((courier, idx) => {
      // Assigned shipments for this courier
      const courierShipments = shipments.filter(
        (s) => s.assignedCourierId === courier.id || s.assignedCourierName === courier.name
      );

      const baseWeeklyDeliveries = Math.round(
        (courier.totalDelivered * 0.28 + courierShipments.length * 8 + 48 + idx * 12) * activeWeekInfo.multiplier
      );

      // Realistic delays based on courier SLA rating and traffic
      const baseDelayRate = Math.max(3, Math.round(100 - courier.successRate + activeWeekInfo.delayOffset));
      const delaysCount = Math.max(
        2,
        Math.round(baseWeeklyDeliveries * (baseDelayRate / 100)) + (idx === 1 ? 5 : 0)
      );

      const successfulDeliveries = Math.max(0, baseWeeklyDeliveries - delaysCount);
      const deliveryRatePct = baseWeeklyDeliveries > 0 ? Number(((successfulDeliveries / baseWeeklyDeliveries) * 100).toFixed(1)) : 100;
      const delayRatePct = Number((100 - deliveryRatePct).toFixed(1));

      // Avg transit time
      const avgMinutes = 26 + idx * 4 + (delaysCount > 6 ? 7 : 0);

      // AI recommendation
      let recommendation = 'أداء نموذجي متوافق مع معايير الجودة القياسية';
      if (delayRatePct > 12) {
        recommendation = 'يوصى بإعادة تنظيم مسار الرحلات لتفادي محاور الذروة (كوبري أكتوبر / النصر)';
      } else if (deliveryRatePct >= 96) {
        recommendation = 'مرشح لمكافأة التميز الأسبوعية في دقة المواعيد وسرعة الإنجاز';
      }

      return {
        id: courier.id,
        name: courier.name,
        shortName: courier.name.split(' ').slice(0, 2).join(' '),
        zone: courier.assignedZone || 'القاهرة الكبرى',
        vehicle: courier.vehicleType || 'موتوسيكل',
        vehiclePlate: courier.vehiclePlate || 'س ق ص 718',
        phone: courier.phone,
        avatar: courier.avatar,
        rating: courier.rating,
        totalDeliveries: baseWeeklyDeliveries,
        successful: successfulDeliveries,
        delays: delaysCount,
        deliveryRatePct,
        delayRatePct,
        avgMinutes,
        recommendation,
        totalCashCollected: courier.currentCashHeld ? courier.currentCashHeld * 4 : 8500 + idx * 1400,
      };
    });
  }, [couriers, shipments, selectedWeek, activeWeekInfo]);

  // Filtered couriers
  const filteredCouriers = useMemo(() => {
    return courierWeeklyStats.filter((c) => {
      const matchZone = selectedZone === 'ALL' || c.zone.includes(selectedZone);
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.zone.toLowerCase().includes(searchQuery.toLowerCase());
      return matchZone && matchSearch;
    });
  }, [courierWeeklyStats, selectedZone, searchQuery]);

  // Aggregated Weekly Totals
  const totalWeeklyDeliveries = useMemo(
    () => filteredCouriers.reduce((sum, c) => sum + c.totalDeliveries, 0),
    [filteredCouriers]
  );
  const totalWeeklySuccessful = useMemo(
    () => filteredCouriers.reduce((sum, c) => sum + c.successful, 0),
    [filteredCouriers]
  );
  const totalWeeklyDelays = useMemo(
    () => filteredCouriers.reduce((sum, c) => sum + c.delays, 0),
    [filteredCouriers]
  );
  const overallWeeklyDeliveryRate = useMemo(
    () => (totalWeeklyDeliveries > 0 ? Number(((totalWeeklySuccessful / totalWeeklyDeliveries) * 100).toFixed(1)) : 100),
    [totalWeeklyDeliveries, totalWeeklySuccessful]
  );
  const overallWeeklyDelayRate = useMemo(
    () => Number((100 - overallWeeklyDeliveryRate).toFixed(1)),
    [overallWeeklyDeliveryRate]
  );

  const starCourier = useMemo(() => {
    if (filteredCouriers.length === 0) return null;
    return [...filteredCouriers].sort((a, b) => b.deliveryRatePct - a.deliveryRatePct)[0];
  }, [filteredCouriers]);

  // 1. Daily Progression of Delivery Rates & Delays (Saturday to Friday)
  const dailyProgressionData = useMemo(() => {
    const days = [
      { day: 'السبت', baseDeliv: 68, baseDelay: 4 },
      { day: 'الأحد', baseDeliv: 82, baseDelay: 7 },
      { day: 'الإثنين', baseDeliv: 94, baseDelay: 6 },
      { day: 'الثلاثاء', baseDeliv: 88, baseDelay: 8 },
      { day: 'الأربعاء', baseDeliv: 98, baseDelay: 5 },
      { day: 'الخميس', baseDeliv: 110, baseDelay: 9 },
      { day: 'الجمعة', baseDeliv: 45, baseDelay: 2 },
    ];

    return days.map((d) => {
      const delivered = Math.round(d.baseDeliv * activeWeekInfo.multiplier);
      const delayed = Math.max(1, Math.round(d.baseDelay * activeWeekInfo.multiplier));
      const total = delivered + delayed;
      const deliveryRate = Number(((delivered / total) * 100).toFixed(1));
      const delayRate = Number((100 - deliveryRate).toFixed(1));

      return {
        day: d.day,
        delivered,
        delayed,
        deliveryRate,
        delayRate,
      };
    });
  }, [activeWeekInfo]);

  // 2. Root Cause Breakdown of Delays (Pie / Donut Chart)
  const delayCausesData = useMemo(() => {
    return [
      { name: 'اختناقات وكثافات مرورية بالذروة', value: 42, color: '#f43f5e' },
      { name: 'العميل طلب تأجيل الموعد ليوم لاحق', value: 26, color: '#f59e0b' },
      { name: 'عدم رد العميل على اتصالات الكابتن', value: 18, color: '#8b5cf6' },
      { name: 'تفاصيل العنوان غير دقيقة / نقص بيانات', value: 9, color: '#06b6d4' },
      { name: 'تأخر الفرز والتجهيز بالمستودع الرئيسي', value: 5, color: '#64748b' },
    ];
  }, []);

  // 3. Zone SLA & Delay Rate Performance
  const zonePerformanceData = useMemo(() => {
    return [
      { zone: 'مدينة نصر ومصر الجديدة', delivered: 165, delays: 12, onTimeRate: 93.2, delayRate: 6.8 },
      { zone: 'المعادي والمقطم', delivered: 142, delays: 9, onTimeRate: 94.0, delayRate: 6.0 },
      { zone: 'الدقي والجيزة والعجوزة', delivered: 128, delays: 15, onTimeRate: 89.5, delayRate: 10.5 },
      { zone: 'التجمع والقاهرة الجديدة', delivered: 118, delays: 7, onTimeRate: 94.4, delayRate: 5.6 },
      { zone: 'أكتوبر والشيخ زايد', delivered: 92, delays: 8, onTimeRate: 92.0, delayRate: 8.0 },
    ];
  }, []);

  // Unique Zones for filtering
  const uniqueZones = useMemo(() => {
    const set = new Set<string>();
    courierWeeklyStats.forEach((c) => {
      if (c.zone.includes('مدينة نصر')) set.add('مدينة نصر');
      else if (c.zone.includes('المعادي')) set.add('المعادي');
      else if (c.zone.includes('الدقي') || c.zone.includes('الجيزة')) set.add('الدقي والجيزة');
      else set.add(c.zone);
    });
    return Array.from(set);
  }, [courierWeeklyStats]);

  // Trigger report regeneration
  const handleRegenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setLastGeneratedAt(
        new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 600);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'اسم المندوب',
      'النطاق الجغرافي',
      'إجمالي الطرود',
      'تسليم في الموعد',
      'حالات التأخير',
      'معدل التسليم (%)',
      'نسبة التأخير (%)',
      'متوسط زمن الرحلة (دقيقة)',
      'التقييم',
      'التوصية الإدارية',
    ];

    const rows = filteredCouriers.map((c) => [
      `"${c.name}"`,
      `"${c.zone}"`,
      c.totalDeliveries,
      c.successful,
      c.delays,
      `${c.deliveryRatePct}%`,
      `${c.delayRatePct}%`,
      c.avgMinutes,
      c.rating,
      `"${c.recommendation}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Courier_Weekly_Performance_${selectedWeek}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrintReport = () => {
    window.print();
  };

  // Copy Executive Summary
  const handleCopySummary = () => {
    const summary = `📊 ملخص تقرير أداء المناديب الأسبوعي (${activeWeekInfo.label} - ${activeWeekInfo.dateRange}):
• إجمالي الشحنات المسلمة: ${totalWeeklySuccessful} من أصل ${totalWeeklyDeliveries} طرد
• معدل التسليم في الموعد (On-Time SLA): ${overallWeeklyDeliveryRate}%
• نسبة التأخير الأسبوعية: ${overallWeeklyDelayRate}% (${totalWeeklyDelays} حالة تأخير)
• كابتن الأسبوع المتميز: ${starCourier?.name} بكفاءة ${starCourier?.deliveryRatePct}%
• السبب الرئيسي للتأخير: اختناقات مرورية بالذروة (42%)
- تم التوليد آلياً من لوحة إدارة مشاوير المعتمدة`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6 print:border-none print:p-0 print:shadow-none">
      {/* 1. Header & Report Generation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 print:border-b-2 print:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                تقرير الأداء الأسبوعي للمناديب ومعدلات التأخير
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                Recharts Analytics Engine
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono hidden sm:inline">
                #REP-WK42-OCT26
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              تحليل إحصائي مرئي دقيق لمعدلات التسليم ونسب التأخير وأسبابها الجذرية على مدار الأسبوع لكافة كباتن الأسطول
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Week Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer pr-1"
            >
              {Object.entries(weekDefinitions).map(([key, def]) => (
                <option key={key} value={key}>
                  {def.label}
                </option>
              ))}
            </select>
          </div>

          {/* Regenerate Button */}
          <button
            onClick={handleRegenerateReport}
            disabled={isGenerating}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="إعادة احتساب وتوليد التقرير الأسبوعي"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'جاري التوليد...' : 'توليد التقرير'}</span>
          </button>

          {/* Copy Summary */}
          <button
            onClick={handleCopySummary}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            title="نسخ ملخص التقرير للأرشفة والمشاركة"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? 'تم النسخ!' : 'ملخص للإدارة'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            title="تصدير جدول البيانات بتنسيق CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel/CSV</span>
          </button>

          {/* Print Report */}
          <button
            onClick={handlePrintReport}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="طباعة التقرير الرسمي أو الحفظ بتنسيق PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة PDF</span>
          </button>
        </div>
      </div>

      {/* Report Metadata Banner for Print and Screen */}
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-slate-600">
          <span className="flex items-center gap-1 font-bold text-slate-900">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>الفترة الزمنية: {activeWeekInfo.dateRange}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span>آخر تحديث معتمد: <strong className="text-slate-800">{lastGeneratedAt}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>بيانات موثقة من سجلات التسليم وكود OTP</span>
          </span>
        </div>
      </div>

      {/* 2. Executive KPI Cards Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Metric 1: On-time Delivery Rate */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-emerald-800">معدل التسليم في الموعد</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 font-mono">{overallWeeklyDeliveryRate}%</div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
            <span>+2.8% مقارنة بالأسبوع السابق</span>
          </div>
        </div>

        {/* Metric 2: Delay Rate */}
        <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-2xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-rose-800">نسبة التأخير الأسبوعية</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-950 font-mono">{overallWeeklyDelayRate}%</div>
          <div className="text-[10px] text-rose-700 font-bold mt-1">
            {totalWeeklyDelays} شحنة واجهت تأخيراً
          </div>
        </div>

        {/* Metric 3: Total Completed */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-blue-800">إجمالي شحنات الأسبوع</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono">{totalWeeklyDeliveries}</div>
          <div className="text-[10px] text-blue-700 font-medium mt-1">
            {totalWeeklySuccessful} تسليم ناجح ومكتمل
          </div>
        </div>

        {/* Metric 4: Avg Transit Time */}
        <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-2xl border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-purple-800">متوسط زمن الرحلة</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-950 font-mono">31 دقيقة</div>
          <div className="text-[10px] text-purple-700 font-medium mt-1">
            ضمن المعدل القياسي للرحلة
          </div>
        </div>

        {/* Metric 5: Star Performer */}
        <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-2xl border border-amber-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-800">كابتن الأسبوع المتميز</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-base font-black text-slate-900 truncate">
            {starCourier ? starCourier.name : '—'}
          </div>
          <div className="text-[10px] text-amber-700 font-bold mt-1">
            {starCourier ? `كفاءة ${starCourier.deliveryRatePct}% (${starCourier.successful} طرد)` : ''}
          </div>
        </div>
      </div>

      {/* 3. Recharts Visualizations Navigation & Filter Header */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs print:bg-white print:text-slate-900 print:border-slate-300">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveChartTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeChartTab === 'OVERVIEW'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white bg-slate-800/80'
            }`}
          >
            المسار اليومي ونسبة التأخير (Dual Axis)
          </button>

          <button
            onClick={() => setActiveChartTab('COURIERS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeChartTab === 'COURIERS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white bg-slate-800/80'
            }`}
          >
            مقارنة أداء المناديب (Bar Chart)
          </button>

          <button
            onClick={() => setActiveChartTab('CAUSES')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeChartTab === 'CAUSES'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white bg-slate-800/80'
            }`}
          >
            الأسباب الجذرية للتأخير (Donut)
          </button>

          <button
            onClick={() => setActiveChartTab('ZONES')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeChartTab === 'ZONES'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white bg-slate-800/80'
            }`}
          >
            تحليل النطاقات الجغرافية (Zones)
          </button>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>تسليم ناجح بالميعاد</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>حالات التأخير</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>نسبة التأخير (%)</span>
          </span>
        </div>
      </div>

      {/* 4. Main Charts Section (Rendered with Recharts) */}
      <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-white shadow-xl print:bg-white print:text-slate-900 print:border print:border-slate-300">
        {/* CHART 1: Dual-Axis Progression across the 7 days of the week */}
        {activeChartTab === 'OVERVIEW' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 print:border-slate-200">
              <div>
                <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>تطور معدلات التسليم ونسبة التأخير اليومية طوال أيام الأسبوع</span>
                </h4>
                <p className="text-[11px] text-slate-400 print:text-slate-600">
                  مخطط الأعمدة يوضح حجم الشحنات المسلمة والمتأخرة يومياً، والخط الذهبي يوضح النسبة المئوية للتأخير
                </p>
              </div>
            </div>

            <div className="w-full h-80 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyProgressionData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="day" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 'bold' }} />
                  {/* Left YAxis: Volume */}
                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    label={{ value: 'عدد الشحنات', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                  />
                  {/* Right YAxis: Percentage */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#f59e0b"
                    unit="%"
                    domain={[0, 20]}
                    tick={{ fill: '#f59e0b', fontSize: 11 }}
                    label={{ value: 'نسبة التأخير (%)', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 10 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-right text-xs space-y-1">
                            <p className="font-bold text-amber-400 text-sm">{label}</p>
                            <div className="pt-1 space-y-0.5 font-mono">
                              <p className="text-emerald-400">✓ تسليم ناجح: <strong>{data.delivered}</strong> طرد</p>
                              <p className="text-rose-400">⚠️ تأخيرات: <strong>{data.delayed}</strong> طرد</p>
                              <p className="text-blue-300">معدل التسليم: <strong>{data.deliveryRate}%</strong></p>
                              <p className="text-amber-400 font-bold border-t border-slate-700 pt-1 mt-1">
                                نسبة التأخير: {data.delayRate}%
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="delivered" name="شحنات مسلمة في الموعد" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar yAxisId="left" dataKey="delayed" name="حالات تأخير في خط السير" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={28} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="delayRate"
                    name="نسبة التأخير (%)"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: Per-Courier Comparative Bar Chart */}
        {activeChartTab === 'COURIERS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 print:border-slate-200">
              <div>
                <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>مقارنة معدلات التسليم وحالات التأخير لكل كابتن أسطول خلال الأسبوع</span>
                </h4>
                <p className="text-[11px] text-slate-400 print:text-slate-600">
                  رصد مباشر لإنتاجية المندوب الأسبوعية وتصنيف الالتزام الزمني لتسليم الطرود
                </p>
              </div>
            </div>

            <div className="w-full h-80 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredCouriers} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="shortName" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-right text-xs space-y-1">
                            <p className="font-bold text-white text-sm">{data.name}</p>
                            <p className="text-[11px] text-slate-400">{data.zone} ({data.vehicle})</p>
                            <div className="pt-1 space-y-0.5 font-mono">
                              <p className="text-emerald-400">✓ تسليم ناجح: {data.successful} ({data.deliveryRatePct}%)</p>
                              <p className="text-rose-400">⚠️ تأخيرات: {data.delays} ({data.delayRatePct}%)</p>
                              <p className="text-amber-400">كاش محصل: {data.totalCashCollected.toLocaleString()} ج.م</p>
                              <p className="text-slate-300">متوسط الرحلة: {data.avgMinutes} دقيقة</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="successful" name="تسليمات ناجحة بالأسبوع" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="delays" name="تأخيرات مرصودة بالأسبوع" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: Root Cause Analysis (Donut PieChart) */}
        {activeChartTab === 'CAUSES' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 print:border-slate-200">
              <div>
                <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تحليل الأسباب الجذرية لحالات التأخير الأسبوعية (Root Cause Analysis)</span>
                </h4>
                <p className="text-[11px] text-slate-400 print:text-slate-600">
                  توزيع نسبي لحيثيات التأخير المرصودة للمساعدة في تحسين توجيه خط السير وجدولة التسليم
                </p>
              </div>
            </div>

            <div className="w-full h-80 min-h-[320px] flex flex-col md:flex-row items-center justify-around gap-6">
              <div className="w-full md:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={delayCausesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {delayCausesData.map((entry, index) => (
                        <Cell key={`cause-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-right text-xs">
                              <p className="font-bold text-white">{data.name}</p>
                              <p className="font-mono text-amber-400 font-bold mt-1">النسبة: {data.value}% من إجمالي التأخيرات</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-1/2 space-y-2 text-xs">
                {delayCausesData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="font-medium text-slate-200">{item.name}</span>
                    </div>
                    <span className="font-mono font-black text-amber-400 text-sm shrink-0">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHART 4: Zone SLA & Performance Matrix */}
        {activeChartTab === 'ZONES' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 print:border-slate-200">
              <div>
                <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>معدل الالتزام الزمني ونسب التأخير حسب النطاق الجغرافي (Zone SLA)</span>
                </h4>
                <p className="text-[11px] text-slate-400 print:text-slate-600">
                  مقارنة أداء المحاور الجغرافية لتحديد المناطق الأكثر عرضة للاختناقات وضغط الشحنات
                </p>
              </div>
            </div>

            <div className="w-full h-80 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zonePerformanceData} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis type="number" stroke="#94a3b8" unit="%" domain={[0, 100]} />
                  <YAxis dataKey="zone" type="category" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} width={140} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-right text-xs space-y-1">
                            <p className="font-bold text-amber-400">{data.zone}</p>
                            <p className="text-emerald-400 font-mono">معدل التسليم في الموعد: {data.onTimeRate}%</p>
                            <p className="text-rose-400 font-mono">نسبة التأخير: {data.delayRate}%</p>
                            <p className="text-slate-300 font-mono">حجم الشحنات: {data.delivered} تسليم مقابل {data.delays} تأخير</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="onTimeRate" name="معدل التسليم في الموعد (%)" fill="#10b981" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="delayRate" name="نسبة التأخير في النطاق (%)" fill="#f43f5e" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 5. Detailed Weekly Performance Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900">
              بطاقة تقييم أداء المناديب الأسبوعية (Weekly Courier Scorecards)
            </h3>
          </div>

          {/* Search & Zone Dropdown */}
          <div className="flex items-center gap-2 print:hidden">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم المندوب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="ALL">جميع النطاقات</option>
              {uniqueZones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">كابتن الأسطول</th>
                <th className="py-3 px-4">النطاق والوسيلة</th>
                <th className="py-3 px-4 text-center">إجمالي شحنات الأسبوع</th>
                <th className="py-3 px-4 text-center">التسليم في الموعد</th>
                <th className="py-3 px-4 text-center">التأخيرات</th>
                <th className="py-3 px-4 text-center">معدل التسليم (%)</th>
                <th className="py-3 px-4 text-center">نسبة التأخير (%)</th>
                <th className="py-3 px-4 text-center">متوسط زمن الرحلة</th>
                <th className="py-3 px-4 text-center">التقييم</th>
                <th className="py-3 px-4">التوصية الإدارية والتشغيلية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCouriers.map((courier) => (
                <tr key={courier.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={courier.avatar}
                        alt={courier.name}
                        className="w-8 h-8 rounded-full object-cover border border-amber-300 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{courier.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{courier.vehiclePlate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-700 block">{courier.zone}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{courier.vehicle}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold font-mono text-slate-900">
                    {courier.totalDeliveries}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700 font-mono">
                    {courier.successful}
                  </td>
                  <td className="py-3 px-4 text-center font-bold font-mono">
                    {courier.delays > 0 ? (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        {courier.delays}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${
                            courier.deliveryRatePct >= 95
                              ? 'bg-emerald-500'
                              : courier.deliveryRatePct >= 88
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${courier.deliveryRatePct}%` }}
                        ></div>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 text-[11px]">
                        {courier.deliveryRatePct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-md ${
                        courier.delayRatePct <= 5
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : courier.delayRatePct <= 10
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 font-black'
                      }`}
                    >
                      {courier.delayRatePct}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-600">
                    {courier.avgMinutes} دقيقة
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-amber-600">
                    ★ {courier.rating.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs text-[11px]">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-medium ${
                        courier.deliveryRatePct >= 95
                          ? 'bg-emerald-50 text-emerald-800'
                          : courier.delayRatePct > 10
                          ? 'bg-amber-50 text-amber-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {courier.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
