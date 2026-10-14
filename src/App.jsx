import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import KitchenPage from './pages/KitchenPage';
import ProductsPage from './pages/ProductsPage';
import CleanersPage from './pages/CleanersPage';
import GoodsPage from './pages/GoodsPage';
import InventoryPage from './pages/InventoryPage';
import InventoryZonePage from './pages/InventoryZonePage';
import InventoryHistoryPage from './pages/InventoryHistoryPage';
import { PinGate } from './features/auth/PinGate';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LoadingScreen } from './components/ui/LoadingScreen/LoadingScreen';

// Lazy load AdminPage — грузится ТОЛЬКО после ввода PIN
const AdminPage = lazy(() => import('./pages/AdminPage'));

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={<ProtectedRoute><HomePage /></ProtectedRoute>}
      />

      <Route
        path="/kitchen"
        element={<ProtectedRoute><KitchenPage /></ProtectedRoute>}
      />

      <Route
        path="/kitchen/products"
        element={<ProtectedRoute><ProductsPage /></ProtectedRoute>}
      />

      <Route
        path="/kitchen/cleaners"
        element={<ProtectedRoute><CleanersPage /></ProtectedRoute>}
      />

      <Route
        path="/kitchen/goods"
        element={<ProtectedRoute><GoodsPage /></ProtectedRoute>}
      />

      <Route
        path="/kitchen/inventory"
        element={<ProtectedRoute><InventoryPage /></ProtectedRoute>}
      />

      <Route
        path="/kitchen/inventory/history"
        element={
          <ProtectedRoute>
            <InventoryHistoryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/kitchen/inventory/:zone"
        element={<ProtectedRoute><InventoryZonePage /></ProtectedRoute>}
      />

      <Route
        path="/kitchen/admin"
        element={
          <ProtectedRoute>
            <PinGate section="kitchen" backTo="/kitchen">
              <Suspense fallback={<LoadingScreen text="Открываем админку..." />}>
                <AdminPage />
              </Suspense>
            </PinGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bar/admin"
        element={
          <ProtectedRoute>
            <PinGate section="bar" backTo="/">
              <Suspense fallback={<LoadingScreen text="Открываем админку..." />}>
                <AdminPage />
              </Suspense>
            </PinGate>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;