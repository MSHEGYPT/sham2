import React, { useState } from 'react';
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
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { Shipment, ShipmentStatus } from '../types';
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
  } = useLogistics();

  const [viewMode, setViewMode] = useState<'TABLE' | 'MAP' | 'HEATMAP' | 'SPLIT'>('TABLE');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle applying smart zone allocation to balance deliveries
  const handleApplySmartAllocation = (trackingNumbers: string[], courierId: string) => {
    trackingNumbers.forEach((tn) => {
      assignShipmentCourier(tn, courierId);
    });
  };
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
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

  const statusTabs = [
    { id: 'ALL', label: 'كافة الشحنات' },
    { id: 'PENDING_PICKUP', label: 'قيد الاستلام من التاجر' },
    { id: 'RECEIVED_IN_HUB', label: 'بالمستودع الرئيسي' },
    { id: 'OUT_FOR_DELIVERY', label: 'مع المندوب للتسليم' },
    { id: 'DELIVERED', label: 'تم التسليم بنجاح' },
    { id: 'RETURN_PENDING', label: 'مرتجع / قيد التسوية' },
  ];

  const filteredShipments = shipments.filter((shp) => {
    const matchesSearch =
      shp.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shp.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shp.recipientPhone.includes(searchQuery) ||
      shp.merchantName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedStatus === 'ALL') return true;
    if (selectedStatus === 'RETURN_PENDING') {
      return (
        shp.status === 'RETURN_PENDING' ||
        shp.status === 'RETURNED_TO_MERCHANT' ||
        shp.status === 'PARTIAL_DELIVERY'
      );
    }
    return shp.status === selectedStatus;
  });

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

      {/* Search and Filters Header (Displayed in TABLE and SPLIT modes) */}
      {viewMode !== 'MAP' && viewMode !== 'HEATMAP' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Add Order Button */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم البوليصة (SND-..)، العميل، أو التاجر..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>

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
      )}

      {/* Shipments Table (Displayed in TABLE and SPLIT modes) */}
      {viewMode !== 'MAP' && viewMode !== 'HEATMAP' && (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
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

      {/* Shipment QR Code Waybill Modal */}
      <ShipmentQrModal
        shipment={qrModalShipment}
        isOpen={!!qrModalShipment}
        onClose={() => setQrModalShipment(null)}
      />
    </div>
  );
};
