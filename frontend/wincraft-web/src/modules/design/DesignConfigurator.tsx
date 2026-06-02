import { useState, useRef, useEffect, useCallback } from "react";

// ─── Catalog ──────────────────────────────────────────────────────────────────
const CATALOG = [
  { id: "SL2P", category: "نوافذ", name: "Sliding 2T 2P", series: "NCL VEKA I-60 SLIDING", panels: [{ x: 0, w: 0.5, type: "sliding", direction: "right" }, { x: 0.5, w: 0.5, type: "sliding", direction: "left" }], defaultW: 1500, defaultH: 1500, glassThick: 5, basePrice: 7707 },
  { id: "FR2P", category: "نوافذ", name: "French Window", series: "NCL VEKA I-60 CASEMENT", panels: [{ x: 0, w: 0.5, type: "casement", direction: "left" }, { x: 0.5, w: 0.5, type: "casement", direction: "right" }], defaultW: 1500, defaultH: 1500, glassThick: 5, basePrice: 10205 },
  { id: "FX1P", category: "نوافذ", name: "Fixed Window", series: "NCL VEKA I-60 CASEMENT", panels: [{ x: 0, w: 1, type: "fixed", direction: null }], defaultW: 1200, defaultH: 1000, glassThick: 6, basePrice: 5800 },
  { id: "SL3P", category: "نوافذ", name: "Sliding 3T 2P+Mesh", series: "NCL VEKA I-60 SLIDING", panels: [{ x: 0, w: 0.33, type: "mesh", direction: null }, { x: 0.33, w: 0.34, type: "sliding", direction: "right" }, { x: 0.67, w: 0.33, type: "sliding", direction: "left" }], defaultW: 1500, defaultH: 1500, glassThick: 5, basePrice: 9200 },
  { id: "TRP", category: "نوافذ", name: "Triple Fixed", series: "NCL VEKA I-60 CASEMENT", panels: [{ x: 0, w: 0.33, type: "fixed", direction: null }, { x: 0.33, w: 0.34, type: "fixed", direction: null }, { x: 0.67, w: 0.33, type: "fixed", direction: null }], defaultW: 1500, defaultH: 1500, glassThick: 6, basePrice: 8900 },
  { id: "AWN", category: "نوافذ", name: "Awning Top-Hung", series: "NCL VEKA I-60 CASEMENT", panels: [{ x: 0, w: 1, type: "awning", direction: "top" }], defaultW: 1000, defaultH: 700, glassThick: 5, basePrice: 4800 },
  { id: "DR1P", category: "أبواب", name: "Single Door", series: "NCL VEKA DOOR SERIES", panels: [{ x: 0, w: 1, type: "door", direction: "right" }], defaultW: 900, defaultH: 2100, glassThick: 8, basePrice: 14500 },
  { id: "DR2P", category: "أبواب", name: "Double Door", series: "NCL VEKA DOOR SERIES", panels: [{ x: 0, w: 0.5, type: "door", direction: "left" }, { x: 0.5, w: 0.5, type: "door", direction: "right" }], defaultW: 1800, defaultH: 2100, glassThick: 8, basePrice: 26000 },
  { id: "CW1", category: "واجهات", name: "Curtain Wall Fixed", series: "NCL VEKA CURTAIN WALL", panels: [{ x: 0, w: 0.5, type: "fixed", direction: null }, { x: 0.5, w: 0.5, type: "fixed", direction: null }], defaultW: 1500, defaultH: 3000, glassThick: 10, basePrice: 48000 },
  { id: "PRT", category: "فواصل", name: "Office Partition", series: "GLASS PARTITION", panels: [{ x: 0, w: 1, type: "fixed", direction: null }], defaultW: 1200, defaultH: 2400, glassThick: 8, basePrice: 13200 },
];

const GLASS_OPTIONS = [
  { id: "g5c", name: "5MM Clear Glass", thick: 5, color: "#bfdbfe", price: 0 },
  { id: "g6c", name: "6MM Clear Toughened", thick: 6, color: "#93c5fd", price: 450 },
  { id: "g8c", name: "8MM Clear Toughened", thick: 8, color: "#60a5fa", price: 900 },
  { id: "g10r", name: "10MM Reflective", thick: 10, color: "#3b82f6", price: 1800 },
  { id: "g8f", name: "8MM Frosted", thick: 8, color: "#e0f2fe", price: 1200 },
];

const LOCATIONS = ["Hall", "Bedroom", "Kitchen", "Bathroom", "Living Room", "Office", "Balcony", "Lobby"];

type PanelDef = { x: number; w: number; type: string; direction: string | null };
type Template = typeof CATALOG[number];
type CustomShape = { id: string; name: string; category: string; dataUrl: string; defaultW: number; defaultH: number; isCustom: true };
type Design = { id: number; code: string; templateId: string; width: number; height: number; glass: string; location: string; floor: string; qty: number; customShapeId?: string };

function inputStyle() {
  return { width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit", direction: "rtl" as const, background: "#fff" };
}
function calcPrice(d: Design, _customShapes: CustomShape[]) {
  if (d.customShapeId) {
    const glass = GLASS_OPTIONS.find(g => g.id === d.glass);
    const area = (d.width * d.height) / 1e6;
    return 8000 * area * d.qty + (glass?.price || 0) * d.qty;
  }
  const tmpl = CATALOG.find(c => c.id === d.templateId);
  const glass = GLASS_OPTIONS.find(g => g.id === d.glass);
  const area = (d.width * d.height) / 1e6;
  return ((tmpl?.basePrice || 0) * area * d.qty + (glass?.price || 0) * d.qty);
}

// ─── SVG Panel Renderer ───────────────────────────────────────────────────────
function drawPanel(panel: PanelDef, x0: number, y0: number, W: number, H: number, glassColor: string, scale: number) {
  const px = x0 + panel.x * W, pw = panel.w * W, ft = 12 * scale, fc = "#475569";
  const cx = px + pw / 2, cy = y0 + H / 2;
  const els: React.ReactNode[] = [];
  els.push(
    <rect key="f" x={px} y={y0} width={pw} height={H} fill="none" stroke={fc} strokeWidth={ft} />,
    <rect key="g" x={px + ft / 2} y={y0 + ft / 2} width={pw - ft} height={H - ft} fill={glassColor} fillOpacity="0.55" stroke={fc} strokeWidth="1" />
  );
  if (panel.type === "sliding") {
    const mid = px + pw / 2, dir = panel.direction === "right" ? 1 : -1, ax = cx - dir * pw * 0.12;
    els.push(
      <line key="div" x1={mid} y1={y0} x2={mid} y2={y0 + H} stroke={fc} strokeWidth={ft * 0.7} />,
      <line key="arr" x1={ax} y1={cy} x2={ax + dir * pw * 0.22} y2={cy} stroke={fc} strokeWidth={2 * scale} strokeLinecap="round" />,
      <polygon key="arh" points={`${ax + dir * pw * 0.22},${cy} ${ax + dir * pw * 0.22 - dir * 8 * scale},${cy - 5 * scale} ${ax + dir * pw * 0.22 - dir * 8 * scale},${cy + 5 * scale}`} fill={fc} />,
      <circle key="hdl" cx={px + (panel.direction === "right" ? pw * 0.75 : pw * 0.25)} cy={cy} r={5 * scale} fill={fc} />
    );
  }
  if (panel.type === "casement") {
    const sx = panel.direction === "left" ? px + ft : px + pw - ft, ex = panel.direction === "left" ? px + pw - ft : px + ft;
    const hx = panel.direction === "left" ? px + ft * 0.6 : px + pw - ft * 0.6, hdlX = panel.direction === "left" ? px + pw - ft * 1.5 : px + ft * 1.5;
    els.push(
      <line key="d1" x1={sx} y1={y0 + ft} x2={ex} y2={cy} stroke={fc} strokeWidth={scale} strokeDasharray="4 3" opacity="0.6" />,
      <line key="d2" x1={sx} y1={y0 + H - ft} x2={ex} y2={cy} stroke={fc} strokeWidth={scale} strokeDasharray="4 3" opacity="0.6" />,
      ...[0.3, 0.7].map((f, i) => <rect key={`h${i}`} x={hx - 3 * scale} y={y0 + H * f - 5 * scale} width={6 * scale} height={10 * scale} fill={fc} rx={2} />),
      <rect key="hdl" x={hdlX - 3 * scale} y={cy - 12 * scale} width={6 * scale} height={24 * scale} rx={3} fill={fc} />
    );
  }
  if (panel.type === "awning") {
    els.push(
      <line key="d1" x1={px + ft} y1={y0 + ft} x2={cx} y2={y0 + H - ft} stroke={fc} strokeWidth={scale} strokeDasharray="4 3" opacity="0.6" />,
      <line key="d2" x1={px + pw - ft} y1={y0 + ft} x2={cx} y2={y0 + H - ft} stroke={fc} strokeWidth={scale} strokeDasharray="4 3" opacity="0.6" />
    );
  }
  if (panel.type === "door") {
    const dHx = panel.direction === "right" ? px + ft * 2 : px + pw - ft * 2, sw = pw - ft * 2;
    const arcX = panel.direction === "right" ? px + ft : px + pw - ft, arcEx = panel.direction === "right" ? arcX + sw * 0.6 : arcX - sw * 0.6;
    els.push(
      <rect key="dp" x={px + ft} y={y0 + ft} width={pw - ft * 2} height={H - ft * 2} fill="none" stroke={fc} strokeWidth={1.5 * scale} />,
      <rect key="lk" x={dHx - 3 * scale} y={cy - 20 * scale} width={6 * scale} height={40 * scale} rx={3} fill={fc} />,
      <circle key="kh" cx={dHx} cy={cy} r={4 * scale} fill="#fff" stroke={fc} strokeWidth={1.5} />,
      <path key="arc" d={`M ${arcX} ${y0 + H - ft} Q ${arcEx} ${y0 + H - ft} ${arcEx} ${y0 + H - ft - sw * 0.6}`} fill="none" stroke={fc} strokeWidth={scale} strokeDasharray="4 3" opacity="0.5" />
    );
  }
  if (panel.type === "mesh") {
    const ix = px + ft / 2, iy = y0 + ft / 2, iw = pw - ft, ih = H - ft;
    els.push(...[...Array(8)].map((_, i) => <line key={`mv${i}`} x1={ix + (i / 8) * iw} y1={iy} x2={ix + (i / 8) * iw} y2={iy + ih} stroke={fc} strokeWidth={0.5 * scale} opacity="0.4" />));
    els.push(...[...Array(8)].map((_, i) => <line key={`mh${i}`} x1={ix} y1={iy + (i / 8) * ih} x2={ix + iw} y2={iy + (i / 8) * ih} stroke={fc} strokeWidth={0.5 * scale} opacity="0.4" />));
  }
  return els;
}

type WinSVGProps = { design: { template?: Template; width: number; height: number; glass: string; code?: string; customShape?: CustomShape }; scale?: number; showDims?: boolean };
function WindowSVG({ design, scale = 1, showDims = true }: WinSVGProps) {
  const { template, width, height, glass, code, customShape } = design;
  const PAD = showDims ? 48 * scale : 8 * scale;
  const W = width * scale, H = height * scale;
  const svgW = W + PAD * 2, svgH = H + PAD * 2;
  const x0 = PAD, y0 = PAD;
  const glassObj = GLASS_OPTIONS.find(g => g.id === glass) || GLASS_OPTIONS[0];
  const wp = 20 * scale;

  if (customShape) {
    return (
      <svg width={svgW} height={svgH}>
        {showDims && (
          <>
            <rect x={x0 - wp} y={y0 - wp} width={W + wp * 2} height={H + wp * 2} fill="#d4c4a8" stroke="#b8a88a" strokeWidth={0.5 * scale} rx={2} />
            {[...Array(6)].map((_, i) => <line key={i} x1={x0 - wp} y1={y0 - wp + (i + 1) * ((H + wp * 2) / 7)} x2={x0 - wp + W + wp * 2} y2={y0 - wp + (i + 1) * ((H + wp * 2) / 7)} stroke="#b8a88a" strokeWidth={0.5 * scale} opacity="0.5" />)}
            <rect x={x0} y={y0} width={W} height={H} fill="#f8fafc" />
          </>
        )}
        <image href={customShape.dataUrl} x={x0} y={y0} width={W} height={H} preserveAspectRatio="xMidYMid meet" />
        <rect x={x0} y={y0} width={W} height={H} fill="none" stroke="#334155" strokeWidth={2 * scale} />
        {showDims && (
          <>
            <line x1={x0} y1={y0 + H + 22 * scale} x2={x0 + W} y2={y0 + H + 22 * scale} stroke="#1e4db7" strokeWidth={scale} />
            <line x1={x0} y1={y0 + H + 16 * scale} x2={x0} y2={y0 + H + 28 * scale} stroke="#1e4db7" strokeWidth={scale} />
            <line x1={x0 + W} y1={y0 + H + 16 * scale} x2={x0 + W} y2={y0 + H + 28 * scale} stroke="#1e4db7" strokeWidth={scale} />
            <text x={x0 + W / 2} y={y0 + H + 40 * scale} textAnchor="middle" fontSize={11 * scale} fill="#1e4db7" fontWeight="700">{width}</text>
            <text x={x0 + W / 2} y={y0 - 8 * scale} textAnchor="middle" fontSize={10 * scale} fill="#64748b" fontWeight="600">{code || customShape.name}</text>
            <line x1={x0 - wp * 0.8} y1={y0 + H + wp * 0.6} x2={x0 + W + wp * 0.8} y2={y0 + H + wp * 0.6} stroke="#94a3b8" strokeWidth={3 * scale} strokeLinecap="round" />
          </>
        )}
      </svg>
    );
  }

  if (!template) return null;
  return (
    <svg width={svgW} height={svgH}>
      {showDims && (
        <>
          <rect x={x0 - wp} y={y0 - wp} width={W + wp * 2} height={H + wp * 2} fill="#d4c4a8" stroke="#b8a88a" strokeWidth={0.5 * scale} rx={2} />
          {[...Array(6)].map((_, i) => <line key={i} x1={x0 - wp} y1={y0 - wp + (i + 1) * ((H + wp * 2) / 7)} x2={x0 - wp + W + wp * 2} y2={y0 - wp + (i + 1) * ((H + wp * 2) / 7)} stroke="#b8a88a" strokeWidth={0.5 * scale} opacity="0.5" />)}
          <rect x={x0} y={y0} width={W} height={H} fill="#f8fafc" />
        </>
      )}
      {template.panels.map((p, i) => <g key={i}>{drawPanel(p as PanelDef, x0, y0, W, H, glassObj.color, scale)}</g>)}
      <rect x={x0} y={y0} width={W} height={H} fill="none" stroke="#334155" strokeWidth={2 * scale} />
      {showDims && (
        <>
          <line x1={x0} y1={y0 + H + 22 * scale} x2={x0 + W} y2={y0 + H + 22 * scale} stroke="#1e4db7" strokeWidth={scale} />
          <line x1={x0} y1={y0 + H + 16 * scale} x2={x0} y2={y0 + H + 28 * scale} stroke="#1e4db7" strokeWidth={scale} />
          <line x1={x0 + W} y1={y0 + H + 16 * scale} x2={x0 + W} y2={y0 + H + 28 * scale} stroke="#1e4db7" strokeWidth={scale} />
          <text x={x0 + W / 2} y={y0 + H + 40 * scale} textAnchor="middle" fontSize={11 * scale} fill="#1e4db7" fontWeight="700">{width}</text>
          <line x1={x0 - 22 * scale} y1={y0} x2={x0 - 22 * scale} y2={y0 + H} stroke="#1e4db7" strokeWidth={scale} />
          <line x1={x0 - 28 * scale} y1={y0} x2={x0 - 16 * scale} y2={y0} stroke="#1e4db7" strokeWidth={scale} />
          <line x1={x0 - 28 * scale} y1={y0 + H} x2={x0 - 16 * scale} y2={y0 + H} stroke="#1e4db7" strokeWidth={scale} />
          <text x={x0 - 36 * scale} y={y0 + H / 2} textAnchor="middle" fontSize={11 * scale} fill="#1e4db7" fontWeight="700" transform={`rotate(-90, ${x0 - 36 * scale}, ${y0 + H / 2})`}>{height}</text>
          {template.panels.length > 1 && template.panels.map((p, i) => <text key={i} x={x0 + p.x * W + (p.w * W) / 2} y={y0 + H + 14 * scale} textAnchor="middle" fontSize={9 * scale} fill="#64748b">{Math.round(p.w * width)}</text>)}
          <text x={x0 + W / 2} y={y0 - 8 * scale} textAnchor="middle" fontSize={10 * scale} fill="#64748b" fontWeight="600">{code || template.id}</text>
          <line x1={x0 - wp * 0.8} y1={y0 + H + wp * 0.6} x2={x0 + W + wp * 0.8} y2={y0 + H + wp * 0.6} stroke="#94a3b8" strokeWidth={3 * scale} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// ─── Drawing Canvas ───────────────────────────────────────────────────────────
type DrawTool = "pen" | "line" | "rect" | "circle" | "eraser" | "fill";
type DrawAction = { imageData: ImageData };

interface DrawingCanvasProps {
  onSave: (dataUrl: string, name: string) => void;
  onClose: () => void;
}

function DrawingCanvas({ onSave, onClose }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [color, setColor] = useState("#1e4db7");
  const [strokeW, setStrokeW] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [shapeName, setShapeName] = useState("Custom Shape");
  const [category, setCategory] = useState("نوافذ");
  const inp = inputStyle();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw light grid
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= canvas.height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const saveHistory = useCallback(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const imgData = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    setHistory(h => [...h.slice(-20), { imageData: imgData }]);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.putImageData(prev.imageData, 0, 0);
    setHistory(h => h.slice(0, -1));
  }, [history]);

  const clear = useCallback(() => {
    saveHistory();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= canvas.height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  }, [saveHistory]);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    saveHistory();
    setStartPos(pos);
    setDrawing(true);
    if (tool === "pen" || tool === "eraser") {
      const ctx = canvasRef.current!.getContext("2d")!;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    if (tool === "fill") {
      floodFill(pos.x, pos.y);
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    const octx = overlayRef.current!.getContext("2d")!;

    if (tool === "pen") {
      ctx.strokeStyle = color; ctx.lineWidth = strokeW; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
    } else if (tool === "eraser") {
      ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = strokeW * 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
    } else {
      octx.clearRect(0, 0, overlayRef.current!.width, overlayRef.current!.height);
      octx.strokeStyle = color; octx.fillStyle = color + "33"; octx.lineWidth = strokeW; octx.lineCap = "round";
      const dx = pos.x - startPos.x, dy = pos.y - startPos.y;
      if (tool === "line") {
        octx.beginPath(); octx.moveTo(startPos.x, startPos.y); octx.lineTo(pos.x, pos.y); octx.stroke();
      } else if (tool === "rect") {
        octx.beginPath(); octx.rect(startPos.x, startPos.y, dx, dy); octx.fill(); octx.stroke();
      } else if (tool === "circle") {
        octx.beginPath(); octx.ellipse(startPos.x + dx / 2, startPos.y + dy / 2, Math.abs(dx / 2), Math.abs(dy / 2), 0, 0, Math.PI * 2); octx.fill(); octx.stroke();
      }
    }
  };

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    setDrawing(false);
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    const octx = overlayRef.current!.getContext("2d")!;
    const dx = pos.x - startPos.x, dy = pos.y - startPos.y;
    ctx.strokeStyle = color; ctx.fillStyle = color + "33"; ctx.lineWidth = strokeW; ctx.lineCap = "round";
    if (tool === "line") { ctx.beginPath(); ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
    else if (tool === "rect") { ctx.beginPath(); ctx.rect(startPos.x, startPos.y, dx, dy); ctx.fill(); ctx.stroke(); }
    else if (tool === "circle") { ctx.beginPath(); ctx.ellipse(startPos.x + dx / 2, startPos.y + dy / 2, Math.abs(dx / 2), Math.abs(dy / 2), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    octx.clearRect(0, 0, overlayRef.current!.width, overlayRef.current!.height);
  };

  function floodFill(startX: number, startY: number) {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const si = (Math.round(startY) * canvas.width + Math.round(startX)) * 4;
    const tr = d[si], tg = d[si + 1], tb = d[si + 2];
    const fr = parseInt(color.slice(1, 3), 16), fg = parseInt(color.slice(3, 5), 16), fb = parseInt(color.slice(5, 7), 16);
    if (tr === fr && tg === fg && tb === fb) return;
    const stack = [Math.round(startX) + Math.round(startY) * canvas.width];
    while (stack.length) {
      const idx = stack.pop()!;
      const i = idx * 4;
      if (i < 0 || i >= d.length) continue;
      if (d[i] !== tr || d[i + 1] !== tg || d[i + 2] !== tb) continue;
      d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255;
      stack.push(idx + 1, idx - 1, idx + canvas.width, idx - canvas.width);
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const handleSave = () => {
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    onSave(dataUrl, shapeName);
  };

  const tools: { id: DrawTool; icon: string; label: string }[] = [
    { id: "pen", icon: "✏️", label: "قلم" },
    { id: "line", icon: "╱", label: "خط" },
    { id: "rect", icon: "▭", label: "مستطيل" },
    { id: "circle", icon: "○", label: "دائرة" },
    { id: "eraser", icon: "⬜", label: "ممحاة" },
    { id: "fill", icon: "🪣", label: "تلوين" },
  ];
  const COLORS = ["#1e4db7", "#0ea5e9", "#10b981", "#f97316", "#ef4444", "#8b5cf6", "#64748b", "#f59e0b", "#000000", "#334155", "#475569", "#94a3b8", "#bfdbfe", "#ffffff"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.85)", zIndex: 1100, display: "flex", alignItems: "stretch", direction: "rtl" }}>
      {/* Left toolbar */}
      <div style={{ width: 64, background: "#1e293b", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 4, flexShrink: 0 }}>
        {tools.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)} title={t.label} style={{ width: 44, height: 44, borderRadius: 8, border: "none", background: tool === t.id ? "#1e4db7" : "transparent", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.icon}</button>
        ))}
        <div style={{ width: "80%", height: 1, background: "#334155", margin: "8px 0" }} />
        <button onClick={undo} title="تراجع" style={{ width: 44, height: 44, borderRadius: 8, border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 18 }}>↩</button>
        <button onClick={clear} title="مسح الكل" style={{ width: 44, height: 44, borderRadius: 8, border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 18 }}>🗑</button>
        <div style={{ width: "80%", height: 1, background: "#334155", margin: "8px 0" }} />
        {/* Stroke width */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          {[2, 4, 8, 16].map(s => (
            <button key={s} onClick={() => setStrokeW(s)} style={{ width: 44 - s * 0.5, height: 44 - s * 0.5, borderRadius: "50%", border: strokeW === s ? "2px solid #1e4db7" : "1px solid #475569", background: "#334155", cursor: "pointer" }} />
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar top */}
        <div style={{ background: "#0f172a", padding: "8px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>اللون:</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 400 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: 4, background: c, border: color === c ? "2px solid #fff" : "1px solid #334155", cursor: "pointer" }} />
            ))}
          </div>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 32, height: 28, border: "none", borderRadius: 6, cursor: "pointer", background: "none" }} title="لون مخصص" />
          <span style={{ color: "#94a3b8", fontSize: 12, marginRight: "auto" }}>أداة: <b style={{ color: "#fff" }}>{tools.find(t => t.id === tool)?.label}</b></span>
          <button onClick={onClose} style={{ background: "#334155", border: "none", color: "#94a3b8", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>✕ إغلاق</button>
        </div>
        {/* Canvas */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: 20, background: "#1e293b" }}>
          <div style={{ position: "relative" }}>
            <canvas ref={canvasRef} width={700} height={500} style={{ display: "block", borderRadius: 8, boxShadow: "0 4px 30px rgba(0,0,0,0.5)", cursor: tool === "eraser" ? "cell" : "crosshair" }}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={() => { if (drawing) { setDrawing(false); overlayRef.current!.getContext("2d")!.clearRect(0, 0, 700, 500); } }} />
            <canvas ref={overlayRef} width={700} height={500} style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 8 }} />
          </div>
        </div>
      </div>

      {/* Right panel — save */}
      <div style={{ width: 220, background: "#0f172a", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>حفظ الشكل</div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>اسم الشكل</label>
          <input style={{ ...inp, background: "#1e293b", color: "#fff", border: "1px solid #334155" }} value={shapeName} onChange={e => setShapeName(e.target.value)} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>التصنيف</label>
          <select style={{ ...inp, background: "#1e293b", color: "#fff", border: "1px solid #334155", cursor: "pointer" }} value={category} onChange={e => setCategory(e.target.value)}>
            {["نوافذ", "أبواب", "واجهات", "فواصل"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>سيتم إضافة الشكل المرسوم إلى الكتالوج كتصميم مخصص يمكنك استخدامه في المشروع.</div>
        <button onClick={handleSave} style={{ marginTop: "auto", width: "100%", padding: "10px", background: "#1e4db7", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>💾 حفظ في الكتالوج</button>
      </div>
    </div>
  );
}

// ─── Overlay & Sub-modals ─────────────────────────────────────────────────────
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      {children}
    </div>
  );
}

type DupModalProps = { design: Design; nextCode: string; onSave: (c: string, l: string, f: string) => void; onClose: () => void };
function DupModal({ design, nextCode, onSave, onClose }: DupModalProps) {
  const [dc, setDc] = useState(nextCode);
  const [dl, setDl] = useState(design.location);
  const [df, setDf] = useState(design.floor);
  const inp = inputStyle();
  const tmpl = CATALOG.find(c => c.id === design.templateId);
  return (
    <Overlay>
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 480, direction: "rtl", marginTop: 60 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Duplicate</div>
        {([["Design code", dc, setDc], ["Location", dl, setDl], ["Floor no", df, setDf]] as [string, string, (v: string) => void][]).map(([l, v, set]) => (
          <div key={l} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>{l} *</label>
            <input style={inp} value={v} onChange={e => set(e.target.value)} />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>Design name</div>
          <div style={{ fontSize: 14, fontWeight: 600, padding: "8px 0" }}>{tmpl?.name || design.customShapeId}</div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#475569" }}>Cancel</button>
          <button onClick={() => onSave(dc, dl, df)} style={{ padding: "9px 18px", background: "#1e4db7", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff" }}>Save</button>
        </div>
      </div>
    </Overlay>
  );
}

type GlassModalProps = { designs: Design[]; selectedIds: number[]; onSave: (id: string) => void; onClose: () => void };
function GlassModal({ designs, selectedIds, onSave, onClose }: GlassModalProps) {
  const [newGlass, setNewGlass] = useState("");
  const inp = inputStyle();
  return (
    <Overlay>
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 440, direction: "rtl", marginTop: 60 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>تغيير الزجاج</div>
        <div style={{ fontSize: 12, color: "#1e4db7", background: "#eff6ff", padding: "8px 12px", borderRadius: 7, marginBottom: 16, border: "1px solid #bfdbfe" }}>
          محدد {selectedIds.length} تصاميم
        </div>
        {designs.filter(d => selectedIds.includes(d.id)).map(d => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
            <span>✓</span><span style={{ fontWeight: 600, color: "#1e4db7" }}>{d.code}</span>
            <span style={{ color: "#64748b" }}>{GLASS_OPTIONS.find(g => g.id === d.glass)?.name}</span>
          </div>
        ))}
        <div style={{ marginTop: 14 }}>
          <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>نوع الزجاج الجديد *</label>
          <select style={{ ...inp, cursor: "pointer" }} value={newGlass} onChange={e => setNewGlass(e.target.value)}>
            <option value="">-- اختر --</option>
            {GLASS_OPTIONS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "9px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>إلغاء</button>
            <button onClick={() => newGlass && onSave(newGlass)} style={{ flex: 1, padding: "9px", background: "#1e4db7", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", opacity: newGlass ? 1 : 0.5 }}>حفظ</button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DesignConfigurator() {
  const [tab, setTab] = useState<"project" | "catalog">("project");
  const [catFilter, setCatFilter] = useState("الكل");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"edit" | "view" | null>(null);
  const [editDesign, setEditDesign] = useState<Design | null>(null);
  const [customShapes, setCustomShapes] = useState<CustomShape[]>([]);
  const [showDrawing, setShowDrawing] = useState(false);
  const [designs, setDesigns] = useState<Design[]>([
    { id: 1, code: "w1", templateId: "SL2P", width: 1500, height: 1500, glass: "g5c", location: "Hall", floor: "1", qty: 1 },
    { id: 2, code: "w2", templateId: "FR2P", width: 1500, height: 1500, glass: "g5c", location: "Bedroom", floor: "1", qty: 1 },
    { id: 3, code: "w3", templateId: "DR1P", width: 900, height: 2100, glass: "g8c", location: "Hall", floor: "1", qty: 1 },
  ]);
  const [dupModal, setDupModal] = useState<Design | null>(null);
  const [glassModal, setGlassModal] = useState(false);
  const [selectedForGlass, setSelectedForGlass] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTemplate = (id: string) => CATALOG.find(c => c.id === id);
  const getCustomShape = (id?: string) => customShapes.find(s => s.id === id);
  const nextId = () => Math.max(0, ...designs.map(d => d.id)) + 1;
  const nextCode = () => `w${designs.length + 1}`;
  const totalQty = designs.reduce((s, d) => s + d.qty, 0);
  const totalValue = designs.reduce((s, d) => s + calcPrice(d, customShapes), 0);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        const shape: CustomShape = {
          id: `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: file.name.replace(/\.[^.]+$/, ""),
          category: "مخصص",
          dataUrl,
          defaultW: 1200,
          defaultH: 1500,
          isCustom: true,
        };
        setCustomShapes(s => [...s, shape]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function handleDrawSave(dataUrl: string, name: string) {
    // Detect category from name
    const cat = name.includes("باب") || name.toLowerCase().includes("door") ? "أبواب" : "نوافذ";
    const shape: CustomShape = { id: `drawn_${Date.now()}`, name, category: cat, dataUrl, defaultW: 1200, defaultH: 1500, isCustom: true };
    setCustomShapes(s => [...s, shape]);
    setShowDrawing(false);
    setTab("catalog");
  }

  function addCustomShapeToProject(shape: CustomShape) {
    const newD: Design = { id: nextId(), code: nextCode(), templateId: "", width: shape.defaultW, height: shape.defaultH, glass: "g5c", location: "Hall", floor: "1", qty: 1, customShapeId: shape.id };
    setEditDesign(newD); setModal("edit");
  }

  function addFromCatalog(tmpl: Template) {
    const newD: Design = { id: nextId(), code: nextCode(), templateId: tmpl.id, width: tmpl.defaultW, height: tmpl.defaultH, glass: tmpl.glassThick === 5 ? "g5c" : tmpl.glassThick === 6 ? "g6c" : "g8c", location: "Hall", floor: "1", qty: 1 };
    setEditDesign(newD); setModal("edit");
  }

  function saveDesign(d: Design) {
    setDesigns(ds => ds.find(x => x.id === d.id) ? ds.map(x => x.id === d.id ? d : x) : [...ds, d]);
    setModal(null); setEditDesign(null);
  }

  function deleteDesign(id: number) {
    if (window.confirm("حذف التصميم؟")) setDesigns(ds => ds.filter(d => d.id !== id));
  }

  function deleteCustomShape(id: string) {
    if (window.confirm("حذف الشكل المخصص؟")) setCustomShapes(s => s.filter(x => x.id !== id));
  }

  const allCategories = ["الكل", "نوافذ", "أبواب", "واجهات", "فواصل", ...(customShapes.length ? ["مخصص"] : [])];
  const filteredCatalog = CATALOG.filter(c => (catFilter === "الكل" || c.category === catFilter) && (!search || c.name.toLowerCase().includes(search.toLowerCase())));
  const filteredCustom = customShapes.filter(s => (catFilter === "الكل" || catFilter === "مخصص" || s.category === catFilter) && (!search || s.name.toLowerCase().includes(search.toLowerCase())));

  const inp = inputStyle();
  const selS = { ...inp, cursor: "pointer" };

  const DesignCard = ({ d }: { d: Design }) => {
    const tmpl = getTemplate(d.templateId);
    const shape = getCustomShape(d.customShapeId);
    const glassObj = GLASS_OPTIONS.find(g => g.id === d.glass);
    const price = calcPrice(d, customShapes);
    const isSel = selectedForGlass.includes(d.id);
    return (
      <div style={{ background: "#fff", border: `1.5px solid ${isSel ? "#1e4db7" : "#e2e8f0"}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9" }}>
          <input type="checkbox" checked={isSel} onChange={e => setSelectedForGlass(sel => e.target.checked ? [...sel, d.id] : sel.filter(x => x !== d.id))} style={{ width: 15, height: 15, accentColor: "#1e4db7", cursor: "pointer" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e4db7" }}>{d.code}</span>
          {d.customShapeId && <span style={{ fontSize: 10, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 4, padding: "1px 5px" }}>مخصص</span>}
          <span style={{ marginRight: "auto" }} />
          <button onClick={() => { setEditDesign({ ...d }); setModal("edit"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#64748b" }}>✏️</button>
          <button onClick={() => setDupModal(d)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#64748b" }}>⧉</button>
          <button onClick={() => deleteDesign(d.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#ef4444" }}>✕</button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: 12, background: "#f8fafc", minHeight: 200 }}>
          <WindowSVG design={{ template: tmpl, width: d.width, height: d.height, glass: d.glass, code: d.code, customShape: shape }} scale={Math.min(160 / d.width, 160 / d.height)} showDims />
        </div>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{shape ? shape.name : tmpl?.name}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>الموقع: <b>{d.location}</b> &nbsp; الكمية: <b>{d.qty}</b></div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{shape ? "Custom Shape" : tmpl?.series}</div>
          <div style={{ fontSize: 11, marginBottom: 6 }}>Glass: {glassObj?.name.split(" ").slice(0, 3).join(" ")}</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e4db7" }}>{price.toFixed(3)} د.ك</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={() => { setEditDesign({ ...d }); setModal("view"); }} style={{ flex: 1, padding: "6px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", fontSize: 11, color: "#475569" }}>👁 View</button>
            <button onClick={() => { setEditDesign({ ...d }); setModal("edit"); }} style={{ flex: 1, padding: "6px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, cursor: "pointer", fontSize: 11, color: "#1e4db7", fontWeight: 600 }}>✏️ Edit</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", direction: "rtl", background: "#f0f4f8", minHeight: "100vh", color: "#1e293b" }}>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,.svg" multiple style={{ display: "none" }} onChange={handleUpload} />

      {/* Top Nav */}
      <div style={{ background: "#1e4db7", color: "#fff", padding: "0 20px", display: "flex", alignItems: "center", height: 56 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Lavish Villa</div>
          <div style={{ fontSize: 10, color: "#93c5fd" }}>EVA-QT-00001</div>
        </div>
        <div style={{ display: "flex", marginRight: "auto", marginLeft: 24 }}>
          {["Documents", "Design", "Pricing", "Reports"].map(t => (
            <button key={t} style={{ background: t === "Design" ? "rgba(255,255,255,0.2)" : "none", border: "none", color: t === "Design" ? "#fff" : "#93c5fd", padding: "18px 16px", cursor: "pointer", fontSize: 13, fontWeight: t === "Design" ? 700 : 400, borderBottom: t === "Design" ? "2px solid #fff" : "2px solid transparent" }}>{t}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 12px" }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{totalValue.toFixed(3)} د.ك</span>
          <span style={{ fontSize: 10, color: "#93c5fd" }}>Qty: {totalQty}</span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 20px", display: "flex", alignItems: "center" }}>
        {(["project", "catalog"] as const).map(id => (
          <button key={id} onClick={() => setTab(id)} style={{ background: "none", border: "none", borderBottom: tab === id ? "2px solid #1e4db7" : "2px solid transparent", color: tab === id ? "#1e4db7" : "#64748b", padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: tab === id ? 700 : 400 }}>
            {id === "project" ? "Project" : "Catalog"}
          </button>
        ))}
        <div style={{ marginRight: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {tab === "project" && selectedForGlass.length > 0 && (
            <button onClick={() => setGlassModal(true)} style={{ background: "#eff6ff", color: "#1e4db7", border: "1.5px solid #bfdbfe", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>تغيير الزجاج ({selectedForGlass.length})</button>
          )}
          {/* Upload shapes button */}
          <button onClick={() => fileInputRef.current?.click()} style={{ background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            📤 رفع شكل
          </button>
          {/* Draw button */}
          <button onClick={() => setShowDrawing(true)} style={{ background: "#fefce8", color: "#d97706", border: "1.5px solid #fde68a", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            🎨 رسم شكل
          </button>
          <button onClick={() => { setEditDesign({ id: nextId(), code: nextCode(), templateId: "SL2P", width: 1500, height: 1500, glass: "g5c", location: "Hall", floor: "1", qty: 1 }); setModal("edit"); }} style={{ background: "#1e4db7", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ Add opening</button>
          <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
            {(["grid", "list"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ background: viewMode === m ? "#f1f5f9" : "#fff", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: 14, color: viewMode === m ? "#1e4db7" : "#94a3b8" }}>{m === "grid" ? "⊞" : "☰"}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* PROJECT TAB */}
        {tab === "project" && viewMode === "grid" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {designs.map(d => <DesignCard key={d.id} d={d} />)}
          </div>
        )}

        {tab === "project" && viewMode === "list" && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "40px 80px 1.5fr 1fr 1fr 1fr 80px 120px 100px", padding: "10px 16px", background: "#f8fafc", fontSize: 11, fontWeight: 700, color: "#64748b", gap: 8 }}>
              <span></span><span>كود</span><span>التصميم</span><span>الموقع</span><span>الأبعاد</span><span>الزجاج</span><span>الكمية</span><span>السعر</span><span>إجراءات</span>
            </div>
            {designs.map((d, idx) => {
              const tmpl = getTemplate(d.templateId);
              const shape = getCustomShape(d.customShapeId);
              const glassObj = GLASS_OPTIONS.find(g => g.id === d.glass);
              const price = calcPrice(d, customShapes);
              return (
                <div key={d.id} style={{ display: "grid", gridTemplateColumns: "40px 80px 1.5fr 1fr 1fr 1fr 80px 120px 100px", padding: "10px 16px", gap: 8, alignItems: "center", borderTop: "1px solid #f1f5f9", background: idx % 2 ? "#fafbfc" : "#fff" }}>
                  <input type="checkbox" checked={selectedForGlass.includes(d.id)} onChange={e => setSelectedForGlass(sel => e.target.checked ? [...sel, d.id] : sel.filter(x => x !== d.id))} style={{ accentColor: "#1e4db7" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e4db7" }}>{d.code}</span>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{shape ? shape.name : tmpl?.name}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{shape ? "Custom" : tmpl?.series}</div></div>
                  <span style={{ fontSize: 12 }}>{d.location}</span>
                  <span style={{ fontSize: 12 }}>{d.width}×{d.height}mm</span>
                  <span style={{ fontSize: 11 }}>{glassObj?.name.split(" ").slice(0, 2).join(" ")}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{d.qty}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e4db7" }}>{price.toFixed(3)} د.ك</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { setEditDesign({ ...d }); setModal("edit"); }} style={{ padding: "4px 8px", background: "#eff6ff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 11, color: "#1e4db7" }}>Edit</button>
                    <button onClick={() => deleteDesign(d.id)} style={{ padding: "4px 8px", background: "#fef2f2", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 11, color: "#ef4444" }}>Del</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CATALOG TAB */}
        {tab === "catalog" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, maxWidth: 260, direction: "ltr" }} />
              {allCategories.map(c => (
                <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${catFilter === c ? "#1e4db7" : "#e2e8f0"}`, background: catFilter === c ? "#eff6ff" : "#fff", color: catFilter === c ? "#1e4db7" : "#64748b", fontSize: 12, cursor: "pointer", fontWeight: catFilter === c ? 700 : 400 }}>{c}</button>
              ))}
              <button onClick={() => fileInputRef.current?.click()} style={{ marginRight: "auto", background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>📤 رفع أشكال</button>
              <button onClick={() => setShowDrawing(true)} style={{ background: "#fefce8", color: "#d97706", border: "1.5px solid #fde68a", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🎨 ارسم شكل</button>
            </div>

            {/* Custom shapes section */}
            {filteredCustom.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>الأشكال المخصصة</span>
                  <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "1px 8px", fontSize: 11 }}>{filteredCustom.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {filteredCustom.map(shape => (
                    <div key={shape.id} style={{ background: "#fff", border: "1.5px solid #bbf7d0", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ position: "relative", display: "flex", justifyContent: "center", padding: 12, background: "#f0fdf4", height: 140 }}>
                        <img src={shape.dataUrl} alt={shape.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        <button onClick={() => deleteCustomShape(shape.id)} style={{ position: "absolute", top: 6, left: 6, background: "#fef2f2", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer", width: 24, height: 24, fontSize: 12 }}>✕</button>
                      </div>
                      <div style={{ padding: "8px 10px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{shape.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{shape.category}</div>
                        <button onClick={() => addCustomShapeToProject(shape)} style={{ width: "100%", padding: "7px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>+ إضافة للمشروع</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard catalog */}
            {(catFilter === "الكل" || catFilter !== "مخصص") && filteredCatalog.length > 0 && (
              <>
                {customShapes.length > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 12 }}>التصاميم القياسية</div>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                  {filteredCatalog.map(tmpl => (
                    <div key={tmpl.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ display: "flex", justifyContent: "center", padding: 12, background: "#f8fafc" }}>
                        <WindowSVG design={{ template: tmpl, width: tmpl.defaultW, height: tmpl.defaultH, glass: "g5c" }} scale={Math.min(150 / tmpl.defaultW, 140 / tmpl.defaultH)} showDims />
                      </div>
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{tmpl.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{tmpl.series}</div>
                        <button onClick={() => addFromCatalog(tmpl)} style={{ width: "100%", padding: "8px", background: "#1e4db7", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Select design</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Empty state */}
            {filteredCatalog.length === 0 && filteredCustom.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🪟</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>لا توجد تصاميم</div>
                <div style={{ fontSize: 12 }}>ارفع شكل أو ارسم شكلاً جديداً</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT / VIEW MODAL */}
      {(modal === "edit" || modal === "view") && editDesign && (() => {
        const tmpl = getTemplate(editDesign.templateId);
        const shape = getCustomShape(editDesign.customShapeId);
        const glassObj = GLASS_OPTIONS.find(g => g.id === editDesign.glass);
        const price = calcPrice(editDesign, customShapes);
        const area = (editDesign.width * editDesign.height) / 1e6;
        const isView = modal === "view";
        return (
          <Overlay>
            <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 900, marginTop: 8, direction: "rtl", overflow: "hidden" }}>
              <div style={{ background: "#f8fafc", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ width: 32, height: 32, background: "#eff6ff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🪟</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Win ref: {editDesign.code} &nbsp; Qty: {editDesign.qty}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Location: {editDesign.location}</div>
                </div>
                <div style={{ marginRight: "auto", display: "flex", gap: 6 }}>
                  <button onClick={() => setModal(null)} style={{ background: "#fef2f2", border: "none", borderRadius: 7, color: "#ef4444", padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕</button>
                  {!isView && <button onClick={() => saveDesign(editDesign)} style={{ background: "#1e4db7", border: "none", borderRadius: 7, color: "#fff", padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>💾 حفظ</button>}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isView ? "1fr" : "300px 1fr" }}>
                {!isView && (
                  <div style={{ borderLeft: "1px solid #e2e8f0", padding: 14, overflowY: "auto", maxHeight: "70vh", background: "#fafbfc" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10 }}>اختر التصميم</div>
                    {customShapes.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>مخصص</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                          {customShapes.map(s => (
                            <div key={s.id} onClick={() => setEditDesign(d => d ? { ...d, templateId: "", customShapeId: s.id, width: s.defaultW, height: s.defaultH } : d)} style={{ border: `1.5px solid ${editDesign.customShapeId === s.id ? "#16a34a" : "#e2e8f0"}`, borderRadius: 7, padding: "6px 4px", cursor: "pointer", background: editDesign.customShapeId === s.id ? "#f0fdf4" : "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                              <img src={s.dataUrl} alt={s.name} style={{ width: 48, height: 44, objectFit: "contain" }} />
                              <span style={{ fontSize: 9, color: "#64748b", textAlign: "center", lineHeight: 1.2 }}>{s.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {["نوافذ", "أبواب", "واجهات", "فواصل"].map(cat => (
                      <div key={cat} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>{cat}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                          {CATALOG.filter(c => c.category === cat).map(t => (
                            <div key={t.id} onClick={() => setEditDesign(d => d ? { ...d, templateId: t.id, customShapeId: undefined, width: t.defaultW, height: t.defaultH } : d)} style={{ border: `1.5px solid ${!editDesign.customShapeId && editDesign.templateId === t.id ? "#1e4db7" : "#e2e8f0"}`, borderRadius: 7, padding: "6px 4px", cursor: "pointer", background: !editDesign.customShapeId && editDesign.templateId === t.id ? "#eff6ff" : "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                              <WindowSVG design={{ template: t, width: t.defaultW, height: t.defaultH, glass: "g5c" }} scale={Math.min(56 / t.defaultW, 52 / t.defaultH)} showDims={false} />
                              <span style={{ fontSize: 9, color: "#64748b", textAlign: "center", lineHeight: 1.2 }}>{t.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "center", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", padding: 20, marginBottom: 16, minHeight: 280 }}>
                    <WindowSVG design={{ template: tmpl, width: editDesign.width, height: editDesign.height, glass: editDesign.glass, code: editDesign.code, customShape: shape }} scale={Math.min(240 / editDesign.width, 220 / editDesign.height)} showDims />
                  </div>
                  {!isView ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {(["width", "height"] as const).map(k => (
                        <div key={k}>
                          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>{k === "width" ? "Width (mm)" : "Height (mm)"}</label>
                          <input style={inp} type="number" min="300" max="6000" step="50" value={editDesign[k]} onChange={e => setEditDesign(d => d ? { ...d, [k]: Number(e.target.value) } : d)} />
                        </div>
                      ))}
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>Glass</label>
                        <select style={selS} value={editDesign.glass} onChange={e => setEditDesign(d => d ? { ...d, glass: e.target.value } : d)}>
                          {GLASS_OPTIONS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>Location</label>
                        <select style={selS} value={editDesign.location} onChange={e => setEditDesign(d => d ? { ...d, location: e.target.value } : d)}>
                          {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>Floor no.</label>
                        <input style={inp} value={editDesign.floor} onChange={e => setEditDesign(d => d ? { ...d, floor: e.target.value } : d)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>Qty</label>
                        <input style={inp} type="number" min="1" value={editDesign.qty} onChange={e => setEditDesign(d => d ? { ...d, qty: Number(e.target.value) } : d)} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {([["التصميم", shape ? shape.name : tmpl?.name], ["السيريز", shape ? "Custom" : tmpl?.series], ["العرض", `${editDesign.width}mm`], ["الارتفاع", `${editDesign.height}mm`], ["الزجاج", glassObj?.name], ["الموقع", editDesign.location], ["الطابق", editDesign.floor], ["الكمية", String(editDesign.qty)]] as [string, string | undefined][]).map(([l, v]) => (
                        <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{l}</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#1e40af" }}>مساحة: {area.toFixed(2)} م² × {editDesign.qty}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#1e4db7" }}>{price.toFixed(3)} د.ك</span>
                  </div>
                </div>
              </div>
            </div>
          </Overlay>
        );
      })()}

      {dupModal && (
        <DupModal design={dupModal} nextCode={nextCode()} onSave={(c, l, f) => { const dup: Design = { ...dupModal, id: nextId(), code: c || nextCode(), location: l || dupModal.location, floor: f || dupModal.floor }; setDesigns(ds => [...ds, dup]); setDupModal(null); }} onClose={() => setDupModal(null)} />
      )}
      {glassModal && (
        <GlassModal designs={designs} selectedIds={selectedForGlass} onSave={id => { setDesigns(ds => ds.map(d => selectedForGlass.includes(d.id) ? { ...d, glass: id } : d)); setGlassModal(false); setSelectedForGlass([]); }} onClose={() => { setGlassModal(false); setSelectedForGlass([]); }} />
      )}
      {showDrawing && <DrawingCanvas onSave={handleDrawSave} onClose={() => setShowDrawing(false)} />}
    </div>
  );
}
