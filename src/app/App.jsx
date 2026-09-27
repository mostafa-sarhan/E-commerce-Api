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
import SellerProducts from "../pages/seller/products/SellerProducts";
import SellerInventory from "../pages/seller/inventory/SellerInventory";
import SellerOrders from "../pages/seller/orders/SellerOrders";
import SellerCustomers from "../pages/seller/customers/SellerCustomers";
import SellerReviews from "../pages/seller/reviews/SellerReviews";
import AdminDashboard from "../pages/admin/dashboard/AdminDashboard";
import AdminProducts from "../pages/admin/products/AdminProducts";

function PublicOnly({ children }) {
  const { user, role } = useAuth();
  if (user && role === "admin") return <Navigate to="/admin" replace />;
  if (user && role === "seller") return <Navigate to="/dashboard" replace />;
  return children;
}

function StorePage({ children }) {
  const { user, role } = useAuth();
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "seller") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppShell() {
  const { role } = useAuth();
  const managementMode = role === "seller" || role === "admin";

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

        <Route element={<ProtectedRoute roles={["customer"]} />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
        </Route>

        <Route element={<ProtectedRoute roles={["customer", "seller", "admin"]} />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route element={<ProtectedRoute roles={["customer", "seller"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route element={<ProtectedRoute roles={["seller"]} />}>
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/inventory" element={<SellerInventory />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/customers" element={<SellerCustomers />} />
          <Route path="/seller/reviews" element={<SellerReviews />} />
        </Route>

        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
        </Route>

        <Route path="*" element={<Navigate to={managementMode ? (role === "admin" ? "/admin" : "/dashboard") : "/"} replace />} />
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
