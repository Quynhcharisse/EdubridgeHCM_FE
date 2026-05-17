/**
 * Trạng thái hồ sơ giữ chỗ / đơn nhập học (khớp BE).
 * activeReservationStatuses: PENDING, APPROVAL, PAYMENT_PENDING, DEPOSITED
 */

export const RESERVATION_STATUS = {
    PENDING: "RESERVATION_PENDING",
    APPROVAL: "RESERVATION_APPROVAL",
    PAYMENT_PENDING: "RESERVATION_PAYMENT_PENDING",
    DEPOSITED: "RESERVATION_DEPOSITED",
    REJECTED: "RESERVATION_REJECTED",
    PAYMENT_REJECTED: "RESERVATION_PAYMENT_REJECTED",
    CANCELLED: "RESERVATION_CANCELLED",
};

/** Đang xử lý (theo activeReservationStatuses BE). */
export const ACTIVE_RESERVATION_STATUSES = [
    RESERVATION_STATUS.PENDING,
    RESERVATION_STATUS.APPROVAL,
    RESERVATION_STATUS.PAYMENT_PENDING,
    RESERVATION_STATUS.DEPOSITED,
];

/** Đã chọn gói — ảnh hưởng offering quota (theo activeOfferingStatuses BE). */
export const ACTIVE_OFFERING_STATUSES = [
    RESERVATION_STATUS.PAYMENT_PENDING,
    RESERVATION_STATUS.DEPOSITED,
];

/** Status hiển thị trên filter UI (school + parent). */
export const ALL_RESERVATION_STATUSES = [
    RESERVATION_STATUS.PENDING,
    RESERVATION_STATUS.APPROVAL,
    RESERVATION_STATUS.PAYMENT_PENDING,
    RESERVATION_STATUS.DEPOSITED,
    RESERVATION_STATUS.REJECTED,
    RESERVATION_STATUS.PAYMENT_REJECTED,
];

const LEGACY_STATUS_ALIASES = {
    DEPOSIT: RESERVATION_STATUS.DEPOSITED,
    RESERVATION_CONFIRMED: RESERVATION_STATUS.DEPOSITED,
    CONFIRMED: RESERVATION_STATUS.DEPOSITED,
    APPROVED: RESERVATION_STATUS.APPROVAL,
    ACCEPTED: RESERVATION_STATUS.APPROVAL,
    PENDING: RESERVATION_STATUS.PENDING,
    REJECTED: RESERVATION_STATUS.REJECTED,
    CANCELLED: RESERVATION_STATUS.CANCELLED,
};

export const RESERVATION_STATUS_STYLE = {
    [RESERVATION_STATUS.PENDING]: {
        label: "Chờ duyệt",
        color: "#b45309",
        bg: "#fff7ed",
        border: "#fdba74",
    },
    [RESERVATION_STATUS.APPROVAL]: {
        label: "Đã duyệt hồ sơ",
        color: "#166534",
        bg: "#ecfdf5",
        border: "#86efac",
    },
    [RESERVATION_STATUS.PAYMENT_PENDING]: {
        label: "Chờ xác nhận thanh toán",
        color: "#1d4ed8",
        bg: "#dbeafe",
        border: "#93c5fd",
    },
    [RESERVATION_STATUS.DEPOSITED]: {
        label: "Đã đặt cọc",
        color: "#047857",
        bg: "#d1fae5",
        border: "#6ee7b7",
    },
    [RESERVATION_STATUS.REJECTED]: {
        label: "Từ chối hồ sơ",
        color: "#b91c1c",
        bg: "#fee2e2",
        border: "#fca5a5",
    },
    [RESERVATION_STATUS.PAYMENT_REJECTED]: {
        label: "Từ chối thanh toán",
        color: "#9f1239",
        bg: "#ffe4e6",
        border: "#fda4af",
    },
    [RESERVATION_STATUS.CANCELLED]: {
        label: "Đã hủy",
        color: "#475569",
        bg: "#e2e8f0",
        border: "#cbd5e1",
    },
};

export const RESERVATION_STATUS_FILTER_OPTIONS = [
    {value: "ALL", label: "Tất cả"},
    ...ALL_RESERVATION_STATUSES.map((value) => ({
        value,
        label: RESERVATION_STATUS_STYLE[value].label,
    })),
];

export const RESERVATION_STATUS_FILTER_VALUES = new Set(ALL_RESERVATION_STATUSES);

export function normalizeReservationStatus(status) {
    const key = String(status ?? "").trim().toUpperCase();
    if (!key) return "";
    if (RESERVATION_STATUS_STYLE[key]) return key;
    return LEGACY_STATUS_ALIASES[key] ?? key;
}

export function getReservationStatusLabel(status) {
    const key = normalizeReservationStatus(status);
    return RESERVATION_STATUS_STYLE[key]?.label ?? (key ? key.replace(/^RESERVATION_/, "").replace(/_/g, " ") : "—");
}

export function getReservationStatusStyle(status) {
    const key = normalizeReservationStatus(status);
    return RESERVATION_STATUS_STYLE[key] ?? null;
}

/** Filter tab phụ huynh — nhóm theo từng status chuẩn. */
export const PARENT_RESERVATION_FILTERS = [
    {value: "ALL", label: "Tất cả", statuses: null},
    {value: "PENDING", label: RESERVATION_STATUS_STYLE[RESERVATION_STATUS.PENDING].label, statuses: [RESERVATION_STATUS.PENDING]},
    {value: "APPROVAL", label: RESERVATION_STATUS_STYLE[RESERVATION_STATUS.APPROVAL].label, statuses: [RESERVATION_STATUS.APPROVAL]},
    {
        value: "PAYMENT_PENDING",
        label: RESERVATION_STATUS_STYLE[RESERVATION_STATUS.PAYMENT_PENDING].label,
        statuses: [RESERVATION_STATUS.PAYMENT_PENDING],
    },
    {value: "DEPOSITED", label: RESERVATION_STATUS_STYLE[RESERVATION_STATUS.DEPOSITED].label, statuses: [RESERVATION_STATUS.DEPOSITED]},
    {value: "REJECTED", label: RESERVATION_STATUS_STYLE[RESERVATION_STATUS.REJECTED].label, statuses: [RESERVATION_STATUS.REJECTED]},
    {
        value: "PAYMENT_REJECTED",
        label: RESERVATION_STATUS_STYLE[RESERVATION_STATUS.PAYMENT_REJECTED].label,
        statuses: [RESERVATION_STATUS.PAYMENT_REJECTED],
    },
];

export function reservationStatusMatchesFilter(rowStatus, filterDef) {
    if (!filterDef || filterDef.value === "ALL") return true;
    const normalized = normalizeReservationStatus(rowStatus);
    const allowed = new Set((filterDef.statuses || []).map((s) => normalizeReservationStatus(s)));
    return allowed.has(normalized);
}
