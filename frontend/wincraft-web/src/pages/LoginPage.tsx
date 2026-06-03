import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../core/auth/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()

  const enter = () => {
    setToken('demo-token')
    setUser({
      userId:      '1',
      fullName:    'مدير النظام',
      email:       'admin@wincraft.demo',
      role:        'admin',
      permissions: ['admin.*'],
      tenantId:    'demo',
    })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-brand-600 mb-2">WinCraft ERP</h1>
        <p className="text-slate-500 text-sm mb-8">نظام إدارة مصانع الألمنيوم</p>
        <button
          onClick={enter}
          className="w-full rounded-lg bg-brand-600 py-3 text-white font-bold text-base hover:bg-brand-700 transition-colors"
        >
          دخول ←
        </button>
      </div>
    </div>
  )
}
