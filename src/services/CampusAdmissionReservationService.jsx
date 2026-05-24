import axiosClient from "../configs/APIConfig.jsx";

const pickBody = (response) => response?.data?.body ?? response?.body ?? response?.data ?? null;

export const getCampusAdmissionReservationForms = async ({
    status = "ALL",
} = {}) => {
    const normalized = String(status || "").trim().toUpperCase();
    const params = {};
    if (normalized && normalized !== "ALL") {
        params.status = normalized;
    }

    const response = await axiosClient.get("/campus/admission/reservation/form", { params });
    const body = pickBody(response);
    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];

    return {
        items,
        totalItems: items.length,
        raw: body,
    };
};

export const confirmAdmissionReservationPayment = async ({formId, action, rejectReason}) => {
    const payload = {
        formId: Number(formId),
        action: String(action || "").trim().toUpperCase(),
    };
    if (payload.action === "REJECT_PAYMENT") {
        payload.rejectReason = String(rejectReason || "").trim();
    }
    return axiosClient.put("/campus/confirm/admission/reservation/payment", payload, {
        headers: {"X-Device-Type": "web"},
    });
};

export const processAdmissionReservationForm = async ({formId, action, rejectReason, checkedDocuments}) => {
    const payload = {
        formId: Number(formId),
        action: String(action || "").toUpperCase(),
        checkedDocuments: Array.isArray(checkedDocuments)
            ? checkedDocuments.map((key) => String(key || "").trim()).filter(Boolean)
            : [],
    };
    if (payload.action === "REJECT") {
        payload.rejectReason = String(rejectReason || "").trim();
    }
    return axiosClient.put("/campus/process/admission/reservation/form", payload, {
        headers: {"X-Device-Type": "web"},
    });
};

export const getAdmissionCampaigns = async () => {
    const response = await axiosClient.get("/campus/admission/campaign");
    const body = pickBody(response);
    return Array.isArray(body) ? body : [];
};

export const batchConfirmAdmissionReservationForms = async (admissionReservationFormInfos) => {
    const response = await axiosClient.put(
        "/campus/admission/reservation/forms",
        {admissionReservationFormInfos},
        {headers: {"X-Device-Type": "web"}},
    );
    return response?.data ?? response;
};

export const autoApproveAdmissionReservations = async (admissionCampaignId) => {
    const response = await axiosClient.put(
        "/campus/approve/auto/admission/reservation/form",
        null,
        {params: {admissionCampaignId}, headers: {"X-Device-Type": "web"}},
    );
    return pickBody(response);
};

export const exportAdmissionFormsByStatus = async (status) => {
    return axiosClient.get("/campus/admission/form/export", {
        params: {status: String(status || "").trim().toUpperCase()},
        responseType: "blob",
    });
};
