import { useMemo, useState } from "react";
import { Box, Fade, IconButton, Modal, Tooltip, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import ImageLightboxOverlay from "./ImageLightboxOverlay.jsx";

function resolveServerOrigin() {
    const raw = (import.meta.env.VITE_SERVER_BE || "http://localhost:8080").trim().replace(/\/+$/, "");
    return raw.replace(/\/api\/v1$/i, "");
}

function resolveAbsoluteFileUrl(raw) {
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

function isPdfTemplateUrl(url, fileName) {
    if (/\.pdf(\?.*)?$/i.test(String(fileName || ""))) return true;
    try {
        return /\.pdf(\?.*)?$/i.test(new URL(url).pathname);
    } catch {
        return /\.pdf(\?.*)?$/i.test(String(url || ""));
    }
}

function isOfficeEmbedFile(fileName, urlString) {
    if (/\.(docx?|docm|xlsx?|xlsm)$/i.test(String(fileName || ""))) return true;
    try {
        return /\.(docx?|docm|xlsx?|xlsm)$/i.test(new URL(urlString).pathname);
    } catch {
        return false;
    }
}

function isLocalOrNonHttpsHost(urlString) {
    try {
        const u = new URL(urlString);
        const host = u.hostname.toLowerCase();
        if (u.protocol !== "https:") return true;
        return (
            host === "localhost" ||
            host === "127.0.0.1" ||
            /^192\.168\.\d+\.\d+$/.test(host) ||
            /^10\.\d+\.\d+\.\d+$/.test(host)
        );
    } catch {
        return true;
    }
}

function buildInlineEmbedSrc(absoluteUrl, fileName) {
    if (!absoluteUrl) return "";
    if (isImageTemplateUrl(absoluteUrl)) return absoluteUrl;
    if (isPdfTemplateUrl(absoluteUrl, fileName)) return absoluteUrl;
    if (!isOfficeEmbedFile(fileName, absoluteUrl)) return absoluteUrl;
    if (isLocalOrNonHttpsHost(absoluteUrl)) return absoluteUrl;
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`;
}

function FileEmbedLightboxOverlay({ open, embedSrc, title, onClose }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            slotProps={{
                backdrop: {
                    sx: {
                        bgcolor: "rgba(15, 23, 42, 0.72)",
                        backdropFilter: "blur(4px)",
                    },
                },
            }}
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                zIndex: 1500,
            }}
        >
            <Fade in={open}>
                <Box sx={{ position: "relative", outline: "none", width: "min(92vw, 960px)" }}>
                    <IconButton
                        onClick={onClose}
                        aria-label="Đóng xem mẫu"
                        sx={{
                            position: "fixed",
                            top: 16,
                            right: 16,
                            color: "#fff",
                            bgcolor: "rgba(255,255,255,0.12)",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                        }}
                    >
                        <CloseRoundedIcon />
                    </IconButton>
                    {title ? (
                        <Typography
                            sx={{
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: 15,
                                mb: 1.5,
                                textAlign: "center",
                                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                            }}
                        >
                            {title}
                        </Typography>
                    ) : null}
                    <Box
                        component="iframe"
                        src={embedSrc}
                        title={title}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        sx={{
                            display: "block",
                            width: "100%",
                            height: { xs: "72vh", sm: "80vh" },
                            border: 0,
                            borderRadius: 2,
                            bgcolor: "#ffffff",
                            boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
                        }}
                    />
                </Box>
            </Fade>
        </Modal>
    );
}

export default function DocumentTemplatePreview({ fileUrl, fileName = "", title = "Xem mẫu" }) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const absoluteUrl = useMemo(() => resolveAbsoluteFileUrl(fileUrl), [fileUrl]);
    const embedSrc = useMemo(
        () => buildInlineEmbedSrc(absoluteUrl, fileName),
        [absoluteUrl, fileName],
    );
    const isImage = isImageTemplateUrl(absoluteUrl);
    const previewTitle = String(title || fileName || "Xem mẫu").trim() || "Xem mẫu";
    const tooltipTitle = isImage ? "Xem hình mẫu" : "Xem mẫu";

    if (!absoluteUrl) return null;

    const closePreview = () => setPreviewOpen(false);

    return (
        <>
            <Tooltip title={tooltipTitle} placement="top">
                <IconButton
                    size="small"
                    onClick={() => setPreviewOpen(true)}
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
                    onClose={closePreview}
                />
            ) : (
                <FileEmbedLightboxOverlay
                    open={previewOpen}
                    embedSrc={embedSrc}
                    title={previewTitle}
                    onClose={closePreview}
                />
            )}
        </>
    );
}
