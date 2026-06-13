import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

// Weight per meter for common aluminum profiles (kg/m)
const PROFILE_WEIGHTS: Record<string, number> = {
  'NCL VEKA I-60 SLIDING':   1.82,
  'NCL VEKA I-60 CASEMENT':  1.65,
  'NCL VEKA DOOR SERIES':    2.10,
  'NCL VEKA CURTAIN WALL':   2.45,
  'GLASS PARTITION':         1.20,
  default:                   1.75,
}

// Accessory rules per unit
const FITTINGS_PER_UNIT = [
  { name: 'زاوية ألمنيوم', unit: 'قطعة', perUnit: 4, color: '#1e4db7' },
  { name: 'أختام سيليكون', unit: 'متر',  perUnit: 3, color: '#059669' },
  { name: 'مسامير 6×40',   unit: 'قطعة', perUnit: 8, color: '#d97706' },
  { name: 'بروان أسود',    unit: 'متر',  perUnit: 2, color: '#7c3aed' },
  { name: 'مزلاج نافذة',   unit: 'قطعة', perUnit: 1, color: '#dc2626' },
]

interface Design {
  code: string; name: string; location: string
  w: number; h: number; qty: number; glass: string; series: string; price: number
}

interface Project { id: string; name: string; customer: string; designs: Design[] }
interface ProjDB   { projects: Project[] }

const BAR_LENGTH_M = 6.0
const KERF_MM = 3

function calcBom(designs: Design[]) {
  const totalUnits = designs.reduce((s, d) => s + d.qty, 0)

  // Aluminum bars — perimeter of each unit × qty
  const bySeries: Record<string, { total_mm: number; series: string; units: number }> = {}
  for (const d of designs) {
    const perimMm = 2 * (d.w + d.h) + 4 * KERF_MM // rough perimeter + kerfs
    const key = d.series || 'default'
    if (!bySeries[key]) bySeries[key] = { total_mm: 0, series: d.series, units: 0 }
    bySeries[key].total_mm += perimMm * d.qty
    bySeries[key].units   += d.qty
  }

  const bars = Object.entries(bySeries).map(([key, v]) => {
    const totalM     = v.total_mm / 1000
    const barCount   = Math.ceil(totalM / BAR_LENGTH_M)
    const usedM      = totalM
    const totalBarM  = barCount * BAR_LENGTH_M
    const scrapM     = totalBarM - usedM
    const wt         = PROFILE_WEIGHTS[key] ?? PROFILE_WEIGHTS['default']
    return {
      series:   v.series || key,
      units:    v.units,
      totalM:   totalM.toFixed(3),
      barCount,
      weightKg: (usedM * wt).toFixed(2),
      usagePct: ((usedM / totalBarM) * 100).toFixed(1),
      scrapPct: ((scrapM / totalBarM) * 100).toFixed(1),
    }
  })

  // Glass schedule
  const glass = designs.flatMap(d =>
    Array.from({ length: d.qty }, (_, i) => ({
      code:     d.code,
      name:     d.name,
      location: d.location,
      instance: i + 1,
      w:        Math.round((d.w - 30) / 1),
      h:        Math.round((d.h - 30) / 1),
      type:     d.glass,
      areaSqm:  ((d.w - 30) * (d.h - 30) / 1e6).toFixed(3),
    }))
  )
  const totalGlassM2 = glass.reduce((s, g) => s + parseFloat(g.areaSqm), 0)

  // Accessories
  const fittings = FITTINGS_PER_UNIT.map(f => ({
    ...f,
    totalQty: Math.ceil(totalUnits * f.perUnit),
  }))

  const totalWeightKg = bars.reduce((s, b) => s + parseFloat(b.weightKg), 0)
  const totalBars      = bars.reduce((s, b) => s + b.barCount, 0)
  const avgUsage       = bars.length > 0
    ? bars.reduce((s, b) => s + parseFloat(b.usagePct), 0) / bars.length
    : 0

  return { bars, glass, totalGlassM2, fittings, totalWeightKg, totalBars, avgUsage, totalUnits }
}

export function BomPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'bars' | 'glass' | 'fittings'>('bars')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    // Check for intent from ProjectHub
    const raw = localStorage.getItem('wincraft_intent')
    if (raw) {
      try {
        const intent = JSON.parse(raw)
        if (intent.type === 'bom_project' && intent.projectId) {
          setSelectedProject(intent.projectId)
          localStorage.removeItem('wincraft_intent')
        }
      } catch { /* ignore */ }
    }

    // Load projects from ProjectHub store
    try {
      const db: ProjDB = JSON.parse(localStorage.getItem('eva_project_hub') || 'null') ?? { projects: [] }
      setProjects(db.projects)
      if (!selectedProject && db.projects.length > 0) setSelectedProject(db.projects[0].id)
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const project = projects.find(p => p.id === selectedProject)
  const bom = project ? calcBom(project.designs) : null

  const pieData = bom ? [
    { name: 'استخدام',        value: bom.avgUsage },
    { name: 'هدر',            value: 100 - bom.avgUsage },
  ] : []

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">حساب المواد (BOM)</h1>
          <p className="text-sm text-slate-500 mt-0.5">قائمة مواد تفصيلية: قضبان ألمنيوم، زجاج، إكسسوارات</p>
        </div>
        <button onClick={() => navigate('/project-hub')}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium">
          ← المشاريع
        </button>
      </div>

      {/* Project selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">اختر المشروع</label>
        {projects.length === 0 ? (
          <div className="text-sm text-slate-400">
            لا توجد مشاريع. <button onClick={() => navigate('/project-hub')} className="text-brand-600 underline">أنشئ مشروعاً</button> أولاً.
          </div>
        ) : (
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full max-w-md">
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.customer} ({p.designs.length} تصميم)</option>
            ))}
          </select>
        )}
      </div>

      {!bom && (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center text-slate-400">
          اختر مشروعاً من القائمة أعلاه لحساب قائمة المواد
        </div>
      )}

      {bom && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'إجمالي الوحدات',    val: bom.totalUnits,                  color: '#1e4db7' },
              { label: 'إجمالي القضبان',    val: bom.totalBars,                   color: '#d97706' },
              { label: 'الوزن الكلي (كغ)',  val: bom.totalWeightKg.toFixed(1),    color: '#059669' },
              { label: 'مساحة الزجاج (م²)', val: bom.totalGlassM2.toFixed(2),    color: '#7c3aed' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
                <div className="text-2xl font-black" style={{ color: k.color }}>{k.val}</div>
                <div className="text-xs text-slate-500 mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Usage pie */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex gap-6 items-center">
            <div style={{ width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    <Cell fill="#1e4db7" />
                    <Cell fill="#fca5a5" />
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-slate-700">نسبة الاستخدام: <strong>{bom.avgUsage.toFixed(1)}%</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-red-300" />
                <span className="text-slate-700">الهدر المتوقع: <strong>{(100 - bom.avgUsage).toFixed(1)}%</strong></span>
              </div>
              <p className="text-xs text-slate-400 mt-2">بناءً على قضبان بطول {BAR_LENGTH_M}م</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-100">
              {([['bars','القضبان 🪟'], ['glass','الزجاج 🔲'], ['fittings','الإكسسوارات 🔩']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === k ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}>
                  {l}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-x-auto">
              {tab === 'bars' && (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['السلسلة', 'الوحدات', 'إجمالي الطول (م)', 'عدد القضبان', 'الوزن (كغ)', 'الاستخدام%', 'الهدر%'].map(h => (
                        <th key={h} className="text-right px-4 py-3 font-medium text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bom.bars.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{b.series}</td>
                        <td className="px-4 py-3 text-center">{b.units}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{b.totalM}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{b.barCount}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{b.weightKg}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{b.usagePct}%</td>
                        <td className="px-4 py-3 text-red-500 font-medium">{b.scrapPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === 'glass' && (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['الكود', 'الاسم', 'الموقع', 'الأبعاد (مم)', 'النوع', 'المساحة (م²)'].map(h => (
                        <th key={h} className="text-right px-4 py-3 font-medium text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bom.glass.map((g, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{g.code}-{g.instance}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{g.name}</td>
                        <td className="px-4 py-3 text-slate-600">{g.location}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{g.w}×{g.h}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{g.type}</td>
                        <td className="px-4 py-3 font-mono text-blue-600 font-medium">{g.areaSqm}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={5} className="px-4 py-3 text-slate-700">الإجمالي</td>
                      <td className="px-4 py-3 font-mono text-blue-700">{bom.totalGlassM2.toFixed(3)} م²</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {tab === 'fittings' && (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['الصنف', 'الوحدة', 'لكل وحدة', 'إجمالي الوحدات', 'الكمية المطلوبة'].map(h => (
                        <th key={h} className="text-right px-4 py-3 font-medium text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bom.fittings.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                            <span className="font-medium text-slate-800">{f.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{f.unit}</td>
                        <td className="px-4 py-3 text-slate-600">{f.perUnit}</td>
                        <td className="px-4 py-3 text-slate-600">{bom.totalUnits}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: f.color }}>{f.totalQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => {
              localStorage.setItem('wincraft_intent', JSON.stringify({ type: 'new_work_order', project: { id: project!.id, name: project!.name, customer: project!.customer, items: project!.designs } }))
              navigate('/shop-floor')
            }} className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-700">
              ⚙️ إنشاء أمر تصنيع
            </button>
            <button onClick={() => window.print()}
              className="border border-slate-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50">
              🖨️ طباعة BOM
            </button>
          </div>
        </>
      )}
    </div>
  )
}
