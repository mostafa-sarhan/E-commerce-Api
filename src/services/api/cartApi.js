 import { apiRequest } from "./api";

export function getCart() {
  return apiRequest("/api/v2/cart");
}

export function addToCart(productId) {
  return apiRequest("/api/v2/cart", {
    method: "POST",
    body: JSON.stringify({
      productId,
    }),
  });
}

export function updateCartItem(productId, count) {
  return apiRequest(`/api/v2/cart/${productId}`, {
    method: "PUT",
    body: JSON.stringify({
      count,
    }),
  });
}

export function removeFromCart(productId) {
  return apiRequest(`/api/v2/cart/${productId}`, {
    method: "DELETE",
  });
}

export function clearCart() {
  return apiRequest("/api/v2/cart", {
    method: "DELETE",
  });
}

export function applyCoupon(couponName) {
  return apiRequest("/api/v2/cart/applyCoupon", {
    method: "PUT",
    body: JSON.stringify({
      couponName,
    }),
  });
}