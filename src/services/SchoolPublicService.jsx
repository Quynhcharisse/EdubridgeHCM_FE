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
        const curriculumRaw =
            item?.curriculum && typeof item.curriculum === "object" ? item.curriculum : {};
        const programFromItem = item?.program && typeof item.program === "object" ? item.program : {};
        const programFromCurriculum =
            curriculumRaw?.program && typeof curriculumRaw.program === "object" ? curriculumRaw.program : {};
        const program =
            Object.keys(programFromItem).length > 0 ? programFromItem : programFromCurriculum;
        let curriculum = curriculumRaw;
        if (curriculumRaw?.program) {
            const {program: _nestedProgram, ...curriculumWithoutProgram} = curriculumRaw;
            curriculum =
                Object.keys(curriculumWithoutProgram).length > 0 ? curriculumWithoutProgram : curriculumRaw;
        }
        if ((!curriculum || !Object.keys(curriculum).length) && program?.curriculum) {
            curriculum = program.curriculum;
        }
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

/** Khoảng cách Haversine (km) giữa hai tọa độ WGS84. */
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const aLat = Number(lat1);
    const aLng = Number(lng1);
    const bLat = Number(lat2);
    const bLng = Number(lng2);
    if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) return null;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const rLat1 = toRad(aLat);
    const rLat2 = toRad(bLat);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Chuẩn hoá danh sách campus từ JSON (BE EduBridge, API thứ 3, hoặc mảng thuần). */
function pickNearbyCampusList(payload) {
    if (Array.isArray(payload)) return payload;
    const body = payload?.body ?? payload?.data?.body ?? payload?.data;
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.items)) return body.items;
    if (Array.isArray(body?.content)) return body.content;
    if (Array.isArray(body?.campusList)) return body.campusList;
    return [];
}

/**
 * Tính campus trong bán kính từ campusList đã có (public detail) — không cần API ngoài.
 */
export function searchNearbyCampusesFromCampusList(campusList, {lat, lng, radius = 10, schoolId = null} = {}) {
    const originLat = Number(lat);
    const originLng = Number(lng);
    const radiusKm = Number(radius);
    if (!Number.isFinite(originLat) || !Number.isFinite(originLng) || !Number.isFinite(radiusKm) || radiusKm <= 0) {
        return [];
    }
    const sid = schoolId != null && Number.isFinite(Number(schoolId)) ? Number(schoolId) : null;
    return (Array.isArray(campusList) ? campusList : [])
        .map((campus, idx) => {
            const cLat = Number(campus?.latitude);
            const cLng = Number(campus?.longitude);
            const distance = haversineDistanceKm(originLat, originLng, cLat, cLng);
            if (distance == null || distance > radiusKm) return null;
            const campusSchoolId = campus?.schoolId ?? campus?.school?.id ?? sid;
            return {
                ...campus,
                id: campus?.id ?? campus?.campusId ?? idx,
                schoolId: campusSchoolId,
                name: campus?.name ?? campus?.campusName ?? `Campus ${idx + 1}`,
                address: campus?.address ?? "",
                latitude: cLat,
                longitude: cLng,
                distance
            };
        })
        .filter(Boolean)
        .sort((a, b) => Number(a.distance) - Number(b.distance));
}

/**
 * Tìm campus lân cận:
 * 1) (Tuỳ chọn) GET trực tiếp API bên thứ 3 — `VITE_CAMPUS_NEARBY_SEARCH_URL` (không qua BE EduBridge).
 * 2) Tính cục bộ từ `fallbackCampuses` (tọa độ trong chi tiết trường public).
 */
export async function searchNearbyCampuses({lat, lng, radius = 10, fallbackCampuses = null, schoolId = null} = {}) {
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return [];

    const originLat = Number(lat);
    const originLng = Number(lng);
    const radiusKm = Number(radius);

    const externalBase = String(import.meta.env.VITE_CAMPUS_NEARBY_SEARCH_URL || "").trim();
    let lastError = null;

    if (externalBase) {
        try {
            const url = new URL(externalBase);
            url.searchParams.set("lat", String(originLat));
            url.searchParams.set("lng", String(originLng));
            url.searchParams.set("radius", String(radiusKm));
            const headers = {};
            const apiKey = String(import.meta.env.VITE_CAMPUS_NEARBY_SEARCH_API_KEY || "").trim();
            if (apiKey) {
                headers.Authorization = `Bearer ${apiKey}`;
                headers["X-Api-Key"] = apiKey;
            }
            const response = await fetch(url.toString(), {method: "GET", headers});
            if (!response.ok) {
                throw new Error(`Nearby API ${response.status}`);
            }
            const payload = await response.json();
            const list = pickNearbyCampusList(payload);
            if (list.length > 0) return list;
        } catch (error) {
            lastError = error;
        }
    }

    const localList = searchNearbyCampusesFromCampusList(fallbackCampuses, {
        lat: originLat,
        lng: originLng,
        radius: radiusKm,
        schoolId
    });
    if (localList.length > 0) return localList;

    if (externalBase) {
        throw lastError ?? new Error("Không gọi được API tìm campus lân cận (bên thứ 3).");
    }
    return [];
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
