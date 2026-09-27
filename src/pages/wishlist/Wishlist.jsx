import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getLocalWishlist, saveLocalWishlist } from "../../services/localStore";
import {
  getWishlist,
  removeFromWishlist,
} from "../../services/api/wishlistApi";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();

  async function loadWishlist() {
    try {
      const local = getLocalWishlist(user?.email);
      if (role === "seller") {
        setWishlist(local);
        return;
      }
      const data = await getWishlist();
      const remote = data.data || [];
      const merged = [...remote, ...local];
      setWishlist([...new Map(merged.map((item) => [String(item._id || item.id), item])).values()]);
    } catch (error) {
      setWishlist(getLocalWishlist(user?.email));
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeProduct(id) {
    try {
      const next = wishlist.filter((item) => String(item._id || item.id) !== String(id));
      const local = getLocalWishlist(user?.email);
      const localNext = local.filter((item) => String(item._id || item.id) !== String(id));
      const wasLocal = localNext.length !== local.length;

      if (wasLocal || role === "seller") {
        saveLocalWishlist(user?.email, localNext);
      }
      if (role !== "seller" && !wasLocal) {
        await removeFromWishlist(id);
      }
      setWishlist(next);
    } catch (error) {
      alert(error.message);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, [role, user?.email]);

  return (
    <main className="products-page">

      <div className="page-header">
        <p>YOUR FAVORITES</p>
        <h1>Wishlist</h1>
      </div>

      {loading ? (
        <div className="loading">
          Loading wishlist...
        </div>
      ) : wishlist.length === 0 ? (
        <div className="empty-state">
          <h2>Your wishlist is empty</h2>
          <p>Add products you want to save.</p>
        </div>
      ) : (
        <div className="products-grid">

          {wishlist.map((product) => (

            <div
              className="product-card"
              key={product._id || product.id}
            >

              <div className="product-image">
                <img
                  src={product.imageCover}
                  alt={product.title}
                />
              </div>

              <div className="product-info">
                <h3>{product.title}</h3>

                <div className="product-price">
                  ${product.price}
                </div>
              </div>

              <button
                className="remove-button"
                onClick={() =>
                  removeProduct(product._id || product.id)
                }
              >
                Remove from Wishlist
              </button>

            </div>

          ))}

        </div>
      )}

    </main>
  );
}

export default Wishlist;
import "./Wishlist.css";
