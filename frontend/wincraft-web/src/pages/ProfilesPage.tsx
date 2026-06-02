import { useState, useMemo } from "react";

const DB_KEY = "eva_aluminum_db";

interface SeriesDef {
  id: string; name: string; code: string; thickness: number;
  barLength: number; color: string; desc: string;
}
interface ProfileDef {
  id: number; seriesId: string; code: string; name: string; arabicName: string;
  weight: number; alloy: string; finish: string; stock: number; minStock: number;
  unitPrice: number; image: string;
}
interface FinishDef {
  id: string; name: string; arabicName: string; color: string; premium: number;
}
interface CutItem {
  profileId: number; profileName: string; seriesId: string;
  cuts: number[]; barLength: number;
}
interface CutJob {
  id: string; projectRef: string; projectName: string;
  date: string; status: string; items: CutItem[];
}
interface PurchaseOrder {
  id: string; supplier: string; series: string; profiles: number;
  qty: number; total: number; status: string; orderDate: string; deliveryDate: string;
}
interface DB { cutJobs: CutJob[]; orders: PurchaseOrder[] }

const SERIES: SeriesDef[] = [
  { id: "S60", name: "Series 60",    code: "NCL-VEKA-60", thickness: 1.5, barLength: 6000, color: "#94a3b8", desc: "نافذة شبابيك ألمنيوم سيريز 60" },
  { id: "S45", name: "Series 45",    code: "NCL-VEKA-45", thickness: 1.2, barLength: 6000, color: "#64748b", desc: "نافذة شبابيك ألمنيوم سيريز 45" },
  { id: "CW",  name: "Curtain Wall", code: "NCL-CW-70",   thickness: 2.0, barLength: 6000, color: "#475569", desc: "كيرتن وول واجهات" },
  { id: "DR",  name: "Door Series",  code: "NCL-DR-80",   thickness: 1.8, barLength: 6000, color: "#334155", desc: "أبواب ألمنيوم" },
];

const PROFILES_DATA: ProfileDef[] = [
  { id: 1,  seriesId: "S60", code: "S60-FR-001", name: "Frame Profile - Top/Bottom", arabicName: "بروفايل إطار أعلى/أسفل",  weight: 1.82, alloy: "6063-T5", finish: "Mill",     stock: 85,  minStock: 40,  unitPrice: 18.500, image: "frame_tb" },
  { id: 2,  seriesId: "S60", code: "S60-FR-002", name: "Frame Profile - Sides",      arabicName: "بروفايل إطار جانبي",       weight: 1.95, alloy: "6063-T5", finish: "Mill",     stock: 72,  minStock: 40,  unitPrice: 19.250, image: "frame_s"  },
  { id: 3,  seriesId: "S60", code: "S60-SA-001", name: "Sash Profile - Sliding",     arabicName: "بروفايل سلاش منزلق",       weight: 1.42, alloy: "6063-T5", finish: "Mill",     stock: 120, minStock: 60,  unitPrice: 14.750, image: "sash_sl"  },
  { id: 4,  seriesId: "S60", code: "S60-SA-002", name: "Sash Profile - Casement",    arabicName: "بروفايل سلاش قلاّب",       weight: 1.38, alloy: "6063-T5", finish: "Mill",     stock: 95,  minStock: 50,  unitPrice: 14.200, image: "sash_ca"  },
  { id: 5,  seriesId: "S60", code: "S60-MU-001", name: "Mullion/Transom",            arabicName: "مليون / ترانسوم",           weight: 2.10, alloy: "6063-T5", finish: "Mill",     stock: 48,  minStock: 30,  unitPrice: 21.500, image: "mullion"  },
  { id: 6,  seriesId: "S60", code: "S60-GB-001", name: "Glazing Bead",               arabicName: "ريشة تثبيت زجاج",          weight: 0.62, alloy: "6063-T5", finish: "Mill",     stock: 200, minStock: 100, unitPrice: 6.400,  image: "bead"     },
  { id: 7,  seriesId: "S45", code: "S45-FR-001", name: "Frame Profile - Top/Bottom", arabicName: "بروفايل إطار سيريز 45",    weight: 1.45, alloy: "6063-T5", finish: "Mill",     stock: 32,  minStock: 40,  unitPrice: 14.750, image: "frame_tb" },
  { id: 8,  seriesId: "S45", code: "S45-SA-001", name: "Sash Profile - Sliding",     arabicName: "بروفايل سلاش سيريز 45",    weight: 1.12, alloy: "6063-T5", finish: "Mill",     stock: 55,  minStock: 30,  unitPrice: 11.500, image: "sash_sl"  },
  { id: 9,  seriesId: "S45", code: "S45-GB-001", name: "Glazing Bead",               arabicName: "ريشة زجاج سيريز 45",       weight: 0.48, alloy: "6063-T5", finish: "Mill",     stock: 180, minStock: 80,  unitPrice: 4.900,  image: "bead"     },
  { id: 10, seriesId: "CW",  code: "CW-MU-001",  name: "CW Mullion",                 arabicName: "مليون كيرتن وول",           weight: 3.20, alloy: "6061-T6", finish: "Anodized", stock: 28,  minStock: 20,  unitPrice: 32.000, image: "cw_mul"  },
  { id: 11, seriesId: "CW",  code: "CW-TR-001",  name: "CW Transom",                 arabicName: "ترانسوم كيرتن وول",         weight: 2.85, alloy: "6061-T6", finish: "Anodized", stock: 22,  minStock: 20,  unitPrice: 28.500, image: "cw_tr"   },
  { id: 12, seriesId: "CW",  code: "CW-PR-001",  name: "CW Pressure Plate",          arabicName: "لوح ضغط",                   weight: 1.40, alloy: "6061-T6", finish: "Anodized", stock: 44,  minStock: 30,  unitPrice: 14.000, image: "cw_pp"   },
  { id: 13, seriesId: "DR",  code: "DR-FR-001",  name: "Door Frame - Jamb",          arabicName: "جامب باب ألمنيوم",          weight: 2.40, alloy: "6063-T5", finish: "Mill",     stock: 36,  minStock: 20,  unitPrice: 24.000, image: "dr_fr"   },
  { id: 14, seriesId: "DR",  code: "DR-SA-001",  name: "Door Sash - Stile",          arabicName: "ستايل باب",                 weight: 2.20, alloy: "6063-T5", finish: "Mill",     stock: 30,  minStock: 20,  unitPrice: 22.000, image: "dr_sa"   },
  { id: 15, seriesId: "DR",  code: "DR-TH-001",  name: "Door Threshold",             arabicName: "عتبة الباب",                weight: 3.10, alloy: "6063-T5", finish: "Mill",     stock: 18,  minStock: 15,  unitPrice: 31.000, image: "dr_th"   },
];

const FINISHES: FinishDef[] = [
  { id: "mill",              name: "Mill Finish",        arabicName: "نيئ طبيعي",       color: "#d4d4d4", premium: 0  },
  { id: "anodized",          name: "Anodized Silver",    arabicName: "أنودايزد فضي",    color: "#9ca3af", premium: 8  },
  { id: "anodized_bronze",   name: "Anodized Bronze",    arabicName: "أنودايزد برونزي", color: "#92400e", premium: 12 },
  { id: "powder_white",      name: "Powder White",       arabicName: "باودر أبيض",      color: "#f9fafb", premium: 15 },
  { id: "powder_black",      name: "Powder Black",       arabicName: "باودر أسود",      color: "#1f2937", premium: 15 },
  { id: "powder_champagne",  name: "Powder Champagne",   arabicName: "باودر شامبانيا",  color: "#d97706", premium: 18 },
  { id: "wood_grain",        name: "Wood Grain",         arabicName: "خشبي",             color: "#78350f", premium: 25 },
];

const INITIAL_DB: DB = {
  cutJobs: [
    {
      id: "CJ-001", projectRef: "QT-2024-001", projectName: "فيلا العنزي",
      date: "2024-03-25", status: "منفذ",
      items: [
        { profileId: 1, profileName: "Frame Profile - Top/Bottom", seriesId: "S60", cuts: [1400,1400,1600,1600,1200,1200], barLength: 6000 },
        { profileId: 3, profileName: "Sash Profile - Sliding",     seriesId: "S60", cuts: [690, 690, 790, 790, 590, 590],  barLength: 6000 },
      ],
    },
    {
      id: "CJ-002", projectRef: "QT-2024-002", projectName: "برج الخليج",
      date: "2024-04-01", status: "مجدول",
      items: [
        { profileId: 10, profileName: "CW Mullion", seriesId: "CW", cuts: [3180,3180,3180,3180,3180,3180,3180,3180], barLength: 6000 },
        { profileId: 11, profileName: "CW Transom",  seriesId: "CW", cuts: [1450,1450,1450,1450,1450,1450,780,780],  barLength: 6000 },
      ],
    },
  ],
  orders: [
    { id: "PO-001", supplier: "Gulf Aluminum Extrusions", series: "S60", profiles: 5, qty: 200, total: 3850.000, status: "مستلم", orderDate: "2024-03-01", deliveryDate: "2024-03-10" },
    { id: "PO-002", supplier: "Kuwait Metal Co.",          series: "CW",  profiles: 3, qty: 80,  total: 5960.000, status: "مجدول",  orderDate: "2024-03-20", deliveryDate: "2024-04-05" },
  ],
};

// ── Cutting Optimizer (FFD bin packing) ─────────────────────────────────────

interface Bar { id: number; cuts: number[]; remaining: number; total: number }

function optimizeCuts(cuts: number[], barLength = 6000, kerf = 3): Bar[] {
  const sorted = [...cuts].sort((a, b) => b - a);
  const bars: Bar[] = [];
  sorted.forEach(cut => {
    let placed = false;
    for (const bar of bars) {
      if (bar.remaining >= cut + kerf) {
        bar.cuts.push(cut);
        bar.remaining -= cut + kerf;
        placed = true;
        break;
      }
    }
    if (!placed) bars.push({ id: bars.length + 1, cuts: [cut], remaining: barLength - cut - kerf, total: barLength });
  });
  return bars;
}

interface WastageStats { bars: number; efficiency: number; waste: number }
function calcWastage(bars: Bar[]): WastageStats {
  const totalUsed = bars.reduce((s, b) => s + (b.total - b.remaining), 0);
  const totalBars = bars.reduce((s, b) => s + b.total, 0);
  return {
    bars: bars.length,
    efficiency: totalBars > 0 ? Math.round((totalUsed / totalBars) * 100) : 0,
    waste: bars.reduce((s, b) => s + b.remaining, 0),
  };
}

function useDB(): [DB, (d: DB) => void] {
  const [db, setDB] = useState<DB>(() => {
    try { const s = localStorage.getItem(DB_KEY); return s ? JSON.parse(s) : INITIAL_DB; }
    catch { return INITIAL_DB; }
  });
  const save = (d: DB) => { setDB(d); localStorage.setItem(DB_KEY, JSON.stringify(d)); };
  return [db, save];
}

const fmt3 = (n: number) => Number(n || 0).toLocaleString("en-KW", { minimumFractionDigits: 3 });

// ── SVG Profile Shapes ───────────────────────────────────────────────────────

const SHAPE_PATHS: Record<string, React.ReactNode> = {
  frame_tb:  <><rect x={4}  y={18} width={40} height={12} rx={2} fill="currentColor" /><rect x={8} y={22} width={32} height={4} rx={1} fill="white" fillOpacity="0.3" /></>,
  frame_s:   <><rect x={18} y={4}  width={12} height={40} rx={2} fill="currentColor" /><rect x={22} y={8} width={4} height={32} rx={1} fill="white" fillOpacity="0.3" /></>,
  sash_sl:   <><rect x={6}  y={14} width={36} height={20} rx={2} fill="currentColor" /><rect x={10} y={18} width={28} height={12} rx={1} fill="#bfdbfe" fillOpacity="0.5" /><line x1={24} y1={14} x2={24} y2={34} stroke="white" strokeWidth={1.5} /></>,
  sash_ca:   <><rect x={6}  y={10} width={28} height={28} rx={2} fill="currentColor" /><rect x={10} y={14} width={20} height={20} rx={1} fill="#bfdbfe" fillOpacity="0.5" /><line x1={34} y1={14} x2={26} y2={24} stroke="white" strokeWidth={1} strokeDasharray="2 2" /><line x1={34} y1={34} x2={26} y2={24} stroke="white" strokeWidth={1} strokeDasharray="2 2" /></>,
  mullion:   <><rect x={20} y={4}  width={8}  height={40} rx={2} fill="currentColor" /><rect x={4} y={20} width={40} height={8} rx={2} fill="currentColor" /></>,
  bead:      <><rect x={8}  y={20} width={32} height={8}  rx={3} fill="currentColor" /><rect x={8} y={20} width={8} height={8} rx={2} fill="currentColor" /></>,
  cw_mul:    <><rect x={18} y={4}  width={12} height={40} rx={2} fill="currentColor" /><rect x={12} y={14} width={24} height={4} rx={1} fill="currentColor" /><rect x={12} y={30} width={24} height={4} rx={1} fill="currentColor" /></>,
  cw_tr:     <><rect x={4}  y={18} width={40} height={12} rx={2} fill="currentColor" /><rect x={14} y={12} width={4} height={24} rx={1} fill="currentColor" /><rect x={30} y={12} width={4} height={24} rx={1} fill="currentColor" /></>,
  cw_pp:     <><rect x={4}  y={20} width={40} height={8}  rx={1} fill="currentColor" /></>,
  dr_fr:     <><rect x={14} y={4}  width={12} height={40} rx={2} fill="currentColor" /><rect x={8} y={16} width={14} height={4} rx={1} fill="currentColor" /><rect x={8} y={28} width={14} height={4} rx={1} fill="currentColor" /></>,
  dr_sa:     <><rect x={18} y={4}  width={12} height={40} rx={2} fill="currentColor" /><rect x={10} y={18} width={28} height={12} rx={1} fill="#bfdbfe" fillOpacity="0.4" /></>,
  dr_th:     <><rect x={4}  y={28} width={40} height={16} rx={2} fill="currentColor" /><rect x={4} y={24} width={40} height={6}  rx={1} fill="currentColor" fillOpacity="0.7" /></>,
};

function ProfileShape({ type, color = "#94a3b8", size = 48 }: { type: string; color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0", color, flexShrink: 0 }}>
      {SHAPE_PATHS[type] ?? <rect x={8} y={8} width={32} height={32} rx={4} fill="currentColor" />}
    </svg>
  );
}

// ── Cutting Bar Diagram ──────────────────────────────────────────────────────

const SEGMENT_COLORS = ["#1e4db7","#0891b2","#059669","#7c3aed","#d97706","#dc2626","#0f766e","#9333ea","#ca8a04","#0369a1"];

function CuttingBarDiagram({ bars, barLength }: { bars: Bar[]; barLength: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {bars.map((bar, bi) => {
        const usedPct = ((bar.total - bar.remaining) / bar.total) * 100;
        return (
          <div key={bi} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 12 }}>
              <span style={{ fontWeight: 700 }}>Bar #{bar.id} — {barLength / 1000}m</span>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b" }}>
                <span>مستخدم: <b style={{ color: "#1e4db7" }}>{((bar.total - bar.remaining) / 1000).toFixed(3)}m</b></span>
                <span>متبقي: <b style={{ color: bar.remaining > 200 ? "#10b981" : "#f59e0b" }}>{(bar.remaining / 1000).toFixed(3)}m</b></span>
                <span style={{ padding: "1px 7px", borderRadius: 10, background: usedPct > 85 ? "#ecfdf5" : "#fffbeb", color: usedPct > 85 ? "#10b981" : "#f59e0b", fontWeight: 700 }}>{Math.round(usedPct)}%</span>
              </div>
            </div>
            <div style={{ display: "flex", height: 24, borderRadius: 4, overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              {bar.cuts.map((cut, ci) => {
                const pct = (cut / bar.total) * 100;
                return (
                  <div key={ci} title={`${cut}mm`} style={{ width: `${pct}%`, background: SEGMENT_COLORS[ci % SEGMENT_COLORS.length], borderLeft: ci > 0 ? "1px solid rgba(255,255,255,0.5)" : "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minWidth: 2 }}>
                    {pct > 5 && <span style={{ fontSize: 8, color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>{cut}</span>}
                  </div>
                );
              })}
              {bar.remaining > 0 && (
                <div style={{ flex: 1, background: "repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 4px,#e2e8f0 4px,#e2e8f0 8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>OFF-CUT {bar.remaining}mm</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Weight Calculator ────────────────────────────────────────────────────────

interface WeightItem { profileId: string; length: number; qty: number }

function WeightCalculator() {
  const [items, setItems] = useState<WeightItem[]>([{ profileId: "", length: 6000, qty: 1 }]);

  const addItem = () => setItems(prev => [...prev, { profileId: "", length: 6000, qty: 1 }]);
  const setItem = (idx: number, k: keyof WeightItem, v: string | number) =>
    setItems(prev => prev.map((x, i) => i === idx ? { ...x, [k]: v } : x));
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const results = items.map(item => {
    const prof = PROFILES_DATA.find(p => p.id === Number(item.profileId));
    if (!prof) return null;
    const lengthM  = item.length / 1000;
    const weightKg = prof.weight * lengthM * item.qty;
    const cost     = (prof.unitPrice / 6) * lengthM * item.qty;
    return { prof, weightKg, cost };
  });

  const totalWeight = results.reduce((s, r) => s + (r?.weightKg ?? 0), 0);
  const totalCost   = results.reduce((s, r) => s + (r?.cost ?? 0), 0);

  const inp: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", boxSizing: "border-box" };

  return (
    <div>
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr 28px", padding: "8px 12px", background: "#f8fafc", fontSize: 11, fontWeight: 700, color: "#64748b", gap: 8 }}>
          <span>البروفايل</span><span>الطول (mm)</span><span>الكمية</span><span>الوزن (kg)</span><span>التكلفة (KWD)</span><span />
        </div>
        {items.map((item, idx) => {
          const res = results[idx];
          return (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr 28px", padding: "7px 12px", gap: 8, alignItems: "center", borderTop: "1px solid #f1f5f9" }}>
              <select style={inp} value={item.profileId} onChange={e => setItem(idx, "profileId", e.target.value)}>
                <option value="">-- اختر بروفايل --</option>
                {PROFILES_DATA.map(p => <option key={p.id} value={p.id}>{p.code} — {p.arabicName}</option>)}
              </select>
              <input style={inp} type="number" value={item.length} min={100} max={12000} step={50} onChange={e => setItem(idx, "length", Number(e.target.value))} />
              <input style={inp} type="number" value={item.qty}    min={1}   step={1}     onChange={e => setItem(idx, "qty",    Number(e.target.value))} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e4db7" }}>{res ? res.weightKg.toFixed(2) : "—"}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>{res ? fmt3(res.cost) : "—"}</span>
              <button onClick={() => removeItem(idx)} style={{ background: "#fef2f2", border: "none", borderRadius: 5, color: "#ef4444", cursor: "pointer", width: 24, height: 24, fontSize: 14 }}>×</button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={addItem} style={{ padding: "7px 14px", background: "#eff6ff", color: "#1e4db7", border: "1.5px solid #bfdbfe", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ إضافة صنف</button>
        {results.some(Boolean) && (
          <div style={{ display: "flex", gap: 16, marginRight: "auto" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>إجمالي الوزن</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1e4db7" }}>{totalWeight.toFixed(2)} kg</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>إجمالي التكلفة</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>{fmt3(totalCost)} KWD</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cut Optimizer UI ─────────────────────────────────────────────────────────

interface OptimizerResult { bars: Bar[]; stats: WastageStats; cuts: number[] }

function CutOptimizerTool() {
  const [selProfile, setSelProfile] = useState("");
  const [barLength,  setBarLength]  = useState(6000);
  const [kerf,       setKerf]       = useState(3);
  const [cutsInput,  setCutsInput]  = useState("1400, 1400, 1600, 1600, 1200, 800, 950");
  const [result,     setResult]     = useState<OptimizerResult | null>(null);

  const runOptimize = () => {
    const cuts = cutsInput.split(/[,\n]+/).map(s => Number(s.trim())).filter(n => n > 0 && n < barLength);
    if (!cuts.length) return;
    const bars  = optimizeCuts(cuts, barLength, kerf);
    const stats = calcWastage(bars);
    setResult({ bars, stats, cuts });
  };

  const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>البروفايل</label>
          <select style={inp} value={selProfile} onChange={e => setSelProfile(e.target.value)}>
            <option value="">-- اختر بروفايل --</option>
            {PROFILES_DATA.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>طول البار (mm)</label>
          <input style={inp} type="number" value={barLength} min={1000} max={12000} step={500} onChange={e => setBarLength(Number(e.target.value))} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>عرض القطع Kerf (mm)</label>
          <input style={inp} type="number" value={kerf} min={1} max={10} onChange={e => setKerf(Number(e.target.value))} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>القياسات المطلوبة (mm) — مفصولة بفاصلة</label>
        <textarea style={{ ...inp, height: 80, resize: "vertical" }} value={cutsInput} onChange={e => setCutsInput(e.target.value)} placeholder="1400, 1400, 1600, 1600..." />
      </div>
      <button onClick={runOptimize} style={{ padding: "10px 24px", background: "#1e4db7", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
        ⚡ تحسين القطع
      </button>

      {result && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
            {([
              ["البارات المطلوبة", result.stats.bars,               "#1e4db7"],
              ["كفاءة القطع",      `${result.stats.efficiency}%`,    result.stats.efficiency > 85 ? "#10b981" : "#f59e0b"],
              ["إجمالي الهدر",    `${(result.stats.waste/1000).toFixed(2)}m`, "#ef4444"],
              ["القياسات",         result.cuts.length,              "#8b5cf6"],
            ] as [string, string | number, string][]).map(([l, v, c]) => (
              <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          <CuttingBarDiagram bars={result.bars} barLength={barLength} />
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type TabId = "profiles" | "optimizer" | "weight" | "cutjobs" | "orders" | "finishes";

export default function ProfilesPage() {
  const [db]                = useDB();
  const [tab, setTab]       = useState<TabId>("profiles");
  const [seriesFilter, setSeriesFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileDef | null>(null);

  const totalStockValue = PROFILES_DATA.reduce((s, p) => s + p.stock * p.unitPrice, 0);
  const lowStockCount   = PROFILES_DATA.filter(p => p.stock < p.minStock).length;
  const totalWeight     = PROFILES_DATA.reduce((s, p) => s + p.stock * p.weight * 6, 0);

  const filteredProfiles = useMemo(() => PROFILES_DATA.filter(p => {
    const matchSeries = seriesFilter === "all" || p.seriesId === seriesFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.arabicName.includes(search) || p.code.toLowerCase().includes(search.toLowerCase());
    return matchSeries && matchSearch;
  }), [seriesFilter, search]);

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "profiles",  label: "كتالوج البروفايلات", icon: "📐" },
    { id: "optimizer", label: "محسّن القطع",         icon: "⚡" },
    { id: "weight",    label: "حاسبة الوزن",         icon: "⚖️" },
    { id: "cutjobs",   label: "أوامر القطع",          icon: "🪚" },
    { id: "orders",    label: "أوامر الشراء",         icon: "🛒" },
    { id: "finishes",  label: "التشطيبات",            icon: "🎨" },
  ];

  const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", direction: "rtl" };

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", direction: "rtl", background: "#f0f4f8", minHeight: "100vh", color: "#1e293b" }}>

      {/* Header */}
      <div style={{ background: "#0f172a", color: "#fff", padding: "0 24px", display: "flex", alignItems: "center", height: 56, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "#1e4db7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📐</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>WinCraft <span style={{ color: "#3b82f6" }}>Profiles</span></div>
            <div style={{ fontSize: 10, color: "#475569" }}>نظام بروفايلات الألمنيوم</div>
          </div>
        </div>
        <div style={{ marginRight: "auto", display: "flex", gap: 20 }}>
          {([
            ["قيمة المخزون", `${(totalStockValue / 1000).toFixed(1)}K KWD`, "#60a5fa"],
            ["إجمالي الوزن", `${(totalWeight / 1000).toFixed(1)} طن`,       "#34d399"],
            ["تنبيهات",      lowStockCount,                                  "#f87171"],
          ] as [string, string | number, string][]).map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#475569" }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", gap: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", borderBottom: tab === t.id ? "2px solid #1e4db7" : "2px solid transparent", color: tab === t.id ? "#1e4db7" : "#64748b", padding: "10px 16px", cursor: "pointer", fontSize: 12, fontWeight: tab === t.id ? 700 : 400, display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 24 }}>

        {/* ── PROFILES ── */}
        {tab === "profiles" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
              {([
                { l: "إجمالي البروفايلات", v: PROFILES_DATA.length,                                  c: "#1e4db7" },
                { l: "سيريز 60",           v: PROFILES_DATA.filter(p => p.seriesId === "S60").length, c: "#0891b2" },
                { l: "سيريز 45",           v: PROFILES_DATA.filter(p => p.seriesId === "S45").length, c: "#7c3aed" },
                { l: "كيرتن وول",          v: PROFILES_DATA.filter(p => p.seriesId === "CW").length,  c: "#059669" },
                { l: "أبواب",              v: PROFILES_DATA.filter(p => p.seriesId === "DR").length,  c: "#d97706" },
                { l: "مخزون منخفض",        v: lowStockCount,                                          c: "#ef4444" },
              ] as { l: string; v: number; c: string }[]).map(s => (
                <div key={s.l} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${s.c}` }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{s.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              <input placeholder="بحث بالاسم أو الكود..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inp, maxWidth: 260 }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["all", ...SERIES.map(s => s.id)].map(sid => {
                  const label = sid === "all" ? "الكل" : SERIES.find(s => s.id === sid)?.name ?? sid;
                  return (
                    <button key={sid} onClick={() => setSeriesFilter(sid)} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${seriesFilter === sid ? "#1e4db7" : "#e2e8f0"}`, background: seriesFilter === sid ? "#eff6ff" : "#fff", color: seriesFilter === sid ? "#1e4db7" : "#64748b", fontSize: 11, cursor: "pointer", fontWeight: seriesFilter === sid ? 700 : 400 }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
              {filteredProfiles.map(profile => {
                const series  = SERIES.find(s => s.id === profile.seriesId);
                const stockPct = Math.min(100, Math.round((profile.stock / profile.minStock) * 100));
                const isLow   = profile.stock < profile.minStock;
                return (
                  <div key={profile.id} onClick={() => setSelectedProfile(profile)}
                    style={{ background: "#fff", border: `1.5px solid ${isLow ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                      <ProfileShape type={profile.image} color={series?.color} size={52} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#1e4db7", marginBottom: 2 }}>{profile.code}</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{profile.arabicName}</div>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>{profile.name}</div>
                          </div>
                          {isLow && <span style={{ fontSize: 10, padding: "2px 7px", background: "#fef2f2", color: "#ef4444", borderRadius: 10, fontWeight: 700, border: "1px solid #fca5a5", whiteSpace: "nowrap" }}>⚠ منخفض</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                      {([["الوزن", `${profile.weight} kg/m`, "#475569"], ["السبيكة", profile.alloy, "#8b5cf6"], ["التشطيب", profile.finish, "#0891b2"]] as [string, string, string][]).map(([l, v, c]) => (
                        <div key={l} style={{ background: "#f8fafc", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: "#94a3b8" }}>{l}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: "#64748b" }}>مخزون: <b style={{ color: isLow ? "#ef4444" : "#1e293b" }}>{profile.stock} بار</b></span>
                        <span style={{ color: "#94a3b8" }}>حد أدنى: {profile.minStock}</span>
                      </div>
                      <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${stockPct}%`, height: "100%", background: isLow ? "#ef4444" : "#10b981", borderRadius: 3 }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#10b981" }}>{fmt3(profile.unitPrice)} KWD/بار</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>قيمة: {fmt3(profile.stock * profile.unitPrice)} KWD</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── OPTIMIZER ── */}
        {tab === "optimizer" && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>محسّن القطع الذكي</h3>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "#64748b" }}>خوارزمية First-Fit Decreasing — تقليل الهدر وتحسين استخدام البارات</p>
            <CutOptimizerTool />
          </div>
        )}

        {/* ── WEIGHT ── */}
        {tab === "weight" && (
          <div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>حاسبة وزن الألمنيوم</h3>
              <p style={{ margin: "0 0 20px", fontSize: 12, color: "#64748b" }}>احسب الوزن الإجمالي والتكلفة لأي مجموعة بروفايلات</p>
              <WeightCalculator />
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>مرجع سبائك الألمنيوم</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
                {[
                  { alloy: "6063-T5", density: 2.70, tensile: "145 MPa", yield: "110 MPa", usage: "نوافذ وأبواب قياسية",          color: "#eff6ff" },
                  { alloy: "6061-T6", density: 2.70, tensile: "310 MPa", yield: "276 MPa", usage: "كيرتن وول وهياكل ثقيلة",      color: "#ecfdf5" },
                  { alloy: "6082-T6", density: 2.71, tensile: "340 MPa", yield: "310 MPa", usage: "تطبيقات هندسية متخصصة",       color: "#f5f3ff" },
                ].map(a => (
                  <div key={a.alloy} style={{ background: a.color, border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>{a.alloy}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11 }}>
                      <div><span style={{ color: "#94a3b8" }}>الكثافة:</span> <b>{a.density} g/cm³</b></div>
                      <div><span style={{ color: "#94a3b8" }}>شد:</span> <b>{a.tensile}</b></div>
                      <div><span style={{ color: "#94a3b8" }}>خضوع:</span> <b>{a.yield}</b></div>
                    </div>
                    <div style={{ fontSize: 11, color: "#1e4db7", marginTop: 6, fontWeight: 600 }}>✦ {a.usage}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CUT JOBS ── */}
        {tab === "cutjobs" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>أوامر القطع</h3>
              <button style={{ padding: "9px 18px", background: "#1e4db7", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+ أمر قطع جديد</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {db.cutJobs.map(job => (
                <div key={job.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#1e4db7" }}>{job.id}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: job.status === "منفذ" ? "#ecfdf5" : "#eff6ff", color: job.status === "منفذ" ? "#10b981" : "#3b82f6", fontWeight: 700 }}>{job.status}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{job.projectName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Ref: {job.projectRef} • {job.date}</div>
                    </div>
                  </div>
                  {job.items.map((item, ii) => {
                    const bars  = optimizeCuts(item.cuts, item.barLength);
                    const stats = calcWastage(bars);
                    return (
                      <div key={ii} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                          <span style={{ fontWeight: 700 }}>{item.profileName} <span style={{ color: "#64748b", fontWeight: 400 }}>({item.seriesId})</span></span>
                          <div style={{ display: "flex", gap: 12, color: "#64748b" }}>
                            <span>بارات: <b style={{ color: "#1e4db7" }}>{stats.bars}</b></span>
                            <span>كفاءة: <b style={{ color: stats.efficiency > 80 ? "#10b981" : "#f59e0b" }}>{stats.efficiency}%</b></span>
                            <span>هدر: <b style={{ color: "#ef4444" }}>{(stats.waste / 1000).toFixed(2)}m</b></span>
                          </div>
                        </div>
                        <CuttingBarDiagram bars={bars} barLength={item.barLength} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PURCHASE ORDERS ── */}
        {tab === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>أوامر شراء الألمنيوم</h3>
              <button style={{ padding: "9px 18px", background: "#1e4db7", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+ أمر شراء جديد</button>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: "#f8fafc", fontSize: 11, fontWeight: 700, color: "#64748b", gap: 8 }}>
                <span>رقم الأمر</span><span>المورد</span><span>السيريز</span><span>البروفايلات</span><span>الكمية</span><span>الإجمالي</span><span>التسليم</span><span>الحالة</span>
              </div>
              {db.orders.map((o, i) => (
                <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "12px 16px", gap: 8, alignItems: "center", borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbfc", fontSize: 12 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e4db7" }}>{o.id}</span>
                  <span style={{ fontWeight: 600 }}>{o.supplier}</span>
                  <span style={{ fontSize: 11, padding: "2px 7px", background: "#f1f5f9", borderRadius: 5, fontWeight: 600 }}>{o.series}</span>
                  <span>{o.profiles} صنف</span>
                  <span style={{ fontWeight: 700 }}>{o.qty} بار</span>
                  <span style={{ fontWeight: 700, color: "#10b981" }}>{fmt3(o.total)} KWD</span>
                  <span style={{ color: "#64748b" }}>{o.deliveryDate}</span>
                  <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 10, background: o.status === "مستلم" ? "#ecfdf5" : "#eff6ff", color: o.status === "مستلم" ? "#10b981" : "#3b82f6", fontWeight: 700 }}>{o.status}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🔔 توصيات إعادة الطلب</div>
              {PROFILES_DATA.filter(p => p.stock < p.minStock).map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
                  <ProfileShape type={p.image} color="#ef4444" size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.arabicName}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{p.code} — مخزون: {p.stock} / حد أدنى: {p.minStock}</div>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>كمية مقترحة</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1e4db7" }}>{Math.max(0, p.minStock * 2 - p.stock)} بار</div>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>تكلفة مقدرة</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#10b981" }}>{fmt3(Math.max(0, p.minStock * 2 - p.stock) * p.unitPrice)} KWD</div>
                  </div>
                  <button style={{ padding: "6px 12px", background: "#1e4db7", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>+ طلب شراء</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FINISHES ── */}
        {tab === "finishes" && (
          <div>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>التشطيبات والألوان</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14, marginBottom: 24 }}>
              {FINISHES.map(f => (
                <div key={f.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ height: 80, background: f.color, border: f.id === "powder_white" ? "1px solid #e2e8f0" : "none" }} />
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{f.arabicName}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{f.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>رسوم إضافية:</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: f.premium > 0 ? "#f59e0b" : "#10b981" }}>{f.premium > 0 ? `+${f.premium}%` : "مجاني"}</span>
                    </div>
                    <div style={{ height: 1, background: "#f1f5f9", margin: "8px 0" }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      {["نافذة", "باب", "واجهة"].map(u => (
                        <span key={u} style={{ fontSize: 10, padding: "2px 7px", background: "#f1f5f9", color: "#475569", borderRadius: 10, fontWeight: 600 }}>✓ {u}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>مصفوفة التوافق — السيريز × التشطيب</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid #e2e8f0", fontWeight: 700, color: "#64748b" }}>السيريز</th>
                      {FINISHES.map(f => <th key={f.id} style={{ padding: "8px 10px", textAlign: "center", borderBottom: "1px solid #e2e8f0", fontWeight: 600, color: "#64748b", minWidth: 80 }}>{f.arabicName}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {SERIES.map((s, si) => (
                      <tr key={s.id} style={{ background: si % 2 === 0 ? "#fff" : "#fafbfc" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 700, borderBottom: "1px solid #f1f5f9" }}>{s.name}</td>
                        {FINISHES.map(f => {
                          const compat = !(s.id === "CW" && f.id === "mill");
                          return (
                            <td key={f.id} style={{ padding: "8px 10px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                              <span style={{ fontSize: 14, color: compat ? "#10b981" : "#ef4444" }}>{compat ? "✓" : "✗"}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelectedProfile(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, direction: "rtl" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <ProfileShape type={selectedProfile.image} color={SERIES.find(s => s.id === selectedProfile.seriesId)?.color} size={64} />
                <div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "#1e4db7" }}>{selectedProfile.code}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedProfile.arabicName}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{selectedProfile.name}</div>
                </div>
              </div>
              <button onClick={() => setSelectedProfile(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, color: "#64748b" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {([
                ["السيريز",      SERIES.find(s => s.id === selectedProfile.seriesId)?.name ?? ""],
                ["الوزن",        `${selectedProfile.weight} kg/m`],
                ["السبيكة",      selectedProfile.alloy],
                ["التشطيب",      selectedProfile.finish],
                ["طول البار",    "6,000 mm"],
                ["المخزون",      `${selectedProfile.stock} بار`],
                ["الحد الأدنى",  `${selectedProfile.minStock} بار`],
                ["السعر",        `${fmt3(selectedProfile.unitPrice)} KWD/بار`],
                ["وزن بار كامل", `${(selectedProfile.weight * 6).toFixed(2)} kg`],
                ["قيمة المخزون", `${fmt3(selectedProfile.stock * selectedProfile.unitPrice)} KWD`],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setTab("optimizer"); setSelectedProfile(null); }} style={{ flex: 1, padding: "9px", background: "#1e4db7", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>فتح محسّن القطع</button>
              <button onClick={() => setSelectedProfile(null)} style={{ flex: 1, padding: "9px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#475569" }}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
