import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import KitchenPage from './pages/KitchenPage';
import ProductsPage from './pages/ProductsPage';
import CleanersPage from './pages/CleanersPage';
import GoodsPage from './pages/GoodsPage';
import { PinGate } from './features/auth/PinGate';
import { ProtectedRoute } from './features/auth/ProtectedRoute';

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
        path="/kitchen/cleaners"
        element={
          <ProtectedRoute>
            <CleanersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/kitchen/goods"
        element={
          <ProtectedRoute>
            <GoodsPage />
          </ProtectedRoute>
        }
      />

      {/* Заготовка на будущее для бара */}
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
  );
}

export default App;