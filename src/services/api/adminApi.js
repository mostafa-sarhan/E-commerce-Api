import { apiRequest } from "./api";

export function getAllReviews() {
  return apiRequest("/api/v1/reviews");
}

export function payOrder(orderId) {
  return apiRequest(`/api/v1/orders/${orderId}/pay`, { method: "PUT" });
}

export function deliverOrder(orderId) {
  return apiRequest(`/api/v1/orders/${orderId}/deliver`, { method: "PUT" });
}

export function getCoupons() {
  return apiRequest("/api/v1/coupons");
}
