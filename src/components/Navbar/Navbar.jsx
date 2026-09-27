import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import "./Navbar.css";
import voltixLogo from "../../assets/images/voltix-logo.svg";

function Navbar() {
  const { user, role, logout } = useAuth();
  const { cartItemsCount } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const managementRole = role === "seller" || role === "admin";

  return (
    <header className="navbar">
      <div className="nav-container">
       <Link
          to={role === "seller" ? "/dashboard" : role === "admin" ? "/admin" : "/"}
          className="logo"
        >
          <img src={voltixLogo} alt="Voltix" className="logo-image" />
        </Link>

        <nav>
          {!managementRole && (
            <>
              <Link to="/">Home</Link>
              <Link to="/products">Products</Link>
            </>
          )}

          {role === "customer" && (
            <>
              <Link to="/wishlist">Wishlist</Link>
              <Link to="/orders">Orders</Link>
              <Link to="/dashboard">Dashboard</Link>
            </>
          )}

          {role === "seller" && (
            <Link to="/dashboard">Dashboard</Link>
          )}

          {role === "admin" && (
            <>
              <Link to="/admin">Admin Dashboard</Link>
              <Link to="/admin/products">Products</Link>
            </>
          )}
        </nav>

        <div className="nav-actions">
          {role === "customer" && (
            <Link to="/cart" className="cart-button">
              🛒 Cart <span>{cartItemsCount}</span>
            </Link>
          )}

          {user ? (
            <>
              {role !== "seller" && (
                <Link to="/profile" className="profile-button">{user.name || "Profile"}</Link>
              )}
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </>
          ) : (
            <Link to="/login" className="login-button">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
