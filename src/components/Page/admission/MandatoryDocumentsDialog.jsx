import React, {useMemo, useState} from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Link,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import {BRAND_NAVY} from "../../../constants/homeLandingTheme";

function isImageUrl(url) {
    const u = String(url ?? "").trim().toLowerCase();
    if (!u) return false;
    return (
        /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(u) ||
        u.includes("/image/upload/") ||
        u.includes("/storage/v1/object/public/")
    );
}

function normalizeMandatoryDocuments(list) {
    if (!Array.isArray(list)) return [];
    return list
        .map((doc) => ({
            name: String(doc?.name ?? "").trim(),
            templateFileUrl: String(doc?.templateFileUrl ?? "").trim(),
            required: Boolean(doc?.required),
        }))
        .filter((doc) => doc.name || doc.templateFileUrl);
}

function MandatoryDocumentRow({doc, onPreviewImage}) {
    const hasTemplate = Boolean(doc.templateFileUrl);
    const showImage = hasTemplate && isImageUrl(doc.templateFileUrl);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 2.5,
                border: "1px solid #c7e2f8",
                bgcolor: "rgba(255,255,255,0.9)",
            }}
        >
            <Stack
                direction={{xs: "column", sm: "row"}}
                spacing={2}
                alignItems={{xs: "stretch", sm: "flex-start"}}
            >
                <Box sx={{flex: 1, minWidth: 0}}>
                    <Typography
                        sx={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: 15,
                            lineHeight: 1.45,
                            mb: hasTemplate && !showImage ? 0.75 : 0,
                        }}
                    >
                        {doc.name || "Hồ sơ"}
                        {doc.required ? (
                            <Box component="span" sx={{color: "#dc2626", ml: 0.25}} aria-hidden="true">
                                {" "}
                                *
                            </Box>
                        ) : null}
                    </Typography>
                    {hasTemplate && !showImage ? (
                        <Button
                            component={Link}
                            href={doc.templateFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            startIcon={<OpenInNewRoundedIcon fontSize="small" />}
                            sx={{textTransform: "none", fontWeight: 600, px: 0}}
                        >
                            Xem mẫu hồ sơ
                        </Button>
                    ) : null}
                </Box>
                {showImage ? (
                    <Stack spacing={0.75} sx={{flexShrink: 0, maxWidth: {xs: "100%", sm: 220}}}>
                        <Typography sx={{fontSize: 13, fontWeight: 700, color: "#475569"}}>
                            Hình mẫu
                        </Typography>
                        <Box
                            component="button"
                            type="button"
                            onClick={() =>
                                onPreviewImage({url: doc.templateFileUrl, title: "Hình mẫu"})
                            }
                            sx={{
                                border: "1px solid #cbd5e1",
                                borderRadius: 2,
                                p: 0,
                                bgcolor: "#fff",
                                cursor: "pointer",
                                overflow: "hidden",
                                lineHeight: 0,
                            }}
                        >
                            <Box
                                component="img"
                                src={doc.templateFileUrl}
                                alt="Hình mẫu"
                                sx={{
                                    display: "block",
                                    width: "100%",
                                    maxHeight: 160,
                                    objectFit: "contain",
                                }}
                            />
                        </Box>
                    </Stack>
                ) : null}
            </Stack>
        </Paper>
    );
}

export default function MandatoryDocumentsDialog({
    open,
    onClose,
    loading,
    documents,
}) {
    const [imagePreview, setImagePreview] = useState(null);
    const normalizedDocs = useMemo(() => normalizeMandatoryDocuments(documents), [documents]);

    const handleClose = () => {
        setImagePreview(null);
        onClose();
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
                        bgcolor: "#e8f4fc",
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
                        bgcolor: "#d9ecff",
                        borderBottom: "1px solid #b8d8f4",
                    }}
                >
                    <Typography sx={{fontSize: 20, fontWeight: 700, color: "#0f172a"}}>
                        Hồ sơ cần nộp
                    </Typography>
                    <IconButton onClick={handleClose} aria-label="Đóng">
                        <CloseRoundedIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{bgcolor: "#e8f4fc", borderColor: "#b8d8f4", p: 3}}>
                    {loading ? (
                        <Stack alignItems="center" spacing={1.5} sx={{py: 4}}>
                            <CircularProgress size={28} />
                            <Typography sx={{color: "#64748b", fontWeight: 500}}>
                                Đang tải danh sách hồ sơ...
                            </Typography>
                        </Stack>
                    ) : normalizedDocs.length === 0 ? (
                        <Typography sx={{color: "#64748b", fontWeight: 500, textAlign: "center", py: 3}}>
                            Chưa có danh sách hồ sơ cần nộp cho đơn này.
                        </Typography>
                    ) : (
                        <Stack spacing={1.5}>
                            <Typography sx={{fontSize: 14, color: BRAND_NAVY, fontWeight: 600}}>
                                Vui lòng chuẩn bị và nộp các hồ sơ sau theo mẫu của trường:
                            </Typography>
                            {normalizedDocs.map((doc, index) => (
                                <MandatoryDocumentRow
                                    key={`${doc.name}-${index}`}
                                    doc={doc}
                                    onPreviewImage={setImagePreview}
                                />
                            ))}
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
            {imagePreview?.url ? (
                <Box
                    onClick={() => setImagePreview(null)}
                    sx={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1500,
                        bgcolor: "rgba(15, 23, 42, 0.55)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                    }}
                >
                    <Box onClick={(e) => e.stopPropagation()} sx={{maxWidth: "92vw", maxHeight: "88vh"}}>
                        {imagePreview.title ? (
                            <Typography
                                sx={{
                                    color: "#fff",
                                    fontWeight: 700,
                                    mb: 1,
                                    textAlign: "center",
                                }}
                            >
                                {imagePreview.title}
                            </Typography>
                        ) : null}
                        <Box
                            component="img"
                            src={imagePreview.url}
                            alt={imagePreview.title || "Mẫu hồ sơ"}
                            sx={{maxWidth: "92vw", maxHeight: "82vh", objectFit: "contain", display: "block"}}
                        />
                    </Box>
                </Box>
            ) : null}
        </>
    );
}
