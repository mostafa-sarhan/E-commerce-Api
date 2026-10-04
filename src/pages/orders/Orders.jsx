import { useEffect, useState } from "react";

import { getUserOrders } from "../../services/api/orderApi";

import { useAuth } from "../../context/AuthContext";

import "./Orders.css";

export default function Orders() {
  const { user } = useAuth();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function load() {
    if (!user?._id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setError("");

    try {
      const d = await getUserOrders(user._id);

      const remote = d.data || [];

      setOrders(
        [...remote].sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )
      );
    } catch (err) {
      setOrders([]);
      setError(
        err.message ||
          "Could not load your orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  async function confirmReceived(order) {
    if (order.isDelivered) {
      return;
    }

    alert(
      "Cash on Delivery orders are marked as received once the courier hands the parcel over."
    );

    await load();
  }

  if (!user) {
    return (
      <main className="empty-state">
        <h2>
          Please login first
        </h2>
      </main>
    );
  }

  return (
    <main className="products-page">
      <div className="page-header">
        <p>ORDER HISTORY</p>

        <h1>My Orders</h1>

        <span>
          Track every order from
          placement to delivery.
        </span>
      </div>

      {loading ? (
        <div className="loading">
          Loading your orders...
        </div>
      ) : error ? (
        <div className="empty-state">
          <h2>
            Could not load orders
          </h2>

          <p>{error}</p>
        </div>
      ) : !orders.length ? (
        <div className="empty-state">
          <h2>
            No orders yet
          </h2>

          <p>
            Your purchases will appear
            here after checkout.
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const status =
              order.status ||
              (order.isDelivered
                ? "Delivered"
                : order.isPaid
                  ? "Processing"
                  : "Placed");

            const step =
              status === "Delivered"
                ? 3
                : status === "Shipped" ||
                    status ===
                      "Processing"
                  ? 2
                  : 1;

            return (
              <div
                className="order-card"
                key={order._id}
              >
                <div className="order-header">
                  <div>
                    <span>
                      Order ID
                    </span>

                    <h3>
                      #{order._id}
                    </h3>
                  </div>

                  <div>
                    <span>
                      Date
                    </span>

                    <p>
                      {new Date(
                        order.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="order-info">
                  <div>
                    <span>
                      Items
                    </span>

                    <strong>
                      {order.cartItems
                        ?.length || 0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total
                    </span>

                    <strong>
                      $
                      {Number(
                        order.totalOrderPrice ||
                          0
                      ).toFixed(2)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Payment
                    </span>

                    <strong>
                      {order.isPaid
                        ? "Paid"
                        : order.paymentMethod ||
                          "Cash"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong className="order-status">
                      {status}
                    </strong>
                  </div>
                </div>

                <div className="order-progress">
                  <span
                    className={
                      step >= 1
                        ? "active"
                        : ""
                    }
                  >
                    Placed
                  </span>

                  <span
                    className={
                      step >= 2
                        ? "active"
                        : ""
                    }
                  >
                    {status === "Shipped"
                      ? "Shipped"
                      : "Processing"}
                  </span>

                  <span
                    className={
                      step >= 3
                        ? "active"
                        : ""
                    }
                  >
                    Delivered
                  </span>
                </div>

                {!order.isDelivered && (
                  <div className="delivery-confirm">
                    <p>
                      <strong>
                        Did you receive this
                        order?
                      </strong>{" "}
                      The customer confirms
                      delivery after the package
                      arrives.
                    </p>

                    <button
                      onClick={() =>
                        confirmReceived(
                          order
                        )
                      }
                    >
                      Confirm Received
                    </button>
                  </div>
                )}

                {order.isDelivered && (
                  <div className="delivery-confirm confirmed">
                    <p>
                      ✓ Received on{" "}
                      {order.customerConfirmedAt
                        ? new Date(
                            order.customerConfirmedAt
                          ).toLocaleDateString()
                        : order.deliveredAt
                          ? new Date(
                              order.deliveredAt
                            ).toLocaleDateString()
                          : "recorded delivery date"}
                      .
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}