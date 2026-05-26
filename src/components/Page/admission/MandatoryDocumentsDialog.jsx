import React, {forwardRef, useMemo, useState} from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Fade,
    Grow,
    IconButton,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import Slide from "@mui/material/Slide";
import {BRAND_NAVY} from "../../../constants/homeLandingTheme";
import {
    isImageTemplateUrl,
    openTemplateFileInNewTab,
    resolveAbsoluteFileUrl,
} from "../../ui/DocumentTemplatePreview.jsx";

const DIALOG_BG = "#e8f4fc";
const HEADER_BG = "#d9ecff";
const BORDER_BLUE = "#b8d8f4";
const PANEL_BORDER = "#c7e2f8";

const SlideUp = forwardRef(function SlideUp(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function pickTemplateUrlFromDoc(doc) {
    const candidates = [
        doc?.templateFileUrl,
        doc?.templateUrl,
        doc?.fileUrl,
        doc?.sampleUrl,
        doc?.template_url,
        doc?.file_url,
        doc?.url,
    ];
    for (const raw of candidates) {
        const resolved = resolveAbsoluteFileUrl(raw);
        if (resolved) return resolved;
    }
    return "";
}

export function normalizeSubmissionDocument(doc) {
    return {
        name: String(doc?.name ?? doc?.documentName ?? doc?.label ?? "").trim(),
        templateUrl: pickTemplateUrlFromDoc(doc),
        required: doc?.required !== false && doc?.required !== "false",
    };
}

export function normalizeSubmissionDocumentList(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeSubmissionDocument).filter((doc) => doc.name || doc.templateUrl);
}

function TemplatePreview({doc, onPreviewImage}) {
    const url = doc.templateUrl;
    if (!url) return null;

    if (isImageTemplateUrl(url)) {
        return (
            <Button
                variant="outlined"
                size="small"
                onClick={() => onPreviewImage({url, title: doc.name || "Mẫu hồ sơ"})}
                sx={{
                    flexShrink: 0,
                    minWidth: 0,
                    p: 0.5,
                    borderColor: PANEL_BORDER,
                    borderRadius: 2,
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        borderColor: "#60a5fa",
                        bgcolor: "#fff",
                        transform: "scale(1.03)",
                    },
                }}
            >
                <Box
                    component="img"
                    src={url}
                    alt=""
                    sx={{width: 60, height: 60, objectFit: "cover", display: "block", borderRadius: 1.5}}
                />
            </Button>
        );
    }

    return (
        <Button
            size="small"
            variant="text"
            endIcon={<OpenInNewOutlinedIcon sx={{fontSize: 16}} />}
            onClick={() => openTemplateFileInNewTab(url, doc.name)}
            sx={{
                flexShrink: 0,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                color: "#2563eb",
                whiteSpace: "nowrap",
            }}
        >
            Xem mẫu
        </Button>
    );
}

function DocumentRow({doc, onPreviewImage, isLast, rowIndex}) {
    return (
        <Grow in timeout={280 + rowIndex * 60} style={{transformOrigin: "top center"}}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 2.25,
                    py: 1.85,
                    borderBottom: isLast ? "none" : `1px solid ${PANEL_BORDER}`,
                    bgcolor: "rgba(255,255,255,0.85)",
                    transition: "background-color 0.2s ease",
                    "&:hover": {bgcolor: "#fff"},
                }}
            >
                <Typography
                    component="div"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 14.5,
                        fontWeight: 500,
                        color: "#1e293b",
                        lineHeight: 1.55,
                    }}
                >
                    {doc.name || "Hồ sơ"}
                    {doc.required ? (
                        <Box component="span" sx={{color: "#dc2626", ml: 0.25}} aria-hidden="true">
                            *
                        </Box>
                    ) : null}
                </Typography>
                <TemplatePreview doc={doc} onPreviewImage={onPreviewImage} />
            </Box>
        </Grow>
    );
}

function DocumentsPanel({title, subtitle, icon: Icon, documents, onPreviewImage, panelIndex = 0}) {
    if (documents.length === 0) return null;

    return (
        <Grow in timeout={400 + panelIndex * 120} style={{transformOrigin: "top center"}}>
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: `1px solid ${PANEL_BORDER}`,
                    overflow: "hidden",
                    bgcolor: "rgba(255,255,255,0.72)",
                    boxShadow: "0 8px 24px rgba(37, 99, 235, 0.08)",
                }}
            >
                <Box
                    sx={{
                        px: 2.25,
                        py: 1.5,
                        bgcolor: "rgba(219, 234, 254, 0.45)",
                        borderBottom: `1px solid ${PANEL_BORDER}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                    }}
                >
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: "#fff",
                            border: `1px solid ${PANEL_BORDER}`,
                            color: BRAND_NAVY,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Icon sx={{fontSize: 20}} />
                    </Box>
                    <Box sx={{minWidth: 0}}>
                        <Typography sx={{fontSize: 15, fontWeight: 700, color: BRAND_NAVY, lineHeight: 1.3}}>
                            {title}
                        </Typography>
                        {subtitle ? (
                            <Typography sx={{fontSize: 12.5, color: "#475569", mt: 0.2, lineHeight: 1.4}}>
                                {subtitle}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
                <Box>
                    {documents.map((doc, idx) => (
                        <DocumentRow
                            key={`${title}-${doc.name}-${idx}`}
                            doc={doc}
                            onPreviewImage={onPreviewImage}
                            isLast={idx === documents.length - 1}
                            rowIndex={idx}
                        />
                    ))}
                </Box>
            </Paper>
        </Grow>
    );
}

export default function MandatoryDocumentsDialog({
    open,
    onClose,
    loading,
    mandatoryDocuments = [],
    methodDocuments = [],
    context = {},
}) {
    const [imagePreview, setImagePreview] = useState(null);

    const normalizedMandatory = useMemo(
        () => normalizeSubmissionDocumentList(mandatoryDocuments),
        [mandatoryDocuments],
    );
    const normalizedMethod = useMemo(
        () => normalizeSubmissionDocumentList(methodDocuments),
        [methodDocuments],
    );

    const totalCount = normalizedMandatory.length + normalizedMethod.length;

    const handleClose = () => {
        setImagePreview(null);
        onClose();
    };

    const methodSubtitle = context?.methodName
        ? context.methodName
        : "Theo hình thức đăng ký";

    const confirmEndDateFormatted = (() => {
        const raw = context?.confirmEndDate;
        if (!raw) return null;
        if (Array.isArray(raw) && raw.length >= 3) {
            const [y, m, d] = raw;
            return new Date(y, m - 1, d).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        }
        return null;
    })();

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="md"
                TransitionComponent={SlideUp}
                transitionDuration={{enter: 320, exit: 220}}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
                        bgcolor: DIALOG_BG,
                        maxHeight: "90vh",
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        px: 3,
                        py: 2.25,
                        bgcolor: HEADER_BG,
                        borderBottom: `1px solid ${BORDER_BLUE}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.25} sx={{minWidth: 0}}>
                        <DescriptionOutlinedIcon sx={{color: BRAND_NAVY, fontSize: 26}} />
                        <Box sx={{minWidth: 0}}>
                            <Typography sx={{fontSize: 20, fontWeight: 700, color: "#0f172a", lineHeight: 1.3}}>
                                Hồ sơ cần nộp
                            </Typography>
                            {context?.schoolName ? (
                                <Typography sx={{fontSize: 13.5, color: "#475569", mt: 0.25}} noWrap>
                                    {context.schoolName}
                                </Typography>
                            ) : null}
                        </Box>
                    </Stack>
                    <IconButton onClick={handleClose} aria-label="Đóng" sx={{color: "#475569"}}>
                        <CloseRoundedIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent
                    dividers
                    sx={{
                        p: {xs: 2, md: 3},
                        bgcolor: DIALOG_BG,
                        borderColor: BORDER_BLUE,
                    }}
                >
                    {loading ? (
                        <Fade in>
                            <Stack alignItems="center" spacing={1.5} sx={{py: 5}}>
                                <CircularProgress size={28} sx={{color: BRAND_NAVY}} />
                                <Typography sx={{fontSize: 14, color: "#64748b"}}>
                                    Đang tải danh sách...
                                </Typography>
                            </Stack>
                        </Fade>
                    ) : totalCount === 0 ? (
                        <Fade in>
                            <Box
                                sx={{
                                    py: 5,
                                    px: 2,
                                    textAlign: "center",
                                    borderRadius: 3,
                                    border: `1px dashed ${PANEL_BORDER}`,
                                    bgcolor: "rgba(255,255,255,0.72)",
                                }}
                            >
                                <DescriptionOutlinedIcon sx={{fontSize: 40, color: "#93c5fd", mb: 1}} />
                                <Typography sx={{fontSize: 14, color: "#64748b"}}>
                                    Chưa có danh sách hồ sơ cho đơn này.
                                </Typography>
                            </Box>
                        </Fade>
                    ) : (
                        <Fade in timeout={400}>
                            <Stack spacing={2.25}>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        color: BRAND_NAVY,
                                        fontWeight: 600,
                                        lineHeight: 1.55,
                                        px: 0.25,
                                    }}
                                >
                                    Chuẩn bị hồ sơ và nộp tại trường tới ngày{" "}
                                    {confirmEndDateFormatted ? (
                                        <Box component="span" sx={{color: "#dc2626", fontWeight: 700}}>
                                            {confirmEndDateFormatted}
                                        </Box>
                                    ) : "—"}
                                    . Hồ sơ có dấu{" "}
                                    <Box component="span" sx={{color: "#dc2626", fontWeight: 700}}>
                                        *
                                    </Box>{" "}
                                    là bắt buộc.
                                </Typography>

                                <DocumentsPanel
                                    title="Hồ sơ chung"
                                    subtitle="Áp dụng cho mọi học sinh"
                                    icon={FolderOutlinedIcon}
                                    documents={normalizedMandatory}
                                    onPreviewImage={setImagePreview}
                                    panelIndex={0}
                                />

                                <DocumentsPanel
                                    title="Hồ sơ theo phương thức"
                                    subtitle={methodSubtitle}
                                    icon={AssignmentOutlinedIcon}
                                    documents={normalizedMethod}
                                    onPreviewImage={setImagePreview}
                                    panelIndex={1}
                                />
                            </Stack>
                        </Fade>
                    )}
                </DialogContent>
            </Dialog>

            <Fade in={Boolean(imagePreview?.url)} timeout={220}>
                <Box
                    onClick={() => setImagePreview(null)}
                    sx={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1500,
                        bgcolor: "rgba(15, 23, 42, 0.72)",
                        backdropFilter: "blur(4px)",
                        display: imagePreview?.url ? "flex" : "none",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                    }}
                >
                    <IconButton
                        onClick={() => setImagePreview(null)}
                        aria-label="Đóng xem ảnh"
                        sx={{
                            position: "fixed",
                            top: 16,
                            right: 16,
                            color: "#fff",
                            bgcolor: "rgba(255,255,255,0.12)",
                            "&:hover": {bgcolor: "rgba(255,255,255,0.2)"},
                        }}
                    >
                        <CloseRoundedIcon />
                    </IconButton>
                    <Box
                        onClick={(e) => e.stopPropagation()}
                        sx={{maxWidth: "min(92vw, 760px)", textAlign: "center"}}
                    >
                        {imagePreview?.title ? (
                            <Typography sx={{color: "#fff", fontWeight: 600, fontSize: 15, mb: 1.5, px: 2}}>
                                {imagePreview.title}
                            </Typography>
                        ) : null}
                        {imagePreview?.url ? (
                            <Box
                                component="img"
                                src={imagePreview.url}
                                alt={imagePreview.title || "Mẫu hồ sơ"}
                                sx={{
                                    maxWidth: "100%",
                                    maxHeight: "80vh",
                                    objectFit: "contain",
                                    borderRadius: 2,
                                    boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
                                }}
                            />
                        ) : null}
                    </Box>
                </Box>
            </Fade>
        </>
    );
}
