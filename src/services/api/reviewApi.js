import { apiRequest } from "./api";

export function getProductReviews(productId) {
  return apiRequest(`/api/v1/products/${productId}/reviews`);
}

export function addReview(productId, reviewData) {
  return apiRequest(`/api/v1/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
}

export function updateReview(reviewId, reviewData) {
  return apiRequest(`/api/v1/reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(reviewData),
  });
}

export function deleteReview(reviewId) {
  return apiRequest(`/api/v1/reviews/${reviewId}`, {
    method: "DELETE",
  });
}