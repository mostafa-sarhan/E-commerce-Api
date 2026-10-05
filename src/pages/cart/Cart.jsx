import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import { applyCoupon } from "../../services/api/cartApi";

import "./Cart.css";

function Cart() {
  const {
    cart,
    loading,
    error,
    loadCart,
    changeQuantity,
    removeProduct,
  } = useCart();

  const { user } = useAuth();

  const navigate = useNavigate();

  const [coupon, setCoupon] = useState("");
  const [couponLoading, setCouponLoading] =
    useState(false);
  const [couponNotice, setCouponNotice] =
    useState(null);

  const hasLocalItems =
    productsHaveLocal(cart);

  function productsHaveLocal(currentCart) {
    return (
      currentCart?.products || []
    ).some(
      (item) => item.isLocal
    );
  }

  /* The store API hands back a populated brand document while the
     device cart stores the plain name, so the reference is resolved
     to text here instead of being rendered as an object. */
  function brandName(product) {
    const brand = product?.brand;

    if (!brand) {
      return "";
    }

    return typeof brand === "string"
      ? brand
      : brand.name || "";
  }

  if (loading) {
    return (
      <main className="cart-page">
        <div className="loading">
          Loading cart...
        </div>
      </main>
    );
  }

  const products = cart?.products || [];

  const itemId = (item) =>
    item?.product?._id || item?.product?.id;

  function handleCompleteCart() {
    if (user) {
      navigate("/checkout");
      return;
    }

    navigate("/login", {
      state: { from: "/checkout" },
    });
  }

  const subtotal = products.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        item.count,
    0
  );

  const shipping =
    products.length > 0 ? 50 : 0;

  const discounted = Number(
    cart?.totalCartPriceAfterDiscount
  );

  const finalSubtotal =
    Number.isFinite(discounted) &&
    discounted > 0
      ? discounted
      : subtotal;

  const discount = Math.max(
    0,
    subtotal - finalSubtotal
  );

  const total =
    finalSubtotal + shipping;

  async function handleCoupon() {
    if (!coupon.trim()) {
      return setCouponNotice(
        "Please enter a coupon code."
      );
    }

    if (hasLocalItems) {
      return setCouponNotice(
        "Coupons are available only for store API products."
      );
    }

    try {
      setCouponLoading(true);
      setCouponNotice(null);

      await applyCoupon(
        coupon.trim()
      );

      /* The discounted total arrives with the cart response, so the
         cart is re-read instead of reloading the whole document. */
      await loadCart();

      setCouponNotice(
        "Coupon applied to your cart."
      );
    } catch (couponError) {
      console.warn(
        "[cart] coupon was rejected:",
        couponError?.message
      );

      setCouponNotice(
        couponError?.message ||
          "That coupon could not be applied."
      );
    } finally {
      setCouponLoading(false);
    }
  }

  return (
    <main className="cart-page">
      <div className="page-header">
        <p>YOUR SHOPPING BAG</p>

        <h1>Shopping Cart</h1>
      </div>

      {/* A failed load is reported on its own, never as an
          empty cart, so the two states stay distinguishable. */}
      {error ? (
        <div className="empty-state">
          <h2>Your cart could not be loaded</h2>

          <p>{error}</p>
        </div>
      ) : null}

      {!products.length && !error ? (
        <div className="empty-state">
          <h2>Your cart is empty</h2>

          <p>
            Add some products to continue
            shopping.
          </p>

          <Link
            to="/products"
            className="primary-button"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {products.map((item) => (
              <div
                className="cart-item"
                key={itemId(item)}
              >
                <img
                  className="cart-item-image"
                  src={
                    item.product.imageCover
                  }
                  alt={
                    item.product.title
                  }
                  loading="lazy"
                />

                <div className="cart-item-info">
                  {/* The eyebrow row is only rendered when the
                      product actually carries a brand, so the
                      title never shifts between items. */}
                  {brandName(item.product) ? (
                    <p className="cart-item-eyebrow">
                      {brandName(item.product)}
                    </p>
                  ) : null}

                  <h3
                    className="cart-item-title"
                    title={
                      item.product.title
                    }
                  >
                    {item.product.title}
                  </h3>

                  <p className="cart-item-price">
                    ${item.price}
                  </p>

                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        type="button"
                        aria-label={
                          "Decrease quantity of " +
                          item.product.title
                        }
                        onClick={() =>
                          changeQuantity(
                            itemId(item),
                            Math.max(
                              1,
                              item.count - 1
                            )
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.count}
                      </span>

                      <button
                        type="button"
                        aria-label={
                          "Increase quantity of " +
                          item.product.title
                        }
                        onClick={() =>
                          changeQuantity(
                            itemId(item),
                            item.count + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="remove-button"
                      aria-label={
                        "Remove " +
                        item.product.title +
                        " from cart"
                      }
                      onClick={() =>
                        removeProduct(itemId(item))
                      }
                    >
                      Remove
                    </button>

                    <div className="cart-item-total">
                      <span>Line total</span>

                      <strong>
                        ${(
                          Number(item.price || 0) *
                          item.count
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Order Summary</h2>

            {/* Promo codes run through the store API, so they only
                appear once there is an account to apply them to. */}
            {user && (
              <div className="coupon-box">
                <input
                  placeholder="Promo code"
                  value={coupon}
                  onChange={(e) =>
                    setCoupon(e.target.value)
                  }
                />

                <button
                  onClick={handleCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading
                    ? "Applying..."
                    : "Apply"}
                </button>
              </div>
            )}

            {/* Coupon outcome is shown in place of a browser
                dialog so the reason stays next to the field. */}
            {couponNotice ? (
              <div className="cart-signin">
                <p>{couponNotice}</p>
              </div>
            ) : null}

            <div className="cart-summary-row">
              <span>Subtotal</span>

              <strong>
                ${subtotal.toFixed(2)}
              </strong>
            </div>

            <div className="cart-summary-row">
              <span>Discount</span>

              <strong>
                -${discount.toFixed(2)}
              </strong>
            </div>

            <div className="cart-summary-row">
              <span>Shipping</span>

              <strong>
                ${shipping.toFixed(2)}
              </strong>
            </div>

            <div className="summary-total">
              <span>Total</span>

              <strong>
                ${total.toFixed(2)}
              </strong>
            </div>

            <button
              type="button"
              className="checkout-button"
              onClick={handleCompleteCart}
            >
              Complete the cart
            </button>

            {!user && (
              <div className="cart-signin">
                <p>
                  Sign in or create an account to
                  complete your order. Everything in
                  your cart is saved.
                </p>

                <div className="cart-signin-actions">
                  <button
                    type="button"
                    className="cart-signin-login"
                    onClick={handleCompleteCart}
                  >
                    Login
                  </button>

                  <Link
                    to="/register"
                    className="cart-signin-register"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

export default Cart;