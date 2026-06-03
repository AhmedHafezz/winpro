import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  userId: string
  fullName: string
  email: string
  role: string
  permissions: string[]
  tenantId: string
}

interface AuthState {
  accessToken: string | null
  user: User | null
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,

      setToken: (accessToken) => set({ accessToken }),

      setUser: (user) => set({ user }),

      logout: () => set({ accessToken: null, user: null }),

      hasPermission: (permission: string) => {
        const { user } = get()
        if (!user) return false
        const perms = user.permissions
        if (perms.includes('admin.*')) return true
        if (perms.includes(permission)) return true
        const prefix = permission.split('.')[0]
        return perms.includes(`${prefix}.*`)
      },
    }),
    { name: 'wincraft_auth' }
  )
)
