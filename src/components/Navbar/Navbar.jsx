import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import voltixLogo from "../../assets/images/voltix-logo.svg";
import WishlistPanel from "./WishlistPanel";
import "./Navbar.css";

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

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const { cartItemsCount } = useCart();
  const { user } = useAuth();

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

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

          {user && (
          <NavLink
              to="/dashboard"
              className="site-nav-link"
              onClick={closeMenu}
            >
              Dashboard
            </NavLink>
          )}

          <WishlistPanel
            userEmail={user?.email}
            onNavigate={closeMenu}
          />

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

          <div className="site-nav-actions">
          {user ? (
            <Link
              to="/profile"
              className="site-action-profile"
              onClick={closeMenu}
              title="My Profile"
              aria-label="My Profile"
            >
              👤
            </Link>
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