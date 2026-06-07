import React from "react";
import {
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import {HOC_BA_THCS_CODE, HOC_BA_THCS_GRADE_LABELS, mapTranscriptImagesToSlots} from "./admissionSubmissionUtils.js";

const DIALOG_BG = "#e8f4fc";
const HEADER_BG = "#d9ecff";
const BORDER_BLUE = "#b8d8f4";
const PANEL_BORDER = "#c7e2f8";
const BRAND_NAVY = "#1e3a8a";

function ImagePanel({url, label, onPreview}) {
    if (!url) {
        return (
            <Box
                sx={{
                    flex: 1,
                    minHeight: 140,
                    borderRadius: 2,
                    border: `1.5px dashed ${PANEL_BORDER}`,
                    bgcolor: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.75,
                    p: 1,
                }}
            >
                <ImageNotSupportedOutlinedIcon sx={{fontSize: 28, color: "#94a3b8"}} />
                <Typography sx={{fontSize: 12, color: "#94a3b8", textAlign: "center"}}>
                    Chưa có ảnh
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 220,
                borderRadius: 2,
                border: `1.5px solid ${PANEL_BORDER}`,
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
                "&:hover .zoom-icon": {opacity: 1},
                bgcolor: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            onClick={() => onPreview(url, label)}
        >
            <Box
                component="img"
                src={url}
                alt={label}
                sx={{width: "100%", height: 220, objectFit: "contain", display: "block", backgroundColor: "#f8fafc"}}
            />
            <Box
                className="zoom-icon"
                sx={{
                    position: "absolute",
                    inset: 0,
                    bgcolor: "rgba(15,23,42,0.38)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.18s",
                    borderRadius: 2,
                }}
            >
                <ZoomInRoundedIcon sx={{color: "#fff", fontSize: 32}} />
            </Box>
        </Box>
    );
}

function DocReviewRow({doc, checked, onToggle, onPreview}) {
    const isRequired = doc.required !== false && doc.required !== "false";
    const hasSubmission = Boolean(doc.imageUrl);

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2.5,
                border: `1.5px solid ${checked ? "#86efac" : isRequired && !hasSubmission ? "#fca5a5" : PANEL_BORDER}`,
                bgcolor: checked ? "rgba(240,253,244,0.8)" : "rgba(255,255,255,0.75)",
                p: 2,
                transition: "all 0.2s",
            }}
        >
            <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{mb: 1.5}}>
                <Checkbox
                    checked={checked}
                    onChange={(e) => onToggle(doc.key, e.target.checked)}
                    disabled={!hasSubmission}
                    size="small"
                    sx={{mt: -0.25, p: 0.25, color: "#60a5fa", "&.Mui-checked": {color: "#16a34a"}}}
                />
                <Box sx={{flex: 1, minWidth: 0}}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Typography sx={{fontSize: 14.5, fontWeight: 700, color: BRAND_NAVY, lineHeight: 1.4}}>
                            {doc.name || doc.key}
                            {isRequired && (
                                <Box component="span" sx={{color: "#dc2626", ml: 0.25}}>*</Box>
                            )}
                        </Typography>
                        {!hasSubmission && (
                            <Chip
                                label="Chưa nộp"
                                size="small"
                                sx={{fontSize: 11, height: 20, bgcolor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5"}}
                            />
                        )}
                        {hasSubmission && checked && (
                            <Chip
                                label="Đã xác nhận"
                                size="small"
                                icon={<CheckCircleRoundedIcon sx={{fontSize: "14px !important", color: "#16a34a !important"}} />}
                                sx={{fontSize: 11, height: 20, bgcolor: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac"}}
                            />
                        )}
                    </Stack>
                    {!hasSubmission && isRequired && (
                        <Typography sx={{fontSize: 12, color: "#dc2626", mt: 0.25}}>
                            Phụ huynh chưa nộp tài liệu bắt buộc này.
                        </Typography>
                    )}
                </Box>
            </Stack>

            <Stack direction="row" spacing={1.5}>
                <Box sx={{flex: 1}}>
                    <Typography sx={{fontSize: 11.5, fontWeight: 700, color: "#64748b", mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em"}}>
                        Mẫu yêu cầu của trường
                    </Typography>
                    <ImagePanel url={doc.templateFileUrl} label={`Mẫu: ${doc.name}`} onPreview={onPreview} />
                </Box>
                <Divider orientation="vertical" flexItem sx={{borderColor: PANEL_BORDER}} />
                <Box sx={{flex: 1}}>
                    <Typography sx={{fontSize: 11.5, fontWeight: 700, color: "#64748b", mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em"}}>
                        Ảnh phụ huynh nộp
                    </Typography>
                    <ImagePanel url={doc.imageUrl} label={doc.name} onPreview={onPreview} />
                </Box>
            </Stack>
        </Paper>
    );
}

function TranscriptReviewRow({transcriptImages, checked, onToggle, onPreview}) {
    const slots = mapTranscriptImagesToSlots(transcriptImages);
    const hasAny = slots.some((u) => u != null && String(u).trim() !== "");
    if (!hasAny) return null;

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2.5,
                border: `1.5px solid ${checked ? "#86efac" : PANEL_BORDER}`,
                bgcolor: checked ? "rgba(240,253,244,0.8)" : "rgba(255,255,255,0.75)",
                p: 2,
                transition: "all 0.2s",
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{mb: 1.5}}>
                <Checkbox
                    checked={checked}
                    onChange={(e) => onToggle(HOC_BA_THCS_CODE, e.target.checked)}
                    size="small"
                    sx={{mt: -0.25, p: 0.25, color: "#60a5fa", "&.Mui-checked": {color: "#16a34a"}}}
                />
                <Typography sx={{fontSize: 14.5, fontWeight: 700, color: BRAND_NAVY}}>
                    Học bạ THCS
                    <Box component="span" sx={{color: "#dc2626", ml: 0.25}}>*</Box>
                </Typography>
                {checked && (
                    <Chip
                        label="Đã xác nhận"
                        size="small"
                        icon={<CheckCircleRoundedIcon sx={{fontSize: "14px !important", color: "#16a34a !important"}} />}
                        sx={{fontSize: 11, height: 20, bgcolor: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac"}}
                    />
                )}
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {HOC_BA_THCS_GRADE_LABELS.map((gradeLabel, i) => {
                    const url = slots[i];
                    return (
                        <Box key={gradeLabel} sx={{flex: "1 1 calc(25% - 8px)", minWidth: 100}}>
                            <Typography sx={{fontSize: 11.5, fontWeight: 600, color: "#475569", mb: 0.5, textAlign: "center"}}>
                                {gradeLabel}
                            </Typography>
                            <ImagePanel url={url} label={gradeLabel} onPreview={onPreview} />
                        </Box>
                    );
                })}
            </Stack>
        </Paper>
    );
}

function ImagePreviewOverlay({preview, onClose}) {
    if (!preview) return null;
    return (
        <Box
            onClick={onClose}
            sx={{
                position: "fixed",
                inset: 0,
                zIndex: 2000,
                bgcolor: "rgba(15,23,42,0.72)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{position: "fixed", top: 16, right: 16, color: "#fff", bgcolor: "rgba(255,255,255,0.12)"}}
            >
                <CloseRoundedIcon />
            </IconButton>
            <Box onClick={(e) => e.stopPropagation()} sx={{maxWidth: "min(92vw, 800px)", textAlign: "center"}}>
                {preview.label && (
                    <Typography sx={{color: "#fff", fontWeight: 600, fontSize: 15, mb: 1.5}}>
                        {preview.label}
                    </Typography>
                )}
                <Box
                    component="img"
                    src={preview.url}
                    alt={preview.label}
                    sx={{maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 2, boxShadow: "0 24px 48px rgba(0,0,0,0.4)"}}
                />
            </Box>
        </Box>
    );
}

export default function DocumentReviewDialog({
    open,
    onClose,
    onConfirmApprove,
    isSubmitting,
    submittedDocuments = [],
    transcriptImages = [],
    studentName,
}) {
    const [checkedKeys, setCheckedKeys] = React.useState(new Set());
    const [preview, setPreview] = React.useState(null);

    React.useEffect(() => {
        if (open) setCheckedKeys(new Set());
    }, [open]);

    const handleToggle = (key, value) => {
        setCheckedKeys((prev) => {
            const next = new Set(prev);
            if (value) next.add(key);
            else next.delete(key);
            return next;
        });
    };

    const handlePreview = (url, label) => setPreview({url, label});

    const hasTranscripts = Array.isArray(transcriptImages) &&
        mapTranscriptImagesToSlots(transcriptImages).some((u) => u != null && String(u).trim() !== "");

    const requiredDocKeys = submittedDocuments
        .filter((d) => d.required !== false && d.required !== "false")
        .map((d) => d.key)
        .filter(Boolean);

    const allRequiredChecked =
        requiredDocKeys.every((k) => checkedKeys.has(k)) &&
        (!hasTranscripts || checkedKeys.has(HOC_BA_THCS_CODE));

    const totalRequired = requiredDocKeys.length + (hasTranscripts ? 1 : 0);
    const totalChecked = [...checkedKeys].filter(
        (k) => requiredDocKeys.includes(k) || k === HOC_BA_THCS_CODE,
    ).length;

    return (
        <>
            <Dialog
                open={open}
                onClose={!isSubmitting ? onClose : undefined}
                fullWidth
                maxWidth="md"
                PaperProps={{sx: {borderRadius: 3, overflow: "hidden", bgcolor: DIALOG_BG, maxHeight: "92vh"}}}
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
                    <Box>
                        <Typography sx={{fontSize: 18, fontWeight: 700, color: "#0f172a"}}>
                            Kiểm tra hồ sơ trước khi phê duyệt
                        </Typography>
                        {studentName && (
                            <Typography sx={{fontSize: 13, color: "#475569", mt: 0.3}}>
                                Học sinh: {studentName}
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={onClose} disabled={isSubmitting}>
                        <CloseRoundedIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{bgcolor: DIALOG_BG, borderColor: BORDER_BLUE, p: 3}}>
                    <Stack spacing={0.75} sx={{mb: 2}}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <WarningAmberRoundedIcon sx={{fontSize: 18, color: "#d97706"}} />
                            <Typography sx={{fontSize: 13.5, color: "#92400e", fontWeight: 600}}>
                                Vui lòng xem và tick xác nhận từng tài liệu trước khi phê duyệt.
                            </Typography>
                        </Stack>
                        <Typography sx={{fontSize: 12.5, color: "#64748b", pl: 3.25}}>
                            So sánh ảnh phụ huynh nộp (phải) với mẫu trường yêu cầu (trái). Tick khi đã kiểm tra xong.
                        </Typography>
                    </Stack>

                    {totalRequired > 0 && (
                        <Box sx={{mb: 2, px: 0.5}}>
                            <Typography sx={{fontSize: 13, color: totalChecked === totalRequired ? "#16a34a" : "#475569", fontWeight: 600}}>
                                Đã xác nhận: {totalChecked} / {totalRequired} tài liệu bắt buộc
                            </Typography>
                        </Box>
                    )}

                    <Stack spacing={2}>
                        {submittedDocuments.map((doc) => (
                            <DocReviewRow
                                key={doc.key}
                                doc={doc}
                                checked={checkedKeys.has(doc.key)}
                                onToggle={handleToggle}
                                onPreview={handlePreview}
                            />
                        ))}
                        {hasTranscripts && (
                            <TranscriptReviewRow
                                transcriptImages={transcriptImages}
                                checked={checkedKeys.has(HOC_BA_THCS_CODE)}
                                onToggle={handleToggle}
                                onPreview={handlePreview}
                            />
                        )}
                        {submittedDocuments.length === 0 && !hasTranscripts && (
                            <Box sx={{py: 4, textAlign: "center", color: "#64748b"}}>
                                <Typography>Không có tài liệu nào trong hồ sơ này.</Typography>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{p: 2, borderTop: `1px solid ${BORDER_BLUE}`, bgcolor: "#eef7ff", gap: 1}}>
                    <Typography sx={{flex: 1, fontSize: 13, color: allRequiredChecked ? "#16a34a" : "#64748b", fontWeight: 600}}>
                        {allRequiredChecked
                            ? "✅ Đã kiểm tra đủ tài liệu — có thể phê duyệt"
                            : `Còn ${totalRequired - totalChecked} tài liệu chưa được xác nhận`}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        disabled={isSubmitting}
                        sx={{textTransform: "none", borderRadius: 2.5}}
                    >
                        Hủy
                    </Button>
                    <Tooltip title={!allRequiredChecked ? "Vui lòng xác nhận đủ các tài liệu bắt buộc" : ""}>
                        <span>
                            <Button
                                variant="contained"
                                disabled={!allRequiredChecked || isSubmitting}
                                onClick={() => onConfirmApprove(Array.from(checkedKeys))}
                                sx={{
                                    textTransform: "none",
                                    borderRadius: 2.5,
                                    fontWeight: 800,
                                    background: allRequiredChecked
                                        ? "linear-gradient(90deg, #16a34a 0%, #22c55e 100%)"
                                        : undefined,
                                }}
                            >
                                {isSubmitting ? "Đang xử lý..." : "Phê duyệt"}
                            </Button>
                        </span>
                    </Tooltip>
                </DialogActions>
            </Dialog>

            <ImagePreviewOverlay preview={preview} onClose={() => setPreview(null)} />
        </>
    );
}
