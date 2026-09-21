import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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
