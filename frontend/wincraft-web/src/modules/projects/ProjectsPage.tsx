import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../core/api/axios';

interface Project {
  id: string;
  code: string;
  name?: string;
  customerId: string;
  customerName: string;
  status: string;
  totalValue: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  Planning: 'bg-gray-100 text-gray-700',
  Active: 'bg-blue-100 text-blue-700',
  OnHold: 'bg-yellow-100 text-yellow-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  Planning: 'تخطيط',
  Active: 'نشط',
  OnHold: 'متوقف',
  Completed: 'مكتمل',
  Cancelled: 'ملغي',
};

export default function ProjectsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', status, page],
    queryFn: () =>
      api.get('/api/projects', { params: { status: status || undefined, page, pageSize: 20 } })
        .then(r => r.data),
  });

  const projects: Project[] = data?.items ?? [];
  const total: number = data?.totalCount ?? 0;

  const totalValue = projects.reduce((s, p) => s + p.totalValue, 0);
  const totalPaid = projects.reduce((s, p) => s + p.paidAmount, 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">المشاريع</h1>
        <div className="text-sm text-gray-500">{total} مشروع</div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">إجمالي القيمة</p>
          <p className="text-xl font-bold text-brand-700 font-mono">{totalValue.toFixed(3)} د.ك</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">المحصّل</p>
          <p className="text-xl font-bold text-green-600 font-mono">{totalPaid.toFixed(3)} د.ك</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">المتبقي</p>
          <p className="text-xl font-bold text-orange-500 font-mono">{(totalValue - totalPaid).toFixed(3)} د.ك</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Planning', 'Active', 'OnHold', 'Completed'].map(s => (
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
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">لا توجد مشاريع</div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => {
            const pct = p.totalValue > 0 ? (p.paidAmount / p.totalValue) * 100 : 0;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-700">{p.code}</span>
                      {p.name && <span className="text-gray-600 text-sm">— {p.name}</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{p.customerName}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[p.status] ?? 'bg-gray-100'}`}>
                    {statusLabels[p.status] ?? p.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-400 text-xs">القيمة الكلية</p>
                    <p className="font-mono font-medium">{p.totalValue.toFixed(3)} د.ك</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">المحصّل</p>
                    <p className="font-mono font-medium text-green-600">{p.paidAmount.toFixed(3)} د.ك</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">المتبقي</p>
                    <p className="font-mono font-medium text-orange-500">{p.remainingAmount.toFixed(3)} د.ك</p>
                  </div>
                </div>

                {/* Payment progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>نسبة التحصيل</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 pt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">السابق</button>
          <span className="px-4 py-2 text-sm text-gray-600">صفحة {page}</span>
          <button disabled={projects.length < 20} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">التالي</button>
        </div>
      )}
    </div>
  );
}
