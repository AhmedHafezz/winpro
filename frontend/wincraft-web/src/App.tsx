import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './core/auth/ProtectedRoute'
import { AppShell } from './core/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CustomersPage } from './modules/crm/CustomersPage'
import { QuotationsPage } from './modules/quotation/QuotationsPage'
import { BomPage } from './modules/bom/BomPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<div className="p-8 text-red-500">غير مصرح لك بالوصول</div>} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/crm" element={<ProtectedRoute permission="crm.view" />}>
            <Route index element={<CustomersPage />} />
          </Route>
          <Route path="/quotations" element={<ProtectedRoute permission="quote.view" />}>
            <Route index element={<QuotationsPage />} />
          </Route>
          <Route path="/bom" element={<ProtectedRoute permission="design.view" />}>
            <Route index element={<BomPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
