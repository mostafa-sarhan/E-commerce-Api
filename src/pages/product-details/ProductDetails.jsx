import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { getProductById } from "../../services/api/productApi";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../services/api/wishlistApi";
import { getProductReviews, addReview } from "../../services/api/reviewApi";
import useFavorite from "../../hooks/useFavorite";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

import "./ProductDetails.css";

const SWIPE_THRESHOLD = 45;

function normalizeReview(item) {
  return {
    ...item,
    ratings: Number(item.ratings ?? item.rating ?? item.rate ?? 0),
    title: item.title ?? item.comment ?? item.review ?? "",
    user: item.user || item.userId || { name: "Customer" },
  };
}

function Stars({ value = 0, size = "md" }) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));

  return (
    <span
      className={`pdp-stars is-${size}`}
      role="img"
      aria-label={`${rounded} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <svg
          key={step}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          className={step <= rounded ? "pdp-star is-on" : "pdp-star"}
        >
          <path
            d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5l1.1-6.47-4.69-4.58 6.5-.95L12 2.6z"
            fill="currentColor"
          />
        </svg>
      ))}
    </span>
  );
}

function GalleryPlaceholder() {
  return (
    <span className="pdp-placeholder" aria-hidden="true">
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

function ChevronIcon({ direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={`pdp-gallery-arrow-icon is-${direction}`}
    >
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const { addProduct } = useCart();
  const { user, role } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [review, setReview] = useState({
    ratings: 5,
    title: "",
  });
  const [galleryState, setGalleryState] = useState({
    productKey: id,
    index: 0,
    failed: false,
  });
  const [feedback, setFeedback] = useState(null);

  const touchStartX = useRef(null);

  const productKey = product?._id || product?.id || id;
  const { favorite, toggle } = useFavorite(product, user?.email);

  // Resolved during render so a product swap never shows the
  // previous product's image index or broken-image state.
  const sameProduct = galleryState.productKey === productKey;
  const activeImage = sameProduct ? galleryState.index : 0;
  const imageFailed = sameProduct ? galleryState.failed : false;

  const gallery = useMemo(() => {
    const source = [product?.imageCover, ...(product?.images || [])].filter(
      Boolean,
    );

    const unique = [...new Set(source)];

    return unique.length ? unique : [];
  }, [product]);

  const average = useMemo(
    () =>
      reviews.length
        ? reviews.reduce((sum, item) => sum + item.ratings, 0) / reviews.length
        : Number(product?.ratingsAverage || 0),
    [reviews, product],
  );

  const reviewCount = reviews.length || product?.ratingsQuantity || 0;

  const stock = Number(product?.quantity ?? product?.stock ?? 0);

  const tracksStock =
    product?.quantity !== undefined || product?.stock !== undefined;

  const soldOut = Boolean(tracksStock && stock <= 0);
  const lowStock = Boolean(tracksStock && stock > 0 && stock <= 5);

  const oldPrice = product?.oldPrice ?? product?.priceBeforeDiscount ?? null;

  const discount =
    oldPrice && Number(oldPrice) > Number(product?.price)
      ? Math.round((1 - Number(product.price) / Number(oldPrice)) * 100)
      : null;

  useEffect(() => {
    loadProduct();
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, role, user?.email]);

  async function loadProduct() {
    setLoading(true);

    try {
      const data = await getProductById(id);
      setProduct(data.data);
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    try {
      const data = await getProductReviews(id);

      const remote = (
        data.data || data.results || []
      ).map(normalizeReview);

      const unique = [
        ...new Map(
          remote.map((item) => [
            item._id ||
              `${item.user?.name}-${item.createdAt}-${item.title}`,
            item,
          ])
        ).values(),
      ];

      setReviews(unique);
    } catch {
      setReviews([]);
    }
  }

  function goToImage(next) {
    const total = gallery.length;

    if (!total) {
      return;
    }

    setGalleryState({
      productKey,
      index: (next + total) % total,
      failed: false,
    });
  }

  function selectImage(index) {
    setGalleryState({
      productKey,
      index,
      failed: false,
    });
  }

  function markImageFailed() {
    setGalleryState((current) => ({
      productKey,
      index: current.productKey === productKey ? current.index : 0,
      failed: true,
    }));
  }

  function handleGalleryKeyDown(event) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToImage(activeImage + 1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToImage(activeImage - 1);
    }
  }

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null) {
      return;
    }

    const distance = event.changedTouches[0].clientX - touchStartX.current;

    touchStartX.current = null;

    if (Math.abs(distance) < SWIPE_THRESHOLD) {
      return;
    }

    goToImage(activeImage + (distance < 0 ? 1 : -1));
  }

  async function handleAddToCart() {
    if (role === "admin") {
      setFeedback({
        tone: "info",
        text: "Shopping is available on customer accounts.",
      });
      return;
    }

    try {
      await addProduct(product);
      setFeedback({
        tone: "ok",
        text: "Added to cart ✓",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error?.message || "Could not add to cart.",
      });
    }
  }

  async function handleWishlist() {
    const nowFavorite = toggle();
    const productId = product?._id || product?.id;

    try {
      if (role === "customer" && productId) {
        if (nowFavorite) {
          await addToWishlist(productId);
        } else {
          await removeFromWishlist(productId);
        }
      }

      setFeedback({
        tone: "ok",
        text: nowFavorite
          ? "Saved to your wishlist."
          : "Removed from your wishlist.",
      });
    } catch {
      setFeedback({
        tone: "error",
        text: "Wishlist is unavailable right now.",
      });
    }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();

    if (!user) {
      setFeedback({
        tone: "info",
        text: "Sign in to add a review.",
      });
      return;
    }

    if (!review.title.trim()) {
      setFeedback({
        tone: "error",
        text: "Please write your review.",
      });
      return;
    }

    const payload = {
      ratings: Number(review.ratings),
      title: review.title.trim(),
    };

    try {
      const response = await addReview(id, payload);

      setReview({ ratings: 5, title: "" });
      await loadReviews();

      setFeedback({
        tone: "ok",
        text: "Thanks for your review.",
      });

      return response;
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error?.message || "Could not add review.",
      });
    }
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (loading) {
    return (
      <main className="pdp pdp-is-loading">
        <div className="voltix-container">
          <p className="loading">Loading...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="empty-state">
        <h2>Product not found.</h2>
        <p>This product is no longer in the catalogue.</p>
      </main>
    );
  }

  const currentImage = gallery[activeImage] || "";

  const infoRows = [
    { label: "Brand", value: product.brand?.name },
    { label: "Category", value: product.category?.name },
    {
      label: "Subcategory",
      value:
        typeof product.subcategory === "string"
          ? product.subcategory
          : product.subcategory?.name,
    },
    {
      label: "Availability",
      value: tracksStock
        ? stock > 0
          ? `${stock} in stock`
          : "Out of stock"
        : null,
    },
    {
      label: "Rating",
      value: product.ratingsQuantity
        ? `${Number(product.ratingsAverage || 0).toFixed(1)} from ${
            product.ratingsQuantity
          } reviews`
        : "No reviews yet",
    },
  ].filter((row) => row.value);

  return (
    <main className="pdp">
      <div className="voltix-container">
        <nav className="pdp-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/products">Products</Link>
          {product.category?.name ? (
            <>
              <span aria-hidden="true">/</span>
              <span className="pdp-crumb-current">{product.category.name}</span>
            </>
          ) : null}
        </nav>

        <div className="pdp-top">
          {/* ---------------- GALLERY ---------------- */}
          <div className="pdp-gallery">
            <div
              className="pdp-stage"
              role="group"
              aria-label="Product images"
              tabIndex={0}
              onKeyDown={handleGalleryKeyDown}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {imageFailed || !currentImage ? (
                <GalleryPlaceholder />
              ) : (
                <img
                  className="pdp-stage-image"
                  src={currentImage}
                  alt={product.title}
                  onError={markImageFailed}
                />
              )}

              {gallery.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="pdp-gallery-arrow is-prev"
                    aria-label="Previous image"
                    onClick={() => goToImage(activeImage - 1)}
                  >
                    <ChevronIcon direction="prev" />
                  </button>

                  <button
                    type="button"
                    className="pdp-gallery-arrow is-next"
                    aria-label="Next image"
                    onClick={() => goToImage(activeImage + 1)}
                  >
                    <ChevronIcon direction="next" />
                  </button>

                  <span className="pdp-counter">
                    {activeImage + 1} / {gallery.length}
                  </span>
                </>
              ) : null}
            </div>

            {gallery.length > 1 ? (
              <div className="pdp-thumbs">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`pdp-thumb${
                      index === activeImage ? " is-active" : ""
                    }`}
                    aria-label={`Show image ${index + 1}`}
                    aria-current={index === activeImage ? true : undefined}
                    onClick={() => selectImage(index)}
                  >
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* ---------------- INFO ---------------- */}
          <div className="pdp-info">
            <p className="pdp-eyebrow">
              {product.brand?.name || "Voltix"}
              {product.category?.name ? ` · ${product.category.name}` : ""}
            </p>

            <h1 className="pdp-title">{product.title}</h1>

            <div className="pdp-rating">
              <Stars value={average} />
              <strong>{average.toFixed(1)}</strong>
              <span>({reviewCount} reviews)</span>
            </div>

            <div className="pdp-price">
              <span className="pdp-price-now">${product.price}</span>

              {oldPrice ? (
                <span className="pdp-price-was">${oldPrice}</span>
              ) : null}

              {discount ? (
                <span className="pdp-price-off">Save {discount}%</span>
              ) : null}
            </div>

            <div className="pdp-availability">
              {soldOut ? (
                <span className="pdp-stock is-out">Out of stock</span>
              ) : null}

              {lowStock ? (
                <span className="pdp-stock is-low">Only {stock} left</span>
              ) : null}

              {!soldOut && !lowStock && tracksStock ? (
                <span className="pdp-stock is-in">In stock</span>
              ) : null}
            </div>

            {product.description ? (
              <p className="pdp-summary">{product.description}</p>
            ) : null}

            <div className="pdp-actions">
              <button
                type="button"
                className="pdp-add"
                onClick={handleAddToCart}
                disabled={soldOut}
              >
                {soldOut ? "Out of stock" : "Add to Cart"}
              </button>

              <button
                type="button"
                className={`pdp-fav${favorite ? " is-active" : ""}`}
                onClick={handleWishlist}
                aria-pressed={favorite}
                aria-label={
                  favorite ? "Remove from wishlist" : "Add to wishlist"
                }
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

                <span>{favorite ? "Saved" : "Wishlist"}</span>
              </button>
            </div>

            {feedback ? (
              <p className={`pdp-feedback is-${feedback.tone}`} role="status">
                {feedback.text}
              </p>
            ) : null}

            <ul className="pdp-promises">
              <li>Secure checkout</li>
              <li>Cash on delivery</li>
              <li>1-year warranty</li>
            </ul>
          </div>
        </div>

        {/* ---------------- LOWER ---------------- */}
        <div className="pdp-lower">
          <section className="pdp-details">
            <h2 className="pdp-section-title">Product Details</h2>

            {product.description ? (
              <div className="pdp-description">
                {product.description
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            ) : (
              <p className="pdp-description">
                No additional description was provided for this product.
              </p>
            )}
          </section>

          <aside className="pdp-meta">
            <h2 className="pdp-section-title">Product information</h2>

            <dl className="pdp-meta-list">
              {infoRows.map((row) => (
                <div className="pdp-meta-row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>

            {product.brand?.image ? (
              <div className="pdp-meta-brand">
                <img
                  src={product.brand.image}
                  alt={product.brand.name || "Brand"}
                  loading="lazy"
                />
              </div>
            ) : null}
          </aside>
        </div>

        {/* ---------------- REVIEWS ---------------- */}
        <section className="pdp-reviews">
          <div className="pdp-reviews-head">
            <div>
              <h2 className="pdp-section-title">Reviews &amp; Ratings</h2>

              <div className="pdp-review-summary">
                <Stars value={average} />
                <strong>{average.toFixed(1)}</strong>
                <span>Based on {reviewCount} customer reviews</span>
              </div>
            </div>
          </div>

          {user ? (
            <form className="pdp-review-form" onSubmit={handleReviewSubmit}>
              <div className="pdp-rating-picker">
                <label htmlFor="pdp-rating">Your rating</label>

                <select
                  id="pdp-rating"
                  value={review.ratings}
                  onChange={(event) =>
                    setReview({
                      ...review,
                      ratings: Number(event.target.value),
                    })
                  }
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Terrible</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Write your review..."
                value={review.title}
                onChange={(event) =>
                  setReview({
                    ...review,
                    title: event.target.value,
                  })
                }
                required
              />

              <button type="submit">Submit Review</button>
            </form>
          ) : (
            <p className="pdp-review-gate">
              <Link to="/login">Sign in</Link> to leave a review.
            </p>
          )}

          <div className="pdp-review-list">
            {reviews.length === 0 ? (
              <p className="pdp-review-empty">
                No customer reviews yet. Be the first.
              </p>
            ) : (
              reviews.map((item) => (
                <article
                  className="pdp-review"
                  key={
                    item._id ||
                    `${item.user?.name || "customer"}-${item.createdAt || ""}-${
                      item.title || ""
                    }`
                  }
                >
                  <div className="pdp-review-top">
                    <div>
                      <strong>{item.user?.name || "Customer"}</strong>

                      {item.createdAt ? (
                        <small>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </small>
                      ) : null}
                    </div>

                    <div className="pdp-review-score">
                      <Stars value={item.ratings} size="sm" />
                      <b>{item.ratings}/5</b>
                    </div>
                  </div>

                  <p>{item.title || "No written comment."}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
