import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import AIChatWidget from "../components/AIChat/AIChatWidget";
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


/* Only the credential screens are admin-exclusive: there is no point
   showing a signed-in admin the login or register form. Storefront
   pages are deliberately NOT wrapped - an admin is still allowed to
   browse Home, Products and Wishlist, and the customer-only areas
   below already bounce an admin to /admin through ProtectedRoute. */
function PublicOnly({ children }) {
  const { user, role } = useAuth();
  if (user && role === "admin") return <Navigate to="/admin" replace />;
  return children;
}

function AppShell() {
  const { role } = useAuth();
  const managementMode = role === "admin";

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />

        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
        <Route path="/cart" element={<Cart />} />

        {/* The favourites store is owner-scoped, so a signed-out
            visitor has a device wishlist too. Guests get the page
            on the same terms as the guest cart. */}
        <Route path="/wishlist" element={<Wishlist />} />

        <Route element={<ProtectedRoute roles={["customer"]} />}>
          <Route path="/checkout" element={<Checkout />} />
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

      {/* Storefront-only, on the same guard as the footer, so it stays
          out of the admin area. */}
      {!managementMode && <AIChatWidget />}
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