import {getUserIdentity} from "./savedSchoolsStorage";

const NAMESPACE = "edubridge";
const STORAGE_PREFIX = "compareSchools";

export const MAX_COMPARE_SCHOOLS = 4;

function getStorageKey(userInfo) {
    const identity = getUserIdentity(userInfo);
    return `${NAMESPACE}:${STORAGE_PREFIX}:${identity || "unknown"}`;
}

export function getCompareSchools(userInfo) {
    if (typeof window === "undefined") return [];
    if (!userInfo) return [];

    const key = getStorageKey(userInfo);
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function setCompareSchools(userInfo, schools) {
    if (typeof window === "undefined") return;
    if (!userInfo) return;

    const key = getStorageKey(userInfo);
    const capped = Array.isArray(schools)
        ? schools.slice(0, MAX_COMPARE_SCHOOLS)
        : [];
    localStorage.setItem(key, JSON.stringify(capped));
}
