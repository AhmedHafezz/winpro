import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DB_KEY = "eva_shopfloor";

interface CutPiece {
  id: string;
  profile: string;
  length: number;
  qty: number;
  color: string;
  projectCode: string;
  status: "pending" | "cut" | "processed";
}

interface WorkOrder {
  id: string;
  code: string;
  project: string;
  customer: string;
  assignedTo: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "cutting" | "assembly" | "finishing" | "done";
  dueDate: string;
  notes: string;
  pieces: CutPiece[];
}

interface DB {
  orders: WorkOrder[];
}

const INITIAL: DB = {
  orders: [
    {
      id: "wo-001",
      code: "WO-2024-001",
      project: "فيلا لافيش",
      customer: "أحمد الكندري",
      assignedTo: "محمد فهد",
      priority: "high",
      status: "cutting",
      dueDate: "2024-08-15",
      notes: "يراعى الدقة في القطع",
      pieces: [
        { id: "p1", profile: "60×40", length: 2400, qty: 8, color: "أبيض", projectCode: "WO-2024-001", status: "cut" },
        { id: "p2", profile: "60×40", length: 1200, qty: 8, color: "أبيض", projectCode: "WO-2024-001", status: "pending" },
        { id: "p3", profile: "35×25", length: 980, qty: 16, color: "أبيض", projectCode: "WO-2024-001", status: "pending" },
      ],
    },
    {
      id: "wo-002",
      code: "WO-2024-002",
      project: "برج الخليج",
      customer: "شركة الخليج للإنشاءات",
      assignedTo: "سعد المطيري",
      priority: "urgent",
      status: "assembly",
      dueDate: "2024-08-10",
      notes: "",
      pieces: [
        { id: "p4", profile: "80×50", length: 3000, qty: 20, color: "رمادي", projectCode: "WO-2024-002", status: "cut" },
        { id: "p5", profile: "80×50", length: 1500, qty: 20, color: "رمادي", projectCode: "WO-2024-002", status: "cut" },
      ],
    },
    {
      id: "wo-003",
      code: "WO-2024-003",
      project: "مكتب الأمل",
      customer: "مؤسسة الأمل",
      assignedTo: "خالد الرشيدي",
      priority: "normal",
      status: "pending",
      dueDate: "2024-08-25",
      notes: "ألوان مزدوجة",
      pieces: [
        { id: "p6", profile: "60×40", length: 2000, qty: 6, color: "بني", projectCode: "WO-2024-003", status: "pending" },
      ],
    },
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

const STATUS_CFG: Record<WorkOrder["status"], { label: string; color: string; bg: string }> = {
  pending:   { label: "معلق",         color: "#6b7280", bg: "#f3f4f6" },
  cutting:   { label: "قطع",          color: "#2563eb", bg: "#dbeafe" },
  assembly:  { label: "تجميع",        color: "#d97706", bg: "#fef3c7" },
  finishing: { label: "تشطيب",        color: "#7c3aed", bg: "#ede9fe" },
  done:      { label: "مكتمل",        color: "#059669", bg: "#d1fae5" },
};

const PRIORITY_CFG: Record<WorkOrder["priority"], { label: string; color: string }> = {
  low:    { label: "منخفض", color: "#6b7280" },
  normal: { label: "عادي",  color: "#2563eb" },
  high:   { label: "عالي",  color: "#d97706" },
  urgent: { label: "عاجل",  color: "#dc2626" },
};

const PIECE_STATUS_CFG: Record<CutPiece["status"], { label: string; color: string }> = {
  pending:   { label: "انتظار", color: "#6b7280" },
  cut:       { label: "مقطوع",  color: "#2563eb" },
  processed: { label: "منتهي",  color: "#059669" },
};

const BAR_LENGTH = 6000; // standard bar length mm

function CuttingDiagram({ pieces }: { pieces: CutPiece[] }) {
  const grouped = pieces.reduce<Record<string, CutPiece[]>>((acc, p) => {
    (acc[p.profile] = acc[p.profile] || []).push(p);
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "monospace" }}>
      {Object.entries(grouped).map(([profile, pts]) => {
        const totalMm = pts.reduce((s, p) => s + p.length * p.qty, 0);
        const bars = Math.ceil(totalMm / BAR_LENGTH);
        return (
          <div key={profile} style={{ marginBottom: 16, background: "#f8fafc", borderRadius: 8, padding: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 8 }}>
              بروفايل {profile} — يحتاج {bars} بار
            </div>
            {Array.from({ length: bars }, (_, bi) => {
              let remaining = BAR_LENGTH;
              const segments: { length: number; profile: string; color: string }[] = [];
              for (const p of pts) {
                for (let q = 0; q < p.qty && remaining >= p.length; q++) {
                  segments.push({ length: p.length, profile: p.profile, color: p.status === "cut" ? "#3b82f6" : "#94a3b8" });
                  remaining -= p.length;
                }
              }
              if (remaining > 0) segments.push({ length: remaining, profile: "هدر", color: "#fca5a5" });
              return (
                <div key={bi} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>بار {bi + 1}</div>
                  <div style={{ display: "flex", height: 28, borderRadius: 4, overflow: "hidden", border: "1px solid #cbd5e1" }}>
                    {segments.map((s, si) => (
                      <div
                        key={si}
                        style={{
                          width: `${(s.length / BAR_LENGTH) * 100}%`,
                          background: s.color,
                          borderLeft: si > 0 ? "1px solid rgba(255,255,255,0.4)" : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          color: "#fff",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                        title={`${s.length}mm`}
                      >
                        {s.length > 400 ? `${s.length}` : ""}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function ShopFloor() {
  const navigate = useNavigate();
  const [db, setDb] = useDB();
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"pieces" | "cutting" | "notes">("pieces");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = localStorage.getItem("wincraft_intent");
    if (!raw) return;
    try {
      const intent = JSON.parse(raw);
      if (intent.type === "new_work_order" && intent.project) {
        const p = intent.project;
        const newOrder: WorkOrder = {
          id: `wo-${Date.now()}`,
          code: `WO-${new Date().getFullYear()}-${String(db.orders.length + 1).padStart(3, "0")}`,
          project: p.name, customer: p.customer,
          assignedTo: "", priority: "normal", status: "pending",
          dueDate: "", notes: `من المشروع ${p.id}`,
          pieces: (p.items || []).map((item: { code: string; description: string; width: number; height: number; qty: number }, idx: number) => ({
            id: `p-${Date.now()}-${idx}`,
            profile: "60×40",
            length: item.width || item.height || 1200,
            qty: item.qty || 1,
            color: "أبيض",
            projectCode: p.id,
            status: "pending" as const,
          })),
        };
        setDb({ ...db, orders: [...db.orders, newOrder] });
        setSelected(newOrder.id);
        localStorage.removeItem("wincraft_intent");
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);;

  const orders = db.orders.filter(o => !filterStatus || o.status === filterStatus);
  const activeOrder = db.orders.find(o => o.id === selected) ?? null;

  const setOrderStatus = (id: string, status: WorkOrder["status"]) => {
    setDb({ ...db, orders: db.orders.map(o => o.id === id ? { ...o, status } : o) });
  };

  const setPieceStatus = (orderId: string, pieceId: string, status: CutPiece["status"]) => {
    setDb({
      ...db,
      orders: db.orders.map(o =>
        o.id === orderId
          ? { ...o, pieces: o.pieces.map(p => p.id === pieceId ? { ...p, status } : p) }
          : o,
      ),
    });
  };

  const saveOrder = () => {
    const newOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      code: form.code || `WO-${Date.now()}`,
      project: form.project || "",
      customer: form.customer || "",
      assignedTo: form.assignedTo || "",
      priority: (form.priority as WorkOrder["priority"]) || "normal",
      status: "pending",
      dueDate: form.dueDate || "",
      notes: form.notes || "",
      pieces: [],
    };
    setDb({ ...db, orders: [newOrder, ...db.orders] });
    setShowForm(false);
    setForm({});
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6,
    fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" as const,
  };
  const lbl: React.CSSProperties = { fontSize: 12, color: "#64748b", marginBottom: 4, display: "block" };

  const pending = db.orders.filter(o => o.status === "pending").length;
  const cutting = db.orders.filter(o => o.status === "cutting").length;
  const assembly = db.orders.filter(o => o.status === "assembly").length;
  const done = db.orders.filter(o => o.status === "done").length;

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", direction: "rtl", background: "#f1f5f9", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e293b" }}>أوامر التصنيع</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>إدارة عمليات القطع والتجميع والتشطيب</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: "#1e4db7", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          + أمر جديد
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "معلق", value: pending, color: "#6b7280", bg: "#f9fafb" },
          { label: "قطع", value: cutting, color: "#2563eb", bg: "#eff6ff" },
          { label: "تجميع", value: assembly, color: "#d97706", bg: "#fffbeb" },
          { label: "مكتمل", value: done, color: "#059669", bg: "#f0fdf4" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: "14px 18px", border: `1px solid ${c.color}22` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: activeOrder ? "1fr 1fr" : "1fr", gap: 16 }}>
        {/* Orders List */}
        <div>
          {/* Filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {["", "pending", "cutting", "assembly", "finishing", "done"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: filterStatus === s ? "none" : "1px solid #cbd5e1",
                  background: filterStatus === s ? "#1e4db7" : "#fff",
                  color: filterStatus === s ? "#fff" : "#475569",
                }}
              >
                {s === "" ? "الكل" : STATUS_CFG[s as WorkOrder["status"]].label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.map(o => {
              const sc = STATUS_CFG[o.status];
              const pc = PRIORITY_CFG[o.priority];
              const pctDone = o.pieces.length > 0
                ? Math.round(o.pieces.filter(p => p.status !== "pending").reduce((s, p) => s + p.qty, 0) / o.pieces.reduce((s, p) => s + p.qty, 0) * 100)
                : 0;
              return (
                <div
                  key={o.id}
                  onClick={() => { setSelected(o.id); setTab("pieces"); }}
                  style={{
                    background: "#fff", borderRadius: 10, padding: 14, cursor: "pointer",
                    border: selected === o.id ? "2px solid #1e4db7" : "1px solid #e2e8f0",
                    boxShadow: selected === o.id ? "0 0 0 3px #1e4db722" : "0 1px 3px #0001",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>{o.code}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{o.project} — {o.customer}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: pc.color }}>{pc.label}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                    <span>مسؤول: {o.assignedTo}</span>
                    <span>تسليم: {o.dueDate}</span>
                  </div>
                  <div style={{ background: "#f1f5f9", borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${pctDone}%`, height: "100%", borderRadius: 4, background: "#1e4db7", transition: "width .3s" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>تقدم القطع: {pctDone}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Detail */}
        {activeOrder && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>{activeOrder.code}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{activeOrder.project}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>✕</button>
              </div>
              {/* Status stepper */}
              <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
                {(["pending", "cutting", "assembly", "finishing", "done"] as WorkOrder["status"][]).map(s => {
                  const sc = STATUS_CFG[s];
                  const isActive = activeOrder.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setOrderStatus(activeOrder.id, s)}
                      style={{
                        flex: 1, padding: "5px 4px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        cursor: "pointer",
                        background: isActive ? sc.bg : "#f1f5f9",
                        color: isActive ? sc.color : "#94a3b8",
                        outline: isActive ? `2px solid ${sc.color}` : "none",
                      }}
                    >
                      {sc.label}
                    </button>
                  );
                })}
              </div>
              {/* Integration: done → dispatch */}
              {activeOrder.status === "done" && (
                <button
                  onClick={() => {
                    localStorage.setItem("wincraft_intent", JSON.stringify({
                      type: "new_dispatch",
                      project: { id: activeOrder.code, name: activeOrder.project, customer: activeOrder.customer, phone: "", city: "" },
                    }));
                    navigate("/dispatch");
                  }}
                  style={{ marginTop: 10, width: "100%", padding: "8px", borderRadius: 7, border: "none", background: "#0891b2", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  🚚 إنشاء أمر تسليم
                </button>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
              {([["pieces", "القطع"], ["cutting", "مخطط القطع"], ["notes", "ملاحظات"]] as [typeof tab, string][]).map(([t, l]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1, padding: "10px", border: "none", background: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                    color: tab === t ? "#1e4db7" : "#64748b",
                    borderBottom: tab === t ? "2px solid #1e4db7" : "2px solid transparent",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            <div style={{ padding: 16 }}>
              {tab === "pieces" && (
                <div>
                  {activeOrder.pieces.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>لا توجد قطع</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {["البروفايل", "الطول(mm)", "الكمية", "اللون", "الحالة"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeOrder.pieces.map(p => {
                          const ps = PIECE_STATUS_CFG[p.status];
                          return (
                            <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 10px" }}>{p.profile}</td>
                              <td style={{ padding: "8px 10px", fontFamily: "monospace" }}>{p.length}</td>
                              <td style={{ padding: "8px 10px" }}>{p.qty}</td>
                              <td style={{ padding: "8px 10px" }}>{p.color}</td>
                              <td style={{ padding: "8px 10px" }}>
                                <select
                                  value={p.status}
                                  onChange={e => setPieceStatus(activeOrder.id, p.id, e.target.value as CutPiece["status"])}
                                  style={{ fontSize: 11, padding: "2px 6px", borderRadius: 6, border: "1px solid #e2e8f0", color: ps.color, background: "#f8fafc" }}
                                >
                                  <option value="pending">انتظار</option>
                                  <option value="cut">مقطوع</option>
                                  <option value="processed">منتهي</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              {tab === "cutting" && <CuttingDiagram pieces={activeOrder.pieces} />}
              {tab === "notes" && (
                <textarea
                  value={activeOrder.notes}
                  onChange={e => {
                    setDb({ ...db, orders: db.orders.map(o => o.id === activeOrder.id ? { ...o, notes: e.target.value } : o) });
                  }}
                  style={{ ...inp, height: 160, resize: "vertical" }}
                  placeholder="ملاحظات أمر التصنيع..."
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 480, maxWidth: "95vw", boxShadow: "0 20px 60px #0003" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>أمر تصنيع جديد</h2>
              <button onClick={() => setShowForm(false)} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { key: "code", label: "كود الأمر" },
                { key: "project", label: "المشروع" },
                { key: "customer", label: "العميل" },
                { key: "assignedTo", label: "المسؤول" },
                { key: "dueDate", label: "تاريخ التسليم", type: "date" },
              ].map(f => (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input type={f.type || "text"} value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inp} />
                </div>
              ))}
              <div>
                <label style={lbl}>الأولوية</label>
                <select value={form.priority || "normal"} onChange={e => setForm({ ...form, priority: e.target.value })} style={inp}>
                  <option value="low">منخفض</option>
                  <option value="normal">عادي</option>
                  <option value="high">عالي</option>
                  <option value="urgent">عاجل</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={lbl}>ملاحظات</label>
              <textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inp, height: 80, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 14 }}>إلغاء</button>
              <button onClick={saveOrder} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "#1e4db7", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
