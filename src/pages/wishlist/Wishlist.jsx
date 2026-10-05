import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  clearFavorites,
  getFavorites,
  isFavorite,
  removeFavorite,
  subscribeFavorites,
  toggleFavorite,
} from "../../services/favorites";

import {
  getWishlist,
  removeFromWishlist,
} from "../../services/api/wishlistApi";

import { getProductById } from "../../services/api/productApi";

import ProductCard from "../../components/ProductCard/ProductCard";

import "./Wishlist.css";

const GUEST_OWNER = "guest";

/* Saved favourites hold a small summary (id, title, price,
   image). An entry missing any of those is completed from the
   product API, capped so a corrupt store can never fire an
   unbounded burst of requests. */
const MAX_RESOLVED = 12;

const STATUS_MS = 2600;

function entryId(entry) {
  if (!entry) {
    return "";
  }

  const raw =
    typeof entry === "object"
      ? entry._id || entry.id
      : entry;

  return raw === undefined || raw === null
    ? ""
    : String(raw).trim();
}

function namedRef(value) {
  if (typeof value === "string") {
    return value;
  }

  return value?.name || "";
}

function toProduct(entry) {
  const id = entryId(entry);

  if (!id) {
    return null;
  }

  const source =
    typeof entry === "object" ? entry : {};

  const brand = namedRef(source.brand);
  const category = namedRef(source.category);

  return {
    ...source,
    _id: id,
    title: source.title || "",
    price: source.price ?? null,
    imageCover: source.imageCover || "",
    brand: brand ? { name: brand } : null,
    category: category ? { name: category } : null,
  };
}

function layer(base, extra) {
  if (!base) {
    return extra ? { ...extra } : null;
  }

  if (!extra) {
    return base;
  }

  return {
    ...base,
    title: base.title || extra.title,
    price: base.price ?? extra.price,
    imageCover: base.imageCover || extra.imageCover,
    brand: base.brand || extra.brand,
    category: base.category || extra.category,
  };
}

/* A freshly fetched product becomes the base so its stock and
   rating fields survive, and the account entry plus the device
   summary fill any gaps. Every layer is optional, so a missing
   or malformed one never breaks the card. */
function combine(entry, fallback, resolved) {
  const live = toProduct(resolved);

  const account = layer(
    toProduct(entry),
    toProduct(fallback),
  );

  return live ? layer(live, account) : account;
}

function indexById(items) {
  const map = new Map();

  items.forEach((item) => {
    const id = entryId(item);

    if (id && !map.has(id)) {
      map.set(id, item);
    }
  });

  return map;
}

function mergeEntries(savedItems, accountItems, resolved) {
  const saved = indexById(savedItems);
  const account = indexById(accountItems);

  return [...new Set([...saved.keys(), ...account.keys()])]
    .map((id) =>
      combine(
        account.get(id),
        saved.get(id),
        resolved[id],
      )
    )
    .filter(Boolean);
}

function needsResolution(product) {
  return (
    !product.title ||
    !product.imageCover ||
    product.price === null ||
    product.price === undefined
  );
}

function isRenderable(product) {
  return (
    Boolean(product?.title) &&
    product?.price !== null &&
    product?.price !== undefined
  );
}

function readAccountWishlist(data) {
  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return Array.isArray(data) ? data : [];
}

function EmptyHeart() {
  return (
    <span
      className="wishlist-empty-art"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        focusable="false"
      >
        <path
          d="M12 20.3l-1.4-1.27C5.9 14.9 3.2 12.4 3.2 9.4c0-1.7 1.3-3 3-3 1.3 0 2.5.7 3.1 1.8l.3.6h3l.3-.6c.6-1.1 1.8-1.8 3.1-1.8 1.7 0 3 1.3 3 3 0 3-2.7 5.5-7.4 9.63L12 20.3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Wishlist() {
  const { user, role } = useAuth();

  const email = user?.email || "";
  const owner = email || GUEST_OWNER;
  const isCustomer = Boolean(user) && role === "customer";

  const [saved, setSaved] = useState(() => ({
    owner,
    items: getFavorites(email),
  }));

  const [accountItems, setAccountItems] = useState([]);
  const [resolved, setResolved] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const timerRef = useRef(null);

  const savedItems =
    saved.owner === owner ? saved.items : getFavorites(email);

  useEffect(
    () =>
      subscribeFavorites(() => {
        setSaved({
          owner,
          items: getFavorites(email),
        });
      }),
    [owner, email],
  );

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      /* Signed-out visitors have no account wishlist, so the
         device list is the whole list. */
      if (!isCustomer) {
        if (active) {
          setAccountItems([]);
          setLoading(false);
        }

        return;
      }

      try {
        const data = await getWishlist();

        if (active) {
          setAccountItems(
            readAccountWishlist(data).filter(
              (item) => item && typeof item === "object"
            )
          );
        }
      } catch {
        /* keep the locally saved items */
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, [isCustomer, email]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  /* Anything the account wishlist holds that this device has not
     seen is written into the same favourites store, so the card
     hearts, the navbar badge and this grid never disagree. */
  useEffect(() => {
    accountItems.forEach((item) => {
      const id = entryId(item);

      if (id && !isFavorite(email, id)) {
        toggleFavorite(email, item);
      }
    });
  }, [accountItems, email]);

  const entries = useMemo(
    () => mergeEntries(savedItems, accountItems, resolved),
    [savedItems, accountItems, resolved],
  );

  const pendingIds = useMemo(
    () =>
      entries
        .filter(needsResolution)
        .map((entry) => entry._id)
        .slice(0, MAX_RESOLVED),
    [entries],
  );

  useEffect(() => {
    if (!pendingIds.length) {
      return;
    }

    let active = true;

    Promise.allSettled(
      pendingIds.map((id) => getProductById(id))
    ).then((results) => {
      if (!active) {
        return;
      }

      const found = {};

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const product = result.value?.data;
          const id = entryId(product);

          if (id) {
            found[pendingIds[index]] = product;
          }
        }
      });

      if (Object.keys(found).length) {
        setResolved((current) => ({
          ...current,
          ...found,
        }));
      }
    });

    return () => {
      active = false;
    };
  }, [pendingIds]);

  const products = entries.filter(isRenderable);
  const count = products.length;

  function showStatus(message) {
    setStatus(message);

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setStatus("");
    }, STATUS_MS);
  }

  async function handleRemove(product, favorite) {
    const id = entryId(product);

    if (!id || !favorite) {
      return;
    }

    removeFavorite(email, id);

    setAccountItems((current) =>
      current.filter((item) => entryId(item) !== id)
    );

    if (!isCustomer) {
      showStatus("Removed from your wishlist.");
      return;
    }

    try {
      await removeFromWishlist(id);
      showStatus("Removed from your wishlist.");
    } catch {
      showStatus("Removed here, but still on your account list.");
    }
  }

  async function handleClear() {
    const ids = entries.map((entry) => entry._id);

    clearFavorites(email);
    setAccountItems([]);
    setResolved({});

    if (!isCustomer || !ids.length) {
      showStatus("Wishlist cleared.");
      return;
    }

    const results = await Promise.allSettled(
      ids.map((id) => removeFromWishlist(id))
    );

    const failed = results.some(
      (result) => result.status === "rejected"
    );

    showStatus(
      failed
        ? "Cleared on this device, but some items are still on your account list."
        : "Wishlist cleared."
    );
  }

  return (
    <main className="wishlist-page">
      <div className="voltix-container">
        <header className="wishlist-head">
          <p className="wishlist-kicker">Saved for later</p>

          <h1 className="wishlist-title">My Wishlist</h1>

          <p className="wishlist-subtitle">
            Keep your favorite products in one place.
          </p>

          <div className="wishlist-bar">
            <p className="wishlist-count">
              {count}{" "}
              {count === 1 ? "saved item" : "saved items"}
            </p>

            {count > 0 ? (
              <button
                type="button"
                className="wishlist-clear"
                onClick={handleClear}
              >
                Clear Wishlist
              </button>
            ) : null}
          </div>

          {count > 0 && !isCustomer ? (
            <p className="wishlist-note">
              Saved on this device. Sign in to keep them on
              your account.
            </p>
          ) : null}

          {status ? (
            <p className="wishlist-status" role="status">
              {status}
            </p>
          ) : null}
        </header>

        {loading ? (
          <p className="wishlist-loading">Loading your wishlist...</p>
        ) : !count ? (
          <section className="wishlist-empty">
            <EmptyHeart />

            <h2>Your wishlist is empty</h2>

            <p>
              Save products you love and come back to them
              anytime.
            </p>

            <Link
              to="/products"
              className="wishlist-empty-cta"
            >
              Browse Products
            </Link>
          </section>
        ) : (
          <div className="wishlist-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onToggleFavorite={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
