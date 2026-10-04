import { apiRequest } from "./api";

export function createCashOrder(cartId, shippingAddress) {
  return apiRequest(`/api/v2/orders/${cartId}`, {
    method: "POST",
    body: JSON.stringify({ shippingAddress }),
  });
}

export function createCashOrderV1(cartId, shippingAddress) {
  return apiRequest(`/api/v1/orders/${cartId}`, {
    method: "POST",
    body: JSON.stringify({ shippingAddress }),
  });
}

export function getUserOrders(userId) {
  return apiRequest(`/api/v1/orders/user/${userId}`);
}

export function getAllOrders() {
  return apiRequest("/api/v1/orders/");
}

export function createCheckoutSession(cartId, shippingAddress, frontendUrl) {
  return apiRequest(
    `/api/v1/orders/checkout-session/${cartId}?url=${encodeURIComponent(frontendUrl)}`,
    {
      method: "POST",
      body: JSON.stringify({ shippingAddress }),
    },
  );
}