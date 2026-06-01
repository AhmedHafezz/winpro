import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../core/api/axios'

interface Customer {
  id: string
  name: string
  type: string
  phone?: string
  email?: string
  city?: string
  status: string
  createdAt: string
}

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () =>
      api.get('/customers', { params: { search: search || undefined } }).then(r => r.data),
  })

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">إدارة العملاء</h1>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700 transition-colors">
          + إضافة عميل
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <input
            type="text"
            placeholder="بحث بالاسم أو الهاتف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-none"
          />
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">جاري التحميل...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-right font-medium text-slate-600">الاسم</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">النوع</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الهاتف</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">المدينة</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الحالة</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((c: Customer) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.type === 'Company' ? 'شركة' : 'فرد'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 ltr">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-left">
                    <button
                      onClick={() => deleteCustomer.mutate(c.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {data?.items?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    لا يوجد عملاء
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active:   'bg-green-100 text-green-700',
    Prospect: 'bg-yellow-100 text-yellow-700',
    Inactive: 'bg-slate-100 text-slate-500',
  }
  const labels: Record<string, string> = {
    Active: 'نشط', Prospect: 'محتمل', Inactive: 'غير نشط',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}
