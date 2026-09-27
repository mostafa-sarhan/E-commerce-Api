import { apiRequest } from "./api";

export function getWishlist() {
  return apiRequest("/api/v1/wishlist");
}

export function addToWishlist(productId) {
  return apiRequest("/api/v1/wishlist", {
    method: "POST",
    body: JSON.stringify({
      productId,
    }),
  });
}

export function removeFromWishlist(productId) {
  return apiRequest(`/api/v1/wishlist/${productId}`, {
    method: "DELETE",
  });
}