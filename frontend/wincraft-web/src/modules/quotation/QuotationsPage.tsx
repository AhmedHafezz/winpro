import { useQuery } from '@tanstack/react-query'
import { api } from '../../core/api/axios'
import { fmtKwd } from '../../hooks/useKwd'

interface Quotation {
  id: string
  code: string
  customerName: string
  status: string
  date: string
  validUntil: string
  totalValue: number
  revisionNumber: number
}

const statusMap: Record<string, { label: string; cls: string }> = {
  Draft:    { label: 'مسودة',   cls: 'bg-slate-100 text-slate-600' },
  Sent:     { label: 'مرسل',    cls: 'bg-blue-100 text-blue-700' },
  Opened:   { label: 'مفتوح',   cls: 'bg-yellow-100 text-yellow-700' },
  Accepted: { label: 'مقبول',   cls: 'bg-green-100 text-green-700' },
  Rejected: { label: 'مرفوض',   cls: 'bg-red-100 text-red-600' },
  Expired:  { label: 'منتهي',   cls: 'bg-orange-100 text-orange-600' },
}

export function QuotationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => api.get('/quotations').then(r => r.data),
  })

  const downloadPdf = (id: string, code: string) => {
    api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }).then(res => {
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${code}.pdf`
      a.click()
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">عروض الأسعار</h1>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700 transition-colors">
          + عرض سعر جديد
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">جاري التحميل...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-right font-medium text-slate-600">رقم العرض</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">العميل</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الإجمالي</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((q: Quotation) => {
                const st = statusMap[q.status] ?? { label: q.status, cls: '' }
                return (
                  <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium text-brand-600">
                      {q.code}
                      {q.revisionNumber > 1 && (
                        <span className="text-xs text-slate-400 mr-1">r{q.revisionNumber}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{q.customerName}</td>
                    <td className="px-4 py-3 text-slate-500 ltr">{q.date}</td>
                    <td className="px-4 py-3 font-mono text-slate-800">{fmtKwd(q.totalValue)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => downloadPdf(q.id, q.code)}
                        className="text-brand-600 hover:text-brand-700 text-xs"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
