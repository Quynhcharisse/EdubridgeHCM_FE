import axiosClient from "../configs/APIConfig.jsx";

export const refreshToken = async () => {
    const response = await axiosClient.post("/auth/refresh");
    return response || null
}

export const signin = async (email) => {
    const response = await axiosClient.post("/auth/login", {
            email: email
        }
    );
    return response || null
}

export const signup = async (email, role) => {
    const response = await axiosClient.post("/auth/register", {
            email: email,
            role: role
        }
    );
    return response || null
}