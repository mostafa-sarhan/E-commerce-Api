import { useEffect, useMemo, useState } from "react";

import {
  getProducts,
  getCategories,
} from "../../../services/api/productApi";

import { apiRequest } from "../../../services/api/api";

import {
  getAdminProducts,
  saveAdminProducts,
} from "../../../services/localStore";

import "./AdminProducts.css";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    title: "",
    price: "",
    quantity: "",
    category: "",
    description: "",
  });

  async function load() {
    setLoading(true);

    const [p, c] = await Promise.allSettled([
      getProducts("?limit=50"),
      getCategories(),
    ]);

    const remote =
      p.status === "fulfilled"
        ? p.value.data || []
        : [];

    const local = getAdminProducts();

    setProducts([...local, ...remote]);

    if (c.status === "fulfilled") {
      setCategories(c.value.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!category ||
            p.category?._id === category) &&
          p.title
            ?.toLowerCase()
            .includes(search.toLowerCase())
      ),
    [products, category, search]
  );

  function startEdit(p) {
    setEditing(p);

    setForm({
      title: p.title || "",
      price: p.price || "",
      quantity: p.quantity ?? p.stock ?? 0,
      category: p.category?._id || "",
      description: p.description || "",
    });
  }

  async function submit(e) {
    e.preventDefault();

    const payload = {
      title: form.title,
      price: Number(form.price),
      quantity: Number(form.quantity),
      category: form.category,
      description: form.description,
    };

    try {
      if (!editing) return;

      await apiRequest(
        `/api/v1/products/${editing._id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      alert("Product updated.");

      setEditing(null);

      setForm({
        title: "",
        price: "",
        quantity: "",
        category: "",
        description: "",
      });

      await load();
    } catch (error) {
      const local = getAdminProducts();

      const item = {
        _id: editing._id,
        id: editing._id,
        ...payload,
        category:
          categories.find(
            (c) => c._id === form.category
          ) || {
            _id: form.category,
            name: "Electronics",
          },
        imageCover:
          editing.imageCover ||
          "https://placehold.co/100x100?text=Product",
        local: true,
      };

      const next = local.map((x) =>
        x._id === editing._id ||
        x.id === editing._id
          ? item
          : x
      );

      saveAdminProducts(next);

      alert(
        "The public Route API rejected this admin update. The demo kept the edit in the local admin catalog."
      );

      setEditing(null);

      await load();
    }
  }

  async function remove(p) {
    if (!confirm(`Delete ${p.title}?`)) return;

    try {
      await apiRequest(
        `/api/v1/products/${p._id}`,
        {
          method: "DELETE",
        }
      );

      await load();

      alert("Product deleted.");
    } catch {
      const local = getAdminProducts();

      saveAdminProducts(
        local.filter(
          (x) =>
            x.id !== p._id &&
            x._id !== p._id
        )
      );

      setProducts(
        products.filter(
          (x) => x._id !== p._id
        )
      );

      alert(
        "Server deletion was not available for this token. The local admin copy was removed."
      );
    }
  }

  return (
    <main className="admin-products-page">
      <div className="admin-products-header">
        <div>
          <h1>Products</h1>
          <p>
            Manage catalog data with API-first
            operations and safe local fallback.
          </p>
        </div>
      </div>

      {editing && (
        <section className="admin-product-form">
          <h2>Edit Product</h2>

          <form onSubmit={submit}>
            <input
              placeholder="Product name"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              min="0"
              placeholder="Price"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              min="0"
              placeholder="Stock"
              value={form.quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity: e.target.value,
                })
              }
              required
            />

            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
              required
            >
              <option value="">
                Category
              </option>

              {categories.map((c) => (
                <option
                  key={c._id}
                  value={c._id}
                >
                  {c.name}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />

            <button>
              Save Changes
            </button>

            <button
              type="button"
              className="cancel"
              onClick={() =>
                setEditing(null)
              }
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      <div className="products-toolbar">
        <div className="admin-search">
          🔍

          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
        >
          <option value="">
            All Categories
          </option>

          {categories.map((c) => (
            <option
              key={c._id}
              value={c._id}
            >
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-products-card">
        {loading ? (
          <div className="products-loading">
            Loading products...
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="admin-product-info">
                        <img
                          src={
                            p.imageCover ||
                            "https://placehold.co/100x100?text=No+Image"
                          }
                          alt=""
                        />

                        <div>
                          <strong>
                            {p.title}
                          </strong>

                          <span>
                            ID: #{p._id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {p.category?.name ||
                        "Electronics"}
                    </td>

                    <td>
                      <strong>
                        ${p.price}
                      </strong>
                    </td>

                    <td>
                      {p.quantity ??
                        p.stock ??
                        0}
                    </td>

                    <td>
                      {(p.quantity ??
                        p.stock ??
                        0) > 0 ? (
                        <span className="product-status in-stock">
                          In Stock
                        </span>
                      ) : (
                        <span className="product-status out-stock">
                          Out of Stock
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="product-actions">
                        <button
                          className="edit-btn"
                          onClick={() =>
                            startEdit(p)
                          }
                        >
                          ✏️
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            remove(p)
                          }
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filtered.length && (
              <div className="no-products">
                No products found.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminProducts;