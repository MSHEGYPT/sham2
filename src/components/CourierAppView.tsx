import React, { useState } from 'react';
import {
  Truck,
  Phone,
  MapPin,
  KeyRound,
  CheckCircle2,
  RotateCcw,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Navigation,
  Package,
  X,
  Lock,
  QrCode,
  Camera,
  Map as MapIcon,
  Compass,
  Bell,
  Sparkles,
  Radio,
  BellRing,
  LocateFixed,
  Building2,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { Shipment, PickupSchedule } from '../types';
import { CourierScanner } from './CourierScanner';
import { ShipmentQrModal } from './ShipmentQrModal';
import { CourierInteractiveMap } from './CourierInteractiveMap';
import { NotificationsCenterDropdown } from './NotificationsCenterDropdown';
import {
  getCourierBaseLocation,
  getShipmentCoordinates,
  calculateDistanceKm,
} from '../utils/geoRouting';

export const CourierAppView: React.FC = () => {
  const {
    staff,
    activeCourierId,
    setActiveCourierId,
    shipments,
    pickups,
    verifyAndDeliverShipment,
    recordReturnOrPartial,
    recordCashDeposit,
    simulateEventNotification,
    triggerProximityAlert,
  } = useLogistics();

  const currentCourier = staff.find((s) => s.id === activeCourierId) || staff.find((s) => s.role === 'COURIER') || staff[0];
  const couriersList = staff.filter((s) => s.role === 'COURIER');

  // Proximity Alerts & Geofencing Radar State
  const [isGeofenceEnabled, setIsGeofenceEnabled] = useState(true);
  const [proximityThresholdMeters, setProximityThresholdMeters] = useState(500);

  // Delivery Modal State
  const [deliveringShipment, setDeliveringShipment] = useState<Shipment | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [collectedAmount, setCollectedAmount] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Return Modal State
  const [returningShipment, setReturningShipment] = useState<Shipment | null>(null);
  const [returnReason, setReturnReason] = useState('العميل طلب التأجيل ليوم غد');

  // Deposit modal
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositMsg, setDepositMsg] = useState<string | null>(null);

  // Active View Tab: 'LIST' or 'SCANNER'
  const [activeTab, setActiveTab] = useState<'LIST' | 'MAP' | 'SCANNER'>('LIST');
  const [selectedQrShipment, setSelectedQrShipment] = useState<Shipment | null>(null);

  // Shipments assigned to this courier
  const myShipments = shipments.filter(
    (s) => s.assignedCourierId === currentCourier.id || s.assignedCourierName === currentCourier.name
  );

  const activeDeliveries = myShipments.filter((s) => s.status === 'OUT_FOR_DELIVERY');
  const deliveredToday = myShipments.filter((s) => s.status === 'DELIVERED');

  const handleStartDelivery = (shipment: Shipment) => {
    setDeliveringShipment(shipment);
    setEnteredOtp('');
    setCollectedAmount(shipment.codAmount);
    setFeedbackMsg(null);
  };

  const handleConfirmDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringShipment) return;

    const result = verifyAndDeliverShipment(
      deliveringShipment.trackingNumber,
      enteredOtp,
      Number(collectedAmount),
      currentCourier.name,
      currentCourier.id
    );

    setFeedbackMsg({ success: result.success, text: result.message });

    if (result.success) {
      setTimeout(() => {
        setDeliveringShipment(null);
        setFeedbackMsg(null);
      }, 1500);
    }
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningShipment) return;

    recordReturnOrPartial(
      returningShipment.trackingNumber,
      'RETURN_PENDING',
      returnReason,
      'تم التوثيق من تطبيق المندوب في الميدان',
      currentCourier.name,
      0
    );

    setReturningShipment(null);
  };

  const handleDoDeposit = () => {
    if (depositAmount <= 0) return;
    const res = recordCashDeposit(currentCourier.id, depositAmount);
    setDepositMsg(res.message);
    setTimeout(() => {
      setDepositMsg(null);
      setIsDepositOpen(false);
    }, 1500);
  };

  const isHeldNearLimit =
    currentCourier.currentCashHeld >= (currentCourier.maxCashLimit || 3000) * 0.85;

  const courierBase = getCourierBaseLocation(currentCourier);

  const handleSimulateProximityForShipment = (shp: Shipment) => {
    triggerProximityAlert({
      courierId: currentCourier.id,
      courierName: currentCourier.name,
      stopType: 'DELIVERY',
      title: 'تسليم طرد',
      targetName: shp.recipientName,
      address: `${shp.city} - ${shp.district || shp.address}`,
      distanceMeters: Math.floor(180 + Math.random() * 120),
      phone: shp.recipientPhone,
      trackingNumber: shp.trackingNumber,
      codAmount: shp.codAmount,
      otpSecret: shp.otpSecret,
    });
  };

  const handleSimulateProximityForPickup = (pickup?: PickupSchedule) => {
    const targetPickup = pickup || pickups.find((p) => p.status !== 'COMPLETED') || pickups[0];
    triggerProximityAlert({
      courierId: currentCourier.id,
      courierName: currentCourier.name,
      stopType: 'PICKUP',
      title: 'استلام بضائع',
      targetName: targetPickup?.merchantName || 'متجر الأناقة للملابس',
      address: targetPickup ? `${targetPickup.city} - ${targetPickup.merchantAddress}` : 'شارع النصر، المعادي',
      distanceMeters: Math.floor(220 + Math.random() * 110),
      phone: targetPickup?.merchantPhone || '01002345678',
      trackingNumber: targetPickup?.id || 'PCK-8902',
      parcelsCount: targetPickup?.expectedParcelsCount || 5,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Courier Profile & Cash Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={currentCourier.avatar}
              alt={currentCourier.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">{currentCourier.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  كابتن توصيل ميداني
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                خط السير: <strong>{currentCourier.assignedZone}</strong> | اللوحة:{' '}
                {currentCourier.vehiclePlate || 'موتوسيكل'}
              </p>
            </div>
          </div>

          {/* Switch Courier Persona */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400">تبديل المندوب:</span>
            <select
              value={currentCourier.id}
              onChange={(e) => setActiveCourierId(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold"
            >
              {couriersList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.assignedZone.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Courier Cash Held Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">العهدة النقدية في حوزتك:</span>
              <strong className="text-lg font-mono font-bold text-amber-400">
                {currentCourier.currentCashHeld.toLocaleString('ar-EG')} ج.م
              </strong>
            </div>
            {currentCourier.currentCashHeld > 0 && (
              <button
                onClick={() => {
                  setDepositAmount(currentCourier.currentCashHeld);
                  setIsDepositOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
              >
                توريد للخزينة
              </button>
            )}
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[11px] text-slate-400 block">سقف العهدة المسموح:</span>
            <strong className="text-sm font-mono text-slate-200">
              {currentCourier.maxCashLimit} ج.م
            </strong>
            <div className="w-full bg-slate-700 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={`h-full ${isHeldNearLimit ? 'bg-rose-500' : 'bg-emerald-400'}`}
                style={{
                  width: `${Math.min(
                    100,
                    (currentCourier.currentCashHeld / (currentCourier.maxCashLimit || 3000)) * 100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">تسليمات اليوم:</span>
              <strong className="text-lg font-mono text-emerald-400 font-bold">
                {deliveredToday.length} طرد
              </strong>
            </div>
            <span className="text-xs text-slate-400">
              متبقي في خط السير: {activeDeliveries.length}
            </span>
          </div>
        </div>

        {isHeldNearLimit && (
          <div className="mt-3 p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              تنبيه رقابي: لقد اقتربت من الحد الأقصى للعهدة النقدية. يرجى توريد المبالغ المحصلة للخزينة
              لتجنب تجميد إسناد الشحنات الجديدة تلقائياً.
            </span>
          </div>
        )}
      </div>

      {/* Geofence & Proximity Radar System Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-4 rounded-2xl border border-amber-500/40 shadow-lg text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-white">
                  نظام تنبيهات الدفع للاقتراب الجغرافي (Geofence Toast Alerts)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>رادار الخريطة نشط</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                إشعار Toast تلقائي يظهر للكابتن فور الاقتراب من نقطة استلام من تاجر أو تسليم لعميل (أقل من {proximityThresholdMeters}م)
              </p>
            </div>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => simulateEventNotification('COURIER_PROXIMITY_DELIVERY')}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="محاكاة اقتراب المندوب من موقع تسليم العميل لتجربة إشعار الدفع"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>تجربة اقتراب من تسليم 📍</span>
            </button>

            <button
              onClick={() => simulateEventNotification('COURIER_PROXIMITY_PICKUP')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="محاكاة اقتراب المندوب من متجر تاجر لاستلام بضائع"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>تجربة اقتراب من استلام 🏬</span>
            </button>
          </div>
        </div>

        {/* Proximity Sensitivity Controls Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">نطاق مسافة التنبيه:</span>
            {[250, 500, 1000].map((dist) => (
              <button
                key={dist}
                onClick={() => setProximityThresholdMeters(dist)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                  proximityThresholdMeters === dist
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {dist < 1000 ? `${dist} متر` : '1 كم'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>نقطة تمركز الكابتن: <strong className="text-amber-400 font-mono">{courierBase.lat.toFixed(4)}°N, {courierBase.lng.toFixed(4)}°E</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">نغمة التنبيه الصوتي مفعلة 🔊</span>
          </div>
        </div>
      </div>

      {/* View Switcher: Deliveries Route List vs Interactive Map vs Scanner Component */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'LIST'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-slate-700 shrink-0" />
            <span>شحنات خط السير ({activeDeliveries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MAP')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'MAP'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <MapIcon className="w-4 h-4 shrink-0" />
            <span>الخريطة التفاعلية والمسارات</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black shrink-0">
              توجيه ذكي
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SCANNER')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'SCANNER'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>ماسح الـ QR الميداني</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black shrink-0">
              لحظي
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab !== 'MAP' && (
            <button
              onClick={() => setActiveTab('MAP')}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MapIcon className="w-3.5 h-3.5 text-indigo-700" />
              <span>عرض المسارات على الخريطة</span>
            </button>
          )}

          {activeTab !== 'SCANNER' && (
            <button
              onClick={() => setActiveTab('SCANNER')}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-purple-700" />
              <span>فتح ماسح الكاميرا</span>
            </button>
          )}

          {activeTab !== 'LIST' && (
            <button
              onClick={() => setActiveTab('LIST')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-slate-700" />
              <span>العودة لقائمة خط السير</span>
            </button>
          )}

          {/* Real-time Order Simulation Action for Courier */}
          <button
            onClick={() => simulateEventNotification('NEW_ORDER_COURIER')}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="محاكاة وصول إشعار فوري بأمر توصيل جديد للكابتن"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">محاكاة أوردر جديد</span>
          </button>

          {/* Courier Notification Bell */}
          <NotificationsCenterDropdown isCompact={true} />
        </div>
      </div>

      {/* Conditionally Render Scanner Component or Interactive Map or Active Deliveries List */}
      {activeTab === 'SCANNER' ? (
        <CourierScanner
          courierId={currentCourier.id}
          courierName={currentCourier.name}
          onClose={() => setActiveTab('LIST')}
        />
      ) : activeTab === 'MAP' ? (
        <CourierInteractiveMap
          currentCourier={currentCourier}
          couriersList={couriersList}
          shipments={shipments}
          pickups={pickups}
          onSelectCourier={(id) => setActiveCourierId(id)}
          onStartDelivery={handleStartDelivery}
          onRecordReturn={(shp) => setReturningShipment(shp)}
          onShowQr={(shp) => setSelectedQrShipment(shp)}
        />
      ) : (
        /* Active Shipments Section */
        <div className="space-y-3">
          {/* Smart Route Map Teaser Banner */}
          <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MapIcon className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">
                  توجيه ذكي لخط السير (TSP Route Optimization)
                </strong>
                <span className="text-slate-600 text-[11px]">
                  خريطة تفاعلية توضح الترتيب المقترح لتسليم الشحنات والمسارات المحسوبة لكل مندوب
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('MAP')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>فتح الخريطة والمسارات</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-700" />
              الشحنات قيد التوزيع في خط السير اليوم ({activeDeliveries.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              مطلوب رمز الأمان السري (OTP) من العميل لتأكيد التسليم
            </span>
          </div>

          {activeDeliveries.map((shp, idx) => {
            const shpCoords = getShipmentCoordinates(shp, idx);
            const distKm = calculateDistanceKm(courierBase.lat, courierBase.lng, shpCoords.lat, shpCoords.lng);
            const distMeters = Math.round(distKm * 1000);
            const isNear = distMeters <= proximityThresholdMeters;

            return (
              <div
                key={shp.id}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 relative overflow-hidden"
              >
                {isNear && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 animate-pulse" />
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {shp.trackingNumber}
                      </span>
                      <span className="text-xs text-slate-500">({shp.merchantName})</span>

                      {/* Real-time distance indicator */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono ${
                          isNear
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Navigation className="w-2.5 h-2.5 text-amber-500" />
                        <span>
                          {distMeters < 1000 ? `${distMeters} م` : `${(distMeters / 1000).toFixed(1)} كم`}
                        </span>
                        {isNear && <span className="text-emerald-700 font-bold">• نطاق الاقتراب 📍</span>}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mt-1">{shp.recipientName}</h4>
                  </div>

                  <div className="text-left">
                    <span className="text-xs text-slate-400 block">المبلغ المطلوب تحصيله (COD):</span>
                    <strong className="text-lg font-mono font-bold text-amber-700">
                      {shp.codAmount} ج.م
                    </strong>
                  </div>
                </div>

                {/* Address & Items */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      <strong>العنوان:</strong> {shp.city} - {shp.district} - {shp.address}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Package className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      <strong>المحتويات:</strong> {shp.itemsDescription}
                    </span>
                  </div>

                  {/* Bosta Directives for Courier */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/80">
                    {shp.allowInspection !== false && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <span>👁️ مسموح للعميل بالمعاينة قبل دفع الكاش</span>
                      </span>
                    )}

                    {shp.orderType === 'EXCHANGE' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 flex items-center gap-1">
                        <span>🔄 استبدال فوري: استلم القطعة القديمة من العميل ({shp.exchangeDetails || 'القطعة المسترجعة'})</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Courier Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${shp.recipientPhone}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span className="font-mono">{shp.recipientPhone}</span>
                    </a>

                    {shp.recipientPhoneAlt && (
                      <a
                        href={`tel:${shp.recipientPhoneAlt}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-mono">بديل: {shp.recipientPhoneAlt}</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    {/* Proximity simulation trigger */}
                    <button
                      onClick={() => handleSimulateProximityForShipment(shp)}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="محاكاة اقتراب المندوب من موقع العميل وإطلاق تنبيه الدفع اللحظي"
                    >
                      <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>تنبيه اقتراب (Toast)</span>
                    </button>

                    {/* View on interactive map button */}
                    <button
                      onClick={() => setActiveTab('MAP')}
                      className="px-3 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="استعراض موقع الشحنة والمسار على الخريطة التفاعلية"
                    >
                      <MapIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>الخريطة</span>
                    </button>

                    {/* QR Code generator button for this shipment */}
                    <button
                      onClick={() => setSelectedQrShipment(shp)}
                      className="px-3 py-2 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200 hover:border-purple-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="توليد وعرض رمز الـ QR وطابع الشحن"
                    >
                      <QrCode className="w-3.5 h-3.5 text-purple-600" />
                      <span>رمز الـ QR</span>
                    </button>

                    <button
                      onClick={() => setReturningShipment(shp)}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 inline ml-1" />
                      <span>تسجيل تعذر / مرتجع</span>
                    </button>

                    <button
                      onClick={() => handleStartDelivery(shp)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>تأكيد التسليم برمز الأمان (OTP)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {activeDeliveries.length === 0 && (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <h4 className="font-bold text-sm text-slate-800">
                رائع! تم تسليم جميع شحنات خط السير الحالي بنجاح
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                قم بتوريد العهدة النقدية في الخزينة أو طلب استلام شحنات جديدة من المستودع
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Secure Delivery OTP Verification */}
      {deliveringShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  تأكيد التسليم الآمن: {deliveringShipment.trackingNumber}
                </h3>
              </div>
              <button
                onClick={() => setDeliveringShipment(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-amber-950">
                <p className="font-bold text-sm">المستلم: {deliveringShipment.recipientName}</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  أطلب رمز التحقق المكون من 4 أرقام من العميل (المستلم على هاتفه: {deliveringShipment.recipientPhone})
                </p>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  (ملاحظة تجريبية للاختبار: الرمز الصحيح في النظام هو: <strong>{deliveringShipment.otpSecret}</strong>)
                </p>
              </div>

              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold text-center ${
                    feedbackMsg.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 animate-shake'
                  }`}
                >
                  {feedbackMsg.text}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  رمز الأمان السري للعميل (OTP):
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="أدخل الـ 4 أرقام"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-center text-xl font-mono font-black tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  المبلغ المحصل نقداً من العميل (ج.م):
                </label>
                <input
                  type="number"
                  required
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-slate-900 font-mono text-base font-bold"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  نظام زيرو فساد: أي إدخال خاطئ للرمز يتم تقييده كشبهة تسليم وهمي تلقائياً.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveringShipment(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  تأكيد التسليم وتحصيل الكاش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Return by Courier */}
      {returningShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm">توثيق سبب تعذر التسليم</h3>
              </div>
              <button
                onClick={() => setReturningShipment(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="p-5 space-y-4 text-xs">
              <p className="text-slate-700">
                الشحنة: <strong>{returningShipment.trackingNumber}</strong> للعميل{' '}
                <strong>{returningShipment.recipientName}</strong>
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">السبب الميداني:</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                >
                  <option value="العميل طلب التأجيل ليوم غد">العميل طلب التأجيل ليوم غد</option>
                  <option value="العميل لا يجيب بعد 3 اتصالات">العميل لا يجيب بعد 3 اتصالات</option>
                  <option value="العميل رفض استلام الطرد لاختلاف المواصفات">
                    العميل رفض استلام الطرد لاختلاف المواصفات
                  </option>
                  <option value="العنوان غير واضح والعميل مغلق">العنوان غير واضح والعميل مغلق</option>
                </select>
              </div>

              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px]">
                🛡️ سيقوم المشرف بالاتصال بالعميل فوراً لمطابقة السبب وحماية حقوق التاجر.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturningShipment(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  تأكيد التوثيق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cash Deposit by Courier */}
      {isDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">توريد الكاش لخزينة الشركة</h3>
              </div>
              <button
                onClick={() => setIsDepositOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {depositMsg ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold">
                  {depositMsg}
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      المبلغ المودع في الخزينة الآن:
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
                      onClick={() => setIsDepositOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleDoDeposit}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                    >
                      تأكيد التوريد
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shipment QR Code Waybill Modal */}
      <ShipmentQrModal
        shipment={selectedQrShipment}
        isOpen={!!selectedQrShipment}
        onClose={() => setSelectedQrShipment(null)}
      />
    </div>
  );
};
