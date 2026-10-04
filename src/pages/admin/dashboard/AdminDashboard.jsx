import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getProducts,
  getCategories,
} from "../../../services/api/productApi";

import { getAllOrders } from "../../../services/api/orderApi";

import { getUsers } from "../../../services/api/userApi";

import {
  getAllReviews,
  payOrder,
  deliverOrder,
} from "../../../services/api/adminApi";

import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      getProducts("?limit=50"),
      getCategories(),
      getAllOrders(),
      getUsers("?limit=50"),
      getAllReviews(),
    ]);

    if (results[0].status === "fulfilled") {
      setProducts(results[0].value.data || []);
    }

    if (results[1].status === "fulfilled") {
      setCategories(results[1].value.data || []);
    }

    if (results[2].status === "fulfilled") {
      setOrders(results[2].value.data || []);
    }

    if (results[3].status === "fulfilled") {
      setUsers(results[3].value.data || []);
    }

    if (results[4].status === "fulfilled") {
      setReviews(results[4].value.data || []);
    }

    const failed = results.filter(
      (r) => r.status === "rejected"
    ).length;

    if (failed) {
      setError(
        `${failed} protected API section(s) could not be loaded with this account. Sign in with an API admin token for full server-side admin data.`
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const revenue = orders.reduce(
    (s, o) => s + Number(o.totalOrderPrice || 0),
    0
  );

  const lowStock = products.filter(
    (p) => (p.quantity ?? p.stock ?? 0) <= 5
  ).length;

  const topProducts = [...products]
    .sort(
      (a, b) =>
        (b.ratingsQuantity || 0) -
        (a.ratingsQuantity || 0)
    )
    .slice(0, 5);

  const statusCounts = useMemo(
    () =>
      orders.reduce((a, o) => {
        const s = o.isDelivered
          ? "Delivered"
          : o.isPaid
            ? "Paid"
            : "Pending";

        a[s] = (a[s] || 0) + 1;

        return a;
      }, {}),
    [orders]
  );

  async function changeOrder(id, action) {
    try {
      if (action === "pay") {
        await payOrder(id);
      } else {
        await deliverOrder(id);
      }

      await loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          Admin
        </div>

        <div className="admin-menu">
          {[
            ["dashboard", "📊 Dashboard"],
            ["users", "👥 Users"],
            ["products", "📦 Products"],
            ["orders", "🛒 Orders"],
            ["categories", "🗂 Categories"],
            ["reviews", "⭐ Reviews"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={
                activePage === key
                  ? "active"
                  : ""
              }
              onClick={() =>
                key === "products"
                  ? navigate("/admin/products")
                  : setActivePage(key)
              }
            >
              {label}
            </button>
          ))}
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>
              Live store overview and management
            </p>
          </div>

          <div className="admin-profile">
            <div className="admin-avatar">
              A
            </div>

            <div>
              <strong>Admin</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="admin-alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="empty-page">
            <div>
              <h2>Loading store data...</h2>
              <p>
                Reading the connected API.
              </p>
            </div>
          </div>
        ) : activePage === "dashboard" ? (
          <DashboardView
            products={products}
            orders={orders}
            users={users}
            categories={categories}
            revenue={revenue}
            lowStock={lowStock}
            topProducts={topProducts}
            statusCounts={statusCounts}
          />
        ) : null}

        {!loading &&
          activePage === "users" && (
            <UsersView users={users} />
          )}

        {!loading &&
          activePage === "orders" && (
            <OrdersView
              orders={orders}
              onChange={changeOrder}
            />
          )}

        {!loading &&
          activePage === "categories" && (
            <CategoriesView
              categories={categories}
            />
          )}

        {!loading &&
          activePage === "reviews" && (
            <ReviewsView reviews={reviews} />
          )}
      </main>
    </div>
  );
}

function DashboardView({
  products,
  orders,
  users,
  categories,
  revenue,
  lowStock,
  topProducts,
  statusCounts,
}) {
  return (
    <>
      <section className="stats-grid">
        <Stat
          icon="👥"
          label="Total Users"
          value={users.length}
          note="Live API records"
        />

        <Stat
          icon="📦"
          label="Products"
          value={products.length}
          note={`${lowStock} low stock`}
        />

        <Stat
          icon="🛒"
          label="Orders"
          value={orders.length}
          note={`${statusCounts.Pending || 0} pending`}
        />

        <Stat
          icon="💰"
          label="Revenue"
          value={`$${revenue.toFixed(2)}`}
          note="From loaded orders"
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Orders</h2>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {orders
                  .slice(0, 7)
                  .map((o) => (
                    <tr key={o._id}>
                      <td>
                        #
                        {String(o._id).slice(-7)}
                      </td>

                      <td>
                        {o.user?.name ||
                          "Customer"}
                      </td>

                      <td>
                        ${o.totalOrderPrice || 0}
                      </td>

                      <td>
                        <span
                          className={`status ${
                            o.isDelivered
                              ? "delivered"
                              : o.isPaid
                                ? "shipped"
                                : "pending"
                          }`}
                        >
                          {o.isDelivered
                            ? "Delivered"
                            : o.isPaid
                              ? "Paid"
                              : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Top Products</h2>
          </div>

          <div className="product-list">
            {topProducts.map((p, i) => (
              <div
                className="admin-product"
                key={p._id}
              >
                <div className="product-number">
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div>
                  <strong>{p.title}</strong>
                  <span>
                    {p.category?.name ||
                      "Electronics"}
                  </span>
                </div>

                <b>${p.price}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="card-header">
          <h2>Store Overview</h2>
        </div>

        <div className="overview-grid">
          <div>
            <span>Categories</span>
            <strong>{categories.length}</strong>
          </div>

          <div>
            <span>Paid Orders</span>
            <strong>
              {statusCounts.Paid || 0}
            </strong>
          </div>

          <div>
            <span>Delivered</span>
            <strong>
              {statusCounts.Delivered || 0}
            </strong>
          </div>

          <div>
            <span>Catalog Stock</span>
            <strong>
              {products.reduce(
                (s, p) =>
                  s + (p.quantity ?? p.stock ?? 0),
                0
              )}
            </strong>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <p>{label}</p>
        <h2>{value}</h2>
        <span>{note}</span>
      </div>
    </div>
  );
}

function UsersView({ users }) {
  const [q, setQ] = useState("");

  const list = users.filter((u) =>
    `${u.name || ""} ${u.email || ""}`
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  return (
    <section className="dashboard-card">
      <div className="card-header">
        <h2>User Management</h2>

        <input
          className="admin-inline-search"
          placeholder="Search users..."
          value={q}
          onChange={(e) =>
            setQ(e.target.value)
          }
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {list.map((u) => (
              <tr key={u._id || u.email}>
                <td>{u.name || "—"}</td>
                <td>{u.email}</td>
                <td>{u.phone || "—"}</td>
                <td>{u.role || "customer"}</td>
                <td>
                  {u.active !== false
                    ? "Active"
                    : "Restricted"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OrdersView({
  orders,
  onChange,
}) {
  return (
    <section className="dashboard-card">
      <div className="card-header">
        <h2>Order Management</h2>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Delivery</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>
                  #{String(o._id).slice(-8)}
                </td>

                <td>
                  {o.user?.name || "Customer"}
                </td>

                <td>
                  ${o.totalOrderPrice || 0}
                </td>

                <td>
                  {o.isPaid
                    ? "Paid"
                    : "Unpaid"}
                </td>

                <td>
                  {o.isDelivered
                    ? "Delivered"
                    : "Not delivered"}
                </td>

                <td>
                  <button
                    className="mini-btn"
                    disabled={o.isPaid}
                    onClick={() =>
                      onChange(
                        o._id,
                        "pay"
                      )
                    }
                  >
                    Mark Paid
                  </button>

                  <button
                    className="mini-btn"
                    disabled={o.isDelivered}
                    onClick={() =>
                      onChange(
                        o._id,
                        "deliver"
                      )
                    }
                  >
                    Deliver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CategoriesView({
  categories,
}) {
  return (
    <section className="dashboard-card">
      <div className="card-header">
        <h2>Categories</h2>
        <span>
          {categories.length} live categories
        </span>
      </div>

      <div className="category-admin-grid">
        {categories.map((c) => (
          <div key={c._id}>
            <strong>{c.name}</strong>
            <span>
              {c.slug || "No slug"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsView({
  reviews,
}) {
  return (
    <section className="dashboard-card">
      <div className="card-header">
        <h2>Reviews</h2>
        <span>
          {reviews.length} live reviews
        </span>
      </div>

      <div className="reviews-admin-list">
        {reviews
          .slice(0, 30)
          .map((r) => (
            <div key={r._id}>
              <strong>
                {r.user?.name || "Customer"}
              </strong>

              <span>
                {"⭐".repeat(
                  Number(r.ratings || 0)
                )}
              </span>

              <p>
                {r.title || "No review text"}
              </p>
            </div>
          ))}
      </div>

      {!reviews.length && (
        <p className="muted">
          Reviews endpoint may require an
          admin-capable token or may return
          no records.
        </p>
      )}
    </section>
  );
}

export default AdminDashboard;