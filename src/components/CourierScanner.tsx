import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  Package,
  MapPin,
  Phone,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { Shipment } from '../types';

interface CourierScannerProps {
  onClose?: () => void;
  courierId?: string;
  courierName?: string;
}

export const CourierScanner: React.FC<CourierScannerProps> = ({
  onClose,
  courierId,
  courierName,
}) => {
  const {
    shipments,
    getShipmentByTracking,
    verifyAndDeliverShipment,
    recordReturnOrPartial,
    currentUser,
    assignShipmentCourier,
  } = useLogistics();

  const effectiveCourierName = courierName || currentUser.name || 'مندوب التوصيل';
  const effectiveCourierId = courierId || currentUser.id || 'STF-04';

  const [scannedTracking, setScannedTracking] = useState<string>('');
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [statusNotice, setStatusNotice] = useState<{ text: string; success: boolean } | null>(null);

  // OTP delivery input within scanner
  const [otpInput, setOtpInput] = useState<string>('');
  const [collectedCash, setCollectedCash] = useState<number>(0);
  const [isOtpStepOpen, setIsOtpStepOpen] = useState<boolean>(false);

  // Return reason input
  const [isReturnStepOpen, setIsReturnStepOpen] = useState<boolean>(false);
  const [returnReason, setReturnReason] = useState<string>('العميل طلب التأجيل ليوم غد');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Audio beep generator via Web Audio API
  const playScanBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // AudioContext may be restricted before user gesture
    }
  };

  // Start real camera if requested
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('الكاميرا غير مدعومة على هذا الجهاز أو البيئة الحالية');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('تعذر فتح الكاميرا (يرجى السماح بالوصول أو استخدام أزرار المسح المباشرة)');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Process a scanned tracking code or QR string
  const handleProcessScan = (rawCode: string) => {
    let tracking = rawCode.trim();

    // Check if it's a JSON QR payload
    if (tracking.startsWith('{') && tracking.includes('trk')) {
      try {
        const parsed = JSON.parse(tracking);
        if (parsed.trk) tracking = parsed.trk;
      } catch (e) {
        // use raw string
      }
    }

    // Clean tracking number
    const match = tracking.match(/SND-\d+/i);
    if (match) {
      tracking = match[0].toUpperCase();
    }

    setScannedTracking(tracking);
    const found = getShipmentByTracking(tracking);

    if (found) {
      playScanBeep();
      setActiveShipment(found);
      setCollectedCash(found.codAmount);
      setIsOtpStepOpen(false);
      setIsReturnStepOpen(false);
      setStatusNotice({
        text: `تم التعرف على الشحنة ${found.trackingNumber} بنجاح!`,
        success: true,
      });
    } else {
      setActiveShipment(null);
      setStatusNotice({
        text: `لم يتم العثور على شحنة تطابق الرمز: ${tracking}`,
        success: false,
      });
    }
  };

  // 1. Instant Status Update: In Hub
  const handleUpdateToHub = () => {
    if (!activeShipment) return;
    assignShipmentCourier(activeShipment.trackingNumber, effectiveCourierId);
    setStatusNotice({
      text: `تم استلام الطرد ${activeShipment.trackingNumber} وتسجيله بالمستودع المركزي.`,
      success: true,
    });
    // refresh active shipment
    setTimeout(() => {
      const updated = getShipmentByTracking(activeShipment.trackingNumber);
      if (updated) setActiveShipment(updated);
    }, 200);
  };

  // 2. Instant Status Update: Out for delivery
  const handleUpdateToOutForDelivery = () => {
    if (!activeShipment) return;
    assignShipmentCourier(activeShipment.trackingNumber, effectiveCourierId);
    setStatusNotice({
      text: `خرج الطرد ${activeShipment.trackingNumber} للتوزيع الميداني مع الكابتن ${effectiveCourierName}.`,
      success: true,
    });
    setTimeout(() => {
      const updated = getShipmentByTracking(activeShipment.trackingNumber);
      if (updated) setActiveShipment(updated);
    }, 200);
  };

  // 3. Instant Status Update: Deliver with OTP
  const handleConfirmOtpDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;

    const res = verifyAndDeliverShipment(
      activeShipment.trackingNumber,
      otpInput,
      Number(collectedCash),
      effectiveCourierName,
      effectiveCourierId
    );

    setStatusNotice({ text: res.message, success: res.success });

    if (res.success) {
      playScanBeep();
      setIsOtpStepOpen(false);
      setOtpInput('');
      setTimeout(() => {
        const updated = getShipmentByTracking(activeShipment.trackingNumber);
        if (updated) setActiveShipment(updated);
      }, 200);
    }
  };

  // 4. Instant Status Update: Return
  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;

    recordReturnOrPartial(
      activeShipment.trackingNumber,
      'RETURN_PENDING',
      returnReason,
      'تم المسح والتوثيق من الماسح الضوئي الميداني للمندوب',
      effectiveCourierName,
      0
    );

    setStatusNotice({
      text: `تم توثيق مرتجع للشحنة ${activeShipment.trackingNumber}: ${returnReason}`,
      success: true,
    });
    setIsReturnStepOpen(false);

    setTimeout(() => {
      const updated = getShipmentByTracking(activeShipment.trackingNumber);
      if (updated) setActiveShipment(updated);
    }, 200);
  };

  // Filter courier's active route shipments for quick scan simulator
  const activeRouteShipments = shipments.filter(
    (s) => s.status === 'OUT_FOR_DELIVERY' || s.status === 'PENDING_PICKUP' || s.status === 'RECEIVED_IN_HUB'
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col space-y-4">
      {/* Scanner Header */}
      <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">الماسح الضوئي الميداني (QR & Barcode Scanner)</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                تحديث لحظي للحالات
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              امسح رمز البوليصة لتأكيد الاستلام أو التسليم الآمن أو توثيق المرتجع في ثانية واحدة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'كتم صوت صافرة المسح' : 'تفعيل صوت صافرة المسح'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Viewfinder and Camera Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Viewfinder Box */}
          <div className="bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[260px] text-center border border-slate-800 shadow-inner">
            {/* Real Camera Stream if Active */}
            {isCameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="space-y-3 z-10 py-6">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border-2 border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto shadow-lg">
                  <Camera className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs sm:text-sm">
                    وجه الكاميرا نحو رمز الـ QR على الطرد
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-1 max-w-xs mx-auto">
                    يتعرف الماسح على كود الشحنة ومبلغ الـ COD وبيانات العميل تلقائياً
                  </p>
                </div>

                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>تفعيل كاميرا الهاتف</span>
                </button>
              </div>
            )}

            {/* Viewfinder Animated Framing & Laser Line */}
            <div className="absolute inset-6 border-2 border-dashed border-purple-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <span className="w-4 h-4 border-t-2 border-r-2 border-amber-400"></span>
                <span className="w-4 h-4 border-t-2 border-l-2 border-amber-400"></span>
              </div>

              {/* Animated Laser Sweep Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_red] animate-pulse"></div>

              <div className="flex justify-between">
                <span className="w-4 h-4 border-b-2 border-r-2 border-amber-400"></span>
                <span className="w-4 h-4 border-b-2 border-l-2 border-amber-400"></span>
              </div>
            </div>

            {cameraError && (
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 text-rose-300 text-[10px] p-2 rounded-lg border border-rose-500/40 z-20">
                {cameraError}
              </div>
            )}
          </div>

          {/* Right: Quick Scan Controls & Code Input */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* Manual Code Input Bar */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                أو اكتب رقم البوليصة / الصق رمز الـ QR يدوياً:
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (scannedTracking) handleProcessScan(scannedTracking);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={scannedTracking}
                  onChange={(e) => setScannedTracking(e.target.value)}
                  placeholder="مثال: SND-8041"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  مسح وفحص
                </button>
              </form>
            </div>

            {/* Quick Test Scan Shortcuts for active deliveries */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 block flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                محاكاة مسح شحنات خط السير الحالي بضغطة زر:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeRouteShipments.slice(0, 5).map((shp) => (
                  <button
                    key={shp.id}
                    onClick={() => handleProcessScan(shp.trackingNumber)}
                    className="px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-800 hover:text-purple-900 border border-slate-200 hover:border-purple-300 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    {shp.trackingNumber} ({shp.codAmount} ج.م)
                  </button>
                ))}
              </div>
            </div>

            {/* Status Feedback Notice */}
            {statusNotice && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in ${
                  statusNotice.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {statusNotice.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusNotice.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Scanned Shipment Details & Instant Actions */}
        {activeShipment && (
          <div className="bg-slate-50 border-2 border-purple-300 rounded-3xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">
                  تم التعرف على الشحنة عبر الماسح:
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="text-base font-black font-mono text-slate-900">
                    {activeShipment.trackingNumber}
                  </h4>
                  <span className="text-xs text-slate-500">({activeShipment.merchantName})</span>
                </div>
              </div>

              <div className="text-left">
                <span className="text-[11px] text-slate-400 block">المبلغ المطلوب تحصيله (COD):</span>
                <strong className="text-xl font-mono font-black text-amber-700">
                  {activeShipment.codAmount} جنيه
                </strong>
              </div>
            </div>

            {/* Recipient & Package Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 block">المستلم:</span>
                <strong className="text-slate-900 block">{activeShipment.recipientName}</strong>
                <span className="font-mono text-slate-600 block">{activeShipment.recipientPhone}</span>
                <p className="text-slate-700 text-[11px] mt-1">
                  {activeShipment.city} - {activeShipment.district} - {activeShipment.address}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 block">محتويات الطرد:</span>
                <strong className="text-slate-900 block">{activeShipment.itemsDescription}</strong>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span>الحالة الحالية:</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    {activeShipment.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span>كود الأمان المسجل:</span>
                  <strong className="font-mono text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">
                    {activeShipment.otpSecret}
                  </strong>
                </div>
              </div>
            </div>

            {/* Action Buttons for Instant Status Update */}
            {!isOtpStepOpen && !isReturnStepOpen && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleUpdateToOutForDelivery}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>تحديث: خرجت للتوزيع مع المندوب</span>
                </button>

                <button
                  onClick={handleUpdateToHub}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Package className="w-4 h-4" />
                  <span>تحديث: تم الاستلام بالمستودع</span>
                </button>

                <button
                  onClick={() => setIsReturnStepOpen(true)}
                  className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>تسجيل مرتجع / تعذر</span>
                </button>

                <button
                  onClick={() => setIsOtpStepOpen(true)}
                  className="w-full sm:w-auto py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>تأكيد التسليم الآمن بكود OTP وتحصيل الكاش</span>
                </button>
              </div>
            )}

            {/* Sub-form: OTP Verification Form */}
            {isOtpStepOpen && (
              <form
                onSubmit={handleConfirmOtpDelivery}
                className="bg-white p-4 rounded-2xl border border-emerald-300 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>تأكيد التسليم: أدخل كود الأمان المستلم على هاتف العميل</span>
                  </h5>
                  <button
                    type="button"
                    onClick={() => setIsOtpStepOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      رمز الـ OTP (4 أرقام):
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center text-lg font-mono font-black text-slate-900 tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      المبلغ المحصل نقداً (ج.م):
                    </label>
                    <input
                      type="number"
                      required
                      value={collectedCash}
                      onChange={(e) => setCollectedCash(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-base font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    تأكيد التسليم بنجاح وإغلاق البوليصة
                  </button>
                </div>
              </form>
            )}

            {/* Sub-form: Return Reason Form */}
            {isReturnStepOpen && (
              <form
                onSubmit={handleConfirmReturn}
                className="bg-white p-4 rounded-2xl border border-rose-300 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h5 className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>تسجيل تعذر التسليم / مرتجع</span>
                  </h5>
                  <button
                    type="button"
                    onClick={() => setIsReturnStepOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    سبب تعذر التسليم:
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="العميل طلب التأجيل ليوم غد">العميل طلب التأجيل ليوم غد</option>
                    <option value="العميل لا يجيب بعد 3 محاولات اتصال">
                      العميل لا يجيب بعد 3 محاولات اتصال
                    </option>
                    <option value="العميل رفض استلام الطرد لاختلاف المواصفات">
                      العميل رفض استلام الطرد لاختلاف المواصفات
                    </option>
                    <option value="العنوان خاطئ والعميل مغلق">العنوان خاطئ والعميل مغلق</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    تثبيت المرتجع وإخطار المستودع
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
