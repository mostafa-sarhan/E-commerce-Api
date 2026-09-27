import { useEffect, useState } from "react";
import { getCategories } from "../../../services/api/productApi";
import { getSellerProductsByOwner, saveSellerProducts } from "../../../services/localStore";
import { useAuth } from "../../../context/AuthContext";
import { Link } from "react-router-dom";
import "./../Seller.css";

function SellerProducts() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [sellerProducts, setSellerProducts] = useState(() => getSellerProductsByOwner(user?.email));
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    getCategories().then((data) => setCategories(data.data || [])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setSellerProducts(getSellerProductsByOwner(user?.email));
  }, [user?.email]);

  function saveProduct(e) {
    e.preventDefault();
    const categoryId = e.target.category.value;
    const category = categories.find((item) => item._id === categoryId);
    const productId = editing?.id || editing?._id || `local-${Date.now()}`;
    const item = {
      id: productId,
      _id: productId,
      title: e.target.title.value.trim(),
      price: Number(e.target.price.value),
      stock: Number(e.target.stock.value),
      quantity: Number(e.target.stock.value),
      category: category ? { _id: category._id, name: category.name } : { _id: categoryId, name: "Other" },
      categoryId,
      ownerEmail: user?.email,
      ownerId: user?._id || user?.email,
      description: e.target.description.value.trim(),
      imageCover: e.target.image.value.trim() || "https://placehold.co/500x500?text=Product",
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    const next = editing
      ? sellerProducts.map((p) => p.id === editing.id ? item : p)
      : [item, ...sellerProducts];
    const stored = JSON.parse(localStorage.getItem("electrostore_seller_products") || "[]");
    const others = stored.filter((p) => p.ownerEmail?.toLowerCase() !== user?.email?.toLowerCase());
    saveSellerProducts([...others, ...next]);
    setSellerProducts(next);
    setEditing(null);
    e.target.reset();
  }

  function remove(id) {
    if (!confirm("Delete this product from your seller catalog?")) return;
    const next = sellerProducts.filter((p) => p.id !== id);
    const stored = JSON.parse(localStorage.getItem("electrostore_seller_products") || "[]");
    const others = stored.filter((p) => p.ownerEmail?.toLowerCase() !== user?.email?.toLowerCase());
    saveSellerProducts([...others, ...next]);
    setSellerProducts(next);
  }

  const filtered = sellerProducts.filter((p) => p.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="seller-page">
      <div className="page-header">
        <p>SELLER CENTER</p>
        <h1>My Products</h1>
        <span>Manage only the products owned by your seller account.</span>
      </div>

      <section className="seller-card">
        <h2>{editing ? "Edit Product" : "Add Product"}</h2>
        <form className="seller-form" onSubmit={saveProduct}>
          <label>Name<input name="title" defaultValue={editing?.title || ""} required /></label>
          <label>Price<input name="price" type="number" min="0" step="0.01" defaultValue={editing?.price || ""} required /></label>
          <label>Stock<input name="stock" type="number" min="0" defaultValue={editing?.stock ?? 0} required /></label>
          <label>Category
            <select name="category" defaultValue={editing?.categoryId || editing?.category?._id || ""} required>
              <option value="">Choose category</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </label>
          <label className="full">Image URL<input name="image" type="url" defaultValue={editing?.imageCover || ""} placeholder="https://..." /></label>
          <label className="full">Description<textarea name="description" defaultValue={editing?.description || ""} /></label>
          <button className="seller-btn seller-primary" type="submit">{editing ? "Save Product" : "Add Product"}</button>
          {editing && <button type="button" className="seller-btn" onClick={() => setEditing(null)}>Cancel</button>}
        </form>
      </section>

      <div className="seller-toolbar">
        <input placeholder="Search your products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <strong>{filtered.length} products</strong>
      </div>

      <section className="seller-card">
        <h2>Your Products</h2>
        <table className="seller-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id || p._id}>
                <td><Link to={`/products/${p.id || p._id}`}>{p.title}</Link></td>
                <td>{p.category?.name || "—"}</td>
                <td>${Number(p.price || 0).toFixed(2)}</td>
                <td>{p.stock ?? p.quantity ?? 0}</td>
                <td>
                  <button className="seller-btn" onClick={() => setEditing(p)}>Edit</button>{" "}
                  <button className="seller-btn seller-danger" onClick={() => remove(p.id || p._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan="5" className="seller-muted">You have not added any products yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </main>
  );
}
export default SellerProducts;
