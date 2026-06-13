// Cross-module data reader — all modules store data in localStorage
// Call getSystemStats() to get live aggregated numbers from every module

interface CRMData { customers: { status: string }[]; deals: { stage: string; value: number; probability: number }[]; activities: { done: boolean }[] }
interface QuotData { quotations: { status: string; discount: number; items: { qty: number; unitPrice: number }[] }[] }
interface ProjData { projects: { status: string; designs: { price: number; qty: number }[] }[] }
interface SFData   { orders: { status: string }[] }
interface InvData  { items: { qty: number; minQty: number }[] }
interface SrvData  { surveys: { status: string }[] }
interface DspData  { orders: { status: string }[] }

const rd = <T>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback }
  catch { return fallback }
}

const quotTotal = (q: QuotData['quotations'][number]) => {
  const sub = q.items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  return sub * (1 - q.discount / 100)
}

export function getSystemStats() {
  const crm  = rd<CRMData>('eva_crm', { customers: [], deals: [], activities: [] })
  const quot = rd<QuotData>('eva_quotation_hub', { quotations: [] })
  const proj = rd<ProjData>('eva_project_hub', { projects: [] })
  const sf   = rd<SFData>('eva_shopfloor', { orders: [] })
  const inv  = rd<InvData>('eva_inventory', { items: [] })
  const srv  = rd<SrvData>('eva_surveys', { surveys: [] })
  const dsp  = rd<DspData>('eva_dispatch', { orders: [] })

  const totalQuotValue  = quot.quotations.reduce((s, q) => s + quotTotal(q), 0)
  const totalProjValue  = proj.projects.reduce((s, p) => s + p.designs.reduce((ss, d) => ss + d.price * d.qty, 0), 0)
  const weightedPipeline = crm.deals.filter(d => !['won','lost'].includes(d.stage))
    .reduce((s, d) => s + d.value * (d.probability / 100), 0)

  return {
    // CRM
    customers:         crm.customers.length,
    activeCustomers:   crm.customers.filter(c => c.status === 'active' || c.status === 'vip').length,
    openDeals:         crm.deals.filter(d => !['won','lost'].includes(d.stage)).length,
    pipeline:          weightedPipeline,
    pendingActivities: crm.activities.filter(a => !a.done).length,
    // Quotations
    quotations:        quot.quotations.length,
    sentQuotations:    quot.quotations.filter(q => q.status === 'sent').length,
    acceptedQuotations:quot.quotations.filter(q => q.status === 'accepted').length,
    totalQuotValue,
    // Projects
    projects:          proj.projects.length,
    activeProjects:    proj.projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length,
    completedProjects: proj.projects.filter(p => p.status === 'Completed').length,
    totalProjValue,
    // Shop Floor
    workOrders:        sf.orders.length,
    pendingWO:         sf.orders.filter(o => o.status === 'pending').length,
    inProgressWO:      sf.orders.filter(o => ['cutting','assembly','finishing'].includes(o.status)).length,
    doneWO:            sf.orders.filter(o => o.status === 'done').length,
    // Inventory
    inventoryItems:    inv.items.length,
    lowStockItems:     inv.items.filter(i => i.qty <= i.minQty).length,
    // Surveys
    surveys:           srv.surveys.length,
    pendingSurveys:    srv.surveys.filter(s => s.status === 'مجدولة' || s.status === 'جارية').length,
    // Dispatch
    dispatchOrders:    dsp.orders.length,
    pendingDispatch:   dsp.orders.filter(o => o.status !== 'مثبت').length,
  }
}
