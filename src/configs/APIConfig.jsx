import axios from "axios";
import {refreshToken} from "../services/AuthService.jsx";

const url = import.meta.env.VITE_SERVER_BE || "http://localhost:8080"

axios.defaults.baseURL = `${url}/api/v1`

const axiosClient = axios.create({
    baseURL: axios.defaults.baseURL,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
})

axiosClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            if (originalRequest.url === "/auth/refresh") {
                console.error("Refresh token request failed, redirecting to login.");
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const refreshRes = await refreshToken();
                if (refreshRes.status === 200) {
                    return axiosClient(originalRequest);
                } else {
                    window.location.href = "/login";
                }
            } catch (refreshError) {
                console.log("Token refresh failed:", refreshError);
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
)

export default axiosClient;