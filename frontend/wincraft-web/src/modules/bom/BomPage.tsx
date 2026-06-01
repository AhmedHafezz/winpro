import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../../core/api/axios'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

type Tab = 'bars' | 'pieces' | 'glasses' | 'fittings'

export function BomPage() {
  const [activeTab, setActiveTab] = useState<Tab>('bars')
  const [bomId, setBomId] = useState<string | null>(null)

  const { data: bomData } = useQuery({
    queryKey: ['bom', bomId],
    queryFn:  () => api.get(`/bom/${bomId}`).then(r => r.data),
    enabled:  !!bomId,
  })

  const tabs: { key: Tab; label: string }[] = [
    { key: 'bars',     label: 'القضبان المُحسّنة' },
    { key: 'pieces',   label: 'القطع' },
    { key: 'glasses',  label: 'الزجاج' },
    { key: 'fittings', label: 'الإكسسوارات' },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">حساب المواد (BOM)</h1>

      {bomData && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'إجمالي القضبان', value: bomData.totalBars },
              { label: 'الطول الكلي (م)', value: bomData.totalLengthM?.toFixed(3) },
              { label: 'الوزن الكلي (كغ)', value: bomData.totalWeightKg?.toFixed(3) },
              { label: 'نسبة الاستخدام', value: `${bomData.avgUsagePct?.toFixed(1)}%` },
              { label: 'الهدر',           value: `${bomData.scrapPct?.toFixed(1)}%` },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Pie chart for usage */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'استخدام', value: bomData.avgUsagePct },
                    { name: 'قابل للاسترداد', value: bomData.avgRecoverPct },
                    { name: 'هدر', value: bomData.scrapPct },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  <Cell fill="#1e4db7" />
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex border-b border-slate-200">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'bars' && <BarsTab data={bomData?.optimizedBars} />}
          {activeTab === 'glasses' && <GlassesTab data={bomData?.glassPieces} />}
          {activeTab === 'pieces' && (
            <div className="text-slate-400 text-center py-8">اختر مشروعاً لحساب BOM</div>
          )}
          {activeTab === 'fittings' && (
            <div className="text-slate-400 text-center py-8">لا توجد بيانات إكسسوارات</div>
          )}
        </div>
      </div>
    </div>
  )
}

function BarsTab({ data }: { data?: any[] }) {
  if (!data?.length) return <div className="text-slate-400 text-center py-8">لا توجد بيانات</div>
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50">
          {['الكود', 'الوصف', 'المعالجة خارجي', 'عدد القضبان', 'الطول (م)', 'الوزن (كغ)', 'الاستخدام%', 'قابل استرداد%', 'هدر%'].map(h => (
            <th key={h} className="px-3 py-2 text-right font-medium text-slate-600">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((b: any, i: number) => (
          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
            <td className="px-3 py-2 font-mono">{b.profileCode}</td>
            <td className="px-3 py-2 text-slate-600">{b.description}</td>
            <td className="px-3 py-2 text-slate-500">{b.treatmentExt || '—'}</td>
            <td className="px-3 py-2 font-medium">{b.barCount}</td>
            <td className="px-3 py-2 font-mono">{b.totalLengthM?.toFixed(3)}</td>
            <td className="px-3 py-2 font-mono">{b.totalWeightKg?.toFixed(3)}</td>
            <td className="px-3 py-2 text-green-600">{b.usagePct?.toFixed(1)}%</td>
            <td className="px-3 py-2 text-blue-600">{b.recoverablePct?.toFixed(1)}%</td>
            <td className="px-3 py-2 text-red-500">{b.scrapPct?.toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function GlassesTab({ data }: { data?: any[] }) {
  if (!data?.length) return <div className="text-slate-400 text-center py-8">لا توجد بيانات</div>
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50">
          {['التصميم', 'اللوح', 'العرض×الارتفاع', 'الكمية', 'المساحة/قطعة (م²)', 'الإجمالي (م²)', 'المحيط (م)'].map(h => (
            <th key={h} className="px-3 py-2 text-right font-medium text-slate-600">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((g: any, i: number) => (
          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
            <td className="px-3 py-2 font-mono">{g.designCode}</td>
            <td className="px-3 py-2">{g.panelRef}</td>
            <td className="px-3 py-2 font-mono">{g.widthMm}×{g.heightMm}</td>
            <td className="px-3 py-2">{g.quantity}</td>
            <td className="px-3 py-2 font-mono">{g.areaPerPiece?.toFixed(3)}</td>
            <td className="px-3 py-2 font-mono">{g.totalArea?.toFixed(3)}</td>
            <td className="px-3 py-2 font-mono">{g.perimeterM?.toFixed(3)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
