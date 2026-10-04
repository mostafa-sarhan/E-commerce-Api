import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";

import {
  createCashOrder,
  createCashOrderV1,
  createCheckoutSession,
} from "../../services/api/orderApi";

import {
  clearLocalCart,
} from "../../services/localStore";

import { useAuth } from "../../context/AuthContext";

import "./Checkout.css";

export default function Checkout() {
  const { cart, loadCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    details: "",
    phone: user?.phone || "",
    city: "",
  });

  const [paymentMethod, setPaymentMethod] =
    useState("cash");

  const [loading, setLoading] =
    useState(false);

  const products =
    cart?.products || [];

  const hasLocalItems =
    products.some(
      (item) => item.isLocal
    );

  const subtotal =
    products.reduce(
      (s, i) =>
        s +
        Number(i.price || 0) *
          Number(i.count || 0),
      0
    );

  const discount = Number(
    cart?.totalCartPriceAfterDiscount
  );

  const finalSubtotal =
    Number.isFinite(discount) &&
    discount > 0 &&
    !hasLocalItems
      ? discount
      : subtotal;

  const shipping =
    products.length ? 50 : 0;

  const total =
    finalSubtotal + shipping;

  const change = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]:
        e.target.value,
    }));

  async function submit(e) {
    e.preventDefault();

    if (!products.length) {
      return alert(
        "Your cart is empty."
      );
    }

    if (
      !form.details ||
      !form.phone ||
      !form.city
    ) {
      return alert(
        "Please complete your delivery information."
      );
    }

    setLoading(true);

    try {
      if (
        paymentMethod === "card" &&
        !hasLocalItems
      ) {
        const d =
          await createCheckoutSession(
            cart._id,
            form,
            window.location.origin
          );

        const url =
          d?.session?.url ||
          d?.data?.session?.url ||
          d?.url;

        if (!url) {
          throw new Error(
            "Stripe checkout URL was not returned."
          );
        }

        window.location.href = url;
        return;
      }

      let apiOrder = null;

      try {
        apiOrder =
          await createCashOrder(
            cart._id,
            form
          );
      } catch {
        apiOrder =
          await createCashOrderV1(
            cart._id,
            form
          );
      }

      if (
        !apiOrder?.data?._id &&
        !apiOrder?.order?._id &&
        !apiOrder?.data?.order?._id
      ) {
        throw new Error(
          "The order could not be created. Please try again."
        );
      }

      clearLocalCart(user?.email);

      await loadCart().catch(
        () => null
      );

      alert(
        "Order placed successfully. You can track it from My Orders."
      );

      navigate("/orders");
    } catch (error) {
      alert(
        error.message ||
          "Could not place order."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="checkout-page">
      <div className="page-header">
        <p>SECURE CHECKOUT</p>

        <h1>
          Complete Your Order
        </h1>

        <span>
          Delivery, payment and final
          price before confirmation.
        </span>
      </div>

      <div className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={submit}
        >
          <section className="checkout-section">
            <h2>
              Delivery Information
            </h2>

            <label>
              Address

              <textarea
                name="details"
                value={form.details}
                onChange={change}
                required
                placeholder="Full delivery address"
              />
            </label>

            <label>
              Phone

              <input
                name="phone"
                value={form.phone}
                onChange={change}
                required
              />
            </label>

            <label>
              City

              <input
                name="city"
                value={form.city}
                onChange={change}
                required
              />
            </label>
          </section>

          <section className="checkout-section">
            <h2>
              Payment Method
            </h2>

            {[
              [
                "cash",
                "💵",
                "Cash on Delivery",
                "Available",
              ],
              [
                "card",
                "💳",
                "Credit Card",
                hasLocalItems
                  ? "Available for store API products only"
                  : "Stripe",
              ],
              [
                "paypal",
                "🅿️",
                "PayPal",
                "Provider required",
              ],
              [
                "wallet",
                "👛",
                "Wallet",
                "Provider required",
              ],
            ].map(
              ([
                v,
                icon,
                label,
                note,
              ]) => (
                <label
                  className="payment-option"
                  key={v}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={v}
                    checked={
                      paymentMethod === v
                    }
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value
                      )
                    }
                    disabled={
                      (v === "card" &&
                        hasLocalItems) ||
                      [
                        "paypal",
                        "wallet",
                      ].includes(v)
                    }
                  />

                  <span>
                    {icon}{" "}
                    <strong>
                      {label}
                    </strong>{" "}
                    <small>
                      {note}
                    </small>
                  </span>
                </label>
              )
            )}
          </section>

          <button
            className="place-order-button"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : paymentMethod === "card"
                ? "Continue to Stripe"
                : "Place Order & Confirm"}
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>
            Order Summary
          </h2>

          <div>
            <span>Items</span>

            <strong>
              {products.reduce(
                (s, i) =>
                  s + i.count,
                0
              )}
            </strong>
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
              -$
              {Math.max(
                0,
                subtotal -
                  finalSubtotal
              ).toFixed(2)}
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
        </aside>
      </div>
    </main>
  );
}