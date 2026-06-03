import { useState, useEffect } from 'react'

type SurveyStatus = 'مجدولة' | 'جارية' | 'مكتملة' | 'ملغاة'

interface Survey {
  id: string
  refNo: string
  clientName: string
  phone: string
  address: string
  type: string
  status: SurveyStatus
  date: string
  time: string
  engineer: string
  notes: string
  rooms: RoomMeasure[]
}

interface RoomMeasure {
  id: string
  name: string
  items: MeasureItem[]
}

interface MeasureItem {
  id: string
  description: string
  width: number
  height: number
  qty: number
  notes: string
}

interface DB { surveys: Survey[] }

const STATUS_COLORS: Record<SurveyStatus, string> = {
  'مجدولة': 'bg-blue-100 text-blue-700',
  'جارية': 'bg-yellow-100 text-yellow-700',
  'مكتملة': 'bg-green-100 text-green-700',
  'ملغاة': 'bg-red-100 text-red-700',
}

const ENGINEERS = ['أحمد محمد', 'سامي خالد', 'يوسف علي', 'عمر حسن']
const TYPES = ['نوافذ', 'أبواب', 'واجهات زجاجية', 'مظلات', 'متنوع']

const SEED: Survey[] = [
  {
    id: '1', refNo: 'SRV-001', clientName: 'شركة الخليج للمقاولات', phone: '96550001111',
    address: 'الكويت، حولي، شارع الرياض', type: 'نوافذ', status: 'مجدولة',
    date: '2026-06-05', time: '10:00', engineer: 'أحمد محمد',
    notes: 'معاينة مبنى تجاري طابقين',
    rooms: [{ id: 'r1', name: 'الطابق الأول', items: [{ id: 'i1', description: 'نافذة مزدوجة', width: 1.5, height: 1.2, qty: 6, notes: '' }] }],
  },
  {
    id: '2', refNo: 'SRV-002', clientName: 'مؤسسة النور', phone: '96560002222',
    address: 'الكويت، السالمية', type: 'أبواب', status: 'مكتملة',
    date: '2026-06-01', time: '09:00', engineer: 'سامي خالد',
    notes: 'تركيب أبواب ألمنيوم',
    rooms: [],
  },
  {
    id: '3', refNo: 'SRV-003', clientName: 'برج الفردوس السكني', phone: '96599003333',
    address: 'الكويت، الجابرية', type: 'واجهات زجاجية', status: 'جارية',
    date: '2026-06-03', time: '11:00', engineer: 'يوسف علي',
    notes: 'واجهة زجاجية كاملة للمدخل',
    rooms: [],
  },
]

const load = (): DB => {
  try { return JSON.parse(localStorage.getItem('eva_surveys') || 'null') || { surveys: SEED } }
  catch { return { surveys: SEED } }
}
const save = (db: DB) => localStorage.setItem('eva_surveys', JSON.stringify(db))
const uid = () => Math.random().toString(36).slice(2, 9)

export default function SurveysPage() {
  const [db, setDb] = useState<DB>(load)
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list')
  const [selected, setSelected] = useState<Survey | null>(null)
  const [form, setForm] = useState<Partial<Survey>>({})
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => save(db), [db])

  const surveys = db.surveys.filter(s => !statusFilter || s.status === statusFilter)

  const counts = (['مجدولة', 'جارية', 'مكتملة', 'ملغاة'] as SurveyStatus[]).map(s => ({
    label: s, count: db.surveys.filter(x => x.status === s).length, color: STATUS_COLORS[s],
  }))

  const saveSurvey = () => {
    if (!form.clientName || !form.date) return
    const survey: Survey = {
      id: uid(), refNo: `SRV-${String(db.surveys.length + 1).padStart(3, '0')}`,
      clientName: form.clientName ?? '', phone: form.phone ?? '',
      address: form.address ?? '', type: form.type ?? 'نوافذ',
      status: 'مجدولة', date: form.date ?? '', time: form.time ?? '09:00',
      engineer: form.engineer ?? ENGINEERS[0], notes: form.notes ?? '', rooms: [],
    }
    setDb(d => ({ surveys: [...d.surveys, survey] }))
    setForm({})
    setView('list')
  }

  const changeStatus = (id: string, status: SurveyStatus) => {
    setDb(d => ({ surveys: d.surveys.map(s => s.id === id ? { ...s, status } : s) }))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  const deleteSurvey = (id: string) => {
    if (confirm('حذف المعاينة؟')) {
      setDb(d => ({ surveys: d.surveys.filter(s => s.id !== id) }))
      setView('list')
    }
  }

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">إدارة المعاينات</h1>
        <button onClick={() => { setForm({}); setView('form') }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700">
          + معاينة جديدة
        </button>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {counts.map(c => (
          <button key={c.label} onClick={() => setStatusFilter(statusFilter === c.label ? '' : c.label)}
            className={`bg-white rounded-xl shadow p-4 text-right transition-all ${statusFilter === c.label ? 'ring-2 ring-brand-500' : ''}`}>
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{c.count}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${c.color}`}>{c.label}</span>
          </button>
        ))}
      </div>

      {view === 'list' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {['رقم المرجع', 'العميل', 'النوع', 'التاريخ', 'المهندس', 'الحالة', ''].map(h => (
                  <th key={h} className="text-right px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {surveys.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.refNo}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.clientName}</p>
                    <p className="text-xs text-slate-500">{s.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.type}</td>
                  <td className="px-4 py-3 text-slate-600">{s.date} {s.time}</td>
                  <td className="px-4 py-3 text-slate-600">{s.engineer}</td>
                  <td className="px-4 py-3">
                    <select value={s.status}
                      onChange={e => changeStatus(s.id, e.target.value as SurveyStatus)}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${STATUS_COLORS[s.status]}`}>
                      {(['مجدولة', 'جارية', 'مكتملة', 'ملغاة'] as SurveyStatus[]).map(st => (
                        <option key={st}>{st}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelected(s); setView('detail') }}
                        className="text-blue-500 hover:text-blue-700 text-xs">عرض</button>
                      <button onClick={() => deleteSurvey(s.id)}
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
          <h2 className="text-lg font-bold text-slate-800 mb-4">معاينة جديدة</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'اسم العميل', key: 'clientName', type: 'text' },
              { label: 'رقم الهاتف', key: 'phone', type: 'text' },
              { label: 'العنوان', key: 'address', type: 'text' },
              { label: 'تاريخ المعاينة', key: 'date', type: 'date' },
              { label: 'الوقت', key: 'time', type: 'time' },
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
              <label className="block text-sm font-medium text-slate-700 mb-1">نوع العمل</label>
              <select value={form.type ?? ''} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">اختر...</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">المهندس المسؤول</label>
              <select value={form.engineer ?? ''} onChange={e => setForm(p => ({ ...p, engineer: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">اختر...</option>
                {ENGINEERS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={saveSurvey} className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-brand-700">
              حفظ المعاينة
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
              <p className="text-sm text-slate-500">{selected.refNo} • {selected.date} {selected.time}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selected.status]}`}>
                {selected.status}
              </span>
              <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'الهاتف', val: selected.phone },
              { label: 'العنوان', val: selected.address },
              { label: 'نوع العمل', val: selected.type },
              { label: 'المهندس', val: selected.engineer },
            ].map(r => (
              <div key={r.label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs">{r.label}</p>
                <p className="font-medium text-slate-800 mt-0.5">{r.val}</p>
              </div>
            ))}
          </div>
          {selected.notes && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>ملاحظات: </strong>{selected.notes}
            </div>
          )}
          <div className="flex gap-3 mt-4">
            {(['مجدولة', 'جارية', 'مكتملة'] as SurveyStatus[]).map(st => (
              <button key={st} onClick={() => changeStatus(selected.id, st)}
                disabled={selected.status === st}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium ${selected.status === st ? 'bg-slate-200 text-slate-400' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
                {st}
              </button>
            ))}
            <button onClick={() => deleteSurvey(selected.id)}
              className="mr-auto px-4 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200">
              حذف
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
