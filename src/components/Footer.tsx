import React from 'react';
import { Truck, ShieldCheck, Phone, Mail, MapPin, Heart } from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';

export const Footer: React.FC = () => {
  const { setCurrentRole } = useLogistics();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-20 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-white">مَشَاوِيرْ للخدمات اللوجستية</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              منظومة متكاملة للتوصيل الذكي وحماية حقوق التجار والعملاء بميثاق "زيرو فساد" والتحقق برمز
              الأمان الرقمي المشفر.
            </p>
          </div>

          {/* Quick Portals */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm mb-3">بوابات النظام</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentRole('ADMIN')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  لوحة تحكم الإدارة والعمليات
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentRole('COURIER')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  تطبيق المندوب الميداني (تسليم بـ OTP)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentRole('MERCHANT')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  بوابة التاجر والمتاجر الإلكترونية
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentRole('CUSTOMER')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  بوابة تتبع الشحنات العامة
                </button>
              </li>
            </ul>
          </div>

          {/* Zero Corruption Guarantees */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm mb-3">ميثاق الرقابة والأمانة</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>تحقق إلزامي بكود OTP السري</span>
              </li>
              <li>توريد يومي لكاش الـ COD دون تأخير</li>
              <li>فحص تلقائي للمرتجعات بالذكاء الاصطناعي</li>
              <li>خط ساخن مباشر للبلاغات والنزاهة</li>
            </ul>
          </div>

          {/* Contact and Coverage */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm mb-3">التواصل والتغطية</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>المقر الرئيسي: القاهرة الكبرى - فرع العمليات المركزي</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <span className="font-mono">الخط الساخن: 19804 / 01011122334</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="font-mono">support@mashaweer-logistics.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© 2026 مشاوير للخدمات اللوجستية وإدارة التوصيل. جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1">
            <span>صُممت المنظومة بمعايير مكافحة الفساد والأمانة المؤسسية</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
