import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './core/auth/ProtectedRoute'
import { AppShell } from './core/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { BomPage } from './modules/bom/BomPage'
import InventoryPage from './modules/inventory/InventoryPage'
import ProjectHub from './modules/projects/ProjectHub'
import SurveysPage from './modules/survey/SurveysPage'
import DispatchPage from './modules/dispatch/DispatchPage'
import { DesignConfigurator } from './modules/design/DesignConfigurator'
import Visualizer3D from './modules/design/Visualizer3D'
import ShopFloor from './modules/shopfloor/ShopFloor'
import QuotationHub from './modules/quotation/QuotationHub'
import CRMPage from './modules/crm/CRMPage'
import ReportsPage from './pages/ReportsPage'
import ProfilesPage from './pages/ProfilesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<div className="p-8 text-red-500">غير مصرح لك بالوصول</div>} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* redirects for old API routes */}
          <Route path="/crm" element={<Navigate to="/crm-hub" replace />} />
          <Route path="/quotations" element={<Navigate to="/quotation-hub" replace />} />
          <Route path="/work-orders" element={<Navigate to="/shop-floor" replace />} />
          <Route path="/projects" element={<Navigate to="/project-hub" replace />} />

          <Route path="/crm-hub" element={<ProtectedRoute permission="crm.view" />}>
            <Route index element={<CRMPage />} />
          </Route>
          <Route path="/quotation-hub" element={<ProtectedRoute permission="quote.view" />}>
            <Route index element={<QuotationHub />} />
          </Route>
          <Route path="/designs" element={<ProtectedRoute permission="design.view" />}>
            <Route index element={<DesignConfigurator />} />
          </Route>
          <Route path="/visualizer" element={<ProtectedRoute permission="design.view" />}>
            <Route index element={<Visualizer3D />} />
          </Route>
          <Route path="/bom" element={<ProtectedRoute permission="design.view" />}>
            <Route index element={<BomPage />} />
          </Route>
          <Route path="/profiles" element={<ProtectedRoute permission="design.view" />}>
            <Route index element={<ProfilesPage />} />
          </Route>
          <Route path="/project-hub" element={<ProtectedRoute permission="project.view" />}>
            <Route index element={<ProjectHub />} />
          </Route>
          <Route path="/shop-floor" element={<ProtectedRoute permission="production.view" />}>
            <Route index element={<ShopFloor />} />
          </Route>
          <Route path="/inventory" element={<ProtectedRoute permission="warehouse.view" />}>
            <Route index element={<InventoryPage />} />
          </Route>
          <Route path="/surveys" element={<ProtectedRoute permission="survey.view" />}>
            <Route index element={<SurveysPage />} />
          </Route>
          <Route path="/dispatch" element={<ProtectedRoute permission="install.view" />}>
            <Route index element={<DispatchPage />} />
          </Route>
          <Route path="/reports" element={<ProtectedRoute permission="reports.view" />}>
            <Route index element={<ReportsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
