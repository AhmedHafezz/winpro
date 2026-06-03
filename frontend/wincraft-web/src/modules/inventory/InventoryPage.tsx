import { useState, useEffect } from 'react'

interface Item {
  id: string
  code: string
  name: string
  category: string
  unit: string
  qty: number
  minQty: number
  costPrice: number
  location: string
}

interface DB { items: Item[] }

const CATS = ['بروفايلات ألمنيوم', 'زجاج', 'مستلزمات', 'أختام', 'مسامير وتثبيت', 'أخرى']
const UNITS = ['كيلو', 'متر', 'قطعة', 'م²', 'لتر']

const SEED: Item[] = [
  { id: '1', code: 'AL-001', name: 'بروفايل باب منزلق 60 مم', category: 'بروفايلات ألمنيوم', unit: 'كيلو', qty: 450, minQty: 100, costPrice: 3.200, location: 'A-01' },
  { id: '2', code: 'AL-002', name: 'بروفايل نافذة مفردة 40 مم', category: 'بروفايلات ألمنيوم', unit: 'كيلو', qty: 280, minQty: 80, costPrice: 2.800, location: 'A-02' },
  { id: '3', code: 'GL-001', name: 'زجاج عادي 6 مم', category: 'زجاج', unit: 'م²', qty: 120, minQty: 30, costPrice: 4.500, location: 'B-01' },
  { id: '4', code: 'GL-002', name: 'زجاج مزدوج 24 مم', category: 'زجاج', unit: 'م²', qty: 65, minQty: 20, costPrice: 9.750, location: 'B-02' },
  { id: '5', code: 'SC-001', name: 'أختام سيليكون', category: 'أختام', unit: 'متر', qty: 800, minQty: 200, costPrice: 0.350, location: 'C-01' },
  { id: '6', code: 'SC-002', name: 'بروان أسود', category: 'أختام', unit: 'متر', qty: 40, minQty: 150, costPrice: 0.450, location: 'C-02' },
  { id: '7', code: 'AC-001', name: 'مسامير ستانلس 6×40', category: 'مسامير وتثبيت', unit: 'قطعة', qty: 2400, minQty: 500, costPrice: 0.020, location: 'D-01' },
  { id: '8', code: 'AC-002', name: 'شريط عازل', category: 'مستلزمات', unit: 'متر', qty: 90, minQty: 100, costPrice: 0.250, location: 'D-02' },
]

const load = (): DB => {
  try { return JSON.parse(localStorage.getItem('eva_inventory') || 'null') || { items: SEED } }
  catch { return { items: SEED } }
}
const save = (db: DB) => localStorage.setItem('eva_inventory', JSON.stringify(db))
const uid = () => Math.random().toString(36).slice(2, 9)

export default function InventoryPage() {
  const [db, setDb] = useState<DB>(load)
  const [tab, setTab] = useState<'list' | 'add'>('list')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [form, setForm] = useState<Partial<Item>>({})
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => save(db), [db])

  const items = db.items.filter(i =>
    (!catFilter || i.category === catFilter) &&
    (!search || i.name.includes(search) || i.code.includes(search))
  )

  const lowStock = db.items.filter(i => i.qty <= i.minQty)
  const totalValue = db.items.reduce((s, i) => s + i.qty * i.costPrice, 0)

  const saveItem = () => {
    if (!form.code || !form.name) return
    if (editing) {
      setDb(d => ({ items: d.items.map(i => i.id === editing ? { ...i, ...form } as Item : i) }))
      setEditing(null)
    } else {
      setDb(d => ({ items: [...d.items, { ...form, id: uid() } as Item] }))
    }
    setForm({})
    setTab('list')
  }

  const deleteItem = (id: string) => {
    if (confirm('حذف الصنف؟')) setDb(d => ({ items: d.items.filter(i => i.id !== id) }))
  }

  const startEdit = (item: Item) => {
    setForm(item)
    setEditing(item.id)
    setTab('add')
  }

  const adjustQty = (id: string, delta: number) => {
    setDb(d => ({ items: d.items.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i) }))
  }

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">إدارة المخزون</h1>
        <button onClick={() => { setForm({}); setEditing(null); setTab('add') }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700">
          + إضافة صنف
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الأصناف', val: db.items.length, color: 'text-blue-600' },
          { label: 'قيمة المخزون', val: `${totalValue.toFixed(3)} د.ك`, color: 'text-green-600' },
          { label: 'أصناف تحت الحد', val: lowStock.length, color: 'text-red-600' },
          { label: 'التصنيفات', val: CATS.length, color: 'text-purple-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          ⚠️ تنبيه: {lowStock.length} أصناف وصلت للحد الأدنى: {lowStock.map(i => i.name).join('، ')}
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        {(['list', 'add'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t === 'list' ? 'قائمة الأصناف' : editing ? 'تعديل صنف' : 'إضافة صنف'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="bg-white rounded-xl shadow">
          <div className="p-4 flex gap-3 border-b border-slate-100">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الكود..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="">كل التصنيفات</option>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {['الكود', 'الاسم', 'التصنيف', 'الكمية', 'الوحدة', 'سعر التكلفة', 'الموقع', 'الحالة', ''].map(h => (
                    <th key={h} className="text-right px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id} className={`hover:bg-slate-50 ${item.qty <= item.minQty ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => adjustQty(item.id, -10)} className="w-6 h-6 bg-slate-200 rounded text-xs hover:bg-slate-300">−</button>
                        <span className={`font-bold ${item.qty <= item.minQty ? 'text-red-600' : 'text-slate-800'}`}>{item.qty}</span>
                        <button onClick={() => adjustQty(item.id, 10)} className="w-6 h-6 bg-slate-200 rounded text-xs hover:bg-slate-300">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.unit}</td>
                    <td className="px-4 py-3 text-slate-700">{item.costPrice.toFixed(3)} د.ك</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.location}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.qty <= item.minQty ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {item.qty <= item.minQty ? 'منخفض' : 'متوفر'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(item)} className="text-blue-500 hover:text-blue-700 text-xs">تعديل</button>
                        <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-700 text-xs">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'add' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{editing ? 'تعديل صنف' : 'إضافة صنف جديد'}</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'كود الصنف', key: 'code', type: 'text' },
              { label: 'اسم الصنف', key: 'name', type: 'text' },
              { label: 'الكمية', key: 'qty', type: 'number' },
              { label: 'الحد الأدنى', key: 'minQty', type: 'number' },
              { label: 'سعر التكلفة (د.ك)', key: 'costPrice', type: 'number' },
              { label: 'الموقع', key: 'location', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                <input type={f.type} value={(form as Record<string, unknown>)[f.key] as string ?? ''}
                  onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">التصنيف</label>
              <select value={form.category ?? ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">اختر...</option>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الوحدة</label>
              <select value={form.unit ?? ''} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">اختر...</option>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={saveItem} className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-brand-700">
              {editing ? 'حفظ التعديلات' : 'إضافة الصنف'}
            </button>
            <button onClick={() => { setTab('list'); setForm({}); setEditing(null) }}
              className="border border-slate-200 px-6 py-2 rounded-lg text-sm hover:bg-slate-50">
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
