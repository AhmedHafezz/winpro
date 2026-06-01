import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useAuthStore } from '../auth/authStore'

const navItems = [
  { label: 'لوحة التحكم',    path: '/dashboard',    icon: '📊', permission: null },
  { label: 'إدارة العملاء',  path: '/crm',          icon: '👥', permission: 'crm.view' },
  { label: 'عروض الأسعار',   path: '/quotations',   icon: '📄', permission: 'quote.view' },
  { label: 'التصاميم',       path: '/designs',      icon: '✏️', permission: 'design.view' },
  { label: 'حساب المواد',    path: '/bom',           icon: '🔧', permission: 'design.view' },
  { label: 'بروفايلات',      path: '/profiles',     icon: '📐', permission: 'design.view' },
  { label: 'المشاريع',       path: '/projects',     icon: '🏗️', permission: 'prod.view' },
  { label: 'أوامر التصنيع',  path: '/work-orders',  icon: '⚙️', permission: 'prod.view' },
  { label: 'المخزون',        path: '/inventory',    icon: '📦', permission: 'inv.view' },
  { label: 'المعاينات',      path: '/surveys',      icon: '📍', permission: 'crm.view' },
  { label: 'التسليم',        path: '/dispatch',     icon: '🚚', permission: 'prod.view' },
  { label: 'التركيب',        path: '/installation', icon: '🔨', permission: 'prod.view' },
  { label: 'التقارير',       path: '/reports',      icon: '📈', permission: 'reports.view' },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: Props) {
  const { hasPermission } = useAuthStore()

  return (
    <aside
      className={clsx(
        'flex h-screen flex-col bg-slate-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <span className="text-lg font-bold text-brand-500">WinCraft ERP</span>
        )}
        <button
          onClick={onToggle}
          className="rounded p-1 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems
          .filter(item => !item.permission || hasPermission(item.permission))
          .map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  'hover:bg-slate-700',
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300',
                )
              }
            >
              <span className="text-base">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
      </nav>
    </aside>
  )
}
