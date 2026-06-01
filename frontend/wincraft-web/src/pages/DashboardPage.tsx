import { useQuery } from '@tanstack/react-query'
import { api } from '../core/api/axios'
import { fmtKwd } from '../hooks/useKwd'

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/reports/dashboard').then(r => r.data),
  })

  const stats = [
    { label: 'عروض الأسعار النشطة', value: data?.activeQuotations ?? '—', icon: '📄' },
    { label: 'المشاريع الجارية',    value: data?.activeProjects ?? '—',    icon: '🏗️' },
    { label: 'إجمالي المبيعات',     value: data ? fmtKwd(data.totalSales) : '—', icon: '💰' },
    { label: 'أوامر التصنيع',       value: data?.pendingWorkOrders ?? '—', icon: '⚙️' },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">لوحة التحكم</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-700 mb-4">مرحباً بك في WinCraft ERP</h2>
        <p className="text-sm text-slate-500">
          نظام متكامل لإدارة مصانع وورش تصنيع الأبواب والشبابيك الألمنيوم.
          يغطي دورة حياة كاملة من عروض الأسعار حتى التركيب.
        </p>
      </div>
    </div>
  )
}
