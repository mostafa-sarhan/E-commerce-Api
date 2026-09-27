import { apiRequest } from "./api";

export function getProducts(params = "") {
  return apiRequest(`/api/v1/products${params}`);
}

export function getProductById(id) {
  return apiRequest(`/api/v1/products/${id}`);
}

export function getCategories() {
  return apiRequest("/api/v1/categories");
}

export function getSubCategories() {
  return apiRequest("/api/v1/subcategories");
}

export function getBrands() {
  return apiRequest("/api/v1/brands");
}