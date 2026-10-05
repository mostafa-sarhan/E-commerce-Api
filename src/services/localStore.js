
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