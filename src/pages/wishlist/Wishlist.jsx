import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  getFavorites,
  subscribeFavorites,
  toggleFavorite,
} from "../../services/favorites";
import {
  getWishlist,
  removeFromWishlist,
} from "../../services/api/wishlistApi";
import "./Wishlist.css";

const GUEST_OWNER = "guest";

function Wishlist() {
  const { user, role } = useAuth();
  const { addProduct } = useCart();

  const email = user?.email || "";
  const owner = email || GUEST_OWNER;

  const [snapshot, setSnapshot] = useState(() => ({
    owner,
    items: getFavorites(email),
  }));

  const [remoteItems, setRemoteItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [addingId, setAddingId] = useState("");

  const timerRef = useRef(null);

  /* Same store the navbar panel and the card hearts use, so all
     three surfaces always agree. */
  const localItems =
    snapshot.owner === owner
      ? snapshot.items
      : getFavorites(email);

  useEffect(
    () =>
      subscribeFavorites(() => {
        setSnapshot({
          owner,
          items: getFavorites(email),
        });
      }),
    [owner, email],
  );

  useEffect(() => {
    let active = true;

    async function loadRemote() {
      /* Signed-out visitors have no account wishlist to
         read, so the device-local list is the whole list. */
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getWishlist();

        if (active) {
          setRemoteItems(data.data || []);
        }
      } catch {
        /* keep the locally saved items */
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRemote();

    return () => {
      active = false;
    };
  }, [user, role]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const wishlist = [
    ...localItems,
    ...remoteItems.filter(
      (item) =>
        !localItems.some(
          (local) =>
            String(local.id) ===
            String(item._id || item.id)
        )
    ),
  ];

  function showStatus(message) {
    setStatus(message);

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setStatus("");
    }, 2600);
  }

  async function handleRemove(product) {
    const id = product._id || product.id;

    toggleFavorite(email, { _id: id });

    setRemoteItems((current) =>
      current.filter(
        (item) =>
          String(item._id || item.id) !== String(id)
      )
    );

    if (user && role === "customer") {
      try {
        await removeFromWishlist(id);
      } catch {
        showStatus(
          "Removed here, but still on your account list."
        );
        return;
      }
    }

    showStatus("Removed from your wishlist.");
  }

  async function handleAddToCart(product) {
    const id = product._id || product.id;

    setAddingId(String(id));

    try {
      await addProduct(product);

      showStatus("Added to cart ✓");
    } catch {
      showStatus("Could not add this item.");
    } finally {
      setAddingId("");
    }
  }

  return (
    <main className="products-page">
      <div className="page-header">
        <p>YOUR FAVORITES</p>

        <h1>Wishlist</h1>

        {status && (
          <p className="wishlist-status" role="status">
            {status}
          </p>
        )}
      </div>

      {loading ? (
        <div className="loading">
          Loading wishlist...
        </div>
      ) : wishlist.length === 0 ? (
        <div className="empty-state">
          <h2>Your wishlist is empty</h2>

          <p>
            Tap the heart on any product to save it
            here.
          </p>

          <Link
            to="/products"
            className="primary-button"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          {!user && (
            <p className="wishlist-note">
              {wishlist.length}{" "}
              {wishlist.length === 1 ? "item is" : "items are"}{" "}
              saved on this device. Sign in to keep
              them on your account.
            </p>
          )}

          <div className="products-grid">
            {wishlist.map((product) => {
              const id = product._id || product.id;
              const busy = addingId === String(id);

              return (
                <div
                  className="product-card"
                  key={id}
                >
                  <Link
                    to={`/products/${id}`}
                    className="product-image"
                  >
                    <img
                      src={product.imageCover}
                      alt={product.title}
                      loading="lazy"
                    />
                  </Link>

                  <div className="product-info">
                    <h3>
                      <Link to={`/products/${id}`}>
                        {product.title}
                      </Link>
                    </h3>

                    <div className="product-price">
                      {product.price === null ||
                      product.price === undefined
                        ? "Price unavailable"
                        : `$${product.price}`}
                    </div>
                  </div>

                  <div className="wishlist-card-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        handleAddToCart(product)
                      }
                      disabled={busy}
                    >
                      {busy ? "Adding..." : "Add to Cart"}
                    </button>

                    <button
                      type="button"
                      className="remove-button"
                      onClick={() =>
                        handleRemove(product)
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

export default Wishlist;