import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }  from './context/AuthContext';
import { CartProvider }           from './context/CartContext';
import { SocketProvider }         from './context/SocketContext';
import Navbar                     from './components/Navbar';
import NotificationToasts         from './components/NotificationToasts';
import './index.css';

import LandingPage          from './pages/LandingPage';
import LoginPage            from './pages/LoginPage';
import SignupPage           from './pages/SignupPage';
import MarketplacePage      from './pages/MarketplacePage';
import CartPage             from './pages/CartPage';
import BuyerOrdersPage      from './pages/BuyerOrdersPage';
import SellerListingsPage   from './pages/SellerListingsPage';
import SellerOrdersPage     from './pages/SellerOrdersPage';
import TransporterDashboard from './pages/TransporterDashboard';
import AdminDashboard       from './pages/AdminDashboard';
import AdminVerifications   from './pages/AdminVerifications';
import AdminOrders          from './pages/AdminOrders';

// Route guard — checks auth and optional role
const Guard = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'80vh' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// Inner wraps everything that needs socket + cart context
function Inner() {
  const { user, token } = useAuth();
  return (
    <SocketProvider user={user} token={token}>
      <CartProvider>
        <Navbar />
        <NotificationToasts />
        <Routes>
          {/* Public */}
          <Route path="/"       element={<LandingPage />} />
          <Route path="/login"  element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupPage />} />

          {/* Buyer */}
          <Route path="/marketplace"  element={<Guard roles={['buyer','seller']}><MarketplacePage /></Guard>} />
          <Route path="/cart"         element={<Guard roles={['buyer']}><CartPage /></Guard>} />
          <Route path="/buyer/orders" element={<Guard roles={['buyer']}><BuyerOrdersPage /></Guard>} />

          {/* Seller */}
          <Route path="/seller/listings" element={<Guard roles={['seller']}><SellerListingsPage /></Guard>} />
          <Route path="/seller/orders"   element={<Guard roles={['seller']}><SellerOrdersPage /></Guard>} />

          {/* Transporter */}
          <Route path="/transporter" element={<Guard roles={['transporter']}><TransporterDashboard /></Guard>} />

          {/* Admin */}
          <Route path="/admin"                element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
          <Route path="/admin/verifications"  element={<Guard roles={['admin']}><AdminVerifications /></Guard>} />
          <Route path="/admin/orders"         element={<Guard roles={['admin']}><AdminOrders /></Guard>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </CartProvider>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Inner />
      </AuthProvider>
    </BrowserRouter>
  );
}
