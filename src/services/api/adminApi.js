import { apiRequest } from "./api";

/* Signs in to the local admin test account.
 *
 * The Route API cannot authenticate an admin, so this posts to our own
 * /api/admin-login instead. It deliberately does not go through
 * apiRequest: that helper attaches the stored Route API token and
 * expects the Route API's response shape, neither of which applies
 * here. */
export async function adminTestLogin(credentials) {
  const response = await fetch("/api/admin-login", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  let data;
  const text = await response.text();

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Admin test login failed with status ${response.status}`
    );
  }

  return data;
}

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
