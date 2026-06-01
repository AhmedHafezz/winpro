import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../core/api/axios';

interface Survey {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  status: string;
  scheduledDate?: string;
  technicianName?: string;
  notes?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  Pending: 'bg-gray-100 text-gray-700',
  InProgress: 'bg-blue-100 text-blue-700',
  Submitted: 'bg-purple-100 text-purple-700',
  Converted: 'bg-green-100 text-green-700',
};

const statusLabels: Record<string, string> = {
  Pending: 'معلقة',
  InProgress: 'جارية',
  Submitted: 'مقدمة',
  Converted: 'تحولت لعرض سعر',
};

export default function SurveysPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['surveys', status, page],
    queryFn: () =>
      api.get('/api/surveys', { params: { status: status || undefined, page, pageSize: 20 } })
        .then(r => r.data),
  });

  const surveys: Survey[] = data?.items ?? [];
  const total: number = data?.totalCount ?? 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">المعاينات</h1>
        <span className="text-sm text-gray-500">{total} معاينة</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'Pending', 'InProgress', 'Submitted', 'Converted'].map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === s
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'الكل' : statusLabels[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16 text-gray-400">لا توجد معاينات</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الكود</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">العميل</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الفني</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">موعد المعاينة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {surveys.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-brand-700 font-medium">{s.code}</td>
                  <td className="px-4 py-3 text-gray-800">{s.customerName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[s.status] ?? 'bg-gray-100'}`}>
                      {statusLabels[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.technicianName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.scheduledDate ? new Date(s.scheduledDate).toLocaleDateString('ar-KW') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(s.createdAt).toLocaleDateString('ar-KW')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
