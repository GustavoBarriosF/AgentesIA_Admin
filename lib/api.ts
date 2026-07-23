import axios, { type AxiosError } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT and workspace from stores dynamically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const authRaw = localStorage.getItem("trivox-auth");
      if (authRaw) {
        const auth = JSON.parse(authRaw);
        const token = auth?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore
    }
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("trivox-auth");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
