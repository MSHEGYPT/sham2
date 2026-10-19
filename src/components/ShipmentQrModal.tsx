import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  QrCode,
  ShieldCheck,
  Package,
  MapPin,
  Phone,
  Building,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { Shipment } from '../types';

interface ShipmentQrModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShipmentQrModal: React.FC<ShipmentQrModalProps> = ({ shipment, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shipment) {
      // The payload encoded in the QR code:
      // Includes the tracking number and a structured payload that can be parsed instantly by scanners
      const payload = JSON.stringify({
        trk: shipment.trackingNumber,
        cod: shipment.codAmount,
        mch: shipment.merchantName,
        rcp: shipment.recipientName,
        ph: shipment.recipientPhone,
        v: 1,
      });

      QRCode.toDataURL(payload, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#0f172a', // slate-900
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [shipment]);

  if (!isOpen || !shipment) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${shipment.trackingNumber}.png`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">طابع الشحن ورمز الـ QR الميداني</h3>
              <p className="text-[11px] text-slate-400">
                شحنة: <strong className="font-mono text-amber-300">{shipment.trackingNumber}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              title="طباعة الطابع اللاصق للشحنة"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              title="تحميل صورة رمز الـ QR"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Waybill Label Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div
            ref={printRef}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-white space-y-4 print:border-solid print:m-0 print:p-4"
          >
            {/* Top Label Brand */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 font-sans tracking-tight">
                  سَنَدْ لِلتَّوصِيلْ
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-bold">
                  EXPRESS
                </span>
              </div>
              <div className="text-left font-mono font-black text-base text-slate-900">
                {shipment.trackingNumber}
              </div>
            </div>

            {/* QR Code and Quick Scan Details */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center shrink-0">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${shipment.trackingNumber}`}
                    className="w-44 h-44 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                    جاري توليد الرمز...
                  </div>
                )}
                <span className="text-[10px] font-mono text-slate-500 font-bold mt-1.5 tracking-wider">
                  SCAN TO UPDATE STATUS
                </span>
              </div>

              {/* Waybill Critical Numbers */}
              <div className="space-y-3 flex-1 text-right w-full">
                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-900 font-medium block">
                    مبلغ التحصيل نقداً (COD):
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-900">
                    {shipment.codAmount} جنيه مصري
                  </div>
                  <span className="text-[10px] text-amber-700">شامل مصاريف الشحن والتسليم</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>رمز الأمان السري للعميل:</span>
                    <strong className="font-mono text-slate-900 bg-amber-100 px-1.5 py-0.5 rounded text-xs font-bold">
                      {shipment.otpSecret}
                    </strong>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    مطلوب من المندوب لمسحه وتأكيد التسليم
                  </div>
                </div>
              </div>
            </div>

            {/* Merchant and Recipient Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  المتجر الراسل:
                </span>
                <strong className="text-slate-900 text-xs block">{shipment.merchantName}</strong>
                <span className="font-mono text-slate-600 block">{shipment.merchantPhone}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  المستلم والوجهة:
                </span>
                <strong className="text-slate-900 text-xs block">{shipment.recipientName}</strong>
                <span className="font-mono text-slate-600 block">{shipment.recipientPhone}</span>
                <p className="text-[11px] text-slate-700 mt-0.5">
                  {shipment.city} - {shipment.district} - {shipment.address}
                </p>
              </div>
            </div>

            {/* Contents and Disclaimer */}
            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                المحتويات: <strong className="text-slate-800">{shipment.itemsDescription}</strong>
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>مؤمن بميثاق زيرو فساد</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>يستطيع المندوب توجيه كاميرا الماسح الضوئي لتحديث الحالة فورياً</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
