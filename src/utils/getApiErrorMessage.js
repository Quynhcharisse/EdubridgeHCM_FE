import {normalizeUiMessage} from "./normalizeUiMessage.js";




export function getApiErrorMessage(error, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
    const data = error?.response?.data;

    if (data != null && typeof data === 'object') {
        const raw = data.message ?? data.error ?? data.detail;
        if (Array.isArray(raw)) {
            const joined = raw.map((x) => (typeof x === 'string' ? x.trim() : String(x))).filter(Boolean).join(', ');
            if (joined) {
                return normalizeUiMessage(joined, fallback);
            }
        } else if (typeof raw === 'string' && raw.trim()) {
            return normalizeUiMessage(raw.trim(), fallback);
        }
        if (typeof data.body === 'string' && data.body.trim()) {
            return normalizeUiMessage(data.body.trim(), fallback);
        }
        if (data.body && typeof data.body.message === 'string' && data.body.message.trim()) {
            return normalizeUiMessage(data.body.message.trim(), fallback);
        }
    }

    const msg = error?.message;
    if (typeof msg === 'string' && msg.trim()) {
        return normalizeUiMessage(msg.trim(), fallback);
    }

    return fallback;
}
