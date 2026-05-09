const BASE_URL = "http://localhost:8000";

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.detail ||
      (Array.isArray(data?.errors)
        ? data.errors.map((e) => e.message).join(", ")
        : "Something went wrong");
    throw new Error(message);
  }

  return data;
};