import React, { useState } from 'react';
import { Search, X, CheckCircle2, Clock, MapPin, Package, ShieldCheck } from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { Shipment } from '../types';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose }) => {
  const { getShipmentByTracking, shipments } = useLogistics();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Shipment | null>(null);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const found = getShipmentByTracking(query);
    setResult(found || null);
    setSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">تتبع شحنة لحظياً برقم البوليصة</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثال: SND-8041"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-slate-900 font-mono text-sm"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
            >
              بحث
            </button>
          </form>

          {/* Quick links to existing tracking numbers */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>نماذج للشحن:</span>
            {shipments.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setQuery(s.trackingNumber);
                  setResult(s);
                  setSearched(true);
                }}
                className="font-mono text-slate-800 font-bold underline cursor-pointer"
              >
                {s.trackingNumber}
              </button>
            ))}
          </div>

          {result && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">رقم البوليصة:</span>
                  <strong className="text-base font-mono text-slate-900">
                    {result.trackingNumber}
                  </strong>
                </div>
                <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px]">
                  {result.status === 'DELIVERED'
                    ? 'تم التسليم بنجاح ✓'
                    : result.status === 'OUT_FOR_DELIVERY'
                    ? 'مع المندوب في الطريق'
                    : 'قيد التجهيز بالمستودع'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">العميل المستلم:</span>
                  <strong className="text-slate-800">{result.recipientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">مبلغ التحصيل (COD):</span>
                  <strong className="text-slate-900 font-mono">{result.codAmount} ج.م</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-bold block mb-1">خط السير والتوثيق:</span>
                <div className="space-y-1.5">
                  {result.timeline.map((evt, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p>{evt.notes}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{evt.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {searched && !result && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-center font-bold">
              لا توجد شحنة مسجلة بهذا الرقم.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
