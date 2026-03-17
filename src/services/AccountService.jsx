import axiosClient from "../configs/APIConfig.jsx";

export const signout = async () => {
    const response = await axiosClient.post("/account/logout", {}, {
        headers: {
            "X-Device-Type": "web"
        }
    });
    return response || null
}

export const getAccess = async () => {
    const response = await axiosClient.post("/account/access")
    return response || null;
}

export const getProfile = async () => {
    const response = await axiosClient.get("/account/profile");
    return response || null;
}

export const updateProfile = async (profileData) => {
    const response = await axiosClient.put("/account/profile", profileData, {
        headers: {
            "X-Device-Type": "web"
        }
    });
    return response || null;
};