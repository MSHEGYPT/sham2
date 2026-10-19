import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Coins,
  FileCheck,
  Eye,
  Sparkles,
  PhoneCall,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  MessageSquareWarning,
  Send,
  Loader2,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { FraudAnomaly } from '../types';
import { SmartComplaintsAiDesk } from './SmartComplaintsAiDesk';

export const ZeroCorruptionShield: React.FC = () => {
  const {
    fraudAnomalies,
    whistleblowerReports,
    staff,
    runAiFraudAudit,
    addWhistleblowerReport,
    recordCashDeposit,
  } = useLogistics();

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ANOMALIES' | 'COMPLAINTS' | 'WHISTLEBLOWER' | 'PILLARS'>('ANOMALIES');
  const [isComplaintsDeskModalOpen, setIsComplaintsDeskModalOpen] = useState(false);

  // Whistleblower report form state
  const [reportForm, setReportForm] = useState({
    reporterType: 'CUSTOMER' as const,
    reporterContact: '',
    targetEmployeeName: '',
    category: 'OVERCHARGING' as const,
    description: '',
  });
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleRunAiAudit = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await runAiFraudAudit();
      setScanResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.targetEmployeeName || !reportForm.description) return;

    addWhistleblowerReport({
      reporterType: reportForm.reporterType,
      reporterContact: reportForm.reporterContact,
      targetEmployeeName: reportForm.targetEmployeeName,
      category: reportForm.category,
      description: reportForm.description,
      priority: 'HIGH',
    });

    setReportSuccess(true);
    setReportForm({
      reporterType: 'CUSTOMER',
      reporterContact: '',
      targetEmployeeName: '',
      category: 'OVERCHARGING',
      description: '',
    });

    setTimeout(() => setReportSuccess(false), 3000);
  };

  const pendingAnomalies = fraudAnomalies.filter((a) => a.status === 'PENDING_INVESTIGATION');
  const couriersWithAlerts = staff.filter((s) => s.fraudAlertsCount > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner: Zero-Corruption Commitment */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">
                Zero-Corruption Intelligence Core
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              درع النزاهة المؤسسي وكاشف السلوك الملتوي
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              منظومة رقابية مدعومة بالذكاء الاصطناعي لمراقبة حركة الأموال، ومنع التلاعب بالأسعار، وحظر
              التسليمات الوهمية عبر رموز الأمان السرية، وكشف أي تجاوزات فور حدوثها.
            </p>
          </div>

          <button
            onClick={handleRunAiAudit}
            disabled={isScanning}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>جاري الفحص الرقابي العميق...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>تشغيل التدقيق الذكي بالذكاء الاصطناعي</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Audit Scan Result Banner if available */}
      {scanResult && (
        <div className="bg-slate-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                تقرير التدقيق الرقابي الصادر عن Gemini AI:
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">مستوى المخاطر العامة:</span>
              <span
                className={`font-black px-2.5 py-0.5 rounded-full ${
                  scanResult.riskLevel === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800'
                    : scanResult.riskLevel === 'HIGH'
                    ? 'bg-orange-100 text-orange-800'
                    : scanResult.riskLevel === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {scanResult.riskLevel} (مؤشر الخطر: {scanResult.riskScore || 30}/100)
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            {scanResult.summaryAr}
          </p>

          {scanResult.recommendedActions && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1.5">
                الإجراءات والتدابير الرقابية الموصى بها:
              </span>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                {scanResult.recommendedActions.map((act: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scanResult.preventiveTip && (
            <div className="p-3 bg-amber-100/50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>نصيحة المدير التنفيذي لمنع الثغرات:</strong> {scanResult.preventiveTip}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">مؤشر النزاهة التشغيلي</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">99.4%</div>
          <div className="text-[11px] text-slate-500 mt-1">نسبة العمليات الموثقة بالكامل دون شبهات</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">شبهات قيد التحقيق المباشر</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{pendingAnomalies.length} حالات</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {couriersWithAlerts.length} مناديب تحت الملاحظة
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">التسليمات المشفرة بكود OTP</span>
            <Lock className="w-4 h-4 text-slate-800" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">100% إلزامي</div>
          <div className="text-[11px] text-slate-500 mt-1">حظر أي تسليم يدوي دون كود العميل</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">بلاغات النزاهة السرية</span>
            <MessageSquareWarning className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {whistleblowerReports.length} بلاغات
          </div>
          <div className="text-[11px] text-slate-500 mt-1">مقدمة من التجار والعملاء</div>
        </div>
      </div>

      {/* Tabs Control & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('ANOMALIES')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ANOMALIES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سجل الشبهات والسلوك الملتوي ({fraudAnomalies.length})
          </button>

          <button
            onClick={() => setActiveTab('COMPLAINTS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'COMPLAINTS'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            شكاوى النزاعات وتذاكر AI ({whistleblowerReports.length})
          </button>

          <button
            onClick={() => setActiveTab('WHISTLEBLOWER')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'WHISTLEBLOWER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            البلاغات السرية المباشرة
          </button>

          <button
            onClick={() => setActiveTab('PILLARS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'PILLARS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ركائز سياسة زيرو فساد
          </button>
        </div>

        {/* Action Button: Launch Smart Complaints AI Desk for Inspection */}
        <button
          onClick={() => setIsComplaintsDeskModalOpen(true)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>فتح مكتب النزاعات والشكاوى الذكي (أ. معتز)</span>
        </button>
      </div>

      {/* Tab 1: Anomalies Desk */}
      {activeTab === 'ANOMALIES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {fraudAnomalies.map((anom) => {
              const isCritical = anom.severity === 'CRITICAL';
              const isHigh = anom.severity === 'HIGH';

              return (
                <div key={anom.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700'
                            : isHigh
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <ShieldAlert className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{anom.description}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isCritical
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            خطورة {anom.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          الموظف المعني: <strong className="text-slate-800">{anom.employeeName}</strong>{' '}
                          {anom.shipmentTracking && (
                            <>
                              | الشحنة:{' '}
                              <strong className="text-slate-900 font-mono">
                                {anom.shipmentTracking}
                              </strong>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="text-[11px] font-mono text-slate-400 block">
                        {anom.timestamp}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block ${
                          anom.status === 'PENDING_INVESTIGATION'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {anom.status === 'PENDING_INVESTIGATION' ? 'قيد التحقيق' : 'تمت التسوية'}
                      </span>
                    </div>
                  </div>

                  {/* Evidence Box */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-800 block mb-0.5">
                      الدليل الرقمي المسجل بالسجلات:
                    </span>
                    <p className="font-mono text-[11px] text-slate-600">{anom.evidence}</p>
                    {anom.notes && (
                      <p className="mt-2 text-emerald-800 font-medium text-[11px]">
                        <strong>ملاحظات التسوية:</strong> {anom.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Complaints & AI Dispute Resolution Cases */}
      {activeTab === 'COMPLAINTS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-amber-400">
                  غرفة إدارة النزاعات والشكاوى الرسمية
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                تذاكر الشكاوى المعالجة بواسطة الذكاء الاصطناعي (أ. معتز الشناوي)
              </h3>
              <p className="text-xs text-slate-300 max-w-xl mt-1">
                يتم هنا قيد كافة الشكاوى الواردة من العملاء، والتجار، والمناديب الميدانيين مع التدابير
                الإدارية الفورية المتخذة لإحكام السيطرة ومنع التجاوزات.
              </p>
            </div>

            <button
              onClick={() => setIsComplaintsDeskModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>معاينة مكتب الشكاوى التفاعلي</span>
            </button>
          </div>

          {/* List of cases */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {whistleblowerReports.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                لا توجد شكاوى أو نزاعات مسجلة حالياً. مؤشر النزاهة 100%.
              </div>
            ) : (
              whistleblowerReports.map((rep) => {
                const isTicket = rep.description.includes('شكوى رسمية');
                return (
                  <div key={rep.id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                          <ShieldAlert className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-xs sm:text-sm">
                              {rep.id} - المشكو بحقه: {rep.targetEmployeeName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                rep.priority === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              أولوية: {rep.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            مقدم الشكوى: {rep.reporterContact || 'عميل المنصة'} | التاريخ: {rep.timestamp}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200 text-[11px]">
                          {rep.status === 'CONFIRMED'
                            ? 'تم التحقيق والجزاء'
                            : 'تحت التحقيق الفوري والمتابعة'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                      {rep.description}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>الإجراءات الإدارية: استدعاء GPS، تجميد الصرف، استدعاء الموظف للتحقيق</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alert(`تم إصدار قرار إداري رسمي للشأن ${rep.id} بتعويض الشاكي ومجازاة الموظف ${rep.targetEmployeeName}`)}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                        >
                          اتخاذ قرار إداري / تعويض
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Whistleblower Reports & Form */}
      {activeTab === 'WHISTLEBLOWER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports Log */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800">
              البلاغات الواردة من العملاء والتجار (مكفولة السرية التامة):
            </h3>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {whistleblowerReports.map((rep) => (
                <div key={rep.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      ضد الموظف: {rep.targetEmployeeName}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{rep.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{rep.description}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      المُبلّغ: {rep.reporterType === 'ANONYMOUS' ? 'مجهول' : rep.reporterContact || 'عميل'}
                    </span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {rep.status === 'CONFIRMED' ? 'تم اتخاذ إجراء وعقاب الموظف' : 'تحت فحص الإدارة'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit New Whistleblower Report Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4 text-rose-600" />
                تقديم بلاغ سري عن رشوة، طلب مبالغ زائدة، أو سوء سلوك
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تصل هذه البلاغات حصراً لهاتف المدير العام ولا يستطيع أي مشرف أو مندوب حذفها أو التستر عليها.
              </p>
            </div>

            {reportSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold text-center">
                ✓ تم إرسال البلاغ مباشرة لغرفة الرقابة المركزية وسيتم مراجعته وسماع التسجيلات فوراً.
              </div>
            )}

            <form onSubmit={handleSendReport} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">صفة المُبلّغ:</label>
                  <select
                    value={reportForm.reporterType}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, reporterType: e.target.value as any })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="CUSTOMER">عميل مستلم</option>
                    <option value="MERCHANT">تاجر أو متجر</option>
                    <option value="STAFF">موظف بالشركة</option>
                    <option value="ANONYMOUS">مجهول الهوية (حماية كاملة)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    هاتف للتواصل (اختياري):
                  </label>
                  <input
                    type="text"
                    value={reportForm.reporterContact}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, reporterContact: e.target.value })
                    }
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم الموظف أو المندوب:</label>
                  <input
                    type="text"
                    required
                    value={reportForm.targetEmployeeName}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, targetEmployeeName: e.target.value })
                    }
                    placeholder="مثال: كريم عبد العاطي"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">تصنيف المخالفة:</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, category: e.target.value as any })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="OVERCHARGING">طلب مبالغ زائدة عن الفاتورة</option>
                    <option value="BRIBERY">طلب رشوة أو إكرامية إجبارية</option>
                    <option value="THEFT_TAMPERING">فتح الطرد أو العبث بمحتوياته</option>
                    <option value="HARASSMENT">سوء معاملة أو أسلوب غير لائق</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  تفاصيل الواقعة ورقم الشحنة إن وجد:
                </label>
                <textarea
                  rows={4}
                  required
                  value={reportForm.description}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, description: e.target.value })
                  }
                  placeholder="اشرح ما حدث بالتفصيل والتوقيت ورقم بوليصة الشحنة SND-..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 leading-relaxed"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>إرسال البلاغ المشفر للإدارة العليا</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: The 4 Core Anti-Corruption Pillars */}
      {activeTab === 'PILLARS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              1. رمز التحقق السري للتسليم (OTP Mandatory Delivery Lock)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              لا يمكن لأي مندوب تغيير حالة الشحنة إلى "تم التسليم" أو إغلاق الرحلة إلا بإدخال رمز الـ
              OTP السري المكون من 4 أرقام والذي يصل في رسالة لهاتف العميل فقط. هذا يمنع ادعاء المندوب
              أنه سلم الشحنة أو أنه اتصل ولم يرد العميل.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              2. السقف المالي اللحظي للعهدة والتوريد اليومي
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              تحديد سقف إلزامي للنقدية (COD) في عهدة المندوب (مثلاً 3000 جنيه). بمجرد بلوغ السقف،
              يتوقف إسناد أي شحنات جديدة تلقائياً حتى يقوم المندوب بتوريد المبلغ لخزينة الشركة أو إيداعه
              في الحساب البنكي الرسمي مع إيصال معتمد.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              3. كاشف المرتجعات المشبوهة والتحقق المزدوج
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              عند تسجيل أي مرتجع، يقوم النظام بفحص الوقت المستغرق بين استلام المندوب للطرد وتسجيل
              المرتجع. إذا كان الوقت غير كافٍ لقطع المسافة جغرافياً، أو إذا تكرر تسجيل المرتجع بدون 3
              محاولات اتصال مثبتة، يُطلق النظام تنبيهاً أحمر ويقوم فريق خدمة العملاء بالتواصل مع العميل
              فوراً.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              4. سجل الرقابة الرقمي غير القابل للتعديل (Audit Trail)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              كل تغيير في حالة الشحنة أو مبلغ التحصيل أو موعد الاستلام يُسجل فيه اسم الموظف، تاريخه
              بالثانية، وعنوان جهازه. لا يملك أي موظف أو مشرف صلاحية مسح أي سجل أو تعديله رجعياً.
            </p>
          </div>
        </div>
      )}

      {/* Smart Complaints AI Desk Modal */}
      {isComplaintsDeskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <SmartComplaintsAiDesk
            isModal={true}
            onClose={() => setIsComplaintsDeskModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
