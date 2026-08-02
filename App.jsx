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

/* ---------------------------------- SIDEBAR / TOPBAR ---------------------------------- */

function Sidebar({ active, setActive, collapsed, session }) {
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

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto mnft-scroll">
        {NAV.map((item) => {
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
              <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                {session?.role === "admin" ? "Super Admin" : "Riverside Café"}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {session?.role === "admin"
                ? "Platform-wide access · All businesses"
                : "3 branches connected · Plan: Growth Pro"}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

function Topbar({ title, mode, setMode, collapsed, setCollapsed, session, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (session?.name || "MO").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

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
        <button className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
        </button>
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

function DashboardSection() {
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Growth overview"
        title="Good afternoon, Riverside Café"
        subtitle="Here's how your marketing is performing across all branches this month."
        action={
          <button className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
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

function AiMarketingSection() {
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("Playful");
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);

  const platforms = [
    { name: "Instagram", icon: Instagram },
    { name: "Facebook", icon: Facebook },
    { name: "TikTok", icon: Music2 },
    { name: "WhatsApp", icon: MessageCircle },
  ];

  const captionBank = {
    Playful: `Rainy Lagos afternoons call for something warm ☕ Swing by Riverside Café before 5pm and get 20% off any hot drink — because you deserve a little sunshine in a cup. See you soon! #RiversideCafe #LagosEats`,
    Elegant: `A quiet moment, a well-made drink. Join us this week at Riverside Café for a curated seasonal menu crafted for slow afternoons. Reserve your table today.`,
    Bold: `NEW MENU. NEW ENERGY. Riverside Café just leveled up — first 100 customers this week get a free upgrade on any order. Don't sleep on this. 🔥`,
  };

  function handleGenerate() {
    setLoading(true);
    setGenerated(null);
    setTimeout(() => {
      setGenerated({
        caption: captionBank[tone] || captionBank.Playful,
        bestTime: platform === "TikTok" ? "7:30 PM (peak engagement)" : platform === "WhatsApp" ? "12:15 PM (lunch break)" : "6:45 PM (after-work scroll)",
        hashtags: ["#RiversideCafe", "#LagosCoffee", "#TreatYourself", "#WeekendVibes"],
      });
      setLoading(false);
    }, 900);
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="AI Marketing Studio"
        title="Generate on-brand promotions in seconds"
        subtitle="Pick a platform and tone — MNFT drafts the caption, poster concept, and best time to post."
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
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>What are we promoting?</label>
            <textarea
              rows={3}
              defaultValue="Rainy-day 20% off hot drinks promotion, valid this week only."
              className="w-full mt-2 px-3.5 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <button onClick={handleGenerate} className="btn-primary w-full py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2">
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
              <p className="text-sm max-w-xs">Your AI-generated caption, poster concept, and posting time will show up here.</p>
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
              <div
                className="aspect-square rounded-2xl flex flex-col items-center justify-center text-center p-6 relative overflow-hidden"
                style={{ background: "linear-gradient(150deg, var(--accent) 0%, var(--gold) 100%)" }}
              >
                <span className="text-[10px] tracking-widest uppercase text-white/80 mb-2">Riverside Café</span>
                <span className="font-display text-3xl text-white leading-tight">20% OFF<br/>Hot Drinks</span>
                <span className="text-xs text-white/85 mt-3">This week only · while it rains ☕</span>
                <span className="absolute bottom-3 right-3 text-[10px] text-white/70 font-mono">AI poster concept</span>
              </div>
              <div className="flex flex-col">
                <div className="card-soft p-4 mb-3 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Caption for {platform}</span>
                    <button className="btn-ghost px-2 py-1 rounded-md text-[10px] inline-flex items-center gap-1"><Copy size={11}/>Copy</button>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{generated.caption}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {generated.hashtags.map((h) => <Pill key={h} tone="accent">{h}</Pill>)}
                  </div>
                </div>
                <div className="card-soft p-4 flex items-center gap-2.5">
                  <Clock size={14} style={{ color: "var(--gold)" }} />
                  <div className="text-xs">
                    <span style={{ color: "var(--muted)" }}>Best time to post: </span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{generated.bestTime}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-semibold">Schedule post</button>
                  <button className="btn-ghost flex-1 py-2.5 rounded-xl text-xs font-semibold">Save draft</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const tone = status === "Sent" ? "success" : status === "Running" ? "accent" : status === "Scheduled" ? "gold" : status === "Ended" ? "danger" : "muted";
  return <Pill tone={tone}>{status}</Pill>;
}

function CampaignsSection() {
  const channelIcon = { WhatsApp: MessageCircle, SMS: Smartphone, Email: Mail, Push: Bell };
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Campaign Manager"
        title="WhatsApp, SMS, Email & Push in one place"
        subtitle="Schedule, segment, and track every campaign across channels."
        action={<button className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><Plus size={15}/>New Campaign</button>}
      />

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
              {campaignsList.map((c, i) => {
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
    </div>
  );
}

function CustomersSection() {
  const [query, setQuery] = useState("");
  const [list, setList] = useState(customers);
  const [importMsg, setImportMsg] = useState(null);
  const fileInputRef = useRef(null);

  const filtered = useMemo(
    () => list.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [query, list]
  );
  const tagTone = { VIP: "gold", New: "accent", Loyal: "success", "At Risk": "danger" };

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Accept flexible column names: name/Name/Customer, phone/Phone/Number/WhatsApp
        const imported = results.data
          .map((row, i) => {
            const rawPhone = row.phone || row.Phone || row.number || row.Number || row.whatsapp || row.WhatsApp || "";
            const phone = toWaNumber(rawPhone);
            if (!phone) return null;
            return {
              name: row.name || row.Name || row.customer || row.Customer || `Imported Contact ${i + 1}`,
              phone,
              tag: "New",
              segment: "Imported",
              spend: "₦0",
              visits: 0,
              birthday: "—",
              fav: "—",
            };
          })
          .filter(Boolean);

        setList((prev) => [...imported, ...prev]);
        setImportMsg(
          imported.length
            ? `${imported.length} number${imported.length > 1 ? "s" : ""} added from ${file.name}`
            : `No valid numbers found in ${file.name} — make sure it has a "phone" column`
        );
        setTimeout(() => setImportMsg(null), 4500);
      },
      error: () => {
        setImportMsg(`Couldn't read ${file.name}`);
        setTimeout(() => setImportMsg(null), 4500);
      },
    });

    e.target.value = ""; // allow re-uploading the same file
  }

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Customer Management"
        title="Know every customer, personally"
        subtitle="Purchase history, tags, segments, favorites, and birthdays — all in one database."
        action={
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            <button onClick={handleImportClick} className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <Upload size={15} /> Import from file
            </button>
            <button className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><Plus size={15}/>Add Customer</button>
          </div>
        }
      />

      {importMsg && (
        <div className="card-soft px-4 py-3 mb-4 flex items-center gap-2.5 fade-in" style={{ borderColor: "var(--success)" }}>
          <CheckCircle2 size={15} style={{ color: "var(--success)" }} />
          <span className="text-xs" style={{ color: "var(--text)" }}>{importMsg}</span>
        </div>
      )}

      <div className="card-soft px-4 py-3 mb-4 flex items-start gap-2.5">
        <Upload size={13} className="mt-0.5 shrink-0" style={{ color: "var(--muted)" }} />
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
          Upload a <strong style={{ color: "var(--text)" }}>.csv</strong> file with <strong style={{ color: "var(--text)" }}>name</strong> and <strong style={{ color: "var(--text)" }}>phone</strong> columns — every number in it is added to your customer list automatically. Existing formats (local 0-prefixed numbers) are converted for WhatsApp automatically.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
        {["All Segments", "VIP", "At Risk", "Birthdays this month"].map((s, i) => (
          <button key={s} className="chip px-3 py-2 rounded-xl text-xs font-medium" style={{ color: i === 0 ? "var(--text)" : "var(--text-dim)" }}>{s}</button>
        ))}
        <span className="text-xs font-mono ml-auto" style={{ color: "var(--muted)" }}>{list.length} customers</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto mnft-scroll">
          <table className="w-full text-sm min-w-[840px]">
            <thead>
              <tr style={{ color: "var(--muted)" }} className="text-left text-xs uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">WhatsApp</th>
                <th className="px-6 py-3 font-medium">Tag</th>
                <th className="px-6 py-3 font-medium">Segment</th>
                <th className="px-6 py-3 font-medium">Total Spend</th>
                <th className="px-6 py-3 font-medium">Visits</th>
                <th className="px-6 py-3 font-medium">Birthday</th>
                <th className="px-6 py-3 font-medium">Favorite</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="px-6 py-3.5 font-medium flex items-center gap-2.5" style={{ color: "var(--text)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-display shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    {c.name}
                  </td>
                  <td className="px-6 py-3.5">
                    {c.phone ? (
                      <a
                        href={waLink(c.phone, `Hi ${c.name.split(" ")[0]}, thanks for being a Riverside Café customer! 🌟`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono"
                        style={{ color: "var(--success)" }}
                        title="Open chat on WhatsApp"
                      >
                        <MessageCircle size={13} /> +{c.phone}
                      </a>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5"><Pill tone={tagTone[c.tag] || "muted"}>{c.tag}</Pill></td>
                  <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.segment}</td>
                  <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.spend}</td>
                  <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.visits}</td>
                  <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.birthday}</td>
                  <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.fav}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PromotionsSection() {
  const promoTypes = [
    { name: "Discount Campaigns", icon: Ticket, desc: "Percentage or fixed-amount off", active: 3 },
    { name: "Buy One Get One", icon: Gift, desc: "Drive basket size and trial", active: 1 },
    { name: "Flash Sales", icon: Zap, desc: "Time-boxed urgency offers", active: 1 },
    { name: "Happy Hour", icon: Clock, desc: "Fill slow traffic windows", active: 2 },
    { name: "Seasonal Promotions", icon: Calendar, desc: "Tied to holidays & seasons", active: 0 },
    { name: "Festival Promotions", icon: Star, desc: "Local & cultural festivals", active: 1 },
  ];
  const tiers = [
    { name: "Bronze", need: "0 – 999 pts", perk: "5% birthday discount", color: "#B08968" },
    { name: "Silver", need: "1,000 – 2,999 pts", perk: "10% off + early access", color: "#B8B8C2" },
    { name: "Gold", need: "3,000+ pts", perk: "15% off + free item monthly", color: "var(--gold)" },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Smart Promotions & Loyalty"
        title="Promotions that pay for themselves"
        subtitle="Run structured offers and reward loyalty with points, cashback, and tiers."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {promoTypes.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.name} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <Icon size={16} />
                </div>
                <Pill tone={p.active ? "success" : "muted"}>{p.active} active</Pill>
              </div>
              <div className="font-display text-base" style={{ color: "var(--text)" }}>{p.name}</div>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{p.desc}</p>
              <button className="text-xs font-semibold mt-3 inline-flex items-center gap-1" style={{ color: "var(--accent)" }}>
                Create promotion <ChevronRight size={12} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-1">
          <h3 className="font-display text-lg mb-1">Points & Cashback</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Redeemable across all branches</p>
          <div className="card-soft p-4 mb-3">
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--muted)" }}>
              <span>Points issued (30d)</span><span className="font-mono" style={{ color: "var(--text)" }}>48,120</span>
            </div>
            <div className="progress-track h-2"><div className="progress-fill h-2" style={{ width: "72%" }} /></div>
          </div>
          <div className="card-soft p-4">
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--muted)" }}>
              <span>Cashback paid out (30d)</span><span className="font-mono" style={{ color: "var(--text)" }}>₦312,000</span>
            </div>
            <div className="progress-track h-2"><div className="progress-fill h-2" style={{ width: "48%" }} /></div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-lg mb-4">Membership Levels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tiers.map((t) => (
              <div key={t.name} className="card-soft p-4">
                <Crown size={16} style={{ color: t.color }} />
                <div className="font-display text-base mt-2" style={{ color: "var(--text)" }}>{t.name}</div>
                <div className="text-[11px] font-mono mt-1" style={{ color: "var(--muted)" }}>{t.need}</div>
                <div className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>{t.perk}</div>
              </div>
            ))}
          </div>
          <div className="card-soft p-4 mt-4 flex items-center gap-3">
            <div className="w-10 h-7 rounded-md" style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }} />
            <div className="text-xs" style={{ color: "var(--text-dim)" }}>
              <span className="font-semibold" style={{ color: "var(--text)" }}>Digital Loyalty Card</span> — customers add it to Apple/Google Wallet directly from WhatsApp.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CouponsSection() {
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Coupon System"
        title="QR coupons that track themselves"
        subtitle="Create promo codes, set limits and expiry, and watch redemption in real time."
        action={<button className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><Plus size={15}/>New Coupon</button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-36 h-36 rounded-2xl grid grid-cols-5 grid-rows-5 gap-1 p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} style={{ background: [3,4,6,10,12,14,18,20,21,22].includes(i) ? "var(--text)" : "transparent", borderRadius: 2 }} />
            ))}
          </div>
          <div className="font-display text-lg mt-4">WEEKEND20</div>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Scan to redeem 20% off in-store</p>
          <button className="btn-ghost px-4 py-2 rounded-lg text-xs font-semibold mt-4 inline-flex items-center gap-1.5"><QrCode size={13}/>Download QR</button>
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="font-display text-lg">Active Coupons</h3>
          </div>
          <div className="overflow-x-auto mnft-scroll">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr style={{ color: "var(--muted)" }} className="text-left text-xs uppercase tracking-wide">
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Usage</th>
                  <th className="px-6 py-3 font-medium">Expiry</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="px-6 py-3.5 font-mono font-medium" style={{ color: "var(--text)" }}>{c.code}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.type}</td>
                    <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{c.used}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-dim)" }}>{c.expiry}</td>
                    <td className="px-6 py-3.5"><Pill tone={c.status === "Active" ? "success" : "muted"}>{c.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsSection() {
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Google Review Booster"
        title="Turn happy customers into 5★ reviews"
        subtitle="QR review requests, sentiment tracking, and a private channel for negative feedback."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-2xl grid grid-cols-5 grid-rows-5 gap-1 p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} style={{ background: [1,2,5,8,11,13,16,19,23,24].includes(i) ? "var(--text)" : "transparent", borderRadius: 2 }} />
            ))}
          </div>
          <p className="text-xs mt-3 max-w-[180px]" style={{ color: "var(--muted)" }}>Table-tent QR code — scan to leave a Google review in one tap</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-1 mb-1">
            <span className="font-display text-4xl">4.8</span>
            <div className="flex ml-1">{Array.from({length:5}).map((_,i)=><Star key={i} size={14} fill={i<5?"var(--gold)":"none"} color="var(--gold)" />)}</div>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Based on 412 Google reviews · +61 this month</p>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reviewTrend} margin={{ left: -30, right: 5 }}>
                <XAxis dataKey="m" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[3.8, 5]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rating" name="Rating" stroke="var(--gold)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-base mb-3">Review Requests (30d)</h3>
          {[
            { label: "Sent automatically", value: 340 },
            { label: "Opened", value: 268 },
            { label: "Left a review", value: 96 },
          ].map((r) => (
            <div key={r.label} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-dim)" }}>
                <span>{r.label}</span><span className="font-mono">{r.value}</span>
              </div>
              <div className="progress-track h-1.5"><div className="progress-fill h-1.5" style={{ width: `${(r.value/340)*100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h3 className="font-display text-lg">Request a Review, Direct to WhatsApp</h3>
          <Pill tone="success"><MessageCircle size={11}/> One tap send</Pill>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          Click a customer's number — it opens WhatsApp with a review-request message ready to send.
        </p>
        <div className="space-y-2.5">
          {customers.slice(0, 5).map((c, i) => (
            <div key={i} className="card-soft px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-display shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {c.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.name}</div>
                  <div className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>+{c.phone}</div>
                </div>
              </div>
              <a
                href={waLink(c.phone, `Hi ${c.name.split(" ")[0]}, thanks for visiting Riverside Café! Could you spare 20 seconds to leave us a Google review? It really helps: https://g.page/r/riversidecafe/review`)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                <MessageCircle size={13} /> Request on WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display text-lg mb-4">Recent Reviews</h3>
        <div className="space-y-4">
          {reviewsList.map((r, i) => (
            <div key={i} className="flex items-start justify-between gap-4 pb-4" style={{ borderBottom: i < reviewsList.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-display shrink-0" style={{ background: "var(--surface-3)", color: "var(--text-dim)" }}>
                  {r.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{r.name}</span>
                    <div className="flex">{Array.from({length:5}).map((_,j)=><Star key={j} size={11} fill={j<r.rating?"var(--gold)":"none"} color="var(--gold)" />)}</div>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>{r.text}</p>
                  <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{r.time}</span>
                </div>
              </div>
              {r.flagged && <Pill tone="danger">Needs reply</Pill>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReferralsSection() {
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Referral System"
        title="Let your best customers do the marketing"
        subtitle="Unique referral codes, tracked rewards, and a leaderboard to keep it fun."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6">
          <h3 className="font-display text-lg mb-1">Your Referral Program</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Reward: ₦1,000 credit for both sides</p>
          <div className="card-soft p-4 flex items-center justify-between mb-3">
            <span className="font-mono text-sm" style={{ color: "var(--text)" }}>riverside.cafe/join/AMARA18</span>
            <button className="btn-ghost px-2.5 py-1.5 rounded-md text-[11px] inline-flex items-center gap-1"><Copy size={11}/>Copy</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-soft p-3 text-center">
              <div className="font-display text-xl">312</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>Total invites</div>
            </div>
            <div className="card-soft p-3 text-center">
              <div className="font-display text-xl">₦312K</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>Rewards paid</div>
            </div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-lg mb-4">Referral Leaderboard</h3>
          <div className="space-y-3">
            {referralLeaders.map((r, i) => (
              <div key={r.name} className="flex items-center gap-4">
                <div className="w-6 text-center font-display text-sm" style={{ color: i === 0 ? "var(--gold)" : "var(--muted)" }}>{i + 1}</div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-display shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {r.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{r.name}</div>
                  <div className="progress-track h-1.5 mt-1.5"><div className="progress-fill h-1.5" style={{ width: `${(r.invites/18)*100}%` }} /></div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono" style={{ color: "var(--text)" }}>{r.invites} invites</div>
                  <div className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{r.rewardEarned}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsSection() {
  const conv = [
    { m: "Feb", rate: 3.1 }, { m: "Mar", rate: 3.4 }, { m: "Apr", rate: 3.8 },
    { m: "May", rate: 4.2 }, { m: "Jun", rate: 4.6 }, { m: "Jul", rate: 5.1 },
  ];
  const roiCards = [
    { label: "Marketing ROI", value: "4.6x", note: "₦1 spent → ₦4.60 generated" },
    { label: "Repeat Customer Rate", value: "62%", note: "Up from 54% last quarter" },
    { label: "Avg. Conversion Rate", value: "5.1%", note: "Across all campaigns" },
  ];
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Analytics"
        title="Marketing that proves its own ROI"
        subtitle="Track growth, conversion, and repeat business with real numbers."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {roiCards.map((r) => (
          <div key={r.label} className="card p-6">
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{r.label}</div>
            <div className="font-display text-4xl mt-2" style={{ color: "var(--accent)" }}>{r.value}</div>
            <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>{r.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="font-display text-lg mb-1">Conversion Rate Trend</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Visitors → paying customers</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conv} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Line type="monotone" dataKey="rate" name="Conversion" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-display text-lg mb-1">Sales Growth</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Total vs. returning customers, 6 months</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthSeries} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-2)" }} />
                <Bar dataKey="customers" name="Total" fill="var(--surface-3)" radius={[6,6,0,0]} />
                <Bar dataKey="returning" name="Returning" fill="var(--gold)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantSection() {
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="AI Assistant"
        title="Your always-on growth strategist"
        subtitle="Ask about performance, get campaign ideas, or let it draft the next send."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2 flex flex-col" style={{ minHeight: 420 }}>
          <div className="flex-1 space-y-4 mnft-scroll overflow-y-auto pr-1">
            {assistantThread.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                {m.from === "ai" && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-2.5" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    <Bot size={13} />
                  </div>
                )}
                <div
                  className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: m.from === "user" ? "var(--accent)" : "var(--surface-2)",
                    color: m.from === "user" ? "#fff" : "var(--text)",
                    borderTopRightRadius: m.from === "user" ? 4 : undefined,
                    borderTopLeftRadius: m.from === "ai" ? 4 : undefined,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <input placeholder="Ask MNFT anything about your business…" className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <button className="btn-primary w-10 h-10 rounded-xl flex items-center justify-center shrink-0"><Send size={15} /></button>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: TrendingUp, title: "Sales Prediction", body: "Expect a 14% lift next week from the flash sale + happy hour overlap." },
            { icon: Users, title: "Customer Insight", body: "214 customers haven't returned in 21+ days — win-back window closing." },
            { icon: Sparkles, title: "Promotion Idea", body: "Bundle your top 2 products as a combo — similar cafés see +19% AOV." },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="card p-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--gold-soft)", color: "var(--gold)" }}>
                  <Icon size={16} />
                </div>
                <div className="font-display text-base mb-1">{c.title}</div>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>{c.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReportsSection() {
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Reports"
        title="Every report, ready to export"
        subtitle="Daily, weekly, and monthly summaries — in PDF or Excel."
      />
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.name} className="card p-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{r.name}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{r.period} · {r.size}</div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="btn-ghost px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"><Download size={13}/>PDF</button>
              <button className="btn-ghost px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"><Download size={13}/>Excel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSection() {
  const fields = [
    { label: "Business Name", value: "Riverside Café" },
    { label: "Business Type", value: "Café & Restaurant" },
    { label: "Phone", value: "+234 803 555 0192" },
    { label: "Email", value: "hello@riversidecafe.ng" },
  ];
  return (
    <div className="fade-in">
      <SectionHeader
        eyebrow="Business Profile"
        title="Everything customers see, in one place"
        subtitle="Branding, branches, hours, and social links."
        action={<button className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold">Save Changes</button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }}>
            <Store size={28} color="#fff" />
          </div>
          <button className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold">Upload Logo</button>
          <div className="w-full mt-6 space-y-3 text-left">
            {["Instagram", "Facebook", "TikTok", "WhatsApp"].map((s) => (
              <div key={s} className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--muted)" }}>{s}</span>
                <span className="font-mono" style={{ color: "var(--text)" }}>@riversidecafe</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-lg mb-4">Company Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.label}>
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{f.label}</label>
                <input defaultValue={f.value} className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }} />
              </div>
            ))}
          </div>

          <h3 className="font-display text-lg mt-6 mb-3">Branches</h3>
          <div className="space-y-2.5">
            {[
              { name: "Riverside Café — Lekki", hours: "7:00 AM – 10:00 PM" },
              { name: "Riverside Café — Ikeja", hours: "7:30 AM – 9:30 PM" },
              { name: "Riverside Café — Yaba", hours: "8:00 AM – 9:00 PM" },
            ].map((b) => (
              <div key={b.name} className="card-soft p-3.5 flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm inline-flex items-center gap-2" style={{ color: "var(--text)" }}><MapPin size={13} style={{ color: "var(--accent)" }}/>{b.name}</span>
                <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{b.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- AUTH ---------------------------------- */

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | register (owner only — author never registers)
  const [role, setRole] = useState("owner"); // admin(author) | owner
  const [form, setForm] = useState({ name: "", email: "", password: "", key: "", authorPassword: "" });
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showAuthorPw, setShowAuthorPw] = useState(false);
  const isAuthor = role === "admin";
  const keyRequired = mode === "register" && role === "owner";

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (error) setError("");
  }

  function selectRole(r) {
    setRole(r);
    setError("");
    if (r === "admin") setMode("login"); // author never has a register mode
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (isAuthor) {
      if (!form.authorPassword) {
        setError("Enter the author password.");
        return;
      }
      if (form.authorPassword !== AUTHOR_MASTER_PASSWORD) {
        setError("Incorrect password. Full control is restricted to whoever holds this password.");
        return;
      }
      onAuth({ role: "admin", name: "Author", email: "" });
      return;
    }

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    if (mode === "register") {
      if (!form.name) { setError("Please enter your name."); return; }
      if (form.key.trim().toUpperCase() !== REGISTRATION_KEY) {
        setError("Invalid registration key. Ask your platform admin for the correct key.");
        return;
      }
    }
    onAuth({ role: "owner", name: form.name || "Business Owner", email: form.email });
  }

  return (
    <div className="mnft min-h-screen w-full flex items-center justify-center p-5" data-mode="dark">
      <style>{THEME_CSS}</style>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--accent), var(--gold))" }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <div className="leading-tight text-center">
            <div className="font-display text-lg" style={{ color: "var(--text)" }}>MNFT Growth AI</div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted)" }}>Business Promotion Platform</div>
          </div>
        </div>

        <div className="card p-7 fade-in">
          {/* role tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {ROLES.map((r) => {
              const Icon = r.key === "admin" ? Crown : Store;
              const active = role === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => selectRole(r.key)}
                  className="text-left p-3.5 rounded-xl"
                  style={{
                    background: active ? "var(--accent-soft)" : "var(--surface-2)",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  <Icon size={16} style={{ color: active ? "var(--accent)" : "var(--muted)" }} />
                  <div className="text-sm font-semibold mt-2" style={{ color: active ? "var(--accent)" : "var(--text)" }}>{r.label}</div>
                  <div className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--muted)" }}>{r.desc}</div>
                </button>
              );
            })}
          </div>

          {isAuthor ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="card-soft p-3.5 flex items-start gap-2.5 mb-1">
                <Lock size={14} className="mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
                  No sign-up here. Whoever enters the correct password gets full control — no email, no account needed.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Author Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showAuthorPw ? "text" : "password"}
                    value={form.authorPassword}
                    onChange={(e) => update("authorPassword", e.target.value)}
                    placeholder="••••••••••••"
                    autoFocus
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthorPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted)" }}
                    aria-label="Toggle password visibility"
                  >
                    {showAuthorPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-3.5 py-2.5 rounded-xl text-xs" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2 inline-flex items-center justify-center gap-2">
                <Lock size={14} /> Unlock full control
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-1 mb-6 p-1 rounded-xl" style={{ background: "var(--surface-2)" }}>
                {["login", "register"].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(""); }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize"
                    style={{
                      background: mode === m ? "var(--surface)" : "transparent",
                      color: mode === m ? "var(--text)" : "var(--muted)",
                      boxShadow: mode === m ? "var(--shadow)" : "none",
                    }}
                  >
                    {m === "login" ? "Sign In" : "Register"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === "register" && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Business Owner Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Amara Okafor"
                      className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="owner@yourbusiness.com"
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="••••••••"
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
                {keyRequired && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Registration Key</label>
                    <div className="relative mt-1.5">
                      <input
                        type={showKey ? "text" : "password"}
                        value={form.key}
                        onChange={(e) => update("key", e.target.value)}
                        placeholder="Enter your registration key"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm outline-none font-mono tracking-wider"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--muted)" }}
                        aria-label="Toggle key visibility"
                      >
                        {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>
                      Provided by your platform admin — required to activate a new Business Owner account.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="px-3.5 py-2.5 rounded-xl text-xs" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-2">
                  {mode === "login" ? "Sign in as Business Owner" : "Create account"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: "var(--muted)" }}>
          Super Admin, Branch Manager, Marketing Manager & Staff roles are managed from inside the platform after sign-in.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------- APP ---------------------------------- */

export default function App() {
  const [session, setSession] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [mode, setMode] = useState("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  if (!session) {
    return <AuthScreen onAuth={(s) => setSession(s)} />;
  }

  const sections = {
    dashboard: <DashboardSection />,
    "ai-marketing": <AiMarketingSection />,
    campaigns: <CampaignsSection />,
    customers: <CustomersSection />,
    promotions: <PromotionsSection />,
    coupons: <CouponsSection />,
    reviews: <ReviewsSection />,
    referrals: <ReferralsSection />,
    analytics: <AnalyticsSection />,
    assistant: <AssistantSection />,
    reports: <ReportsSection />,
    settings: <SettingsSection />,
  };

  const activeLabel = NAV.find((n) => n.key === active)?.label || "Dashboard";

  return (
    <div className="mnft min-h-screen w-full flex" data-mode={mode}>
      <style>{THEME_CSS}</style>
      <Sidebar active={active} setActive={setActive} collapsed={collapsed} session={session} />

      {/* mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
          <div className="absolute left-0 top-0 h-full w-64 p-4" style={{ background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-lg">Menu</span>
              <button onClick={() => setMobileNavOpen(false)}><X size={18} /></button>
            </div>
            <nav className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setActive(item.key); setMobileNavOpen(false); }}
                    className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? "active" : ""}`}
                    style={{ color: isActive ? "var(--accent)" : "var(--text-dim)" }}
                  >
                    <Icon size={17} /> {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="md:hidden flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <button onClick={() => setMobileNavOpen(true)} className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center">
            <LayoutDashboard size={16} />
          </button>
          <span className="font-display text-sm">{activeLabel}</span>
          <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center">
            {mode === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        <Topbar title={activeLabel} mode={mode} setMode={setMode} collapsed={collapsed} setCollapsed={setCollapsed} session={session} onLogout={() => setSession(null)} />
        <main className="px-5 md:px-8 py-6 md:py-8 max-w-[1400px]">
          {sections[active]}
        </main>
      </div>
    </div>
  );
}
