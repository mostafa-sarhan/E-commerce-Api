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
    changeQuantity,
    removeProduct,
  } = useCart();

  const { user } = useAuth();

  const navigate = useNavigate();

  const [coupon, setCoupon] = useState("");
  const [couponLoading, setCouponLoading] =
    useState(false);

  const hasLocalItems =
    productsHaveLocal(cart);

  function productsHaveLocal(currentCart) {
    return (
      currentCart?.products || []
    ).some(
      (item) => item.isLocal
    );
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

  /* Signing in is only needed to place the order, never to build
     a cart, so the checkout hand-off remembers where to return. */
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
      return alert(
        "Please enter a coupon code."
      );
    }

    if (hasLocalItems) {
      return alert(
        "Coupons are available only for store API products."
      );
    }

    try {
      setCouponLoading(true);

      await applyCoupon(
        coupon.trim()
      );

      window.location.reload();
    } catch (error) {
      alert(error.message);
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

      {!products.length ? (
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
                  src={
                    item.product.imageCover
                  }
                  alt={
                    item.product.title
                  }
                />

                <div className="cart-item-info">
                  <h3>
                    {item.product.title}
                  </h3>

                  <p>
                    ${item.price}
                  </p>

                  <div className="quantity-controls">
                    <button
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
                    className="remove-button"
                    onClick={() =>
                      removeProduct(itemId(item))
                    }
                  >
                    Remove
                  </button>
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

            <div>
              <span>Subtotal</span>

              <strong>
                ${subtotal.toFixed(2)}
              </strong>
            </div>

            <div>
              <span>Discount</span>

              <strong>
                -${discount.toFixed(2)}
              </strong>
            </div>

            <div>
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