import { useState } from "react";

const DB_KEY = "eva_crm";

type CustomerType = "individual" | "company" | "contractor" | "developer";
type CustomerStatus = "active" | "inactive" | "prospect" | "vip";
type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
type ActivityType = "call" | "email" | "meeting" | "note" | "task";

interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone: string;
  email: string;
  city: string;
  status: CustomerStatus;
  totalValue: number;
  projectCount: number;
  createdAt: string;
  notes: string;
}

interface Deal {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedClose: string;
  assignedTo: string;
}

interface Activity {
  id: string;
  customerId: string;
  customerName: string;
  type: ActivityType;
  text: string;
  date: string;
  done: boolean;
}

interface DB {
  customers: Customer[];
  deals: Deal[];
  activities: Activity[];
}

const INITIAL: DB = {
  customers: [
    { id: "c1", name: "أحمد الكندري", type: "individual", phone: "9900-1234", email: "ahmed@example.com", city: "مبارك الكبير", status: "vip", totalValue: 45200.000, projectCount: 3, createdAt: "2024-01-15", notes: "عميل مميز، يفضل التواصل هاتفياً" },
    { id: "c2", name: "شركة الخليج للإنشاءات", type: "company", phone: "2200-5678", email: "gulf@example.com", city: "الشويخ", status: "active", totalValue: 128500.000, projectCount: 7, createdAt: "2023-06-01", notes: "" },
    { id: "c3", name: "مؤسسة الأمل", type: "contractor", phone: "9955-2200", email: "amal@example.com", city: "السالمية", status: "prospect", totalValue: 0, projectCount: 0, createdAt: "2024-07-20", notes: "تم التواصل عبر معرض البناء" },
    { id: "c4", name: "فيصل المطيري", type: "individual", phone: "6600-3344", email: "faisal@example.com", city: "الجهراء", status: "active", totalValue: 18900.000, projectCount: 1, createdAt: "2024-03-10", notes: "" },
  ],
  deals: [
    { id: "d1", customerId: "c2", customerName: "شركة الخليج للإنشاءات", title: "مشروع برج الخليج — المرحلة الثانية", value: 85000.000, stage: "proposal", probability: 65, expectedClose: "2024-09-01", assignedTo: "محمد فهد" },
    { id: "d2", customerId: "c3", customerName: "مؤسسة الأمل", title: "واجهات مكتب الأمل", value: 22000.000, stage: "qualified", probability: 40, expectedClose: "2024-10-15", assignedTo: "سعد المطيري" },
    { id: "d3", customerId: "c4", customerName: "فيصل المطيري", title: "نوافذ فيلا الجهراء", value: 15500.000, stage: "negotiation", probability: 80, expectedClose: "2024-08-20", assignedTo: "محمد فهد" },
    { id: "d4", customerId: "c1", customerName: "أحمد الكندري", title: "إضافات فيلا لافيش", value: 12000.000, stage: "won", probability: 100, expectedClose: "2024-07-30", assignedTo: "خالد الرشيدي" },
  ],
  activities: [
    { id: "a1", customerId: "c1", customerName: "أحمد الكندري", type: "call", text: "مكالمة متابعة عرض السعر رقم QT-2024-001", date: "2024-07-25 10:30", done: true },
    { id: "a2", customerId: "c2", customerName: "شركة الخليج", type: "meeting", text: "اجتماع لمناقشة مواصفات المرحلة الثانية", date: "2024-07-26 14:00", done: false },
    { id: "a3", customerId: "c3", customerName: "مؤسسة الأمل", type: "email", text: "إرسال عرض الأسعار الأولي", date: "2024-07-24 09:15", done: true },
    { id: "a4", customerId: "c4", customerName: "فيصل المطيري", type: "task", text: "مراجعة العقد النهائي وإرسال للتوقيع", date: "2024-07-28 11:00", done: false },
  ],
};

function useDB(): [DB, (d: DB) => void] {
  const [db, setDbState] = useState<DB>(() => {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY) || "null") ?? INITIAL;
    } catch {
      return INITIAL;
    }
  });
  const setDb = (d: DB) => {
    localStorage.setItem(DB_KEY, JSON.stringify(d));
    setDbState(d);
  };
  return [db, setDb];
}

const TYPE_CFG: Record<CustomerType, { label: string; color: string }> = {
  individual:  { label: "أفراد",      color: "#2563eb" },
  company:     { label: "شركة",       color: "#7c3aed" },
  contractor:  { label: "مقاول",      color: "#d97706" },
  developer:   { label: "مطوّر",      color: "#059669" },
};

const STATUS_CFG: Record<CustomerStatus, { label: string; color: string; bg: string }> = {
  active:   { label: "نشط",    color: "#059669", bg: "#d1fae5" },
  inactive: { label: "غير نشط", color: "#6b7280", bg: "#f3f4f6" },
  prospect: { label: "محتمل",  color: "#d97706", bg: "#fef3c7" },
  vip:      { label: "VIP",    color: "#7c3aed", bg: "#ede9fe" },
};

const STAGE_CFG: Record<DealStage, { label: string; color: string; bg: string }> = {
  lead:        { label: "عميل محتمل", color: "#6b7280", bg: "#f3f4f6" },
  qualified:   { label: "مؤهّل",     color: "#2563eb", bg: "#dbeafe" },
  proposal:    { label: "عرض سعر",   color: "#d97706", bg: "#fef3c7" },
  negotiation: { label: "تفاوض",     color: "#7c3aed", bg: "#ede9fe" },
  won:         { label: "مكسوب",     color: "#059669", bg: "#d1fae5" },
  lost:        { label: "خسارة",     color: "#dc2626", bg: "#fee2e2" },
};

const ACT_ICONS: Record<ActivityType, string> = {
  call: "📞", email: "📧", meeting: "🤝", note: "📝", task: "✅",
};

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("");
  const colors = ["#1e4db7", "#7c3aed", "#059669", "#d97706", "#dc2626"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function CRMPage() {
  const [db, setDb] = useDB();
  const [view, setView] = useState<"customers" | "pipeline" | "activities">("customers");
  const [selected, setSelected] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [actForm, setActForm] = useState<Record<string, string>>({});
  const [showActForm, setShowActForm] = useState(false);

  const filtered = db.customers.filter(c => {
    const matchStatus = !filterStatus || c.status === filterStatus;
    const matchSearch = !search || c.name.includes(search) || c.phone.includes(search) || c.email.includes(search);
    return matchStatus && matchSearch;
  });

  const activeCustomer = db.customers.find(c => c.id === selected) ?? null;

  const saveCustomer = () => {
    const nc: Customer = {
      id: `c-${Date.now()}`,
      name: form.name || "",
      type: (form.type as CustomerType) || "individual",
      phone: form.phone || "",
      email: form.email || "",
      city: form.city || "",
      status: (form.status as CustomerStatus) || "prospect",
      totalValue: 0,
      projectCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
      notes: form.notes || "",
    };
    setDb({ ...db, customers: [nc, ...db.customers] });
    setShowForm(false);
    setForm({});
  };

  const saveActivity = () => {
    const na: Activity = {
      id: `a-${Date.now()}`,
      customerId: actForm.customerId || "",
      customerName: db.customers.find(c => c.id === actForm.customerId)?.name || "",
      type: (actForm.type as ActivityType) || "note",
      text: actForm.text || "",
      date: actForm.date || new Date().toISOString().slice(0, 16),
      done: false,
    };
    setDb({ ...db, activities: [na, ...db.activities] });
    setShowActForm(false);
    setActForm({});
  };

  const toggleActivity = (id: string) => {
    setDb({ ...db, activities: db.activities.map(a => a.id === id ? { ...a, done: !a.done } : a) });
  };

  const totalPipeline = db.deals.filter(d => d.stage !== "lost").reduce((s, d) => s + d.value * (d.probability / 100), 0);
  const totalCustomers = db.customers.length;
  const activeDeals = db.deals.filter(d => !["won", "lost"].includes(d.stage)).length;
  const pendingActivities = db.activities.filter(a => !a.done).length;

  const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" as const };
  const lbl: React.CSSProperties = { fontSize: 12, color: "#64748b", marginBottom: 4, display: "block" };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", direction: "rtl", background: "#f1f5f9", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e293b" }}>إدارة العملاء (CRM)</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>متابعة العملاء والصفقات والنشاطات</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {view === "activities" && (
            <button onClick={() => setShowActForm(true)} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ نشاط جديد</button>
          )}
          {view === "customers" && (
            <button onClick={() => setShowForm(true)} style={{ background: "#1e4db7", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ عميل جديد</button>
          )}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "إجمالي العملاء", value: totalCustomers, color: "#1e4db7", bg: "#eff6ff" },
          { label: "إجمالي العملاء النشطين", value: db.customers.filter(c => c.status === "active" || c.status === "vip").length, color: "#059669", bg: "#f0fdf4" },
          { label: "صفقات مفتوحة", value: activeDeals, color: "#d97706", bg: "#fffbeb" },
          { label: "نشاطات معلقة", value: pendingActivities, color: "#dc2626", bg: "#fef2f2" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: "14px 18px", border: `1px solid ${c.color}22` }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline value banner */}
      <div style={{ background: "linear-gradient(135deg, #1e4db7, #3b82f6)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>قيمة خط الأعمال المتوقعة (weighted)</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "monospace" }}>{totalPipeline.toFixed(3)} د.ك</div>
        </div>
        <div style={{ fontSize: 40, opacity: 0.3 }}>📈</div>
      </div>

      {/* View tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e2e8f0", width: "fit-content" }}>
        {([["customers", "العملاء 👥"], ["pipeline", "خط الأعمال 🔄"], ["activities", "النشاطات 📋"]] as [typeof view, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{ padding: "7px 20px", borderRadius: 7, border: "none", background: view === v ? "#1e4db7" : "none", color: view === v ? "#fff" : "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            {l}
          </button>
        ))}
      </div>

      {/* Customers View */}
      {view === "customers" && (
        <div style={{ display: "grid", gridTemplateColumns: activeCustomer ? "1fr 1fr" : "1fr", gap: 16 }}>
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input
                placeholder="بحث بالاسم أو الهاتف..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inp, flex: 1, maxWidth: 280 }}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["", "active", "vip", "prospect", "inactive"].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "5px 12px", borderRadius: 18, fontSize: 11, fontWeight: 600, cursor: "pointer", border: filterStatus === s ? "none" : "1px solid #e2e8f0", background: filterStatus === s ? "#1e4db7" : "#fff", color: filterStatus === s ? "#fff" : "#475569" }}>
                    {s === "" ? "الكل" : STATUS_CFG[s as CustomerStatus].label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(c => {
                const sc = STATUS_CFG[c.status];
                const tc = TYPE_CFG[c.type];
                return (
                  <div key={c.id} onClick={() => setSelected(c.id)} style={{ background: "#fff", borderRadius: 10, padding: 14, cursor: "pointer", border: selected === c.id ? "2px solid #1e4db7" : "1px solid #e2e8f0", boxShadow: selected === c.id ? "0 0 0 3px #1e4db722" : "0 1px 3px #0001", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <Avatar name={c.name} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{c.name}</div>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        <span style={{ color: tc.color, fontWeight: 600 }}>{tc.label}</span> — {c.city}
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12 }}>
                        <span style={{ color: "#475569" }}>{c.phone}</span>
                        <span style={{ color: "#1e4db7", fontFamily: "monospace", fontWeight: 700 }}>{c.totalValue.toFixed(3)} د.ك</span>
                        <span style={{ color: "#64748b" }}>{c.projectCount} مشاريع</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {activeCustomer && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", gap: 14, alignItems: "center" }}>
                <Avatar name={activeCustomer.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>{activeCustomer.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{TYPE_CFG[activeCustomer.type].label} — {activeCustomer.city}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>✕</button>
              </div>

              <div style={{ padding: 16 }}>
                {[["الهاتف", activeCustomer.phone], ["البريد", activeCustomer.email], ["المدينة", activeCustomer.city], ["العضو منذ", activeCustomer.createdAt]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>{l}</span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>إجمالي القيمة</span>
                  <span style={{ fontWeight: 700, color: "#1e4db7", fontFamily: "monospace" }}>{activeCustomer.totalValue.toFixed(3)} د.ك</span>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>الصفقات</div>
                  {db.deals.filter(d => d.customerId === activeCustomer.id).map(d => {
                    const sc = STAGE_CFG[d.stage];
                    return (
                      <div key={d.id} style={{ background: "#f8fafc", borderRadius: 8, padding: 10, marginBottom: 8, border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{d.title}</div>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "flex", gap: 12 }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e4db7" }}>{d.value.toFixed(3)} د.ك</span>
                          <span>احتمالية: {d.probability}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeCustomer.notes && (
                  <div style={{ marginTop: 12, padding: 10, background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#475569" }}>
                    {activeCustomer.notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pipeline View */}
      {view === "pipeline" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {(["lead", "qualified", "proposal", "negotiation", "won", "lost"] as DealStage[]).map(stage => {
              const sc = STAGE_CFG[stage];
              const stageDeals = db.deals.filter(d => d.stage === stage);
              const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
              return (
                <div key={stage} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", background: sc.bg, borderBottom: `2px solid ${sc.color}` }}>
                    <div style={{ fontWeight: 700, color: sc.color, fontSize: 13 }}>{sc.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{stageDeals.length} صفقة — {stageValue.toFixed(3)} د.ك</div>
                  </div>
                  <div style={{ padding: 10 }}>
                    {stageDeals.length === 0 ? (
                      <div style={{ textAlign: "center", color: "#cbd5e1", padding: "20px 0", fontSize: 12 }}>لا توجد صفقات</div>
                    ) : (
                      stageDeals.map(d => (
                        <div key={d.id} style={{ background: "#f8fafc", borderRadius: 8, padding: 10, marginBottom: 8, border: "1px solid #e2e8f0" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>{d.title}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{d.customerName}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e4db7" }}>{d.value.toFixed(3)} د.ك</span>
                            <span style={{ color: "#64748b" }}>{d.probability}%</span>
                          </div>
                          <div style={{ background: "#e2e8f0", borderRadius: 3, height: 4, marginTop: 6 }}>
                            <div style={{ width: `${d.probability}%`, height: "100%", borderRadius: 3, background: sc.color }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activities View */}
      {view === "activities" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {db.activities.map(a => (
            <div key={a.id} style={{ background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0", display: "flex", gap: 12, alignItems: "flex-start", opacity: a.done ? 0.6 : 1 }}>
              <div style={{ fontSize: 24 }}>{ACT_ICONS[a.type]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b", textDecoration: a.done ? "line-through" : "none" }}>{a.text}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{a.customerName} — {a.date}</div>
                  </div>
                  <button onClick={() => toggleActivity(a.id)} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: a.done ? "#f1f5f9" : "#1e4db7", color: a.done ? "#94a3b8" : "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                    {a.done ? "مكتمل ✓" : "إنهاء"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Customer Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 480, maxWidth: "95vw", boxShadow: "0 20px 60px #0003" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>عميل جديد</h2>
              <button onClick={() => setShowForm(false)} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["name", "الاسم"], ["phone", "الهاتف"], ["email", "البريد"], ["city", "المدينة"]].map(([k, l]) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <input value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} style={inp} />
                </div>
              ))}
              <div>
                <label style={lbl}>النوع</label>
                <select value={form.type || "individual"} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
                  <option value="individual">أفراد</option>
                  <option value="company">شركة</option>
                  <option value="contractor">مقاول</option>
                  <option value="developer">مطوّر</option>
                </select>
              </div>
              <div>
                <label style={lbl}>الحالة</label>
                <select value={form.status || "prospect"} onChange={e => setForm({ ...form, status: e.target.value })} style={inp}>
                  <option value="prospect">محتمل</option>
                  <option value="active">نشط</option>
                  <option value="vip">VIP</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={lbl}>ملاحظات</label>
              <textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inp, height: 70, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 14 }}>إلغاء</button>
              <button onClick={saveCustomer} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "#1e4db7", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* New Activity Modal */}
      {showActForm && (
        <div style={{ position: "fixed", inset: 0, background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 440, maxWidth: "95vw", boxShadow: "0 20px 60px #0003" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>نشاط جديد</h2>
              <button onClick={() => setShowActForm(false)} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={lbl}>العميل</label>
                <select value={actForm.customerId || ""} onChange={e => setActForm({ ...actForm, customerId: e.target.value })} style={inp}>
                  <option value="">-- اختر عميل --</option>
                  {db.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>نوع النشاط</label>
                <select value={actForm.type || "note"} onChange={e => setActForm({ ...actForm, type: e.target.value })} style={inp}>
                  <option value="call">مكالمة 📞</option>
                  <option value="email">بريد 📧</option>
                  <option value="meeting">اجتماع 🤝</option>
                  <option value="note">ملاحظة 📝</option>
                  <option value="task">مهمة ✅</option>
                </select>
              </div>
              <div>
                <label style={lbl}>الوصف</label>
                <textarea value={actForm.text || ""} onChange={e => setActForm({ ...actForm, text: e.target.value })} style={{ ...inp, height: 80, resize: "vertical" }} />
              </div>
              <div>
                <label style={lbl}>التاريخ والوقت</label>
                <input type="datetime-local" value={actForm.date || ""} onChange={e => setActForm({ ...actForm, date: e.target.value })} style={inp} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowActForm(false)} style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 14 }}>إلغاء</button>
              <button onClick={saveActivity} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
