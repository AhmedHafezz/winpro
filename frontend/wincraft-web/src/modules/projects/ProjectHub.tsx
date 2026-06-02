import { useState, useMemo } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DesignRow { code: string; name: string; location: string; w: number; h: number; qty: number; glass: string; series: string; price: number }
interface DocRow    { id: number; name: string; type: string; date: string; size: string; status: string }
interface PayRow    { id: number; desc: string; amount: number; date: string; status: string }
interface Activity  { id: number; type: string; text: string; date: string; user: string }
interface Project   { id: string; name: string; customer: string; phone: string; city: string; status: string; createdAt: string; dueDate: string; assignedTo: string; revision: number; totalQty: number; notes: string; designs: DesignRow[]; documents: DocRow[]; payments: PayRow[]; activities: Activity[] }
interface DB        { projects: Project[] }

// ─── Sample Data ──────────────────────────────────────────────────────────────
const INITIAL: DB = {
  projects: [
    {
      id: "EVA-QT-00001", name: "Lavish Villa", customer: "Mohammed Al-Anazi",
      phone: "96560009876", city: "Kuwait City", status: "Active",
      createdAt: "2024-03-01", dueDate: "2024-05-15", assignedTo: "Sales Team A",
      revision: 2, totalQty: 8, notes: "Premium villa project - priority client",
      designs: [
        { code: "w1", name: "Sliding 2T 2P",  location: "Hall",     w: 1500, h: 1500, qty: 2, glass: "5MM Clear",      series: "NCL VEKA I-60", price: 7707.97 },
        { code: "w2", name: "French Window",   location: "Bedroom",  w: 1500, h: 1500, qty: 1, glass: "5MM Clear",      series: "NCL VEKA I-60", price: 8462.85 },
        { code: "w3", name: "Sliding 2T 2P",  location: "Hall",     w: 1600, h: 1500, qty: 2, glass: "5MM Clear",      series: "NCL VEKA I-60", price: 7707.97 },
        { code: "w4", name: "Sliding 2T 2P",  location: "Kitchen",  w: 1400, h: 1500, qty: 2, glass: "6MM Toughened",  series: "NCL VEKA I-60", price: 9465.04 },
        { code: "w5", name: "Fixed Window",    location: "Bathroom", w: 800,  h: 900,  qty: 1, glass: "8MM Frosted",    series: "NCL VEKA I-60", price: 4200.00 },
      ],
      documents: [
        { id: 1, name: "Quotation Rev.1",       type: "quotation",  date: "2024-03-05", size: "245 KB",  status: "Sent" },
        { id: 2, name: "Quotation Rev.2",       type: "quotation",  date: "2024-03-18", size: "267 KB",  status: "Approved" },
        { id: 3, name: "Shop Drawings W1-W3",   type: "drawing",    date: "2024-03-20", size: "1.2 MB",  status: "Approved" },
        { id: 4, name: "Cutting List",          type: "cutting",    date: "2024-03-22", size: "88 KB",   status: "Pending" },
        { id: 5, name: "Material Request",      type: "material",   date: "2024-03-25", size: "134 KB",  status: "Approved" },
      ],
      payments: [
        { id: 1, desc: "Advance 30%",  amount: 14208, date: "2024-03-10", status: "Received" },
        { id: 2, desc: "Progress 40%", amount: 18944, date: "2024-04-01", status: "Pending" },
        { id: 3, desc: "Final 30%",    amount: 14208, date: "2024-05-10", status: "Pending" },
      ],
      activities: [
        { id: 1, type: "Call",    text: "Confirmed glass specs with client",  date: "2024-03-28", user: "Sales A" },
        { id: 2, type: "Email",   text: "Sent Rev.2 quotation",               date: "2024-03-18", user: "Sales A" },
        { id: 3, type: "Meeting", text: "Site visit and measurements",        date: "2024-03-12", user: "Engineer B" },
      ],
    },
    {
      id: "EVA-QT-00002", name: "Gulf Tower", customer: "Gulf Contracting Co.",
      phone: "96650001234", city: "Salmiya", status: "In Progress",
      createdAt: "2024-02-15", dueDate: "2024-06-30", assignedTo: "Sales Team B",
      revision: 1, totalQty: 35, notes: "Large commercial project - floors 1-10",
      designs: [
        { code: "cw1", name: "Curtain Wall Fixed",  location: "Facade", w: 1500, h: 3200, qty: 20, glass: "10MM Reflective", series: "NCL VEKA CW", price: 48000 },
        { code: "cw2", name: "Curtain Wall Narrow", location: "Facade", w: 800,  h: 3200, qty: 15, glass: "10MM Reflective", series: "NCL VEKA CW", price: 32000 },
      ],
      documents: [
        { id: 1, name: "Quotation Rev.1",  type: "quotation", date: "2024-02-20", size: "312 KB", status: "Approved" },
        { id: 2, name: "Technical Specs",  type: "drawing",   date: "2024-02-25", size: "2.1 MB", status: "Approved" },
      ],
      payments: [
        { id: 1, desc: "Advance 30%",  amount: 240000, date: "2024-03-01", status: "Received" },
        { id: 2, desc: "Progress 40%", amount: 320000, date: "2024-05-01", status: "Pending" },
        { id: 3, desc: "Final 30%",    amount: 240000, date: "2024-06-25", status: "Pending" },
      ],
      activities: [
        { id: 1, type: "Meeting", text: "Contract signing ceremony", date: "2024-02-28", user: "Manager" },
      ],
    },
    {
      id: "EVA-QT-00003", name: "Amal Office", customer: "Amal Real Estate",
      phone: "96522223333", city: "Jahra", status: "Completed",
      createdAt: "2024-01-10", dueDate: "2024-02-28", assignedTo: "Sales Team A",
      revision: 1, totalQty: 12, notes: "Office partitions - floor 2",
      designs: [
        { code: "p1", name: "Office Partition", location: "Office",       w: 1200, h: 2400, qty: 8, glass: "8MM Clear",  series: "GLASS PARTITION", price: 13200 },
        { code: "p2", name: "Office Partition", location: "Meeting Room", w: 1000, h: 2400, qty: 4, glass: "8MM Frosted", series: "GLASS PARTITION", price: 11000 },
      ],
      documents: [
        { id: 1, name: "Quotation Final",       type: "quotation",   date: "2024-01-15", size: "198 KB", status: "Approved" },
        { id: 2, name: "Completion Certificate", type: "certificate", date: "2024-02-28", size: "156 KB", status: "Approved" },
      ],
      payments: [
        { id: 1, desc: "Full Payment", amount: 147200, date: "2024-01-20", status: "Received" },
      ],
      activities: [
        { id: 1, type: "Note", text: "Project completed and handed over", date: "2024-02-28", user: "Engineer B" },
      ],
    },
  ],
};

// ─── Config ────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  "Active":      { color: "#3b82f6", bg: "#eff6ff" },
  "In Progress": { color: "#f59e0b", bg: "#fffbeb" },
  "Completed":   { color: "#10b981", bg: "#ecfdf5" },
  "On Hold":     { color: "#94a3b8", bg: "#f1f5f9" },
  "Cancelled":   { color: "#ef4444", bg: "#fef2f2" },
};
const DOC_ICONS: Record<string, string> = { quotation: "📄", drawing: "📐", cutting: "✂️", material: "📦", certificate: "🏆" };
const DOC_STATUS_CFG: Record<string, string> = { "Approved": "#10b981", "Sent": "#3b82f6", "Pending": "#f59e0b", "Draft": "#94a3b8" };
const PAY_STATUS_CFG: Record<string, string> = { "Received": "#10b981", "Pending": "#f59e0b", "Overdue": "#ef4444" };

const DB_KEY = "eva_project_hub";

function useDB(): [DB, (d: DB) => void] {
  const [data, setData] = useState<DB>(() => {
    try { const s = localStorage.getItem(DB_KEY); return s ? JSON.parse(s) : INITIAL; }
    catch { return INITIAL; }
  });
  const save = (d: DB) => { setData(d); localStorage.setItem(DB_KEY, JSON.stringify(d)); };
  return [data, save];
}

const fmt = (n: number) => Number(n || 0).toLocaleString("en-KW", { minimumFractionDigits: 3 });
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(Math.round(n));

function Badge({ label, cfg }: { label: string; cfg: Record<string, { color: string; bg: string }> }) {
  const c = cfg[label] || { color: "#64748b", bg: "#f1f5f9" };
  return <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: c.bg, color: c.color, fontWeight: 700, border: `1px solid ${c.color}22`, whiteSpace: "nowrap" }}>{label}</span>;
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 16px", overflowY: "auto" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: wide ? 960 : 560, direction: "rtl", marginTop: 8 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, color: "#64748b" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", direction: "rtl" };
const selS: React.CSSProperties = { ...inp, background: "#fff", cursor: "pointer" };
const btnP = (c = "#1e4db7"): React.CSSProperties => ({ padding: "9px 18px", background: c, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 });
const btnG: React.CSSProperties = { padding: "9px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 };

// ─── Project Detail ────────────────────────────────────────────────────────────
function ProjectDetail({ project, onClose, onUpdate }: { project: Project; onClose: () => void; onUpdate: (p: Project) => void }) {
  const [subTab, setSubTab] = useState("documents");
  const [actForm, setActForm] = useState({ type: "Call", text: "", date: new Date().toISOString().split("T")[0], user: "Sales" });

  const totalValue   = project.designs.reduce((s, d) => s + d.price * d.qty, 0);
  const totalQty     = project.designs.reduce((s, d) => s + d.qty, 0);
  const paidAmount   = project.payments.filter(p => p.status === "Received").reduce((s, p) => s + p.amount, 0);
  const pendingAmount = project.payments.filter(p => p.status !== "Received").reduce((s, p) => s + p.amount, 0);
  const totalArea    = project.designs.reduce((s, d) => s + (d.w * d.h / 1e6) * d.qty, 0);

  const subTabs = [
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "pricing",   label: "Pricing",   icon: "💰" },
    { id: "designs",   label: "Designs",   icon: "🪟" },
    { id: "payments",  label: "Payments",  icon: "💳" },
    { id: "activity",  label: "Activity",  icon: "📝" },
    { id: "reports",   label: "Reports",   icon: "📊" },
  ];

  function addActivity() {
    if (!actForm.text.trim()) return;
    onUpdate({ ...project, activities: [{ ...actForm, id: Date.now() }, ...project.activities] });
    setActForm(f => ({ ...f, text: "" }));
  }

  function togglePayStatus(payId: number) {
    onUpdate({ ...project, payments: project.payments.map(p => p.id === payId ? { ...p, status: p.status === "Received" ? "Pending" : "Received" } : p) });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#f0f4f8", zIndex: 500, overflowY: "auto", direction: "rtl" }}>
      {/* Header */}
      <div style={{ background: "#1e4db7", color: "#fff", padding: "0 24px", display: "flex", alignItems: "center", gap: 12, height: 56, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>← Back</button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{project.name}</div>
          <div style={{ fontSize: 10, color: "#93c5fd" }}>{project.id} • Rev.{project.revision}</div>
        </div>
        <div style={{ marginRight: "auto", display: "flex", gap: 20, alignItems: "center" }}>
          {[["Total Value", `${fmt(totalValue)} KWD`], ["Qty", String(totalQty)], ["Area", `${totalArea.toFixed(1)} m²`]].map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#93c5fd" }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{v}</div>
            </div>
          ))}
        </div>
        <button style={btnP("#f97316")}>Quick Quote</button>
      </div>

      {/* Customer strip */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 24px", display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#1e4db7" }}>
            {project.customer.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{project.customer}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{project.phone} • {project.city}</div>
          </div>
        </div>
        <Badge label={project.status} cfg={STATUS_CFG} />
        <div style={{ fontSize: 12, color: "#64748b" }}>Due: <b>{project.dueDate}</b></div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Assigned: <b>{project.assignedTo}</b></div>
      </div>

      {/* Sub-tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex" }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{ background: "none", border: "none", borderBottom: subTab === t.id ? "2px solid #1e4db7" : "2px solid transparent", color: subTab === t.id ? "#1e4db7" : "#64748b", padding: "10px 14px", cursor: "pointer", fontSize: 12, fontWeight: subTab === t.id ? 700 : 400, display: "flex", gap: 5, alignItems: "center" }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 24 }}>

        {/* DOCUMENTS */}
        {subTab === "documents" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Documents</h3>
              <button style={btnP()}>+ Upload Document</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {project.documents.map(doc => {
                const dColor = DOC_STATUS_CFG[doc.status] || "#94a3b8";
                return (
                  <div key={doc.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{DOC_ICONS[doc.type] || "📄"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{doc.date} • {doc.size}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: dColor + "18", color: dColor, fontWeight: 700, border: `1px solid ${dColor}33` }}>{doc.status}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ padding: "5px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>👁 View</button>
                      <button style={{ padding: "5px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 11, color: "#1e4db7" }}>⬇ Download</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRICING */}
        {subTab === "pricing" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Pricing Summary</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btnG, fontSize: 12 }}>Create Revision</button>
                <button style={btnP()}>Generate Quote PDF</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              {([
                ["Total Value",  `${fmt(totalValue)} KWD`,                         "#1e4db7"],
                ["Total Area",   `${totalArea.toFixed(2)} m²`,                     "#8b5cf6"],
                ["Total Qty",    String(totalQty),                                 "#10b981"],
                ["Avg/Unit",     totalQty ? `${fmt(totalValue / totalQty)} KWD` : "—", "#f59e0b"],
              ] as [string, string, string][]).map(([l, v, c]) => (
                <div key={l} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${c}` }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ background: "#0f172a", color: "#fff", padding: "10px 16px", display: "grid", gridTemplateColumns: "80px 2fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: 8, fontSize: 11, fontWeight: 700 }}>
                {["Code","Description","Location","W×H (mm)","Glass","Qty","Unit Price","Total"].map(h => <span key={h}>{h}</span>)}
              </div>
              {project.designs.map((d, idx) => (
                <div key={d.code} style={{ padding: "11px 16px", display: "grid", gridTemplateColumns: "80px 2fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center", borderTop: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafbfc", fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: "#1e4db7", fontFamily: "monospace" }}>{d.code}</span>
                  <div><div style={{ fontWeight: 600 }}>{d.name}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{d.series}</div></div>
                  <span>{d.location}</span>
                  <span>{d.w}×{d.h}</span>
                  <span>{d.glass}</span>
                  <span style={{ fontWeight: 700 }}>{d.qty}</span>
                  <span>{fmt(d.price)} KWD</span>
                  <span style={{ fontWeight: 800, color: "#10b981" }}>{fmt(d.price * d.qty)} KWD</span>
                </div>
              ))}
              {([
                ["Subtotal",      totalValue,                    ""],
                ["Discount (5%)", -totalValue * 0.05,            ""],
                ["Tax (15%)",     totalValue * 0.95 * 0.15,     ""],
              ] as [string, number, string][]).map(([label, val]) => (
                <div key={label} style={{ padding: "8px 16px", display: "grid", gridTemplateColumns: "80px 2fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: 8, borderTop: "1px solid #e2e8f0" }}>
                  {[null,null,null,null,null,null].map((_, i) => <span key={i} />)}
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: val < 0 ? "#ef4444" : "#475569" }}>{val < 0 ? "-" : ""}{fmt(Math.abs(val))} KWD</span>
                </div>
              ))}
              <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "80px 2fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: 8, borderTop: "2px solid #1e4db7", background: "#f8fafc" }}>
                {[null,null,null,null,null,null].map((_, i) => <span key={i} />)}
                <span style={{ fontSize: 14, fontWeight: 800 }}>Grand Total</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#1e4db7" }}>{fmt(totalValue * 0.95 * 1.15)} KWD</span>
              </div>
            </div>
          </div>
        )}

        {/* DESIGNS */}
        {subTab === "designs" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Window &amp; Door Designs</h3>
              <button style={btnP()}>Open Configurator</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {project.designs.map(d => (
                <div key={d.code} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e4db7" }}>{d.code}</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Qty: {d.qty}</span>
                  </div>
                  <div style={{ padding: 12, background: "#f8fafc", display: "flex", justifyContent: "center" }}>
                    <svg width={140} height={120} style={{ background: "#d4c4a8", borderRadius: 4 }}>
                      <rect x={16} y={12} width={108} height={96} fill="#bfdbfe" fillOpacity="0.5" stroke="#475569" strokeWidth={6} />
                      <line x1={70} y1={12} x2={70} y2={108} stroke="#475569" strokeWidth={5} />
                      <line x1={70} y1={60} x2={50} y2={60} stroke="#475569" strokeWidth={1.5} strokeLinecap="round" />
                      <polygon points="50,60 56,56 56,64" fill="#475569" />
                      <line x1={70} y1={60} x2={90} y2={60} stroke="#475569" strokeWidth={1.5} strokeLinecap="round" />
                      <polygon points="90,60 84,56 84,64" fill="#475569" />
                      <text x={70} y={116} textAnchor="middle" fontSize={9} fill="#1e4db7" fontWeight="700">{d.w}×{d.h}</text>
                    </svg>
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{d.location} • {d.glass}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{d.series}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e4db7", marginTop: 6 }}>{fmt(d.price * d.qty)} KWD</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {subTab === "payments" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Payment Schedule</h3>
              <button style={btnP()}>+ Add Payment</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
              {([["Total Value", fmt(totalValue) + " KWD", "#1e4db7"], ["Received", fmt(paidAmount) + " KWD", "#10b981"], ["Pending", fmt(pendingAmount) + " KWD", "#f59e0b"]] as [string, string, string][]).map(([l, v, c]) => (
                <div key={l} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${c}` }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                <span>Collection Progress</span>
                <span style={{ fontWeight: 700, color: "#10b981" }}>{totalValue > 0 ? Math.round((paidAmount / totalValue) * 100) : 0}%</span>
              </div>
              <div style={{ height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${totalValue > 0 ? (paidAmount / totalValue) * 100 : 0}%`, height: "100%", background: "#10b981", borderRadius: 5 }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {project.payments.map(p => {
                const pColor = PAY_STATUS_CFG[p.status] || "#94a3b8";
                return (
                  <div key={p.id} style={{ background: "#fff", border: `1px solid ${p.status === "Received" ? "#10b98133" : "#e2e8f0"}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: p.status === "Received" ? "#ecfdf5" : "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      {p.status === "Received" ? "✅" : "⏳"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.desc}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{p.date}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: pColor }}>{fmt(p.amount)} KWD</div>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: pColor + "18", color: pColor, fontWeight: 700, border: `1px solid ${pColor}33` }}>{p.status}</span>
                    <button onClick={() => togglePayStatus(p.id)} style={{ padding: "5px 10px", background: p.status === "Received" ? "#fef2f2" : "#ecfdf5", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, color: p.status === "Received" ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                      {p.status === "Received" ? "Mark Pending" : "Mark Received"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        {subTab === "activity" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Activity Log</h3>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4, fontWeight: 600 }}>Type</label>
                  <select style={selS} value={actForm.type} onChange={e => setActForm(f => ({ ...f, type: e.target.value }))}>
                    {["Call","Email","Meeting","Note","Task"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4, fontWeight: 600 }}>Date</label>
                  <input style={inp} type="date" value={actForm.date} onChange={e => setActForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4, fontWeight: 600 }}>User</label>
                  <input style={inp} value={actForm.user} onChange={e => setActForm(f => ({ ...f, user: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...inp, flex: 1 }} value={actForm.text} onChange={e => setActForm(f => ({ ...f, text: e.target.value }))} placeholder="Add note, task, or log..." />
                <button onClick={addActivity} style={btnP()}>+ Add</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {project.activities.map(a => (
                <div key={a.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {a.type === "Call" ? "📞" : a.type === "Email" ? "📧" : a.type === "Meeting" ? "🤝" : "📝"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.text}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{a.user} • {a.date}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: "2px 8px", background: "#f1f5f9", color: "#475569", borderRadius: 6, fontWeight: 600 }}>{a.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS */}
        {subTab === "reports" && (
          <div>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Project Reports</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
              {([
                ["Project Value",  fmt(totalValue) + " KWD",           "Before tax & discount",    "#1e4db7"],
                ["Final Price",    fmt(totalValue * 0.95 * 1.15) + " KWD", "-5% disc +15% tax",    "#10b981"],
                ["Glass Area",     totalArea.toFixed(2) + " m²",        `${totalQty} units`,        "#8b5cf6"],
                ["Collected",      fmt(paidAmount) + " KWD",            `${totalValue > 0 ? Math.round((paidAmount / totalValue) * 100) : 0}% of total`, "#f59e0b"],
              ] as [string, string, string, string][]).map(([l, v, sub, c]) => (
                <div key={l} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, borderTop: `3px solid ${c}` }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c, margin: "4px 0" }}>{v}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Design Value Breakdown</div>
              {project.designs.map(d => {
                const pct = totalValue > 0 ? Math.round((d.price * d.qty / totalValue) * 100) : 0;
                return (
                  <div key={d.code} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1e4db7", minWidth: 30, fontFamily: "monospace" }}>{d.code}</span>
                    <span style={{ fontSize: 11, color: "#475569", minWidth: 140 }}>{d.name}</span>
                    <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#1e4db7", borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, minWidth: 40, fontWeight: 600 }}>{pct}%</span>
                    <span style={{ fontSize: 11, minWidth: 90, fontWeight: 700, color: "#10b981" }}>{fmt(d.price * d.qty)} KWD</span>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Aluminum &amp; Material Estimate</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                {([
                  ["Total Glass Area",   `${totalArea.toFixed(2)} m²`,                                                                                                   "🪟", "#bfdbfe"],
                  ["Est. Profile Length",`${project.designs.reduce((s, d) => s + 2 * (d.w + d.h) / 1000 * d.qty, 0).toFixed(1)} m`,                                    "📏", "#bbf7d0"],
                  ["Aluminum Weight",    `${project.designs.reduce((s, d) => s + 2 * (d.w + d.h) / 1000 * 1.8 * d.qty, 0).toFixed(0)} kg`,                             "⚖️", "#fde68a"],
                  ["Sealant (est.)",     `${(totalArea * 1.2).toFixed(0)} tubes`,                                                                                        "🔧", "#e9d5ff"],
                ] as [string, string, string, string][]).map(([l, v, ic, bg]) => (
                  <div key={l} style={{ background: bg + "44", border: `1px solid ${bg}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{ic}</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Cutting List Report","Material Request","Glass Schedule","BOM Export"].map(r => (
                  <button key={r} style={{ padding: "7px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", fontSize: 11, color: "#475569", fontWeight: 600 }}>⬇ {r}</button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Main Projects List ────────────────────────────────────────────────────────
export default function ProjectHub() {
  const [data, save] = useDB();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [sortBy, setSortBy] = useState("date");

  const { projects } = data;

  const stats = useMemo(() => ({
    total:      projects.length,
    active:     projects.filter(p => p.status === "Active").length,
    inProgress: projects.filter(p => p.status === "In Progress").length,
    completed:  projects.filter(p => p.status === "Completed").length,
    totalValue: projects.reduce((s, p) => s + p.designs.reduce((ss, d) => ss + d.price * d.qty, 0), 0),
    totalQty:   projects.reduce((s, p) => s + p.designs.reduce((ss, d) => ss + d.qty, 0), 0),
  }), [projects]);

  const filtered = useMemo(() => projects.filter(p => {
    const ms = p.name.includes(search) || p.customer.includes(search) || p.id.includes(search);
    const mst = statusFilter === "الكل" || p.status === statusFilter;
    return ms && mst;
  }).sort((a, b) =>
    sortBy === "value"
      ? b.designs.reduce((s, d) => s + d.price * d.qty, 0) - a.designs.reduce((s, d) => s + d.price * d.qty, 0)
      : b.createdAt.localeCompare(a.createdAt)
  ), [projects, search, statusFilter, sortBy]);

  function saveProject(f: Record<string, string>) {
    const existing = projects.find(x => x.id === f.id);
    const updated = existing
      ? projects.map(x => x.id === f.id ? { ...x, ...f } : x)
      : [...projects, { ...f, designs: [], documents: [], payments: [], activities: [], revision: 1, totalQty: 0 } as unknown as Project];
    save({ ...data, projects: updated });
    setModal(null); setForm({});
  }

  function updateProject(updated: Project) {
    save({ ...data, projects: projects.map(p => p.id === updated.id ? updated : p) });
    setActiveProject(updated);
  }

  if (activeProject) {
    return <ProjectDetail project={activeProject} onClose={() => setActiveProject(null)} onUpdate={updateProject} />;
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", direction: "rtl", background: "#f0f4f8", minHeight: "100vh", color: "#1e293b" }}>
      {/* Header */}
      <div style={{ background: "#0f172a", color: "#fff", padding: "0 24px", display: "flex", alignItems: "center", height: 56, gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>EvA <span style={{ color: "#3b82f6" }}>CRM</span></div>
        <div style={{ width: 1, height: 24, background: "#1e293b" }} />
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Project Hub</div>
        <div style={{ marginRight: "auto" }} />
        <button onClick={() => { setForm({ id: `EVA-QT-${String(projects.length + 1).padStart(5, "0")}`, status: "Active", createdAt: new Date().toISOString().split("T")[0] }); setModal("project"); }} style={btnP()}>+ New Project</button>
      </div>

      <div style={{ padding: 24 }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
          {([
            ["Total Projects",  stats.total,                               "#1e4db7"],
            ["Active",          stats.active,                              "#3b82f6"],
            ["In Progress",     stats.inProgress,                          "#f59e0b"],
            ["Completed",       stats.completed,                           "#10b981"],
            ["Total Pipeline",  `${(stats.totalValue / 1000).toFixed(0)}K KWD`, "#8b5cf6"],
            ["Total Units",     stats.totalQty,                            "#f97316"],
          ] as [string, string | number, string][]).map(([l, v, c]) => (
            <div key={l} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${c}` }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="بحث بالاسم، العميل، الكود..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, maxWidth: 280 }} />
          <div style={{ display: "flex", gap: 6 }}>
            {["الكل","Active","In Progress","Completed","On Hold"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${statusFilter === s ? "#1e4db7" : "#e2e8f0"}`, background: statusFilter === s ? "#eff6ff" : "#fff", color: statusFilter === s ? "#1e4db7" : "#64748b", fontSize: 11, cursor: "pointer", fontWeight: statusFilter === s ? 700 : 400 }}>{s}</button>
            ))}
          </div>
          <select style={{ ...selS, maxWidth: 160 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date">Sort: Date</option>
            <option value="value">Sort: Value</option>
          </select>
        </div>

        {/* Projects grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {filtered.map(p => {
            const totalVal  = p.designs.reduce((s, d) => s + d.price * d.qty, 0);
            const totalQtyP = p.designs.reduce((s, d) => s + d.qty, 0);
            const totalPay  = p.payments.reduce((s, x) => s + x.amount, 0);
            const paid      = p.payments.filter(x => x.status === "Received").reduce((s, x) => s + x.amount, 0);
            const paidPct   = totalPay > 0 ? Math.round((paid / totalPay) * 100) : 0;
            return (
              <div key={p.id} onClick={() => setActiveProject(p)} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#1e4db7")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: "#1e4db7", fontWeight: 700 }}>{p.id}</div>
                  </div>
                  <Badge label={p.status} cfg={STATUS_CFG} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#1e4db7" }}>
                    {p.customer.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <div style={{ fontSize: 12 }}>{p.customer} — <span style={{ color: "#64748b" }}>{p.city}</span></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {([["Value", `${fmtK(totalVal)} KWD`, "#10b981"], ["Units", String(totalQtyP), "#1e4db7"], ["Due", p.dueDate, "#f59e0b"]] as [string, string, string][]).map(([l, v, c]) => (
                    <div key={l} style={{ background: "#f8fafc", borderRadius: 7, padding: "6px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{l}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>
                    <span>Payment collected</span><span style={{ fontWeight: 700, color: "#10b981" }}>{paidPct}%</span>
                  </div>
                  <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${paidPct}%`, height: "100%", background: "#10b981", borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>📄 {p.documents.length} docs • 🪟 {p.designs.length} designs • Rev.{p.revision}</div>
                  <span style={{ fontSize: 11, color: "#1e4db7", fontWeight: 700 }}>Open →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal === "project" && (
        <Modal title="New Project" onClose={() => setModal(null)}>
          {([
            ["Project Name",  "name",       "text", "Lavish Villa"],
            ["Project ID",    "id",         "text", "EVA-QT-XXXXX"],
            ["Customer Name", "customer",   "text", ""],
            ["Phone",         "phone",      "text", "965XXXXXXXX"],
            ["City",          "city",       "text", ""],
            ["Due Date",      "dueDate",    "date", ""],
            ["Assigned To",   "assignedTo", "text", ""],
            ["Notes",         "notes",      "text", ""],
          ] as [string, string, string, string][]).map(([l, k, t, ph]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>{l}</label>
              <input style={inp} type={t} placeholder={ph} value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>Status</label>
            <select style={selS} value={form.status || "Active"} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {Object.keys(STATUS_CFG).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnP()} onClick={() => saveProject(form)}>Save Project</button>
            <button style={btnG} onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
