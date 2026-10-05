import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import {
  getUserOrders,
  toOrderArray,
} from "../../services/api/orderApi";
import {
  getFavorites,
  subscribeFavorites,
} from "../../services/favorites";
import voltixLogo from "../../assets/images/voltix-logo.svg";
import "./Navbar.css";

const GUEST_OWNER = "guest";

function CartIcon() {
  return (
    <svg
      className="site-nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 4h2.2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.5L21 8H6.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="10"
        cy="20"
        r="1.6"
        fill="currentColor"
      />
      <circle
        cx="18"
        cy="20"
        r="1.6"
        fill="currentColor"
      />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg
      className="site-nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 20.3l-1.4-1.27C5.9 14.9 3.2 12.4 3.2 9.4c0-1.7 1.3-3 3-3 1.3 0 2.5.7 3.1 1.8l.3.6h3l.3-.6c.6-1.1 1.8-1.8 3.1-1.8 1.7 0 3 1.3 3 3 0 3-2.7 5.5-7.4 9.63L12 20.3z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function OrdersIcon() {
  return (
    <svg
      className="site-nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6.2 7h11.6l1.1 12.1a1.5 1.5 0 0 1-1.5 1.65H6.6A1.5 1.5 0 0 1 5.1 19.1L6.2 7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9 9.6h6M9 13h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg
      className="site-nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 17l5-5-5-5M21 12H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function useWishlistCount(userEmail) {
  const email = userEmail || "";
  const owner = email || GUEST_OWNER;

  const [snapshot, setSnapshot] = useState(() => ({
    owner,
    count: getFavorites(email).length,
  }));

  useEffect(
    () =>
      subscribeFavorites(() => {
        setSnapshot({
          owner,
          count: getFavorites(email).length,
        });
      }),
    [owner, email],
  );

  return snapshot.owner === owner
    ? snapshot.count
    : getFavorites(email).length;
}


function useOrdersCount(user, canViewOrders) {
  const userId = user?._id || "";

  const [fetched, setFetched] = useState({
    userId: "",
    count: 0,
  });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!canViewOrders || !userId) {
      return;
    }

    let active = true;

    getUserOrders(userId)
      .then((data) => {
        if (!active) {
          return;
        }

        setFetched({
          userId,
          count: toOrderArray(data).length,
        });
      })
      .catch((error) => {
        console.warn(
          "[navbar] could not read the order count:",
          error?.message
        );

        if (!active) {
          return;
        }

        setFetched({ userId, count: 0 });

        if (attempt === 0) {
          setAttempt(1);
        }
      });

    return () => {
      active = false;
    };
  }, [userId, canViewOrders, attempt]);

  return canViewOrders && fetched.userId === userId
    ? fetched.count
    : 0;
}

function Navbar() {
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const { cartItemsCount } = useCart();
  const { user, role, logout } = useAuth();

  const wishlistCount = useWishlistCount(user?.email);

  /* /orders is a customer route, so an admin header never offers it. */
  const canViewOrders = !!user && role === "customer";

  const ordersCount = useOrdersCount(user, canViewOrders);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  function handleLogout() {
    closeMenu();
    logout();
    navigate("/login", { replace: true });
  }

  const toggleMenu = () => {
    setIsMenuOpen((open) => !open);
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isMenuOpen]);

  return (
    <header className="site-header">
      <div className="voltix-container site-header-inner">
        <Link
          to="/"
          className="site-logo"
          aria-label="Voltix home"
          onClick={closeMenu}
        >
          <img
            src={voltixLogo}
            alt="Voltix"
            className="site-logo-image"
          />
        </Link>

        <button
          type="button"
          className="site-menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          aria-controls="site-nav-panel"
          onClick={toggleMenu}
        >
          <span className="site-menu-bar"></span>
          <span className="site-menu-bar"></span>
          <span className="site-menu-bar"></span>
        </button>

        <nav
          id="site-nav-panel"
          aria-label="Main"
          className={`site-nav ${
            isMenuOpen ? "is-open" : ""
          }`}
        >

          {user && (
          <NavLink
              to={role === "admin" ? "/admin" : "/dashboard"}
              className="site-nav-link"
              onClick={closeMenu}
            >
              {role === "admin" ? "Admin" : "Dashboard"}
            </NavLink>
          )}
          <NavLink
            to="/"
            end
            className="site-nav-link"
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/products"
            className="site-nav-link"
            onClick={closeMenu}
          >
            Products
          </NavLink>




          <NavLink
            to="/wishlist"
            className="site-nav-link site-nav-link-wishlist"
            onClick={closeMenu}
            aria-label={
              wishlistCount > 0
                ? `Wishlist, ${wishlistCount} saved`
                : "Wishlist"
            }
          >
            <HeartIcon filled={wishlistCount > 0} />

            <span>Wishlist</span>

            {wishlistCount > 0 && (
              <span className="site-nav-count">
                {wishlistCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/cart"
            className="site-nav-link site-nav-link-cart"
            onClick={closeMenu}
          >
            <CartIcon />

            <span>Cart</span>

            {cartItemsCount > 0 && (
              <span className="site-nav-count">
                {cartItemsCount}
              </span>
            )}
          </NavLink>

          {ordersCount > 0 && (
            <NavLink
              to="/orders"
              className="site-nav-link site-nav-link-orders"
              onClick={closeMenu}
              aria-label={`Orders, ${ordersCount} placed`}
            >
              <OrdersIcon />

              <span>Orders</span>

              <span className="site-nav-count">
                {ordersCount}
              </span>
            </NavLink>
          )}

          <div className="site-nav-actions">
          {user ? (
            <>
              <Link
                to="/profile"
                className="site-action-profile"
                onClick={closeMenu}
                title="My Profile"
                aria-label="My Profile"
              >
                👤
              </Link>

              {/* Signing out is the session teardown AuthContext
                  already owns: it drops the stored token and user and
                  nulls the context user. The navbar sits on public
                  routes too, which no guard would redirect, so the
                  hop to /login is explicit here. */}
              <button
                type="button"
                className="site-action-logout"
                onClick={handleLogout}
              >
                <LogOutIcon />

                <span>Log Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="site-action-login"
                onClick={closeMenu}
              >
                Login
              </Link>

              <Link
                to="/register"
                className="site-action-register"
                onClick={closeMenu}
              >
                Register
              </Link>
            </>
          )}
        </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;