import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getUserOrders, toOrderArray } from "../../services/api/orderApi";

import { useAuth } from "../../context/AuthContext";

import "./Orders.css";

/* Order count shown before the list collapses to a "+ n more" toggle.
   A single real order can carry a dozen cart items, so the preview
   is capped and the rest is one click away. */
const PREVIEW_LIMIT = 3;

const PAYMENT_LABELS = {
  cash: "Cash on delivery",
  card: "Card payment",
  online: "Online payment",
  wallet: "Wallet payment",
};

/* Only two booleans come back from the API, so those are the only
   states the page claims. `isPaid` / `isDelivered` are set server
   side by the admin, never by this page, and the same three labels
   are used in the admin dashboard so both screens agree. */
function statusOf(order) {
  if (order?.isDelivered) {
    return { tone: "done", label: "Delivered" };
  }

  if (order?.isPaid) {
    return { tone: "paid", label: "Paid" };
  }

  return { tone: "pending", label: "Pending" };
}

function paymentLabel(order) {
  const raw = order?.paymentMethodType || order?.paymentMethod;

  if (!raw || typeof raw !== "string") {
    return "Not recorded";
  }

  return PAYMENT_LABELS[raw.toLowerCase()] || raw;
}

/* A full Mongo id is unreadable in a card header, so only the tail
   is shown. The real id stays on the element for copy/paste and is
   still the key for anything that needs it. */
function shortId(value) {
  const id = String(value ?? "").trim();

  if (!id) {
    return "—";
  }

  return id.slice(-6).toUpperCase();
}

function money(value) {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount.toFixed(2) : null;
}

function formatDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function orderTime(order) {
  const time = new Date(
    order?.createdAt || 0
  ).getTime();

  return Number.isFinite(time) ? time : 0;
}

/* One malformed line is dropped instead of taking the page down. */
function safeItems(order) {
  return (Array.isArray(order?.cartItems)
    ? order.cartItems
    : []
  ).filter((item) => item && typeof item === "object");
}

function brandName(product) {
  const brand = product?.brand;

  if (!brand) {
    return "";
  }

  return typeof brand === "string" ? brand : brand.name || "";
}

function productTitle(product) {
  const title = product?.title;

  return typeof title === "string" ? title.trim() : "";
}

function itemCount(item) {
  const count = Number(item?.count);

  return Number.isFinite(count) && count > 0 ? count : 1;
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M6.2 7h11.6l1.1 12.1a1.5 1.5 0 0 1-1.5 1.65H6.6A1.5 1.5 0 0 1 5.1 19.1L6.2 7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <path
        d="M9 9.4V6.6a3 3 0 0 1 6 0v2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M12 7.6v5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="16.2"
        r="1.05"
        fill="currentColor"
      />
    </svg>
  );
}

function ImagePlaceholder() {
  return (
    <span className="order-item-placeholder" aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <rect
          x="5"
          y="11"
          width="38"
          height="26"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        <circle
          cx="24"
          cy="24"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}

function OrderItemRow({ item }) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const product = item?.product;
  const title = productTitle(product);
  const count = itemCount(item);
  const unit = money(item?.price);
  const brand = brandName(product);
  const image = product?.imageCover;

  return (
    <li className="order-item">
      <span className="order-item-media">
        {!image || imageFailed ? (
          <ImagePlaceholder />
        ) : (
          <img
            src={image}
            alt={title || "Ordered product"}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
      </span>

      <span className="order-item-body">
        {brand ? (
          <span className="order-item-brand">
            {brand}
          </span>
        ) : null}

        <span className="order-item-title">
          {title || "Product unavailable"}
        </span>

        <span className="order-item-meta">
          {count > 1 ? `Qty ${count}` : "Qty 1"}
        </span>
      </span>

      {unit ? (
        <span className="order-item-price">
          {count > 1 ? (
            <span className="order-item-each">
              {count} × ${unit}
            </span>
          ) : null}

          <strong>
            ${money(Number(item.price) * count)}
          </strong>
        </span>
      ) : null}
    </li>
  );
}

function OrderCard({ order }) {
  const [showAllItems, setShowAllItems] =
    useState(false);
  const [showDetails, setShowDetails] =
    useState(false);

  const status = statusOf(order);
  const items = safeItems(order);
  const hidden = Math.max(
    0,
    items.length - PREVIEW_LIMIT
  );
  const visibleItems = showAllItems
    ? items
    : items.slice(0, PREVIEW_LIMIT);

  const totalUnits = items.reduce(
    (sum, item) => sum + itemCount(item),
    0
  );

  const placed = formatDate(order?.createdAt);
  const total = money(order?.totalOrderPrice);
  const tax = money(order?.taxPrice);
  const shipping = money(order?.shippingPrice);
  const address = order?.shippingAddress;
  const addressParts = [
    address?.details,
    address?.city,
  ].filter(
    (part) =>
      typeof part === "string" && part.trim()
  );
  const addressPhone =
    typeof address?.phone === "string"
      ? address.phone.trim()
      : "";

  return (
    <article className="order-card">
      <header className="order-card-head">
        <div className="order-ident">
          <span className="order-label">Order</span>

          <h2
            className="order-code"
            title={String(order?._id ?? "")}
          >
            #{shortId(order?._id)}
          </h2>
        </div>

        <div className="order-ident">
          <span className="order-label">Placed</span>

          <p className="order-date">
            {placed || "Date unavailable"}
          </p>
        </div>

        <span
          className={`order-badge is-${status.tone}`}
        >
          {status.label}
        </span>
      </header>

      <ul className="order-items">
        {visibleItems.map((item, index) => (
          <OrderItemRow
            key={
              item._id ||
              `${item?.product?._id || "item"}-${index}`
            }
            item={item}
          />
        ))}
      </ul>

      {hidden > 0 ? (
        <button
          type="button"
          className="order-more"
          onClick={() => setShowAllItems((open) => !open)}
          aria-expanded={showAllItems}
        >
          {showAllItems
            ? "Show fewer items"
            : `+ ${hidden} more ${hidden === 1 ? "item" : "items"}`}
        </button>
      ) : null}

      <footer className="order-card-foot">
        <dl className="order-facts">
          <div className="order-fact">
            <dt>Payment</dt>

            <dd>{paymentLabel(order)}</dd>
          </div>

          <div className="order-fact">
            <dt>
              {totalUnits === 1 ? "Item" : "Items"}
            </dt>

            <dd>
              {items.length
                ? `${items.length} · ${totalUnits} unit${
                    totalUnits === 1 ? "" : "s"
                  }`
                : "None"}
            </dd>
          </div>

          <div className="order-fact">
            <dt>Payment status</dt>

            <dd>{order?.isPaid ? "Paid" : "Unpaid"}</dd>
          </div>
        </dl>

        <div className="order-total">
          <span>Total</span>

          <strong>
            {total ? `$${total}` : "—"}
          </strong>
        </div>
      </footer>

      <div className="order-card-actions">
        <button
          type="button"
          className="order-toggle"
          onClick={() => setShowDetails((open) => !open)}
          aria-expanded={showDetails}
        >
          {showDetails ? "Hide details" : "View details"}

          <svg
            className="order-chevron"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M7 10l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {showDetails ? (
        <div className="order-details">
          {addressParts.length ? (
            <div className="order-detail-block">
              <h3>Delivery address</h3>

              <p>
                {addressParts.join(", ")}
                {addressPhone ? (
                  <>
                    <br />
                    {addressPhone}
                  </>
                ) : null}
              </p>
            </div>
          ) : null}

          {/* Only the fields the order actually carries. taxPrice and
              shippingPrice are part of the stored order, so they are
              shown when present and hidden when they are not. */}
          {tax !== null || shipping !== null ? (
            <div className="order-detail-block">
              <h3>Payment summary</h3>

              <dl className="order-breakdown">
                {shipping !== null ? (
                  <div>
                    <dt>Shipping</dt>
                    <dd>${shipping}</dd>
                  </div>
                ) : null}

                {tax !== null ? (
                  <div>
                    <dt>Tax</dt>
                    <dd>${tax}</dd>
                  </div>
                ) : null}

                <div>
                  <dt>Method</dt>
                  <dd>{paymentLabel(order)}</dd>
                </div>

                <div>
                  <dt>Status</dt>
                  <dd>
                    {order?.isPaid ? "Paid" : "Unpaid"}
                  </dd>
                </div>

                {total ? (
                  <div className="is-total">
                    <dt>Total</dt>
                    <dd>${total}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function OrderSkeleton() {
  return (
    <div
      className="order-card order-skeleton"
      aria-hidden="true"
    >
      <div className="order-card-head">
        <div className="order-ident">
          <span className="sk sk-sm" />
          <span className="sk sk-md" />
        </div>

        <div className="order-ident">
          <span className="sk sk-sm" />
          <span className="sk sk-md" />
        </div>

        <span className="sk sk-pill" />
      </div>

      <ul className="order-items">
        {[0, 1].map((row) => (
          <li className="order-item" key={row}>
            <span className="sk sk-thumb" />

            <span className="order-item-body">
              <span className="sk sk-sm" />
              <span className="sk sk-lg" />
              <span className="sk sk-sm" />
            </span>
          </li>
        ))}
      </ul>

      <footer className="order-card-foot">
        <span className="sk sk-block" />

        <span className="sk sk-total" />
      </footer>
    </div>
  );
}

function MessageState({
  icon,
  title,
  description,
  children,
}) {
  return (
    <div className="orders-message">
      <span className="orders-message-icon">
        {icon}
      </span>

      <h2>{title}</h2>

      {description ? <p>{description}</p> : null}

      {children}
    </div>
  );
}

export default function Orders() {

console.log("ORDERS PAGE IS OPEN");

  const { user } = useAuth();

  const userId = user?._id;

  /* The result is stored against the account it was fetched for, so
     a signed-in swap can never show the previous account's orders,
     and the skeleton state is derived instead of being pushed into
     the effect body. */
  const [result, setResult] = useState(null);

  const [waiting, setWaiting] = useState(null);
  const [attempt, setAttempt] = useState(0);

  /* Without the account id there is no endpoint to call. That is a
     failed lookup, not an account with no orders, and it is derived
     here rather than written from an effect. */
  const missingIdError = userId
    ? ""
    : "Your account id could not be read, so orders cannot be loaded. Please sign in again.";

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;

    async function request() {
      try {
        const d = await getUserOrders(userId);

        if (!active) {
          return;
        }

        setResult({
          userId,
          orders: toOrderArray(d).sort(
            (a, b) => orderTime(b) - orderTime(a)
          ),
          error: "",
        });
      } catch (err) {
        console.warn(
          "[orders] could not load orders:",
          err?.message
        );

        if (!active) {
          return;
        }

        setResult({
          userId,
          orders: [],
          error:
            err?.message ||
            "Could not load your orders.",
        });
      } finally {
        if (active) {
          setWaiting(null);
        }
      }
    }

    request();

    return () => {
      active = false;
    };
  }, [userId, attempt]);

  const loading =
    userId &&
    (waiting === userId || result?.userId !== userId);

  const orders = missingIdError
    ? []
    : result?.userId === userId
      ? result.orders
      : [];

  const error = missingIdError || result?.error || "";

  function retry() {
    setWaiting(userId);
    setAttempt((n) => n + 1);
  }

  if (!user) {
    return (
      <main className="products-page orders-page">
        <MessageState
          icon={<AlertIcon />}
          title="Please sign in first"
          description="Your order history is tied to your account."
        >
          <Link
            to="/login"
            className="primary-button orders-cta"
          >
            Sign in
          </Link>
        </MessageState>
      </main>
    );
  }

  const counts = orders.reduce(
    (tally, order) => {
      tally[statusOf(order).tone] += 1;

      return tally;
    },
    { pending: 0, paid: 0, done: 0 }
  );

  return (
    <main className="products-page orders-page">
      <header className="orders-head">
        <div className="orders-head-text">
          <p className="orders-eyebrow">
            ORDER HISTORY
          </p>

          <h1>My Orders</h1>

          <p className="orders-sub">
            Track and review your recent
            purchases.
          </p>
        </div>

        {/* The summary only appears when there is something real to
            count, so it can never sit above a failed lookup. */}
        {!loading && !error && orders.length ? (
          <ul className="orders-summary">
            <li className="orders-summary-total">
              <strong>{orders.length}</strong>

              <span>
                {orders.length === 1
                  ? "order"
                  : "orders"}
              </span>
            </li>

            {counts.done ? (
              <li className="orders-summary-chip is-done">
                {counts.done} delivered
              </li>
            ) : null}

            {counts.paid ? (
              <li className="orders-summary-chip is-paid">
                {counts.paid} paid
              </li>
            ) : null}

            {counts.pending ? (
              <li className="orders-summary-chip is-pending">
                {counts.pending} pending
              </li>
            ) : null}
          </ul>
        ) : null}
      </header>

      {loading ? (
        <>
          <p className="orders-sr-only" role="status">
            Loading your orders.
          </p>

          <div className="orders-list">
            {[0, 1, 2].map((row) => (
              <OrderSkeleton key={row} />
            ))}
          </div>
        </>
      ) : error ? (
        <MessageState
          icon={<AlertIcon />}
          title="Couldn't load your orders"
          description={error}
        >
          <button
            type="button"
            className="secondary-button orders-cta"
            onClick={retry}
          >
            Retry
          </button>
        </MessageState>
      ) : !orders.length ? (
        <MessageState
          icon={<BagIcon />}
          title="No orders yet"
          description="When you place an order, you'll be able to track it here."
        >
          <Link
            to="/products"
            className="primary-button orders-cta"
          >
            Start Shopping
          </Link>
        </MessageState>
      ) : (
        <div className="orders-list">
          {orders.map((order, index) => (
            <OrderCard
              key={order?._id || `order-${index}`}
              order={order}
            />
          ))}
        </div>
      )}
    </main>
  );
}