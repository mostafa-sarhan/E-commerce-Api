import { useEffect, useMemo, useState } from "react";

import {
  Navigate,
  useParams,
} from "react-router-dom";

import {
  getProductById,
} from "../../services/api/productApi";

import {
  addToWishlist,
} from "../../services/api/wishlistApi";

import {
  getProductReviews,
  addReview,
} from "../../services/api/reviewApi";

import {
  getSellerProductById,
  getProductLocalReviews,
  addLocalReview,
  getLocalWishlist,
  saveLocalWishlist,
} from "../../services/localStore";

import { useCart } from "../../context/CartContext";

import { useAuth } from "../../context/AuthContext";

import "./ProductDetails.css";

function normalizeReview(item) {
  return {
    ...item,
    ratings: Number(
      item.ratings ??
        item.rating ??
        item.rate ??
        0
    ),
    title:
      item.title ??
      item.comment ??
      item.review ??
      "",
    user:
      item.user ||
      item.userId || {
        name: "Customer",
      },
  };
}

function Stars({ value = 0 }) {
  const n = Math.max(
    0,
    Math.min(
      5,
      Math.round(Number(value) || 0)
    )
  );

  return (
    <span
      className="stars"
      aria-label={`${n} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map(
        (i) => (
          <span
            key={i}
            className={
              i <= n
                ? "filled"
                : "empty"
            }
          >
            ★
          </span>
        )
      )}
    </span>
  );
}

export default function ProductDetails() {
  const { id } = useParams();

  const { addProduct } =
    useCart();

  const { user, role } =
    useAuth();

  const [product, setProduct] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [reviews, setReviews] =
    useState([]);

  const [review, setReview] =
    useState({
      ratings: 5,
      title: "",
    });

  useEffect(() => {
    loadProduct();
    loadReviews();
  }, [id, role, user?.email]);

  async function loadProduct() {
    setLoading(true);

    try {
      try {
        const data =
          await getProductById(id);

        setProduct(data.data);
      } catch {
        setProduct(
          getSellerProductById(id) ||
            null
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    const local =
      getProductLocalReviews(id).map(
        normalizeReview
      );

    if (
      String(id).startsWith("local-")
    ) {
      setReviews(local);
      return;
    }

    try {
      const data =
        await getProductReviews(id);

      const remote = (
        data.data ||
        data.results ||
        []
      ).map(normalizeReview);

      const merged = [
        ...remote,
        ...local,
      ];

      const unique = [
        ...new Map(
          merged.map((r) => [
            r._id ||
              `${r.user?.name}-${r.createdAt}-${r.title}`,
            r,
          ])
        ).values(),
      ];

      setReviews(unique);
    } catch {
      setReviews(local);
    }
  }

  async function handleAddToCart() {
    if (!user) {
      return alert(
        "Please login first."
      );
    }

    if (role !== "customer") {
      return;
    }

    try {
      await addProduct(product);

      alert(
        "Product added to cart"
      );
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleWishlist() {
    if (
      !user ||
      role !== "customer"
    ) {
      return;
    }

    const productId =
      product?._id ||
      product?.id;

    const isLocalProduct =
      !product?._id ||
      String(productId).startsWith(
        "local-"
      );

    try {
      if (isLocalProduct) {
        const current =
          getLocalWishlist(
            user.email
          );

        const exists =
          current.some(
            (item) =>
              String(
                item._id ||
                  item.id
              ) ===
              String(productId)
          );

        if (!exists) {
          saveLocalWishlist(
            user.email,
            [
              product,
              ...current,
            ]
          );
        }
      } else {
        await addToWishlist(
          productId
        );
      }

      alert(
        "Product added to wishlist"
      );
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();

    if (!user) {
      return alert(
        "Please login to add a review."
      );
    }

    if (!review.title.trim()) {
      return alert(
        "Please write your review."
      );
    }

    const payload = {
      ratings: Number(
        review.ratings
      ),
      title:
        review.title.trim(),
    };

    try {
      let saved = null;

      if (
        role === "customer" &&
        !String(id).startsWith(
          "local-"
        )
      ) {
        try {
          const response =
            await addReview(
              id,
              payload
            );

          saved =
            response.data ||
            response.review ||
            null;
        } catch {}
      }

      addLocalReview(
        normalizeReview(
          saved || {
            _id: `local-review-${Date.now()}`,
            productId: id,
            product,
            user: {
              _id: user._id,
              name:
                user.name ||
                user.email,
            },
            ...payload,
            createdAt:
              new Date().toISOString(),
          }
        )
      );

      setReview({
        ratings: 5,
        title: "",
      });

      await loadReviews();

      alert(
        "Review added successfully."
      );
    } catch (error) {
      alert(
        error.message ||
          "Could not add review."
      );
    }
  }

  if (role === "seller") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  if (role === "admin") {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  const average = useMemo(
    () =>
      reviews.length
        ? reviews.reduce(
            (s, r) =>
              s + r.ratings,
            0
          ) / reviews.length
        : Number(
            product?.ratingsAverage ||
              0
          ),
    [reviews, product]
  );

  if (loading) {
    return (
      <main className="product-details">
        <div className="loading">
          Loading...
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="empty-state">
        <h2>
          Product not found.
        </h2>

        <p>
          This product is not part of
          your seller catalog.
        </p>
      </main>
    );
  }

  const productId =
    product._id ||
    product.id;

  const isSellerView = false;

  return (
    <main className="product-details">
      <div className="details-image">
        <img
          src={
            product.imageCover ||
            "https://placehold.co/500x500?text=Product"
          }
          alt={product.title}
        />
      </div>

      <div className="details-info">
        <p className="product-category">
          {product.category?.name ||
            "Product"}
        </p>

        <h1>
          {product.title}
        </h1>

        <div className="details-rating">
          <Stars value={average} />

          <strong>
            {average.toFixed(1)}
          </strong>

          <span>
            (
            {reviews.length ||
              product.ratingsQuantity ||
              0}{" "}
            reviews)
          </span>
        </div>

        <h2>
          ${product.price}
        </h2>

        <p className="details-description">
          {product.description}
        </p>

        {isSellerView ? (
          <p className="seller-muted">
            Seller view: product details
            and customer reviews only.
          </p>
        ) : (
          <>
            <button
              className="add-cart-button large"
              onClick={
                handleAddToCart
              }
            >
              Add to Cart
            </button>

            <button
              className="wishlist-button"
              onClick={
                handleWishlist
              }
            >
              ♡ Add to Wishlist
            </button>
          </>
        )}
      </div>

      <section className="reviews-section">
        <div className="section-heading">
          <p>
            CUSTOMER FEEDBACK
          </p>

          <h2>
            Reviews & Ratings
          </h2>

          <div className="review-summary">
            <Stars value={average} />

            <strong>
              {average.toFixed(1)}
            </strong>

            <span>
              Based on{" "}
              {reviews.length ||
                product.ratingsQuantity ||
                0}{" "}
              customer reviews
            </span>
          </div>
        </div>

        {!isSellerView &&
          user && (
            <form
              className="review-form"
              onSubmit={
                handleReviewSubmit
              }
            >
              <div className="rating-picker">
                <label>
                  Your rating
                </label>

                <select
                  value={
                    review.ratings
                  }
                  onChange={(e) =>
                    setReview({
                      ...review,
                      ratings: Number(
                        e.target.value
                      ),
                    })
                  }
                >
                  <option value="5">
                    ★★★★★ — 5
                  </option>

                  <option value="4">
                    ★★★★☆ — 4
                  </option>

                  <option value="3">
                    ★★★☆☆ — 3
                  </option>

                  <option value="2">
                    ★★☆☆☆ — 2
                  </option>

                  <option value="1">
                    ★☆☆☆☆ — 1
                  </option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Write your review..."
                value={review.title}
                onChange={(e) =>
                  setReview({
                    ...review,
                    title: e.target.value,
                  })
                }
                required
              />

              <button type="submit">
                Submit Review
              </button>
            </form>
          )}

        <div className="reviews-list">
          {reviews.length === 0 ? (
            <p>
              No customer reviews are
              available for this product
              yet.
            </p>
          ) : (
            reviews.map((item) => (
              <div
                className="review-card"
                key={
                  item._id ||
                  `${
                    item.user?.name ||
                    "customer"
                  }-${
                    item.createdAt || ""
                  }-${
                    item.title || ""
                  }`
                }
              >
                <div className="review-card-top">
                  <div>
                    <strong>
                      {item.user?.name ||
                        "Customer"}
                    </strong>

                    <small>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleDateString()
                        : ""}
                    </small>
                  </div>

                  <div>
                    <Stars
                      value={
                        item.ratings
                      }
                    />

                    <b>
                      {item.ratings}/5
                    </b>
                  </div>
                </div>

                <p>
                  {item.title ||
                    "No written comment."}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}