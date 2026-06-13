import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSystemStats } from '../core/store/databridge'

const fmt = (n: number) => n.toLocaleString('en-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

export function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(getSystemStats())

  // Refresh when returning to dashboard
  useEffect(() => {
    setStats(getSystemStats())
  }, [])

  const pipeline = [
    { icon: '📍', label: 'معاينات معلقة',   val: stats.pendingSurveys,    path: '/surveys',       color: '#8b5cf6', bg: '#ede9fe' },
    { icon: '👥', label: 'عملاء نشطون',      val: stats.activeCustomers,   path: '/crm-hub',       color: '#1e4db7', bg: '#eff6ff' },
    { icon: '📄', label: 'عروض أسعار',       val: stats.quotations,        path: '/quotation-hub', color: '#0891b2', bg: '#ecfeff' },
    { icon: '🏗️', label: 'مشاريع نشطة',    val: stats.activeProjects,    path: '/project-hub',   color: '#059669', bg: '#ecfdf5' },
    { icon: '⚙️', label: 'أوامر تصنيع',     val: stats.workOrders,        path: '/shop-floor',    color: '#d97706', bg: '#fffbeb' },
    { icon: '🚚', label: 'أوامر تسليم',     val: stats.dispatchOrders,    path: '/dispatch',      color: '#dc2626', bg: '#fef2f2' },
  ]

  const kpis = [
    { label: 'قيمة عروض الأسعار', val: `${fmt(stats.totalQuotValue)} د.ك`, icon: '📄', color: '#0891b2', bg: '#ecfeff' },
    { label: 'قيمة المشاريع',     val: `${fmt(stats.totalProjValue)} د.ك`, icon: '🏗️', color: '#059669', bg: '#ecfdf5' },
    { label: 'خط أعمال CRM',      val: `${fmt(stats.pipeline)} د.ك`,       icon: '💼', color: '#7c3aed', bg: '#ede9fe' },
    { label: 'نشاطات معلقة',      val: stats.pendingActivities,             icon: '📋', color: '#d97706', bg: '#fffbeb' },
  ]

  const alerts: { color: string; msg: string; path: string }[] = []
  if (stats.lowStockItems > 0)
    alerts.push({ color: '#dc2626', msg: `⚠️ ${stats.lowStockItems} أصناف مخزون وصلت للحد الأدنى`, path: '/inventory' })
  if (stats.pendingActivities > 0)
    alerts.push({ color: '#d97706', msg: `🔔 ${stats.pendingActivities} نشاط CRM بانتظار المتابعة`, path: '/crm-hub' })
  if (stats.pendingWO > 0)
    alerts.push({ color: '#2563eb', msg: `⚙️ ${stats.pendingWO} أمر تصنيع معلق`, path: '/shop-floor' })
  if (stats.pendingDispatch > 0)
    alerts.push({ color: '#7c3aed', msg: `🚚 ${stats.pendingDispatch} أمر تسليم قيد التنفيذ`, path: '/dispatch' })

  const shortcuts = [
    { label: '+ عميل جديد',        path: '/crm-hub',       color: '#1e4db7' },
    { label: '+ عرض سعر',           path: '/quotation-hub', color: '#0891b2' },
    { label: '+ مشروع',             path: '/project-hub',   color: '#059669' },
    { label: '+ معاينة',            path: '/surveys',       color: '#8b5cf6' },
    { label: '+ أمر تصنيع',         path: '/shop-floor',    color: '#d97706' },
    { label: 'عرض التقارير',        path: '/reports',       color: '#64748b' },
  ]

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">لوحة التحكم</h1>
        <p className="text-sm text-slate-500 mt-0.5">WinCraft ERP — نظام إدارة مصانع الألمنيوم</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)}
              className="w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: a.color + '18', color: a.color, border: `1px solid ${a.color}33` }}>
              {a.msg}
            </button>
          ))}
        </div>
      )}

      {/* Pipeline flow */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">خط سير العمل</h2>
        <div className="flex gap-2 flex-wrap">
          {pipeline.map((p, i) => (
            <button key={p.label} onClick={() => navigate(p.path)}
              className="flex-1 min-w-[120px] rounded-xl p-4 text-center transition-all hover:scale-105 hover:shadow-md"
              style={{ background: p.bg, border: `1.5px solid ${p.color}33` }}>
              <div className="text-2xl mb-1">{p.icon}</div>
              <div className="text-2xl font-black" style={{ color: p.color }}>{p.val}</div>
              <div className="text-xs mt-1 font-medium" style={{ color: p.color }}>{p.label}</div>
              {i < pipeline.length - 1 && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 text-slate-300 text-lg hidden md:block">←</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="text-2xl mb-2">{k.icon}</div>
            <div className="text-lg font-black" style={{ color: k.color }}>{k.val}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Module grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">الوحدات</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: 'إدارة العملاء',    sub: `${stats.customers} عميل`,             path: '/crm-hub',       icon: '👥', color: '#1e4db7' },
            { label: 'عروض الأسعار',     sub: `${stats.acceptedQuotations} مقبولة`,  path: '/quotation-hub', icon: '📄', color: '#0891b2' },
            { label: 'المشاريع',         sub: `${stats.completedProjects} مكتملة`,   path: '/project-hub',   icon: '🏗️', color: '#059669' },
            { label: 'أرضية المصنع',     sub: `${stats.inProgressWO} جارية`,         path: '/shop-floor',    icon: '🔩', color: '#d97706' },
            { label: 'المخزون',          sub: `${stats.inventoryItems} صنف`,          path: '/inventory',     icon: '📦', color: '#64748b' },
            { label: 'المعاينات',        sub: `${stats.surveys} معاينة`,              path: '/surveys',       icon: '📍', color: '#8b5cf6' },
            { label: 'التسليم والتركيب', sub: `${stats.doneWO} مكتمل`,               path: '/dispatch',      icon: '🚚', color: '#dc2626' },
            { label: 'التقارير',         sub: 'رسوم بيانية',                          path: '/reports',       icon: '📈', color: '#475569' },
            { label: 'البروفايلات',      sub: 'كتالوج + تحسين قطع',                  path: '/profiles',      icon: '📐', color: '#0f766e' },
            { label: 'حساب المواد',      sub: 'BOM تفصيلي',                           path: '/bom',           icon: '🔧', color: '#b45309' },
            { label: 'التصاميم',         sub: 'مُصمِّم نوافذ وأبواب',                path: '/designs',       icon: '✏️', color: '#7c3aed' },
            { label: 'مجسِّم 3D',        sub: 'عرض ثلاثي الأبعاد',                  path: '/visualizer',    icon: '🧊', color: '#0284c7' },
          ].map(m => (
            <button key={m.label} onClick={() => navigate(m.path)}
              className="bg-white rounded-xl border border-slate-100 p-4 text-right hover:shadow-md hover:border-slate-200 transition-all">
              <div className="text-xl mb-2">{m.icon}</div>
              <div className="font-bold text-slate-800 text-sm">{m.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{m.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">إجراءات سريعة</h2>
        <div className="flex gap-2 flex-wrap">
          {shortcuts.map(s => (
            <button key={s.label} onClick={() => navigate(s.path)}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-80"
              style={{ background: s.color }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
