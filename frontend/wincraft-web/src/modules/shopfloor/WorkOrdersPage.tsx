import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../core/api/axios';

interface WorkOrder {
  id: string;
  code: string;
  projectCode: string;
  customerName: string;
  status: string;
  progress: number;
  dueDate?: string;
  priority: string;
}

const statusColors: Record<string, string> = {
  Pending: 'bg-gray-100 text-gray-700',
  InProgress: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  OnHold: 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  Pending: 'معلق',
  InProgress: 'قيد التنفيذ',
  Completed: 'مكتمل',
  OnHold: 'متوقف',
  Cancelled: 'ملغي',
};

const priorityColors: Record<string, string> = {
  Low: 'text-gray-500',
  Normal: 'text-blue-500',
  High: 'text-orange-500',
  Urgent: 'text-red-600',
};

export default function WorkOrdersPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', status, page],
    queryFn: () =>
      api.get('/api/work-orders', { params: { status: status || undefined, page, pageSize: 20 } })
        .then(r => r.data),
  });

  const orders: WorkOrder[] = data?.items ?? [];
  const total: number = data?.totalCount ?? 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">أوامر العمل</h1>
        <span className="text-sm text-gray-500">{total} أمر عمل</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Pending', 'InProgress', 'Completed', 'OnHold'].map(s => (
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
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">لا توجد أوامر عمل</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map(wo => (
            <div key={wo.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-brand-700">{wo.code}</p>
                  <p className="text-sm text-gray-500">{wo.customerName}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[wo.status] ?? 'bg-gray-100'}`}>
                  {statusLabels[wo.status] ?? wo.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>مشروع: <span className="font-medium">{wo.projectCode}</span></span>
                <span className={`font-medium ${priorityColors[wo.priority]}`}>
                  {wo.priority === 'Urgent' ? '🔴 عاجل' : wo.priority === 'High' ? '🟠 عالي' : wo.priority === 'Normal' ? '🔵 عادي' : '⚪ منخفض'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>التقدم</span>
                  <span>{wo.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      wo.progress === 100 ? 'bg-green-500' : 'bg-brand-600'
                    }`}
                    style={{ width: `${wo.progress}%` }}
                  />
                </div>
              </div>

              {wo.dueDate && (
                <p className="text-xs text-gray-400">
                  موعد التسليم: {new Date(wo.dueDate).toLocaleDateString('ar-KW')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
          >السابق</button>
          <span className="px-4 py-2 text-sm text-gray-600">صفحة {page}</span>
          <button
            disabled={orders.length < 20}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
          >التالي</button>
        </div>
      )}
    </div>
  );
}
