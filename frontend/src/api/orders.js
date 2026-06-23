// src/api/orders.js
import axios from "axios";

const OrdersAPI = axios.create({
  baseURL: "http://localhost:5000/api/orders",
  withCredentials: true,
});

OrdersAPI.placeOrder = (data) => OrdersAPI.post("/", data);
OrdersAPI.getBuyerOrders = () => OrdersAPI.get("/buyer");
OrdersAPI.getSellerOrders = () => OrdersAPI.get("/seller");
OrdersAPI.getSellerAnalytics = () => OrdersAPI.get("/seller/analytics");

OrdersAPI.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

export default OrdersAPI;
