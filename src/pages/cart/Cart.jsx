import { useState } from "react";

import { Link } from "react-router-dom";

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
                key={item.product._id}
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
                          item.product._id,
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
                          item.product._id,
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
                      removeProduct(
                        item.product._id
                      )
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

            <div className="coupon-box">
              <input
                placeholder="Promo code"
                value={coupon}
                onChange={(e) =>
                  setCoupon(
                    e.target.value
                  )
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

            <Link
              to="/checkout"
              className="checkout-button"
            >
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}

export default Cart;