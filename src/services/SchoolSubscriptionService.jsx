import axiosClient from "../configs/APIConfig.jsx";




export const createSchoolSubscriptionPayment = async ({ packageId, description }) => {
    const response = await axiosClient.post("/school/subscription", {
        packageId: Number(packageId),
        description: description ?? "",
    });
    return response;
};




export const getCurrentSchoolSubscription = async () => {
    const response = await axiosClient.get("/school/current/subscription");
    return response;
};





export const forwardSchoolVnpayCallback = async (queryString) => {
    const raw = typeof queryString === "string" ? queryString.trim() : "";
    const qs = raw.startsWith("?") ? raw : raw ? `?${raw}` : "";
    const response = await axiosClient.get(`/school/vnpay-callback${qs}`);
    return response;
};




export const getSchoolPaymentReceipt = async (txnRef) => {
    const ref = String(txnRef ?? "").trim();
    const response = await axiosClient.get("/school/payment/receipt", {
        params: { txnRef: ref },
    });
    return response;
};




export const exportSchoolSubscriptionReceiptPdf = async (txnRef) => {
    const ref = String(txnRef ?? "").trim();
    const response = await axiosClient.get("/school/subscription/receipt/export", {
        params: { txnRef: ref },
        responseType: "blob",
    });
    return response;
};




export const previewSchoolSubscriptionChange = async ({ actionType, targetPackageId }) => {
    const response = await axiosClient.post("/school/subscription/preview", {
        actionType: String(actionType || "").toUpperCase(),
        targetPackageId: Number(targetPackageId),
    });
    return response;
};
