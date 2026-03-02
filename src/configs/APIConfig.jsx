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

        // Kiểm tra nếu request đã được retry rồi thì không retry nữa
        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Nếu là request refresh token thì không retry
            if (originalRequest.url === "/auth/refresh" || originalRequest.url === "/account/access") {
                console.error("Auth request failed, redirecting to login.");
                // Không redirect ngay, để component tự xử lý
                return Promise.reject(error);
            }

            // Đánh dấu request đã được retry
            originalRequest._retry = true;

            try {
                const refreshRes = await refreshToken();
                if (refreshRes && refreshRes.status === 200) {
                    // Retry original request sau khi refresh thành công
                    return axiosClient(originalRequest);
                } else {
                    // Refresh failed, redirect to login
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = "/login";
                    }
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
                // Refresh failed, redirect to login
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
)

export default axiosClient;