const AXIOS_STATUS_MESSAGE = /^Request failed with status code \d+$/i;

const EXACT_TRANSLATIONS = {
    "Network Error": "Lỗi kết nối mạng. Vui lòng thử lại.",
    "Forbidden": "Bạn không có quyền thực hiện thao tác này.",
    "Unauthorized": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
    "Internal Server Error": "Lỗi hệ thống. Vui lòng thử lại sau.",
    "Bad Request": "Dữ liệu gửi lên không hợp lệ.",
    "Not Found": "Không tìm thấy dữ liệu yêu cầu.",
    "Conflict": "Dữ liệu đang xung đột. Vui lòng tải lại và thử lại.",
    "Validation failed": "Dữ liệu xác thực không hợp lệ.",
    "Invalid credentials": "Email hoặc mật khẩu không đúng.",
    "Invalid token": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    "Token expired": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    "Access denied": "Bạn không có quyền truy cập.",
    "Request timeout": "Yêu cầu bị quá thời gian chờ. Vui lòng thử lại.",
    "Too many requests": "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
};

const PREFIX_TRANSLATIONS = [
    ["Invalid ", "Không hợp lệ: "],
    ["Missing ", "Thiếu dữ liệu: "],
    ["Required ", "Bắt buộc: "],
    ["Failed to ", "Không thể "],
    ["Cannot ", "Không thể "],
    ["Could not ", "Không thể "],
    ["Unable to ", "Không thể "],
];

export function normalizeUiMessage(rawMessage, fallback = "Đã xảy ra lỗi. Vui lòng thử lại.") {
    const raw = String(rawMessage ?? "").trim();
    if (!raw) return fallback;
    if (AXIOS_STATUS_MESSAGE.test(raw)) return fallback;

    if (EXACT_TRANSLATIONS[raw]) return EXACT_TRANSLATIONS[raw];

    for (const [prefix, translatedPrefix] of PREFIX_TRANSLATIONS) {
        if (raw.startsWith(prefix)) {
            return `${translatedPrefix}${raw.slice(prefix.length).trim()}`;
        }
    }

    const lowered = raw.toLowerCase();
    if (lowered.includes("not found")) return "Không tìm thấy dữ liệu yêu cầu.";
    if (lowered.includes("unauthorized")) return "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
    if (lowered.includes("forbidden")) return "Bạn không có quyền thực hiện thao tác này.";
    if (lowered.includes("internal server error")) return "Lỗi hệ thống. Vui lòng thử lại sau.";
    if (lowered.includes("network")) return "Lỗi kết nối mạng. Vui lòng thử lại.";
    if (lowered.includes("timeout")) return "Yêu cầu bị quá thời gian chờ. Vui lòng thử lại.";
    if (lowered.includes("validation")) return "Dữ liệu xác thực không hợp lệ.";
    if (lowered.includes("token")) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";

    return raw;
}

