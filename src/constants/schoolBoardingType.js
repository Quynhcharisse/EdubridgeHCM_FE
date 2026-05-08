



export const BOARDING_TYPE_DEFAULT_VI = "Nội trú";

export const BOARDING_TYPE_OPTIONS = [
    { value: "Nội trú", label: "Nội trú" },
    { value: "Bán trú", label: "Bán trú" },
    { value: "Cả hai (Nội trú & Bán trú)", label: "Cả hai (Nội trú & Bán trú)" },
];

const ENUM_TO_VI = {
    FULL_BOARDING: "Nội trú",
    SEMI_BOARDING: "Bán trú",
    BOTH: "Cả hai (Nội trú & Bán trú)",
};

const BOARDING_ENUM_NAMES = ["FULL_BOARDING", "SEMI_BOARDING", "BOTH"];

const VI_SET = new Set(BOARDING_TYPE_OPTIONS.map((o) => o.value));

function normalizeTrimmedNull(value) {
    if (value == null) return null;
    const trimmed = String(value).trim();
    return trimmed === "" ? null : trimmed;
}





export function parseBoardingType(value) {
    const normalized = normalizeTrimmedNull(value);
    if (normalized == null) return null;
    const enumKey = normalized.toUpperCase().replace(/-/g, "_").replace(/\s+/g, "_");
    if (BOARDING_ENUM_NAMES.includes(enumKey)) return enumKey;
    for (const name of BOARDING_ENUM_NAMES) {
        const vi = ENUM_TO_VI[name];
        if (vi && vi.toLowerCase() === normalized.toLowerCase()) return name;
    }
    return null;
}


export function normalizeBoardingTypeForApi(raw) {
    if (raw == null || String(raw).trim() === "") return BOARDING_TYPE_DEFAULT_VI;
    const parsed = parseBoardingType(raw);
    if (parsed && ENUM_TO_VI[parsed]) return ENUM_TO_VI[parsed];
    const s = String(raw).trim();
    if (VI_SET.has(s)) return s;
    const key = s.toUpperCase();
    if (ENUM_TO_VI[key]) return ENUM_TO_VI[key];
    return BOARDING_TYPE_DEFAULT_VI;
}
