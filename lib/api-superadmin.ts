import axios, { type AxiosError } from "axios";

const apiSuperAdmin = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

apiSuperAdmin.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("sa_token");
      if (raw) {
        config.headers.Authorization = `Bearer ${raw}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

apiSuperAdmin.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("sa_token");
        localStorage.removeItem("sa_admin");
        window.location.href = "/superadmin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiSuperAdmin;
