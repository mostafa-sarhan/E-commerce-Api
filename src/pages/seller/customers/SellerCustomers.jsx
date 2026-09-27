import { useEffect, useState } from "react";

import {
  getOrders,
  getSellerProductsByOwner,
} from "../../../services/localStore";

import { useAuth } from "../../../context/AuthContext";

import "./../Seller.css";

function SellerCustomers() {
  const { user } = useAuth();

  const [customers, setCustomers] =
    useState([]);

  useEffect(() => {
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

    const orders = getOrders().filter(
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

    const map = new Map();

    orders.forEach((order) => {
      const customer =
        order.user || {};

      const key =
        customer.email ||
        customer._id ||
        order.shippingAddress
          ?.phone ||
        order._id;

      if (!map.has(key)) {
        map.set(key, {
          name:
            customer.name ||
            "Customer",

          email:
            customer.email ||
            "—",

          phone:
            customer.phone ||
            order.shippingAddress
              ?.phone ||
            "—",

          orders: 0,
        });
      }

      map.get(key).orders += 1;
    });

    setCustomers([
      ...map.values(),
    ]);
  }, [user?.email]);

  return (
    <main className="seller-page">
      <div className="page-header">
        <p>SELLER CENTER</p>

        <h1>Customers</h1>

        <span>
          Customers who purchased
          your products.
        </span>
      </div>

      <section className="seller-card">
        <table className="seller-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders</th>
            </tr>
          </thead>

          <tbody>
            {customers.map(
              (customer) => (
                <tr
                  key={`${customer.email}-${customer.phone}`}
                >
                  <td>
                    {customer.name}
                  </td>

                  <td>
                    {customer.email}
                  </td>

                  <td>
                    {customer.phone}
                  </td>

                  <td>
                    {customer.orders}
                  </td>
                </tr>
              )
            )}

            {!customers.length && (
              <tr>
                <td
                  colSpan="4"
                  className="seller-muted"
                >
                  No customers for
                  your products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default SellerCustomers;