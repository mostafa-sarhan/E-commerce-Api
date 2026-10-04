import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getFavorites,
  subscribeFavorites,
  toggleFavorite,
} from "../../services/favorites";
import "./WishlistPanel.css";

const GUEST_OWNER = "guest";
const VISIBLE_LIMIT = 4;

function HeartIcon({ filled }) {
  return (
    <svg
      className="site-nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 20.3l-1.4-1.27C5.9 14.9 3.2 12.4 3.2 9.4c0-1.7 1.3-3 3-3 1.3 0 2.5.7 3.1 1.8l.3.6h3l.3-.6c.6-1.1 1.8-1.8 3.1-1.8 1.7 0 3 1.3 3 3 0 3-2.7 5.5-7.4 9.63L12 20.3z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4.5 6.5h15M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7M6.5 6.5l.8 12.2c0 .9.7 1.6 1.6 1.6h6.2c.9 0 1.6-.7 1.6-1.6l.8-12.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Navbar wishlist surface. Reads the same favourites store the
 * product card hearts write to, so the badge, this list and every
 * heart on the page can never disagree. Works for signed-out
 * visitors too, because the store is owner-scoped rather than
 * token-scoped.
 */
export default function WishlistPanel({
  userEmail,
  onNavigate,
}) {
  const email = userEmail || "";
  const owner = email || GUEST_OWNER;

  const [snapshot, setSnapshot] = useState(() => ({
    owner,
    items: getFavorites(email),
  }));

  const [open, setOpen] = useState(false);

  const wrapRef = useRef(null);
  const triggerRef = useRef(null);

  const items =
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
    if (!open) {
      return;
    }

    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") {
        return;
      }

      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  function handleRemove(item) {
    toggleFavorite(email, { _id: item.id });
  }

  const hiddenItems = Math.max(0, items.length - VISIBLE_LIMIT);

  return (
    <div className="site-wishlist" ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`site-nav-link site-nav-link-wishlist site-wishlist-trigger${
          open ? " is-open" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="site-wishlist-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <HeartIcon filled={items.length > 0} />

        <span>Wishlist</span>

        {items.length > 0 && (
          <span className="site-nav-count">
            {items.length}
          </span>
        )}
      </button>

      <div
        id="site-wishlist-panel"
        className={`site-wishlist-panel${
          open ? " is-open" : ""
        }`}
      >
        <div className="site-wishlist-head">
          <strong>Your Wishlist</strong>

          <span>
            {items.length}{" "}
            {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="site-wishlist-empty">
            Tap the heart on any product and
            it will show up here.
          </p>
        ) : (
          <>
            <ul className="site-wishlist-list">
              {items.slice(0, VISIBLE_LIMIT).map((item) => (
                <li
                  className="site-wishlist-row"
                  key={item.id}
                >
                  <Link
                    to={`/products/${item.id}`}
                    className="site-wishlist-thumb"
                    onClick={onNavigate}
                    tabIndex={open ? 0 : -1}
                  >
                    {item.imageCover ? (
                      <img
                        src={item.imageCover}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className="site-wishlist-thumb-blank"></span>
                    )}
                  </Link>

                  <div className="site-wishlist-meta">
                    <Link
                      to={`/products/${item.id}`}
                      className="site-wishlist-name"
                      onClick={onNavigate}
                      tabIndex={open ? 0 : -1}
                    >
                      {item.title}
                    </Link>

                    <span className="site-wishlist-price">
                      {item.price === null ||
                      item.price === undefined
                        ? "Price unavailable"
                        : `$${item.price}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="site-wishlist-remove"
                    onClick={() =>
                      handleRemove(item)
                    }
                    tabIndex={open ? 0 : -1}
                    aria-label={`Remove ${item.title} from wishlist`}
                    title="Remove from wishlist"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>

            {hiddenItems > 0 && (
              <p className="site-wishlist-more">
                +{hiddenItems} more saved
              </p>
            )}
          </>
        )}

        <Link
          to="/wishlist"
          className="site-wishlist-cta"
          onClick={onNavigate}
          tabIndex={open ? 0 : -1}
        >
          View full wishlist
        </Link>
      </div>
    </div>
  );
}