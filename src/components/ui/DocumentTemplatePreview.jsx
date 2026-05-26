import { useMemo, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import ImageLightboxOverlay from "./ImageLightboxOverlay.jsx";

function resolveServerOrigin() {
    const raw = (import.meta.env.VITE_SERVER_BE || "http://localhost:8080").trim().replace(/\/+$/, "");
    return raw.replace(/\/api\/v1$/i, "");
}

export function resolveAbsoluteFileUrl(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith("//")) {
        return `${typeof window !== "undefined" ? window.location.protocol : "https:"}${s}`;
    }
    if (s.startsWith("/")) {
        const origin = resolveServerOrigin().replace(/\/+$/, "");
        return `${origin}${s}`;
    }
    return s;
}

export function isImageTemplateUrl(url) {
    const u = String(url ?? "").trim();
    if (!u) return false;
    if (u.includes("/image/upload/")) return true;
    return /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(u);
}

function isPdfFileUrl(url, fileName) {
    if (/\.pdf(\?.*)?$/i.test(String(fileName || ""))) return true;
    try {
        return /\.pdf(\?.*)?$/i.test(new URL(url).pathname);
    } catch {
        return /\.pdf(\?.*)?$/i.test(String(url || ""));
    }
}

function isOfficeFileUrl(url, fileName) {
    if (/\.(docx?|docm|xlsx?|xlsm|pptx?|pptm)$/i.test(String(fileName || ""))) return true;
    try {
        return /\.(docx?|docm|xlsx?|xlsm|pptx?|pptm)$/i.test(new URL(url).pathname);
    } catch {
        return false;
    }
}

function canUseExternalFileViewer(urlString) {
    try {
        const u = new URL(urlString);
        const host = u.hostname.toLowerCase();
        if (u.protocol !== "https:") return false;
        return !(
            host === "localhost" ||
            host === "127.0.0.1" ||
            /^192\.168\.\d+\.\d+$/.test(host) ||
            /^10\.\d+\.\d+\.\d+$/.test(host)
        );
    } catch {
        return false;
    }
}

/** URL mở tab trình duyệt để xem (không ép download) khi có thể. */
export function buildTemplateFileViewTabUrl(absoluteUrl, fileName = "") {
    const url = String(absoluteUrl || "").trim();
    if (!url || isImageTemplateUrl(url)) return url;

    if (canUseExternalFileViewer(url)) {
        if (isOfficeFileUrl(url, fileName)) {
            return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
        }
        if (isPdfFileUrl(url, fileName)) {
            return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=false`;
        }
        return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=false`;
    }

    return url;
}

export function openTemplateFileInNewTab(fileUrl, fileName = "") {
    const absoluteUrl = resolveAbsoluteFileUrl(fileUrl);
    if (!absoluteUrl || isImageTemplateUrl(absoluteUrl)) return;
    const tabUrl = buildTemplateFileViewTabUrl(absoluteUrl, fileName);
    window.open(tabUrl, "_blank", "noopener,noreferrer");
}

export default function DocumentTemplatePreview({ fileUrl, fileName = "", title = "Xem mẫu" }) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const absoluteUrl = useMemo(() => resolveAbsoluteFileUrl(fileUrl), [fileUrl]);
    const isImage = isImageTemplateUrl(absoluteUrl);
    const previewTitle = String(title || fileName || "Xem mẫu").trim() || "Xem mẫu";
    const tooltipTitle = isImage ? "Xem hình mẫu" : "Mở file trong tab mới";

    if (!absoluteUrl) return null;

    const handleClick = () => {
        if (isImage) {
            setPreviewOpen(true);
            return;
        }
        openTemplateFileInNewTab(absoluteUrl, fileName);
    };

    return (
        <>
            <Tooltip title={tooltipTitle} placement="top">
                <IconButton
                    size="small"
                    onClick={handleClick}
                    aria-label={tooltipTitle}
                    sx={{
                        color: "#2563eb",
                        p: 0.25,
                        "&:hover": { bgcolor: "#eff6ff" },
                    }}
                >
                    <OpenInNewOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Tooltip>
            {isImage ? (
                <ImageLightboxOverlay
                    open={previewOpen}
                    url={absoluteUrl}
                    title={previewTitle}
                    onClose={() => setPreviewOpen(false)}
                />
            ) : null}
        </>
    );
}
