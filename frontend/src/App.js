import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ── Public website ─────────────────────────────────────────────────────────
import WebsitePage from './pages/WebsitePage';

// ── Platform pages ─────────────────────────────────────────────────────────
import LoginPage       from './pages/LoginPage';
import DashboardLayout from './components/platform/dashboard/DashboardLayout';
import OverviewPage    from './pages/OverviewPage';
import ProjectsPage    from './pages/ProjectsPage';
import GISPage         from './pages/GISPage';
import IoTPage         from './pages/IoTPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import AIPage          from './pages/AIPage';
import AdminPage       from './pages/AdminPage';

// ── Route guard ────────────────────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, canAccess } = useAuth();
  if (!isAuthenticated) return <Navigate to="/app/login" replace />;
  if (roles && !canAccess(roles)) return <Navigate to="/app" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* ── Public website ─────────────────────────────────────────────── */}
      <Route path="/" element={<WebsitePage />} />

      {/* ── Platform login ─────────────────────────────────────────────── */}
      <Route
        path="/app/login"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <LoginPage />}
      />

      {/* ── Platform dashboard (all under /app) ────────────────────────── */}
      <Route
        path="/app"
        element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
      >
        <Route index                  element={<OverviewPage />} />
        <Route path="projects"        element={<ProjectsPage />} />
        <Route path="gis"             element={<GISPage />} />
        <Route path="iot"             element={<IoTPage />} />
        <Route path="twin"            element={<ProtectedRoute roles={['admin','manager']}><DigitalTwinPage /></ProtectedRoute>} />
        <Route path="ai"              element={<AIPage />} />
        <Route path="admin"           element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
      </Route>

      {/* ── Catch-all ──────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
