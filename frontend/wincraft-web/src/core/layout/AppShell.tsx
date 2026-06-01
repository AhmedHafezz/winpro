import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '../auth/authStore'
import { useLogout } from '../auth/useAuth'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuthStore()
  const logout = useLogout()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
          <h1 className="text-slate-700 font-semibold text-sm">WinCraft ERP</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user?.fullName}</span>
            <button
              onClick={() => logout.mutate()}
              className="text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              خروج
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
