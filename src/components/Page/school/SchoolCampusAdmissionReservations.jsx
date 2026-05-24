import React from "react";
import {
    Alert,
    Avatar,
    Backdrop,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fade,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    CircularProgress,
    Tabs,
    Tab,
    Collapse,
    ListSubheader,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import RemoveCircleOutlinedIcon from "@mui/icons-material/RemoveCircleOutlined";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import {enqueueSnackbar} from "notistack";
import {useTheme} from "@mui/material/styles";
import {useSchool} from "../../../contexts/SchoolContext.jsx";
import {
    confirmAdmissionReservationPayment,
    getCampusAdmissionReservationForms,
    processAdmissionReservationForm,
    getAdmissionCampaigns,
    autoApproveAdmissionReservations,
    batchConfirmAdmissionReservationForms,
    exportAdmissionForms,
} from "../../../services/CampusAdmissionReservationService.jsx";
import {getApiErrorMessage} from "../../../utils/getApiErrorMessage.js";
import {AdmissionDocumentsSection} from "../admission/AdmissionDocumentUploadFields.jsx";
import {PaymentProofPreview} from "../admission/PaymentProofPreview.jsx";
import RejectReasonAlert from "../admission/RejectReasonAlert.jsx";
import ConfirmDialog, {ConfirmHighlight} from "../../ui/ConfirmDialog.jsx";
import {
    HOC_BA_THCS_CODE,
    HOC_BA_THCS_GRADE_LABELS,
    formatReservationDateOfBirth,
    pickCheckedDocumentsFromReservation,
    pickProfileMetaDataFromTemplate,
    pickReservationDateOfBirth,
    reservationToReadonlyDocs,
    sanitizeReservationDisplayValue,
} from "../admission/admissionSubmissionUtils.js";
import {
    RESERVATION_STATUS,
    RESERVATION_STATUS_FILTER_OPTIONS,
    RESERVATION_STATUS_FILTER_VALUES,
    getReservationStatusLabel,
    getReservationStatusStyle,
    normalizeReservationStatus,
    ADMISSION_FORM_EXPORT_STATUSES,
} from "../../../constants/reservationStatusConfig.js";

const STATUS_ICONS = {
    [RESERVATION_STATUS.PENDING]: AccessTimeRoundedIcon,
    [RESERVATION_STATUS.APPROVAL]: CheckCircleRoundedIcon,
    [RESERVATION_STATUS.PAYMENT_PENDING]: AccessTimeRoundedIcon,
    [RESERVATION_STATUS.PAYMENT_REJECTED]: CancelRoundedIcon,
    [RESERVATION_STATUS.DEPOSITED]: CheckCircleRoundedIcon,
    [RESERVATION_STATUS.DEPOSIT_EXPIRED]: CancelRoundedIcon,
    [RESERVATION_STATUS.CONFIRMED]: CheckCircleRoundedIcon,
    [RESERVATION_STATUS.GHOST]: CancelRoundedIcon,
    [RESERVATION_STATUS.CANCELLED]: CancelRoundedIcon,
    [RESERVATION_STATUS.REJECTED]: CancelRoundedIcon,
};

const statusMeta = (status) => {
    const key = normalizeReservationStatus(status);
    const style = getReservationStatusStyle(status);
    const icon = STATUS_ICONS[key] ?? AccessTimeRoundedIcon;
    if (style) return {...style, icon};
    if (!key) return {...getReservationStatusStyle(RESERVATION_STATUS.PENDING), icon};
    return {
        label: getReservationStatusLabel(status),
        color: "#475569",
        bg: "#f1f5f9",
        border: "#cbd5e1",
        icon,
    };
};

const formatDateOnly = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("vi-VN");
};

const formatGender = (value) => {
    const key = String(value || "").trim().toUpperCase();
    if (key === "MALE") return "Nam";
    if (key === "FEMALE") return "Nữ";
    return value || "Chưa cập nhật";
};

const InfoRow = ({ icon, label, value }) => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        <Box sx={{ color: "#64748b", display: "inline-flex" }}>{icon}</Box>
        <Typography variant="body2" sx={{ color: "#64748b", minWidth: 82 }}>
            {label}
        </Typography>
        <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600, minWidth: 0, wordBreak: "break-word" }}>
            {value || "—"}
        </Typography>
    </Stack>
);

const StatusChip = ({ status }) => {
    const meta = statusMeta(status);
    return (
        <Chip
            label={meta.label}
            sx={{
                borderRadius: 999,
                bgcolor: meta.bg,
                color: meta.color,
                border: `1px solid ${meta.border}`,
                fontWeight: 800,
                height: 34,
                "& .MuiChip-label": { px: 1.25 },
            }}
        />
    );
};

const displayOrDash = (value) => sanitizeReservationDisplayValue(value) ?? "—";

const ROW_ACTION_BTN_BASE = {
    width: 32,
    height: 32,
    borderRadius: 1.25,
    border: "1px solid",
    p: 0,
    transition: "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.15s ease, box-shadow 0.15s ease",
    "& .MuiSvgIcon-root": {fontSize: 18},
    "&.Mui-disabled": {opacity: 0.45},
};

const ROW_ACTION_VARIANTS = {
    view: {
        color: "#1d4ed8",
        bgcolor: "#eff6ff",
        borderColor: "#bfdbfe",
        "&:hover": {
            bgcolor: "#dbeafe",
            borderColor: "#60a5fa",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
            transform: "translateY(-1px)",
        },
    },
    success: {
        color: "#047857",
        bgcolor: "#ecfdf5",
        borderColor: "#86efac",
        "&:hover": {
            bgcolor: "#d1fae5",
            borderColor: "#4ade80",
            boxShadow: "0 2px 8px rgba(5, 150, 105, 0.22)",
            transform: "translateY(-1px)",
        },
    },
    danger: {
        color: "#b91c1c",
        bgcolor: "#fef2f2",
        borderColor: "#fecaca",
        "&:hover": {
            bgcolor: "#fee2e2",
            borderColor: "#f87171",
            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.2)",
            transform: "translateY(-1px)",
        },
    },
};

function RowActionButton({variant = "view", title, disabled, onClick, children}) {
    return (
        <Tooltip title={title} arrow placement="top">
            <span>
                <IconButton
                    size="small"
                    disabled={disabled}
                    onClick={onClick}
                    aria-label={title}
                    sx={{...ROW_ACTION_BTN_BASE, ...ROW_ACTION_VARIANTS[variant]}}
                >
                    {children}
                </IconButton>
            </span>
        </Tooltip>
    );
}

const flattenAttachments = (row) => {
    if (!row) return [];
    const files = [];
    reservationToReadonlyDocs(row).forEach((doc) => {
        const label = doc.name || doc.code || "Minh chứng";
        (doc.slots || []).forEach((url, slotIndex) => {
            if (!url) return;
            const slotLabel =
                doc.code === HOC_BA_THCS_CODE && HOC_BA_THCS_GRADE_LABELS[slotIndex]
                    ? `${label} — ${HOC_BA_THCS_GRADE_LABELS[slotIndex]}`
                    : label;
            files.push({key: slotLabel, url});
        });
    });
    return files;
};

const resolveBlobFileName = (response, fallback) => {
    const contentDisposition = response?.headers?.["content-disposition"] || "";
    const fileNameFromHeader = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];
    return decodeURIComponent((fileNameFromHeader || "").replace(/"/g, "")) || fallback;
};

const triggerBlobDownload = (fileBlob, fileName) => {
    const downloadUrl = window.URL.createObjectURL(fileBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};

const mapRow = (item, index) => {
    const studentName = item?.studentName ?? item?.childName ?? item?.studentProfileName ?? "Học sinh chưa có tên";
    const parentName = item?.parentName ?? item?.guardianName ?? "Phụ huynh";
    const status = normalizeReservationStatus(item?.status ?? item?.formStatus);
    const submittedAt = item?.submittedAt ?? item?.createdTime ?? item?.createdAt ?? item?.createdDate;
    const profileMetadata = pickProfileMetaDataFromTemplate(item);
    const transcriptImages = Array.isArray(item?.transcriptImages) ? item.transcriptImages : [];
    const dobRaw = pickReservationDateOfBirth(item);
    const dateOfBirth = dobRaw ? formatReservationDateOfBirth(dobRaw) : "—";
    return {
        id: Number(item?.formId ?? item?.id ?? index + 1),
        campusId: Number(item?.campusId),
        campusName: displayOrDash(item?.campusName),
        studentName: String(studentName),
        studentCode: displayOrDash(item?.studentCode),
        dateOfBirth,
        currentSchool: displayOrDash(item?.schoolName ?? item?.currentSchool ?? item?.currentSchoolName),
        registerClass: displayOrDash(item?.registerClass ?? item?.gradeName ?? item?.targetGrade),
        programName: displayOrDash(item?.programName),
        methodName: displayOrDash(item?.methodName ?? item?.admissionMethodCode),
        campusProgramOfferingId: displayOrDash(item?.campusProgramOfferingId),
        confirmCode: displayOrDash(item?.confirmCode ?? item?.confirm_code),
        submittedAt,
        parentName: String(parentName),
        phone: String(item?.parentPhone ?? item?.phone ?? "—"),
        parentEmail: String(item?.parentEmail ?? "—"),
        address: String(item?.address ?? "—"),
        gender: String(item?.gender ?? "—"),
        identityCard: String(item?.identityCard ?? "—"),
        profileMetadata,
        transcriptImages,
        paymentProofUrl: item?.paymentProofUrl ?? null,
        note: String(item?.note ?? item?.message ?? "").trim(),
        rejectReason: String(item?.rejectReason ?? "").trim(),
        cancelReason: String(item?.cancelReason ?? "").trim(),
        status,
        admissionCampaignId: Number(item?.admissionCampaignId) || null,
        admissionCampaignName: String(item?.admissionCampaignName ?? "").trim() || "—",
        admissionCampaignYear:
            item?.admissionCampaignYear != null && item?.admissionCampaignYear !== ""
                ? Number(item.admissionCampaignYear)
                : null,
        raw: item,
    };
};

const mapCampaign = (item) => ({
    id: Number(item?.id ?? item?.admissionCampaignId),
    name: String(item?.name ?? item?.admissionCampaignName ?? "Chiến dịch").trim(),
    year:
        item?.year != null && item?.year !== ""
            ? Number(item.year)
            : item?.admissionCampaignYear != null && item?.admissionCampaignYear !== ""
              ? Number(item.admissionCampaignYear)
              : null,
    isActive: Boolean(item?.isActive),
});

const filterAndSortForms = (forms, {search, statusFilter, sortBy}) => {
    let result = Array.isArray(forms) ? [...forms] : [];
    if (statusFilter !== "ALL") {
        result = result.filter((row) => row.status === statusFilter);
    }
    const kw = String(search || "").trim().toLowerCase();
    if (kw) {
        result = result.filter((row) =>
            [
                row.studentName,
                row.studentCode,
                row.dateOfBirth,
                row.confirmCode,
                row.parentName,
                row.phone,
                row.parentEmail,
                row.currentSchool,
                row.programName,
                row.methodName,
                row.identityCard,
                row.admissionCampaignName,
            ].some((field) => String(field || "").toLowerCase().includes(kw)),
        );
    }
    result.sort((a, b) => {
        const diff = new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
        return sortBy === "OLDEST" ? -diff : diff;
    });
    return result;
};

const buildCampaignGroups = (campaigns, forms) => {
    const formsByCampaign = new Map();
    forms.forEach((form) => {
        const campaignId = form.admissionCampaignId;
        if (!campaignId) return;
        if (!formsByCampaign.has(campaignId)) formsByCampaign.set(campaignId, []);
        formsByCampaign.get(campaignId).push(form);
    });

    const seen = new Set();
    const groups = (Array.isArray(campaigns) ? campaigns : [])
        .filter((c) => c?.id)
        .map((campaign) => {
            seen.add(campaign.id);
            return {
                ...campaign,
                forms: formsByCampaign.get(campaign.id) ?? [],
            };
        });

    formsByCampaign.forEach((campaignForms, campaignId) => {
        if (seen.has(campaignId)) return;
        const sample = campaignForms[0];
        groups.push({
            id: campaignId,
            name:
                sample?.admissionCampaignName && sample.admissionCampaignName !== "—"
                    ? sample.admissionCampaignName
                    : `Chiến dịch #${campaignId}`,
            year: sample?.admissionCampaignYear ?? null,
            isActive: false,
            forms: campaignForms,
        });
    });

    return groups.sort((a, b) => {
        const yearDiff = (b.year ?? 0) - (a.year ?? 0);
        if (yearDiff !== 0) return yearDiff;
        return String(a.name || "").localeCompare(String(b.name || ""), "vi");
    });
};

function AdmissionReservationCard({ row, isSubmitting, onApprove, onReject, onConfirmPayment, onRejectPayment, onViewDetail, onOpenPreview }) {
    const isPending = row.status === RESERVATION_STATUS.PENDING;
    const isPaymentPending = row.status === RESERVATION_STATUS.PAYMENT_PENDING;
    const attachmentFiles = flattenAttachments(row);
    const meta = statusMeta(row.status);
    const StatusIcon = meta.icon;

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2.5,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                bgcolor: "#fff",
                boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
                transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
                "&:hover": {
                    borderColor: "#bfdbfe",
                    boxShadow: "0 12px 28px rgba(37, 99, 235, 0.1)",
                    transform: "translateY(-1px)",
                },
            }}
        >
            <Stack
                direction={{xs: "column", lg: "row"}}
                alignItems={{xs: "stretch", lg: "center"}}
                justifyContent="space-between"
                gap={2}
                sx={{px: {xs: 2, md: 2.5}, py: 2.25}}
            >
                <Stack direction={{xs: "column", md: "row"}} alignItems={{xs: "stretch", md: "flex-start"}} gap={1.5} sx={{minWidth: 0, flex: 1}}>
                    <Box sx={{minWidth: 0, flex: 1}}>
                        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{mb: 0.6}}>
                            <Typography sx={{fontSize: 17, fontWeight: 700, color: "#1e3a8a", lineHeight: 1.3}}>
                                {row.parentName}
                            </Typography>
                            <Chip
                                icon={<StatusIcon sx={{fontSize: 16}} />}
                                label={meta.label}
                                size="small"
                                sx={{
                                    bgcolor: meta.bg,
                                    color: meta.color,
                                    border: `1px solid ${meta.border}`,
                                    fontWeight: 700,
                                    borderRadius: 999,
                                }}
                            />
                        </Stack>
                        <Typography sx={{fontSize: 14, color: "#475569", mb: 0.5}}>
                            <strong>Học sinh:</strong> {row.studentName}
                        </Typography>
                        {row.dateOfBirth !== "—" ? (
                            <Typography sx={{fontSize: 13.5, color: "#64748b", mb: 1}}>
                                <strong>Ngày sinh:</strong> {row.dateOfBirth}
                            </Typography>
                        ) : (
                            <Box sx={{mb: 1}} />
                        )}
                        <Stack direction={{xs: "column", sm: "row"}} spacing={{xs: 0.65, sm: 2}} sx={{mb: 0.7}}>
                            <Typography variant="body2" sx={{ color: "#475569" }}>
                                <strong>SĐT:</strong> {row.phone || "—"}
                            </Typography>
                        </Stack>
                    </Box>
                    <Stack spacing={0.8} sx={{minWidth: {md: 280}, alignItems: {xs: "flex-start", md: "flex-end"}}}>
                        <Typography variant="body2" sx={{ color: "#64748b", textAlign: {xs: "left", md: "right"} }}>
                            <strong>Chương trình:</strong> {row.programName || "—"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748b", textAlign: {xs: "left", md: "right"} }}>
                            <strong>Ngày nộp:</strong> {formatDateOnly(row.submittedAt)}
                        </Typography>
                        {row.status === RESERVATION_STATUS.CONFIRMED && row.confirmCode !== "—" ? (
                            <Typography
                                variant="body2"
                                sx={{color: "#0369a1", fontWeight: 700, textAlign: {xs: "left", md: "right"}}}
                            >
                                <strong>Mã hồ sơ:</strong> {row.confirmCode}
                            </Typography>
                        ) : null}
                    </Stack>
                </Stack>
                {isPending ? (
                    <Stack direction={{ xs: "column", sm: "row", lg: "column" }} spacing={1} sx={{ width: { xs: "100%", lg: 180 }, flexShrink: 0 }}>
                        <Button
                            variant="outlined"
                            startIcon={<VisibilityRoundedIcon />}
                            onClick={onViewDetail}
                            sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700, borderColor: "#bfdbfe", color: "#1e3a8a" }}
                        >
                            Xem chi tiết
                        </Button>
                        <Button
                            variant="contained"
                            disabled={isSubmitting}
                            onClick={onApprove}
                            sx={{ textTransform: "none", borderRadius: 999, fontWeight: 800, background: "linear-gradient(90deg, #0D64DE 0%, #2563eb 100%)" }}
                        >
                            Phê duyệt
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            disabled={isSubmitting}
                            onClick={onReject}
                            sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700 }}
                        >
                            Từ chối
                        </Button>
                    </Stack>
                ) : isPaymentPending ? (
                    <Stack direction={{ xs: "column", sm: "row", lg: "column" }} spacing={1} sx={{ width: { xs: "100%", lg: 200 }, flexShrink: 0 }}>
                        <Button
                            variant="outlined"
                            startIcon={<VisibilityRoundedIcon />}
                            onClick={onViewDetail}
                            sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700, borderColor: "#bfdbfe", color: "#1e3a8a" }}
                        >
                            Xem chi tiết
                        </Button>
                        <Button
                            variant="contained"
                            disabled={isSubmitting}
                            onClick={onConfirmPayment}
                            sx={{ textTransform: "none", borderRadius: 999, fontWeight: 800, background: "linear-gradient(90deg, #0D64DE 0%, #2563eb 100%)" }}
                        >
                            Xác nhận hoàn thành
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            disabled={isSubmitting}
                            onClick={onRejectPayment}
                            sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700 }}
                        >
                            Từ chối thanh toán
                        </Button>
                    </Stack>
                ) : (
                    <Stack direction={{ xs: "column", sm: "row", lg: "column" }} spacing={1} sx={{ width: { xs: "100%", lg: 180 }, flexShrink: 0 }}>
                        <Button
                            variant="outlined"
                            startIcon={<VisibilityRoundedIcon />}
                            onClick={onViewDetail}
                            sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700, borderColor: "#bfdbfe", color: "#1e3a8a" }}
                        >
                            Xem chi tiết
                        </Button>
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

function AttachmentGallery({ files, onOpenImage }) {
    if (files.length === 0) {
        return <Typography variant="body2" sx={{ color: "#64748b" }}>Không có tệp đính kèm.</Typography>;
    }
    return (
        <Grid container spacing={1.2}>
            {files.map((file, idx) => (
                <Grid item xs={6} sm={4} key={`${file.key}-${idx}`}>
                    <Box
                        onClick={() => onOpenImage(idx)}
                        sx={{
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid #e2e8f0",
                            cursor: "pointer",
                            bgcolor: "#fff",
                        }}
                    >
                        <Box component="img" src={file.url} alt={file.key} loading="lazy" sx={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", transition: "transform .25s ease", "&:hover": { transform: "scale(1.04)" } }} />
                        <Typography variant="caption" sx={{ px: 1, py: 0.75, display: "block", color: "#475569", fontWeight: 700 }} noWrap>
                            {file.key}
                        </Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );
}

function DetailInfoRow({ label, value }) {
    return (
        <Box
            sx={{
                py: 0.8,
                borderBottom: "1px dashed #c7d8ea",
            }}
        >
            <Typography sx={{fontSize: 14.5, color: "#1e293b"}}>
                <Box component="span" sx={{color: "#2563eb", fontWeight: 700}}>
                    {label}:
                </Box>{" "}
                <Box component="span" sx={{fontWeight: 600}}>
                    {value || "Chưa cập nhật"}
                </Box>
            </Typography>
        </Box>
    );
}

function AdmissionReservationDetailDrawer({
    open,
    row,
    onClose,
    onApprove,
    onReject,
    onConfirmPayment,
    onRejectPayment,
    onPreviewPaymentProof,
    isSubmitting,
    fullScreen,
}) {
    const isPending = row?.status === RESERVATION_STATUS.PENDING;
    const isPaymentPending = row?.status === RESERVATION_STATUS.PAYMENT_PENDING;
    const status = statusMeta(row?.status);
    const readonlyDocs = React.useMemo(
        () => (row ? reservationToReadonlyDocs(row) : []),
        [row],
    );
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            fullScreen={fullScreen}
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: fullScreen ? 0 : 3,
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
                <Box>
                    <Typography sx={{fontSize: 20, fontWeight: 700, color: "#0f172a"}}>
                        Chi tiết hồ sơ nhập học
                        {row?.status === RESERVATION_STATUS.CONFIRMED && row?.confirmCode !== "—"
                            ? ` — ${row.confirmCode}`
                            : row?.studentName && row.studentName !== "—"
                              ? ` — ${row.studentName}`
                              : ""}
                    </Typography>
                    <Typography sx={{fontSize: 13, color: "#475569", mt: 0.4}}>
                        Nộp ngày: {formatDateOnly(row?.submittedAt)}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                        label={status.label}
                        size="small"
                        sx={{bgcolor: status.bg, color: status.color, border: `1px solid ${status.border}`, fontWeight: 700, borderRadius: 999}}
                    />
                    <IconButton onClick={onClose}>
                        <CloseRoundedIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{bgcolor: "#e8f4fc", borderColor: "#b8d8f4", p: 3}}>
                <Stack spacing={2.5}>
                    {row?.status === RESERVATION_STATUS.REJECTED && row?.rejectReason ? (
                        <RejectReasonAlert
                            title="Lý do từ chối hồ sơ"
                            reason={row.rejectReason}
                            variant="profile"
                        />
                    ) : null}
                    {row?.status === RESERVATION_STATUS.PAYMENT_REJECTED && row?.rejectReason ? (
                        <RejectReasonAlert
                            title="Lý do từ chối thanh toán"
                            reason={row.rejectReason}
                            variant="payment"
                        />
                    ) : null}
                    <Paper elevation={0} sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "rgba(255,255,255,0.65)"}}>
                        <Typography sx={{fontWeight: 700, color: "#1e3a8a", mb: 1.5}}>
                            Thông tin học sinh
                        </Typography>
                        <Stack spacing={0}>
                            <DetailInfoRow label="Học sinh" value={row?.studentName} />
                            <DetailInfoRow label="Giới tính" value={formatGender(row?.gender)} />
                            <DetailInfoRow
                                label="Ngày sinh"
                                value={row?.dateOfBirth !== "—" ? row?.dateOfBirth : undefined}
                            />
                            <DetailInfoRow label="CCCD học sinh" value={row?.studentCode !== "—" ? row?.studentCode : undefined} />
                            <DetailInfoRow label="Trường đang học" value={row?.currentSchool !== "—" ? row?.currentSchool : undefined} />
                        </Stack>
                    </Paper>

                    <Paper elevation={0} sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "rgba(255,255,255,0.65)"}}>
                        <Typography sx={{fontWeight: 700, color: "#1e3a8a", mb: 1.5}}>
                            Thông tin phụ huynh
                        </Typography>
                        <Stack spacing={0}>
                            <DetailInfoRow label="Phụ huynh" value={row?.parentName} />
                            <DetailInfoRow label="CCCD phụ huynh" value={row?.identityCard} />
                            <DetailInfoRow label="Số điện thoại" value={row?.phone} />
                            <DetailInfoRow label="Email" value={row?.parentEmail} />
                            <DetailInfoRow label="Địa chỉ" value={row?.address} />
                        </Stack>
                    </Paper>

                    <Paper elevation={0} sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "rgba(255,255,255,0.65)"}}>
                        <Typography sx={{fontWeight: 700, color: "#1e3a8a", mb: 1.5}}>
                            Thông tin hồ sơ tuyển sinh
                        </Typography>
                        <Stack spacing={0}>
                            <DetailInfoRow label="Chương trình" value={row?.programName !== "—" ? row?.programName : undefined} />
                            <DetailInfoRow label="Phương thức xét tuyển" value={row?.methodName !== "—" ? row?.methodName : undefined} />
                        </Stack>
                    </Paper>

                    <Paper elevation={0} sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "rgba(255,255,255,0.65)"}}>
                        <Typography sx={{fontWeight: 700, color: "#1e3a8a", mb: 1.5}}>
                            Minh chứng đính kèm
                        </Typography>
                        <AdmissionDocumentsSection
                            docs={readonlyDocs}
                            docsLoading={false}
                            docsError=""
                            cloudinaryReady
                            uploadingSlots={new Set()}
                            disabled
                            readOnly
                            onPickFile={() => {}}
                            onRemoveSlot={() => {}}
                            emptyMessage="Chưa có ảnh minh chứng trong hồ sơ này."
                        />
                    </Paper>

                    {isPaymentPending || row?.paymentProofUrl ? (
                        <Paper elevation={0} sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "rgba(255,255,255,0.65)"}}>
                            <Typography sx={{fontWeight: 700, color: "#1e3a8a", mb: 1.5}}>
                                Minh chứng thanh toán
                            </Typography>
                            <PaymentProofPreview
                                url={row?.paymentProofUrl}
                                onPreview={row?.paymentProofUrl ? onPreviewPaymentProof : undefined}
                            />
                        </Paper>
                    ) : null}

                    {row?.note ? (
                        <Paper elevation={0} sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "#eef7ff"}}>
                            <Typography sx={{fontWeight: 800, color: "#1e3a8a", mb: 0.8}}>
                                Ghi chú
                            </Typography>
                            <Typography variant="body2" sx={{color: "#334155"}}>
                                {row.note}
                            </Typography>
                        </Paper>
                    ) : null}
                </Stack>
            </DialogContent>
            <DialogActions sx={{p: 2, borderTop: "1px solid #b8d8f4", bgcolor: "#eef7ff", flexWrap: "wrap", gap: 1}}>
                {isPending ? (
                    <>
                        <Button variant="contained" onClick={onApprove} disabled={isSubmitting} sx={{textTransform: "none", borderRadius: 2.5, fontWeight: 800}}>
                            Phê duyệt
                        </Button>
                        <Button variant="outlined" color="error" onClick={onReject} disabled={isSubmitting} sx={{textTransform: "none", borderRadius: 2.5, fontWeight: 800}}>
                            Từ chối
                        </Button>
                    </>
                ) : isPaymentPending ? (
                    <>
                        <Button variant="contained" onClick={onConfirmPayment} disabled={isSubmitting} sx={{textTransform: "none", borderRadius: 2.5, fontWeight: 800}}>
                            Xác nhận hoàn thành
                        </Button>
                        <Button variant="outlined" color="error" onClick={onRejectPayment} disabled={isSubmitting} sx={{textTransform: "none", borderRadius: 2.5, fontWeight: 800}}>
                            Từ chối thanh toán
                        </Button>
                    </>
                ) : null}
            </DialogActions>
        </Dialog>
    );
}

function ImagePreviewModal({ open, images, selectedIndex, onChangeIndex, onClose }) {
    const current = images[selectedIndex];
    return (
        <Backdrop open={open} onClick={onClose} sx={{ zIndex: 1400, bgcolor: "rgba(15, 23, 42, 0.38)", backdropFilter: "blur(6px)" }}>
            <Fade in={open}>
                <Box onClick={(e) => e.stopPropagation()} sx={{display: "flex", justifyContent: "center", alignItems: "center", p: {xs: 2, md: 4}}}>
                    {current ? (
                        <Box
                            component="img"
                            src={current.url}
                            alt={current.key || "preview"}
                            sx={{maxWidth: "92vw", maxHeight: "84vh", objectFit: "contain", display: "block"}}
                        />
                    ) : null}
                </Box>
            </Fade>
        </Backdrop>
    );
}

const AUTO_APPROVE_STATUS_CONFIG = {
    valid:   {label: "Hợp lệ",            color: "#166534", bg: "#f0fdf4", border: "#bbf7d0"},
    invalid: {label: "Không hợp lệ",      color: "#92400e", bg: "#fffbeb", border: "#fde68a"},
    skipped: {label: "Bỏ qua kiểm tra",   color: "#475569", bg: "#f8fafc", border: "#cbd5e1"},
    error:   {label: "Hồ sơ lỗi",         color: "#991b1b", bg: "#fef2f2", border: "#fecaca"},
};

function SummaryStatCard({label, value, color, bg, border, icon}) {
    return (
        <Paper elevation={0} sx={{flex: "1 1 0", minWidth: 110, borderRadius: 2.5, overflow: "hidden", border: `1px solid ${border}`}}>
            <Box sx={{height: 3, bgcolor: color}} />
            <Stack spacing={0.5} alignItems="center" sx={{p: 2, bgcolor: bg}}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                    {icon && <Box sx={{color, display: "flex"}}>{React.cloneElement(icon, {sx: {fontSize: 20}})}</Box>}
                    <Typography sx={{fontSize: 30, fontWeight: 800, color, lineHeight: 1}}>{value}</Typography>
                </Stack>
                <Typography sx={{fontSize: 12, color, opacity: 0.72, fontWeight: 600}}>{label}</Typography>
            </Stack>
        </Paper>
    );
}

const DOC_STATUS_CONFIG = {
    valid:   {label: "Hợp lệ",      accentColor: "#16a34a", chipBg: "#dcfce7", chipColor: "#166534", reasonColor: "#b45309"},
    invalid: {label: "Không hợp lệ", accentColor: "#d97706", chipBg: "#fef3c7", chipColor: "#92400e", reasonColor: "#b45309"},
    skipped: {label: "Bỏ qua kiểm tra",       accentColor: "#64748b", chipBg: "#f1f5f9", chipColor: "#475569", reasonColor: "#64748b"},
};

function DocumentResultCard({doc}) {
    const [open, setOpen] = React.useState(false);
    const [imgPreview, setImgPreview] = React.useState(false);
    const [proofPreview, setProofPreview] = React.useState(false);
    const cfg = DOC_STATUS_CONFIG[doc.status] ?? DOC_STATUS_CONFIG.invalid;
    const details = Array.isArray(doc.details) ? doc.details : [];
    return (
        <Box sx={{borderRadius: 2, border: "1px solid #e2e8f0", overflow: "hidden", bgcolor: "#fff"}}>
            <Box
                onClick={() => details.length > 0 && setOpen((v) => !v)}
                sx={{
                    display: "flex", alignItems: "stretch",
                    cursor: details.length > 0 ? "pointer" : "default",
                    userSelect: "none",
                    "&:hover": details.length > 0 ? {bgcolor: "#f8fafc"} : {},
                    transition: "background-color 0.15s",
                }}
            >
                <Box sx={{width: 3, flexShrink: 0, bgcolor: cfg.accentColor}} />
                <Box sx={{flex: 1, minWidth: 0, px: 2, py: 1.25}}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{mb: doc.reason && doc.status !== "skipped" ? 0.4 : 0}}>
                        <Typography sx={{fontWeight: 700, fontSize: 13, color: "#1e293b"}}>{doc.label || doc.key}</Typography>
                        <Chip
                            label={cfg.label}
                            size="small"
                            sx={{bgcolor: cfg.chipBg, color: cfg.chipColor, fontWeight: 700, borderRadius: 999, height: 20, "& .MuiChip-label": {px: 1}, fontSize: 11}}
                        />
                    </Stack>
                    {doc.reason && doc.status !== "skipped" && (
                        <Typography sx={{color: cfg.reasonColor, fontSize: 12, lineHeight: 1.4}}>{doc.reason}</Typography>
                    )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{pr: 1.5, py: 1, flexShrink: 0}} onClick={(e) => e.stopPropagation()}>
                    {doc.imageProof && (
                        <Stack alignItems="center" spacing={0.3} sx={{cursor: "pointer"}} onClick={() => setProofPreview(true)}>
                            <Box
                                component="img"
                                src={doc.imageProof}
                                alt={`Mẫu - ${doc.label || doc.key}`}
                                sx={{width: 36, height: 36, objectFit: "cover", borderRadius: 1, border: "2px solid #818cf8", "&:hover": {opacity: 0.82, borderColor: "#6366f1"}}}
                            />
                            <Typography sx={{fontSize: 9.5, color: "#6366f1", fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap"}}>Ảnh mẫu</Typography>
                        </Stack>
                    )}
                    {doc.submissionImage && (
                        <Stack alignItems="center" spacing={0.3} sx={{cursor: "pointer"}} onClick={() => setImgPreview(true)}>
                            <Box
                                component="img"
                                src={doc.submissionImage}
                                alt={doc.label || doc.key}
                                sx={{width: 36, height: 36, objectFit: "cover", borderRadius: 1, border: "2px solid #94a3b8", "&:hover": {opacity: 0.82, borderColor: "#64748b"}}}
                            />
                            <Typography sx={{fontSize: 9.5, color: "#64748b", fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap"}}>Minh chứng</Typography>
                        </Stack>
                    )}
                    {details.length > 0 && (
                        <Box
                            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                            sx={{color: "#94a3b8", cursor: "pointer", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "flex"}}
                        >
                            <ExpandMoreRoundedIcon sx={{fontSize: 20}} />
                        </Box>
                    )}
                </Stack>
            </Box>
            {open && details.length > 0 && (
                <Box sx={{px: 2, py: 1.5, bgcolor: "#f8fafc", borderTop: "1px solid #f1f5f9"}}>
                    <Stack spacing={0.8}>
                        {details.map((d, i) => (
                            <Stack key={i} direction="row" spacing={1} alignItems="flex-start"
                                sx={{p: 1, borderRadius: 1.5, bgcolor: d.passed ? "rgba(220,252,231,0.5)" : "rgba(254,226,226,0.45)"}}
                            >
                                <Box sx={{mt: 0.1, flexShrink: 0}}>
                                    {d.passed
                                        ? <CheckCircleRoundedIcon sx={{fontSize: 15, color: "#16a34a"}} />
                                        : <CancelRoundedIcon sx={{fontSize: 15, color: "#dc2626"}} />
                                    }
                                </Box>
                                <Box sx={{minWidth: 0}}>
                                    <Typography sx={{fontSize: 12.5, color: "#1e293b", fontWeight: 600, lineHeight: 1.4}}>{d.criteria}</Typography>
                                    {d.note && <Typography sx={{fontSize: 12, color: "#64748b", mt: 0.2, lineHeight: 1.4}}>{d.note}</Typography>}
                                </Box>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            )}
            {doc.submissionImage && (
                <Backdrop open={imgPreview} onClick={() => setImgPreview(false)} sx={{zIndex: 1500, bgcolor: "rgba(15,23,42,0.7)", backdropFilter: "blur(6px)"}}>
                    <Fade in={imgPreview}>
                        <Box onClick={(e) => e.stopPropagation()} sx={{position: "relative", display: "inline-flex"}}>
                            <Box component="img" src={doc.submissionImage} alt={doc.label || doc.key} sx={{maxWidth: "88vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 2, display: "block"}} />
                            <IconButton onClick={() => setImgPreview(false)} size="small" sx={{position: "absolute", top: -12, right: -12, bgcolor: "white", "&:hover": {bgcolor: "#f1f5f9"}, boxShadow: 2}}>
                                <CloseRoundedIcon sx={{fontSize: 18}} />
                            </IconButton>
                        </Box>
                    </Fade>
                </Backdrop>
            )}
            {doc.imageProof && (
                <Backdrop open={proofPreview} onClick={() => setProofPreview(false)} sx={{zIndex: 1500, bgcolor: "rgba(15,23,42,0.7)", backdropFilter: "blur(6px)"}}>
                    <Fade in={proofPreview}>
                        <Box onClick={(e) => e.stopPropagation()} sx={{position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1}}>
                            <Typography sx={{color: "#fff", fontWeight: 600, fontSize: 13}}>Ảnh mẫu — {doc.label || doc.key}</Typography>
                            <Box component="img" src={doc.imageProof} alt={`Mẫu - ${doc.label || doc.key}`} sx={{maxWidth: "88vw", maxHeight: "75vh", objectFit: "contain", borderRadius: 2, display: "block"}} />
                            <IconButton onClick={() => setProofPreview(false)} size="small" sx={{position: "absolute", top: -12, right: -12, bgcolor: "white", "&:hover": {bgcolor: "#f1f5f9"}, boxShadow: 2}}>
                                <CloseRoundedIcon sx={{fontSize: 18}} />
                            </IconButton>
                        </Box>
                    </Fade>
                </Backdrop>
            )}
        </Box>
    );
}

function FormResultCard({form}) {
    const [open, setOpen] = React.useState(false);
    const s = AUTO_APPROVE_STATUS_CONFIG[form.overallStatus] ?? AUTO_APPROVE_STATUS_CONFIG.error;
    const docs = Array.isArray(form.documents) ? form.documents : [];
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2, border: `1px solid ${s.border}`, overflow: "hidden",
                transition: "box-shadow 0.18s",
                "&:hover": docs.length > 0 ? {boxShadow: `0 2px 10px -2px ${s.border}`} : {},
            }}
        >
            <Box
                onClick={() => docs.length > 0 && setOpen((v) => !v)}
                sx={{display: "flex", alignItems: "stretch", cursor: docs.length > 0 ? "pointer" : "default", userSelect: "none"}}
            >
                <Box sx={{width: 4, flexShrink: 0, bgcolor: s.color}} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{flex: 1, px: 2, py: 1.5, bgcolor: s.bg}}>
                    <Stack spacing={0.3}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                            <Typography sx={{fontWeight: 700, color: "#1e293b", fontSize: 14}}>
                                Hồ sơ #{form.formId}
                            </Typography>
                            <Chip
                                label={s.label}
                                size="small"
                                sx={{bgcolor: "rgba(255,255,255,0.85)", color: s.color, border: `1px solid ${s.border}`, fontWeight: 700, borderRadius: 999, height: 22, "& .MuiChip-label": {px: 1.25}, fontSize: 12}}
                            />
                        </Stack>
                        {form.errorMessage && (
                            <Typography sx={{fontSize: 12, color: s.color, opacity: 0.85, lineHeight: 1.4}}>
                                {form.errorMessage}
                            </Typography>
                        )}
                    </Stack>
                    {docs.length > 0 && (
                        <Box sx={{color: "#94a3b8", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.22s", display: "flex", flexShrink: 0, ml: 1}}>
                            <ExpandMoreRoundedIcon sx={{fontSize: 20}} />
                        </Box>
                    )}
                </Stack>
            </Box>
            {open && docs.length > 0 && (
                <Box sx={{p: 2, bgcolor: "#fafafa", borderTop: `1px solid ${s.border}`}}>
                    <Stack spacing={1}>
                        {docs.map((doc, i) => (
                            <DocumentResultCard key={`${form.formId}-${doc.key ?? i}`} doc={doc} />
                        ))}
                    </Stack>
                </Box>
            )}
        </Paper>
    );
}

function AutoApproveDialog({open, onClose, onDone, pendingCount = 0}) {
    const [step, setStep] = React.useState("select");
    const [campaigns, setCampaigns] = React.useState([]);
    const [campaignsLoading, setCampaignsLoading] = React.useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = React.useState("");
    const [selectedCampaignName, setSelectedCampaignName] = React.useState("");
    const [processing, setProcessing] = React.useState(false);
    const [confirming, setConfirming] = React.useState(false);
    const [result, setResult] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState("valid");

    // Fetch campaigns khi dialog mở
    React.useEffect(() => {
        if (!open) return;
        setStep("select");
        setResult(null);
        setSelectedCampaignId("");
        setSelectedCampaignName("");
        setActiveTab("valid");
        setCampaignsLoading(true);
        getAdmissionCampaigns()
            .then((data) => {
                setCampaigns(data);
                if (data.length === 1) {
                    setSelectedCampaignId(String(data[0].id));
                    setSelectedCampaignName(data[0].name ?? "");
                }
            })
            .catch(() => enqueueSnackbar("Không thể lấy danh sách chiến dịch tuyển sinh.", {variant: "error"}))
            .finally(() => setCampaignsLoading(false));
    }, [open]);

    const handleRun = async () => {
        if (!selectedCampaignId) return;
        setProcessing(true);
        try {
            const data = await autoApproveAdmissionReservations(selectedCampaignId);
            setResult(data);
            setStep("result");
            onDone();
        } catch (err) {
            enqueueSnackbar(getApiErrorMessage(err, "Không thể tự động duyệt hồ sơ."), {variant: "error"});
        } finally {
            setProcessing(false);
        }
    };

    const buildRejectReason = (form) => {
        if (form.overallStatus === "error") return form.errorMessage || "Hồ sơ lỗi.";
        const invalidDocs = (Array.isArray(form.documents) ? form.documents : [])
            .filter((d) => d.status === "invalid");
        return invalidDocs
            .map((doc) => {
                const failedNotes = (Array.isArray(doc.details) ? doc.details : [])
                    .filter((d) => d.passed === false)
                    .map((d) => d.note)
                    .filter(Boolean)
                    .join("; ");
                return failedNotes
                    ? `${doc.label || doc.key} không hợp lệ: ${failedNotes}`
                    : `${doc.label || doc.key} không hợp lệ`;
            })
            .join("\n");
    };

    const handleConfirm = async () => {
        const forms = Array.isArray(result?.forms) ? result.forms : [];
        const infos = forms
            .filter((f) => f.overallStatus === "valid" || f.overallStatus === "invalid" || f.overallStatus === "error")
            .map((f) => {
                const entry = {formId: f.formId, action: f.overallStatus === "valid" ? "APPROVE" : "REJECT"};
                if (entry.action === "REJECT") entry.rejectReason = buildRejectReason(f);
                return entry;
            });
        if (infos.length === 0) { onClose(); return; }
        setConfirming(true);
        try {
            await batchConfirmAdmissionReservationForms(infos);
            enqueueSnackbar("Xác nhận kết quả xét duyệt thành công.", {variant: "success"});
            onDone();
            onClose();
        } catch (err) {
            enqueueSnackbar(getApiErrorMessage(err, "Không thể xác nhận kết quả xét duyệt."), {variant: "error"});
        } finally {
            setConfirming(false);
        }
    };

    const totalForms = result?.totalForms ?? 0;
    const summary = result?.summary ?? {valid: 0, invalid: 0, skipped: 0, error: 0};
    const forms = Array.isArray(result?.forms) ? result.forms : [];
    const validForms = forms.filter((f) => f.overallStatus === "valid");
    const invalidForms = forms.filter((f) => f.overallStatus === "invalid");
    const skippedForms = forms.filter((f) => f.overallStatus === "skipped");
    const errorForms = forms.filter((f) => f.overallStatus === "error");

    const TAB_CONFIG = [
        {key: "valid",   label: "Hợp lệ",            count: validForms.length,   activeColor: "#166534"},
        {key: "invalid", label: "Không hợp lệ",      count: invalidForms.length, activeColor: "#d97706"},
        {key: "skipped", label: "Bỏ qua kiểm tra",   count: skippedForms.length, activeColor: "#475569"},
        {key: "error",   label: "Hồ sơ lỗi",         count: errorForms.length,   activeColor: "#dc2626"},
    ];

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : onClose}
            fullWidth
            maxWidth={step === "result" ? "md" : "sm"}
            PaperProps={{sx: {borderRadius: 3, overflow: "hidden"}}}
        >
            <DialogTitle sx={{display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2.25, bgcolor: "#d9ecff", borderBottom: "1px solid #b8d8f4"}}>
                <Box>
                    <Typography sx={{fontSize: 18, fontWeight: 700, color: "#0f172a"}}>
                        {step === "result" ? "Kết quả xét duyệt tự động" : "Duyệt hồ sơ tự động"}
                    </Typography>
                    {step === "result" && selectedCampaignName && (
                        <Typography sx={{fontSize: 13, color: "#475569", mt: 0.3}}>{selectedCampaignName}</Typography>
                    )}
                </Box>
                <IconButton onClick={onClose} disabled={processing} size="small">
                    <CloseRoundedIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{p: 0, bgcolor: "#f8fafc"}}>
                {step === "select" ? (
                    <Stack spacing={2.5} sx={{p: 3}}>
                        <Typography variant="body2" sx={{color: "#475569"}}>
                            Chọn chiến dịch tuyển sinh để hệ thống tự động xét duyệt tất cả hồ sơ đang chờ xét.
                        </Typography>
                        {campaignsLoading ? (
                            <Box sx={{display: "flex", justifyContent: "center", py: 3}}>
                                <CircularProgress size={28} />
                            </Box>
                        ) : (
                            <TextField
                                select
                                fullWidth
                                value={selectedCampaignId}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    setSelectedCampaignId(id);
                                    setSelectedCampaignName(campaigns.find((c) => String(c.id) === id)?.name ?? "");
                                }}
                                size="small"
                                sx={{"& .MuiOutlinedInput-root": {borderRadius: 2, bgcolor: "#fff"}}}
                            >
                                {campaigns.length === 0 ? (
                                    <MenuItem value="" disabled>Không có chiến dịch đang hoạt động</MenuItem>
                                ) : campaigns.map((c) => (
                                    <MenuItem key={c.id} value={String(c.id)}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <span>{c.name}</span>
                                            {c.isActive && (
                                                <Chip label="Đang hoạt động" size="small" sx={{bgcolor: "#dcfce7", color: "#166534", fontWeight: 700, borderRadius: 999, height: 20, "& .MuiChip-label": {px: 1}, fontSize: 11}} />
                                            )}
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    </Stack>
                ) : (
                    <Box>
                        {/* Summary strip */}
                        <Box sx={{px: 3, pt: 2.5, pb: 2, bgcolor: "#fff", borderBottom: "1px solid #e2e8f0"}}>
                            <Stack direction="row" spacing={1.5}>
                                <SummaryStatCard label="Tổng hồ sơ" value={totalForms} color="#1e3a8a" bg="#eff6ff" border="#bfdbfe" />
                                <SummaryStatCard label="Hợp lệ" value={summary.valid} color="#166534" bg="#f0fdf4" border="#bbf7d0" icon={<CheckCircleRoundedIcon />} />
                                <SummaryStatCard label="Không hợp lệ" value={summary.invalid} color="#92400e" bg="#fffbeb" border="#fde68a" icon={<WarningAmberRoundedIcon />} />
                                <SummaryStatCard label="Bỏ qua kiểm tra" value={summary.skipped ?? 0} color="#475569" bg="#f8fafc" border="#cbd5e1" icon={<RemoveCircleOutlinedIcon />} />
                                <SummaryStatCard label="Hồ sơ lỗi" value={summary.error} color="#991b1b" bg="#fef2f2" border="#fecaca" icon={<CancelRoundedIcon />} />
                            </Stack>
                        </Box>

                        {/* Tabs */}
                        {forms.length === 0 ? (
                            <Stack alignItems="center" spacing={1} sx={{py: 4}}>
                                <CheckCircleRoundedIcon sx={{fontSize: 36, color: "#86efac"}} />
                                <Typography sx={{color: "#64748b", fontWeight: 500}}>Không có hồ sơ nào được xử lý.</Typography>
                            </Stack>
                        ) : (
                            <Box>
                                <Box sx={{borderBottom: "1px solid #e2e8f0", bgcolor: "#fff", px: 3}}>
                                    <Tabs
                                        value={activeTab}
                                        onChange={(_, v) => setActiveTab(v)}
                                        sx={{
                                            "& .MuiTab-root": {textTransform: "none", fontWeight: 700, fontSize: 13.5, minHeight: 44, px: 2},
                                            "& .MuiTabs-indicator": {height: 3, borderRadius: "3px 3px 0 0"},
                                        }}
                                    >
                                        {TAB_CONFIG.map(({key, label, count, activeColor}) => (
                                            <Tab
                                                key={key}
                                                value={key}
                                                label={
                                                    <Stack direction="row" spacing={0.75} alignItems="center">
                                                        <span>{label}</span>
                                                        <Box sx={{
                                                            minWidth: 20, height: 20, borderRadius: 999, px: 0.75,
                                                            bgcolor: activeTab === key ? activeColor : "#e2e8f0",
                                                            color: activeTab === key ? "#fff" : "#64748b",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontSize: 11, fontWeight: 800, lineHeight: 1, transition: "background-color 0.2s",
                                                        }}>
                                                            {count}
                                                        </Box>
                                                    </Stack>
                                                }
                                            />
                                        ))}
                                    </Tabs>
                                </Box>
                                <Box sx={{px: 3, py: 2.5}}>
                                    {activeTab === "valid" && (
                                        validForms.length === 0
                                            ? <Typography variant="body2" sx={{color: "#64748b", textAlign: "center", py: 2}}>Không có hồ sơ hợp lệ.</Typography>
                                            : <Stack spacing={1}>{validForms.map((f) => <FormResultCard key={f.formId} form={f} />)}</Stack>
                                    )}
                                    {activeTab === "invalid" && (
                                        invalidForms.length === 0
                                            ? <Typography variant="body2" sx={{color: "#64748b", textAlign: "center", py: 2}}>Không có hồ sơ không hợp lệ.</Typography>
                                            : <Stack spacing={1}>{invalidForms.map((f) => <FormResultCard key={f.formId} form={f} />)}</Stack>
                                    )}
                                    {activeTab === "skipped" && (
                                        skippedForms.length === 0
                                            ? <Typography variant="body2" sx={{color: "#64748b", textAlign: "center", py: 2}}>Không có hồ sơ bỏ qua kiểm tra.</Typography>
                                            : (
                                                <Stack spacing={1.5}>
                                                    <Alert severity="warning" sx={{borderRadius: 2, fontSize: "0.875rem"}}>
                                                        Các hồ sơ bỏ qua kiểm tra cần được <strong>duyệt thủ công</strong>. Vui lòng liên hệ quản trị viên hệ thống để được hỗ trợ thêm.
                                                    </Alert>
                                                    <Stack spacing={1}>{skippedForms.map((f) => <FormResultCard key={f.formId} form={f} />)}</Stack>
                                                </Stack>
                                            )
                                    )}
                                    {activeTab === "error" && (
                                        errorForms.length === 0
                                            ? <Typography variant="body2" sx={{color: "#64748b", textAlign: "center", py: 2}}>Không có hồ sơ lỗi.</Typography>
                                            : <Stack spacing={1}>{errorForms.map((f) => <FormResultCard key={f.formId} form={f} />)}</Stack>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2, borderTop: "1px solid #e2e8f0", bgcolor: "#fff", gap: 1}}>
                {step === "select" ? (
                    <>
                        <Button onClick={onClose} disabled={processing} variant="outlined" sx={{textTransform: "none", borderRadius: 2, fontWeight: 700}}>
                            Hủy
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleRun}
                            disabled={!selectedCampaignId || processing || campaignsLoading}
                            startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <DoneAllRoundedIcon />}
                            sx={{textTransform: "none", borderRadius: 2, fontWeight: 700}}
                        >
                            {processing ? "Đang xử lý..." : "Duyệt tất cả"}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={onClose} disabled={confirming} variant="outlined" sx={{textTransform: "none", borderRadius: 2, fontWeight: 700}}>
                            Hủy
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleConfirm}
                            disabled={confirming}
                            startIcon={confirming ? <CircularProgress size={16} color="inherit" /> : <DoneAllRoundedIcon />}
                            sx={{textTransform: "none", borderRadius: 2, fontWeight: 700, px: 3}}
                        >
                            {confirming ? "Đang xác nhận..." : "Xác nhận"}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default function SchoolCampusAdmissionReservations() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const {loading: schoolCtxLoading} = useSchool();
    const [campaigns, setCampaigns] = React.useState([]);
    const [allForms, setAllForms] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("ALL");
    const [campaignFilter, setCampaignFilter] = React.useState("ALL");
    const [pendingCount, setPendingCount] = React.useState(0);
    const [sortBy, setSortBy] = React.useState("NEWEST");
    const [expandedCampaignIds, setExpandedCampaignIds] = React.useState(() => new Set());
    const [selectedReservation, setSelectedReservation] = React.useState(null);
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);
    const [previewImages, setPreviewImages] = React.useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

    const [confirmState, setConfirmState] = React.useState({open: false, form: null});
    const [rejectState, setRejectState] = React.useState({open: false, form: null, reason: "", touched: false});
    const [paymentConfirmState, setPaymentConfirmState] = React.useState({open: false, form: null});
    const [paymentRejectState, setPaymentRejectState] = React.useState({open: false, form: null, reason: "", touched: false});
    const [submittingId, setSubmittingId] = React.useState(null);
    const [autoApproveOpen, setAutoApproveOpen] = React.useState(false);
    const [exportingCampaignId, setExportingCampaignId] = React.useState(null);
    const [exportExcelConfirm, setExportExcelConfirm] = React.useState({
        open: false,
        campaignId: null,
        campaignName: "",
    });

    const exportExcelStatusLabels = React.useMemo(
        () => ADMISSION_FORM_EXPORT_STATUSES.map((status) => getReservationStatusLabel(status)),
        [],
    );

    const downloadBlobResponse = (response, fallbackName) => {
        const fileBlob = response?.data;
        if (!fileBlob) {
            throw new Error("EMPTY_BLOB");
        }
        const fileName = resolveBlobFileName(response, fallbackName);
        triggerBlobDownload(fileBlob, fileName);
    };

    const handleExportCampaignExcel = async (campaignId, campaignName) => {
        setExportingCampaignId(Number(campaignId));
        try {
            const response = await exportAdmissionForms({
                campaignId,
                statuses: ADMISSION_FORM_EXPORT_STATUSES,
            });
            const date = new Date().toISOString().slice(0, 10);
            const slug = String(campaignName || "chien-dich")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 48) || "chien-dich";
            downloadBlobResponse(response, `ho-so-nhap-hoc-${slug}-${date}.xlsx`);
            enqueueSnackbar("Xuất file Excel thành công.", {variant: "success"});
        } catch (err) {
            enqueueSnackbar(getApiErrorMessage(err, "Không thể xuất file Excel."), {variant: "error"});
        } finally {
            setExportingCampaignId(null);
        }
    };

    const handleExportExcelConfirm = async () => {
        const {campaignId, campaignName} = exportExcelConfirm;
        if (!campaignId) return;
        await handleExportCampaignExcel(campaignId, campaignName);
        setExportExcelConfirm({open: false, campaignId: null, campaignName: ""});
    };

    const filteredForms = React.useMemo(
        () => filterAndSortForms(allForms, {search, statusFilter, sortBy}),
        [allForms, search, statusFilter, sortBy],
    );

    const visibleCampaignGroups = React.useMemo(() => {
        const groups = buildCampaignGroups(campaigns, filteredForms);
        if (campaignFilter === "ALL") return groups;
        return groups.filter((g) => String(g.id) === campaignFilter);
    }, [campaigns, filteredForms, campaignFilter]);

    const selectedCampaignLabel = React.useMemo(() => {
        if (campaignFilter === "ALL") return "";
        const found = campaigns.find((c) => String(c.id) === campaignFilter);
        return found?.name ?? visibleCampaignGroups[0]?.name ?? "";
    }, [campaignFilter, campaigns, visibleCampaignGroups]);

    const campaignYears = React.useMemo(() => {
        const years = new Set();
        campaigns.forEach((c) => {
            if (c.year != null) years.add(c.year);
        });
        return [...years].sort((a, b) => b - a);
    }, [campaigns]);

    const loadData = React.useCallback(async ({statusOverride} = {}) => {
        const activeStatus = statusOverride ?? statusFilter;
        setLoading(true);
        setError("");
        try {
            const [campaignList, res] = await Promise.all([
                getAdmissionCampaigns(),
                getCampusAdmissionReservationForms({status: activeStatus}),
            ]);
            const mappedCampaigns = (Array.isArray(campaignList) ? campaignList : [])
                .map(mapCampaign)
                .filter((c) => Number.isFinite(c.id) && c.id > 0);
            setCampaigns(mappedCampaigns);

            let mappedForms = Array.isArray(res?.items) ? res.items.map(mapRow) : [];
            if (activeStatus !== "ALL") {
                mappedForms = mappedForms.filter((row) => row.status === activeStatus);
            }
            setAllForms(mappedForms);
            setPendingCount(mappedForms.filter((row) => row.status === RESERVATION_STATUS.PENDING).length);
        } catch (err) {
            setCampaigns([]);
            setAllForms([]);
            setPendingCount(0);
            setError(getApiErrorMessage(err, "Không tải được danh sách hồ sơ nhập học."));
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    const redirectToProcessedStatusView = React.useCallback((nextStatus) => {
        if (!RESERVATION_STATUS_FILTER_VALUES.has(nextStatus)) return;
        setDetailOpen(false);
        setSelectedReservation(null);
        setStatusFilter(nextStatus);
        void loadData({statusOverride: nextStatus});
    }, [loadData]);

    React.useEffect(() => {
        if (schoolCtxLoading) return;
        void loadData();
    }, [schoolCtxLoading, loadData]);

    React.useEffect(() => {
        if (campaignFilter !== "ALL") {
            setExpandedCampaignIds(new Set([campaignFilter]));
            return;
        }
        if (visibleCampaignGroups.length === 1) {
            setExpandedCampaignIds(new Set([String(visibleCampaignGroups[0].id)]));
        }
    }, [campaignFilter, visibleCampaignGroups]);

    const toggleCampaignExpand = (campaignId) => {
        const key = String(campaignId);
        setExpandedCampaignIds((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const openDetail = (row) => {
        setSelectedReservation(row);
        setDetailOpen(true);
    };
    const openImagePreview = (row, index = 0) => {
        const files = flattenAttachments(row);
        if (files.length === 0) return;
        setPreviewImages(files);
        setSelectedImageIndex(Math.max(0, Math.min(index, files.length - 1)));
        setImagePreviewOpen(true);
    };
    const openPaymentProofPreview = (row) => {
        const url = row?.paymentProofUrl;
        if (!url) return;
        setPreviewImages([{key: "Minh chứng thanh toán", url}]);
        setSelectedImageIndex(0);
        setImagePreviewOpen(true);
    };

    const renderFormActions = (row) => (
        <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
            <RowActionButton variant="view" title="Xem chi tiết" onClick={() => openDetail(row)}>
                <VisibilityRoundedIcon />
            </RowActionButton>
            {row.status === RESERVATION_STATUS.PENDING ? (
                <>
                    <RowActionButton
                        variant="success"
                        title="Phê duyệt"
                        disabled={submittingId === row.id}
                        onClick={() => setConfirmState({open: true, form: row})}
                    >
                        <CheckCircleRoundedIcon />
                    </RowActionButton>
                    <RowActionButton
                        variant="danger"
                        title="Từ chối hồ sơ"
                        disabled={submittingId === row.id}
                        onClick={() => setRejectState({open: true, form: row, reason: "", touched: false})}
                    >
                        <CancelRoundedIcon />
                    </RowActionButton>
                </>
            ) : row.status === RESERVATION_STATUS.PAYMENT_PENDING ? (
                <>
                    <RowActionButton
                        variant="success"
                        title="Xác nhận hoàn thành"
                        disabled={submittingId === row.id}
                        onClick={() => setPaymentConfirmState({open: true, form: row})}
                    >
                        <CheckCircleRoundedIcon />
                    </RowActionButton>
                    <RowActionButton
                        variant="danger"
                        title="Từ chối thanh toán"
                        disabled={submittingId === row.id}
                        onClick={() => setPaymentRejectState({open: true, form: row, reason: "", touched: false})}
                    >
                        <CancelRoundedIcon />
                    </RowActionButton>
                </>
            ) : null}
        </Stack>
    );

    const handleApprove = async () => {
        const form = confirmState.form;
        if (!form) return;
        const checkedDocuments = pickCheckedDocumentsFromReservation(form);
        setSubmittingId(form.id);
        try {
            await processAdmissionReservationForm({
                formId: form.id,
                action: "APPROVE",
                checkedDocuments,
            });
            enqueueSnackbar("Phê duyệt thành công", {variant: "success"});
            setConfirmState({open: false, form: null});
            redirectToProcessedStatusView(RESERVATION_STATUS.APPROVAL);
        } catch (err) {
            enqueueSnackbar(getApiErrorMessage(err, "Không thể phê duyệt hồ sơ."), {variant: "error"});
        } finally {
            setSubmittingId(null);
        }
    };

    const handleRejectSubmit = async () => {
        const form = rejectState.form;
        const reason = String(rejectState.reason || "").trim();
        if (!form) return;
        if (!reason) {
            setRejectState((prev) => ({...prev, touched: true}));
            return;
        }
        const checkedDocuments = pickCheckedDocumentsFromReservation(form);
        setSubmittingId(form.id);
        try {
            await processAdmissionReservationForm({
                formId: form.id,
                action: "REJECT",
                rejectReason: reason,
                checkedDocuments,
            });
            enqueueSnackbar("Từ chối thành công", {variant: "success"});
            setRejectState({open: false, form: null, reason: "", touched: false});
            redirectToProcessedStatusView(RESERVATION_STATUS.REJECTED);
        } catch (err) {
            enqueueSnackbar(getApiErrorMessage(err, "Không thể từ chối hồ sơ."), {variant: "error"});
        } finally {
            setSubmittingId(null);
        }
    };

    const handlePaymentConfirm = async () => {
        const form = paymentConfirmState.form;
        if (!form) return;
        setSubmittingId(form.id);
        try {
            await confirmAdmissionReservationPayment({
                formId: form.id,
                action: "CONFIRM",
            });
            enqueueSnackbar("Xác nhận hoàn thành thành công", {variant: "success"});
            setPaymentConfirmState({open: false, form: null});
            redirectToProcessedStatusView(RESERVATION_STATUS.DEPOSITED);
        } catch (err) {
            enqueueSnackbar(getApiErrorMessage(err, "Không thể xác nhận thanh toán."), {variant: "error"});
        } finally {
            setSubmittingId(null);
        }
    };

    const handlePaymentRejectSubmit = async () => {
        const form = paymentRejectState.form;
        const reason = String(paymentRejectState.reason || "").trim();
        if (!form) return;
        if (!reason) {
            setPaymentRejectState((prev) => ({...prev, touched: true}));
            return;
        }
        setSubmittingId(form.id);
        try {
            await confirmAdmissionReservationPayment({
                formId: form.id,
                action: "REJECT_PAYMENT",
                rejectReason: reason,
            });
            enqueueSnackbar("Từ chối thanh toán thành công", {variant: "success"});
            setPaymentRejectState({open: false, form: null, reason: "", touched: false});
            redirectToProcessedStatusView(RESERVATION_STATUS.PAYMENT_REJECTED);
        } catch (err) {
            enqueueSnackbar(getApiErrorMessage(err, "Không thể từ chối thanh toán."), {variant: "error"});
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <Box sx={{display: "flex", flexDirection: "column", gap: 3, width: "100%", pb: 4}}>
            <Box sx={{ background: "linear-gradient(135deg, #7AA9EB 0%, #0D64DE 100%)", borderRadius: 3, p: { xs: 2.2, md: 3 }, color: "white", boxShadow: "0 8px 32px rgba(13, 100, 222, 0.25)" }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: {xs: "column", sm: "row"},
                        alignItems: {xs: "stretch", sm: "center"},
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box sx={{width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(255,255,255,0.22)", color: "white", display: "flex", alignItems: "center", justifyContent: "center"}}>
                            <FactCheckOutlinedIcon sx={{fontSize: 22}}/>
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{fontWeight: 700, letterSpacing: "-0.02em", textShadow: "0 1px 2px rgba(0,0,0,0.1)"}}>
                                Xác nhận hồ sơ nhập học
                            </Typography>
                            <Typography variant="body2" sx={{mt: 0.5, opacity: 0.95}}>
                                Quản lý và xử lý hồ sơ từ phụ huynh
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction={{xs: "column", sm: "row"}} spacing={1} alignItems={{xs: "flex-start", sm: "center"}} flexWrap="wrap">
                        <Chip label={`Còn lại: ${pendingCount} hồ sơ`} sx={{ borderRadius: 999, bgcolor: "rgba(255,255,255,0.95)", color: "#0D64DE", fontWeight: 800 }} />
                        {campaignFilter !== "ALL" && selectedCampaignLabel ? (
                            <Chip
                                label={selectedCampaignLabel}
                                onDelete={() => setCampaignFilter("ALL")}
                                sx={{
                                    borderRadius: 999,
                                    maxWidth: {xs: "100%", sm: 280},
                                    bgcolor: "rgba(255,255,255,0.95)",
                                    color: "#0D64DE",
                                    fontWeight: 700,
                                    "& .MuiChip-deleteIcon": {color: "#64748b"},
                                }}
                            />
                        ) : null}
                        {pendingCount > 0 && (
                            <Button
                                variant="contained"
                                startIcon={<DoneAllRoundedIcon />}
                                onClick={() => setAutoApproveOpen(true)}
                                sx={{
                                    textTransform: "none",
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    bgcolor: "rgba(255,255,255,0.18)",
                                    color: "white",
                                    border: "1px solid rgba(255,255,255,0.5)",
                                    backdropFilter: "blur(4px)",
                                    "&:hover": {bgcolor: "rgba(255,255,255,0.3)", borderColor: "white"},
                                    "&.Mui-disabled": {opacity: 0.55, color: "white"},
                                    boxShadow: "none",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Duyệt hồ sơ (tự động)
                            </Button>
                        )}
                    </Stack>
                </Box>
            </Box>

            <Card
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 20px rgba(13, 100, 222, 0.06)",
                    bgcolor: "rgba(248,250,252,0.8)",
                    backdropFilter: "blur(6px)",
                    position: "sticky",
                    top: 8,
                    zIndex: 4,
                }}
            >
                <CardContent sx={{p: 2.5}}>
                    <Stack direction={{xs: "column", md: "row"}} spacing={2} alignItems={{xs: "stretch", md: "center"}} flexWrap="wrap">
                        <TextField
                            placeholder="Tìm theo tên học sinh / phụ huynh..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            sx={{flex: 1, minWidth: 220, maxWidth: {md: 360}, "& .MuiOutlinedInput-root": {borderRadius: 2, bgcolor: "white"}}}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{color: "#64748b"}}/>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            select
                            size="small"
                            label="Chiến dịch"
                            value={campaignFilter}
                            onChange={(e) => setCampaignFilter(e.target.value)}
                            sx={{minWidth: 220, maxWidth: {md: 320}, "& .MuiOutlinedInput-root": {borderRadius: 2, bgcolor: "white"}}}
                        >
                            <MenuItem value="ALL">Tất cả chiến dịch</MenuItem>
                            {campaignYears.flatMap((year) => [
                                <ListSubheader key={`year-${year}`} sx={{fontWeight: 700, color: "#64748b", lineHeight: "32px"}}>
                                    Năm {year}
                                </ListSubheader>,
                                ...campaigns
                                    .filter((c) => c.year === year)
                                    .map((c) => (
                                        <MenuItem key={c.id} value={String(c.id)} sx={{pl: 3}}>
                                            {c.name}
                                        </MenuItem>
                                    )),
                            ])}
                            {campaigns.some((c) => c.year == null)
                                ? [
                                      <ListSubheader key="year-other" sx={{fontWeight: 700, color: "#64748b", lineHeight: "32px"}}>
                                          Khác
                                      </ListSubheader>,
                                      ...campaigns
                                          .filter((c) => c.year == null)
                                          .map((c) => (
                                              <MenuItem key={c.id} value={String(c.id)} sx={{pl: 3}}>
                                                  {c.name}
                                              </MenuItem>
                                          )),
                                  ]
                                : null}
                        </TextField>
                        <TextField
                            select
                            size="small"
                            label="Trạng thái hồ sơ"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{minWidth: 180, "& .MuiOutlinedInput-root": {borderRadius: 2, bgcolor: "white"}}}
                        >
                            {RESERVATION_STATUS_FILTER_OPTIONS.map((s) => (
                                <MenuItem key={s.value} value={s.value}>
                                    {s.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            size="small"
                            label="Sắp xếp"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            sx={{ minWidth: 150, "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "white" } }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SortRoundedIcon sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }}
                        >
                            <MenuItem value="NEWEST">Mới nhất</MenuItem>
                            <MenuItem value="OLDEST">Cũ nhất</MenuItem>
                        </TextField>
                    </Stack>
                </CardContent>
            </Card>

            {schoolCtxLoading ? (
                <Card elevation={0} sx={{borderRadius: 4, border: "1px solid #e2e8f0"}}><CardContent><Skeleton height={48}/><Skeleton height={38}/><Skeleton height={38}/></CardContent></Card>
            ) : error ? (
                <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void loadData()}>Thử lại</Button>} sx={{borderRadius: 2}}>
                    {error}
                </Alert>
            ) : (
                <>
                    {loading ? (
                        <Card elevation={0} sx={{borderRadius: 3, border: "1px solid #e2e8f0"}}>
                            <CardContent>
                                <Skeleton variant="rounded" height={42} sx={{borderRadius: 2}} />
                                <Skeleton sx={{mt: 1}} />
                                <Skeleton />
                                <Skeleton />
                                <Skeleton />
                            </CardContent>
                        </Card>
                    ) : visibleCampaignGroups.length === 0 ? (
                        <Card elevation={0} sx={{borderRadius: 4, border: "1px dashed #cbd5e1", textAlign: "center"}}>
                            <CardContent>
                                <Typography sx={{fontWeight: 800, color: "#334155"}}>Không có hồ sơ phù hợp</Typography>
                                <Typography variant="body2" sx={{color: "#64748b"}}>Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại.</Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        <TableContainer component={Card} elevation={0} sx={{borderRadius: 3, border: "1px solid #e2e8f0", overflowX: "auto"}}>
                            <Table sx={{minWidth: 980}}>
                                <TableHead>
                                    <TableRow sx={{bgcolor: "#f8fafc"}}>
                                        <TableCell sx={{width: 48, py: 2}} />
                                        <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>Chiến dịch tuyển sinh</TableCell>
                                        <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2, width: 100}}>Năm</TableCell>
                                        <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2, width: 120}}>Số hồ sơ</TableCell>
                                        <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2, width: 160}}>Tình trạng</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {visibleCampaignGroups.map((group) => {
                                        const expanded = expandedCampaignIds.has(String(group.id));
                                        const formCount = group.forms.length;
                                        return (
                                            <React.Fragment key={group.id}>
                                                <TableRow
                                                    hover
                                                    onClick={() => toggleCampaignExpand(group.id)}
                                                    sx={{
                                                        cursor: "pointer",
                                                        bgcolor: expanded ? "rgba(122, 169, 235, 0.08)" : "#fff",
                                                        "&:hover": {bgcolor: "rgba(122, 169, 235, 0.1)"},
                                                    }}
                                                >
                                                    <TableCell sx={{py: 2}}>
                                                        <ExpandMoreRoundedIcon
                                                            sx={{
                                                                fontSize: 22,
                                                                color: "#64748b",
                                                                transform: expanded ? "rotate(180deg)" : "none",
                                                                transition: "transform 0.2s",
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{py: 2, fontWeight: 700, color: "#1e293b"}}>
                                                        {group.name}
                                                    </TableCell>
                                                    <TableCell sx={{py: 2, color: "#475569"}}>
                                                        {group.year ?? "—"}
                                                    </TableCell>
                                                    <TableCell sx={{py: 2}}>
                                                        <Chip
                                                            label={`${formCount} hồ sơ`}
                                                            size="small"
                                                            sx={{
                                                                borderRadius: 999,
                                                                bgcolor: "#eff6ff",
                                                                color: "#1d4ed8",
                                                                fontWeight: 700,
                                                                border: "1px solid #bfdbfe",
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{py: 2}}>
                                                        <Chip
                                                            label={group.isActive ? "Đang hoạt động" : "Không hoạt động"}
                                                            size="small"
                                                            sx={{
                                                                borderRadius: 999,
                                                                bgcolor: group.isActive ? "#dcfce7" : "#f1f5f9",
                                                                color: group.isActive ? "#166534" : "#64748b",
                                                                fontWeight: 700,
                                                                border: `1px solid ${group.isActive ? "#86efac" : "#e2e8f0"}`,
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell colSpan={5} sx={{p: 0, borderBottom: expanded ? undefined : "none"}}>
                                                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                                                            <Box sx={{px: 2, pb: 2, pt: 0.5, bgcolor: "#f8fafc"}}>
                                                                <Stack
                                                                    direction="row"
                                                                    justifyContent="flex-end"
                                                                    sx={{py: 1.25, px: 0.5}}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        disabled={exportingCampaignId === group.id}
                                                                        startIcon={
                                                                            exportingCampaignId === group.id
                                                                                ? <CircularProgress size={14} color="inherit" />
                                                                                : <GridOnRoundedIcon />
                                                                        }
                                                                        onClick={() =>
                                                                            setExportExcelConfirm({
                                                                                open: true,
                                                                                campaignId: group.id,
                                                                                campaignName: group.name,
                                                                            })
                                                                        }
                                                                        sx={{
                                                                            textTransform: "none",
                                                                            borderRadius: 2,
                                                                            fontWeight: 700,
                                                                            bgcolor: "#047857",
                                                                            boxShadow: "none",
                                                                            "&:hover": {bgcolor: "#065f46"},
                                                                        }}
                                                                    >
                                                                        {exportingCampaignId === group.id
                                                                            ? "Đang xuất..."
                                                                            : "Xuất Excel"}
                                                                    </Button>
                                                                </Stack>
                                                                {formCount === 0 ? (
                                                                    <Typography variant="body2" sx={{py: 2, px: 1, color: "#64748b"}}>
                                                                        Chưa có hồ sơ phù hợp trong chiến dịch này.
                                                                    </Typography>
                                                                ) : (
                                                                    <Table size="small" sx={{bgcolor: "#fff", borderRadius: 2, border: "1px solid #e2e8f0"}}>
                                                                        <TableHead>
                                                                            <TableRow sx={{bgcolor: "#f8fafc"}}>
                                                                                <TableCell sx={{fontWeight: 700, color: "#1e293b"}}>Phụ huynh</TableCell>
                                                                                <TableCell sx={{fontWeight: 700, color: "#1e293b"}}>Học sinh</TableCell>
                                                                                <TableCell sx={{fontWeight: 700, color: "#1e293b"}}>SĐT</TableCell>
                                                                                <TableCell sx={{fontWeight: 700, color: "#1e293b"}}>Chương trình</TableCell>
                                                                                <TableCell sx={{fontWeight: 700, color: "#1e293b"}}>Ngày nộp</TableCell>
                                                                                <TableCell sx={{fontWeight: 700, color: "#1e293b"}}>Trạng thái</TableCell>
                                                                                <TableCell align="right" sx={{fontWeight: 700, color: "#1e293b", minWidth: 128}}>Thao tác</TableCell>
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {group.forms.map((row) => (
                                                                                <TableRow key={row.id} hover sx={{"&:hover": {bgcolor: "rgba(122, 169, 235, 0.06)"}}}>
                                                                                    <TableCell sx={{fontWeight: 600, color: "#1e293b"}}>{row.parentName}</TableCell>
                                                                                    <TableCell>{row.studentName}</TableCell>
                                                                                    <TableCell>{row.phone || "—"}</TableCell>
                                                                                    <TableCell>{row.programName || "—"}</TableCell>
                                                                                    <TableCell sx={{whiteSpace: "nowrap"}}>{formatDateOnly(row.submittedAt)}</TableCell>
                                                                                    <TableCell><StatusChip status={row.status} /></TableCell>
                                                                                    <TableCell align="right">{renderFormActions(row)}</TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                )}
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}

            <ConfirmDialog
                open={exportExcelConfirm.open}
                title="Xác nhận xuất Excel"
                description={
                    <>
                        Xuất hồ sơ chiến dịch{" "}
                        <ConfirmHighlight>{exportExcelConfirm.campaignName || "này"}</ConfirmHighlight> với
                        trạng thái <ConfirmHighlight>{exportExcelStatusLabels[0]}</ConfirmHighlight> và{" "}
                        <ConfirmHighlight>{exportExcelStatusLabels[1]}</ConfirmHighlight>.
                    </>
                }
                extraDescription="Bạn có muốn tiếp tục tải xuống?"
                cancelText="Hủy"
                confirmText={exportingCampaignId != null ? "Đang xuất..." : "Tải xuống"}
                loading={exportingCampaignId != null}
                onCancel={() => {
                    if (exportingCampaignId != null) return;
                    setExportExcelConfirm({open: false, campaignId: null, campaignName: ""});
                }}
                onConfirm={() => void handleExportExcelConfirm()}
            />

            <ConfirmDialog
                open={confirmState.open}
                title="Xác nhận phê duyệt"
                description={
                    <>
                        Bạn có chắc chắn muốn <ConfirmHighlight>phê duyệt</ConfirmHighlight> hồ sơ nhập học này?
                    </>
                }
                extraDescription={
                    <>
                        Hồ sơ sẽ chuyển sang trạng thái <ConfirmHighlight>đã duyệt</ConfirmHighlight> và phụ huynh có thể tiếp tục thanh toán.
                    </>
                }
                cancelText="Hủy"
                confirmText={submittingId != null ? "Đang xử lý..." : "Phê duyệt"}
                loading={submittingId != null}
                onCancel={() => setConfirmState({open: false, form: null})}
                onConfirm={handleApprove}
            />

            <ConfirmDialog
                open={rejectState.open}
                title="Xác nhận từ chối hồ sơ"
                description={
                    <>
                        Bạn có chắc chắn muốn <ConfirmHighlight>từ chối hồ sơ</ConfirmHighlight> nhập học này?
                    </>
                }
                extraDescription="Vui lòng nhập lý do từ chối bên dưới."
                cancelText="Hủy"
                confirmText={submittingId != null ? "Đang xử lý..." : "Xác nhận từ chối"}
                confirmColor="error"
                loading={submittingId != null}
                onCancel={() => setRejectState({open: false, form: null, reason: "", touched: false})}
                onConfirm={handleRejectSubmit}
            >
                <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Nhập lý do từ chối..."
                    value={rejectState.reason}
                    onChange={(e) => setRejectState((prev) => ({...prev, reason: e.target.value, touched: true}))}
                    error={rejectState.touched && !String(rejectState.reason || "").trim()}
                    helperText={rejectState.touched && !String(rejectState.reason || "").trim() ? "Vui lòng nhập lý do" : ""}
                    sx={{"& .MuiOutlinedInput-root": {borderRadius: 2, bgcolor: "#fff", fontSize: 15}}}
                />
            </ConfirmDialog>

            <ConfirmDialog
                open={paymentConfirmState.open}
                title="Xác nhận hoàn thành"
                description={
                    <>
                        Bạn có chắc chắn muốn <ConfirmHighlight>xác nhận minh chứng thanh toán</ConfirmHighlight> và hoàn tất đơn này?
                    </>
                }
                extraDescription={
                    <>
                        Đơn sẽ chuyển sang trạng thái <ConfirmHighlight>đã đặt cọc</ConfirmHighlight> sau khi xác nhận.
                    </>
                }
                cancelText="Hủy"
                confirmText={submittingId != null ? "Đang xử lý..." : "Xác nhận hoàn thành"}
                loading={submittingId != null}
                onCancel={() => setPaymentConfirmState({open: false, form: null})}
                onConfirm={handlePaymentConfirm}
            />

            <ConfirmDialog
                open={paymentRejectState.open}
                title="Từ chối thanh toán"
                description={
                    <>
                        Bạn có chắc chắn muốn <ConfirmHighlight>từ chối minh chứng thanh toán</ConfirmHighlight> này?
                    </>
                }
                extraDescription="Vui lòng nhập lý do từ chối bên dưới."
                cancelText="Hủy"
                confirmText={submittingId != null ? "Đang xử lý..." : "Xác nhận từ chối"}
                confirmColor="error"
                loading={submittingId != null}
                onCancel={() => setPaymentRejectState({open: false, form: null, reason: "", touched: false})}
                onConfirm={handlePaymentRejectSubmit}
            >
                <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Nhập lý do từ chối..."
                    value={paymentRejectState.reason}
                    onChange={(e) => setPaymentRejectState((prev) => ({...prev, reason: e.target.value, touched: true}))}
                    error={paymentRejectState.touched && !String(paymentRejectState.reason || "").trim()}
                    helperText={paymentRejectState.touched && !String(paymentRejectState.reason || "").trim() ? "Vui lòng nhập lý do" : ""}
                    sx={{"& .MuiOutlinedInput-root": {borderRadius: 2, bgcolor: "#fff", fontSize: 15}}}
                />
            </ConfirmDialog>

            <AdmissionReservationDetailDrawer
                open={detailOpen}
                row={selectedReservation}
                onClose={() => setDetailOpen(false)}
                fullScreen={isMobile}
                isSubmitting={submittingId != null}
                onApprove={() => {
                    setConfirmState({ open: true, form: selectedReservation });
                    if (isMobile) setDetailOpen(false);
                }}
                onReject={() => {
                    setRejectState({ open: true, form: selectedReservation, reason: "", touched: false });
                    if (isMobile) setDetailOpen(false);
                }}
                onConfirmPayment={() => {
                    setPaymentConfirmState({ open: true, form: selectedReservation });
                    if (isMobile) setDetailOpen(false);
                }}
                onRejectPayment={() => {
                    setPaymentRejectState({ open: true, form: selectedReservation, reason: "", touched: false });
                    if (isMobile) setDetailOpen(false);
                }}
                onPreviewPaymentProof={() => openPaymentProofPreview(selectedReservation)}
            />

            <ImagePreviewModal
                open={imagePreviewOpen}
                images={previewImages}
                selectedIndex={selectedImageIndex}
                onChangeIndex={setSelectedImageIndex}
                onClose={() => setImagePreviewOpen(false)}
            />

            <AutoApproveDialog
                open={autoApproveOpen}
                onClose={() => setAutoApproveOpen(false)}
                onDone={loadData}
                pendingCount={pendingCount}
            />
        </Box>
    );
}
