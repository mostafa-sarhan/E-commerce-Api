
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">

        {/* Brand */}
        <div className="footer-brand">
          <h2>Voltix</h2>
          <p>
            Your modern marketplace for discovering products you love.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3>Quick Links</h3>

          <Link to="/products">Products</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/orders">Orders</Link>
        </div>

        {/* Customer Service */}
        <div>
          <h3>Customer Service</h3>

          {/* These will be connected to the AI Bot later */}
          <button type="button" className="footer-action">
            Contact Us
          </button>

          <button type="button" className="footer-action">
            Help Center
          </button>

          <Link to="/returns">Returns</Link>
        </div>

      </div>

      <div className="footer-bottom">
        © 2026 Voltix. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
