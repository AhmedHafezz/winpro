import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../core/api/axios';

interface InventoryItem {
  id: string;
  code: string;
  name?: string;
  nameAr?: string;
  category?: string;
  unit?: string;
  price: number;
  minStock: number;
  currentStock: number;
  location?: string;
  isLowStock: boolean;
  isActive: boolean;
}

export default function InventoryPage() {
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', category, lowStock, page],
    queryFn: () =>
      api.get('/api/inventory', {
        params: { category: category || undefined, lowStock: lowStock || undefined, page, pageSize: 20 }
      }).then(r => r.data),
  });

  const items: InventoryItem[] = data?.items ?? [];
  const total: number = data?.totalCount ?? 0;
  const lowStockCount = items.filter(i => i.isLowStock).length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المخزون</h1>
          {lowStockCount > 0 && (
            <p className="text-sm text-red-600 mt-0.5">⚠️ {lowStockCount} صنف وصل للحد الأدنى</p>
          )}
        </div>
        <button
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + إضافة صنف
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="text"
          placeholder="فلتر التصنيف..."
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={e => { setLowStock(e.target.checked); setPage(1); }}
            className="rounded accent-red-500"
          />
          مخزون منخفض فقط
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الكود</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الاسم</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">التصنيف</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الوحدة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الرصيد</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الحد الأدنى</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">السعر</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">لا توجد أصناف</td>
                </tr>
              ) : items.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.isLowStock ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3 font-mono text-brand-700 font-medium">{item.code}</td>
                  <td className="px-4 py-3 text-gray-800">{item.nameAr || item.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.unit || '—'}</td>
                  <td className={`px-4 py-3 font-medium ${item.isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                    {item.currentStock.toFixed(3)}
                    {item.isLowStock && <span className="mr-1 text-xs">⚠️</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.minStock.toFixed(3)}</td>
                  <td className="px-4 py-3 font-mono text-gray-800">{item.price.toFixed(3)} د.ك</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">
            السابق
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">صفحة {page} من {Math.ceil(total / 20)}</span>
          <button disabled={items.length < 20} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
