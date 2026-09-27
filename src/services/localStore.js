const KEYS = {
  sellerProducts: "electrostore_seller_products",
  adminProducts: "electrostore_admin_products",
  orders: "electrostore_orders",
  reviews: "electrostore_reviews",
  accounts: "electrostore_accounts",
  reset: "electrostore_reset_codes",
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
  localStorage.setItem(key, JSON.stringify(value));
}

export const getSellerProducts = () => read(KEYS.sellerProducts);
export const getAdminProducts = () => read(KEYS.adminProducts);
export const saveAdminProducts = (v) => write(KEYS.adminProducts, v);
export const saveSellerProducts = (v) => write(KEYS.sellerProducts, v);
export const getPublicSellerProducts = () => getSellerProducts();
export const getSellerProductById = (id) =>
  getSellerProducts().find((p) => String(p.id || p._id) === String(id));
export const getSellerProductsByOwner = (email) =>
  getSellerProducts().filter(
    (p) => p.ownerEmail?.toLowerCase() === email?.toLowerCase()
  );

export const getOrders = () => read(KEYS.orders);
export const saveOrders = (v) => write(KEYS.orders, v);
export const addLocalOrder = (o) => {
  const x = getOrders().filter((item) => item._id !== o._id);
  x.unshift(o);
  saveOrders(x);
  return o;
};
export const getLocalUserOrders = (userId) =>
  getOrders().filter(
    (o) => String(o.userId || o.user?._id || o.user?.email) === String(userId)
  );
export const updateLocalOrder = (id, patch) => {
  const x = getOrders().map((o) =>
    o._id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o
  );
  saveOrders(x);
  return x.find((o) => o._id === id);
};

export const getReviews = () => read(KEYS.reviews);
export const saveReviews = (v) => write(KEYS.reviews, v);
export const getProductLocalReviews = (id) =>
  getReviews().filter(
    (r) => String(r.productId || r.product?._id || r.product?.id) === String(id)
  );
export const addLocalReview = (r) => {
  const x = getReviews().filter((item) => item._id !== r._id);
  x.unshift(r);
  saveReviews(x);
  return r;
};

export const getLocalAccounts = () => read(KEYS.accounts);
export const saveLocalAccounts = (v) => write(KEYS.accounts, v);
export const findLocalAccount = (email, role) =>
  getLocalAccounts().find((a) => {
    const sameEmail = a.email?.toLowerCase() === email?.toLowerCase();
    return sameEmail && (!role || a.role === role);
  });
export const addLocalAccount = (a) => {
  const x = getLocalAccounts().filter(
    (item) =>
      !(
        item.email?.toLowerCase() === a.email?.toLowerCase() &&
        item.role === a.role
      )
  );
  x.push(a);
  saveLocalAccounts(x);
  return a;
};

export const saveResetCode = (email, code) => {
  const x = read(KEYS.reset, {});
  x[email.toLowerCase()] = { code, expiresAt: Date.now() + 600000 };
  write(KEYS.reset, x);
};
export const getResetCode = (e) =>
  read(KEYS.reset, {})[e.toLowerCase()] || null;
export const clearResetCode = (e) => {
  const x = read(KEYS.reset, {});
  delete x[e.toLowerCase()];
  write(KEYS.reset, x);
};

export const getSellerOrders = getOrders;
export const saveSellerOrders = saveOrders;

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
