import { useState, useEffect } from 'react'

type DispatchStatus = 'معلق' | 'مجدول' | 'في الطريق' | 'تم التسليم' | 'مثبت'

interface DispatchOrder {
  id: string
  refNo: string
  clientName: string
  phone: string
  address: string
  projectRef: string
  status: DispatchStatus
  deliveryDate: string
  installDate: string
  crew: string
  vehicle: string
  items: DispatchItem[]
  notes: string
}

interface DispatchItem {
  id: string
  description: string
  qty: number
  done: boolean
}

interface DB { orders: DispatchOrder[] }

const STATUS_COLORS: Record<DispatchStatus, string> = {
  'معلق': 'bg-slate-100 text-slate-700',
  'مجدول': 'bg-blue-100 text-blue-700',
  'في الطريق': 'bg-yellow-100 text-yellow-700',
  'تم التسليم': 'bg-cyan-100 text-cyan-700',
  'مثبت': 'bg-green-100 text-green-700',
}

const CREWS = ['فريق أ - محمد وعلي', 'فريق ب - خالد وسامي', 'فريق ج - يوسف وعمر']
const VEHICLES = ['شاحنة 1 - د ج ك 100', 'شاحنة 2 - ه ه ه 200', 'بيك أب - ز ز ز 300']

const SEED: DispatchOrder[] = [
  {
    id: '1', refNo: 'DSP-001', clientName: 'شركة الخليج للمقاولات', phone: '96550001111',
    address: 'الكويت، حولي، شارع الرياض', projectRef: 'PRJ-2024-001',
    status: 'مجدول', deliveryDate: '2026-06-06', installDate: '2026-06-07',
    crew: 'فريق أ - محمد وعلي', vehicle: 'شاحنة 1 - د ج ك 100',
    items: [
      { id: 'i1', description: 'نوافذ منزلقة 150×120', qty: 6, done: false },
      { id: 'i2', description: 'باب رئيسي ألمنيوم', qty: 1, done: false },
    ],
    notes: 'التسليم صباحاً قبل 10',
  },
  {
    id: '2', refNo: 'DSP-002', clientName: 'مؤسسة النور', phone: '96560002222',
    address: 'الكويت، السالمية', projectRef: 'PRJ-2024-002',
    status: 'مثبت', deliveryDate: '2026-06-01', installDate: '2026-06-02',
    crew: 'فريق ب - خالد وسامي', vehicle: 'شاحنة 2 - ه ه ه 200',
    items: [
      { id: 'i1', description: 'أبواب ألمنيوم متأرجحة', qty: 4, done: true },
    ],
    notes: '',
  },
  {
    id: '3', refNo: 'DSP-003', clientName: 'فيلا الأندلس', phone: '96599003333',
    address: 'الكويت، الرقة', projectRef: 'PRJ-2024-003',
    status: 'في الطريق', deliveryDate: '2026-06-03', installDate: '2026-06-04',
    crew: 'فريق ج - يوسف وعمر', vehicle: 'بيك أب - ز ز ز 300',
    items: [
      { id: 'i1', description: 'شبابيك ألمنيوم ثابتة', qty: 8, done: false },
      { id: 'i2', description: 'مظلة مدخل', qty: 1, done: false },
    ],
    notes: 'التركيب في الحديقة الخلفية',
  },
]

const load = (): DB => {
  try { return JSON.parse(localStorage.getItem('eva_dispatch') || 'null') || { orders: SEED } }
  catch { return { orders: SEED } }
}
const save = (db: DB) => localStorage.setItem('eva_dispatch', JSON.stringify(db))
const uid = () => Math.random().toString(36).slice(2, 9)

export default function DispatchPage() {
  const [db, setDb] = useState<DB>(load)
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list')
  const [selected, setSelected] = useState<DispatchOrder | null>(null)
  const [form, setForm] = useState<Partial<DispatchOrder>>({})
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => save(db), [db])

  useEffect(() => {
    const raw = localStorage.getItem("wincraft_intent");
    if (!raw) return;
    try {
      const intent = JSON.parse(raw);
      if (intent.type === "new_dispatch" && intent.project) {
        const p = intent.project;
        const newOrder: DispatchOrder = {
          id: uid(), refNo: `DSP-${String(db.orders.length + 1).padStart(3, "0")}`,
          clientName: p.customer, phone: p.phone || "", address: p.city || "",
          projectRef: p.id, status: "معلق",
          deliveryDate: "", installDate: "",
          crew: CREWS[0], vehicle: VEHICLES[0],
          items: [], notes: `من المشروع ${p.id}`,
        };
        setDb(d => ({ orders: [...d.orders, newOrder] }));
        setSelected(newOrder);
        setView("detail");
        localStorage.removeItem("wincraft_intent");
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orders = db.orders.filter(o => !statusFilter || o.status === statusFilter)

  const counts = (['معلق', 'مجدول', 'في الطريق', 'تم التسليم', 'مثبت'] as DispatchStatus[]).map(s => ({
    label: s, count: db.orders.filter(x => x.status === s).length, color: STATUS_COLORS[s],
  }))

  const saveOrder = () => {
    if (!form.clientName || !form.deliveryDate) return
    const order: DispatchOrder = {
      id: uid(), refNo: `DSP-${String(db.orders.length + 1).padStart(3, '0')}`,
      clientName: form.clientName ?? '', phone: form.phone ?? '',
      address: form.address ?? '', projectRef: form.projectRef ?? '',
      status: 'معلق', deliveryDate: form.deliveryDate ?? '', installDate: form.installDate ?? '',
      crew: form.crew ?? CREWS[0], vehicle: form.vehicle ?? VEHICLES[0],
      items: [], notes: form.notes ?? '',
    }
    setDb(d => ({ orders: [...d.orders, order] }))
    setForm({})
    setView('list')
  }

  const changeStatus = (id: string, status: DispatchStatus) => {
    setDb(d => ({ orders: d.orders.map(o => o.id === id ? { ...o, status } : o) }))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  const toggleItem = (orderId: string, itemId: string) => {
    setDb(d => ({
      orders: d.orders.map(o => o.id === orderId
        ? { ...o, items: o.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) }
        : o
      )
    }))
    if (selected?.id === orderId) {
      setSelected(prev => prev ? {
        ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i)
      } : null)
    }
  }

  const deleteOrder = (id: string) => {
    if (confirm('حذف أمر التسليم؟')) {
      setDb(d => ({ orders: d.orders.filter(o => o.id !== id) }))
      setView('list')
    }
  }

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">التسليم والتركيب</h1>
        <button onClick={() => { setForm({}); setView('form') }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700">
          + أمر تسليم جديد
        </button>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {counts.map(c => (
          <button key={c.label} onClick={() => setStatusFilter(statusFilter === c.label ? '' : c.label)}
            className={`bg-white rounded-xl shadow p-3 text-right transition-all ${statusFilter === c.label ? 'ring-2 ring-brand-500' : ''}`}>
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{c.count}</p>
          </button>
        ))}
      </div>

      {view === 'list' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {['المرجع', 'العميل', 'تاريخ التسليم', 'تاريخ التركيب', 'الفريق', 'الحالة', ''].map(h => (
                  <th key={h} className="text-right px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{o.refNo}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{o.clientName}</p>
                    <p className="text-xs text-slate-500">{o.address}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.deliveryDate}</td>
                  <td className="px-4 py-3 text-slate-600">{o.installDate}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{o.crew}</td>
                  <td className="px-4 py-3">
                    <select value={o.status}
                      onChange={e => changeStatus(o.id, e.target.value as DispatchStatus)}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${STATUS_COLORS[o.status]}`}>
                      {(['معلق', 'مجدول', 'في الطريق', 'تم التسليم', 'مثبت'] as DispatchStatus[]).map(st => (
                        <option key={st}>{st}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelected(o); setView('detail') }}
                        className="text-blue-500 hover:text-blue-700 text-xs">عرض</button>
                      <button onClick={() => deleteOrder(o.id)}
                        className="text-red-500 hover:text-red-700 text-xs">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'form' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-slate-800 mb-4">أمر تسليم جديد</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'اسم العميل', key: 'clientName', type: 'text' },
              { label: 'رقم الهاتف', key: 'phone', type: 'text' },
              { label: 'العنوان', key: 'address', type: 'text' },
              { label: 'مرجع المشروع', key: 'projectRef', type: 'text' },
              { label: 'تاريخ التسليم', key: 'deliveryDate', type: 'date' },
              { label: 'تاريخ التركيب', key: 'installDate', type: 'date' },
              { label: 'ملاحظات', key: 'notes', type: 'text' },
            ].map(f => (
              <div key={f.key} className={f.key === 'address' || f.key === 'notes' ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                <input type={f.type} value={(form as Record<string, unknown>)[f.key] as string ?? ''}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الفريق</label>
              <select value={form.crew ?? ''} onChange={e => setForm(p => ({ ...p, crew: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">اختر...</option>
                {CREWS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">المركبة</label>
              <select value={form.vehicle ?? ''} onChange={e => setForm(p => ({ ...p, vehicle: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">اختر...</option>
                {VEHICLES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={saveOrder} className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-brand-700">
              حفظ الأمر
            </button>
            <button onClick={() => setView('list')} className="border border-slate-200 px-6 py-2 rounded-lg text-sm hover:bg-slate-50">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {view === 'detail' && selected && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{selected.clientName}</h2>
              <p className="text-sm text-slate-500">{selected.refNo} • {selected.address}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selected.status]}`}>
                {selected.status}
              </span>
              <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            {[
              { label: 'تاريخ التسليم', val: selected.deliveryDate },
              { label: 'تاريخ التركيب', val: selected.installDate },
              { label: 'الفريق', val: selected.crew },
              { label: 'المركبة', val: selected.vehicle },
            ].map(r => (
              <div key={r.label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs">{r.label}</p>
                <p className="font-medium text-slate-800 mt-0.5">{r.val}</p>
              </div>
            ))}
          </div>
          {selected.items.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <p className="text-sm font-medium text-slate-700 px-4 py-2 bg-slate-50">قائمة البنود</p>
              {selected.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2 border-t border-slate-100">
                  <input type="checkbox" checked={item.done}
                    onChange={() => toggleItem(selected.id, item.id)}
                    className="w-4 h-4 accent-brand-600" />
                  <span className={`flex-1 text-sm ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.description}
                  </span>
                  <span className="text-xs text-slate-500">الكمية: {item.qty}</span>
                </div>
              ))}
            </div>
          )}
          {selected.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
              <strong>ملاحظات: </strong>{selected.notes}
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {(['مجدول', 'في الطريق', 'تم التسليم', 'مثبت'] as DispatchStatus[]).map(st => (
              <button key={st} onClick={() => changeStatus(selected.id, st)}
                disabled={selected.status === st}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selected.status === st ? 'bg-slate-200 text-slate-400' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
                {st}
              </button>
            ))}
            <button onClick={() => deleteOrder(selected.id)}
              className="mr-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200">
              حذف
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
