/**
 * Browser-side state that is genuinely part of the storefront,
 * not a stand-in for the backend.
 *
 * What lives here:
 *   - the guest cart, so a visitor can fill a cart before
 *     signing in. It is merged into the account cart on login
 *     and is cleared once the order reaches the API.
 *   - the wishlist cache, so a heart stays filled for products
 *     that are not saved to the account yet.
 *
 * What used to live here and no longer does: fake seller
 * products, a fake admin catalog, fake orders, fake reviews,
 * fake accounts, fake password-reset codes and a seeded demo
 * admin. Those were demo scaffolding that silently shadowed
 * real API data. The Route API is now the only source of truth
 * for accounts, products, orders and reviews.
 */

const KEYS = {
  wishlist: "electrostore_wishlist",
  carts: "electrostore_local_carts",
};

function read(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable - the session stays in memory only.
  }
}

export const getLocalWishlist = (userEmail) =>
  read(KEYS.wishlist, {})[userEmail?.toLowerCase()] || [];
export const saveLocalWishlist = (userEmail, items) => {
  const x = read(KEYS.wishlist, {});
  x[userEmail?.toLowerCase()] = items;
  write(KEYS.wishlist, x);
  return items;
};

export const getLocalCart = (userEmail) =>
  read(KEYS.carts, {})[userEmail?.toLowerCase()] || [];
export const saveLocalCart = (userEmail, items) => {
  const x = read(KEYS.carts, {});
  x[userEmail?.toLowerCase()] = items;
  write(KEYS.carts, x);
  return items;
};
export const clearLocalCart = (userEmail) => saveLocalCart(userEmail, []);