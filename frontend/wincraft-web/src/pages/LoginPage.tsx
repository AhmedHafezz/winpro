import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '../core/auth/useAuth'
import { useAuthStore } from '../core/auth/authStore'

const DEMO_EMAIL    = 'admin@wincraft.demo'
const DEMO_PASSWORD = 'demo1234'

const schema = z.object({
  email:    z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور 6 أحرف على الأقل'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate        = useNavigate()
  const login           = useLogin()
  const { setToken, setUser } = useAuthStore()

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    // Demo mode — no backend needed
    if (data.email === DEMO_EMAIL && data.password === DEMO_PASSWORD) {
      setToken('demo-token')
      setUser({
        userId:      '1',
        fullName:    'مدير النظام',
        email:       DEMO_EMAIL,
        role:        'admin',
        permissions: ['admin.*'],
        tenantId:    'demo',
      })
      navigate('/dashboard')
      return
    }
    // Real backend login
    try {
      await login.mutateAsync(data)
      navigate('/dashboard')
    } catch {
      // error shown via login.isError
    }
  }

  const fillDemo = () => {
    setValue('email',    DEMO_EMAIL)
    setValue('password', DEMO_PASSWORD)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-600">WinCraft ERP</h1>
          <p className="text-slate-500 mt-1 text-sm">تسجيل الدخول</p>
        </div>

        {/* Demo banner */}
        <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          <div className="font-bold mb-1">🚀 وضع العرض التجريبي</div>
          <div className="font-mono text-xs mb-2">
            <span className="text-blue-500">email:</span> {DEMO_EMAIL}<br />
            <span className="text-blue-500">password:</span> {DEMO_PASSWORD}
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
          >
            تعبئة تلقائية ←
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              {...register('email')}
              type="email"
              dir="ltr"
              placeholder="admin@wincraft.demo"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              كلمة المرور
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {login.isError && (
            <p className="text-red-500 text-sm bg-red-50 rounded p-2">
              بيانات الدخول غير صحيحة
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-white font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {login.isPending ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
