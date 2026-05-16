import axiosClient from "../configs/APIConfig.jsx";
import {getSchoolConfig, parseSchoolConfigResponseBody} from "./SchoolFacilityService.jsx";
import {pickBankInfoData} from "../utils/vietQr.js";

export async function getPublicSchoolList() {
    const response = await axiosClient.get("/school/public/list");
    const body = response?.data?.body;
    if (Array.isArray(body)) return body;
    return [];
}


export async function getPublicSchoolDetail(schoolId) {
    if (schoolId === undefined || schoolId === null) return null;
    const response = await axiosClient.get(`/school/${schoolId}/public/detail`);
    return response?.data?.body ?? null;
}

export async function getPublicSchoolCampaignTemplates(schoolId, year = 0) {
    if (schoolId === undefined || schoolId === null) return [];
    const response = await axiosClient.get(`/school/${schoolId}/campaign/template/public`, {
        params: {year: Number(year) || 0}
    });
    const body = response?.data?.body;
    const payload = body?.body && typeof body.body === "object" ? body.body : body;
    const normalizeAllowedMethod = (item) => {
        if (!item || typeof item !== "object") return null;
        const code = String(item?.code ?? item?.methodCode ?? "").trim();
        if (!code) return null;
        return {
            code,
            displayName: String(item?.displayName ?? item?.name ?? code).trim(),
            description: String(item?.description ?? "").trim()
        };
    };

    const normalizeMandatoryDocument = (item) => {
        if (!item || typeof item !== "object") return null;
        const code = String(item?.code ?? "").trim();
        const name = String(item?.name ?? code).trim();
        if (!code && !name) return null;
        return {
            code,
            name: name || code,
            required: Boolean(item?.required)
        };
    };

    /** BE có thể trả LocalDate dạng [year, month, day] thay vì chuỗi ISO. */
    const coalescePublicDate = (value) => {
        if (value == null || value === "") return null;
        if (typeof value === "string") {
            const t = value.trim();
            return t || null;
        }
        if (Array.isArray(value) && value.length >= 3) {
            const y = Number(value[0]);
            const m = Number(value[1]);
            const d = Number(value[2]);
            if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
                return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            }
        }
        return null;
    };

    const normalizeMethodTimeline = (item, allowedMethodMap = {}) => {
        if (!item || typeof item !== "object") return null;
        const methodCode = String(item?.methodCode ?? item?.code ?? "").trim();
        const fromAllowed = methodCode ? allowedMethodMap[methodCode] : null;
        const reservationFeeRaw = item?.reservationFee;
        const reservationFeeNum = Number(reservationFeeRaw);
        return {
            ...item,
            methodCode,
            displayName: item?.displayName ?? item?.name ?? fromAllowed?.displayName ?? methodCode,
            description: item?.description ?? fromAllowed?.description ?? "",
            startDate: coalescePublicDate(item?.startDate) ?? item?.startDate ?? null,
            endDate: coalescePublicDate(item?.endDate) ?? item?.endDate ?? null,
            depositEndDate: coalescePublicDate(item?.depositEndDate) ?? item?.depositEndDate ?? null,
            confirmationEndDate: coalescePublicDate(item?.confirmationEndDate) ?? item?.confirmationEndDate ?? null,
            reservationFee: Number.isFinite(reservationFeeNum) ? reservationFeeNum : null,
            allowReservationSubmission: Boolean(item?.allowReservationSubmission),
            admissionProcessSteps: Array.isArray(item?.admissionProcessSteps) ? item.admissionProcessSteps : [],
            methodDocumentRequirements: Array.isArray(item?.methodDocumentRequirements)
                ? item.methodDocumentRequirements.map(normalizeMandatoryDocument).filter(Boolean)
                : []
        };
    };

    const normalizeProgramOffering = (item) => {
        if (!item || typeof item !== "object") return null;
        const program = item?.program && typeof item.program === "object" ? item.program : {};
        const curriculum =
            item?.curriculum && typeof item.curriculum === "object"
                ? item.curriculum
                : program?.curriculum && typeof program.curriculum === "object"
                    ? program.curriculum
                    : {};
        const tuitionFee =
            item?.tuitionFee ??
            item?.netTuitionFee ??
            program?.tuitionFee ??
            program?.baseTuitionFee ??
            null;
        const baseTuitionFee =
            item?.baseTuitionFee ??
            program?.baseTuitionFee ??
            program?.tuitionFee ??
            tuitionFee;
        return {
            ...item,
            campusName: String(item?.campusName ?? "").trim(),
            learningMode: String(item?.learningMode ?? "").trim(),
            admissionMethod: String(item?.admissionMethod ?? "").trim(),
            applicationStatus: String(item?.applicationStatus ?? "").trim(),
            status: String(item?.status ?? "").trim(),
            openDate: coalescePublicDate(item?.openDate) ?? item?.openDate ?? null,
            closeDate: coalescePublicDate(item?.closeDate) ?? item?.closeDate ?? null,
            allowReservationSubmission: Boolean(item?.allowReservationSubmission),
            tuitionFee,
            baseTuitionFee,
            programName: String(item?.programName ?? program?.name ?? "").trim(),
            program,
            curriculum
        };
    };

    const normalizeCampaign = (campaign, mandatoryAll, allowedMethods) => {
        if (!campaign || typeof campaign !== "object") return null;
        const allowedMethodMap = Object.fromEntries(
            (Array.isArray(allowedMethods) ? allowedMethods : [])
                .map((method) => [String(method?.code || "").trim(), method])
                .filter(([code]) => Boolean(code))
        );
        const mappedTimelines = Array.isArray(campaign?.admissionMethodTimelines)
            ? campaign.admissionMethodTimelines
                .map((timeline) => normalizeMethodTimeline(timeline, allowedMethodMap))
                .filter(Boolean)
            : [];
        const campusProgramOfferings = Array.isArray(campaign?.campusProgramOfferings)
            ? campaign.campusProgramOfferings.map(normalizeProgramOffering).filter(Boolean)
            : [];
        const campaignTotalQuota = Number(campaign?.campaignTotalQuota);
        const campaignRemainingQuota = Number(campaign?.campaignRemainingQuota);
        return {
            ...campaign,
            startDate: coalescePublicDate(campaign?.startDate) ?? campaign?.startDate ?? null,
            endDate: coalescePublicDate(campaign?.endDate) ?? campaign?.endDate ?? null,
            campaignTotalQuota: Number.isFinite(campaignTotalQuota) ? campaignTotalQuota : null,
            campaignRemainingQuota: Number.isFinite(campaignRemainingQuota) ? campaignRemainingQuota : null,
            admissionMethodDetails: mappedTimelines,
            campusProgramOfferings,
            mandatoryAll: Array.isArray(campaign?.mandatoryAll)
                ? campaign.mandatoryAll.map(normalizeMandatoryDocument).filter(Boolean)
                : Array.isArray(mandatoryAll)
                    ? mandatoryAll.map(normalizeMandatoryDocument).filter(Boolean)
                    : [],
            schoolAllowedMethods: Array.isArray(allowedMethods) ? allowedMethods : []
        };
    };

    if (Array.isArray(payload)) {
        return payload.map((campaign) => normalizeCampaign(campaign, campaign?.mandatoryAll, [])).filter(Boolean);
    }
    if (payload && typeof payload === "object") {
        const campaigns = Array.isArray(payload?.campaigns) ? payload.campaigns : [];
        const mandatoryAll = Array.isArray(payload?.campaignConfig?.mandatoryAll)
            ? payload.campaignConfig.mandatoryAll
            : [];
        const allowedMethods = Array.isArray(payload?.campaignConfig?.allowedMethods)
            ? payload.campaignConfig.allowedMethods.map(normalizeAllowedMethod).filter(Boolean)
            : [];
        return campaigns
            .map((campaign) => ({
                ...normalizeCampaign(campaign, mandatoryAll, allowedMethods),
                campaignConfig: payload?.campaignConfig || null
            }))
            .filter(Boolean);
    }
    return [];
}

export async function searchNearbyCampuses({lat, lng, radius = 10}) {
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return [];
    const params = {
        lat: Number(lat),
        lng: Number(lng),
        radius: Number(radius)
    };
    const endpoints = [
        "/school/campus/search/nearby",
        "/campus/search-nearby"
    ];
    const pickBodyList = (response) => {
        const body = response?.data?.body;
        if (Array.isArray(body)) return body;
        if (Array.isArray(body?.items)) return body.items;
        if (Array.isArray(body?.content)) return body.content;
        if (Array.isArray(body?.campusList)) return body.campusList;
        return [];
    };

    let lastError = null;
    for (const endpoint of endpoints) {
        try {
            const response = await axiosClient.get(endpoint, {params});
            return pickBodyList(response);
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError ?? new Error("Không gọi được API tìm campus lân cận.");
}

export async function getLanguageOptions() {
    const response = await axiosClient.get("/school/public/language-options");
    const body = response?.data?.body;
    if (Array.isArray(body)) return body;
    return [];
}

/** Gộp các gói campusProgramOffering từ danh sách chiến dịch public (dedupe theo id). */
export function collectOfferingsFromPublicCampaigns(campaigns) {
    const map = new Map();
    for (const campaign of Array.isArray(campaigns) ? campaigns : []) {
        const campaignName = String(campaign?.name ?? "").trim();
        for (const offering of Array.isArray(campaign?.campusProgramOfferings) ? campaign.campusProgramOfferings : []) {
            const id = Number(offering?.id);
            if (!Number.isFinite(id) || id <= 0) continue;
            if (!map.has(id)) {
                map.set(id, {...offering, campaignName});
            }
        }
    }
    return [...map.values()];
}

/**
 * Lấy thông tin tài khoản ngân hàng của trường (để hiển thị VietQR cho phụ huynh).
 * Thử lần lượt các endpoint public/parent rồi fallback GET /school/config/{id}.
 */
export async function getPublicSchoolBankInfo(schoolId) {
    const sid = Number(schoolId);
    if (!Number.isFinite(sid) || sid <= 0) return null;

    const endpoints = [`/school/${sid}/public/bank`, `/parent/school/${sid}/bank`];
    for (const path of endpoints) {
        try {
            const response = await axiosClient.get(path);
            const body = response?.data?.body ?? response?.data;
            const bank = pickBankInfoData(body);
            if (bank) return bank;
        } catch {
            // thử endpoint kế tiếp
        }
    }

    try {
        const configRes = await getSchoolConfig(sid);
        const bank = pickBankInfoData(parseSchoolConfigResponseBody(configRes));
        if (bank) return bank;
    } catch {
        // fallback public detail
    }

    try {
        const detail = await getPublicSchoolDetail(sid);
        const bank = pickBankInfoData(detail);
        if (bank) return bank;
    } catch {
        // không có dữ liệu
    }

    return null;
}
