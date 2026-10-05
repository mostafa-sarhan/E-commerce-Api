
const STORAGE_KEY = "voltix_favorites";
const GUEST_OWNER = "guest";

function ownerOf(userEmail) {
  const email = String(userEmail || "")
    .trim()
    .toLowerCase();

  return email || GUEST_OWNER;
}

function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable - hearts stay in memory this session */
  }
}

const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeFavorites(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getFavorites(userEmail) {
  const items = readStore()[ownerOf(userEmail)];

  return Array.isArray(items) ? items : [];
}

export function isFavorite(userEmail, productId) {
  if (productId === undefined || productId === null) {
    return false;
  }

  return getFavorites(userEmail).some(
    (item) => String(item.id) === String(productId),
  );
}

function summarise(product) {
  return {
    id: String(product?._id || product?.id || ""),
    title: product?.title || "",
    price: product?.price ?? null,
    imageCover: product?.imageCover || "",
    brand: product?.brand?.name || "",
    category: product?.category?.name || "",
  };
}

export function removeFavorite(userEmail, productId) {
  if (productId === undefined || productId === null) {
    return false;
  }

  const owner = ownerOf(userEmail);
  const current = getFavorites(userEmail);
  const next = current.filter(
    (item) => String(item.id) !== String(productId),
  );

  if (next.length === current.length) {
    return false;
  }

  const store = readStore();
  store[owner] = next;
  writeStore(store);
  emit();
  return true;
}

export function clearFavorites(userEmail) {
  const owner = ownerOf(userEmail);
  const store = readStore();

  if (!Array.isArray(store[owner]) || !store[owner].length) {
    return false;
  }

  store[owner] = [];
  writeStore(store);
  emit();
  return true;
}

export function toggleFavorite(userEmail, product) {
  const id = String(product?._id || product?.id || "");

  if (!id) {
    return false;
  }

  const owner = ownerOf(userEmail);
  const current = getFavorites(userEmail);
  const exists = current.some((item) => String(item.id) === id);

  const next = exists
    ? current.filter((item) => String(item.id) !== id)
    : [summarise(product), ...current];

  const store = readStore();
  store[owner] = next;
  writeStore(store);
  emit();
  return !exists;
}
