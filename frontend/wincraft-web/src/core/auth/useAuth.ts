import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/axios'
import { useAuthStore } from './authStore'

export function useLogin() {
  const { setToken, setUser } = useAuthStore()
  return useMutation({
    mutationFn: (creds: { email: string; password: string }) =>
      api.post('/auth/login', creds).then(r => r.data),
    onSuccess: (data) => {
      setToken(data.accessToken)
      setUser({
        userId:      data.userId,
        fullName:    data.fullName,
        email:       data.email,
        role:        data.role,
        permissions: data.permissions,
        tenantId:    data.tenantId,
      })
    },
  })
}

export function useLogout() {
  const logout = useAuthStore(s => s.logout)
  return useMutation({
    mutationFn: () => api.post('/auth/logout').then(r => r.data),
    onSettled: () => logout(),
  })
}

export function useMe() {
  const { setUser } = useAuthStore()
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => {
      setUser(r.data)
      return r.data
    }),
    staleTime: 1000 * 60 * 10,
  })
}
