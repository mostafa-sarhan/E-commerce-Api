import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Home from "../pages/home/Home";
import Products from "../pages/products/Products";
import ProductDetails from "../pages/product-details/ProductDetails";
import Login from "../pages/auth/Login/Login";
import Register from "../pages/auth/Register/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Cart from "../pages/cart/Cart";
import Checkout from "../pages/checkout/Checkout";
import Wishlist from "../pages/wishlist/Wishlist";
import Orders from "../pages/orders/Orders";
import Profile from "../pages/profile/Profile";
import Dashboard from "../pages/dashboard/Dashboard";
import AdminDashboard from "../pages/admin/dashboard/AdminDashboard";
import AdminProducts from "../pages/admin/products/AdminProducts";

function PublicOnly({ children }) {
  const { user, role } = useAuth();
  if (user && role === "admin") return <Navigate to="/admin" replace />;
  return children;
}

function StorePage({ children }) {
  const { user, role } = useAuth();
  if (role === "admin") return <Navigate to="/admin" replace />;
  return children;
}

function AppShell() {
  const { role } = useAuth();
  const managementMode = role === "admin";

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<PublicOnly><Home /></PublicOnly>} />
        <Route path="/products" element={<StorePage><Products /></StorePage>} />
        <Route path="/products/:id" element={<StorePage><ProductDetails /></StorePage>} />

        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />

        {/* Cart can be filled as a guest. Placing the order
            requires an account, so checkout is behind the guard. */}
        <Route path="/cart" element={<Cart />} />

        <Route element={<ProtectedRoute roles={["customer"]} />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
        </Route>

        <Route path="*" element={<Navigate to={managementMode ? "/admin" : "/"} replace />} />
      </Routes>
      {!managementMode && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}