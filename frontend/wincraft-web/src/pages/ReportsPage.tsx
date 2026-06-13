import { useState, useEffect } from "react";
import { getSystemStats } from '../core/store/databridge';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fmtKwd = (v: number) =>
  (v || 0).toLocaleString("en-KW", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " KWD";
const fmtK = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(Math.round(v)));
const fmtPct = (v: number) => `${(v || 0).toFixed(1)}%`;

interface MonthData {
  month: string; revenue: number; cost: number; profit: number;
  quotes: number; converted: number; collection: number;
}
interface SalesRep { name: string; quotes: number; converted: number; value: number; avg: number; pct: number }
interface ProductMix { name: string; value: number; amount: number; color: string }
interface CollectionQ { month: string; invoiced: number; collected: number; overdue: number }
interface WastageRow { serie: string; usePct: number; recoverPct: number; scrapPct: number; totalBars: number; weightKg: number }
interface TopCustomer { name: string; revenue: number; projects: number; margin: number }

const MONTHLY: MonthData[] = [
  { month: "يناير",  revenue: 42800, cost: 28100, profit: 14700, quotes: 8,  converted: 4,  collection: 38000 },
  { month: "فبراير", revenue: 38500, cost: 24200, profit: 14300, quotes: 6,  converted: 3,  collection: 42000 },
  { month: "مارس",   revenue: 61200, cost: 38800, profit: 22400, quotes: 12, converted: 7,  collection: 55000 },
  { month: "أبريل",  revenue: 55700, cost: 34100, profit: 21600, quotes: 10, converted: 6,  collection: 48000 },
  { month: "مايو",   revenue: 72300, cost: 44500, profit: 27800, quotes: 15, converted: 9,  collection: 68000 },
  { month: "يونيو",  revenue: 68900, cost: 41200, profit: 27700, quotes: 13, converted: 8,  collection: 72000 },
  { month: "يوليو",  revenue: 48200, cost: 30900, profit: 17300, quotes: 9,  converted: 5,  collection: 44000 },
  { month: "أغسطس",  revenue: 53800, cost: 33700, profit: 20100, quotes: 11, converted: 6,  collection: 58000 },
  { month: "سبتمبر", revenue: 79500, cost: 47800, profit: 31700, quotes: 16, converted: 10, collection: 75000 },
  { month: "أكتوبر", revenue: 86200, cost: 52100, profit: 34100, quotes: 18, converted: 11, collection: 82000 },
  { month: "نوفمبر", revenue: 91800, cost: 54900, profit: 36900, quotes: 20, converted: 13, collection: 88000 },
  { month: "ديسمبر", revenue: 74600, cost: 45200, profit: 29400, quotes: 14, converted: 9,  collection: 70000 },
];

const SALES_REP: SalesRep[] = [
  { name: "أحمد السالم",   quotes: 42, converted: 28, value: 234500, avg: 8375, pct: 66.7 },
  { name: "فاطمة الرشيدي", quotes: 38, converted: 22, value: 198200, avg: 9009, pct: 57.9 },
  { name: "خالد المطيري",  quotes: 29, converted: 18, value: 156800, avg: 8711, pct: 62.1 },
  { name: "نورة العنزي",   quotes: 22, converted: 12, value: 98400,  avg: 8200, pct: 54.5 },
];

const PRODUCT_MIX: ProductMix[] = [
  { name: "نوافذ شبابيك", value: 38, amount: 312000, color: "#1e4db7" },
  { name: "أبواب",        value: 22, amount: 180000, color: "#059669" },
  { name: "كيرتن وول",   value: 18, amount: 147000, color: "#7c3aed" },
  { name: "فاصل زجاجي",  value: 12, amount: 98000,  color: "#f59e0b" },
  { name: "نوافذ قلابة",  value: 10, amount: 82000,  color: "#0891b2" },
];

const COLLECTION: CollectionQ[] = [
  { month: "Q1", invoiced: 142500, collected: 125000, overdue: 17500 },
  { month: "Q2", invoiced: 197200, collected: 182000, overdue: 15200 },
  { month: "Q3", invoiced: 181500, collected: 171000, overdue: 10500 },
  { month: "Q4", invoiced: 252600, collected: 238000, overdue: 14600 },
];

const WASTAGE: WastageRow[] = [
  { serie: "DOUS_50", usePct: 54.4, recoverPct: 44.9, scrapPct: 0.7, totalBars: 186, weightKg: 428 },
  { serie: "NAPCO",   usePct: 61.2, recoverPct: 37.8, scrapPct: 1.0, totalBars: 92,  weightKg: 198 },
  { serie: "CW-70",   usePct: 72.1, recoverPct: 26.5, scrapPct: 1.4, totalBars: 44,  weightKg: 312 },
];

const TOP_CUSTOMERS: TopCustomer[] = [
  { name: "شركة الخليج للمقاولات",  revenue: 234500, projects: 8, margin: 38.2 },
  { name: "مجموعة الأمل العقارية",  revenue: 189800, projects: 5, margin: 41.5 },
  { name: "محمد العنزي",             revenue: 98400,  projects: 3, margin: 44.1 },
  { name: "شركة النور للإنشاء",      revenue: 76200,  projects: 2, margin: 35.8 },
  { name: "مكاتب الجزيرة",           revenue: 54100,  projects: 2, margin: 43.2 },
];

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number | string;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <b>{typeof p.value === "number" && p.value > 999 ? fmtKwd(p.value) : p.value}</b>
        </div>
      ))}
    </div>
  );
}

type TabId = "overview" | "pl" | "sales" | "collection" | "wastage" | "customers";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview",   label: "نظرة عامة",     icon: "📊" },
  { id: "pl",         label: "أرباح وخسائر",  icon: "💰" },
  { id: "sales",      label: "أداء المبيعات", icon: "📈" },
  { id: "collection", label: "التحصيل",       icon: "🏦" },
  { id: "wastage",    label: "تحليل الهدر",   icon: "⚙️" },
  { id: "customers",  label: "العملاء",       icon: "👥" },
];

const RANK_MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

export default function ReportsPage() {
  const [tab, setTab]       = useState<TabId>("overview");
  const [period, setPeriod] = useState("year");
  const [live, setLive]     = useState(getSystemStats());
  useEffect(() => setLive(getSystemStats()), []);

  const totalRevenue   = MONTHLY.reduce((s, m) => s + m.revenue, 0);
  const totalCost      = MONTHLY.reduce((s, m) => s + m.cost, 0);
  const totalProfit    = MONTHLY.reduce((s, m) => s + m.profit, 0);
  const avgMargin      = (totalProfit / totalRevenue * 100).toFixed(1);
  const totalQuotes    = MONTHLY.reduce((s, m) => s + m.quotes, 0);
  const totalConverted = MONTHLY.reduce((s, m) => s + m.converted, 0);
  const conversionRate = (totalConverted / totalQuotes * 100).toFixed(1);
  const totalCollection = MONTHLY.reduce((s, m) => s + m.collection, 0);

  return (
    <div style={{ fontFamily: "'Segoe UI',Tahoma,sans-serif", direction: "rtl", background: "#f0f4f8", minHeight: "100vh", color: "#1e293b" }}>

      {/* Header */}
      <div style={{ background: "#0f172a", color: "#fff", padding: "0 20px", height: 52, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 32, height: 32, background: "#0369a1", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>WinCraft <span style={{ color: "#7dd3fc" }}>Financial Reports</span></div>
          <div style={{ fontSize: 9, color: "#475569" }}>لوحة التقارير المالية — 2024</div>
        </div>
        <div style={{ marginRight: "auto", display: "flex", gap: 14 }}>
          {([
            ["الإيرادات",  fmtK(totalRevenue)  + " KWD", "#60a5fa"],
            ["الأرباح",    fmtK(totalProfit)   + " KWD", "#34d399"],
            ["هامش الربح", avgMargin + "%",               "#fbbf24"],
            ["التحصيل",    fmtK(totalCollection) + " KWD", "#a78bfa"],
          ] as [string, string, string][]).map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#475569" }}>{l}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          style={{ padding: "5px 10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 6, fontSize: 11, outline: "none", cursor: "pointer" }}>
          {["year", "q1", "q2", "q3", "q4"].map(p => (
            <option key={p} value={p}>{p === "year" ? "السنة الكاملة" : "ربع " + p.toUpperCase()}</option>
          ))}
        </select>
        <button style={{ padding: "6px 12px", background: "#0369a1", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
          تصدير Excel ↓
        </button>
      </div>

      {/* Live data banner */}
      <div style={{ background: "#0c4a6e", padding: "10px 20px", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#7dd3fc", fontWeight: 700, letterSpacing: 1 }}>البيانات الحية ▸</span>
        {[
          { l: "العملاء",    v: live.customers,          c: "#60a5fa" },
          { l: "العروض",     v: live.quotations,         c: "#34d399" },
          { l: "المشاريع",   v: live.projects,           c: "#fbbf24" },
          { l: "أوامر تصنيع",v: live.workOrders,         c: "#f472b6" },
          { l: "قيمة العروض",v: live.totalQuotValue.toFixed(0)+" KWD", c: "#a78bfa" },
          { l: "قيمة المشاريع",v: live.totalProjValue.toFixed(0)+" KWD", c: "#fb923c" },
          { l: "مخزون منخفض",v: live.lowStockItems + " صنف",    c: live.lowStockItems > 0 ? "#f87171" : "#34d399" },
        ].map(k => (
          <div key={k.l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#94a3b8" }}>{k.l}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 20px", display: "flex", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", borderBottom: tab === t.id ? "2px solid #0369a1" : "2px solid transparent", color: tab === t.id ? "#0369a1" : "#64748b", padding: "10px 16px", cursor: "pointer", fontSize: 12, fontWeight: tab === t.id ? 700 : 400, whiteSpace: "nowrap", display: "flex", gap: 5, alignItems: "center" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20 }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
              {([
                { l: "إجمالي الإيرادات",   v: fmtKwd(totalRevenue),                     sub: "2024",          c: "#1e4db7", trend: "+18%" },
                { l: "إجمالي الأرباح",     v: fmtKwd(totalProfit),                      sub: "صافي",          c: "#10b981", trend: "+22%" },
                { l: "هامش الربح",          v: avgMargin + "%",                           sub: "متوسط السنة",   c: "#f59e0b", trend: "+2.1pp" },
                { l: "Conversion Rate",     v: conversionRate + "%",                      sub: "عروض→مشاريع",  c: "#7c3aed", trend: "+5%" },
                { l: "إجمالي التحصيل",     v: fmtKwd(totalCollection),                  sub: "2024",          c: "#0891b2", trend: "+15%" },
                { l: "متوسط قيمة الصفقة",  v: fmtKwd(totalRevenue / totalConverted),    sub: `${totalConverted} صفقة`, c: "#d97706", trend: "" },
              ] as { l: string; v: string; sub: string; c: string; trend: string }[]).map(s => (
                <div key={s.l} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${s.c}` }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.c, margin: "4px 0 2px" }}>{s.v}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                    <span style={{ color: "#94a3b8" }}>{s.sub}</span>
                    {s.trend && <span style={{ color: "#10b981", fontWeight: 700 }}>{s.trend} ↑</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>الإيرادات والأرباح الشهرية (KWD)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={MONTHLY}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.substring(0, 3)} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => fmtK(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="revenue" name="الإيرادات" stroke="#1e4db7" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="profit"  name="الأرباح"   stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cost"    name="التكاليف"  stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>توزيع المنتجات</div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={PRODUCT_MIX} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name">
                      {PRODUCT_MIX.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [`${v}%`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {PRODUCT_MIX.map(p => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "#475569" }}>{p.name}</span>
                      <span style={{ fontWeight: 700, color: p.color }}>{p.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── P&L ── */}
        {tab === "pl" && (
          <div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>الأرباح والخسائر الشهرية</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MONTHLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.substring(0, 3)} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => fmtK(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="الإيرادات" fill="#1e4db7" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="cost"    name="التكاليف"  fill="#ef4444" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="profit"  name="الأرباح"   fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["الشهر", "الإيرادات", "التكاليف", "الأرباح", "هامش%", "عروض", "محوّل", "Conversion%"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#475569", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MONTHLY.map((m, i) => {
                    const margin = (m.profit / m.revenue * 100).toFixed(1);
                    const conv   = (m.converted / m.quotes * 100).toFixed(0);
                    const marginNum = parseFloat(margin);
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                        <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700 }}>{m.month}</td>
                        <td style={{ padding: "9px 12px", fontSize: 12, color: "#1e4db7", fontWeight: 700 }}>{fmtK(m.revenue)}</td>
                        <td style={{ padding: "9px 12px", fontSize: 12, color: "#ef4444" }}>{fmtK(m.cost)}</td>
                        <td style={{ padding: "9px 12px", fontSize: 12, color: "#10b981", fontWeight: 700 }}>{fmtK(m.profit)}</td>
                        <td style={{ padding: "9px 12px", fontSize: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 40, height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ width: `${margin}%`, height: "100%", background: marginNum > 35 ? "#10b981" : marginNum > 25 ? "#f59e0b" : "#ef4444", borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11, color: marginNum > 35 ? "#10b981" : marginNum > 25 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>{margin}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "9px 12px", fontSize: 12, textAlign: "center" }}>{m.quotes}</td>
                        <td style={{ padding: "9px 12px", fontSize: 12, textAlign: "center", color: "#10b981", fontWeight: 700 }}>{m.converted}</td>
                        <td style={{ padding: "9px 12px", fontSize: 12, color: "#7c3aed", fontWeight: 700 }}>{conv}%</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                    <td style={{ padding: "10px 12px", fontSize: 12 }}>الإجمالي</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#1e4db7" }}>{fmtK(totalRevenue)}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#ef4444" }}>{fmtK(totalCost)}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#10b981" }}>{fmtK(totalProfit)}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#10b981" }}>{avgMargin}%</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "center" }}>{totalQuotes}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "center", color: "#10b981" }}>{totalConverted}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#7c3aed" }}>{conversionRate}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SALES ── */}
        {tab === "sales" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>أداء المندوبين — قيمة المبيعات (KWD)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={SALES_REP} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v: number) => fmtK(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip formatter={(v: number) => [fmtKwd(v), "المبيعات"]} />
                    <Bar dataKey="value" name="المبيعات" fill="#1e4db7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>نسبة التحويل لكل مندوب</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={SALES_REP}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.split(" ")[0]} />
                    <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                    <Tooltip formatter={(v: number) => [`${v}%`, "Conversion"]} />
                    <Bar dataKey="pct" name="Conversion%" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13, fontWeight: 700 }}>تفاصيل أداء المندوبين</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["المندوب", "العروض", "المحوّلة", "Conversion%", "إجمالي المبيعات", "متوسط الصفقة", "الترتيب"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#475569", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...SALES_REP].sort((a, b) => b.value - a.value).map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                      <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700 }}>{r.name}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "center" }}>{r.quotes}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "center", color: "#10b981", fontWeight: 700 }}>{r.converted}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 50, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${r.pct}%`, height: "100%", background: r.pct > 65 ? "#10b981" : "#f59e0b", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: r.pct > 65 ? "#10b981" : "#f59e0b" }}>{r.pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#1e4db7" }}>{fmtKwd(r.value)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#7c3aed" }}>{fmtKwd(r.avg)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, textAlign: "center" }}>{RANK_MEDALS[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── COLLECTION ── */}
        {tab === "collection" && (
          <div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>التحصيل الفصلي (KWD)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={COLLECTION}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => fmtK(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="invoiced"  name="مصدّر" fill="#1e4db7" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="collected" name="محصّل" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="overdue"   name="متأخر" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {([
                { l: "إجمالي المصدّر",  v: fmtKwd(COLLECTION.reduce((s, c) => s + c.invoiced, 0)),   c: "#1e4db7" },
                { l: "إجمالي المحصّل", v: fmtKwd(COLLECTION.reduce((s, c) => s + c.collected, 0)), c: "#10b981" },
                { l: "إجمالي المتأخر", v: fmtKwd(COLLECTION.reduce((s, c) => s + c.overdue, 0)),   c: "#ef4444" },
                { l: "نسبة التحصيل",   v: fmtPct(COLLECTION.reduce((s, c) => s + c.collected, 0) / COLLECTION.reduce((s, c) => s + c.invoiced, 0) * 100), c: "#7c3aed" },
              ] as { l: string; v: string; c: string }[]).map(s => (
                <div key={s.l} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${s.c}` }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── WASTAGE ── */}
        {tab === "wastage" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginBottom: 16 }}>
              {WASTAGE.map(w => (
                <div key={w.serie} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{w.serie}</div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 10, justifyContent: "center" }}>
                    {([["استخدام", w.usePct, "#10b981"], ["قابل للاسترداد", w.recoverPct, "#f59e0b"], ["هدر", w.scrapPct, "#94a3b8"]] as [string, number, string][]).map(([l, v, c]) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ width: 12, height: 12, borderRadius: 2, background: c, margin: "0 auto 3px" }} />
                        <div style={{ fontSize: 10, color: "#64748b" }}>{l}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}%</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 10, display: "flex", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `${w.usePct}%`,      background: "#10b981" }} />
                    <div style={{ width: `${w.recoverPct}%`,  background: "#f59e0b" }} />
                    <div style={{ width: `${w.scrapPct}%`,    background: "#94a3b8" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#64748b" }}>
                    <span>{w.totalBars} بار</span>
                    <span>{w.weightKg} كجم</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>💡 توصيات لتقليل الهدر</div>
              {([
                { tip: "زيادة الطلبات المجمّعة — تجميع قطع DOUS_50 في batch واحد يزيد الكفاءة 8-12%",        saving: "~4,200 KWD/سنة", icon: "📦" },
                { tip: "إعادة استخدام Off-Cut أكثر من 200mm — حالياً 44.9% recoverable غير مستخدم بالكامل",  saving: "~3,800 KWD/سنة", icon: "♻️" },
                { tip: "تحسين خوارزمية القطع — استخدام 2D Nesting للبارات الطويلة",                           saving: "~2,100 KWD/سنة", icon: "⚙️" },
              ]).map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{r.icon}</span>
                  <div style={{ flex: 1, fontSize: 12, color: "#475569" }}>{r.tip}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", whiteSpace: "nowrap" }}>{r.saving}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CUSTOMERS ── */}
        {tab === "customers" && (
          <div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13, fontWeight: 700 }}>أفضل العملاء — 2024</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["#", "العميل", "إجمالي المبيعات", "عدد المشاريع", "متوسط الهامش", "المرتبة"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#475569", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TOP_CUSTOMERS.map((c, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                      <td style={{ padding: "10px 12px", fontSize: 14, textAlign: "center" }}>{RANK_MEDALS[i]}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>{c.name}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#1e4db7" }}>{fmtKwd(c.revenue)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, textAlign: "center" }}>{c.projects}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 50, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${c.margin}%`, height: "100%", background: "#10b981", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>{c.margin}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#eff6ff", color: "#1e4db7", fontWeight: 700 }}>
                          {i === 0 ? "VIP" : i < 3 ? "Premium" : "Regular"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
