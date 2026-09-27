const BASE_URL = "https://ecommerce.routemisr.com";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) headers.token = token;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;
  const text = await response.text();

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const errors = data?.errors;
    const errorDetails =
      errors && typeof errors === "object"
        ? Object.entries(errors)
            .flatMap(([field, messages]) =>
              Array.isArray(messages) ? messages : [messages]
            )
            .filter(Boolean)
            .join(" ")
        : "";

    const message =
      errorDetails ||
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.endpoint = endpoint;
    error.response = data;
    throw error;
  }

  return data;
}
