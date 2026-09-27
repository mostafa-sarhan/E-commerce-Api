import { apiRequest } from "./api";

export function getUsers(params = "") {
  return apiRequest(`/api/v1/users${params}`);
}

export function updateMyProfile(data) {
  return apiRequest("/api/v1/users/updateMe/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function changeMyPassword(data) {
  return apiRequest("/api/v1/users/changeMyPassword", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function getMyAddresses() {
  return apiRequest("/api/v1/addresses");
}
