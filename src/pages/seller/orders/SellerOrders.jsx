import { useEffect, useState } from "react";

import {
  getOrders,
  getSellerProductsByOwner,
  updateLocalOrder,
} from "../../../services/localStore";

import { useAuth } from "../../../context/AuthContext";

import "../Seller.css";

export default function SellerOrders() {
  const { user } = useAuth();

  const [orders, setOrders] =
    useState([]);

  function load() {
    const ownedIds = new Set(
      getSellerProductsByOwner(
        user?.email
      ).map((product) =>
        String(
          product.id ||
            product._id
        )
      )
    );

    const sellerOrders =
      getOrders().filter(
        (order) =>
          (order.cartItems || []).some(
            (item) =>
              ownedIds.has(
                String(
                  item.product?.id ||
                    item.product?._id
                )
              )
          )
      );

    setOrders(sellerOrders);
  }

  useEffect(() => {
    load();
  }, [user?.email]);

  function update(id, patch) {
    updateLocalOrder(id, patch);
    load();
  }

  const revenue = orders.reduce(
    (sum, order) =>
      sum +
      (order.cartItems || [])
        .filter((item) =>
          getSellerProductsByOwner(
            user?.email
          ).some(
            (product) =>
              String(
                product.id ||
                  product._id
              ) ===
              String(
                item.product?.id ||
                  item.product?._id
              )
          )
        )
        .reduce(
          (s, item) =>
            s +
            Number(item.price || 0) *
              Number(item.count || 0),
          0
        ),
    0
  );

  return (
    <main className="seller-page">
      <div className="page-header">
        <p>SELLER CENTER</p>

        <h1>Orders</h1>

        <span>
          Orders containing your
          products.
        </span>
      </div>

      <section className="seller-stats">
        <div className="seller-stat">
          <p>My Orders</p>
          <strong>
            {orders.length}
          </strong>
        </div>

        <div className="seller-stat">
          <p>Product Revenue</p>
          <strong>
            ${revenue.toFixed(2)}
          </strong>
        </div>

        <div className="seller-stat">
          <p>Paid</p>
          <strong>
            {
              orders.filter(
                (o) => o.isPaid
              ).length
            }
          </strong>
        </div>

        <div className="seller-stat">
          <p>Delivered</p>
          <strong>
            {
              orders.filter(
                (o) =>
                  o.isDelivered
              ).length
            }
          </strong>
        </div>
      </section>

      <section className="seller-card">
        <table className="seller-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Your Products</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const ownedIds = new Set(
                getSellerProductsByOwner(
                  user?.email
                ).map((product) =>
                  String(
                    product.id ||
                      product._id
                  )
                )
              );

              const items = (
                order.cartItems || []
              ).filter((item) =>
                ownedIds.has(
                  String(
                    item.product?.id ||
                      item.product?._id
                  )
                )
              );

              return (
                <tr
                  key={order._id}
                >
                  <td>
                    #
                    {String(
                      order._id
                    ).slice(-8)}
                  </td>

                  <td>
                    {new Date(
                      order.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    {order.user?.name ||
                      order.shippingAddress
                        ?.phone ||
                      "Customer"}
                  </td>

                  <td>
                    {items
                      .map(
                        (item) =>
                          `${
                            item.title ||
                            item.product
                              ?.title
                          } × ${
                            item.count
                          }`
                      )
                      .join(", ")}
                  </td>

                  <td>
                    {order.isDelivered
                      ? "Delivered"
                      : order.isPaid
                      ? "Processing"
                      : "Placed"}
                  </td>

                  <td>
                    {!order.isDelivered ? (
                      <button
                        className="mini-btn"
                        onClick={() =>
                          update(
                            order._id,
                            {
                              isDelivered:
                                true,
                              status:
                                "Delivered",
                              deliveredAt:
                                new Date().toISOString(),
                            }
                          )
                        }
                      >
                        Mark Delivered
                      </button>
                    ) : (
                      <span>
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!orders.length && (
              <tr>
                <td
                  colSpan="6"
                  className="seller-muted"
                >
                  No customers have
                  purchased your
                  products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}