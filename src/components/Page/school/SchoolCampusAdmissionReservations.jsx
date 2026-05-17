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
} from "@mui/material";
import Pagination from "@mui/material/Pagination";
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
import {enqueueSnackbar} from "notistack";
import {useTheme} from "@mui/material/styles";
import {useSchool} from "../../../contexts/SchoolContext.jsx";
import {
    confirmAdmissionReservationPayment,
    getCampusAdmissionReservationForms,
    processAdmissionReservationForm,
} from "../../../services/CampusAdmissionReservationService.jsx";
import {getApiErrorMessage} from "../../../utils/getApiErrorMessage.js";
import {AdmissionDocumentsSection} from "../admission/AdmissionDocumentUploadFields.jsx";
import {PaymentProofPreview} from "../admission/PaymentProofPreview.jsx";
import ConfirmDialog, {ConfirmHighlight} from "../../ui/ConfirmDialog.jsx";
import {
    HOC_BA_THCS_CODE,
    HOC_BA_THCS_GRADE_LABELS,
    pickCheckedDocumentsFromReservation,
    pickProfileMetaDataFromTemplate,
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
} from "../../../constants/reservationStatusConfig.js";

const STATUS_ICONS = {
    [RESERVATION_STATUS.PENDING]: AccessTimeRoundedIcon,
    [RESERVATION_STATUS.APPROVAL]: CheckCircleRoundedIcon,
    [RESERVATION_STATUS.PAYMENT_PENDING]: AccessTimeRoundedIcon,
    [RESERVATION_STATUS.DEPOSITED]: CheckCircleRoundedIcon,
    [RESERVATION_STATUS.REJECTED]: CancelRoundedIcon,
    [RESERVATION_STATUS.PAYMENT_REJECTED]: CancelRoundedIcon,
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

const mapRow = (item, index) => {
    const studentName = item?.studentName ?? item?.childName ?? item?.studentProfileName ?? "Học sinh chưa có tên";
    const parentName = item?.parentName ?? item?.guardianName ?? "Phụ huynh";
    const status = normalizeReservationStatus(item?.status ?? item?.formStatus);
    const submittedAt = item?.submittedAt ?? item?.createdTime ?? item?.createdAt ?? item?.createdDate;
    const profileMetadata = pickProfileMetaDataFromTemplate(item);
    const transcriptImages = Array.isArray(item?.transcriptImages) ? item.transcriptImages : [];
    return {
        id: Number(item?.formId ?? item?.id ?? index + 1),
        campusId: Number(item?.campusId),
        campusName: displayOrDash(item?.campusName),
        studentName: String(studentName),
        studentCode: displayOrDash(item?.studentCode),
        currentSchool: displayOrDash(item?.schoolName ?? item?.currentSchool ?? item?.currentSchoolName),
        registerClass: displayOrDash(item?.registerClass ?? item?.gradeName ?? item?.targetGrade),
        programName: displayOrDash(item?.programName),
        methodName: displayOrDash(item?.methodName ?? item?.admissionMethodCode),
        campusProgramOfferingId: displayOrDash(item?.campusProgramOfferingId),
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
        raw: item,
    };
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
                        <Typography sx={{fontSize: 14, color: "#475569", mb: 1}}>
                            <strong>Học sinh:</strong> {row.studentName}
                        </Typography>
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
                    <Paper elevation={0} sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "rgba(255,255,255,0.65)"}}>
                        <Typography sx={{fontWeight: 700, color: "#1e3a8a", mb: 1.5}}>
                            Thông tin học sinh
                        </Typography>
                        <Stack spacing={0}>
                            <DetailInfoRow label="Học sinh" value={row?.studentName} />
                            <DetailInfoRow label="Giới tính" value={formatGender(row?.gender)} />
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
                            <DetailInfoRow
                                label="Mã gói tuyển sinh"
                                value={row?.campusProgramOfferingId !== "—" ? row?.campusProgramOfferingId : undefined}
                            />
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

                    {row?.status === RESERVATION_STATUS.REJECTED && row?.rejectReason ? (
                        <Paper elevation={0} sx={{p: 2, borderRadius: 3, border: "1px solid #fecaca", bgcolor: "#fef2f2"}}>
                            <Typography sx={{fontWeight: 800, color: "#b91c1c", mb: 0.8}}>
                                Lý do từ chối hồ sơ
                            </Typography>
                            <Typography variant="body2" sx={{color: "#7f1d1d"}}>
                                {row.rejectReason}
                            </Typography>
                        </Paper>
                    ) : null}

                    {row?.status === RESERVATION_STATUS.PAYMENT_REJECTED && row?.rejectReason ? (
                        <Paper elevation={0} sx={{p: 2, borderRadius: 3, border: "1px solid #fda4af", bgcolor: "#fff1f2"}}>
                            <Typography sx={{fontWeight: 800, color: "#9f1239", mb: 0.8}}>
                                Lý do từ chối thanh toán
                            </Typography>
                            <Typography variant="body2" sx={{color: "#881337"}}>
                                {row.rejectReason}
                            </Typography>
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

export default function SchoolCampusAdmissionReservations() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const {loading: schoolCtxLoading} = useSchool();
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("ALL");
    const [pendingCount, setPendingCount] = React.useState(0);
    const [page, setPage] = React.useState(0);
    const [pageSize] = React.useState(12);
    const [totalItems, setTotalItems] = React.useState(0);
    const [sortBy, setSortBy] = React.useState("NEWEST");
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

    const redirectToProcessedStatusView = React.useCallback((nextStatus) => {
        if (!RESERVATION_STATUS_FILTER_VALUES.has(nextStatus)) return;
        setDetailOpen(false);
        setSelectedReservation(null);
        setStatusFilter(nextStatus);
        setPage(0);
    }, []);

    const loadData = React.useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getCampusAdmissionReservationForms({
                status: statusFilter,
            });
            let allRows = Array.isArray(res?.items) ? res.items.map(mapRow) : [];
            if (statusFilter !== "ALL") {
                allRows = allRows.filter((row) => row.status === statusFilter);
            }
            setPendingCount(allRows.filter((row) => row.status === RESERVATION_STATUS.PENDING).length);
            allRows.sort((a, b) => {
                const diff = new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
                return sortBy === "OLDEST" ? -diff : diff;
            });

            const kw = String(search || "").trim().toLowerCase();
            const filtered = kw
                ? allRows.filter((row) =>
                    [
                        row.studentName,
                        row.studentCode,
                        row.parentName,
                        row.phone,
                        row.parentEmail,
                        row.currentSchool,
                        row.programName,
                        row.methodName,
                        row.identityCard,
                    ].some((field) => String(field || "").toLowerCase().includes(kw))
                )
                : allRows;

            const total = filtered.length;
            const start = page * pageSize;
            const pagedRows = filtered.slice(start, start + pageSize);
            setRows(pagedRows);
            setTotalItems(total);
        } catch (err) {
            setRows([]);
            setTotalItems(0);
            setError(getApiErrorMessage(err, "Không tải được danh sách hồ sơ nhập học."));
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, statusFilter, sortBy]);

    React.useEffect(() => {
        if (schoolCtxLoading) return;
        void loadData();
    }, [schoolCtxLoading, loadData]);

    React.useEffect(() => {
        setPage(0);
    }, [search, statusFilter]);

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
                    <Chip label={`Còn lại: ${pendingCount} hồ sơ`} sx={{ alignSelf: {xs: "flex-start", sm: "flex-end"}, borderRadius: 999, bgcolor: "rgba(255,255,255,0.95)", color: "#0D64DE", fontWeight: 800 }} />
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
                            label="Trạng thái"
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
                    ) : rows.length === 0 ? (
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
                                        <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>Phụ huynh</TableCell>
                                        <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>Học sinh</TableCell>
                                        <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>SĐT</TableCell>
                                        <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>Chương trình</TableCell>
                                        <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>Ngày nộp</TableCell>
                                        <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>Trạng thái</TableCell>
                                        <TableCell align="right" sx={{fontWeight: 700, color: "#1e293b", py: 2, minWidth: 128}}>Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            hover
                                            sx={{
                                                "&:hover": { bgcolor: "rgba(122, 169, 235, 0.06)" },
                                            }}
                                        >
                                            <TableCell sx={{py: 2.25, fontWeight: 600, color: "#1e293b"}}>{row.parentName}</TableCell>
                                            <TableCell sx={{py: 2.25}}>{row.studentName}</TableCell>
                                            <TableCell sx={{py: 2.25}}>{row.phone || "—"}</TableCell>
                                            <TableCell sx={{py: 2.25}}>{row.programName || "—"}</TableCell>
                                            <TableCell sx={{py: 2.25, whiteSpace: "nowrap"}}>{formatDateOnly(row.submittedAt)}</TableCell>
                                            <TableCell sx={{py: 2.25}}><StatusChip status={row.status} /></TableCell>
                                            <TableCell align="right" sx={{py: 2.25}}>
                                                <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
                                                    <RowActionButton
                                                        variant="view"
                                                        title="Xem chi tiết"
                                                        onClick={() => openDetail(row)}
                                                    >
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
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    {totalItems > pageSize ? (
                        <Box sx={{display: "flex", justifyContent: "flex-end", pt: 1}}>
                            <Pagination
                                count={Math.ceil(totalItems / pageSize)}
                                page={page + 1}
                                onChange={(_, p) => setPage(p - 1)}
                                color="primary"
                                shape="rounded"
                            />
                        </Box>
                    ) : null}
                </>
            )}

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
        </Box>
    );
}
