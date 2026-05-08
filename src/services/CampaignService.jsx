import axiosClient from "../configs/APIConfig.jsx";






export const getCampaignTemplatesByYear = async (year) => {
    try {
        const response = await axiosClient.get(`/school/${year}/campaign/template`);
        return response || null;
    } catch (error) {
        
        
        if (error?.response?.status === 404) {
            return { status: 404, data: { body: [] } };
        }
        throw error;
    }
};



















export const createCampaignTemplate = async (body) => {
    const timelines = Array.isArray(body.admissionMethodTimelines)
        ? body.admissionMethodTimelines.map((t) => ({
              methodCode: String(t?.methodCode ?? "").trim(),
              startDate: String(t?.startDate ?? "").trim(),
              endDate: String(t?.endDate ?? "").trim(),
              allowReservationSubmission: Boolean(t?.allowReservationSubmission),
              quota: Number(t?.quota ?? 0),
          }))
        : [];
    const response = await axiosClient.post("/school/campaign/template", {
        ...(body.admissionCampaignTemplateId != null
            ? { admissionCampaignTemplateId: Number(body.admissionCampaignTemplateId) }
            : {}),
        name: body.name?.trim() ?? "",
        description: body.description?.trim() ?? "",
        year: Number(body.year),
        startDate: body.startDate ?? "",
        endDate: body.endDate ?? "",
        admissionMethodTimelines: timelines,
    });
    return response || null;
};





export const updateCampaignTemplate = async (body) => {
    const timelines = Array.isArray(body.admissionMethodTimelines)
        ? body.admissionMethodTimelines.map((t) => ({
              methodCode: String(t?.methodCode ?? "").trim(),
              startDate: String(t?.startDate ?? "").trim(),
              endDate: String(t?.endDate ?? "").trim(),
              allowReservationSubmission: Boolean(t?.allowReservationSubmission),
              quota: Number(t?.quota ?? 0),
          }))
        : [];
    const response = await axiosClient.put("/school/campaign/template", {
        admissionCampaignTemplateId: Number(body.admissionCampaignTemplateId),
        name: body.name?.trim() ?? "",
        description: body.description?.trim() ?? "",
        year: Number(body.year),
        startDate: body.startDate ?? "",
        endDate: body.endDate ?? "",
        admissionMethodTimelines: timelines,
    });
    return response || null;
};





export const updateCampaignTemplateStatus = async (id) => {
    const response = await axiosClient.put(`/school/${id}/campaign/template/status`, null);
    return response || null;
};







export const cancelCampaignTemplate = async (id, reason, options = {}) => {
    const { resolveAllStatuses = false } = options;
    const config = {
        params: { reason: reason?.trim() ?? "" },
    };
    if (resolveAllStatuses) {
        
        config.validateStatus = () => true;
    }
    const response = await axiosClient.put(`/school/${id}/campaign/template/cancel`, null, config);
    return response || null;
};






export const cloneCampaignTemplate = async (id, targetYear) => {
    const response = await axiosClient.post(`/school/${id}/campaign/template/clone`, null, {
        params: { targetYear: Number(targetYear) },
    });
    return response || null;
};






export const getCampaignOfferingsByCampus = async (campusId, { page = 0, pageSize = 10 } = {}) => {
    const cid = Number(campusId);
    const response = await axiosClient.get(`/campus/${cid}/offering/list`, {
        params: {
            campusId: cid,
            page,
            pageSize,
        },
    });
    return response || null;
};













export const createCampaignOffering = async (body) => {
    const payload = {
        admissionCampaignId: Number(body.admissionCampaignId),
        methodCode: String(body.methodCode ?? "").trim(),
        programId: Number(body.programId),
        quota: Number(body.quota),
        learningMode: body.learningMode ?? "DAY_SCHOOL",
        priceAdjustmentPercentage: Number(body.priceAdjustmentPercentage) || 0,
    };
    if (body.openDate != null && String(body.openDate).trim() !== "") {
        payload.openDate = String(body.openDate).trim();
    }
    if (body.closeDate != null && String(body.closeDate).trim() !== "") {
        payload.closeDate = String(body.closeDate).trim();
    }
    if (body.campusId != null && Number.isFinite(Number(body.campusId))) {
        payload.campusId = Number(body.campusId);
    }
    const response = await axiosClient.post("/campus/offering", payload);
    return response || null;
};


export const updateCampaignOffering = async (body) => {
    const response = await axiosClient.put("/campus/offering", {
        id: Number(body.id),
        quota: Number(body.quota),
        learningMode: body.learningMode ?? "DAY_SCHOOL",
        priceAdjustmentPercentage: Number(body.priceAdjustmentPercentage) || 0,
    });
    return response || null;
};


export const getCampusOfferingQuotaSummary = async (campaignId) => {
    const response = await axiosClient.get("/campus/offering/quota-summary", {
        params: { campaignId: Number(campaignId) },
    });
    return response || null;
};






export const updateCampusOfferingStatus = async (offeringId, action) => {
    const response = await axiosClient.put(`/campus/${Number(offeringId)}/offering/status`, null, {
        params: { action },
    });
    return response || null;
};


export const closeCampusOffering = async (offeringId) => {
    const response = await axiosClient.put(`/campus/${Number(offeringId)}/offering/close`, null);
    return response || null;
};





export const exportAdmissionCampaignList = async (year) => {
    const response = await axiosClient.get("/school/admission/campaign/list/export", {
        params: { year: Number(year) },
        responseType: "blob",
    });
    return response || null;
};
