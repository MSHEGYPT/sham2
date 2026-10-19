import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Truck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Clock,
  Printer,
  ChevronDown,
  KeyRound,
  User,
  MapPin,
  Phone,
  Calendar,
  X,
  FileText,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Map as MapIcon,
  Table as TableIcon,
  Columns,
  Compass,
  Flame,
  BarChart3,
  Star,
  Award,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { Shipment, ShipmentStatus, DeliveryRating } from '../types';
import { ShipmentQrModal } from './ShipmentQrModal';
import { CourierFieldRoutesMap, getCourierStatusInfo } from './CourierFieldRoutesMap';
import { ReactLeafletShipmentsMap } from './ReactLeafletShipmentsMap';

export const ShipmentsManager: React.FC = () => {
  const {
    shipments,
    merchants,
    staff,
    addShipment,
    assignShipmentCourier,
    recordReturnOrPartial,
    setActiveAdminTab,
    deliveryRatings,
    getCourierRatingSummary,
  } = useLogistics();

  const [viewMode, setViewMode] = useState<'TABLE' | 'MAP' | 'HEATMAP' | 'SPLIT'>('TABLE');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle applying smart zone allocation to balance deliveries
  const handleApplySmartAllocation = (trackingNumbers: string[], courierId: string) => {
    trackingNumbers.forEach((tn) => {
      assignShipmentCourier(tn, courierId);
    });
  };

  // Advanced Filtering System (معلقة، قيد التوصيل، مكتملة، مرتجعات)
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'PENDING' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'RETURNS'>('ALL');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState<string>('ALL');
  const [selectedCourierFilter, setSelectedCourierFilter] = useState<string>('ALL');
  const [showSideAdminPanel, setShowSideAdminPanel] = useState<boolean>(true);

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [viewingRatingModal, setViewingRatingModal] = useState<DeliveryRating | null>(null);
  const [qrModalShipment, setQrModalShipment] = useState<Shipment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTargetShipment, setReturnTargetShipment] = useState<Shipment | null>(null);

  // Return modal state
  const [returnReason, setReturnReason] = useState('العميل غير متواجد وطلب إعادة الجدولة');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnType, setReturnType] = useState<'RETURN_PENDING' | 'PARTIAL_DELIVERY'>('RETURN_PENDING');
  const [partialAmount, setPartialAmount] = useState<number>(0);

  // Assign courier popover state
  const [assigningTracking, setAssigningTracking] = useState<string | null>(null);

  // New Shipment form state
  const [newOrder, setNewOrder] = useState({
    merchantId: merchants[0]?.id || 'MCH-101',
    recipientName: '',
    recipientPhone: '',
    recipientPhoneAlt: '',
    city: 'القاهرة',
    district: '',
    address: '',
    itemsDescription: '',
    itemQuantity: 1,
    codAmount: 350,
    shippingFee: 45,
    assignedCourierId: '',
    orderType: 'STANDARD' as 'STANDARD' | 'EXCHANGE' | 'RETURN',
    allowInspection: true,
    exchangeDetails: '',
  });

  const couriers = staff.filter((s) => s.role === 'COURIER' && s.status !== 'SUSPENDED');

  // Quick statistics calculated for the Side Admin Panel
  const categoryStats = useMemo(() => {
    const total = shipments.length;
    const pendingList = shipments.filter(
      (s) => s.status === 'PENDING_PICKUP' || s.status === 'RECEIVED_IN_HUB'
    );
    const outList = shipments.filter((s) => s.status === 'OUT_FOR_DELIVERY');
    const deliveredList = shipments.filter(
      (s) => s.status === 'DELIVERED' || s.status === 'PARTIAL_DELIVERY'
    );
    const returnsList = shipments.filter(
      (s) => s.status === 'RETURN_PENDING' || s.status === 'RETURNED_TO_MERCHANT'
    );

    const pendingCod = pendingList.reduce((sum, s) => sum + s.codAmount, 0);
    const outCod = outList.reduce((sum, s) => sum + s.codAmount, 0);
    const deliveredCod = deliveredList.reduce(
      (sum, s) => sum + (s.collectedAmount || s.codAmount),
      0
    );
    const returnsCod = returnsList.reduce((sum, s) => sum + s.codAmount, 0);

    const ratedList = deliveryRatings || [];
    const avgRating =
      ratedList.length > 0
        ? Number(
            (ratedList.reduce((sum, r) => sum + r.overallRating, 0) / ratedList.length).toFixed(1)
          )
        : 4.9;

    return {
      total,
      pending: {
        count: pendingList.length,
        pct: total > 0 ? Number(((pendingList.length / total) * 100).toFixed(1)) : 0,
        cod: pendingCod,
      },
      outForDelivery: {
        count: outList.length,
        pct: total > 0 ? Number(((outList.length / total) * 100).toFixed(1)) : 0,
        cod: outCod,
        activeCouriers: new Set(outList.map((s) => s.assignedCourierId).filter(Boolean)).size,
      },
      completed: {
        count: deliveredList.length,
        pct: total > 0 ? Number(((deliveredList.length / total) * 100).toFixed(1)) : 0,
        cod: deliveredCod,
        avgRating,
      },
      returns: {
        count: returnsList.length,
        pct: total > 0 ? Number(((returnsList.length / total) * 100).toFixed(1)) : 0,
        cod: returnsCod,
      },
    };
  }, [shipments, deliveryRatings]);

  // Unique cities list for filtering
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    shipments.forEach((s) => {
      if (s.city) set.add(s.city);
    });
    return Array.from(set);
  }, [shipments]);

  // Main filtered shipments list
  const filteredShipments = useMemo(() => {
    return shipments.filter((shp) => {
      // 1. Text Search query
      const matchesSearch =
        searchQuery === '' ||
        shp.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shp.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shp.recipientPhone.includes(searchQuery) ||
        shp.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shp.address.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Main Classification Category Filter
      if (selectedCategory === 'PENDING') {
        if (shp.status !== 'PENDING_PICKUP' && shp.status !== 'RECEIVED_IN_HUB') return false;
      } else if (selectedCategory === 'OUT_FOR_DELIVERY') {
        if (shp.status !== 'OUT_FOR_DELIVERY') return false;
      } else if (selectedCategory === 'COMPLETED') {
        if (shp.status !== 'DELIVERED' && shp.status !== 'PARTIAL_DELIVERY') return false;
      } else if (selectedCategory === 'RETURNS') {
        if (shp.status !== 'RETURN_PENDING' && shp.status !== 'RETURNED_TO_MERCHANT') return false;
      }

      // 3. City Filter
      if (selectedCityFilter !== 'ALL' && shp.city !== selectedCityFilter) {
        return false;
      }

      // 4. Merchant Filter
      if (selectedMerchantFilter !== 'ALL' && shp.merchantId !== selectedMerchantFilter) {
        return false;
      }

      // 5. Courier Filter
      if (
        selectedCourierFilter !== 'ALL' &&
        shp.assignedCourierId !== selectedCourierFilter &&
        shp.assignedCourierName !== selectedCourierFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    shipments,
    searchQuery,
    selectedCategory,
    selectedCityFilter,
    selectedMerchantFilter,
    selectedCourierFilter,
  ]);

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.recipientName || !newOrder.recipientPhone || !newOrder.address) return;

    const m = merchants.find((x) => x.id === newOrder.merchantId) || merchants[0];

    addShipment({
      merchantId: m.id,
      merchantName: m.brandName || m.name,
      merchantPhone: m.phone,
      recipientName: newOrder.recipientName,
      recipientPhone: newOrder.recipientPhone,
      recipientPhoneAlt: newOrder.recipientPhoneAlt,
      city: newOrder.city,
      district: newOrder.district || newOrder.city,
      address: newOrder.address,
      itemsDescription: newOrder.itemsDescription || 'طرد بضائع تجارية',
      itemQuantity: Number(newOrder.itemQuantity) || 1,
      codAmount: Number(newOrder.codAmount) || 0,
      shippingFee: Number(newOrder.shippingFee) || 45,
      assignedCourierId: newOrder.assignedCourierId || undefined,
      orderType: newOrder.orderType,
      allowInspection: newOrder.allowInspection,
      exchangeDetails: newOrder.exchangeDetails,
    });

    setIsAddModalOpen(false);
    setNewOrder({
      merchantId: merchants[0]?.id || 'MCH-101',
      recipientName: '',
      recipientPhone: '',
      recipientPhoneAlt: '',
      city: 'القاهرة',
      district: '',
      address: '',
      itemsDescription: '',
      itemQuantity: 1,
      codAmount: 350,
      shippingFee: 45,
      assignedCourierId: '',
      orderType: 'STANDARD',
      allowInspection: true,
      exchangeDetails: '',
    });
  };

  const handleConfirmReturn = () => {
    if (!returnTargetShipment) return;
    recordReturnOrPartial(
      returnTargetShipment.trackingNumber,
      returnType,
      returnReason,
      returnNotes,
      'إدارة المرتجعات بالعمليات',
      partialAmount
    );
    setIsReturnModalOpen(false);
    setReturnTargetShipment(null);
  };

  return (
    <div className="space-y-5">
      {/* Top View Mode Switcher: Table View vs Live Map vs Split */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('TABLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewMode === 'TABLE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-4 h-4 text-slate-600 shrink-0" />
            <span>جدول الشحنات</span>
          </button>

          <button
            onClick={() => setViewMode('MAP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewMode === 'MAP'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4 text-slate-950 shrink-0" />
            <span>خريطة التتبع المباشر (React-Leaflet)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
          </button>

          <button
            onClick={() => setViewMode('HEATMAP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewMode === 'HEATMAP'
                ? 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className={`w-4 h-4 shrink-0 ${viewMode === 'HEATMAP' ? 'text-amber-200 animate-pulse' : 'text-amber-500'}`} />
            <span>الخريطة الحرارية</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
          </button>

          <button
            onClick={() => setViewMode('SPLIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewMode === 'SPLIT'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-4 h-4 text-slate-300 shrink-0" />
            <span>عرض مدمج (خريطة + جدول)</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 px-2 shrink-0">
          <span className="flex items-center gap-1 font-bold text-slate-800">
            <Compass className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{couriers.length} مناديب ميدانيين</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-500">{filteredShipments.length} شحنة</span>
        </div>
      </div>

      {/* Real-time React-Leaflet Map Component (Displayed in MAP and SPLIT modes) */}
      {(viewMode === 'MAP' || viewMode === 'SPLIT') && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <ReactLeafletShipmentsMap
            staff={staff}
            shipments={shipments}
            onSelectShipment={(shp) => setSelectedShipment(shp)}
            onApplySmartAllocation={handleApplySmartAllocation}
          />
        </div>
      )}

      {/* Heatmap Mode */}
      {viewMode === 'HEATMAP' && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <CourierFieldRoutesMap
            key="view-heatmap-active"
            staff={staff}
            shipments={shipments}
            onSelectShipment={(shp) => setSelectedShipment(shp)}
            initialHeatmapActive={true}
            onApplySmartAllocation={handleApplySmartAllocation}
          />
        </div>
      )}

      {/* Advanced Filtering & Actions Header (Displayed in TABLE and SPLIT modes) */}
      {viewMode !== 'MAP' && viewMode !== 'HEATMAP' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          {/* Row 1: Advanced Category Classification Filter Tabs (معلقة، قيد التوصيل، مكتملة، مرتجعات) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 pl-1">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span>تصنيف الحالة:</span>
              </span>

              {/* All */}
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>جميع الشحنات</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {categoryStats.total}
                </span>
              </button>

              {/* Pending */}
              <button
                onClick={() => setSelectedCategory('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>معلقة (بانتظار الاستلام / بالمستودع)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  selectedCategory === 'PENDING' ? 'bg-slate-950 text-amber-400' : 'bg-amber-200/80 text-amber-900'
                }`}>
                  {categoryStats.pending.count}
                </span>
              </button>

              {/* Out for Delivery */}
              <button
                onClick={() => setSelectedCategory('OUT_FOR_DELIVERY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'OUT_FOR_DELIVERY'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>قيد التوصيل (مع المناديب)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  selectedCategory === 'OUT_FOR_DELIVERY' ? 'bg-white/25 text-white' : 'bg-blue-200/80 text-blue-900'
                }`}>
                  {categoryStats.outForDelivery.count}
                </span>
              </button>

              {/* Completed */}
              <button
                onClick={() => setSelectedCategory('COMPLETED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>مكتملة التسليم</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  selectedCategory === 'COMPLETED' ? 'bg-white/25 text-white' : 'bg-emerald-200/80 text-emerald-900'
                }`}>
                  {categoryStats.completed.count}
                </span>
              </button>

              {/* Returns */}
              <button
                onClick={() => setSelectedCategory('RETURNS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'RETURNS'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>المرتجعات والجزئي</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  selectedCategory === 'RETURNS' ? 'bg-white/25 text-white' : 'bg-rose-200/80 text-rose-900'
                }`}>
                  {categoryStats.returns.count}
                </span>
              </button>
            </div>

            {/* Side Admin Panel Toggle */}
            <button
              onClick={() => setShowSideAdminPanel(!showSideAdminPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showSideAdminPanel
                  ? 'bg-amber-500/15 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              title="إظهار / إخفاء الواجهة الإدارية الجانبية المخصصة للإحصائيات السريعة"
            >
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>الواجهة الإدارية الجانبية</span>
              {showSideAdminPanel ? (
                <Eye className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>

          {/* Row 2: Search, Secondary Dropdown Filters, Reports, and Add Button */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto flex-1">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث برقم البوليصة (SND-..)، العميل، أو التاجر..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* City Filter */}
              <select
                value={selectedCityFilter}
                onChange={(e) => setSelectedCityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="ALL">جميع المحافظات ({availableCities.length})</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              {/* Courier Filter */}
              <select
                value={selectedCourierFilter}
                onChange={(e) => setSelectedCourierFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="ALL">جميع المناديب ({couriers.length})</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    الكابتن {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
              <button
                onClick={() => setActiveAdminTab('COURIER_REPORTS')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-colors shrink-0 shadow-xs cursor-pointer"
                title="توليد تقارير الأداء الأسبوعية للمناديب ونسب التأخير (Recharts)"
              >
                <BarChart3 className="w-3.5 h-3.5 text-slate-950" />
                <span>تقارير أداء المناديب</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>تسجيل شحنة جديدة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Side Admin Panel + Shipments Table (TABLE and SPLIT modes) */}
      {viewMode !== 'MAP' && viewMode !== 'HEATMAP' && (
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Quick Statistics Side Admin Panel */}
        {showSideAdminPanel && (
          <aside className="w-full lg:w-80 shrink-0 space-y-3 animate-in fade-in slide-in-from-right-3">
            {/* Header */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900">الواجهة الإدارية الجانبية</h4>
                    <span className="text-[10px] text-slate-400">إحصائيات فورية لكل تصنيف</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  مباشر 🟢
                </span>
              </div>
            </div>

            {/* Category Card 1: Pending */}
            <div
              onClick={() => setSelectedCategory('PENDING')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                selectedCategory === 'PENDING'
                  ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/40'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">شحنات معلقة</span>
                    <span className="text-[10px] text-slate-400">بالمستودع وقيد الاستلام</span>
                  </div>
                </div>
                <div className="text-left font-mono">
                  <span className="text-base font-black text-amber-700">{categoryStats.pending.count}</span>
                  <span className="text-[10px] text-slate-400 block">{categoryStats.pending.pct}%</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">مبالغ COD المعلقة:</span>
                <span className="font-mono font-bold text-slate-800">
                  {categoryStats.pending.cod.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

            {/* Category Card 2: Out For Delivery */}
            <div
              onClick={() => setSelectedCategory('OUT_FOR_DELIVERY')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                selectedCategory === 'OUT_FOR_DELIVERY'
                  ? 'bg-blue-500/10 border-blue-400 ring-2 ring-blue-400/40'
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">قيد التوصيل</span>
                    <span className="text-[10px] text-slate-400">مع المناديب في الميدان</span>
                  </div>
                </div>
                <div className="text-left font-mono">
                  <span className="text-base font-black text-blue-700">{categoryStats.outForDelivery.count}</span>
                  <span className="text-[10px] text-slate-400 block">{categoryStats.outForDelivery.pct}%</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">المناديب النشطين:</span>
                  <span className="font-bold text-slate-800">{categoryStats.outForDelivery.activeCouriers} كابتن</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">COD قيد التحصيل:</span>
                  <span className="font-mono font-bold text-blue-800">
                    {categoryStats.outForDelivery.cod.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* Category Card 3: Completed with Customer Rating */}
            <div
              onClick={() => setSelectedCategory('COMPLETED')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                selectedCategory === 'COMPLETED'
                  ? 'bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-400/40'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">مكتملة بنجاح</span>
                    <span className="text-[10px] text-slate-400">تم التسليم والتحصيل</span>
                  </div>
                </div>
                <div className="text-left font-mono">
                  <span className="text-base font-black text-emerald-700">{categoryStats.completed.count}</span>
                  <span className="text-[10px] text-slate-400 block">{categoryStats.completed.pct}%</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">إجمالي المحصل:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {categoryStats.completed.cod.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/60">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    متوسط تقييم الخدمة:
                  </span>
                  <span className="font-mono font-black text-amber-800">
                    {categoryStats.completed.avgRating} / 5.0
                  </span>
                </div>
              </div>
            </div>

            {/* Category Card 4: Returns */}
            <div
              onClick={() => setSelectedCategory('RETURNS')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                selectedCategory === 'RETURNS'
                  ? 'bg-rose-500/10 border-rose-400 ring-2 ring-rose-400/40'
                  : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">مرتجعات وجزئي</span>
                    <span className="text-[10px] text-slate-400">طرود معادة للمستودع</span>
                  </div>
                </div>
                <div className="text-left font-mono">
                  <span className="text-base font-black text-rose-700">{categoryStats.returns.count}</span>
                  <span className="text-[10px] text-slate-400 block">{categoryStats.returns.pct}%</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">قيمة الطرود المرتجعة:</span>
                <span className="font-mono font-bold text-rose-800">
                  {categoryStats.returns.cod.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

            {/* Quick Filter Reset */}
            {selectedCategory !== 'ALL' && (
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                إلغاء الفلترة وعرض الكل ({categoryStats.total})
              </button>
            )}
          </aside>
        )}

        {/* Shipments Table Container */}
        <div className="flex-1 w-full min-w-0 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">رقم البوليصة</th>
                <th className="py-3 px-4">التاجر / المتجر</th>
                <th className="py-3 px-4">المستلم والمدينة</th>
                <th className="py-3 px-4">مبلغ التحصيل (COD)</th>
                <th className="py-3 px-4">كود الأمان (OTP)</th>
                <th className="py-3 px-4">المندوب المكلف</th>
                <th className="py-3 px-4">حالة الشحنة</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredShipments.map((shp) => {
                const isDelivered = shp.status === 'DELIVERED';
                const isOut = shp.status === 'OUT_FOR_DELIVERY';
                const isReturn =
                  shp.status === 'RETURN_PENDING' || shp.status === 'RETURNED_TO_MERCHANT';

                return (
                  <tr key={shp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Tracking & Barcode */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {shp.trackingNumber}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {shp.createdAt.slice(0, 10)}
                      </span>
                    </td>

                    {/* Merchant */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div>{shp.merchantName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {shp.merchantPhone}
                      </span>
                    </td>

                    {/* Recipient */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{shp.recipientName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>
                          {shp.city} - {shp.district}
                        </span>
                      </div>
                    </td>

                    {/* COD Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <span className="text-sm">{shp.codAmount} ج.م</span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        الشحن: {shp.shippingFee} ج.م
                      </span>
                    </td>

                    {/* Secure OTP Code (Anti-corruption proof) */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs">
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        <span>{shp.otpSecret}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-0.5">خاص بالمستلم</span>
                    </td>

                    {/* Courier Assignment with Live Visual Status Indicator */}
                    <td className="py-3.5 px-4">
                      {shp.assignedCourierName ? (
                        (() => {
                          const assignedStaff = staff.find(
                            (s) =>
                              s.id === shp.assignedCourierId ||
                              s.name === shp.assignedCourierName
                          );
                          const statusInfo = assignedStaff
                            ? getCourierStatusInfo(assignedStaff, shipments)
                            : null;

                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                                <Truck className="w-3.5 h-3.5 text-slate-600" />
                                <span>{shp.assignedCourierName}</span>
                                {assignedStaff && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold" title="متوسط تقييم المندوب الميداني">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                                    {getCourierRatingSummary(assignedStaff.id).average}
                                  </span>
                                )}
                              </div>

                              {statusInfo && (
                                <div className="flex items-center gap-1.5">
                                  {/* Visual Colored Status Dot & Badge Indicator */}
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.borderColor}`}
                                    title={`حالة المندوب: ${statusInfo.labelAr}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor} ${
                                        statusInfo.status === 'BUSY_DELIVERING'
                                          ? 'animate-ping'
                                          : ''
                                      }`}
                                    ></span>
                                    <span>{statusInfo.labelAr}</span>
                                  </span>

                                  <button
                                    onClick={() => setViewMode('SPLIT')}
                                    className="text-[10px] text-amber-600 hover:text-amber-700 underline font-semibold cursor-pointer"
                                    title="عرض خط سير المندوب على الخريطة التفاعلية"
                                  >
                                    تتبع على الخريطة
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setAssigningTracking(
                                assigningTracking === shp.trackingNumber ? null : shp.trackingNumber
                              )
                            }
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <span>إسناد لمندوب</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {assigningTracking === shp.trackingNumber && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-1.5">
                              <p className="text-[10px] text-slate-400 px-2 py-1">اختر المندوب:</p>
                              {couriers.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    assignShipmentCourier(shp.trackingNumber, c.id);
                                    setAssigningTracking(null);
                                  }}
                                  className="w-full text-right px-2 py-1 text-[11px] hover:bg-slate-100 rounded text-slate-800 flex items-center justify-between cursor-pointer"
                                >
                                  <span>{c.name}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {c.assignedZone.slice(0, 8)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md inline-flex items-center gap-1 ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isOut
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : isReturn
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isDelivered && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {isOut && <Truck className="w-3 h-3 text-blue-600" />}
                        {isReturn && <RotateCcw className="w-3 h-3 text-rose-600" />}
                        {!isDelivered && !isOut && !isReturn && (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span>
                          {shp.status === 'PENDING_PICKUP'
                            ? 'قيد الاستلام'
                            : shp.status === 'RECEIVED_IN_HUB'
                            ? 'بالمستودع'
                            : shp.status === 'OUT_FOR_DELIVERY'
                            ? 'مع المندوب'
                            : shp.status === 'DELIVERED'
                            ? 'تم التسليم'
                            : shp.status === 'PARTIAL_DELIVERY'
                            ? 'تسليم جزئي'
                            : 'مرتجع'}
                        </span>
                      </span>

                      {/* Customer Rating Indicator for Delivered Shipments */}
                      {isDelivered && (
                        <div className="mt-1">
                          {(() => {
                            const shpRating = deliveryRatings.find(
                              (r) => r.shipmentId === shp.id || r.trackingNumber === shp.trackingNumber
                            );
                            if (shpRating) {
                              return (
                                <button
                                  onClick={() => setViewingRatingModal(shpRating)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                                  title="عرض تقييم العميل ورأيه بالخدمة"
                                >
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                                  <span>{shpRating.overallRating}.0 ({shpRating.customerComment ? 'رأي العميل' : 'تقييم'})</span>
                                </button>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-slate-400 bg-slate-50 border border-slate-200">
                                <Star className="w-2.5 h-2.5 text-slate-300" />
                                <span>بانتظار التقييم</span>
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedShipment(shp)}
                          title="عرض تفاصيل الشحنة وسجل الأحداث الكامل"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setQrModalShipment(shp)}
                          title="توليد وطباعة رمز الـ QR وطابع الشحن"
                          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* Customer Rating View Button */}
                        {isDelivered && (
                          (() => {
                            const shpRating = deliveryRatings.find(
                              (r) => r.shipmentId === shp.id || r.trackingNumber === shp.trackingNumber
                            );
                            return shpRating ? (
                              <button
                                onClick={() => setViewingRatingModal(shpRating)}
                                title="عرض مراجعة وتقييم العميل"
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              </button>
                            ) : null;
                          })()
                        )}

                        {!isDelivered && shp.status !== 'RETURNED_TO_MERCHANT' && (
                          <button
                            onClick={() => {
                              setReturnTargetShipment(shp);
                              setIsReturnModalOpen(true);
                            }}
                            title="تسجيل مرتجع أو تسليم جزئي"
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 rounded text-slate-700 hover:text-rose-700 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredShipments.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">لا توجد شحنات تطابق معايير البحث الحالية</p>
          </div>
        )}
      </div>
      </div>
      )}

      {/* Modal: View Shipment Audit Details */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    تفاصيل وسجل الشحنة: {selectedShipment.trackingNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    التاجر: {selectedShipment.merchantName} | المستلم:{' '}
                    {selectedShipment.recipientName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQrModalShipment(selectedShipment)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="توليد وطباعة طابع الشحن ورمز الـ QR"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>طابع ورمز QR</span>
                </button>
                <button
                  onClick={() => setSelectedShipment(null)}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">المبلغ المطلوب (COD):</span>
                  <strong className="text-slate-900 font-mono text-sm">
                    {selectedShipment.codAmount} ج.م
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">تكلفة التوصيل:</span>
                  <strong className="text-slate-900 font-mono text-sm">
                    {selectedShipment.shippingFee} ج.م
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">صافي التاجر:</span>
                  <strong className="text-emerald-700 font-mono text-sm">
                    {selectedShipment.merchantShare} ج.م
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">كود الأمان السري (OTP):</span>
                  <strong className="text-amber-800 font-mono text-sm px-1.5 py-0.5 bg-amber-100 rounded">
                    {selectedShipment.otpSecret}
                  </strong>
                </div>
              </div>

              {/* Recipient & Package Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    بيانات المستلم:
                  </h4>
                  <p className="text-slate-700">
                    الاسم: <strong>{selectedShipment.recipientName}</strong>
                  </p>
                  <p className="text-slate-700 font-mono">الهاتف: {selectedShipment.recipientPhone}</p>
                  <p className="text-slate-700 mt-1">
                    العنوان: {selectedShipment.city} - {selectedShipment.district} -{' '}
                    {selectedShipment.address}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    محتويات الطرد:
                  </h4>
                  <p className="text-slate-800">{selectedShipment.itemsDescription}</p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    المندوب المسؤول:{' '}
                    <strong>{selectedShipment.assignedCourierName || 'لم يُحدد بعد'}</strong>
                  </p>
                  {selectedShipment.returnReason && (
                    <p className="text-rose-700 font-bold mt-2">
                      سبب المرتجع: {selectedShipment.returnReason}
                    </p>
                  )}
                </div>
              </div>

              {/* Immutable Chronological Audit Trail (Anti-corruption proof) */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  سجل التتبع والرقابة الموثق (Audit Trail Log):
                </h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                  {selectedShipment.timeline.map((evt, idx) => (
                    <div key={evt.id || idx} className="p-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 font-semibold">{evt.notes}</strong>
                          {evt.otpVerified && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              تم التحقق بـ OTP ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>بواسطة: {evt.actorName}</span>
                          <span>·</span>
                          <span>الصفة: {evt.actorRole}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {evt.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Return or Partial Delivery */}
      {isReturnModalOpen && returnTargetShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm">
                  تسجيل مرتجع / تسليم جزئي للشحنة {returnTargetShipment.trackingNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نوع الإجراء:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnType('RETURN_PENDING')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center cursor-pointer ${
                      returnType === 'RETURN_PENDING'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    مرتجع كامل
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType('PARTIAL_DELIVERY')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center cursor-pointer ${
                      returnType === 'PARTIAL_DELIVERY'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    تسليم جزئي
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">سبب المرتجع الأساسي:</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                >
                  <option value="العميل غير متواجد وطلب إعادة الجدولة">
                    العميل غير متواجد وطلب إعادة الجدولة
                  </option>
                  <option value="رفض الاستلام لعدم مطابقة المقاس أو اللون">
                    رفض الاستلام لعدم مطابقة المقاس أو اللون
                  </option>
                  <option value="العميل لا يجيب على الهاتف (3 محاولات اتصال مسجلة)">
                    العميل لا يجيب على الهاتف (3 محاولات اتصال مسجلة)
                  </option>
                  <option value="إلغاء الطلب من قبل العميل قبل الوصول">
                    إلغاء الطلب من قبل العميل قبل الوصول
                  </option>
                  <option value="الطرود بها تلف في التغليف تم رفضها">
                    الطرود بها تلف في التغليف تم رفضها
                  </option>
                </select>
              </div>

              {returnType === 'PARTIAL_DELIVERY' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    المبلغ المحصل فعلياً عن القطع المستلمة (ج.م):
                  </label>
                  <input
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">ملاحظات التحقق الإضافية:</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="اكتب تفاصيل الاتصال مع العميل وحالة الطرد..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                ></textarea>
              </div>

              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px]">
                🛡️ سيتم توثيق المرتجع في سجل التاجر فوراً ومطابقة استرجاع الطرد الفعلي إلى المستودع لمنع التلاعب.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmReturn}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  تأكيد تسجيل المرتجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Shipment Manually */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">تسجيل بوليصة شحن جديدة يدوياً</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">التاجر / المتجر الراسل:</label>
                <select
                  value={newOrder.merchantId}
                  onChange={(e) => setNewOrder({ ...newOrder, merchantId: e.target.value })}
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
                  <label className="font-bold text-slate-700 block mb-1">اسم العميل المستلم:</label>
                  <input
                    type="text"
                    required
                    value={newOrder.recipientName}
                    onChange={(e) => setNewOrder({ ...newOrder, recipientName: e.target.value })}
                    placeholder="مثال: محمد سعيد"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم هاتف المستلم:</label>
                  <input
                    type="tel"
                    required
                    value={newOrder.recipientPhone}
                    onChange={(e) => setNewOrder({ ...newOrder, recipientPhone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">المحافظة / المدينة:</label>
                  <select
                    value={newOrder.city}
                    onChange={(e) => setNewOrder({ ...newOrder, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="القليوبية">القليوبية</option>
                    <option value="الشرقية">الشرقية</option>
                    <option value="الدقهلية">الدقهلية</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">المنطقة أو الحي:</label>
                  <input
                    type="text"
                    value={newOrder.district}
                    onChange={(e) => setNewOrder({ ...newOrder, district: e.target.value })}
                    placeholder="مثال: التجمع الخامس، الدقي"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">العنوان بالتفصيل:</label>
                <input
                  type="text"
                  required
                  value={newOrder.address}
                  onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                  placeholder="الشارع، رقم العمارة، رقم الشقة ومعلم قريب"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">وصف محتويات الطرد:</label>
                <input
                  type="text"
                  value={newOrder.itemsDescription}
                  onChange={(e) => setNewOrder({ ...newOrder, itemsDescription: e.target.value })}
                  placeholder="مثال: طقم ملابس، أجهزة إلكترونية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    مبلغ التحصيل من العميل (COD):
                  </label>
                  <input
                    type="number"
                    value={newOrder.codAmount}
                    onChange={(e) => setNewOrder({ ...newOrder, codAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تكلفة الشحن (ج.م):</label>
                  <input
                    type="number"
                    value={newOrder.shippingFee}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, shippingFee: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  إسناد لمندوب مباشرة (اختياري):
                </label>
                <select
                  value={newOrder.assignedCourierId}
                  onChange={(e) => setNewOrder({ ...newOrder, assignedCourierId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                >
                  <option value="">تركها بالمستودع / إسناد لاحقاً</option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.assignedZone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bosta Features: Order Type & Inspection */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block text-xs">نوع الشحنة وخدمة الاستبدال (Bosta Feature):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewOrder({ ...newOrder, orderType: 'STANDARD' })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      newOrder.orderType === 'STANDARD'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    توصيل قياسي عادي
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOrder({ ...newOrder, orderType: 'EXCHANGE' })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      newOrder.orderType === 'EXCHANGE'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    🔄 طلب استبدال فوري
                  </button>
                </div>

                {newOrder.orderType === 'EXCHANGE' && (
                  <div className="pt-1">
                    <label className="text-[11px] text-slate-600 block mb-1">
                      وصف القطعة المسترجعة المطلوب استلامها من العميل:
                    </label>
                    <input
                      type="text"
                      value={newOrder.exchangeDetails}
                      onChange={(e) => setNewOrder({ ...newOrder, exchangeDetails: e.target.value })}
                      placeholder="مثال: استلام فستان أزرق مقاس M وتسليم مقاس L"
                      className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 pt-1 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newOrder.allowInspection}
                    onChange={(e) => setNewOrder({ ...newOrder, allowInspection: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-bold text-[11px] text-slate-800">
                    السماح للعميل بفتح الشحنة والمعاينة قبل دفع الكاش (Inspection on Delivery)
                  </span>
                </label>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-900 text-[11px] border border-amber-200">
                🔒 سيقوم النظام بتوليد رمز أمان سري (OTP) آلياً لحماية الشحنة ومنع أي فساد في التسليم.
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
                  إنشاء البوليصة الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Rating Details Modal */}
      {viewingRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm">مراجعة تقييم العميل للخدمة</h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    بوليصة {viewingRatingModal.trackingNumber} | العميل: {viewingRatingModal.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingRatingModal(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Overall Rating Banner */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-slate-50 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-950 block">التقييم الشامل للخدمة</span>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= viewingRatingModal.overallRating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-left font-mono">
                  <span className="text-2xl font-black text-slate-900">{viewingRatingModal.overallRating}.0</span>
                  <span className="text-[10px] text-slate-500 block">من 5 نجوم</span>
                </div>
              </div>

              {/* Sub-ratings Breakdown */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">سرعة التوصيل</span>
                  <div className="flex justify-center gap-0.5 text-amber-500 mb-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  </div>
                  <strong className="font-mono text-sm text-slate-800">{viewingRatingModal.deliverySpeedRating}.0 / 5</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">سلوك المندوب</span>
                  <div className="flex justify-center gap-0.5 text-amber-500 mb-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  </div>
                  <strong className="font-mono text-sm text-slate-800">{viewingRatingModal.courierBehaviorRating}.0 / 5</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">سلامة الطرد</span>
                  <div className="flex justify-center gap-0.5 text-amber-500 mb-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  </div>
                  <strong className="font-mono text-sm text-slate-800">{viewingRatingModal.parcelConditionRating}.0 / 5</strong>
                </div>
              </div>

              {/* Selected Praise Tags */}
              {viewingRatingModal.tags && viewingRatingModal.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">وسوم التقييم الإيجابية:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingRatingModal.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-[11px] font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Comment */}
              {viewingRatingModal.customerComment ? (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">تعليق العميل:</span>
                  <p className="text-slate-800 leading-relaxed font-medium text-xs bg-white p-2.5 rounded-xl border border-slate-100">
                    "{viewingRatingModal.customerComment}"
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic text-center py-1">
                  لم يترك العميل تعليقاً نصياً مكتوباً
                </p>
              )}

              {/* Courier & Time Meta */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>المندوب المكلف: <strong>الكابتن {viewingRatingModal.courierName}</strong></span>
                <span className="font-mono">{new Date(viewingRatingModal.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setViewingRatingModal(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer text-center text-xs"
                >
                  إغلاق المراجعة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipment QR Code Waybill Modal */}
      <ShipmentQrModal
        shipment={qrModalShipment}
        isOpen={!!qrModalShipment}
        onClose={() => setQrModalShipment(null)}
      />
    </div>
  );
};
