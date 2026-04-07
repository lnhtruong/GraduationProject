import axios from "axios";
import { API_URL } from "@/lib/env";

export const authClient = axios.create({
  baseURL: `${API_URL}/auth`,
  timeout: 30000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});
