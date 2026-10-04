import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import useFavorite from "../../hooks/useFavorite";
import "./ProductCard.css";

function Rating({ value, count }) {
  return (
    <span className="store-card-rating">
      <svg
        className="store-card-star"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5l1.1-6.47-4.69-4.58 6.5-.95L12 2.6z"
          fill="currentColor"
        />
      </svg>

      <span className="store-card-rating-value">
        {Number(value || 0).toFixed(1)}
      </span>

      <span className="store-card-rating-count">
        {count ? `(${count})` : "(0)"}
      </span>
    </span>
  );
}

function MediaPlaceholder() {
  return (
    <span className="store-card-placeholder" aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <rect
          x="5"
          y="11"
          width="38"
          height="26"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="24"
          cy="24"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}

export default function ProductCard({ product }) {
  const { addProduct } = useCart();
  const { user } = useAuth();
  const { favorite, toggle } = useFavorite(product, user?.email);

  const [status, setStatus] = useState("idle");
  const [imageFailed, setImageFailed] = useState(false);

  const resetTimer = useRef(null);

  useEffect(
    () => () => {
      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current);
      }
    },
    [],
  );

  function scheduleReset() {
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
    }

    resetTimer.current = window.setTimeout(() => {
      setStatus("idle");
    }, 1800);
  }

  async function handleAddToCart() {
    try {
      await addProduct(product);
      setStatus("added");
    } catch {
      setStatus("error");
    }

    scheduleReset();
  }

  function handleFavorite(event) {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  }

  const productId = product._id || product.id;

  const stock = Number(product.quantity ?? product.stock ?? 0);

  const tracksStock =
    product.quantity !== undefined || product.stock !== undefined;

  const soldOut = tracksStock && stock <= 0;
  const lowStock = tracksStock && stock > 0 && stock <= 5;

  const oldPrice = product.oldPrice ?? product.priceBeforeDiscount ?? null;

  /* Labels stay short so a 2-up card at 320px never ellipsises */
  const actionLabel = soldOut
    ? "Out of stock"
    : status === "added"
      ? "Added ✓"
      : status === "error"
        ? "Not added"
        : "Add to Cart";

  return (
    <article className="store-card">
      <Link to={`/products/${productId}`} className="store-card-link">
        <div className="store-card-media">
          {imageFailed || !product.imageCover ? (
            <MediaPlaceholder />
          ) : (
            <img
              src={product.imageCover}
              alt={product.title}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>

        <div className="store-card-content">
          <p className="store-card-eyebrow">
            {product.category?.name || "Electronics"}
          </p>

          <h3 className="store-card-title">{product.title}</h3>

          <div className="store-card-meta">
            <span className="store-card-brand">
              {product.brand?.name || "Voltix"}
            </span>

            <Rating
              value={product.ratingsAverage}
              count={product.ratingsQuantity}
            />
          </div>

          <div className="store-card-price">
            <span className="store-card-price-now">${product.price}</span>

            {oldPrice ? (
              <span className="store-card-price-was">${oldPrice}</span>
            ) : null}
          </div>

          <div className="store-card-stock">
            {soldOut ? (
              <span className="store-card-chip is-out">Out of stock</span>
            ) : null}

            {lowStock ? (
              <span className="store-card-chip is-low">Only {stock} left</span>
            ) : null}
          </div>
        </div>
      </Link>

      <button
        type="button"
        className={`store-card-fav${favorite ? " is-active" : ""}`}
        onClick={handleFavorite}
        aria-pressed={favorite}
        aria-label={
          favorite
            ? `Remove ${product.title} from wishlist`
            : `Add ${product.title} to wishlist`
        }
        title={favorite ? "Remove from wishlist" : "Add to wishlist"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 20.3l-1.4-1.27C5.9 14.9 3.2 12.4 3.2 9.4c0-1.7 1.3-3 3-3 1.3 0 2.5.7 3.1 1.8l.3.6h3l.3-.6c.6-1.1 1.8-1.8 3.1-1.8 1.7 0 3 1.3 3 3 0 3-2.7 5.5-7.4 9.63L12 20.3z"
            fill={favorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="store-card-actions">
        <button
          type="button"
          className={`store-card-add is-${status}`}
          onClick={handleAddToCart}
          disabled={soldOut}
          aria-live="polite"
          title={
            soldOut
              ? "Out of stock"
              : status === "idle"
                ? "Add to cart"
                : actionLabel
          }
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
