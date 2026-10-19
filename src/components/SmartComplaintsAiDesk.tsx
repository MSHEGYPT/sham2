import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Bot,
  User,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Phone,
  Package,
  Building2,
  Truck,
  Sparkles,
  RefreshCw,
  Printer,
  X,
  ExternalLink,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { Shipment } from '../types';

interface SmartComplaintsAiDeskProps {
  onClose?: () => void;
  isModal?: boolean;
  prefilledTracking?: string;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'DIRECTOR';
  text: string;
  timestamp: string;
  actionsTaken?: string[];
  clarifyingQuestions?: string[];
  complaintTicket?: {
    ticketNumber: string;
    category: string;
    categoryAr: string;
    severity: string;
    severityAr: string;
    status: string;
    statusAr: string;
    summary: string;
    targetedEmployee?: string;
    actionDeadline?: string;
  };
  suggestedNextStep?: string;
}

export const SmartComplaintsAiDesk: React.FC<SmartComplaintsAiDeskProps> = ({
  onClose,
  isModal = false,
  prefilledTracking = '',
}) => {
  const {
    currentRole,
    currentUser,
    shipments,
    merchants,
    staff,
    addWhistleblowerReport,
    addAgendaTask,
  } = useLogistics();

  // Complainant profile state
  const [complainantName, setComplainantName] = useState(
    currentUser.name !== 'عميل المنصة (زائر وتتبع)' ? currentUser.name : ''
  );
  const [complainantPhone, setComplainantPhone] = useState(
    currentUser.emailOrPhone !== '01000000000' ? currentUser.emailOrPhone : ''
  );
  const [trackingNumber, setTrackingNumber] = useState(prefilledTracking);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [isLoggedToAdmin, setIsLoggedToAdmin] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-detect shipment if tracking number changes
  useEffect(() => {
    if (trackingNumber.trim()) {
      const found = shipments.find(
        (s) => s.trackingNumber.toUpperCase() === trackingNumber.trim().toUpperCase()
      );
      setSelectedShipment(found || null);
    } else {
      setSelectedShipment(null);
    }
  }, [trackingNumber, shipments]);

  // Initial welcome message from the Dispute Director
  useEffect(() => {
    const roleTitle =
      currentRole === 'MERCHANT'
        ? 'التاجر الشريك'
        : currentRole === 'COURIER'
        ? 'الزميل كابتن التوصيل'
        : 'العميل العزيز';

    const greeting = `أهلاً بك يا فندم. أنا "معتز الشناوي" - مدير إدارة حل النزاعات والشكاوى والنزاهة المؤسسية بشركة مشاوير للخدمات اللوجستية.
أنا هنا لأستمع إليك شخصياً، ومكتبي مفتوح لمناقشة أي مشكلة أو سلوك غير لائق واجهته بكل دقة وشفافية.

في شركة مشاوير، نطبق سياسة (صفر تسامح) مع أي تلاعب بالأسعار، أو طلب مبالغ خارج البوليصة، أو تأخير غير مبرر، أو سوء خلق من أي موظف.
تفضل بذكر تفاصيل ما حدث معك، وما هو رقم الشحنة أو اسم المندوب إن وُجد؟ حقك محفوظ وسأوضح لك فوراً الإجراءات الإدارية التي سنتخذها.`;

    setMessages([
      {
        id: 'msg-init',
        sender: 'DIRECTOR',
        text: greeting,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        actionsTaken: [
          'فتح قناة تواصل مباشرة مع الإدارة العليا للنزاهة المؤسسية.',
          'الاستعداد للتحقق الفوري من بيانات الشحنة والمندوب المكلف.',
        ],
      },
    ]);
  }, [currentRole]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: userText,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/complaint-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complainantRole: currentRole,
          complainantName: complainantName || 'صاحب الشكوى',
          complainantPhone: complainantPhone,
          trackingNumber: trackingNumber || selectedShipment?.trackingNumber,
          message: userText,
          history: messages.map((m) => ({
            sender: m.sender === 'USER' ? 'user' : 'agent',
            text: m.text,
          })),
          shipmentContext: selectedShipment
            ? {
                trackingNumber: selectedShipment.trackingNumber,
                merchant: selectedShipment.merchantName,
                recipient: selectedShipment.recipientName,
                status: selectedShipment.status,
                codAmount: selectedShipment.codAmount,
                courier: selectedShipment.assignedCourierName || 'غير مسند',
              }
            : null,
        }),
      });

      const data = await response.json();

      const newDirectorMsg: ChatMessage = {
        id: `dir-${Date.now()}`,
        sender: 'DIRECTOR',
        text: data.reply || 'تم استلام شكواك وجاري اتخاذ اللازم فوراً.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        actionsTaken: data.actionsTaken || [],
        clarifyingQuestions: data.clarifyingQuestions || [],
        complaintTicket: data.complaintTicket,
        suggestedNextStep: data.suggestedNextStep,
      };

      setMessages((prev) => [...prev, newDirectorMsg]);

      // If a complaint ticket was issued, register it directly into Admin Anti-Fraud logs!
      if (data.complaintTicket) {
        setActiveTicket(data.complaintTicket);

        // Map category
        let reportCategory: 'OVERCHARGING' | 'THEFT_TAMPERING' | 'HARASSMENT' | 'OTHER' = 'OTHER';
        if (data.complaintTicket.category === 'OVERCHARGING') reportCategory = 'OVERCHARGING';
        else if (data.complaintTicket.category === 'DAMAGED_PARCEL') reportCategory = 'THEFT_TAMPERING';
        else if (data.complaintTicket.category === 'UNAUTHORIZED_BEHAVIOR') reportCategory = 'HARASSMENT';

        // Add to whistleblower reports so Admin sees it in "درع النزاهة ومكافحة الفساد"
        addWhistleblowerReport({
          reporterType:
            currentRole === 'MERCHANT' ? 'MERCHANT' : currentRole === 'COURIER' ? 'STAFF' : 'CUSTOMER',
          reporterContact: complainantPhone || complainantName || 'شكوى عبر الذكاء الاصطناعي',
          targetEmployeeName:
            data.complaintTicket.targetedEmployee ||
            selectedShipment?.assignedCourierName ||
            'المندوب المسؤول عن الشحنة',
          category: reportCategory,
          description: `[شكوى رسمية صادرة برقم ${data.complaintTicket.ticketNumber}]: ${userText} | الإجراءات المقررة: ${data.actionsTaken?.join(' - ')}`,
          priority: data.complaintTicket.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        });

        // Add to Operations Agenda for immediate staff review
        addAgendaTask({
          title: `نزاع وشكوى رسمية: ${data.complaintTicket.ticketNumber} (${complainantName || 'عميل'})`,
          source: 'AI_CHAT',
          clientName: complainantName || 'صاحب الشكوى',
          clientPhone: complainantPhone,
          type: 'complaint_fraud',
          priority: data.complaintTicket.severity === 'CRITICAL' ? 'high' : 'medium',
          status: 'NEW',
          summary: `شكوى تم فحصها عبر مدير النزاعات: ${userText}`,
          suggestedAction: `متابعة تنفيذ الإجراءات الإدارية: ${data.actionsTaken?.[0] || 'التحقيق الفوري'}`,
        });

        setIsLoggedToAdmin(true);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `dir-err-${Date.now()}`,
          sender: 'DIRECTOR',
          text: 'أعتذر منك، حدث انقطاع بالاتصال لكن تم تقييد ملاحظتك وسيقوم فريق النزاهة بالتواصل معك فوراً.',
          timestamp: nowTime,
          actionsTaken: ['تم قيد الملاحظة وتوجيهها للمشرف الميداني.'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickIssue = (issueText: string) => {
    setInputMessage(issueText);
  };

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col ${
        isModal ? 'max-w-4xl w-full max-h-[90vh]' : 'w-full'
      }`}
    >
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md border-2 border-slate-800">
              <ShieldAlert className="w-6 h-6 text-slate-950" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                الشكاوى والدعم الفني الذكي
              </h2>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                إدارة النزاهة وحل النزاعات
              </span>
            </div>
            <p className="text-xs text-slate-300">
              بإشراف: <span className="text-amber-400 font-bold">أ. معتز الشناوي</span> (مدير النزاعات
              والشكاوى المباشر) - حماية 100% وحسم فوري
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTicket && (
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl text-xs font-mono font-bold">
              <FileText className="w-3.5 h-3.5" />
              <span>{activeTicket.ticketNumber}</span>
            </div>
          )}

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Top Banner: Verification Inputs (Complainant & Tracking) */}
      <div className="bg-slate-50 p-3.5 sm:p-4 border-b border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              اسم صاحب الشكوى:
            </label>
            <input
              type="text"
              value={complainantName}
              onChange={(e) => setComplainantName(e.target.value)}
              placeholder="الاسم الكامل أو اسم المتجر"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              رقم الهاتف للتواصل والمتابعة:
            </label>
            <input
              type="tel"
              value={complainantPhone}
              onChange={(e) => setComplainantPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              رقم الشحنة (إن وُجد):
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="مثال: SND-8120"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
            />
          </div>
        </div>

        {/* Shipment Match Preview Badge if available */}
        {selectedShipment && (
          <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-slate-900">
                الشحنة: {selectedShipment.trackingNumber}
              </span>
              <span className="text-slate-600">| المستلم: {selectedShipment.recipientName}</span>
              <span className="text-slate-600">| المبلغ: {selectedShipment.codAmount} ج.م</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-bold">
                المندوب: {selectedShipment.assignedCourierName || 'لم يُعين'}
              </span>
              <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md text-[11px] font-bold">
                الحالة: {selectedShipment.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[500px] min-h-[300px] bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
          >
            {/* Sender Label & Avatar */}
            <div className="flex items-center gap-2 mb-1 text-xs">
              {msg.sender === 'DIRECTOR' ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                    مشاوير
                  </div>
                  <span className="font-bold text-slate-900">أ. معتز الشناوي</span>
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  <span className="font-bold text-slate-900">{complainantName || 'صاحب الشكوى'}</span>
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                </>
              )}
            </div>

            {/* Bubble Content */}
            <div
              className={`max-w-2xl rounded-2xl p-4 shadow-xs text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'USER'
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {/* Operational & Administrative Actions Taken Banner */}
              {msg.actionsTaken && msg.actionsTaken.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-200/80 bg-slate-50 -mx-4 -mb-4 p-3.5 rounded-b-2xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>الإجراءات الإدارية والتشغيلية الفورية الجاري اتخاذها الآن:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {msg.actionsTaken.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clarifying Questions if requested */}
              {msg.clarifyingQuestions && msg.clarifyingQuestions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-amber-800 block mb-1">
                    أسئلة لتوضيح ملابسات الشكوى:
                  </span>
                  <div className="space-y-1">
                    {msg.clarifyingQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputMessage(q)}
                        className="text-right block w-full text-slate-700 hover:text-amber-700 bg-amber-50/50 hover:bg-amber-100/50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        • {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Complaint Ticket Dossier if generated */}
              {msg.complaintTicket && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 rounded-xl border border-slate-700 shadow-md">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-amber-400">
                          تذكرة شكوى رسمية معتمدة: {msg.complaintTicket.ticketNumber}
                        </span>
                      </div>
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {msg.complaintTicket.severityAr}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-400">التصنيف: </span>
                        <span className="text-white font-bold">{msg.complaintTicket.categoryAr}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">الحالة: </span>
                        <span className="text-emerald-400 font-bold">{msg.complaintTicket.statusAr}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">المشكو بحقه: </span>
                        <span className="text-white font-bold">
                          {msg.complaintTicket.targetedEmployee || 'المندوب المكلف'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">مهلة القرار: </span>
                        <span className="text-amber-300 font-bold">
                          {msg.complaintTicket.actionDeadline || 'خلال ساعتين'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-700 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        قُيدت مباشرة في درع النزاهة المركزي للإدارة
                      </span>

                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>طباعة التذكرة</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Step Advice */}
              {msg.suggestedNextStep && (
                <div className="mt-2.5 text-[11px] text-slate-600 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                  <span className="font-bold text-amber-900">توجيه الإدارة لك: </span>
                  <span>{msg.suggestedNextStep}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs bg-white p-3 rounded-2xl border border-slate-200 w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>أ. معتز الشناوي يراجع تفاصيل الشكوى وسجلات الشحنة والنظام...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Problem Selection Chips */}
      <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-slate-500 shrink-0">مواقف متكررة:</span>
        <button
          onClick={() => handleQuickIssue('المندوب طلب مني فلوس شحن زيادة عن المبلغ المكتوب في البوليصة')}
          className="text-[11px] bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
        >
          طلب مبالغ زيادة
        </button>
        <button
          onClick={() => handleQuickIssue('المندوب كلمني بأسلوب غير لائق ورفض ينتظر دقيقتين للمعاينة')}
          className="text-[11px] bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
        >
          سلوك غير لائق أو رفض المعاينة
        </button>
        <button
          onClick={() => handleQuickIssue('الشحنة متأخرة 3 أيام والمندوب قفل تليفونه')}
          className="text-[11px] bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
        >
          تأخير شديد وعدم رد
        </button>
        <button
          onClick={() => handleQuickIssue('الطرد وصل مفتوح ومحتوياته ناقصة أو متضررة')}
          className="text-[11px] bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
        >
          طرد تالف أو مفتوح
        </button>
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSendMessage} className="p-3.5 sm:p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="اكتب تفاصيل ما حدث معك بالتحديد وسيقوم أ. معتز بمناقشتك وحسم الأمر..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all font-medium disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <>
                <span>إرسال</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {isLoggedToAdmin && (
          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              تم توثيق الشكوى بنجاح وتوجيهها لدرع النزاهة المركزي للإدارة برقم التذكرة الرسمية.
            </span>
          </div>
        )}
      </form>
    </div>
  );
};
