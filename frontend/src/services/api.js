import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("user");
};

export const persistSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user || {}));
  if (user?.username) localStorage.setItem("username", user.username);
  else localStorage.removeItem("username");
};

export const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
    }
  }

  const username = localStorage.getItem("username");
  return username ? { username } : null;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isPublicAuthRequest = /\/auth\/(login|register)(?:[?#]|$)/.test(requestUrl);

    if (error.response?.status === 401 && !isPublicAuthRequest) {
      clearSession();
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export const getCollection = (response) => {
  const data = response.data;
  if (Array.isArray(data)) return data;
  return data?.content || data?.data || data?.items || [];
};

export const getErrorMessage = (error) => {
  const responseData = error.response?.data;
  if (typeof responseData === "string") return responseData;
  return responseData?.message || responseData?.error || error.message || "Unable to complete the request.";
};

export const getAuthMe = () => api.get("/auth/me");
export const getComplaints = () => api.get("/complaints");
export const getComplaint = (id) => api.get(`/complaints/${encodeURIComponent(id)}`);
export const getComplaintHistory = (id) => api.get(`/complaints/${encodeURIComponent(id)}/history`);
export const createComplaint = (request) => api.post("/complaints", request);
export const updateComplaintStatus = (id, status, note) =>
  api.patch(`/complaints/${encodeURIComponent(id)}/status`, { status, ...(note ? { note } : {}) });
export const escalateComplaint = (id, request) => api.post(`/complaints/${encodeURIComponent(id)}/escalate`, request);
export const getComplaintStats = () => api.get("/complaints/stats");
export const getAssignments = () => api.get("/assignments");
export const updateAssignment = (id, request) => api.patch(`/assignments/${encodeURIComponent(id)}`, request);
export const getNotifications = () => api.get("/notifications");
export const getNotification = (id) => api.get(`/notifications/${encodeURIComponent(id)}`);
export const markNotificationRead = (id) => api.patch(`/notifications/${encodeURIComponent(id)}/read`);
export const markAllNotificationsRead = () => api.patch("/notifications/read-all");
export const getUnreadNotificationCount = () => api.get("/notifications/unread-count");
