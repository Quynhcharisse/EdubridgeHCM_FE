const LOCATION_FALLBACK_PROVINCE = "Tất cả";
const LOCATION_FALLBACK_WARD = "Tất cả";
const HO_CHI_MINH_CANONICAL = "Hồ Chí Minh";

const normalizeLocationToken = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[ơớờởỡợ]/g, "o")
        .replace(/[ưứừửữự]/g, "u")
        .replace(/đ/g, "d")
        .replace(/[\s._-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const HO_CHI_MINH_ALIASES = new Set([
    "ho chi minh",
    "ho chi minh city",
    "hcm",
    "hcm city",
    "tp hcm",
    "tphcm",
    "thanh pho ho chi minh",
    "thanh pho hcm"
]);

export function normalizeProvinceName(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    const normalizedToken = normalizeLocationToken(trimmed);
    if (HO_CHI_MINH_ALIASES.has(normalizedToken)) {
        return HO_CHI_MINH_CANONICAL;
    }
    return trimmed;
}

export const DEFAULT_SCHOOL_IMAGE =
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80";

const PRIMARY_CAMPUS_KEYWORDS = ["co so chinh", "chinh", "main", "headquarter", "head quarter", "tru so chinh"];
const WARD_PREFIXES = ["phuong", "phường", "ward", "p."];
const WARD_STOP_TOKENS = new Set([
    "quan",
    "q",
    "huyen",
    "h",
    "thanh pho",
    "tp",
    "tinh",
    "duong",
    "street"
]);

function isPrimaryCampusName(value) {
    const token = normalizeLocationToken(value);
    if (!token) return false;
    return PRIMARY_CAMPUS_KEYWORDS.some((keyword) => token.includes(keyword));
}

function toAddressSegments(value) {
    return String(value || "")
        .split(",")
        .map((segment) => segment.trim())
        .filter(Boolean);
}

function stripWardPrefix(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    return trimmed
        .replace(/^(phường|phuong|ward)\s+/i, "")
        .replace(/^p\.?\s+/i, "")
        .trim();
}

function looksLikeWardSegment(value) {
    const normalized = normalizeLocationToken(value);
    if (!normalized) return false;
    return (
        WARD_PREFIXES.some((prefix) => normalized.startsWith(`${prefix} `) || normalized === prefix) ||
        /^\s*p\.?\s+/i.test(String(value || ""))
    );
}

function sanitizeWardName(value) {
    const cleaned = stripWardPrefix(value).replace(/[.;]+$/g, "").trim();
    if (!cleaned) return "";
    const normalized = normalizeLocationToken(cleaned);
    if (!normalized || WARD_STOP_TOKENS.has(normalized)) return "";
    return cleaned;
}

export function extractWardFromAddress(address) {
    const segments = toAddressSegments(address);
    for (const segment of segments) {
        if (!looksLikeWardSegment(segment)) continue;
        const wardName = sanitizeWardName(segment);
        if (wardName) return wardName;
    }
    const normalizedAddress = normalizeLocationToken(address);
    if (!normalizedAddress) return "";
    const match = normalizedAddress.match(/\b(?:phuong|ward)\s+([a-z0-9]+)/i);
    if (!match) return "";
    return sanitizeWardName(match[0]);
}

function resolveWardFromCampusList(campusList) {
    if (!Array.isArray(campusList)) return "";
    for (const campus of campusList) {
        const wardFromAddress = extractWardFromAddress(campus?.address);
        if (wardFromAddress) return wardFromAddress;
    }
    return "";
}

export function sortCampusListPrimaryFirst(campusList) {
    if (!Array.isArray(campusList)) return [];
    return [...campusList]
        .map((campus, originalIndex) => ({campus, originalIndex}))
        .sort((a, b) => {
            const aPrimary = isPrimaryCampusName(a.campus?.name);
            const bPrimary = isPrimaryCampusName(b.campus?.name);
            if (aPrimary !== bPrimary) return aPrimary ? -1 : 1;
            const aId = Number(a.campus?.id);
            const bId = Number(b.campus?.id);
            const aValid = Number.isFinite(aId);
            const bValid = Number.isFinite(bId);
            if (aValid && bValid && aId !== bId) return aId - bId;
            if (aValid !== bValid) return aValid ? -1 : 1;
            return a.originalIndex - b.originalIndex;
        })
        .map(({campus}) => campus);
}

export function mapPublicSchoolDetailToRow(api) {
    if (!api || typeof api !== "object") return null;
    const rawCampusList = Array.isArray(api.campusList) ? api.campusList : [];
    const campusList = sortCampusListPrimaryFirst(rawCampusList);
    const firstCampus = campusList[0] ?? null;
    const consultantEmails = campusList
        .flatMap((campus) => (Array.isArray(campus?.consultantEmails) ? campus.consultantEmails : []))
        .map((email) => String(email || "").trim())
        .filter(Boolean);
    const primaryConsultantEmail = consultantEmails[0] || "";
    const normalizedProvince = normalizeProvinceName(firstCampus?.city || "");
    const province = normalizedProvince || LOCATION_FALLBACK_PROVINCE;
    const ward = resolveWardFromCampusList(campusList) || LOCATION_FALLBACK_WARD;
    return {
        id: api.id,
        school: api.name ?? "",
        province,
        ward,
        website: api.websiteUrl || "",
        phone: firstCampus?.phoneNumber || api.hotline || "",
        emailSupport: String(api.emailSupport || "").trim(),
        email: primaryConsultantEmail || firstCampus?.email || api.email || api.schoolEmail || api.accountEmail || "",
        counsellorEmail:
            primaryConsultantEmail ||
            firstCampus?.counsellorEmail ||
            api.counsellorEmail ||
            "",
        consultantEmails,
        address: firstCampus?.address || (api.description ? String(api.description) : "Đang cập nhật"),
        locationLabel: province,
        description: api.description,
        averageRating: typeof api.averageRating === "number" ? api.averageRating : 0,
        totalCampus: api.totalCampus ?? campusList.length,
        logoUrl: api.logoUrl || null,
        isFavourite: Boolean(api.isFavourite),
        foundingDate: api.foundingDate,
        representativeName: api.representativeName,
        campusList,
        curriculumList: Array.isArray(api.curriculumList) ? api.curriculumList : [],
        boardingType: firstCampus?.boardingType || "",
        primaryCampusId: firstCampus?.id != null ? Number(firstCampus.id) : null,
        hasDetailLoaded: true
    };
}
