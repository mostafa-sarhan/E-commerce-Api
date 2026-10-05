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

/**
 * This deployment answers GET /api/v1/orders/user/:id with a bare
 * JSON array, while other Route API builds wrap the same list in
 * { data } or { results }. Reading a fixed property off the payload
 * is what made real orders render as "no orders", so every order
 * list goes through this instead.
 */
export function toOrderArray(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  return [];
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