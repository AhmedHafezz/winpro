import { useState, useRef } from "react";

const DB_KEY = "eva_quotation_hub";

interface LineItem {
  id: string;
  description: string;
  location: string;
  width: number;
  height: number;
  qty: number;
  unitPrice: number;
  series: string;
  glassType: string;
}

interface Quotation {
  id: string;
  code: string;
  customer: string;
  phone: string;
  email: string;
  address: string;
  date: string;
  validUntil: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  discount: number;
  notes: string;
  terms: string;
  items: LineItem[];
}

interface DB {
  quotations: Quotation[];
}

const INITIAL: DB = {
  quotations: [
    {
      id: "q-001",
      code: "QT-2024-001",
      customer: "أحمد الكندري",
      phone: "9900-1234",
      email: "ahmed@example.com",
      address: "الكويت — مبارك الكبير",
      date: "2024-07-01",
      validUntil: "2024-08-01",
      status: "sent",
      discount: 5,
      notes: "يشمل التركيب",
      terms: "الدفع 50% مقدم والباقي عند التسليم",
      items: [
        { id: "i1", description: "نافذة شبابيك منزلقة", location: "غرفة الجلوس", width: 2400, height: 1200, qty: 3, unitPrice: 120.000, series: "Series 60", glassType: "مزدوج 6+6" },
        { id: "i2", description: "باب رئيسي انزلاقي", location: "المدخل", width: 2000, height: 2400, qty: 1, unitPrice: 250.000, series: "Series 80", glassType: "مزدوج 8+8" },
      ],
    },
    {
      id: "q-002",
      code: "QT-2024-002",
      customer: "شركة الخليج للإنشاءات",
      phone: "9900-5678",
      email: "gulf@example.com",
      address: "الكويت — الشويخ الصناعية",
      date: "2024-07-10",
      validUntil: "2024-08-10",
      status: "draft",
      discount: 10,
      notes: "",
      terms: "الدفع كامل مقدم",
      items: [
        { id: "i3", description: "واجهة زجاجية", location: "الطابق الأرضي", width: 5000, height: 3000, qty: 2, unitPrice: 890.000, series: "System 85", glassType: "ثلاثي 10+10+10" },
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

const STATUS_CFG: Record<Quotation["status"], { label: string; color: string; bg: string }> = {
  draft:    { label: "مسودة",  color: "#6b7280", bg: "#f3f4f6" },
  sent:     { label: "مرسل",   color: "#2563eb", bg: "#dbeafe" },
  accepted: { label: "مقبول",  color: "#059669", bg: "#d1fae5" },
  rejected: { label: "مرفوض", color: "#dc2626", bg: "#fee2e2" },
  expired:  { label: "منتهي", color: "#d97706", bg: "#fef3c7" },
};

function calcTotal(q: Quotation) {
  const subtotal = q.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const disc = subtotal * (q.discount / 100);
  const total = subtotal - disc;
  return { subtotal, disc, total };
}

interface QuotationPreviewProps {
  q: Quotation;
  onClose: () => void;
}

function QuotationPreview({ q, onClose }: QuotationPreviewProps) {
  const { subtotal, disc, total } = calcTotal(q);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html dir="rtl"><head><title>${q.code}</title><style>
      body { font-family: system-ui; padding: 40px; color: #1e293b; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: right; }
      th { background: #f8fafc; font-weight: 700; }
      .total { text-align: left; margin-top: 16px; }
    </style></head><body>${printRef.current.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0008", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 32, width: 760, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px #0003" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>معاينة عرض السعر</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handlePrint} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#1e4db7", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>🖨️ طباعة</button>
            <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13 }}>إغلاق</button>
          </div>
        </div>

        <div ref={printRef}>
          <div style={{ textAlign: "center", marginBottom: 24, borderBottom: "2px solid #1e4db7", paddingBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1e4db7" }}>WinCraft ERP</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b" }}>عرض أسعار — {q.code}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 13, color: "#64748b" }}>بيانات العميل</h3>
              <p style={{ margin: "2px 0", fontWeight: 700, fontSize: 15 }}>{q.customer}</p>
              <p style={{ margin: "2px 0", fontSize: 13, color: "#475569" }}>{q.phone}</p>
              <p style={{ margin: "2px 0", fontSize: 13, color: "#475569" }}>{q.email}</p>
              <p style={{ margin: "2px 0", fontSize: 13, color: "#475569" }}>{q.address}</p>
            </div>
            <div style={{ textAlign: "left" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 13, color: "#64748b" }}>تفاصيل العرض</h3>
              <p style={{ margin: "2px 0", fontSize: 13 }}>تاريخ العرض: <b>{q.date}</b></p>
              <p style={{ margin: "2px 0", fontSize: 13 }}>صلاحية: <b>{q.validUntil}</b></p>
              <p style={{ margin: "2px 0", fontSize: 13 }}>الحالة: <b>{STATUS_CFG[q.status].label}</b></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                {["#", "الوصف", "الموقع", "الأبعاد(cm)", "السلسلة", "الزجاج", "الكمية", "سعر الوحدة", "الإجمالي"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.items.map((item, idx) => {
                const lineTotal = item.qty * item.unitPrice;
                return (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>{item.description}</td>
                    <td>{item.location}</td>
                    <td style={{ fontFamily: "monospace" }}>{item.width}×{item.height}</td>
                    <td>{item.series}</td>
                    <td>{item.glassType}</td>
                    <td>{item.qty}</td>
                    <td style={{ fontFamily: "monospace" }}>{item.unitPrice.toFixed(3)} د.ك</td>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{lineTotal.toFixed(3)} د.ك</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ textAlign: "left", marginTop: 16 }}>
            <p>الإجمالي قبل الخصم: <b style={{ fontFamily: "monospace" }}>{subtotal.toFixed(3)} د.ك</b></p>
            {q.discount > 0 && <p>خصم {q.discount}%: <b style={{ fontFamily: "monospace" }}>- {disc.toFixed(3)} د.ك</b></p>}
            <p style={{ fontSize: 18, fontWeight: 800, color: "#1e4db7" }}>الإجمالي: {total.toFixed(3)} د.ك</p>
          </div>

          {q.notes && <p style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 13 }}>ملاحظات: {q.notes}</p>}
          {q.terms && <p style={{ marginTop: 8, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 13 }}>الشروط: {q.terms}</p>}
        </div>
      </div>
    </div>
  );
}

export default function QuotationHub() {
  const [db, setDb] = useDB();
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "items" | "summary">("info");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [itemForm, setItemForm] = useState<Record<string, string>>({});

  const quotations = db.quotations.filter(q => !filterStatus || q.status === filterStatus);
  const activeQ = db.quotations.find(q => q.id === selected) ?? null;
  const previewQ = db.quotations.find(q => q.id === previewId) ?? null;

  const saveQuotation = () => {
    const nq: Quotation = {
      id: `q-${Date.now()}`,
      code: form.code || `QT-${Date.now()}`,
      customer: form.customer || "",
      phone: form.phone || "",
      email: form.email || "",
      address: form.address || "",
      date: form.date || new Date().toISOString().split("T")[0],
      validUntil: form.validUntil || "",
      status: "draft",
      discount: parseFloat(form.discount || "0"),
      notes: form.notes || "",
      terms: form.terms || "",
      items: [],
    };
    setDb({ ...db, quotations: [nq, ...db.quotations] });
    setShowForm(false);
    setForm({});
    setSelected(nq.id);
  };

  const addItem = () => {
    if (!activeQ) return;
    const ni: LineItem = {
      id: `i-${Date.now()}`,
      description: itemForm.description || "",
      location: itemForm.location || "",
      width: parseFloat(itemForm.width || "0"),
      height: parseFloat(itemForm.height || "0"),
      qty: parseInt(itemForm.qty || "1", 10),
      unitPrice: parseFloat(itemForm.unitPrice || "0"),
      series: itemForm.series || "",
      glassType: itemForm.glassType || "",
    };
    setDb({ ...db, quotations: db.quotations.map(q => q.id === activeQ.id ? { ...q, items: [...q.items, ni] } : q) });
    setItemForm({});
  };

  const removeItem = (qId: string, iId: string) => {
    setDb({ ...db, quotations: db.quotations.map(q => q.id === qId ? { ...q, items: q.items.filter(i => i.id !== iId) } : q) });
  };

  const setStatus = (id: string, status: Quotation["status"]) => {
    setDb({ ...db, quotations: db.quotations.map(q => q.id === id ? { ...q, status } : q) });
  };

  const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" as const };
  const lbl: React.CSSProperties = { fontSize: 12, color: "#64748b", marginBottom: 4, display: "block" };

  const totalValue = db.quotations.reduce((s, q) => s + calcTotal(q).total, 0);
  const accepted = db.quotations.filter(q => q.status === "accepted").length;
  const sent = db.quotations.filter(q => q.status === "sent").length;

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", direction: "rtl", background: "#f1f5f9", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e293b" }}>عروض الأسعار</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>إنشاء وإدارة عروض أسعار الألومنيوم</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background: "#1e4db7", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          + عرض جديد
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "إجمالي القيمة", value: `${totalValue.toFixed(3)} د.ك`, color: "#1e4db7" },
          { label: "مقبولة", value: accepted, color: "#059669" },
          { label: "مرسلة", value: sent, color: "#d97706" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: activeQ ? "1fr 1fr" : "1fr", gap: 16 }}>
        {/* List */}
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {["", "draft", "sent", "accepted", "rejected", "expired"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: filterStatus === s ? "none" : "1px solid #cbd5e1", background: filterStatus === s ? "#1e4db7" : "#fff", color: filterStatus === s ? "#fff" : "#475569" }}>
                {s === "" ? "الكل" : STATUS_CFG[s as Quotation["status"]].label}
              </button>
            ))}
          </div>

          {quotations.map(q => {
            const sc = STATUS_CFG[q.status];
            const { total } = calcTotal(q);
            return (
              <div key={q.id} onClick={() => { setSelected(q.id); setTab("info"); }} style={{ background: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, cursor: "pointer", border: selected === q.id ? "2px solid #1e4db7" : "1px solid #e2e8f0", boxShadow: selected === q.id ? "0 0 0 3px #1e4db722" : "0 1px 3px #0001" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>{q.code}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{q.customer}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 12, background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>{q.date}</span>
                  <span style={{ fontWeight: 700, color: "#1e4db7", fontFamily: "monospace" }}>{total.toFixed(3)} د.ك</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        {activeQ && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>{activeQ.code}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{activeQ.customer}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPreviewId(activeQ.id)} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #1e4db7", background: "#fff", color: "#1e4db7", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>معاينة</button>
                  <button onClick={() => setSelected(null)} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>✕</button>
                </div>
              </div>
              {/* Status */}
              <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                {(["draft", "sent", "accepted", "rejected", "expired"] as Quotation["status"][]).map(s => {
                  const sc = STATUS_CFG[s];
                  return (
                    <button key={s} onClick={() => setStatus(activeQ.id, s)} style={{ flex: 1, padding: "4px 2px", border: "none", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer", background: activeQ.status === s ? sc.bg : "#f1f5f9", color: activeQ.status === s ? sc.color : "#94a3b8", outline: activeQ.status === s ? `2px solid ${sc.color}` : "none" }}>
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
              {([["info", "البيانات"], ["items", "البنود"], ["summary", "الملخص"]] as [typeof tab, string][]).map(([t, l]) => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: 10, border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: tab === t ? "#1e4db7" : "#64748b", borderBottom: tab === t ? "2px solid #1e4db7" : "2px solid transparent" }}>{l}</button>
              ))}
            </div>

            <div style={{ padding: 16 }}>
              {tab === "info" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[["customer", "العميل"], ["phone", "الهاتف"], ["email", "البريد"], ["address", "العنوان"], ["date", "التاريخ"], ["validUntil", "صلاحية"]].map(([k, l]) => (
                    <div key={k}>
                      <label style={lbl}>{l}</label>
                      <input value={(activeQ as unknown as Record<string, string>)[k] || ""} onChange={e => setDb({ ...db, quotations: db.quotations.map(q => q.id === activeQ.id ? { ...q, [k]: e.target.value } : q) })} style={inp} />
                    </div>
                  ))}
                  <div>
                    <label style={lbl}>خصم %</label>
                    <input type="number" value={activeQ.discount} onChange={e => setDb({ ...db, quotations: db.quotations.map(q => q.id === activeQ.id ? { ...q, discount: parseFloat(e.target.value) || 0 } : q) })} style={inp} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={lbl}>ملاحظات</label>
                    <textarea value={activeQ.notes} onChange={e => setDb({ ...db, quotations: db.quotations.map(q => q.id === activeQ.id ? { ...q, notes: e.target.value } : q) })} style={{ ...inp, height: 60, resize: "vertical" }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={lbl}>الشروط والأحكام</label>
                    <textarea value={activeQ.terms} onChange={e => setDb({ ...db, quotations: db.quotations.map(q => q.id === activeQ.id ? { ...q, terms: e.target.value } : q) })} style={{ ...inp, height: 60, resize: "vertical" }} />
                  </div>
                </div>
              )}

              {tab === "items" && (
                <div>
                  {/* Add item form */}
                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 14, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10 }}>إضافة بند</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[["description", "الوصف"], ["location", "الموقع"], ["series", "السلسلة"], ["glassType", "نوع الزجاج"]].map(([k, l]) => (
                        <div key={k}>
                          <label style={lbl}>{l}</label>
                          <input value={itemForm[k] || ""} onChange={e => setItemForm({ ...itemForm, [k]: e.target.value })} style={{ ...inp, fontSize: 12 }} />
                        </div>
                      ))}
                      {[["width", "العرض(mm)"], ["height", "الارتفاع(mm)"], ["qty", "الكمية"], ["unitPrice", "سعر الوحدة (د.ك)"]].map(([k, l]) => (
                        <div key={k}>
                          <label style={lbl}>{l}</label>
                          <input type="number" value={itemForm[k] || ""} onChange={e => setItemForm({ ...itemForm, [k]: e.target.value })} style={{ ...inp, fontSize: 12 }} />
                        </div>
                      ))}
                    </div>
                    <button onClick={addItem} style={{ marginTop: 10, padding: "7px 16px", borderRadius: 6, border: "none", background: "#1e4db7", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ إضافة</button>
                  </div>

                  {/* Items table */}
                  {activeQ.items.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>لا توجد بنود</div>
                  ) : (
                    activeQ.items.map((item, idx) => (
                      <div key={item.id} style={{ background: "#f8fafc", borderRadius: 8, padding: 10, marginBottom: 8, border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{idx + 1}. {item.description}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{item.location} — {item.series} — {item.glassType}</div>
                            <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{item.width}×{item.height}mm × {item.qty} قطعة</div>
                          </div>
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontWeight: 700, color: "#1e4db7", fontFamily: "monospace" }}>{(item.qty * item.unitPrice).toFixed(3)} د.ك</div>
                            <button onClick={() => removeItem(activeQ.id, item.id)} style={{ fontSize: 11, color: "#dc2626", border: "none", background: "none", cursor: "pointer", marginTop: 4 }}>حذف</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "summary" && (() => {
                const { subtotal, disc, total } = calcTotal(activeQ);
                return (
                  <div>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                        <span>المجموع الفرعي</span>
                        <span style={{ fontFamily: "monospace" }}>{subtotal.toFixed(3)} د.ك</span>
                      </div>
                      {activeQ.discount > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#dc2626" }}>
                          <span>خصم {activeQ.discount}%</span>
                          <span style={{ fontFamily: "monospace" }}>- {disc.toFixed(3)} د.ك</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "2px solid #e2e8f0", fontSize: 18, fontWeight: 800, color: "#1e4db7" }}>
                        <span>الإجمالي</span>
                        <span style={{ fontFamily: "monospace" }}>{total.toFixed(3)} د.ك</span>
                      </div>
                    </div>
                    <button onClick={() => setPreviewId(activeQ.id)} style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#1e4db7", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                      🖨️ معاينة وطباعة
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* New Quotation Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 500, maxWidth: "95vw", boxShadow: "0 20px 60px #0003" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>عرض سعر جديد</h2>
              <button onClick={() => setShowForm(false)} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["code", "رقم العرض"], ["customer", "العميل"], ["phone", "الهاتف"], ["email", "البريد"], ["address", "العنوان"], ["date", "التاريخ", "date"], ["validUntil", "صلاحية", "date"], ["discount", "خصم %", "number"]].map(([k, l, t]) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <input type={t || "text"} value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} style={inp} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={lbl}>ملاحظات</label>
              <textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inp, height: 60, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 14 }}>إلغاء</button>
              <button onClick={saveQuotation} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "#1e4db7", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewQ && <QuotationPreview q={previewQ} onClose={() => setPreviewId(null)} />}
    </div>
  );
}
