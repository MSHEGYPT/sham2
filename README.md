# 🚀 منظومة مشاوير للخدمات اللوجستية والشحن الذكي (Sanad Logistics)

منصة متكاملة لإدارة العمليات اللوجستية، الشحن والتوصيل الفوري، جدولة الاستلامات، والتوجيه الميداني الذكي للمناديب بنظام الحماية ضد الفساد (Zero Corruption) مع الذكاء الاصطناعي ومكتبة خرائط Leaflet التفاعلية.

---

## 🛠️ متطلبات التشغيل (Prerequisites)

- **Node.js**: الإصدار 18 فما فوق (يوصى بـ Node.js 20 LTS أو 22).
- **مدير الحزم**: npm (الإصدار 9 أو 10).

---

## 💻 التشغيل المحلي بعد التحميل (Local Setup)

بعد تنزيل المشروع أو استنساخه من GitHub:

```bash
# 1. الدخول إلى مجلد المشروع
cd sanad-logistics

# 2. تثبيت الحزم والمكتبات
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env
# قم بفتح ملف .env وإضافة مفتاح Gemini API:
# GEMINI_API_KEY=AIzaSy...

# 4. تشغيل خادم التطوير
npm run dev
```

افتح المتصفح على: `http://localhost:3000`

---

## 📦 بناء ونشر المشروع للإنتاج (Production Build)

```bash
# بناء ملفات الواجهة الأمامية (Vite)
npm run build

# تشغيل خادم الإنتاج الكامل (Express + API + Static SPA)
npm start
```

---

## 🌐 النشر على GitHub Pages (Deployment to GitHub Pages)

المشروع يحتوي على سير عمل آلي جاهز في `.github/workflows/deploy.yml`. لتفعيله بنجاح:

1. ادخل إلى مستودع المشروع على **GitHub**.
2. اذهب إلى **Settings** (الإعدادات) > **Pages**.
3. في خيار **Build and deployment > Source**:
   - اختر **GitHub Actions** (بدلاً من *Deploy from a branch*).
4. بمجرد عمل `git push` لفرع `main` أو `master`، سيقوم GitHub Actions ببناء ونشر الموقع تلقائياً.

---

## ☁️ النشر كخادم كامل Full-Stack (Render / Railway / VPS / Docker)

نظراً لأن المشروع يشتمل على مسارات ذكاء اصطناعي في الخلفية (`/api/ai/*`) عبر Express:

- **الأمر المخصص للبناء (Build Command)**: `npm run build`
- **الأمر المخصص للتشغيل (Start Command)**: `npm start`
- **المنفذ الافتراضي**: يُقرأ تلقائياً من `process.env.PORT` أو 3000.
- **متغيرات البيئة**:
  - `GEMINI_API_KEY`: مفتاح واجهة برمجة تطبيقات Google Gemini.
  - `NODE_ENV`: `production`

---

## 🔍 حل المشاكل الشائعة التي تم إصلاحها (Troubleshooting & Fixes)

1. **خطأ `ERESOLVE could not resolve dependency (esbuild)` أثناء `npm install`**:
   - تم حل تعارض حزم esbuild مع Vite 8 ومزامنة شجرة الاعتماديات داخل `package.json` وتوليد `package-lock.json` نظيف.
2. **خطأ `command not found: tsx` على منصات الإنتاج**:
   - تم نقل `tsx` إلى `dependencies` لضمان توفرها أثناء تشغيل `npm start` في بيئات الإنتاج.
3. **خطأ 404 عند تحديث الصفحات في GitHub Pages**:
   - تم ضبط مسار الأساس النسبي `base: './'` وإضافة `.nojekyll` ونسخ `index.html` إلى `404.html` لدعم مسارات SPA.

---

## 📱 الميزات الرئيسية في المنظومة

- **لوحة المندوب الميداني (Courier App)**: خريطة تفاعلية بتقنية Leaflet لعرض إحداثيات ومواقع استلام البضائع من التجار ومواقع تسليم الطرود للعملاء بدقة GPS ومحاكاة خط السير.
- **الجدولة الذكية (Operations Agenda)**: محرك ذكاء اصطناعي لاقتراح أفضل أوقات التوزيع بناءً على سيولة المرور وتوافر المناديب.
- **درع مكافحة الفساد والتسليم الآمن**: كود تحقق سري (OTP) يُطلب من العميل لمنع الادعاء الوهمي بالتسليم ومطابقة العهدة النقدية.
- **بوابة التاجر (Merchant Portal)**: تسوية كاش فورية خلال 24 ساعة عبر إنستاباي، بوالص الشحن، ورمز QR.
- **نظام إشعارات فورية (Toasts)**: تنبيهات حية لحظية للتجار والمناديب عند تغير حالة الطلب.
