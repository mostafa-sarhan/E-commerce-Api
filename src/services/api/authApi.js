import { apiRequest } from "./api";

export function registerUser(userData) {
  return apiRequest("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export function loginUser(userData) {
  return apiRequest("/api/v1/auth/signin", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export function forgotPassword(email) {
  return apiRequest("/api/v1/auth/forgotPasswords", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyResetCode(resetCode) {
  return apiRequest("/api/v1/auth/verifyResetCode", {
    method: "POST",
    body: JSON.stringify({ resetCode }),
  });
}

export function resetPassword(data) {
  return apiRequest("/api/v1/auth/resetPassword", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function verifyToken() {
  return apiRequest("/api/v1/auth/verifyToken");
}

export function updateProfile(data) {
  return apiRequest("/api/v1/users/updateMe/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function changePassword(data) {
  return apiRequest("/api/v1/users/changeMyPassword", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}