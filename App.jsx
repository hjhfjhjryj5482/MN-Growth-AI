import React, { useState, useMemo, useEffect, useRef } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  LayoutDashboard, Sparkles, Megaphone, Users, Gift, Ticket, Star, Share2,
  BarChart3, Bot, FileText, Settings, Bell, Search, Sun, Moon, Plus,
  ChevronDown, TrendingUp, TrendingDown, Check, Calendar, MapPin, Instagram,
  MessageCircle, Send, QrCode, Crown, Zap, Clock, ArrowUpRight, ArrowDownRight,
  Download, Filter, X, Store, Facebook, Music2, Mail, Smartphone, RefreshCw,
  ThumbsUp, ThumbsDown, Copy, ChevronRight, Wand2, Image as ImageIcon,
  Upload, CheckCircle2, PhoneCall, Eye, EyeOff, Lock,
} from "lucide-react";

/* Turns any messy phone input into a wa.me-safe digit string. */
function toWaNumber(raw) {
  if (!raw) return "";
  let digits = String(raw).replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1); // default local -> NG country code
  return digits;
}
function waLink(phone, message) {
  const n = toWaNumber(phone);
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

// Simple local persistence — demo-level only. On this device/browser it "remembers";
// syncing a customer's own phone with the owner's dashboard needs a real backend/database.
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// A useState that transparently persists to localStorage under `key`, falling back to `fallback`.
// Safely reloads (instead of overwriting) when `key` itself changes — e.g. switching between businesses.
function usePersistedState(key, fallback) {
  const [value, setValue] = useState(() => lsGet(key, fallback));
  const keyRef = useRef(key);

  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      setValue(lsGet(key, fallback));
      return;
    }
    lsSet(key, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  return [value, setValue];
}

// Namespaces a storage key by business, so every restaurant/business added by the Author keeps fully separate data.
function bKey(base, businessId) {
  return `${base}::${businessId || "default"}`;
}

const DEFAULT_GOOGLE_REVIEW_LINK = "https://g.page/r/riversidecafe/review";

const DEFAULT_BUSINESSES = [{ id: "riverside-cafe", name: "Riverside Café" }];

function slugify(name, existingIds) {
  const base = (name || "business").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "business";
  let id = base;
  let n = 2;
  while (existingIds.includes(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

const REGISTRATION_KEY = "MN301546";
const AUTHOR_MASTER_PASSWORD = "MNFT-Owner-2026"; // change this to your own secret — only whoever knows it gets full control
const ROLES = [
  { key: "owner", label: "Business Owner", desc: "Manage your business, branches & campaigns", icon: "Store" },
  { key: "admin", label: "Author", desc: "Full platform control — password only, no public sign-up", icon: "Crown" },
];

/* ---------------------------------- THEME ---------------------------------- */

const THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root[data-mode="dark"]{
  --bg:#0E0B14; --bg-grad: radial-gradient(1200px 600px at 100% -10%, #221933 0%, #0E0B14 55%);
  --surface:#161222; --surface-2:#1D1729; --surface-3:#251E35;
  --border:#2C2438; --border-soft: rgba(255,255,255,0.06);
  --text:#F4EFE7; --text-dim:#B8AFC7; --muted:#8B84A0;
  --accent:#FF6B45; --accent-ink:#2A0E06; --accent-soft: rgba(255,107,69,0.14);
  --gold:#FFC24B; --gold-soft: rgba(255,194,75,0.14);
  --success:#57D99A; --success-soft: rgba(87,217,154,0.14);
  --danger:#FF6B6B; --danger-soft: rgba(255,107,107,0.14);
  --shadow: 0 20px 50px -20px rgba(0,0,0,0.6);
}
:root[data-mode="light"]{
  --bg:#FBF8F2; --bg-grad: radial-gradient(1200px 600px at 100% -10%, #FFE9D6 0%, #FBF8F2 55%);
  --surface:#FFFFFF; --surface-2:#F6F1E7; --surface-3:#F0E9DA;
  --border:#E9E1D0; --border-soft: rgba(20,15,5,0.06);
  --text:#211A14; --text-dim:#584C3E; --muted:#8A7C68;
  --accent:#E8582E; --accent-ink:#FFEFE6; --accent-soft: rgba(232,88,46,0.10);
  --gold:#B9791A; --gold-soft: rgba(185,121,26,0.12);
  --success:#209764; --success-soft: rgba(32,151,100,0.12);
  --danger:#D8483F; --danger-soft: rgba(216,72,63,0.12);
  --shadow: 0 20px 50px -25px rgba(60,40,10,0.25);
}
.mnft{ font-family:'Inter',sans-serif; background:var(--bg-grad); color:var(--text); }
.mnft .font-display{ font-family:'Fraunces',serif; }
.mnft .font-mono{ font-family:'JetBrains Mono',monospace; }
.mnft-scroll::-webkit-scrollbar{ width:8px; height:8px; }
.mnft-scroll::-webkit-scrollbar-thumb{ background:var(--border); border-radius:8px; }
.mnft-scroll::-webkit-scrollbar-track{ background:transparent; }

.card{ background:var(--surface); border:1px solid var(--border); border-radius:18px; box-shadow:var(--shadow); }
.card-soft{ background:var(--surface-2); border:1px solid var(--border-soft); border-radius:14px; }
.nav-item{ transition: background .15s ease, color .15s ease, transform .1s ease; }
.nav-item:hover{ background:var(--surface-2); }
.nav-item.active{ background:var(--accent-soft); color:var(--accent); }
.btn-primary{ background:var(--accent); color:#fff; transition: filter .15s ease, transform .1s ease; }
.btn-primary:hover{ filter:brightness(1.08); }
.btn-primary:active{ transform: scale(0.98); }
.btn-ghost{ background:var(--surface-2); border:1px solid var(--border); color:var(--text); transition: background .15s ease; }
.btn-ghost:hover{ background:var(--surface-3); }
.chip{ border:1px solid var(--border); background:var(--surface-2); }
.marquee-dot{ box-shadow:0 0 0 3px var(--success-soft); animation: pulse 2.2s ease-in-out infinite; }
@keyframes pulse{ 0%,100%{ opacity:1; } 50%{ opacity:.45; } }
.ticket-edge{ background-image: radial-gradient(circle at 0 50%, var(--bg) 6px, transparent 7px), radial-gradient(circle at 100% 50%, var(--bg) 6px, transparent 7px); }
.fade-in{ animation: fadeIn .35s ease both; }
@keyframes fadeIn{ from{ opacity:0; transform:translateY(6px);} to{opacity:1; transform:translateY(0);} }
.spark-underline{ position:relative; }
.grain-btn{ position:relative; overflow:hidden; }
.progress-track{ background:var(--surface-3); border-radius:999px; overflow:hidden; }
.progress-fill{ background: linear-gradient(90deg, var(--accent), var(--gold)); border-radius:999px; }
`;

/* ---------------------------------- MOCK DATA ---------------------------------- */

const growthSeries = [
  { m: "Feb", customers: 1120, returning: 640 },
  { m: "Mar", customers: 1265, returning: 705 },
  { m: "Apr", customers: 1340, returning: 760 },
  { m: "May", customers: 1510, returning: 845 },
  { m: "Jun", customers: 1690, returning: 920 },
  { m: "Jul", customers: 1932, returning: 1080 },
];

const campaignPerf = [
  { name: "WhatsApp", sent: 4200, converted: 612 },
  { name: "SMS", sent: 3100, converted: 340 },
  { name: "Email", sent: 5600, converted: 410 },
  { name: "Push", sent: 2800, converted: 265 },
];

const revenueMix = [
  { name: "Coupons", value: 34, color: "var(--accent)" },
  { name: "Loyalty", value: 26, color: "var(--gold)" },
  { name: "Flash Sales", value: 22, color: "var(--success)" },
  { name: "Referrals", value: 18, color: "#8E7CFF" },
];

const reviewTrend = [
  { m: "Feb", rating: 4.2, count: 18 },
  { m: "Mar", rating: 4.3, count: 24 },
  { m: "Apr", rating: 4.4, count: 31 },
  { m: "May", rating: 4.5, count: 40 },
  { m: "Jun", rating: 4.6, count: 52 },
  { m: "Jul", rating: 4.8, count: 61 },
];

const activity = [
  { icon: Star, text: "New 5★ Google review from Amara O.", time: "6m ago", tone: "gold" },
  { icon: Ticket, text: "Coupon WEEKEND20 redeemed 12 times today", time: "24m ago", tone: "accent" },
  { icon: Users, text: "38 new customers joined via referral link", time: "1h ago", tone: "success" },
  { icon: Megaphone, text: "WhatsApp campaign 'Friday Happy Hour' sent to 1,240 contacts", time: "2h ago", tone: "accent" },
  { icon: Gift, text: "142 loyalty points redeemed for free pastry", time: "3h ago", tone: "gold" },
];

const kpis = [
  { label: "Total Customers", value: "8,412", delta: "+12.4%", up: true, icon: Users },
  { label: "New Customers", value: "612", delta: "+8.1%", up: true, icon: Sparkles },
  { label: "Returning Customers", value: "1,080", delta: "+6.9%", up: true, icon: RefreshCw },
  { label: "Revenue from Promotions", value: "₦4.82M", delta: "+18.3%", up: true, icon: TrendingUp },
  { label: "Google Review Growth", value: "4.8 ★", delta: "+0.3", up: true, icon: Star },
  { label: "Coupon Usage", value: "1,904", delta: "-3.2%", up: false, icon: Ticket },
];

const customers = [
  { name: "Amara Okafor", phone: "2348031112223", tag: "VIP", segment: "Frequent Buyer", spend: "₦186,200", visits: 24, birthday: "Aug 14", fav: "Iced Latte" },
  { name: "Tunde Bello", phone: "2348022234455", tag: "New", segment: "First Purchase", spend: "₦8,500", visits: 1, birthday: "Nov 02", fav: "—" },
  { name: "Chiamaka Eze", phone: "2348033345566", tag: "Loyal", segment: "Monthly Regular", spend: "₦94,000", visits: 15, birthday: "Aug 03", fav: "Jollof Combo" },
  { name: "Ifeoma Nwosu", phone: "2348044456677", tag: "At Risk", segment: "Lapsing", spend: "₦52,300", visits: 6, birthday: "Jan 27", fav: "Suya Wrap" },
  { name: "David Okon", phone: "2348055567788", tag: "VIP", segment: "Frequent Buyer", spend: "₦241,900", visits: 31, birthday: "Aug 22", fav: "Espresso" },
  { name: "Blessing Umeh", phone: "2348066678899", tag: "Loyal", segment: "Monthly Regular", spend: "₦71,400", visits: 12, birthday: "May 09", fav: "Smoothie Bowl" },
];

const campaignsList = [
  { name: "Friday Happy Hour", channel: "WhatsApp", audience: "All Branches", status: "Sent", sent: 1240, opens: "68%", ctr: "22%" },
  { name: "Birthday Treats — August", channel: "SMS", audience: "Birthday this month", status: "Scheduled", sent: 214, opens: "—", ctr: "—" },
  { name: "Win-back: 30 days inactive", channel: "Email", audience: "Lapsing customers", status: "Running", sent: 890, opens: "41%", ctr: "9%" },
  { name: "New Menu Launch", channel: "Push", audience: "App users", status: "Draft", sent: 0, opens: "—", ctr: "—" },
  { name: "Weekend Flash Sale", channel: "WhatsApp", audience: "Frequent Buyers", status: "Sent", sent: 980, opens: "74%", ctr: "31%" },
];

const coupons = [
  { code: "WEEKEND20", type: "20% Off", used: "312 / 500", expiry: "Aug 31, 2026", status: "Active" },
  { code: "BOGOFRIYAY", type: "Buy 1 Get 1", used: "88 / 150", expiry: "Aug 08, 2026", status: "Active" },
  { code: "WELCOME10", type: "10% Off", used: "640 / ∞", expiry: "No expiry", status: "Active" },
  { code: "FLASH2H", type: "Flash Sale 30%", used: "205 / 200", expiry: "Expired", status: "Ended" },
];

const reviewsList = [
  { name: "Amara O.", rating: 5, text: "Best flat white in the neighborhood, staff remembered my order!", time: "6m ago" },
  { name: "Kelvin U.", rating: 5, text: "Quick service and the loyalty points actually add up fast.", time: "3h ago" },
  { name: "Ngozi A.", rating: 3, text: "Great coffee but the queue on Saturday mornings is long.", time: "1d ago", flagged: true },
  { name: "Sam O.", rating: 4, text: "Loved the new seasonal menu, will be back for the referral deal.", time: "2d ago" },
];

const referralLeaders = [
  { name: "Amara Okafor", invites: 18, rewardEarned: "₦18,000" },
  { name: "David Okon", invites: 14, rewardEarned: "₦14,000" },
  { name: "Chiamaka Eze", invites: 11, rewardEarned: "₦11,000" },
  { name: "Blessing Umeh", invites: 9, rewardEarned: "₦9,000" },
];

const reports = [
  { name: "Daily Performance Summary", period: "Aug 1, 2026", size: "212 KB" },
  { name: "Weekly Campaign Report", period: "Jul 25 – Jul 31, 2026", size: "1.1 MB" },
  { name: "Monthly Growth & ROI Report", period: "July 2026", size: "3.4 MB" },
];

const assistantThread = [
  { from: "ai", text: "Your returning-customer rate is up 6.9% this month — mostly driven by the loyalty points push. Want me to draft a campaign to convert your 214 at-risk customers before they lapse?" },
  { from: "user", text: "Yes, keep it short and offer something light." },
  { from: "ai", text: "Draft ready: a WhatsApp message offering a free pastry with any drink purchase, valid 7 days, sent to 214 customers inactive 21+ days. Estimated reach-to-redeem: 9–14%. Send now or schedule for 6:00 PM (peak open time)?" },
];

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "ai-marketing", label: "AI Marketing", icon: Sparkles },
  { key: "campaigns", label: "Campaigns", icon: Megaphone },
  { key: "customers", label: "Customers", icon: Users },
  { key: "promotions", label: "Promotions & Loyalty", icon: Gift },
  { key: "coupons", label: "Coupons", icon: Ticket },
  { key: "reviews", label: "Review Booster", icon: Star },
  { key: "referrals", label: "Referrals", icon: Share2 },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "assistant", label: "AI Assistant", icon: Bot },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "settings", label: "Business Profile", icon: Settings },
];

/* ---------------------------------- SMALL UI PARTS ---------------------------------- */

function Pill({ children, tone = "muted" }) {
  const map = {
    muted: { bg: "var(--surface-3)", fg: "var(--text-dim)" },
    accent: { bg: "var(--accent-soft)", fg: "var(--accent)" },
    gold: { bg: "var(--gold-soft)", fg: "var(--gold)" },
    success: { bg: "var(--success-soft)", fg: "var(--success)" },
    danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
  };
  const c = map[tone] || map.muted;
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1"
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        {eyebrow && (
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-1.5"
            style={{ color: "var(--accent)" }}
          >
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl" style={{ color: "var(--text)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1.5 max-w-xl" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function KpiCard({ k }) {
  const Icon = k.icon;
  return (
    <div className="card p-5 relative overflow-hidden fade-in">
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Icon size={17} />
        </div>
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold font-mono"
          style={{ color: k.up ? "var(--success)" : "var(--danger)" }}
        >
          {k.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {k.delta}
        </span>
      </div>
      <div className="font-display text-3xl mt-4" style={{ color: "var(--text)" }}>
        {k.value}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
        {k.label}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="card-soft px-3 py-2 text-xs font-mono"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="mb-1 font-semibold" style={{ color: "var(--text)" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {p.value}{suffix}
        </div>
      ))}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose} />
      <div className="card w-full max-w-md p-6 relative fade-in mnft-scroll" style={{ maxHeight: "88vh", overflowY: "auto" }}>
        <button onClick={onClose} className="absolute right-4 top-4 btn-ghost w-8 h-8 rounded-lg flex items-center justify-center" aria-label="Close">
          <X size={15} />
        </button>
        <h3 className="font-display text-xl pr-8" style={{ color: "var(--text)" }}>{title}</h3>
        {subtitle && <p className="text-xs mt-1 mb-5" style={{ color: "var(--muted)" }}>{subtitle}</p>}
        {!subtitle && <div className="mb-4" />}
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function inputStyle() {
  return { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" };
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="card-soft px-4 py-3 mb-4 flex items-center gap-2.5 fade-in" style={{ borderColor: "var(--success)" }}>
      <CheckCircle2 size={15} style={{ color: "var(--success)" }} />
      <span className="text-xs" style={{ color: "var(--text)" }}>{message}</span>
    </div>
  );
}

/* ---------------------------------- SIDEBAR / TOPBAR ---------------------------------- */

function Sidebar({ active, setActive, collapsed, session, navItems, businesses, businessId, businessName, onSwitchBusiness }) {
  const isAuthor = session?.role === "admin";
  return (
    <aside
      className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 py-5"
      style={{
        width: collapsed ? 84 : 252,
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        transition: "width .2s ease",
      }}
    >
      <div className="flex items-center gap-2.5 px-5 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }}
        >
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-display text-base" style={{ color: "var(--text)" }}>MNFT Growth</div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted)" }}>AI Platform</div>
          </div>
        )}
      </div>

      {!collapsed && isAuthor && businesses && businesses.length > 1 && (
        <div className="px-3 mb-4">
          <label className="text-[10px] font-semibold uppercase tracking-wide px-1" style={{ color: "var(--muted)" }}>Viewing business</label>
          <select
            value={businessId}
            onChange={(e) => onSwitchBusiness(e.target.value)}
            className="w-full mt-1.5 px-3 py-2 rounded-lg text-xs outline-none"
            style={inputStyle()}
          >
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto mnft-scroll">
        {(navItems || NAV).map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? "active" : ""}`}
              style={{ color: isActive ? "var(--accent)" : "var(--text-dim)" }}
              title={item.label}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mx-3 mt-4">
          <div className="card-soft p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full marquee-dot" style={{ background: "var(--success)" }} />
              <span className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                {businessName || "Business"}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {isAuthor
                ? `Author access · ${businesses ? businesses.length : 1} business${businesses && businesses.length > 1 ? "es" : ""} on this device`
                : "Business Owner access"}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

function Topbar({ title, mode, setMode, collapsed, setCollapsed, session, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readCount, setReadCount] = useState(() => lsGet("mnft_notifications_read_count", 0));
  const initials = (session?.name || "MO").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const unreadCount = Math.max(0, activity.length - readCount);

  function handleBellClick() {
    setNotifOpen((o) => !o);
    if (unreadCount > 0) {
      lsSet("mnft_notifications_read_count", activity.length);
      setReadCount(activity.length);
    }
  }

  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 md:px-8 py-4 backdrop-blur"
      style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg) 80%, transparent)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex btn-ghost w-9 h-9 rounded-lg items-center justify-center shrink-0"
        >
          <ChevronRight size={15} style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform .2s" }} />
        </button>
        <div className="relative hidden sm:block w-64 lg:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            placeholder="Search customers, campaigns, coupons…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {session?.role === "admin" && <Pill tone="gold"><Crown size={11}/>Admin</Pill>}
        <button
          onClick={() => setMode(mode === "dark" ? "light" : "dark")}
          className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center"
          aria-label="Toggle theme"
        >
          {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="relative">
          <button onClick={handleBellClick} className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center relative" aria-label="Notifications">
            <Bell size={16} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-72 card p-2 z-30 fade-in" onMouseLeave={() => setNotifOpen(false)}>
              <div className="px-3 py-2 mb-1 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Notifications</span>
                <button onClick={() => setNotifOpen(false)} className="btn-ghost w-6 h-6 rounded-md flex items-center justify-center"><X size={11} /></button>
              </div>
              <div className="max-h-72 overflow-y-auto mnft-scroll">
                {activity.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)]">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: `var(--${a.tone}-soft)`, color: `var(--${a.tone})` }}>
                        <Icon size={11} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs leading-snug" style={{ color: "var(--text-dim)" }}>{a.text}</p>
                        <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{a.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 rounded-full flex items-center justify-center font-display text-sm shrink-0"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {initials}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 w-52 card p-2 z-30 fade-in" onMouseLeave={() => setMenuOpen(false)}>
              <div className="px-3 py-2 mb-1" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{session?.name}</div>
                <div className="text-[11px] truncate" style={{ color: "var(--muted)" }}>{session?.email || (session?.role === "admin" ? "Super Admin" : "Business Owner")}</div>
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium"
                style={{ color: "var(--danger)" }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- SECTIONS ---------------------------------- */

function DashboardSection({ onNewCampaign, businessName }) {
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Growth overview"
        title={`Good afternoon, ${businessName}`}
        subtitle="Here's how your marketing is performing across all branches this month."
        action={
          <button onClick={onNewCampaign} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            <Plus size={15} /> New Campaign
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {kpis.map((k) => <KpiCard key={k.label} k={k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-lg">Customer Growth</h3>
            <div className="flex gap-4 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5" style={{ color: "var(--accent)" }}><span className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />New + Total</span>
              <span className="inline-flex items-center gap-1.5" style={{ color: "var(--gold)" }}><span className="w-2 h-2 rounded-full" style={{ background: "var(--gold)" }} />Returning</span>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Last 6 months, all branches combined</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthSeries} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="gCust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="customers" name="Customers" stroke="var(--accent)" fill="url(#gCust)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="returning" name="Returning" stroke="var(--gold)" fill="url(#gRet)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg mb-1">Promotion Revenue Mix</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Share of revenue by promo type</p>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3}>
                  {revenueMix.map((e, i) => <Cell key={i} fill={e.color} stroke="var(--surface)" strokeWidth={2} />)}
                </Pie>
                <Tooltip content={<CustomTooltip suffix="%" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {revenueMix.map((e) => (
              <div key={e.name} className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2" style={{ color: "var(--text-dim)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />{e.name}
                </span>
                <span className="font-mono" style={{ color: "var(--text)" }}>{e.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-lg mb-1">Campaign Performance</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Sent vs. converted, by channel</p>
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignPerf} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-2)" }} />
                <Bar dataKey="sent" name="Sent" fill="var(--surface-3)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="converted" name="Converted" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg mb-4">Live Activity</h3>
          <div className="space-y-4 mnft-scroll" style={{ maxHeight: 230, overflowY: "auto" }}>
            {activity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `var(--${a.tone}-soft)`, color: `var(--${a.tone})` }}
                  >
                    <Icon size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs leading-snug" style={{ color: "var(--text-dim)" }}>{a.text}</p>
                    <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{a.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const COUNTRIES = [
  {
    name: "Pakistan", tz: "PKT (UTC+5)",
    cities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Gujranwala", "Sialkot", "Hyderabad", "Bahawalpur", "Sargodha", "Sukkur", "Gujrat"],
  },
  { name: "Nigeria", tz: "WAT (UTC+1)", cities: ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan"] },
  { name: "Kenya", tz: "EAT (UTC+3)", cities: ["Nairobi", "Mombasa", "Kisumu"] },
  { name: "Ghana", tz: "GMT (UTC+0)", cities: ["Accra", "Kumasi"] },
  { name: "UAE", tz: "GST (UTC+4)", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { name: "United Kingdom", tz: "GMT/BST", cities: ["London", "Manchester", "Birmingham"] },
];

const PLATFORM_BASE_MINUTES = { Instagram: 19 * 60, Facebook: 13 * 60, TikTok: 20 * 60 + 30, WhatsApp: 12 * 60 + 30 };

// Every district gets its own slightly-offset peak window, deterministically, so it feels location-specific.
function bestTimeFor(cityIndex, platform, tz) {
  const base = PLATFORM_BASE_MINUTES[platform];
  const offset = (cityIndex * 11) % 45; // 0-44 minute deterministic spread per city
  const total = base + offset;
  let h = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm} ${tz}`;
}

// Turn the promo's keywords into a real, relevant background photo instead of a plain color block.
function detectImageCategory(text) {
  const t = (text || "").toLowerCase();
  if (/coffee|latte|espresso|cappuccino|tea\b/.test(t)) return "coffee,cafe";
  if (/burger|fries|fast\s?food/.test(t)) return "burger,fastfood";
  if (/pizza/.test(t)) return "pizza";
  if (/dessert|cake|pastry|sweet|ice\s?cream|bakery/.test(t)) return "dessert,bakery";
  if (/smoothie|juice|drink|cocktail|shake/.test(t)) return "smoothie,drink";
  if (/biryani|karahi|bbq|kebab|grill/.test(t)) return "grill,bbq";
  if (/sushi/.test(t)) return "sushi";
  return "restaurant,food";
}

// Pull the offer / headline out of whatever the user typed, instead of a fixed script.
function parsePromoPrompt(text) {
  const raw = (text || "").trim();
  const percentMatch = raw.match(/(\d{1,3})\s?%/);
  const amountMatch = raw.match(/(₦|\$|£|€)\s?([\d,]+)/);
  const bogo = /\bbogo\b|buy\s?1\s?get\s?1|buy one get one/i.test(raw);
  const flash = /flash sale|today only|few hours|limited time/i.test(raw);
  const freeMatch = raw.match(/free\s+([a-zA-Z ]{2,20})/i);

  let headline = "SPECIAL OFFER";
  if (percentMatch) headline = `${percentMatch[1]}% OFF`;
  else if (amountMatch) headline = `${amountMatch[1]}${amountMatch[2]} OFF`;
  else if (bogo) headline = "BUY 1 GET 1";
  else if (freeMatch) headline = `FREE ${freeMatch[1].trim().toUpperCase()}`;
  else if (flash) headline = "FLASH SALE";

  // Grab a short subtitle: strip the number/offer part, keep the rest as context
  let subtitle = raw
    .replace(/(\d{1,3})\s?%\s?off/i, "")
    .replace(/(₦|\$|£|€)\s?[\d,]+\s?off/i, "")
    .replace(/buy\s?1\s?get\s?1( free)?/i, "")
    .trim();
  if (!subtitle) subtitle = "Limited time offer";
  if (subtitle.length > 46) subtitle = subtitle.slice(0, 46).trim() + "…";

  return { headline, subtitle: subtitle.charAt(0).toUpperCase() + subtitle.slice(1), flash, raw: raw || "a special promotion" };
}

const TONE_OPENERS = {
  Playful: ["Okay but this is actually exciting —", "Small gist for you:", "Psst — good news alert:"],
  Elegant: ["A gentle reminder from us to you:", "This week, we're keeping it simple:", "An invitation, if you're free:"],
  Bold: ["STOP SCROLLING.", "This is not a drill —", "Big moves only:"],
};
const TONE_CLOSERS = {
  Playful: "See you soon, don't be shy 😊",
  Elegant: "We'd love to have you.",
  Bold: "Don't sleep on this. Move fast. 🔥",
};

function buildCaption({ promo, tone, platform, business }) {
  const opener = TONE_OPENERS[tone][Math.floor(Math.random() * TONE_OPENERS[tone].length)];
  const closer = TONE_CLOSERS[tone];
  const platformNote = platform === "TikTok" ? "Tap the link in bio to see it in action 🎥" : platform === "WhatsApp" ? "Reply YES and we'll save you a spot." : "Tag someone who needs to see this.";
  return `${opener} ${business} has ${promo.raw}. ${promo.flash ? "Only while stock/slots last!" : ""} ${platformNote} ${closer}`.replace(/\s+/g, " ").trim();
}

function buildHashtags(promo) {
  const base = ["#RiversideCafe"];
  if (promo.headline.includes("OFF")) base.push("#DealAlert");
  if (promo.flash) base.push("#FlashSale");
  base.push("#TreatYourself", "#LocalFavorite");
  return base.slice(0, 5);
}

const POSTER_THEMES = [
  { from: "var(--accent)", to: "var(--gold)" },
  { from: "#5B3CC4", to: "var(--accent)" },
  { from: "#0E7C66", to: "var(--gold)" },
];

// Canvas can't read CSS custom properties, so resolve var(--x) to a real color by asking the DOM.
function resolveCssColor(value) {
  if (typeof value !== "string" || !value.startsWith("var(")) return value;
  if (typeof window === "undefined") return "#FF6B45";
  const varName = value.slice(4, -1).trim();
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return resolved || "#FF6B45";
}

// Simple manual word-wrap for canvas text (canvas has no built-in wrapping).
function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = (text || "").split(" ");
  let line = "";
  const lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function AiMarketingSection({ businessName, businessId }) {
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("Playful");
  const [countryIdx, setCountryIdx] = useState(0);
  const [cityIdx, setCityIdx] = useState(0);
  const [prompt, setPrompt] = useState("Rainy-day 20% off hot drinks promotion, valid this week only.");
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPhones, setSelectedPhones] = useState(() => new Set());
  const [queue, setQueue] = useState(null); // { list, idx, sentCount }

  const customerList = lsGet(bKey("mnft_customers", businessId), customers).filter((c) => c.phone);

  function toggleSelect(phone) {
    setSelectedPhones((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedPhones((prev) => (prev.size === customerList.length ? new Set() : new Set(customerList.map((c) => c.phone))));
  }

  function startQueue() {
    const list = customerList.filter((c) => selectedPhones.has(c.phone));
    if (!list.length) return;
    setQueue({ list, idx: 0, sentCount: 0 });
    setShowShareModal(false);
  }

  function openCurrentInWhatsApp() {
    if (!queue) return;
    const c = queue.list[queue.idx];
    const message = `Hi ${c.name.split(" ")[0]}! ${generated.headline} — ${generated.subtitle} at ${businessName}. ${generated.caption}`;
    window.open(waLink(c.phone, message), "_blank");
  }

  function markSentAndNext() {
    setQueue((q) => {
      const nextIdx = q.idx + 1;
      if (nextIdx >= q.list.length) return null;
      return { ...q, idx: nextIdx, sentCount: q.sentCount + 1 };
    });
  }

  const platforms = [
    { name: "Instagram", icon: Instagram },
    { name: "Facebook", icon: Facebook },
    { name: "TikTok", icon: Music2 },
    { name: "WhatsApp", icon: MessageCircle },
  ];
  const country = COUNTRIES[countryIdx];
  const cityName = country.cities[cityIdx];

  function handleCountryChange(idx) {
    setCountryIdx(idx);
    setCityIdx(0);
  }

  function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setGenerated(null);
    setCopied(false);
    setTimeout(() => {
      const promo = parsePromoPrompt(prompt);
      const caption = buildCaption({ promo, tone, platform, business: businessName });
      const theme = POSTER_THEMES[Math.floor(Math.random() * POSTER_THEMES.length)];
      const category = detectImageCategory(promo.raw);
      setGenerated({
        headline: promo.headline,
        subtitle: promo.subtitle,
        caption,
        hashtags: buildHashtags(promo),
        bestTime: bestTimeFor(cityIdx, platform, country.tz),
        theme,
        posterImage: `https://loremflickr.com/800/800/${category}/all?random=${Date.now()}`,
      });
      setLoading(false);
    }, 900);
  }

  function handleCopy() {
    if (!generated) return;
    const text = `${generated.caption}\n\n${generated.hashtags.join(" ")}`;
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function downloadPoster() {
    if (!generated) return;
    const size = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Background gradient (same theme as the on-screen preview — always renders, no external-image risk).
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, resolveCssColor(generated.theme.from));
    grad.addColorStop(1, resolveCssColor(generated.theme.to));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Soft bottom-heavy dark overlay so text stays legible, matching the preview style.
    const overlay = ctx.createLinearGradient(0, 0, 0, size);
    overlay.addColorStop(0, "rgba(0,0,0,0.05)");
    overlay.addColorStop(0.55, "rgba(0,0,0,0.15)");
    overlay.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, size, size);

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch {}
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "600 28px Inter, sans-serif";
    ctx.fillText(businessName.toUpperCase(), size / 2, size * 0.38);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 84px Fraunces, serif";
    wrapCanvasText(ctx, generated.headline, size / 2, size * 0.5, size * 0.82, 92);

    ctx.font = "500 30px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    wrapCanvasText(ctx, generated.subtitle, size / 2, size * 0.66, size * 0.7, 40);

    ctx.font = "400 18px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("AI poster concept · MNFT Growth AI", size / 2, size - 40);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-poster.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="AI Marketing Studio"
        title="Generate on-brand promotions in seconds"
        subtitle="Describe the offer, pick a platform, tone & location — MNFT drafts the caption, poster, and the best time to post for that location."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="card p-6 lg:col-span-2 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Platform</label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {platforms.map((p) => {
                const Icon = p.icon;
                const isActive = platform === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => setPlatform(p.name)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-[11px] font-medium"
                    style={{
                      background: isActive ? "var(--accent-soft)" : "var(--surface-2)",
                      color: isActive ? "var(--accent)" : "var(--text-dim)",
                      border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    <Icon size={16} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Tone</label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {["Playful", "Elegant", "Bold"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: tone === t ? "var(--accent)" : "var(--surface-2)",
                    color: tone === t ? "#fff" : "var(--text-dim)",
                    border: `1px solid ${tone === t ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide inline-flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
              <MapPin size={12} /> Business Location
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <select
                value={countryIdx}
                onChange={(e) => handleCountryChange(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle()}
              >
                {COUNTRIES.map((c, i) => (
                  <option key={c.name} value={i}>{c.name}</option>
                ))}
              </select>
              <select
                value={cityIdx}
                onChange={(e) => setCityIdx(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle()}
              >
                {country.cities.map((city, i) => (
                  <option key={city} value={i}>{city}</option>
                ))}
              </select>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>
              Best posting time is calculated for {cityName}'s local peak-engagement window ({country.tz}).
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>What are we promoting?</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 30% off all smoothies this weekend, dine-in only"
              className="w-full mt-2 px-3.5 py-3 rounded-xl text-sm outline-none resize-none"
              style={inputStyle()}
            />
          </div>

          <button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ opacity: !prompt.trim() ? 0.6 : 1 }}>
            <Wand2 size={15} /> {loading ? "Generating…" : "Generate promotion"}
          </button>

          <div className="card-soft p-3.5 flex items-start gap-2.5">
            <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
              Suggested next campaign: <strong style={{ color: "var(--text)" }}>Happy Hour, Wed–Fri 4–6pm</strong> — based on your slowest traffic window this month.
            </p>
          </div>
        </div>

        <div className="card p-6 lg:col-span-3">
          <h3 className="font-display text-lg mb-4">Preview</h3>
          {!generated && !loading && (
            <div className="h-80 flex flex-col items-center justify-center text-center gap-3" style={{ color: "var(--muted)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <ImageIcon size={22} />
              </div>
              <p className="text-sm max-w-xs">Describe your offer on the left and generate — your caption, poster, and posting time will show up here.</p>
            </div>
          )}
          {loading && (
            <div className="h-80 flex flex-col items-center justify-center gap-3" style={{ color: "var(--muted)" }}>
              <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
              <p className="text-sm">Drafting your post…</p>
            </div>
          )}
          {generated && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 fade-in">
              <div className="flex flex-col gap-2">
                <div
                  className="aspect-square rounded-2xl relative overflow-hidden"
                  style={{ background: `linear-gradient(150deg, ${generated.theme.from} 0%, ${generated.theme.to} 100%)` }}
                >
                  <img
                    src={generated.posterImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(185deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.82) 100%)" }} />
                  <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
                    <span className="text-[10px] tracking-widest uppercase text-white/85 mb-2">{businessName}</span>
                    <span className="font-display text-3xl text-white leading-tight" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>{generated.headline}</span>
                    <span className="text-xs text-white/90 mt-3 px-4">{generated.subtitle}</span>
                    <span className="absolute bottom-3 right-3 text-[10px] text-white/70 font-mono">AI poster concept</span>
                  </div>
                </div>
                <button onClick={downloadPoster} className="btn-ghost py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                  <Download size={13}/> Download poster (PNG)
                </button>
              </div>
              <div className="flex flex-col">
                <div className="card-soft p-4 mb-3 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Caption for {platform}</span>
                    <button onClick={handleCopy} className="btn-ghost px-2 py-1 rounded-md text-[10px] inline-flex items-center gap-1">
                      {copied ? <><Check size={11}/>Copied</> : <><Copy size={11}/>Copy</>}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{generated.caption}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {generated.hashtags.map((h) => <Pill key={h} tone="accent">{h}</Pill>)}
                  </div>
                </div>
                <div className="card-soft p-4 flex items-center gap-2.5">
                  <Clock size={14} style={{ color: "var(--gold)" }} />
                  <div className="text-xs">
                    <span style={{ color: "var(--muted)" }}>Best time to post ({cityName}): </span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{generated.bestTime}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleGenerate} className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                    <RefreshCw size={12}/> Regenerate
                  </button>
                  <button onClick={() => setShowShareModal(true)} className="btn-ghost flex-1 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                    <MessageCircle size={12}/> Share to customers
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <Modal title="Share to customers" subtitle="WhatsApp only lets each person's chat send when they personally tap Send — pick who to message, then step through one tap at a time." onClose={() => setShowShareModal(false)}>
          {!customerList.length ? (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>No customers with a saved WhatsApp number yet. Add some from the Customers page first.</p>
          ) : (
            <>
              <button onClick={toggleSelectAll} className="text-xs font-semibold mb-3" style={{ color: "var(--accent)" }}>
                {selectedPhones.size === customerList.length ? "Unselect all" : "Select all"}
              </button>
              <div className="space-y-2 mb-4 mnft-scroll" style={{ maxHeight: 260, overflowY: "auto" }}>
                {customerList.map((c) => (
                  <label key={c.phone} className="card-soft p-3 flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedPhones.has(c.phone)} onChange={() => toggleSelect(c.phone)} className="w-4 h-4 shrink-0" />
                    <span className="text-sm" style={{ color: "var(--text)" }}>{c.name}</span>
                    <span className="text-xs font-mono ml-auto" style={{ color: "var(--muted)" }}>+{c.phone}</span>
                  </label>
                ))}
              </div>
              <button onClick={startQueue} disabled={!selectedPhones.size} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold" style={{ opacity: selectedPhones.size ? 1 : 0.5 }}>
                Start sending ({selectedPhones.size} selected)
              </button>
            </>
          )}
        </Modal>
      )}

      {queue && (
        <Modal title="Sending to customers" subtitle={`${queue.sentCount} of ${queue.list.length} sent so far`} onClose={() => setQueue(null)}>
          <div className="card-soft p-4 mb-4 text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 font-display text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              {queue.list[queue.idx].name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{queue.list[queue.idx].name}</div>
            <div className="text-xs font-mono" style={{ color: "var(--muted)" }}>+{queue.list[queue.idx].phone}</div>
          </div>
          <div className="progress-track h-1.5 mb-4"><div className="progress-fill h-1.5" style={{ width: `${(queue.sentCount / queue.list.length) * 100}%` }} /></div>
          <button onClick={openCurrentInWhatsApp} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 mb-2">
            <MessageCircle size={14} /> Open WhatsApp for {queue.list[queue.idx].name.split(" ")[0]}
          </button>
          <p className="text-[10px] text-center mb-3" style={{ color: "var(--muted)" }}>WhatsApp opens with the message ready — you just tap Send there, then come back here.</p>
          <button onClick={markSentAndNext} className="btn-ghost w-full py-2.5 rounded-xl text-xs font-semibold">
            {queue.idx + 1 >= queue.list.length ? "Done" : `Sent — next (${queue.list.length - queue.idx - 1} left)`}
          </button>
        </Modal>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const tone = status === "Sent" ? "success" : status === "Running" ? "accent" : status === "Scheduled" ? "gold" : status === "Ended" ? "danger" : "muted";
  return <Pill tone={tone}>{status}</Pill>;
}

function CampaignsSection({ businessId }) {
  const channelIcon = { WhatsApp: MessageCircle, SMS: Smartphone, Email: Mail, Push: Bell };
  const [list, setList] = usePersistedState(bKey("mnft_campaigns", businessId), campaignsList);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: "", channel: "WhatsApp", audience: "All Branches" });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setList((prev) => [
      { name: form.name.trim(), channel: form.channel, audience: form.audience, status: "Draft", sent: 0, opens: "—", ctr: "—" },
      ...prev,
    ]);
    setShowModal(false);
    setForm({ name: "", channel: "WhatsApp", audience: "All Branches" });
    setToast(`"${form.name.trim()}" campaign created as a draft`);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Campaign Manager"
        title="WhatsApp, SMS, Email & Push in one place"
        subtitle="Schedule, segment, and track every campaign across channels."
        action={<button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><Plus size={15}/>New Campaign</button>}
      />

      <Toast message={toast} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Campaigns", value: "7", icon: Megaphone },
          { label: "Messages Sent (30d)", value: "15,730", icon: Send },
          { label: "Avg. Open Rate", value: "58%", icon: TrendingUp },
          { label: "Avg. Conversion", value: "12.4%", icon: Zap },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5">
              <Icon size={16} style={{ color: "var(--accent)" }} />
              <div className="font-display text-2xl mt-3">{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-display text-lg">Campaign History</h3>
          <button className="btn-ghost px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5"><Filter size={12}/>Filter</button>
        </div>
        <div className="overflow-x-auto mnft-scroll">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr style={{ color: "var(--muted)" }} className="text-left text-xs uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Campaign</th>
                <th className="px-6 py-3 font-medium">Channel</th>
                <th className="px-6 py-3 font-medium">Audience</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Sent</th>
                <th className="px-6 py-3 font-medium">Open Rate</th>
                <th className="px-6 py-3 font-medium">CTR</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c, i) => {
                const Icon = channelIcon[c.channel];
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="px-6 py-3.5 font-medium" style={{ color: "var(--text)" }}>{c.name}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-dim)" }}>
                        <Icon size={13} /> {c.channel}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.audience}</td>
                    <td className="px-6 py-3.5"><StatusPill status={c.status} /></td>
                    <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.sent.toLocaleString()}</td>
                    <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.opens}</td>
                    <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.ctr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="New Campaign" subtitle="Draft a campaign — you can schedule it later." onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Campaign name">
              <input autoFocus value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Weekend Flash Sale" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()} />
            </Field>
            <Field label="Channel">
              <select value={form.channel} onChange={(e) => update("channel", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {["WhatsApp", "SMS", "Email", "Push"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Audience">
              <select value={form.audience} onChange={(e) => update("audience", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle()}>
                {["All Branches", "Frequent Buyers", "Lapsing customers", "Birthday this month", "App users"].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">Create draft</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function CustomersSection({ businessId, businessName }) {
  const [query, setQuery] = useState("");
  const [list, setList] = usePersistedState(bKey("mnft_customers", businessId), customers);
  const [importMsg, setImportMsg] = useState(null);
  const fileInputRef = useRef(null);

  const filtered = useMemo(
    () => list.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [query, list]
  );
  const tagTone = { VIP: "gold", New: "accent", Loyal: "success", "At Risk": "danger" };
