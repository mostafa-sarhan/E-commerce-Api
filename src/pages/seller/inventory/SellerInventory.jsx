import { useEffect, useMemo, useState } from "react";
import { getSellerProductsByOwner } from "../../../services/localStore";
import { useAuth } from "../../../context/AuthContext";
import { Link } from "react-router-dom";
import "./../Seller.css";

function SellerInventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState(() => getSellerProductsByOwner(user?.email));
  const [query, setQuery] = useState("");

  useEffect(() => {
    setProducts(getSellerProductsByOwner(user?.email));
  }, [user?.email]);

  const filtered = useMemo(() => products.filter((p) => p.title?.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const low = products.filter((p) => Number(p.stock ?? p.quantity ?? 0) <= 5).length;
  const out = products.filter((p) => Number(p.stock ?? p.quantity ?? 0) <= 0).length;
  const units = products.reduce((sum, p) => sum + Number(p.stock ?? p.quantity ?? 0), 0);

  return (
    <main className="seller-page">
      <div className="page-header"><p>SELLER CENTER</p><h1>Inventory</h1><span>Monitor the stock of your own products.</span></div>
      <section className="seller-stats">
        <div className="seller-stat"><p>My Products</p><strong>{products.length}</strong></div>
        <div className="seller-stat"><p>Low Stock</p><strong>{low}</strong></div>
        <div className="seller-stat"><p>Out of Stock</p><strong>{out}</strong></div>
        <div className="seller-stat"><p>Available Units</p><strong>{units}</strong></div>
      </section>
      <section className="seller-card">
        <div className="seller-toolbar"><input placeholder="Search my inventory..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <table className="seller-table">
          <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((p) => {
              const stock = Number(p.stock ?? p.quantity ?? 0);
              return <tr key={p.id || p._id}><td><Link to={`/products/${p.id || p._id}`}>{p.title}</Link></td><td>{p.category?.name || "—"}</td><td>{stock}</td><td>{stock <= 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock"}</td></tr>;
            })}
            {!filtered.length && <tr><td colSpan="4" className="seller-muted">No products in your inventory yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </main>
  );
}
export default SellerInventory;
