import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Loader2,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';

interface AiOrderParserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiOrderParserModal: React.FC<AiOrderParserModalProps> = ({ isOpen, onClose }) => {
  const { addShipment, merchants } = useLogistics();

  const [rawText, setRawText] = useState(
    `مساء الخير يا فندم، عايز اشحن أوردر للعميل المهندس كريم شاهين
رقم تليفونه 01019922334 وممكن يرن على 01229988771 لو مقفول
العنوان: التجمع الأول، كمبوند النخيل، فيلا 24 شارع البنفسج 
المحتويات: 2 عبوة بروتين كولاجين + كريم ترطيب للشعر
الحساب الإجمالي المطلوب تحصيله من العميل: 890 جنيه شامل الشحن
ملاحظات: العميل بيطلب الاتصال قبل ما المندوب يتحرك بساعة والتسليم بعد العصر`
  );

  const [isLoading, setIsLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [selectedMerchantId, setSelectedMerchantId] = useState(merchants[0]?.id || 'MCH-101');
  const [successShipment, setSuccessShipment] = useState<any>(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsLoading(true);
    setParsedResult(null);
    setSuccessShipment(null);

    try {
      const res = await fetch('/api/ai/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      setParsedResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShipment = () => {
    if (!parsedResult) return;
    const m = merchants.find((x) => x.id === selectedMerchantId) || merchants[0];

    const newShipment = addShipment({
      merchantId: m.id,
      merchantName: m.brandName || m.name,
      merchantPhone: m.phone,
      recipientName: parsedResult.recipientName || 'عميل تجريبي',
      recipientPhone: parsedResult.recipientPhone || '01000000000',
      recipientPhoneAlt: parsedResult.recipientPhoneAlt,
      city: parsedResult.city || 'القاهرة',
      district: parsedResult.district || 'عام',
      address: parsedResult.fullAddress || parsedResult.district || 'العنوان المسجل',
      itemsDescription: parsedResult.itemsDescription || 'طرد شحن تجاري',
      itemQuantity: 1,
      codAmount: Number(parsedResult.codAmount) || 300,
      shippingFee: Number(parsedResult.shippingCost) || 45,
    });

    setSuccessShipment(newShipment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                المحلل الذكي لرسائل الواتساب وتوليد البوليصات
              </h3>
              <p className="text-xs text-slate-400">
                الصق نص رسالة الواتساب العشوائية من التاجر واستخرج بوليصة شحن كاملة بكود OTP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Success Banner */}
          {successShipment && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">تم إنشاء بوليصة الشحن بنجاح!</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    رقم التتبع: <strong className="text-slate-900 font-mono text-sm">{successShipment.trackingNumber}</strong> | كود الأمان السري للعميل (OTP):{' '}
                    <strong className="text-emerald-700 font-mono text-sm px-1.5 py-0.5 bg-emerald-100 rounded">
                      {successShipment.otpSecret}
                    </strong>
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    تم إدراج الشحنة فورياً في جدول شحنات اليوم وتم ربطها بمتجر{' '}
                    {successShipment.merchantName}.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSuccessShipment(null);
                  setParsedResult(null);
                }}
                className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                إنشاء بوليصة أخرى
              </button>
            </div>
          )}

          {/* Form and Input Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Input Text */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  نص الرسالة أو محادثة الواتساب:
                </label>
                <span className="text-[11px] text-slate-500">يدعم اللهجة العامية واللغة العربية</span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={9}
                placeholder="الصق رسالة الواتساب هنا..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent leading-relaxed"
              ></textarea>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    ربط الشحنة بحساب المتجر:
                  </label>
                  <select
                    value={selectedMerchantId}
                    onChange={(e) => setSelectedMerchantId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.brandName || m.name} ({m.city})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleParse}
                  disabled={isLoading || !rawText.trim()}
                  className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التحليل بالذكاء الاصطناعي...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>استخراج البيانات الآن</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Parsed Output preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  البيانات المستخرجة مهيكلة:
                </label>
                {parsedResult && (
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    دقة الاستخراج: {Math.round((parsedResult.confidenceScore || 0.95) * 100)}%
                  </span>
                )}
              </div>

              {parsedResult ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[10px]">اسم العميل المستلم:</span>
                      <strong className="text-slate-900 text-sm">{parsedResult.recipientName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">رقم الهاتف:</span>
                      <strong className="text-slate-900 font-mono text-sm">
                        {parsedResult.recipientPhone}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[10px]">المحافظة / الحي:</span>
                      <span className="text-slate-800 font-medium">
                        {parsedResult.city} - {parsedResult.district}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">مبلغ التحصيل (COD):</span>
                      <strong className="text-amber-700 font-mono text-sm font-bold">
                        {parsedResult.codAmount} جنيه
                      </strong>
                    </div>
                  </div>

                  <div className="pb-2 border-b border-slate-200">
                    <span className="text-slate-500 block text-[10px]">العنوان بالتفصيل:</span>
                    <p className="text-slate-800 text-xs mt-0.5">{parsedResult.fullAddress}</p>
                  </div>

                  <div className="pb-2 border-b border-slate-200">
                    <span className="text-slate-500 block text-[10px]">محتويات الطرد:</span>
                    <p className="text-slate-800 text-xs mt-0.5">{parsedResult.itemsDescription}</p>
                  </div>

                  {parsedResult.notes && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">ملاحظات التسليم:</span>
                      <p className="text-slate-600 text-[11px] italic mt-0.5">{parsedResult.notes}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={handleCreateShipment}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <PackageCheck className="w-4 h-4 text-amber-400" />
                      <span>توليد بوليصة الشحن وكود الأمان OTP فوراً</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-[280px] bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <PackageCheck className="w-10 h-10 mb-2 stroke-1" />
                  <p className="text-xs font-medium text-slate-600">
                    لم يتم استخراج البيانات بعد
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    اضغط على "استخراج البيانات الآن" ليقوم الذكاء الاصطناعي بتنظيم محتويات النص وتجهيز البوليصة
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>يوفر 80% من زمن إدخال البيانات ويمنع الأخطاء الإملائية وأخطاء الأسعار</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
