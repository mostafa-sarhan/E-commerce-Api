import { useEffect, useState } from "react";

import { getUserOrders } from "../../services/api/orderApi";

import {
  getLocalUserOrders,
  updateLocalOrder,
} from "../../services/localStore";

import { useAuth } from "../../context/AuthContext";

import "./Orders.css";

export default function Orders() {
  const { user } = useAuth();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  async function load() {
    if (!user) {
      setLoading(false);
      return;
    }

    let remote = [];

    try {
      if (
        user._id &&
        !String(user._id).startsWith(
          "local-"
        )
      ) {
        const d =
          await getUserOrders(user._id);

        remote = d.data || [];
      }
    } catch {}

    const local =
      getLocalUserOrders(
        user._id || user.email
      );

    const map = new Map(
      [...local, ...remote].map(
        (o) => [o._id, o]
      )
    );

    setOrders(
      [...map.values()].sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
    );

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function confirmReceived(order) {
    if (order.isDelivered) {
      return;
    }

    updateLocalOrder(
      order._id,
      {
        isDelivered: true,
        status: "Delivered",
        isPaid:
          order.paymentMethod === "cash"
            ? true
            : order.isPaid,
        deliveredAt:
          new Date().toISOString(),
        customerConfirmedAt:
          new Date().toISOString(),
      }
    );

    await load();

    alert(
      "Delivery confirmed. The order is now marked as received and paid for Cash on Delivery."
    );
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