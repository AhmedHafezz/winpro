import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './core/auth/ProtectedRoute'
import { AppShell } from './core/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CustomersPage } from './modules/crm/CustomersPage'
import { QuotationsPage } from './modules/quotation/QuotationsPage'
import { BomPage } from './modules/bom/BomPage'
import WorkOrdersPage from './modules/shopfloor/WorkOrdersPage'
import InventoryPage from './modules/inventory/InventoryPage'
import ProjectsPage from './modules/projects/ProjectsPage'
import SurveysPage from './modules/survey/SurveysPage'
import DispatchPage from './modules/dispatch/DispatchPage'
import { DesignConfigurator } from './modules/design/DesignConfigurator'

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
          <Route path="/designs" element={<ProtectedRoute permission="design.view" />}>
            <Route index element={<DesignConfigurator />} />
          </Route>
          <Route path="/bom" element={<ProtectedRoute permission="design.view" />}>
            <Route index element={<BomPage />} />
          </Route>
          <Route path="/work-orders" element={<ProtectedRoute permission="production.view" />}>
            <Route index element={<WorkOrdersPage />} />
          </Route>
          <Route path="/inventory" element={<ProtectedRoute permission="warehouse.view" />}>
            <Route index element={<InventoryPage />} />
          </Route>
          <Route path="/projects" element={<ProtectedRoute permission="project.view" />}>
            <Route index element={<ProjectsPage />} />
          </Route>
          <Route path="/surveys" element={<ProtectedRoute permission="survey.view" />}>
            <Route index element={<SurveysPage />} />
          </Route>
          <Route path="/dispatch" element={<ProtectedRoute permission="install.view" />}>
            <Route index element={<DispatchPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
