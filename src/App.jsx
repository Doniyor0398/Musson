import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PinGate } from './features/auth/PinGate';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LoadingScreen } from './components/ui/LoadingScreen/LoadingScreen';
const SessionDetailPage = lazy(() => import('./pages/SessionDetailPage'));
const DefrostPage = lazy(() => import('./pages/DefrostPage'));

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const KitchenPage = lazy(() => import('./pages/KitchenPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const CleanersPage = lazy(() => import('./pages/CleanersPage'));
const GoodsPage = lazy(() => import('./pages/GoodsPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const InventoryZonePage = lazy(() => import('./pages/InventoryZonePage'));

const AdminPage = lazy(() => import('./pages/AdminPage'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen text="Загрузка..." />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/kitchen" element={<ProtectedRoute><KitchenPage /></ProtectedRoute>} />
        <Route path="/kitchen/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/kitchen/cleaners" element={<ProtectedRoute><CleanersPage /></ProtectedRoute>} />
        <Route path="/kitchen/goods" element={<ProtectedRoute><GoodsPage /></ProtectedRoute>} />
        <Route path="/kitchen/defrost" element={<ProtectedRoute><DefrostPage /></ProtectedRoute>} />
        <Route path="/kitchen/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
        <Route path="/kitchen/inventory/:zone" element={<ProtectedRoute><InventoryZonePage /></ProtectedRoute>} />

        <Route
          path="/kitchen/admin"
          element={
            <ProtectedRoute>
              <PinGate section="kitchen" backTo="/kitchen">
                <AdminPage />
              </PinGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen/admin/report/:sessionId"
          element={
            <ProtectedRoute>
              <PinGate section="kitchen" backTo="/kitchen">
                <SessionDetailPage />
              </PinGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bar/admin"
          element={
            <ProtectedRoute>
              <PinGate section="bar" backTo="/">
                <AdminPage />
              </PinGate>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;