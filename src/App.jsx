import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage      from './pages/LoginPage';
import HealthOverview from './pages/HealthOverview';
import HivePage       from './pages/HivePage';
import FinancePage    from './pages/FinancePage';
import UploadPage     from './pages/UploadPage';
import ComparePage    from './pages/ComparePage';
import CalendarPage   from './pages/CalendarPage';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useApp();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isLoggedIn, dataLoaded } = useApp();

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">🐝</span>
        <p className="font-fredoka text-2xl text-honey-600">Loading BuzzTracker…</p>
        <div className="w-48 h-1.5 bg-amber-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login"    element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/"         element={<ProtectedRoute><HealthOverview /></ProtectedRoute>} />
      <Route path="/hive/:id" element={<ProtectedRoute><HivePage /></ProtectedRoute>} />
      <Route path="/finance"  element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
      <Route path="/upload"   element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
      <Route path="/compare"  element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
