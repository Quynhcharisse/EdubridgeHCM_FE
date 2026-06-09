export const RESERVATION_STATUS = {
    PENDING: "RESERVATION_PENDING",
    APPROVAL: "RESERVATION_APPROVAL",
    PAYMENT_PENDING: "RESERVATION_PAYMENT_PENDING",
    PAYMENT_REJECTED: "RESERVATION_PAYMENT_REJECTED",
    DEPOSITED: "RESERVATION_DEPOSITED",
    DEPOSIT_EXPIRED: "RESERVATION_DEPOSIT_EXPIRED",
    CONFIRMED: "RESERVATION_CONFIRMED",
    GHOST: "RESERVATION_GHOST",
    CANCELLED: "RESERVATION_CANCELLED",
    REJECTED: "RESERVATION_REJECTED",
};

export const ADMISSION_FORM_EXPORT_STATUSES = [
    RESERVATION_STATUS.CONFIRMED,
];

export const ACTIVE_RESERVATION_STATUSES = [
    RESERVATION_STATUS.PENDING,
    RESERVATION_STATUS.APPROVAL,
    RESERVATION_STATUS.PAYMENT_PENDING,
    RESERVATION_STATUS.DEPOSITED,
];

export const ACTIVE_OFFERING_STATUSES = [
    RESERVATION_STATUS.PAYMENT_PENDING,
    RESERVATION_STATUS.DEPOSITED,
];

export const ALL_RESERVATION_STATUSES = [
    RESERVATION_STATUS.PENDING,
    RESERVATION_STATUS.APPROVAL,
    RESERVATION_STATUS.PAYMENT_PENDING,
    RESERVATION_STATUS.PAYMENT_REJECTED,
    RESERVATION_STATUS.DEPOSITED,
    RESERVATION_STATUS.DEPOSIT_EXPIRED,
    RESERVATION_STATUS.CONFIRMED,
    RESERVATION_STATUS.GHOST,
    RESERVATION_STATUS.CANCELLED,
    RESERVATION_STATUS.REJECTED,
];

const LEGACY_STATUS_ALIASES = {
    DEPOSIT: RESERVATION_STATUS.DEPOSITED,
    CONFIRMED: RESERVATION_STATUS.CONFIRMED,
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
        color: "#0f766e",
        bg: "#ccfbf1",
        border: "#5eead4",
    },
    [RESERVATION_STATUS.PAYMENT_PENDING]: {
        label: "Chờ xác nhận thanh toán",
        color: "#6d28d9",
        bg: "#f5f3ff",
        border: "#c4b5fd",
    },
    [RESERVATION_STATUS.PAYMENT_REJECTED]: {
        label: "Từ chối thanh toán",
        color: "#9f1239",
        bg: "#fff1f2",
        border: "#fda4af",
    },
    [RESERVATION_STATUS.DEPOSITED]: {
        label: "Đã đặt cọc",
        color: "#047857",
        bg: "#ecfdf5",
        border: "#6ee7b7",
    },
    [RESERVATION_STATUS.DEPOSIT_EXPIRED]: {
        label: "Hết hạn đặt cọc",
        color: "#a16207",
        bg: "#fefce8",
        border: "#fde047",
    },
    [RESERVATION_STATUS.CONFIRMED]: {
        label: "Đã xác nhận nhập học",
        color: "#0369a1",
        bg: "#e0f2fe",
        border: "#7dd3fc",
    },
    [RESERVATION_STATUS.GHOST]: {
        label: "Hồ sơ vô hiệu",
        color: "#57534e",
        bg: "#f5f5f4",
        border: "#d6d3d1",
    },
    [RESERVATION_STATUS.CANCELLED]: {
        label: "Đã hủy",
        color: "#475569",
        bg: "#f1f5f9",
        border: "#94a3b8",
    },
    [RESERVATION_STATUS.REJECTED]: {
        label: "Từ chối hồ sơ",
        color: "#b91c1c",
        bg: "#fef2f2",
        border: "#fca5a5",
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

export const PARENT_RESERVATION_FILTERS = [
    {value: "ALL", label: "Tất cả", statuses: null},
    ...ALL_RESERVATION_STATUSES.map((status) => ({
        value: status.replace(/^RESERVATION_/, ""),
        label: RESERVATION_STATUS_STYLE[status].label,
        statuses: [status],
    })),
];

export function reservationStatusMatchesFilter(rowStatus, filterDef) {
    if (!filterDef || filterDef.value === "ALL") return true;
    const normalized = normalizeReservationStatus(rowStatus);
    const allowed = new Set((filterDef.statuses || []).map((s) => normalizeReservationStatus(s)));
    if (allowed.size > 0) return allowed.has(normalized);
    const filterKey = String(filterDef.value ?? "").trim().toUpperCase();
    const asStatus = filterKey.startsWith("RESERVATION_") ? filterKey : `RESERVATION_${filterKey}`;
    return normalized === normalizeReservationStatus(asStatus);
}

export function getParentReservationFilterValueForStatus(status) {
    const normalized = normalizeReservationStatus(status);
    if (!normalized) return "ALL";
    const match = PARENT_RESERVATION_FILTERS.find((f) =>
        f.statuses?.some((s) => normalizeReservationStatus(s) === normalized),
    );
    return match?.value ?? "ALL";
}

export const MAX_PARENT_PAYMENT_AGAIN_ATTEMPTS = 3;

export function pickReservationPaymentAgainCount(item) {
    if (!item || typeof item !== "object") return 0;
    const raw =
        item.paymentAgainCount ??
        item.paymentRejectCount ??
        item.paymentRetryCount ??
        item.paymentRetryTimes;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
}

export function isParentReservationPaymentAgain(reservation) {
    return normalizeReservationStatus(reservation?.status) === RESERVATION_STATUS.PAYMENT_REJECTED;
}

export function canParentOpenReservationPayment(reservation) {
    const status = normalizeReservationStatus(reservation?.status);
    return status === RESERVATION_STATUS.APPROVAL || status === RESERVATION_STATUS.PAYMENT_REJECTED;
}

export function canParentConfirmEnrollment(reservation) {
    return normalizeReservationStatus(reservation?.status) === RESERVATION_STATUS.DEPOSITED;
}

export function canParentCancelReservation(reservation) {
    return normalizeReservationStatus(reservation?.status) === RESERVATION_STATUS.CONFIRMED;
}

export function canParentRetryReservationPayment(reservation) {
    if (!isParentReservationPaymentAgain(reservation)) return true;
    return pickReservationPaymentAgainCount(reservation) < MAX_PARENT_PAYMENT_AGAIN_ATTEMPTS;
}

export function shouldShowReservationPaymentRejectReason(reservation) {
    const reason = String(reservation?.rejectReason ?? "").trim();
    if (!reason) return false;
    const status = normalizeReservationStatus(reservation?.status);
    if (status === RESERVATION_STATUS.REJECTED) return false;
    return (
        status === RESERVATION_STATUS.PAYMENT_REJECTED ||
        status === RESERVATION_STATUS.PAYMENT_PENDING ||
        status === RESERVATION_STATUS.APPROVAL
    );
}
