import { useState } from "react"
import { motion } from "framer-motion"
import type { FormEvent, ReactNode } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Factory,
  HelpCircle,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"

import { allServices, epoxyServices, insulationServices, type ServiceData } from "@/pages/epoxySiteData"

const PHONE_1 = "01111616805"
const PHONE_2 = "01013038360"
const WHATSAPP = "201111616805"
const EMAIL = "epoxsealasher@gmail.com"
const WHATSAPP_URL = `https://wa.me/${WHATSAPP}`

const trustPoints = ["معاينة مجانية", "ضمان على الأعمال", "أسعار تنافسية", "تنفيذ احترافي"]
const projectImages = ["/projects/admiral.jpeg", "/projects/jebal.jpeg", "/projects/kimo-cono.jpeg", "/projects/master-food.jpeg", "/projects/naguib-salim.jpeg", "/projects/tastino-food.jpeg"]

const staggerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const blockVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.9, 0.2, 1] } },
}

function buildWhatsappUrl(message: string) {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="mb-3 text-sm font-bold tracking-[0.24em] text-[#FF6F00]">{eyebrow}</p>
      <h2 className="text-3xl font-black leading-tight text-[#0B3D91] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
    </div>
  )
}

function TrustStrip() {
  return (
    <div className="border-b border-white/10 bg-[#0B3D91] text-white">
      <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 py-3 text-xs font-bold sm:px-6 lg:px-8 sm:text-sm">
        {trustPoints.map((point) => (
          <div key={point} className="flex min-w-max items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-[#FF6F00]" />
            <span>{point}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SiteHeader({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (value: boolean | ((current: boolean) => boolean)) => void }) {
  const navItems = [
    { label: "الرئيسية", href: "/#hero" },
    { label: "أنواع الإيبوكسي", href: "/#epoxy-services" },
    { label: "أنواع العزل", href: "/#insulation-services" },
    { label: "المشاريع", href: "/#projects" },
    { label: "طلب معاينة", href: "/free-survey" },
    { label: "الأسئلة الشائعة", href: "/faq" },
    { label: "سياسة الخصوصية", href: "/privacy" },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="/#hero" className="flex items-center gap-3 text-right">
          <img src="/logo.png" alt="إيبوكسي العاشر" className="h-12 w-12 rounded-2xl object-cover shadow-lg shadow-blue-500/15" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#5F6368]">Epoxy El Aasher</p>
            <h1 className="text-sm font-black leading-tight text-[#0B3D91] sm:text-lg">إيبوكسي العاشر للعزل وأنظمة أرضيات الإيبوكسي</h1>
          </div>
        </a>

        <nav className="hidden items-center gap-5 text-sm font-bold text-slate-700 lg:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-[#0B3D91]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href={buildWhatsappUrl("أرغب في معاينة مجانية لدى شركة إيبوكسي العاشر")} className="hidden rounded-full bg-[#FF6F00] px-4 py-2 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 sm:inline-flex">
            احجز معاينة مجانية الآن
          </a>
          <button type="button" aria-label="فتح القائمة" onClick={() => setMobileOpen((value) => !value)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#0B3D91] shadow-sm lg:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-[#1E88E5] hover:bg-blue-50">
                <span>{item.label}</span>
                <ArrowLeft className="h-4 w-4 text-[#1E88E5]" />
              </a>
            ))}
            <a href={`tel:${PHONE_1}`} className="mt-2 rounded-2xl bg-[#0B3D91] px-4 py-3 text-center text-sm font-black text-white">
              اتصال مباشر الآن
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}

function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-[#0B3D91] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <img src="/logo.png" alt="إيبوكسي العاشر" className="h-12 w-12 rounded-2xl object-cover" />
            <div>
              <h3 className="text-xl font-black">إيبوكسي العاشر</h3>
              <p className="text-sm text-white/75">العزل وأنظمة أرضيات الإيبوكسي</p>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/80">
            شركة متخصصة في تنفيذ أرضيات الإيبوكسي وأنظمة العزل للمصانع والمخازن والمستشفيات والجراجات والأسطح مع معاينة مجانية وضمان على الأعمال.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={buildWhatsappUrl("أرغب في التواصل مع إيبوكسي العاشر")} className="rounded-full bg-[#FF6F00] px-5 py-3 text-sm font-black text-white">
              واتساب مباشر
            </a>
            <a href={`tel:${PHONE_1}`} className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white">
              اتصال مباشر
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-black">بيانات التواصل</h4>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-3"><PhoneCall className="h-4 w-4 text-[#FF6F00]" /> {PHONE_1}</li>
            <li className="flex items-center gap-3"><PhoneCall className="h-4 w-4 text-[#FF6F00]" /> {PHONE_2}</li>
            <li className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-[#FF6F00]" /> {PHONE_1} (واتساب)</li>
            <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#FF6F00]" /> {EMAIL}</li>
            <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#FF6F00]" /> العاشر من رمضان - مجاورة 12 - قطعة 13 - شارع رفعت الجمال</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-black">روابط سريعة</h4>
          <div className="grid gap-3 text-sm text-white/80">
            <a href="/#epoxy-services" className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-[#FF6F00]" /> أنواع الإيبوكسي</a>
            <a href="/#insulation-services" className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-[#FF6F00]" /> أنواع العزل والأسعار</a>
            <a href="/faq" className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-[#FF6F00]" /> الأسئلة الشائعة</a>
            <a href="/privacy" className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-[#FF6F00]" /> سياسة الخصوصية</a>
            <a href="/sitemap" className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-[#FF6F00]" /> خريطة الموقع</a>
            <a href="/free-survey" className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-[#FF6F00]" /> طلب معاينة مجانية</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-white/60 sm:px-6 lg:px-8">© 2026 إيبوكسي العاشر للعزل وأنظمة أرضيات الإيبوكسي. جميع الحقوق محفوظة.</div>
    </footer>
  )
}

function FloatingActions() {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-3 sm:bottom-6 sm:left-6">
      <a href={buildWhatsappUrl("أرغب في حجز معاينة مجانية الآن")} className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-black text-white shadow-2xl shadow-green-500/30 transition hover:-translate-y-0.5">
        <MessageCircle className="h-5 w-5" /> واتساب
      </a>
      <a href={`tel:${PHONE_1}`} className="flex items-center gap-2 rounded-full bg-[#0B3D91] px-4 py-3 text-sm font-black text-white shadow-2xl shadow-blue-500/30 transition hover:-translate-y-0.5">
        <PhoneCall className="h-5 w-5" /> اتصال
      </a>
    </div>
  )
}

function PublicLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div dir="rtl" className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_36%,#eef5ff_100%)] text-slate-900">
      <TrustStrip />
      <SiteHeader mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main>{children}</main>
      <SiteFooter />
      <FloatingActions />
    </div>
  )
}

function HeroCollage() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {["/work/1.jpeg", "/work/2.jpeg", "/work/3.jpeg", "/work/4.jpeg"].map((image, index) => (
        <motion.div key={image} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className={`overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-2xl shadow-blue-900/10 ${index === 0 ? "sm:col-span-2" : ""}`}>
          <img src={image} alt="مشروع إيبوكسي" loading="lazy" className="h-44 w-full object-cover sm:h-52" />
        </motion.div>
      ))}
    </div>
  )
}

function SocialProof() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        "تنفيذ احترافي للمصانع والمنشآت الصناعية",
        "معاينة مجانية قبل التسعير",
        "ضمان على جميع الأعمال",
        "تواصل مباشر عبر واتساب أو الهاتف",
      ].map((item) => (
        <div key={item} className="rounded-[24px] border border-slate-200 bg-white p-5 text-sm font-bold leading-7 text-slate-700 shadow-sm">{item}</div>
      ))}
    </div>
  )
}

function ServiceListCard({ service }: { service: ServiceData }) {
  return (
    <motion.article variants={blockVariants} whileHover={{ y: -6 }} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="relative">
        <img src={service.cover} alt={service.title} loading="lazy" className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,61,145,0.1),rgba(11,61,145,0.82))]" />
        <div className="absolute bottom-0 right-0 left-0 p-5 text-white">
          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-white/80">{service.group === "epoxy" ? "أنظمة الإيبوكسي" : "أنظمة العزل"}</p>
          <h3 className="text-2xl font-black">{service.shortTitle}</h3>
          <p className="mt-2 text-sm text-white/90">{service.summary}</p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-[#0B3D91]">{service.price}</div>
        <div className="flex flex-wrap gap-2">
          <a href={service.path} className="inline-flex items-center gap-2 rounded-full bg-[#0B3D91] px-4 py-3 text-sm font-black text-white">تفاصيل الصفحة <ArrowLeft className="h-4 w-4" /></a>
          <a href={buildWhatsappUrl(`أود معرفة المزيد عن ${service.title}`)} className="inline-flex items-center gap-2 rounded-full border border-[#FF6F00] px-4 py-3 text-sm font-black text-[#FF6F00]">واتساب <ArrowUpRight className="h-4 w-4" /></a>
        </div>
      </div>
    </motion.article>
  )
}

function ServiceCatalogSection({ id, eyebrow, title, description, services, tone }: { id: string; eyebrow: string; title: string; description: string; services: ServiceData[]; tone: "light" | "white" }) {
  return (
    <section id={id} className={tone === "light" ? "bg-[#F8FBFF] py-14 sm:py-20" : "py-14 sm:py-20"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle eyebrow={eyebrow} title={title} description={description} />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => <ServiceListCard key={service.slug} service={service} />)}
        </div>
      </div>
    </section>
  )
}

function ProjectGallerySection() {
  return (
    <section id="projects" className="bg-[#F8FBFF] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="معرض الصور" title="أعمال حقيقية تعكس الجودة والالتزام" description="نعرض صورًا مختارة من مشاريع الشركة لدعم الثقة وإظهار مستوى التنفيذ في المواقع الصناعية المختلفة." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectImages.map((image, index) => (
            <motion.div key={image} variants={blockVariants} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <img src={image} alt={`مشروع ${index + 1}`} loading="lazy" className="h-64 w-full object-cover transition duration-500 hover:scale-[1.03]" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GuaranteeSection() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-6">
          <SectionTitle eyebrow="الضمان" title="شارة ضمان بارزة في جميع الصفحات" description="نبرز رسالة الضمان بشكل دائم مع أيقونة احترافية لتوضيح التزام الشركة بالجودة والمتابعة بعد التنفيذ." />
          <div className="rounded-[32px] bg-[#0B3D91] p-7 text-white shadow-[0_24px_60px_rgba(11,61,145,0.18)]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-10 w-10 text-[#FF6F00]" />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Guarantee</p>
                <p className="text-2xl font-black">ضمان على جميع أعمال إيبوكسي العاشر</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/80">معاينة مجانية، تسعير واضح، وتنفيذ صناعي يركز على الثقة وتحويل الزائر إلى عميل فعلي عبر الهاتف أو واتساب.</p>
          </div>
        </div>

        <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-[#0B3D91]">لماذا يختارنا العملاء الصناعيون؟</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "تصميم Mobile First سريع وواضح",
              "أزرار واتساب واتصال مباشر في كل صفحة",
              "صفحات منفصلة لكل خدمة لتسهيل التصفح",
              "محتوى سيو واضح لخدمات الإيبوكسي والعزل",
              "إمكانية إضافة مشاريع مستقبلية بسهولة",
              "نموذج معاينة مجانية لتوليد العملاء المحتملين",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[24px] bg-blue-50 p-4 text-sm font-bold leading-7 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-[#1E88E5]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function SurveyForm({ compact = false }: { compact?: boolean }) {
  const [form, setForm] = useState({ name: "", phone: "", city: "", area: "", service: "", notes: "" })

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = [
      "طلب معاينة مجانية من موقع إيبوكسي العاشر",
      `الاسم: ${form.name || "غير محدد"}`,
      `الهاتف: ${form.phone || "غير محدد"}`,
      `المدينة: ${form.city || "غير محددة"}`,
      `المساحة: ${form.area || "غير محددة"}`,
      `الخدمة: ${form.service || "غير محددة"}`,
      `ملاحظات: ${form.notes || "لا توجد"}`,
    ].join("\n")

    window.open(buildWhatsappUrl(message), "_blank", "noopener,noreferrer")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="mb-6 flex items-start gap-3 rounded-3xl bg-blue-50 p-4 text-[#0B3D91]">
        <Sparkles className="mt-1 h-5 w-5 flex-none text-[#FF6F00]" />
        <div>
          <h3 className="text-lg font-black">نموذج طلب معاينة مجانية</h3>
          <p className="mt-1 text-sm leading-7 text-slate-600">املأ البيانات التالية وسنفتح لك رسالة واتساب جاهزة بالتفاصيل.</p>
        </div>
      </div>

      <div className={compact ? "grid gap-4 sm:grid-cols-2" : "grid gap-4 md:grid-cols-2"}>
        <label className="grid gap-2 text-sm font-bold text-slate-700">الاسم<input value={form.name} onChange={(event) => updateField("name", event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#1E88E5]" placeholder="اسم العميل" /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">رقم الهاتف<input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#1E88E5]" placeholder="011..." /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">المدينة<input value={form.city} onChange={(event) => updateField("city", event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#1E88E5]" placeholder="القاهرة / الجيزة / ..." /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">المساحة التقريبية<input value={form.area} onChange={(event) => updateField("area", event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#1E88E5]" placeholder="مثال: 250 متر" /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">الخدمة المطلوبة
          <select value={form.service} onChange={(event) => updateField("service", event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#1E88E5]">
            <option value="">اختر الخدمة</option>
            {allServices.map((service) => <option key={service.slug} value={service.title}>{service.title}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">ملاحظات إضافية<textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows={compact ? 3 : 4} className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#1E88E5]" placeholder="أي تفاصيل تخص الموقع أو الموعد" /></label>
      </div>

      <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6F00] px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 sm:w-auto">
        احجز معاينة مجانية الآن
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </form>
  )
}

function ContactSurveySection() {
  return (
    <section className="bg-[#F8FBFF] py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <div className="space-y-5">
          <SectionTitle eyebrow="التواصل معنا" title="للاستفسار وحجز المعاينة" description="يمكنك الاتصال مباشرة أو إرسال رسالة واتساب أو تعبئة نموذج المعاينة المجانية للحصول على رد سريع." />
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <ul className="space-y-4 text-sm font-bold text-slate-700">
              <li className="flex items-center gap-3"><PhoneCall className="h-5 w-5 text-[#FF6F00]" /> هاتف: {PHONE_1}</li>
              <li className="flex items-center gap-3"><PhoneCall className="h-5 w-5 text-[#FF6F00]" /> هاتف: {PHONE_2}</li>
              <li className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-[#FF6F00]" /> واتساب مباشر: {PHONE_1}</li>
              <li className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#FF6F00]" /> البريد الإلكتروني: {EMAIL}</li>
              <li className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 text-[#FF6F00]" /> فيسبوك وإنستجرام: #إيبوكسي_العاشر_للخدمات_الصناعية_والعزل</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`tel:${PHONE_1}`} className="rounded-full bg-[#0B3D91] px-5 py-3 text-sm font-black text-white">اتصال مباشر</a>
              <a href={buildWhatsappUrl("أرغب في حجز معاينة مجانية الآن")} className="rounded-full bg-[#FF6F00] px-5 py-3 text-sm font-black text-white">احجز معاينة مجانية الآن</a>
            </div>
          </div>
        </div>
        <SurveyForm />
      </div>
    </section>
  )
}

function FaqPreviewSection() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="الأسئلة الشائعة" title="إجابات مختصرة تساعد العميل على اتخاذ القرار" description="صفحة مستقلة متاحة أيضًا من خلال القائمة الرئيسية لعرض أهم الأسئلة قبل طلب المعاينة." />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {[["هل توجد معاينة مجانية؟", "نعم، المعاينة مجانية قبل تقديم العرض النهائي."], ["هل يوجد ضمان على الأعمال؟", "نعم، يوجد ضمان واضح ومعلن على جميع أعمال إيبوكسي العاشر."], ["هل يمكن التنفيذ في المصانع والمستشفيات؟", "نعم، الموقع موجه للمواقع الصناعية والتجارية التي تتطلب جودة عالية."], ["هل يمكن إضافة مشاريع مستقبلية؟", "نعم، التصميم يدعم التوسع وإضافة أعمال جديدة بسهولة."]].map(([question, answer]) => (
            <div key={question} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-[#0B3D91]">{question}</h3>
              <p className="mt-3 text-sm leading-8 text-slate-600">{answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/faq" className="rounded-full border border-[#0B3D91] px-5 py-3 text-sm font-black text-[#0B3D91]">الانتقال إلى صفحة الأسئلة الشائعة</a>
          <a href="/sitemap" className="rounded-full bg-[#0B3D91] px-5 py-3 text-sm font-black text-white">خريطة الموقع</a>
        </div>
      </div>
    </section>
  )
}

function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,136,229,0.22),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,111,0,0.14),transparent_28%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-16">
        <motion.div initial="hidden" animate="show" variants={staggerVariants} className="space-y-6">
          <motion.div variants={blockVariants} className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-[#0B3D91] shadow-sm">
            <Factory className="h-4 w-4 text-[#FF6F00]" />
            شركة إيبوكسي العاشر للعزل وأنظمة أرضيات الإيبوكسي
          </motion.div>
          <motion.h2 variants={blockVariants} className="text-4xl font-black leading-tight text-[#0B3D91] sm:text-5xl lg:text-6xl">
            خبراء أرضيات الإيبوكسي والعزل للمصانع والمخازن والمستشفيات والجراجات والأسطح
          </motion.h2>
          <motion.p variants={blockVariants} className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            نقدم أفضل حلول أرضيات الإيبوكسي والعزل المائي والحراري بأعلى معايير الجودة مع ضمان على جميع الأعمال ومعاينة مجانية.
          </motion.p>
          <motion.div variants={blockVariants} className="flex flex-col gap-3 sm:flex-row">
            <a href="/free-survey" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6F00] px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/20">
              اطلب معاينة مجانية
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href={buildWhatsappUrl("أرغب في معاينة مجانية لدى شركة إيبوكسي العاشر")} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#0B3D91] px-6 py-4 text-sm font-black text-[#0B3D91]">تواصل عبر واتساب</a>
          </motion.div>
          <motion.div variants={blockVariants} className="grid gap-3 sm:grid-cols-3">
            {[
              "تنفيذ احترافي للمصانع والمخازن",
              "شريط ثابت للضمان والمعاينة",
              "سرعة تحميل وتجربة Mobile First",
            ].map((item) => <div key={item} className="rounded-[22px] border border-slate-200 bg-white p-4 text-sm font-bold leading-7 text-slate-700 shadow-sm">{item}</div>)}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="rounded-[36px] border border-white/70 bg-white/80 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur">
            <HeroCollage />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] bg-[#0B3D91] p-5 text-white">
                <p className="text-sm font-bold text-white/70">الهوية البصرية</p>
                <p className="mt-2 text-lg font-black">ثقة. جودة. احتراف صناعي.</p>
              </div>
              <div className="rounded-[24px] bg-[#FF6F00] p-5 text-white">
                <p className="text-sm font-bold text-white/80">استجابة مباشرة</p>
                <p className="mt-2 text-lg font-black">واتساب أو اتصال فوري</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function LandingPage() {
  return (
    <PublicLayout>
      <HeroSection />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SocialProof />
      </section>
      <ServiceCatalogSection id="epoxy-services" eyebrow="أنواع الإيبوكسي" title="اختر النظام المناسب لموقعك الصناعي" description="صفحات تفصيلية لكل نوع تشمل التعريف، أماكن الاستخدام، المميزات، العيوب، خطوات التنفيذ، الصور، الضمان، ووسائل التواصل المباشر." services={epoxyServices} tone="light" />
      <ServiceCatalogSection id="insulation-services" eyebrow="أنواع العزل والأسعار" title="حلول عزل مائي وحراري للمواقع الصناعية" description="صفحات مستقلة لخيارات العزل المختلفة مع عرض واضح للأسعار، الاستخدامات، تفاصيل التنفيذ، وصور المراحل." services={insulationServices} tone="white" />
      <ProjectGallerySection />
      <GuaranteeSection />
      <ContactSurveySection />
      <FaqPreviewSection />
    </PublicLayout>
  )
}

function ServiceDetailPage({ service }: { service: ServiceData }) {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <motion.div initial="hidden" animate="show" variants={staggerVariants} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div variants={blockVariants} className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-[#0B3D91]">
              <ShieldCheck className="h-4 w-4 text-[#FF6F00]" />
              ضمان على جميع أعمال إيبوكسي العاشر
            </div>
            <h1 className="text-3xl font-black leading-tight text-[#0B3D91] sm:text-5xl">{service.title}</h1>
            <p className="text-base leading-8 text-slate-600 sm:text-lg">{service.description}</p>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-full bg-blue-50 px-4 py-3 text-sm font-black text-[#0B3D91]">{service.price}</div>
              <div className="rounded-full bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">{service.seo}</div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={buildWhatsappUrl(`أرغب في معرفة تفاصيل ${service.title}`)} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6F00] px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/20">
                تواصل عبر واتساب
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href="/free-survey" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#0B3D91] px-6 py-4 text-sm font-black text-[#0B3D91]">
                طلب معاينة مجانية
              </a>
            </div>
          </motion.div>

          <motion.div variants={blockVariants} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <img src={service.cover} alt={service.title} className="min-h-[320px] w-full object-cover" />
          </motion.div>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <BulletCard title="أماكن الاستخدام" items={service.uses} />
          <BulletCard title="المميزات" items={service.benefits} accent="#1E88E5" />
          <BulletCard title="العيوب أو الملاحظات" items={service.drawbacks} accent="#5F6368" />
        </div>

        <section className="mt-14 space-y-6">
          <SectionTitle eyebrow="مراحل التنفيذ" title="خطوات العمل بشكل واضح" description="نوضح هنا المراحل الأساسية من التجهيز حتى التسليم النهائي مع التزام كامل بالجودة والمتابعة." />
          <ProcessTimeline steps={service.steps} />
        </section>

        <section className="mt-14 space-y-6">
          <SectionTitle eyebrow="صور تفصيلية" title="معرض صور لكل مرحلة" description="صور توضيحية تساعد العميل على فهم طبيعة التنفيذ وجودة التشطيب قبل الحجز." />
          <PhotoGrid images={service.heroImages} />
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-[#0B3D91]">شعار الضمان</h2>
            <div className="mt-5 rounded-[28px] bg-[#0B3D91] p-6 text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-[#FF6F00]" />
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Guarantee</p>
                  <p className="text-xl font-black">ضمان على جميع أعمال إيبوكسي العاشر</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/80">نلتزم بالجودة في الخامات والتجهيز والتنفيذ، مع معاينة مجانية قبل بدء العمل وتواصل مباشر حتى التسليم.</p>
            </div>
          </div>

          <SurveyForm compact />
        </section>
      </section>
    </PublicLayout>
  )
}

function BulletCard({ title, items, accent = "#0B3D91" }: { title: string; items: string[]; accent?: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-black" style={{ color: accent }}>{title}</h3>
      <ul className="space-y-3 text-sm leading-7 text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-[#1E88E5]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProcessTimeline({ steps }: { steps: string[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {steps.map((step, index) => (
        <div key={step} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-[#0B3D91]">{index + 1}</div>
          <p className="text-sm font-bold leading-7 text-slate-700">{step}</p>
        </div>
      ))}
    </div>
  )
}

function PhotoGrid({ images }: { images: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {images.map((image, index) => (
        <motion.figure key={image} variants={blockVariants} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <img src={image} alt={`صورة توضيحية ${index + 1}`} loading="lazy" className="h-44 w-full object-cover" />
        </motion.figure>
      ))}
    </div>
  )
}

function FaqPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="الأسئلة الشائعة" title="إجابات سريعة وواضحة" description="الهدف هنا تقليل التردد ودفع العميل للتواصل المباشر بثقة ووضوح." />
        <div className="mt-10 space-y-4">
          {[["هل التصميم مناسب للموبايل؟", "نعم، تم بناؤه Mobile First ليعمل بسلاسة على الهواتف والأجهزة اللوحية وأجهزة الكمبيوتر."], ["هل توجد صفحات منفصلة لكل خدمة؟", "نعم، كل خدمة لها صفحة تفصيلية مستقلة مع المحتوى والمراحل والصور والاتصال المباشر."], ["هل يمكن إضافة مشاريع جديدة لاحقًا؟", "نعم، البنية الحالية تدعم إضافة مشاريع وصور وخدمات إضافية بسهولة."], ["كيف يتم حجز المعاينة المجانية؟", "من زر واتساب أو نموذج المعاينة المجانية أو بالاتصال المباشر على الأرقام الموجودة بالموقع."], ["هل يوجد زر واتساب عائم؟", "نعم، يظهر زر واتساب وزر اتصال مباشر في جميع الصفحات لتسهيل التحويل."]].map(([question, answer]) => (
            <details key={question} className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-right text-lg font-black text-[#0B3D91]">
                <span>{question}</span>
                <HelpCircle className="h-5 w-5 text-[#FF6F00] transition group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-sm leading-8 text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </PublicLayout>
  )
}

function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="سياسة الخصوصية" title="كيف نتعامل مع بياناتك" description="هذه صفحة تعريفية مبسطة توضح استخدام بيانات التواصل فقط لأغراض الرد على الطلبات وتنفيذ المعاينة والخدمة." />
        <div className="mt-10 space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm leading-8 text-slate-700">نستخدم بيانات الاسم ورقم الهاتف والعنوان التقريبي والخدمة المطلوبة فقط للرد على طلبات المعاينة وتقديم العرض المناسب والتواصل أثناء التنفيذ.</p>
          <p className="text-sm leading-8 text-slate-700">لا نعرض بياناتك للغير إلا عند الحاجة التشغيلية المرتبطة بالخدمة، ونحتفظ بها بالقدر اللازم لإدارة الطلبات وتحسين التجربة.</p>
          <p className="text-sm leading-8 text-slate-700">يمكنك التواصل مباشرة عبر الهاتف أو واتساب في أي وقت لتحديث بياناتك أو طلب حذفها من سجل المتابعة الخاص بنا.</p>
        </div>
      </section>
    </PublicLayout>
  )
}

function SitemapPage() {
  const groups = [
    { title: "الصفحات الأساسية", links: [["الرئيسية", "/"], ["طلب معاينة مجانية", "/free-survey"], ["الأسئلة الشائعة", "/faq"], ["سياسة الخصوصية", "/privacy"]] },
    { title: "صفحات الإيبوكسي", links: epoxyServices.map((service) => [service.title, service.path]) },
    { title: "صفحات العزل", links: insulationServices.map((service) => [service.title, service.path]) },
  ]

  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="خريطة الموقع" title="الوصول السريع إلى كل صفحة" description="هذه الصفحة تساعد الزائر ومحركات البحث على التنقل بين صفحات الخدمات والمحتوى التعريفي بسهولة." />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-black text-[#0B3D91]">{group.title}</h3>
              <div className="space-y-3 text-sm font-bold text-slate-700">
                {group.links.map(([label, href]) => (
                  <a key={href} href={href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                    <span>{label}</span>
                    <ArrowLeft className="h-4 w-4 text-[#1E88E5]" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  )
}

function FreeSurveyPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="طلب معاينة مجانية" title="احجز معاينة مجانية الآن" description="املأ بياناتك وسنرسل رسالة واتساب جاهزة للتواصل المباشر وتحديد موعد المعاينة." />
        <div className="mt-10"><SurveyForm /></div>
      </section>
    </PublicLayout>
  )
}

export { FaqPage, FreeSurveyPage, LandingPage, PrivacyPage, ServiceDetailPage, SitemapPage }
