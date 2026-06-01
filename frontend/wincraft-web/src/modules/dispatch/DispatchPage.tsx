import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../core/api/axios';

interface Dispatch {
  id: string;
  projectId: string;
  projectCode: string;
  customerName: string;
  status: string;
  scheduledDate?: string;
  driverName?: string;
  vehicleNo?: string;
  notes?: string;
  createdAt: string;
}

interface Installation {
  id: string;
  projectCode: string;
  customerName: string;
  status: string;
  scheduledDate?: string;
  technicianName?: string;
  progress?: number;
  createdAt: string;
}

const dispatchStatusColors: Record<string, string> = {
  Scheduled: 'bg-gray-100 text-gray-700',
  InTransit: 'bg-blue-100 text-blue-700',
  Delivered: 'bg-purple-100 text-purple-700',
  Confirmed: 'bg-green-100 text-green-700',
};

const installStatusColors: Record<string, string> = {
  Scheduled: 'bg-gray-100 text-gray-700',
  InProgress: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  SignedOff: 'bg-purple-100 text-purple-700',
};

const dispatchLabels: Record<string, string> = {
  Scheduled: 'مجدولة',
  InTransit: 'في الطريق',
  Delivered: 'تم التسليم',
  Confirmed: 'مؤكدة',
};

const installLabels: Record<string, string> = {
  Scheduled: 'مجدولة',
  InProgress: 'جارية',
  Completed: 'مكتملة',
  SignedOff: 'موقّعة',
};

export default function DispatchPage() {
  const [tab, setTab] = useState<'dispatch' | 'install'>('dispatch');
  const [page, setPage] = useState(1);

  const { data: dispatchData, isLoading: dLoading } = useQuery({
    queryKey: ['dispatches', page],
    queryFn: () => api.get('/api/dispatches', { params: { page, pageSize: 20 } }).then(r => r.data),
    enabled: tab === 'dispatch',
  });

  const { data: installData, isLoading: iLoading } = useQuery({
    queryKey: ['installations', page],
    queryFn: () => api.get('/api/installations', { params: { page, pageSize: 20 } }).then(r => r.data),
    enabled: tab === 'install',
  });

  const dispatches: Dispatch[] = dispatchData?.items ?? [];
  const installations: Installation[] = installData?.items ?? [];
  const isLoading = tab === 'dispatch' ? dLoading : iLoading;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">العمليات الميدانية</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setTab('dispatch'); setPage(1); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'dispatch' ? 'bg-white shadow text-brand-700' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🚚 الشحن والتسليم
        </button>
        <button
          onClick={() => { setTab('install'); setPage(1); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'install' ? 'bg-white shadow text-brand-700' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔧 التركيب
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'dispatch' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-600">المشروع</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">العميل</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">السائق</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">رقم المركبة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">موعد التسليم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dispatches.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">لا توجد شحنات</td></tr>
              ) : dispatches.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-brand-700 font-medium">{d.projectCode}</td>
                  <td className="px-4 py-3 text-gray-800">{d.customerName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${dispatchStatusColors[d.status] ?? 'bg-gray-100'}`}>
                      {dispatchLabels[d.status] ?? d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.driverName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{d.vehicleNo || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString('ar-KW') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {installations.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">لا توجد مهام تركيب</div>
          ) : installations.map(i => (
            <div key={i.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-brand-700">{i.projectCode}</p>
                  <p className="text-sm text-gray-500">{i.customerName}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${installStatusColors[i.status] ?? 'bg-gray-100'}`}>
                  {installLabels[i.status] ?? i.status}
                </span>
              </div>
              {i.technicianName && (
                <p className="text-sm text-gray-600">الفني: <span className="font-medium">{i.technicianName}</span></p>
              )}
              {i.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>التقدم</span>
                    <span>{i.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${i.progress === 100 ? 'bg-green-500' : 'bg-brand-600'}`}
                      style={{ width: `${i.progress}%` }}
                    />
                  </div>
                </div>
              )}
              {i.scheduledDate && (
                <p className="text-xs text-gray-400">
                  {new Date(i.scheduledDate).toLocaleDateString('ar-KW')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
