import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getUserOrders,
  getLocalUserOrders,
} from "../../services/api/orderApi";

import { getWishlist } from "../../services/api/wishlistApi";

import { getProducts } from "../../services/api/productApi";

import { getRole } from "../../utils/roles";

import "./Dashboard.css";

function CustomerDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    orders: 0,
    wishlist: 0,
    products: 0,
    spent: 0,
  });

  useEffect(() => {
    async function load() {
      const [
        orders,
        wishlist,
        products,
      ] = await Promise.allSettled([
        user?._id
          ? getUserOrders(user._id)
          : Promise.resolve({
              data: [],
            }),
        getWishlist(),
        getProducts("?limit=1"),
      ]);

      const remoteOrders =
        orders.status === "fulfilled"
          ? orders.value?.data || []
          : [];

      const localOrders =
        getLocalUserOrders(
          user?._id || user?.email
        );

      const orderMap = new Map(
        [
          ...localOrders,
          ...remoteOrders,
        ].map((order) => [
          order._id,
          order,
        ])
      );

      const orderData = [
        ...orderMap.values(),
      ];

      const wishlistData =
        wishlist.status === "fulfilled"
          ? wishlist.value?.data || []
          : [];

      const productCount =
        products.status === "fulfilled"
          ? products.value?.results || 0
          : 0;

      setStats({
        orders: orderData.length,
        wishlist:
          wishlistData.length,
        products: productCount,
        spent: orderData.reduce(
          (sum, order) =>
            sum +
            Number(
              order.totalOrderPrice || 0
            ),
          0
        ),
      });
    }

    load();
  }, [user?._id]);

  return (
    <>
      <section className="dashboard-stats">
        <div>
          <span>📦</span>
          <p>My Orders</p>
          <strong>
            {stats.orders}
          </strong>
        </div>

        <div>
          <span>❤️</span>
          <p>Wishlist</p>
          <strong>
            {stats.wishlist}
          </strong>
        </div>

        <div>
          <span>🛍️</span>
          <p>Products Available</p>
          <strong>
            {stats.products}
          </strong>
        </div>

        <div>
          <span>💰</span>
          <p>Total Spent</p>
          <strong>
            ${stats.spent.toFixed(2)}
          </strong>
        </div>
      </section>

      <div className="dashboard-grid">
        <Link
          to="/orders"
          className="dashboard-card"
        >
          <span>📦</span>
          <h3>Order History</h3>
          <p>
            Track your purchases and
            payment status.
          </p>
        </Link>

        <Link
          to="/wishlist"
          className="dashboard-card"
        >
          <span>❤️</span>
          <h3>
            Wishlist & Favorites
          </h3>
          <p>
            Manage saved products.
          </p>
        </Link>

        <Link
          to="/profile"
          className="dashboard-card"
        >
          <span>👤</span>
          <h3>Profile</h3>
          <p>
            Update your name, phone and
            account information.
          </p>
        </Link>

        <Link
          to="/products"
          className="dashboard-card"
        >
          <span>🔎</span>
          <h3>Shop Products</h3>
          <p>
            Search, filter and browse live
            catalog data.
          </p>
        </Link>
      </div>
    </>
  );
}

function SellerDashboard() {
  return (
    <div className="dashboard-grid">
      <Link
        to="/seller/products"
        className="dashboard-card"
      >
        <span>📦</span>
        <h3>Products</h3>
        <p>
          View and manage your seller
          catalog.
        </p>
      </Link>

      <Link
        to="/seller/inventory"
        className="dashboard-card"
      >
        <span>📊</span>
        <h3>Inventory</h3>
        <p>
          Monitor live stock and low-stock
          items.
        </p>
      </Link>

      <Link
        to="/seller/orders"
        className="dashboard-card"
      >
        <span>🛒</span>
        <h3>Orders</h3>
        <p>
          Review orders and their
          statuses.
        </p>
      </Link>

      <Link
        to="/seller/customers"
        className="dashboard-card"
      >
        <span>👥</span>
        <h3>Customers</h3>
        <p>
          See customer information
          available in orders.
        </p>
      </Link>

      <Link
        to="/seller/reviews"
        className="dashboard-card"
      >
        <span>⭐</span>
        <h3>Reviews</h3>
        <p>
          Review customer ratings and
          feedback.
        </p>
      </Link>
    </div>
  );
}

function Dashboard() {
  const {
    user,
    role,
  } = useAuth();

  const currentRole = getRole(user);

  if (currentRole === "admin") {
    return <></>;
  }

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <p>
          {currentRole.toUpperCase()} DASHBOARD
        </p>

        <h1>
          Welcome, {user?.name || "User"}
        </h1>

        <span>
          {currentRole === "seller"
            ? "Manage your store operations."
            : "Manage your shopping activity."}
        </span>
      </div>

      {currentRole === "seller" ? (
        <SellerDashboard />
      ) : (
        <CustomerDashboard />
      )}
    </main>
  );
}

export default Dashboard;