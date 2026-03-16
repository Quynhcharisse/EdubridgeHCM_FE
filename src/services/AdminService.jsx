import axiosClient from "../configs/APIConfig.jsx";

export const getPendingSchoolRegistrations = async () => {
    const response = await axiosClient.get("/admin/school/registrations/list");
    return response || null;
};

export const verifySchoolRegistration = async (requestId) => {
    const response = await axiosClient.post(`/admin/school/registrations/verify`, null, {
        params: { requestId },
    });
    return response || null;
};

