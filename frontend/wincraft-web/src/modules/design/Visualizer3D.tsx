import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window { THREE: any }
}

// ─── Design Catalog ────────────────────────────────────────────────────────────
const DESIGNS = [
  { id: "SL2P", name: "Sliding 2T 2P", category: "نوافذ", series: "NCL VEKA I-60 SLIDING",
    panels: [{ x: -0.5, w: 0.98, type: "sliding" }, { x: 0.5, w: 0.98, type: "sliding" }],
    defaultW: 1500, defaultH: 1500, defaultD: 80 },
  { id: "FR2P", name: "French Window", category: "نوافذ", series: "NCL VEKA I-60 CASEMENT",
    panels: [{ x: -0.5, w: 0.96, type: "casement_left" }, { x: 0.5, w: 0.96, type: "casement_right" }],
    defaultW: 1500, defaultH: 1500, defaultD: 80 },
  { id: "FX1P", name: "Fixed Window", category: "نوافذ", series: "NCL VEKA I-60",
    panels: [{ x: 0, w: 1.96, type: "fixed" }],
    defaultW: 1200, defaultH: 1000, defaultD: 70 },
  { id: "DR1P", name: "Single Door", category: "أبواب", series: "NCL VEKA DOOR",
    panels: [{ x: 0, w: 0.96, type: "door" }],
    defaultW: 900, defaultH: 2100, defaultD: 100 },
  { id: "DR2P", name: "Double Door", category: "أبواب", series: "NCL VEKA DOOR",
    panels: [{ x: -0.5, w: 0.96, type: "door_left" }, { x: 0.5, w: 0.96, type: "door_right" }],
    defaultW: 1800, defaultH: 2100, defaultD: 100 },
  { id: "CW1", name: "Curtain Wall", category: "واجهات", series: "NCL VEKA CURTAIN WALL",
    panels: [{ x: -0.5, w: 0.96, type: "fixed" }, { x: 0.5, w: 0.96, type: "fixed" }],
    defaultW: 1500, defaultH: 3000, defaultD: 120 },
  { id: "PRT", name: "Office Partition", category: "فواصل", series: "GLASS PARTITION",
    panels: [{ x: 0, w: 1.96, type: "fixed" }],
    defaultW: 1200, defaultH: 2400, defaultD: 60 },
];

const GLASS_PRESETS = [
  { id: "clear5",  name: "5MM Clear",       color: 0x90caf9, opacity: 0.25, roughness: 0.05, metalness: 0.1 },
  { id: "clear6t", name: "6MM Toughened",   color: 0x64b5f6, opacity: 0.3,  roughness: 0.03, metalness: 0.15 },
  { id: "ref10",   name: "10MM Reflective", color: 0x1565c0, opacity: 0.45, roughness: 0.01, metalness: 0.8 },
  { id: "frost8",  name: "8MM Frosted",     color: 0xe3f2fd, opacity: 0.65, roughness: 0.9,  metalness: 0.0 },
  { id: "tint8",   name: "8MM Bronze Tint", color: 0x8d6e63, opacity: 0.4,  roughness: 0.05, metalness: 0.3 },
  { id: "green6",  name: "6MM Green Tint",  color: 0x66bb6a, opacity: 0.35, roughness: 0.05, metalness: 0.2 },
];

const FRAME_COLORS = [
  { id: "white",     name: "أبيض",     hex: "#FFFFFF", val: 0xffffff },
  { id: "silver",    name: "فضي",      hex: "#C0C0C0", val: 0xc0c0c0 },
  { id: "bronze",    name: "برونزي",   hex: "#8B6914", val: 0x8b6914 },
  { id: "black",     name: "أسود",     hex: "#2C2C2C", val: 0x2c2c2c },
  { id: "wood",      name: "خشبي",     hex: "#795548", val: 0x795548 },
  { id: "champagne", name: "شامبانيا", hex: "#C8A96E", val: 0xc8a96e },
];

const WALL_COLORS = [
  { id: "cream", name: "كريمي", val: 0xf5f0e8 },
  { id: "gray",  name: "رمادي", val: 0xe0e0e0 },
  { id: "beige", name: "بيج",   val: 0xd7c8a0 },
  { id: "white", name: "أبيض",  val: 0xfafafa },
];

type DesignType = typeof DESIGNS[number];
type PanelDef = typeof DESIGNS[number]["panels"][number];

// ─── 3D Engine ────────────────────────────────────────────────────────────────
interface ThreeViewerProps {
  design: DesignType;
  width: number;
  height: number;
  glassPreset: string;
  frameColor: number;
  wallColor: number;
  showWall: boolean;
  showDims: boolean;
  lighting: string;
  openAngle: number;
}

function ThreeViewer({ design, width, height, glassPreset, frameColor, wallColor, showWall, showDims, lighting, openAngle }: ThreeViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.3, y: -0.4 });
  const zoom = useRef(2.8);

  const buildScene = useCallback(() => {
    const THREE = window.THREE;
    if (!THREE || !mountRef.current) return;

    const W = mountRef.current.clientWidth || 640;
    const H = mountRef.current.clientHeight || 480;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
    camera.position.set(0, 0, zoom.current);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff8dc, 1.8);
    sun.position.set(3, 5, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.1; sun.shadow.camera.far = 20;
    sun.shadow.camera.left = -3; sun.shadow.camera.right = 3;
    sun.shadow.camera.top = 3; sun.shadow.camera.bottom = -3;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xe8f4fd, 0.6);
    fill.position.set(-2, 2, -1);
    scene.add(fill);

    scene.add(new THREE.PointLight(0xfff3e0, 0.4, 10).position.set(0, -2, 2));

    if (lighting === "studio") {
      const top = new THREE.DirectionalLight(0xffffff, 0.8);
      top.position.set(0, 6, 0);
      scene.add(top);
    }
    if (lighting === "sunset") {
      sun.color.set(0xff6b35); sun.intensity = 2.2;
      fill.color.set(0xffd1b0);
      scene.add(new THREE.HemisphereLight(0xff8c42, 0x3d2b1f, 0.5));
    }
    if (lighting === "night") {
      ambient.intensity = 0.1; sun.intensity = 0;
      const l1 = new THREE.PointLight(0xffe0a0, 1.5, 4); l1.position.set(1.5, 1, 1.5); scene.add(l1);
      const l2 = new THREE.PointLight(0xa0c8ff, 0.8, 4); l2.position.set(-1.5, 0.5, 1); scene.add(l2);
    }

    const scW = width / 1000, scH = height / 1000, scD = (design.defaultD || 80) / 1000;
    const ft = 0.05;

    const group = new THREE.Group();
    scene.add(group);

    const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.3, metalness: 0.6 });
    const gPreset = GLASS_PRESETS.find(g => g.id === glassPreset) || GLASS_PRESETS[0];
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: gPreset.color, transparent: true, opacity: gPreset.opacity,
      roughness: gPreset.roughness, metalness: gPreset.metalness,
      transmission: gPreset.id === "frost8" ? 0.4 : 0.85,
      thickness: 0.006, ior: 1.52, side: THREE.DoubleSide,
    });

    // Outer frame
    [
      [0, scH / 2 - ft / 2, 0, scW, ft, scD],
      [0, -scH / 2 + ft / 2, 0, scW, ft, scD],
      [-scW / 2 + ft / 2, 0, 0, ft, scH, scD],
      [scW / 2 - ft / 2, 0, 0, ft, scH, scD],
    ].forEach(([x, y, z, w, h, d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
      m.position.set(x, y, z); m.castShadow = true; group.add(m);
    });

    const innerW = scW - ft * 2, innerH = scH - ft * 2, pFt = 0.035;
    const totalPanelW = design.panels.reduce((s: number, p: PanelDef) => s + p.w, 0);

    design.panels.forEach((panel: PanelDef, pi: number) => {
      const panelGroup = new THREE.Group();
      group.add(panelGroup);
      const pW = (panel.w / totalPanelW) * innerW;
      const pX = panel.x * (innerW / design.panels.length) * (design.panels.length > 1 ? 1 : 0);
      panelGroup.position.x = pX;

      // Sash
      [
        [0, innerH / 2 - pFt / 2, 0, pW, pFt, scD * 0.9],
        [0, -innerH / 2 + pFt / 2, 0, pW, pFt, scD * 0.9],
        [-pW / 2 + pFt / 2, 0, 0, pFt, innerH, scD * 0.9],
        [pW / 2 - pFt / 2, 0, 0, pFt, innerH, scD * 0.9],
      ].forEach(([x, y, z, w, h, d]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
        m.position.set(x, y, z); m.castShadow = true; panelGroup.add(m);
      });

      // Glass
      const gm = new THREE.Mesh(new THREE.BoxGeometry(pW - pFt * 2, innerH - pFt * 2, 0.006), glassMat);
      gm.position.z = scD * 0.1; panelGroup.add(gm);

      // Handle
      if (panel.type !== "fixed") {
        const hMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.1, metalness: 0.95 });
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 16), hMat);
        const hDir = panel.type === "casement_left" ? 0.25 : -0.25;
        handle.position.set(hDir * pW, 0, scD * 0.5 + 0.01);
        handle.rotation.z = Math.PI / 2;
        group.add(handle);
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.015), hMat);
        base.position.set(hDir * pW, 0, scD * 0.5 + 0.005);
        group.add(base);
      }

      // Open animation
      if ((panel.type === "casement_left" || panel.type === "casement_right" || panel.type === "door_left" || panel.type === "door_right") && openAngle > 0) {
        const pivotX = (panel.type === "casement_left" || panel.type === "door_left") ? -pW / 2 : pW / 2;
        panelGroup.position.x += -pivotX;
        const dir = (panel.type === "casement_left" || panel.type === "door_left") ? 1 : -1;
        panelGroup.rotation.y = dir * (openAngle / 100) * (Math.PI / 2.5);
        panelGroup.position.x += pivotX;
      }
      if (panel.type === "sliding" && openAngle > 0) {
        panelGroup.position.x += (pi === 0 ? -1 : 1) * (openAngle / 100) * pW * 0.45;
      }

      void pi; // suppress unused warning
    });

    // Mullion
    if (design.panels.length > 1) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(ft * 0.8, scH - ft * 2, scD), frameMat);
      m.castShadow = true; group.add(m);
    }

    // Wall
    if (showWall) {
      const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85, metalness: 0.0 });
      const wt = 0.3, we = 0.6;
      [
        [0, scH / 2 + we / 2, -wt / 2, scW + we * 2, we, wt],
        [0, -scH / 2 - we / 2, -wt / 2, scW + we * 2, we, wt],
        [-scW / 2 - we / 2, 0, -wt / 2, we, scH, wt],
        [scW / 2 + we / 2, 0, -wt / 2, we, scH, wt],
      ].forEach(([x, y, z, w, h, d]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
        m.position.set(x, y, z); m.receiveShadow = true; scene.add(m);
      });
      const sillMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.4, metalness: 0.2 });
      const sill = new THREE.Mesh(new THREE.BoxGeometry(scW + we * 0.8, 0.04, scD + 0.08), sillMat);
      sill.position.set(0, -scH / 2 - 0.02, scD * 0.1); sill.castShadow = true; scene.add(sill);
    }

    // Shadow plane
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.2 }));
    sp.rotation.x = -Math.PI / 2; sp.position.y = -scH / 2 - 0.1; sp.receiveShadow = true; scene.add(sp);

    // Dimension lines
    if (showDims) {
      const lm = new THREE.LineBasicMaterial({ color: 0x1e4db7 });
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-scW / 2, -scH / 2 - 0.15, scD), new THREE.Vector3(scW / 2, -scH / 2 - 0.15, scD)]), lm));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-scW / 2 - 0.15, -scH / 2, scD), new THREE.Vector3(-scW / 2 - 0.15, scH / 2, scD)]), lm));
    }

    let animFrame: number;
    const animate = () => {
      animFrame = requestAnimationFrame(animate);
      group.rotation.x = rotation.current.x;
      group.rotation.y = rotation.current.y;
      // Rotate wall/sill children together
      scene.children.forEach((c: any) => {
        if (c !== group && c.isMesh) {
          c.rotation.x = rotation.current.x;
          c.rotation.y = rotation.current.y;
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    const el = renderer.domElement;
    const onDown = (e: MouseEvent | TouchEvent) => {
      isDragging.current = true;
      const src = (e as TouchEvent).touches?.[0] || (e as MouseEvent);
      lastMouse.current = { x: src.clientX, y: src.clientY };
    };
    const onUp = () => { isDragging.current = false; };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const src = (e as TouchEvent).touches?.[0] || (e as MouseEvent);
      rotation.current.y += (src.clientX - lastMouse.current.x) * 0.008;
      rotation.current.x += (src.clientY - lastMouse.current.y) * 0.008;
      rotation.current.x = Math.max(-1.2, Math.min(1.2, rotation.current.x));
      lastMouse.current = { x: src.clientX, y: src.clientY };
    };
    const onWheel = (e: WheelEvent) => {
      zoom.current = Math.max(1.2, Math.min(6, zoom.current + e.deltaY * 0.005));
      camera.position.z = zoom.current;
    };
    el.addEventListener("mousedown", onDown as EventListener);
    el.addEventListener("touchstart", onDown as EventListener);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("mousemove", onMove as EventListener);
    window.addEventListener("touchmove", onMove as EventListener);
    el.addEventListener("wheel", onWheel);

    return () => {
      cancelAnimationFrame(animFrame);
      el.removeEventListener("mousedown", onDown as EventListener);
      el.removeEventListener("touchstart", onDown as EventListener);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("mousemove", onMove as EventListener);
      window.removeEventListener("touchmove", onMove as EventListener);
      el.removeEventListener("wheel", onWheel);
      renderer.dispose();
    };
  }, [design, width, height, glassPreset, frameColor, wallColor, showWall, showDims, lighting, openAngle]);

  useEffect(() => {
    if (!window.THREE) return;
    return buildScene();
  }, [buildScene]);

  return (
    <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab", background: "transparent", position: "relative" }}>
      <div style={{ position: "absolute", top: 8, right: 8, fontSize: 11, color: "#94a3b8", background: "rgba(0,0,0,0.35)", padding: "4px 8px", borderRadius: 6, pointerEvents: "none" }}>
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}

// ─── 2D Section Drawing ───────────────────────────────────────────────────────
interface SectionProps { design: DesignType; width: number; height: number; glassPreset: string }
function SectionDrawing({ design, width, height, glassPreset }: SectionProps) {
  const gPreset = GLASS_PRESETS.find(g => g.id === glassPreset) || GLASS_PRESETS[0];
  const sc = Math.min(380 / width, 280 / height);
  const W = width * sc, H = height * sc;
  const PAD = 50, ft = 14, wp = 28;
  const svgW = W + PAD * 2 + 80, svgH = H + PAD * 2;
  const glassHex = `#${gPreset.color.toString(16).padStart(6, "0")}`;

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ background: "#f8fafc", borderRadius: 8 }}>
      {/* Wall */}
      <rect x={PAD - wp} y={PAD - wp} width={W + wp * 2} height={H + wp * 2} fill="#d4c4a8" stroke="#b8a88a" strokeWidth="0.5" />
      {[0,1,2,3,4,5].map(i => (
        <line key={i} x1={PAD - wp} y1={PAD - wp + (i+1) * ((H + wp*2)/7)} x2={PAD - wp + W + wp*2} y2={PAD - wp + (i+1) * ((H+wp*2)/7)} stroke="#b8a88a" strokeWidth="0.5" opacity="0.5" />
      ))}
      {/* Glass fill */}
      <rect x={PAD + ft/2} y={PAD + ft/2} width={W - ft} height={H - ft} fill={glassHex} fillOpacity="0.4" />
      {/* Outer frame */}
      <rect x={PAD} y={PAD} width={W} height={H} fill="none" stroke="#334155" strokeWidth={ft} />
      {/* Mullion */}
      {design.panels.length > 1 && <line x1={PAD + W/2} y1={PAD} x2={PAD + W/2} y2={PAD + H} stroke="#334155" strokeWidth={ft * 0.7} />}
      {/* Sash frames + arrows */}
      {design.panels.map((panel: PanelDef, i: number) => {
        const pW = (W - ft*2) / design.panels.length;
        const px = PAD + ft + i * pW;
        const sft = 9;
        const isLeft = panel.type.includes("left");
        return (
          <g key={i}>
            <rect x={px} y={PAD + ft} width={pW} height={H - ft*2} fill="none" stroke="#475569" strokeWidth={sft} />
            {panel.type !== "fixed" && (
              <>
                <line x1={px + pW*0.2} y1={PAD + H/2} x2={px + pW*0.8} y2={PAD + H/2} stroke="#475569" strokeWidth="1.5" />
                <polygon points={`${px + pW*(isLeft ? 0.2 : 0.8)},${PAD + H/2} ${px + pW*(isLeft ? 0.2 : 0.8) + (isLeft ? 7 : -7)},${PAD + H/2 - 4} ${px + pW*(isLeft ? 0.2 : 0.8) + (isLeft ? 7 : -7)},${PAD + H/2 + 4}`} fill="#475569" />
              </>
            )}
          </g>
        );
      })}
      {/* Sill */}
      <line x1={PAD - wp*0.7} y1={PAD + H + wp*0.5} x2={PAD + W + wp*0.7} y2={PAD + H + wp*0.5} stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
      {/* Width dim */}
      <line x1={PAD} y1={PAD + H + 18} x2={PAD + W} y2={PAD + H + 18} stroke="#1e4db7" strokeWidth="1" />
      <line x1={PAD} y1={PAD + H + 12} x2={PAD} y2={PAD + H + 24} stroke="#1e4db7" strokeWidth="1" />
      <line x1={PAD+W} y1={PAD + H + 12} x2={PAD+W} y2={PAD + H + 24} stroke="#1e4db7" strokeWidth="1" />
      <text x={PAD + W/2} y={PAD + H + 34} textAnchor="middle" fontSize="10" fill="#1e4db7" fontWeight="700">{width}</text>
      {/* Height dim */}
      <line x1={PAD-18} y1={PAD} x2={PAD-18} y2={PAD+H} stroke="#1e4db7" strokeWidth="1" />
      <line x1={PAD-24} y1={PAD} x2={PAD-12} y2={PAD} stroke="#1e4db7" strokeWidth="1" />
      <line x1={PAD-24} y1={PAD+H} x2={PAD-12} y2={PAD+H} stroke="#1e4db7" strokeWidth="1" />
      <text x={PAD-32} y={PAD + H/2} textAnchor="middle" fontSize="10" fill="#1e4db7" fontWeight="700" transform={`rotate(-90,${PAD-32},${PAD+H/2})`}>{height}</text>
      {/* Profile table */}
      <g transform={`translate(${PAD + W + 20}, ${PAD})`}>
        <text x="0" y="10" fontSize="10" fill="#334155" fontWeight="700">PROFILES:</text>
        {[["Frame Profile","NCL-60-FR"],["Sash Profile","NCL-60-SA"],["Mullion","NCL-60-MU"],["Glazing Bead","NCL-60-GB"]].map(([d,c],i) => (
          <g key={i}>
            <text x="0" y={28 + i*16} fontSize="8.5" fill="#475569">{i+1}. {d}</text>
            <text x="0" y={38 + i*16} fontSize="8" fill="#94a3b8">{c}</text>
          </g>
        ))}
        <text x="0" y={108} fontSize="10" fill="#334155" fontWeight="700">GLAZING:</text>
        <text x="0" y={124} fontSize="8.5" fill="#475569">{gPreset.name}</text>
      </g>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Visualizer3D() {
  const [threeLoaded, setThreeLoaded] = useState(!!window.THREE);
  const [selectedDesign, setSelectedDesign] = useState(DESIGNS[0]);
  const [width, setWidth] = useState(1500);
  const [height, setHeight] = useState(1500);
  const [glassPreset, setGlassPreset] = useState("clear5");
  const [frameColorId, setFrameColorId] = useState("silver");
  const [wallColorId, setWallColorId] = useState("cream");
  const [showWall, setShowWall] = useState(true);
  const [showDims, setShowDims] = useState(true);
  const [lighting, setLighting] = useState("day");
  const [openAngle, setOpenAngle] = useState(0);
  const [viewMode, setViewMode] = useState("3d");
  const [catFilter, setCatFilter] = useState("الكل");
  const [renderKey, setRenderKey] = useState(0);

  const frameColor = FRAME_COLORS.find(f => f.id === frameColorId)?.val || 0xc0c0c0;
  const wallColor  = WALL_COLORS.find(w => w.id === wallColorId)?.val  || 0xf5f0e8;
  const frameHex   = FRAME_COLORS.find(f => f.id === frameColorId)?.hex || "#C0C0C0";
  const canOpen    = selectedDesign.panels.some((p: PanelDef) => p.type !== "fixed");

  useEffect(() => {
    if (window.THREE) { setThreeLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload = () => setThreeLoaded(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => { setRenderKey(k => k + 1); }, [selectedDesign, width, height, glassPreset, frameColorId, wallColorId, showWall, showDims, lighting, openAngle]);

  const s = { color: "#94a3b8", fontSize: 11 } as React.CSSProperties;
  const sVal = { color: "#60a5fa", fontSize: 12, fontWeight: 700 } as React.CSSProperties;

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", direction: "rtl", background: "#0f172a", height: "100vh", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "0 20px", display: "flex", alignItems: "center", height: 52, gap: 16, flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>EvA <span style={{ color: "#3b82f6" }}>3D</span></div>
        <div style={{ width: 1, height: 20, background: "#334155" }} />
        <div style={{ fontSize: 12, color: "#64748b" }}>Window &amp; Door Visualizer</div>
        <div style={{ marginRight: "auto", display: "flex", gap: 6 }}>
          {([["3d","3D View"],["2d","2D Drawing"],["split","Split View"]] as const).map(([m,l]) => (
            <button key={m} onClick={() => setViewMode(m)} style={{ padding: "5px 12px", background: viewMode === m ? "#1e4db7" : "#1e293b", border: `1px solid ${viewMode === m ? "#1e4db7" : "#334155"}`, color: viewMode === m ? "#fff" : "#94a3b8", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: viewMode === m ? 700 : 400 }}>{l}</button>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{selectedDesign.name} — {width}×{height}mm</div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left — Design selector */}
        <div style={{ width: 200, background: "#1e293b", borderLeft: "1px solid #334155", padding: 12, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>التصاميم</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
            {["الكل","نوافذ","أبواب","واجهات","فواصل"].map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "3px 8px", borderRadius: 10, border: `1px solid ${catFilter === c ? "#3b82f6" : "#334155"}`, background: catFilter === c ? "#1e4db7" : "transparent", color: catFilter === c ? "#fff" : "#94a3b8", fontSize: 10, cursor: "pointer" }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DESIGNS.filter(d => catFilter === "الكل" || d.category === catFilter).map(d => (
              <div key={d.id} onClick={() => { setSelectedDesign(d); setWidth(d.defaultW); setHeight(d.defaultH); setOpenAngle(0); }}
                style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${selectedDesign.id === d.id ? "#3b82f6" : "#334155"}`, background: selectedDesign.id === d.id ? "#1e3a5f" : "#0f172a", cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: selectedDesign.id === d.id ? 700 : 500, color: selectedDesign.id === d.id ? "#60a5fa" : "#cbd5e1" }}>{d.name}</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{d.category} • {d.defaultW}×{d.defaultH}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center — Viewer */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", background: "#0a1628", overflow: "hidden" }}>
          {lighting === "sunset" && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#1a0a00 0%,#3d1a00 40%,#7a3500 70%,#c05e00 100%)", opacity: 0.4, pointerEvents: "none", zIndex: 0 }} />}
          {lighting === "night"  && <div style={{ position: "absolute", inset: 0, background: "#000510", opacity: 0.7, pointerEvents: "none", zIndex: 0 }} />}
          {lighting === "day"    && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#1a2a3f 0%,#0d1b2e 100%)", pointerEvents: "none", zIndex: 0 }} />}

          <div style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", overflow: "hidden" }}>
            {viewMode === "split" ? (
              <>
                <div style={{ flex: 1, position: "relative" }}>
                  {threeLoaded && <ThreeViewer key={renderKey} design={selectedDesign} width={width} height={height} glassPreset={glassPreset} frameColor={frameColor} wallColor={wallColor} showWall={showWall} showDims={showDims} lighting={lighting} openAngle={openAngle} />}
                </div>
                <div style={{ width: 1, background: "#334155" }} />
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f8fafc" }}>
                  <SectionDrawing design={selectedDesign} width={width} height={height} glassPreset={glassPreset} />
                </div>
              </>
            ) : viewMode === "3d" ? (
              <div style={{ flex: 1 }}>
                {threeLoaded
                  ? <ThreeViewer key={renderKey} design={selectedDesign} width={width} height={height} glassPreset={glassPreset} frameColor={frameColor} wallColor={wallColor} showWall={showWall} showDims={showDims} lighting={lighting} openAngle={openAngle} />
                  : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>Loading 3D Engine...</div></div>
                }
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f8fafc" }}>
                <SectionDrawing design={selectedDesign} width={width} height={height} glassPreset={glassPreset} />
              </div>
            )}
          </div>

          {/* Lighting bar */}
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, alignItems: "center", background: "rgba(15,23,42,0.85)", borderRadius: 30, padding: "6px 16px", backdropFilter: "blur(4px)", zIndex: 2 }}>
            {([["day","☀️ Day"],["sunset","🌅 Sunset"],["studio","💡 Studio"],["night","🌙 Night"]] as const).map(([m,l]) => (
              <button key={m} onClick={() => setLighting(m)} style={{ padding: "4px 10px", background: lighting === m ? "#1e4db7" : "transparent", border: "none", color: lighting === m ? "#fff" : "#94a3b8", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: lighting === m ? 700 : 400 }}>{l}</button>
            ))}
          </div>

          <div style={{ position: "absolute", top: 10, left: 16, fontSize: 11, color: "#64748b", zIndex: 2 }}>{selectedDesign.series}</div>
        </div>

        {/* Right — Controls */}
        <div style={{ width: 240, background: "#1e293b", borderRight: "1px solid #334155", padding: 14, overflowY: "auto", flexShrink: 0 }}>

          {/* Dimensions */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>الأبعاد</div>
            {([["Width (mm)", width, setWidth, 300, 6000, 50], ["Height (mm)", height, setHeight, 300, 3000, 50]] as [string, number, (v: number) => void, number, number, number][]).map(([l, v, set, mn, mx, st]) => (
              <div key={l} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={s}>{l}</span>
                  <span style={sVal}>{v}</span>
                </div>
                <input type="range" min={mn} max={mx} step={st} value={v} onChange={e => set(Number(e.target.value))} style={{ width: "100%", accentColor: "#1e4db7", cursor: "pointer" }} />
              </div>
            ))}
          </div>

          {/* Glass */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>الزجاج</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {GLASS_PRESETS.map(g => (
                <div key={g.id} onClick={() => setGlassPreset(g.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, border: `1px solid ${glassPreset === g.id ? "#3b82f6" : "#334155"}`, background: glassPreset === g.id ? "#1e3a5f" : "#0f172a", cursor: "pointer" }}>
                  <div style={{ width: 24, height: 18, borderRadius: 3, background: `#${g.color.toString(16).padStart(6,"0")}`, opacity: g.opacity + 0.4, border: "1px solid rgba(255,255,255,0.2)" }} />
                  <span style={{ fontSize: 11, color: glassPreset === g.id ? "#60a5fa" : "#94a3b8", fontWeight: glassPreset === g.id ? 700 : 400 }}>{g.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Frame color */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>لون الإطار</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FRAME_COLORS.map(fc => (
                <div key={fc.id} onClick={() => setFrameColorId(fc.id)} title={fc.name} style={{ width: 28, height: 28, borderRadius: "50%", background: fc.hex, border: `2.5px solid ${frameColorId === fc.id ? "#3b82f6" : "transparent"}`, cursor: "pointer", outline: fc.id === "white" ? "1px solid #64748b" : undefined }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 6 }}>{FRAME_COLORS.find(f => f.id === frameColorId)?.name} — {frameHex}</div>
          </div>

          {/* Wall color */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>لون الجدار</div>
            <div style={{ display: "flex", gap: 6 }}>
              {WALL_COLORS.map(wc => (
                <div key={wc.id} onClick={() => setWallColorId(wc.id)} title={wc.name} style={{ width: 28, height: 28, borderRadius: 6, background: `#${wc.val.toString(16).padStart(6,"0")}`, border: `2.5px solid ${wallColorId === wc.id ? "#3b82f6" : "#334155"}`, cursor: "pointer" }} />
              ))}
            </div>
          </div>

          {/* Open/close */}
          {canOpen && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>فتح / إغلاق</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={s}>Open Angle</span>
                <span style={sVal}>{openAngle}%</span>
              </div>
              <input type="range" min="0" max="100" step="5" value={openAngle} onChange={e => setOpenAngle(Number(e.target.value))} style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }} />
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {([0, 50, 100] as const).map((v, i) => (
                  <button key={v} onClick={() => setOpenAngle(v)} style={{ flex: 1, padding: "5px", background: openAngle === v ? "#1e4db7" : "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#94a3b8", cursor: "pointer", fontSize: 11 }}>{["Closed","Half","Full"][i]}</button>
                ))}
              </div>
            </div>
          )}

          {/* Toggles */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>خيارات العرض</div>
            {([["showWall","Show Wall", showWall, setShowWall], ["showDims","Show Dimensions", showDims, setShowDims]] as [string, string, boolean, (v: boolean) => void][]).map(([k, l, val, set]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{l}</span>
                <div onClick={() => set(!val)} style={{ width: 36, height: 20, borderRadius: 10, background: val ? "#1e4db7" : "#334155", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 2, right: val ? 2 : 16, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "right 0.2s" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Specs */}
          <div style={{ background: "#0f172a", borderRadius: 10, padding: 12, border: "1px solid #334155" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>المواصفات</div>
            {([
              ["التصميم", selectedDesign.name],
              ["السيريز",  selectedDesign.series],
              ["العرض",    `${width} mm`],
              ["الارتفاع", `${height} mm`],
              ["المساحة",  `${(width * height / 1e6).toFixed(2)} m²`],
              ["الزجاج",   GLASS_PRESETS.find(g => g.id === glassPreset)?.name],
              ["الإطار",   FRAME_COLORS.find(f => f.id === frameColorId)?.name],
            ] as [string, string | undefined][]).map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #1e293b", fontSize: 11 }}>
                <span style={{ color: "#475569" }}>{l}</span>
                <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
