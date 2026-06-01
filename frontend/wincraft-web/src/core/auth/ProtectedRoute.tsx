import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './authStore'

interface Props {
  permission?: string
}

export function ProtectedRoute({ permission }: Props) {
  const { accessToken, hasPermission } = useAuthStore()

  if (!accessToken) return <Navigate to="/login" replace />
  if (permission && !hasPermission(permission)) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}
