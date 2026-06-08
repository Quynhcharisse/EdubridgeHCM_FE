import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    Avatar,
    Backdrop,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fade,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import {enqueueSnackbar} from "notistack";
import {sendConfirmEnrollmentEmail} from "../../services/emailService.jsx";

import {
    deleteParentAdmissionReservationFormCancel,
    getParentAdmissionReservationForms,
    pickAdmissionReservationFormsFromResponse,
    putParentAdmissionReservationFormConfirmEnrollment,
} from "../../services/ParentService.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import {AdmissionDocumentsSection} from "./admission/AdmissionDocumentUploadFields.jsx";
import {PaymentProofPreview} from "./admission/PaymentProofPreview.jsx";
import ReservationPaymentDialog from "./admission/ReservationPaymentDialog.jsx";
import MandatoryDocumentsDialog, {
    normalizeSubmissionDocumentList,
} from "./admission/MandatoryDocumentsDialog.jsx";
import RejectReasonAlert from "./admission/RejectReasonAlert.jsx";
import {
    formatReservationDateOfBirth,
    normalizeParentAdmissionReservationRow,
    reservationToReadonlyDocs,
    sanitizeReservationDisplayValue,
} from "./admission/admissionSubmissionUtils.js";
import {useNavigate} from "react-router-dom";
import {APP_PRIMARY_DARK, BRAND_NAVY} from "../../constants/homeLandingTheme";
import {
    MAX_PARENT_PAYMENT_AGAIN_ATTEMPTS,
    PARENT_RESERVATION_FILTERS,
    RESERVATION_STATUS,
    canParentCancelReservation,
    canParentConfirmEnrollment,
    canParentOpenReservationPayment,
    canParentRetryReservationPayment,
    getParentReservationFilterValueForStatus,
    getReservationStatusLabel,
    getReservationStatusStyle,
    isParentReservationPaymentAgain,
    normalizeReservationStatus,
    reservationStatusMatchesFilter,
    shouldShowReservationPaymentRejectReason,
} from "../../constants/reservationStatusConfig.js";

const FILTERS = PARENT_RESERVATION_FILTERS;

const RESERVATION_CARD_ACTION_BUTTON_SX = {
    borderRadius: 999,
    px: 1.25,
    py: 0.25,
    minHeight: 30,
    fontSize: 12.5,
    fontWeight: 600,
    textTransform: "none",
    lineHeight: 1.35,
    flex: {xs: "1 1 auto", sm: "0 0 auto"},
    "& .MuiButton-startIcon": {
        marginRight: 0.4,
        "& > *:nth-of-type(1)": {fontSize: 15},
    },
};

function pickReservationStatusFromMutationResponse(response) {
    const data = response?.data;
    if (!data) return null;
    let body = data.body ?? data;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch {
            return null;
        }
    }
    if (Array.isArray(body)) {
        const item = body.find((row) => row && typeof row === "object");
        return item?.status ?? item?.formStatus ?? null;
    }
    if (body && typeof body === "object") {
        return body.status ?? body.formStatus ?? null;
    }
    return data.status ?? null;
}

const hasText = (value) => value != null && String(value).trim() !== "";

const isDisplayableValue = (value) => sanitizeReservationDisplayValue(value) != null;

const formatDateOnly = (value) => {
    if (!hasText(value)) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        const raw = String(value).trim();
        return isDisplayableValue(raw) ? raw : null;
    }
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};

const getGenderLabel = (gender) => {
    if (!hasText(gender)) return null;
    const key = String(gender).trim().toUpperCase();
    if (key === "MALE") return "Nam";
    if (key === "FEMALE") return "Nữ";
    const raw = String(gender).trim();
    return isDisplayableValue(raw) ? raw : null;
};

const getStatusMeta = (status) => {
    const style = getReservationStatusStyle(status);
    if (style) return style;
    return {
        label: getReservationStatusLabel(status) || "Đang xử lý",
        color: "#334155",
        bg: "#e2e8f0",
        border: "#cbd5e1",
    };
};

const getFilterCount = (rows, filter) =>
    rows.filter((row) => reservationStatusMatchesFilter(row?.status, filter)).length;

const getReservationRowId = (row) => {
    const id = Number(row?.admissionFormId ?? row?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
};

function InfoRow({label, value}) {
    if (!isDisplayableValue(value)) return null;
    return (
        <Stack
            spacing={0.45}
            sx={{
                height: "100%",
                bgcolor: "#fff",
                border: "1px solid #cfe5fb",
                borderRadius: 2,
                p: 1.5,
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.06)"
            }}
        >
            <Typography sx={{fontSize: 13, color: "#2563eb", fontWeight: 700}}>
                {label}
            </Typography>
            <Typography sx={{fontSize: 14.5, color: "#1e293b", fontWeight: 600}}>
                {value}
            </Typography>
        </Stack>
    );
}

function DetailSection({title, chip, children}) {
    const rows = React.Children.toArray(children).filter((child) => child != null);
    if (rows.length === 0) return null;
    return (
        <Paper elevation={0} sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "rgba(255,255,255,0.65)"}}>
            <Stack
                direction={{xs: "column", sm: "row"}}
                alignItems={{xs: "flex-start", sm: "center"}}
                justifyContent="space-between"
                gap={1.5}
                sx={{mb: 1.5}}
            >
                <Typography sx={{fontWeight: 700, color: BRAND_NAVY}}>{title}</Typography>
                {chip ?? null}
            </Stack>
            <Stack spacing={1}>{rows}</Stack>
        </Paper>
    );
}

function getDetailRejectReasonAlertProps(reservation) {
    const reason = String(reservation?.rejectReason ?? "").trim();
    if (!reason) return null;
    const status = normalizeReservationStatus(reservation?.status);
    if (status === RESERVATION_STATUS.REJECTED) {
        return {title: "Lý do từ chối hồ sơ", reason, variant: "profile"};
    }
    if (shouldShowReservationPaymentRejectReason(reservation)) {
        return {title: "Lý do từ chối thanh toán", reason, variant: "payment"};
    }
    return null;
}

function DetailLineRow({label, value}) {
    if (!isDisplayableValue(value)) return null;
    return (
        <Box
            sx={{
                py: 0.8,
                borderBottom: "1px dashed #c7d8ea"
            }}
        >
            <Typography sx={{fontSize: 14.5, color: "#1e293b"}}>
                <Box component="span" sx={{color: "#2563eb", fontWeight: 700}}>
                    {label}:
                </Box>{" "}
                <Box component="span" sx={{fontWeight: 600}}>
                    {value}
                </Box>
            </Typography>
        </Box>
    );
}

function ReservationCard({
    reservation,
    onOpenDetail,
    onOpenPayment,
    onOpenConfirmEnrollment,
    onOpenMandatoryDocuments,
    onOpenCancelReservation,
    confirmEnrollmentLoadingId,
}) {
    const normalizedStatus = normalizeReservationStatus(reservation?.status);
    const statusMeta = getStatusMeta(reservation?.status);
    const isPaymentAgain = isParentReservationPaymentAgain(reservation);
    const showPayment = canParentOpenReservationPayment(reservation);
    const canRetryPayment = canParentRetryReservationPayment(reservation);
    const paymentRejectReason = String(reservation?.rejectReason ?? "").trim();
    const showPaymentRejectReason =
        shouldShowReservationPaymentRejectReason(reservation) && paymentRejectReason;
    const statusHint =
        normalizedStatus === RESERVATION_STATUS.PENDING
            ? "Hồ sơ đang chờ trường duyệt."
            : normalizedStatus === RESERVATION_STATUS.APPROVAL
              ? "Vui lòng thanh toán phí giữ chỗ theo hướng dẫn của trường."
              : normalizedStatus === RESERVATION_STATUS.PAYMENT_PENDING
                ? showPaymentRejectReason
                    ? `Trường đang xác nhận thanh toán. Lý do từ chối lần trước: ${paymentRejectReason}`
                    : "Trường đang xác nhận minh chứng thanh toán của bạn."
                : normalizedStatus === RESERVATION_STATUS.PAYMENT_REJECTED
                  ? showPaymentRejectReason
                      ? `Lý do từ chối thanh toán: ${paymentRejectReason}`
                      : "Minh chứng thanh toán bị từ chối — vui lòng thanh toán lại."
                  : normalizedStatus === RESERVATION_STATUS.DEPOSITED
                    ? "Đã đặt cọc thành công — vui lòng xác nhận nhập học nếu chọn trường này."
                    : normalizedStatus === RESERVATION_STATUS.DEPOSIT_EXPIRED
                      ? "Đơn đã hết hạn đặt cọc."
                      : normalizedStatus === RESERVATION_STATUS.CONFIRMED
                        ? "Bạn đã xác nhận nhập học cho đơn này."
                        : normalizedStatus === RESERVATION_STATUS.GHOST
                          ? "Bạn đã chốt trường khác — hồ sơ này không còn hiệu lực."
                          : normalizedStatus === RESERVATION_STATUS.CANCELLED
                            ? "Đơn đã được hủy."
                            : normalizedStatus === RESERVATION_STATUS.REJECTED
                      ? null
                      : null;
    const showConfirmEnrollment = canParentConfirmEnrollment(reservation);
    const showMandatoryDocuments = normalizedStatus === RESERVATION_STATUS.CONFIRMED;
    const showCancelReservation = canParentCancelReservation(reservation);
    const confirmEnrollmentLoading =
        confirmEnrollmentLoadingId != null &&
        Number(confirmEnrollmentLoadingId) === Number(reservation?.admissionFormId ?? reservation?.id);
    const confirmCode = isDisplayableValue(reservation?.confirmCode) ? reservation.confirmCode : null;
    const cardTitle = isDisplayableValue(reservation?.schoolName)
        ? confirmCode
            ? `${reservation.schoolName} - ${confirmCode}`
            : reservation.schoolName
        : confirmCode
          ? confirmCode
          : isDisplayableValue(reservation?.studentName)
            ? reservation.studentName
            : "Đơn đăng ký";
    const submittedDate = formatDateOnly(reservation?.createdTime);
    const confirmEndDate = (() => {
        const raw = reservation?.confirmEndDate;
        if (!raw) return null;
        if (Array.isArray(raw) && raw.length >= 3) {
            const [y, m, d] = raw;
            return new Date(y, m - 1, d).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        }
        return formatDateOnly(raw);
    })();

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
                    transform: "translateY(-1px)"
                }
            }}
        >
            <Stack
                direction={{xs: "column", md: "row"}}
                alignItems={{xs: "stretch", md: "center"}}
                justifyContent="space-between"
                gap={2}
                sx={{
                    px: {xs: 2, md: 2.5},
                    py: 2.25
                }}
            >
                <Stack direction="row" alignItems="flex-start" gap={1.5} sx={{minWidth: 0, flex: 1}}>
                    <Avatar sx={{bgcolor: "#eff6ff", color: BRAND_NAVY, width: 44, height: 44, flex: "0 0 auto"}}>
                        <SchoolRoundedIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{minWidth: 0}}>
                        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{mb: 0.6}}>
                            <Typography sx={{fontSize: 17, fontWeight: 600, color: BRAND_NAVY, lineHeight: 1.3}}>
                                {cardTitle}
                            </Typography>
                            <Chip
                                label={statusMeta.label}
                                size="small"
                                sx={{
                                    bgcolor: statusMeta.bg,
                                    color: statusMeta.color,
                                    border: `1px solid ${statusMeta.border}`,
                                    fontWeight: 500,
                                    borderRadius: 999
                                }}
                            />
                        </Stack>
                        {isDisplayableValue(reservation?.programName) ? (
                            <Typography sx={{fontSize: 14, color: "#475569", mb: 1}}>
                                {reservation.programName}
                            </Typography>
                        ) : null}
                        {isDisplayableValue(reservation?.studentName) ? (
                            <Typography sx={{fontSize: 13.5, color: "#64748b", mb: 0.75}}>
                                Học sinh:{" "}
                                <Box component="span" sx={{fontWeight: 700, color: "#1e293b"}}>
                                    {reservation.studentName}
                                </Box>
                            </Typography>
                        ) : null}
                        <Stack spacing={0.75} sx={{mb: statusHint ? 1 : 0}}>
                            {isDisplayableValue(reservation?.campusName) ? (
                                <Stack direction="row" alignItems="center" spacing={0.75}>
                                    <LocationOnRoundedIcon sx={{fontSize: 18, color: "#64748b"}} />
                                    <Typography sx={{fontSize: 13.5, color: "#475569"}}>
                                        {reservation.campusName}
                                    </Typography>
                                </Stack>
                            ) : null}
                            {submittedDate ? (
                                <Typography sx={{fontSize: 13.5, color: "#64748b"}}>
                                    Ngày nộp: {submittedDate}
                                </Typography>
                            ) : null}
                            {showMandatoryDocuments && confirmEndDate ? (
                                <Typography sx={{fontSize: 13.5, color: "#64748b"}}>
                                    Ngày hạn nộp hồ sơ tại trường: {confirmEndDate}
                                </Typography>
                            ) : null}
                        </Stack>
                        {statusHint ? (
                            <Typography sx={{fontSize: 13, color: statusMeta.color, fontWeight: 500, mt: 0.25}}>
                                {statusHint}
                            </Typography>
                        ) : null}
                    </Box>
                </Stack>
                <Stack
                    direction={{xs: "column", sm: "row"}}
                    spacing={1}
                    sx={{flex: {xs: "1 1 auto", md: "0 0 auto"}, width: {xs: "100%", md: "auto"}}}
                >
                    {showPayment ? (
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<PaymentsRoundedIcon />}
                            disabled={isPaymentAgain && !canRetryPayment}
                            onClick={() => {
                                if (isPaymentAgain && !canRetryPayment) {
                                    enqueueSnackbar(
                                        `Đã vượt quá ${MAX_PARENT_PAYMENT_AGAIN_ATTEMPTS} lần thanh toán lại. Vui lòng liên hệ nhà trường.`,
                                        {variant: "warning"},
                                    );
                                    return;
                                }
                                onOpenPayment(reservation);
                            }}
                            sx={{
                                ...RESERVATION_CARD_ACTION_BUTTON_SX,
                                bgcolor: "#059669",
                                boxShadow: "0 4px 10px rgba(5, 150, 105, 0.18)",
                                "&:hover": {bgcolor: "#047857"},
                            }}
                        >
                            {isPaymentAgain ? "Thanh toán lại" : "Thanh toán"}
                        </Button>
                    ) : null}
                    {showConfirmEnrollment ? (
                        <Button
                            size="small"
                            variant="contained"
                            disabled={confirmEnrollmentLoading}
                            onClick={() => onOpenConfirmEnrollment(reservation)}
                            sx={{
                                ...RESERVATION_CARD_ACTION_BUTTON_SX,
                                bgcolor: BRAND_NAVY,
                                boxShadow: "0 4px 10px rgba(45, 95, 115, 0.18)",
                                "&:hover": {bgcolor: APP_PRIMARY_DARK},
                            }}
                        >
                            {confirmEnrollmentLoading ? "Đang xử lý..." : "Xác nhận nhập học"}
                        </Button>
                    ) : null}
                    {showMandatoryDocuments ? (
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<DescriptionOutlinedIcon />}
                            onClick={() => onOpenMandatoryDocuments(reservation)}
                            sx={{
                                ...RESERVATION_CARD_ACTION_BUTTON_SX,
                                bgcolor: "#0369a1",
                                boxShadow: "0 4px 10px rgba(3, 105, 161, 0.18)",
                                "&:hover": {bgcolor: "#075985"},
                            }}
                        >
                            Hồ sơ cần nộp
                        </Button>
                    ) : null}
                    {showCancelReservation ? (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CancelOutlinedIcon />}
                            onClick={() => onOpenCancelReservation(reservation)}
                            sx={{
                                ...RESERVATION_CARD_ACTION_BUTTON_SX,
                                borderColor: "#fca5a5",
                                color: "#dc2626",
                                "&:hover": {bgcolor: "#fef2f2", borderColor: "#f87171"},
                            }}
                        >
                            Hủy hồ sơ
                        </Button>
                    ) : null}
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ArticleOutlinedIcon />}
                        onClick={() => onOpenDetail(reservation)}
                        sx={{
                            ...RESERVATION_CARD_ACTION_BUTTON_SX,
                            fontWeight: 500,
                            borderColor: "#bfdbfe",
                            color: BRAND_NAVY,
                        }}
                    >
                        Xem chi tiết
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
}

function PaymentProofImageModal({open, url, onClose}) {
    if (!url) return null;
    return (
        <Backdrop open={open} onClick={onClose} sx={{zIndex: 1400, bgcolor: "rgba(15, 23, 42, 0.38)", backdropFilter: "blur(6px)"}}>
            <Fade in={open}>
                <Box onClick={(e) => e.stopPropagation()} sx={{display: "flex", justifyContent: "center", alignItems: "center", p: {xs: 2, md: 4}}}>
                    <Box
                        component="img"
                        src={url}
                        alt="Minh chứng thanh toán"
                        sx={{maxWidth: "92vw", maxHeight: "84vh", objectFit: "contain", display: "block"}}
                    />
                </Box>
            </Fade>
        </Backdrop>
    );
}

function DetailDialog({reservation, onClose}) {
    const navigate = useNavigate();
    const open = Boolean(reservation);
    const normalizedStatus = normalizeReservationStatus(reservation?.status);
    const statusMeta = getStatusMeta(reservation?.status);
    const [paymentPreviewOpen, setPaymentPreviewOpen] = useState(false);
    const readonlyDocs = useMemo(
        () => (reservation ? reservationToReadonlyDocs(reservation) : []),
        [reservation],
    );

    useEffect(() => {
        if (!open) setPaymentPreviewOpen(false);
    }, [open, reservation?.id]);
    const detailTitleSuffix =
        normalizedStatus === RESERVATION_STATUS.CONFIRMED &&
        isDisplayableValue(reservation?.confirmCode)
            ? ` — ${reservation.confirmCode}`
            : isDisplayableValue(reservation?.studentName)
              ? ` — ${reservation.studentName}`
              : isDisplayableValue(reservation?.schoolName)
                ? ` — ${reservation.schoolName}`
                : "";
    const rejectReasonAlertProps = getDetailRejectReasonAlertProps(reservation);

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
                        bgcolor: "#e8f4fc"
                    }
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
                        borderBottom: "1px solid #b8d8f4"
                    }}
                >
                    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
                        <Typography sx={{fontSize: 20, fontWeight: 700, color: "#0f172a"}}>
                            Chi tiết đơn giữ chỗ{detailTitleSuffix}
                        </Typography>
                        <Chip
                            label={statusMeta.label}
                            size="small"
                            sx={{
                                bgcolor: statusMeta.bg,
                                color: statusMeta.color,
                                border: `1px solid ${statusMeta.border}`,
                                fontWeight: 600,
                                borderRadius: 999,
                            }}
                        />
                    </Stack>
                    <IconButton onClick={onClose}>
                        <CloseRoundedIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{bgcolor: "#e8f4fc", borderColor: "#b8d8f4", p: 3}}>
                    <Stack spacing={2.5}>
                        {rejectReasonAlertProps ? (
                            <RejectReasonAlert {...rejectReasonAlertProps} />
                        ) : null}
                        <DetailSection title="Thông tin học sinh">
                            <DetailLineRow label="Học sinh" value={reservation?.studentName} />
                            <DetailLineRow label="Giới tính" value={getGenderLabel(reservation?.gender)} />
                            <DetailLineRow
                                label="Ngày sinh"
                                value={
                                    formatReservationDateOfBirth(reservation?.dateOfBirth) ||
                                    reservation?.dateOfBirth
                                }
                            />
                            <DetailLineRow label="CCCD học sinh" value={reservation?.studentCode} />
                            <DetailLineRow
                                label="Phương thức xét tuyển"
                                value={reservation?.methodName ?? reservation?.admissionMethodCode}
                            />
                        </DetailSection>

                        <DetailSection title="Thông tin phụ huynh">
                            <DetailLineRow label="Phụ huynh" value={reservation?.parentName} />
                            <DetailLineRow label="CCCD phụ huynh" value={reservation?.identityCard} />
                            <DetailLineRow label="Email" value={reservation?.parentEmail} />
                            <DetailLineRow label="Điện thoại" value={reservation?.parentPhone} />
                            <DetailLineRow label="Địa chỉ" value={reservation?.address} />
                        </DetailSection>

                        <DetailSection title="Thông tin đơn tuyển sinh">
                            <DetailLineRow label="Trường" value={reservation?.schoolName} />
                            <DetailLineRow label="Chương trình" value={reservation?.programName} />
                            <DetailLineRow label="Cơ sở học" value={reservation?.campusName} />
                            <DetailLineRow label="Ngày nộp" value={formatDateOnly(reservation?.createdTime) ?? undefined} />
                            <DetailLineRow label="Mã chuyển" value={reservation?.transferCode} />
                        </DetailSection>

                        {normalizedStatus === RESERVATION_STATUS.PAYMENT_PENDING ||
                        isDisplayableValue(reservation?.paymentProofUrl) ? (
                            <Paper
                                elevation={0}
                                sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "rgba(255,255,255,0.65)"}}
                            >
                                <Typography sx={{fontWeight: 700, color: BRAND_NAVY, mb: 1.5}}>
                                    Minh chứng thanh toán
                                </Typography>
                                <PaymentProofPreview
                                    url={reservation?.paymentProofUrl}
                                    onPreview={
                                        isDisplayableValue(reservation?.paymentProofUrl)
                                            ? () => setPaymentPreviewOpen(true)
                                            : undefined
                                    }
                                />
                            </Paper>
                        ) : null}

                        <Paper
                            elevation={0}
                            sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "rgba(255,255,255,0.65)"}}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{mb: 1.5}}>
                            <Typography sx={{fontWeight: 700, color: BRAND_NAVY}}>
                                Minh chứng đính kèm
                            </Typography>
                            {normalizedStatus === RESERVATION_STATUS.REJECTED ? (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<EditOutlinedIcon />}
                                    onClick={() => {
                                        const studentId = Number(reservation?.studentProfileId);
                                        if (!Number.isFinite(studentId) || studentId <= 0) return;
                                        const returnUrl = encodeURIComponent("/parent/admission-reservations");
                                        navigate(
                                            `/parent/admission-hold-profile?studentId=${studentId}&returnUrl=${returnUrl}`,
                                            {
                                                state: {
                                                    reservationError: true,
                                                    reservationRejectReason: reservation?.rejectReason ?? "",
                                                },
                                            },
                                        );
                                    }}
                                    sx={{
                                        textTransform: "none",
                                        borderRadius: 2,
                                        px: 1.5,
                                        minWidth: 0,
                                    }}
                                >
                                    Chỉnh sửa
                                </Button>
                            ) : null}
                        </Stack>
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
                                emptyMessage="Chưa có ảnh minh chứng trong đơn này."
                            />
                        </Paper>
                    </Stack>
                </DialogContent>
            </Dialog>
            <PaymentProofImageModal
                open={paymentPreviewOpen}
                url={reservation?.paymentProofUrl}
                onClose={() => setPaymentPreviewOpen(false)}
            />
        </>
    );
}

export default function ParentAdmissionReservationsPage() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [paymentReservation, setPaymentReservation] = useState(null);
    const [confirmEnrollmentTarget, setConfirmEnrollmentTarget] = useState(null);
    const [confirmEnrollmentLoadingId, setConfirmEnrollmentLoadingId] = useState(null);
    const [mandatoryDocsReservation, setMandatoryDocsReservation] = useState(null);
    const [mandatoryDocsPayload, setMandatoryDocsPayload] = useState({
        mandatoryDocuments: [],
        methodDocuments: [],
        context: {},
    });
    const [mandatoryDocsLoading, setMandatoryDocsLoading] = useState(false);
    const [cancelReservationTarget, setCancelReservationTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelLoading, setCancelLoading] = useState(false);
    const mountedRef = useRef(true);
    const reservationStatusSnapshotRef = useRef(new Map());

    const loadReservations = useCallback(async ({silent = false} = {}) => {
        if (!silent) setLoading(true);
        try {
            const response = await getParentAdmissionReservationForms();
            const raw = pickAdmissionReservationFormsFromResponse(response);
            const rows = raw
                .map((item, index) => normalizeParentAdmissionReservationRow(item, index))
                .filter(Boolean);
            if (mountedRef.current) setReservations(rows);
            return rows;
        } catch (error) {
            console.error("[ParentAdmissionReservationsPage] load error:", error);
            if (mountedRef.current && !silent) {
                setReservations([]);
                enqueueSnackbar("Không thể tải danh sách đơn đăng ký. Vui lòng thử lại sau.", {variant: "error"});
            }
            return [];
        } finally {
            if (mountedRef.current && !silent) setLoading(false);
        }
    }, []);

    const handleOpenMandatoryDocuments = useCallback(async (reservation) => {
        const formId = Number(reservation?.admissionFormId ?? reservation?.id);
        if (!Number.isFinite(formId) || formId <= 0) {
            enqueueSnackbar("Không xác định được mã đơn.", {variant: "warning"});
            return;
        }
        setMandatoryDocsReservation(reservation);
        setMandatoryDocsPayload({mandatoryDocuments: [], methodDocuments: [], context: {}});
        setMandatoryDocsLoading(true);

        const applyDocsPayload = (source) => {
            setMandatoryDocsPayload({
                mandatoryDocuments: normalizeSubmissionDocumentList(source?.mandatoryDocuments),
                methodDocuments: normalizeSubmissionDocumentList(source?.methodDocuments),
                context: {
                    schoolName: source?.schoolName ?? reservation?.schoolName,
                    programName: source?.programName ?? reservation?.programName,
                    methodName: source?.methodName ?? reservation?.methodName,
                    confirmEndDate: source?.confirmEndDate ?? reservation?.confirmEndDate,
                },
            });
        };

        const rowMandatory = Array.isArray(reservation?.mandatoryDocuments)
            ? reservation.mandatoryDocuments
            : [];
        const rowMethod = Array.isArray(reservation?.methodDocuments) ? reservation.methodDocuments : [];
        if (rowMandatory.length > 0 || rowMethod.length > 0) {
            applyDocsPayload({
                ...reservation,
                mandatoryDocuments: rowMandatory,
                methodDocuments: rowMethod,
            });
            setMandatoryDocsLoading(false);
            return;
        }

        try {
            const response = await getParentAdmissionReservationForms({
                status: RESERVATION_STATUS.CONFIRMED,
            });
            const raw = pickAdmissionReservationFormsFromResponse(response);
            const match = raw.find(
                (item) => Number(item?.id ?? item?.admissionFormId) === formId,
            );
            if (!match) {
                enqueueSnackbar(
                    "Không tìm thấy đơn hoặc danh sách hồ sơ cần nộp.",
                    {variant: "warning"},
                );
                setMandatoryDocsPayload({mandatoryDocuments: [], methodDocuments: [], context: {}});
                return;
            }
            applyDocsPayload(match);
        } catch (error) {
            console.error("[ParentAdmissionReservationsPage] mandatory documents:", error);
            enqueueSnackbar(
                error?.response?.data?.message ||
                    error?.message ||
                    "Không tải được danh sách hồ sơ cần nộp.",
                {variant: "error"},
            );
            setMandatoryDocsReservation(null);
        } finally {
            setMandatoryDocsLoading(false);
        }
    }, []);

    const handleCloseMandatoryDocuments = useCallback(() => {
        setMandatoryDocsReservation(null);
        setMandatoryDocsPayload({mandatoryDocuments: [], methodDocuments: [], context: {}});
        setMandatoryDocsLoading(false);
    }, []);

    const handleConfirmEnrollment = useCallback(async () => {
        const formId = Number(
            confirmEnrollmentTarget?.admissionFormId ?? confirmEnrollmentTarget?.id,
        );
        if (!Number.isFinite(formId) || formId <= 0) {
            enqueueSnackbar("Không xác định được mã đơn.", {variant: "warning"});
            return;
        }
        setConfirmEnrollmentLoadingId(formId);
        try {
            const res = await putParentAdmissionReservationFormConfirmEnrollment(formId);
            enqueueSnackbar(
                res?.data?.message || "Xác nhận nhập học thành công.",
                {variant: "success"},
            );
            // Gửi email xác nhận nhập học cho phụ huynh (fire-and-forget, không block UI)
            const confirmCode =
            res?.data?.data?.confirmCode ??
            res?.data?.confirmCode ??
            confirmEnrollmentTarget?.confirmCode ??
            "N/A";
            const emailSupport = res?.data?.data?.emailSupport ?? "";
            void sendConfirmEnrollmentEmail({
            parentEmail: confirmEnrollmentTarget?.parentEmail ?? "",
            studentName: confirmEnrollmentTarget?.studentName ?? "",
            studentCode: confirmEnrollmentTarget?.studentCode ?? "",
            schoolName: confirmEnrollmentTarget?.schoolName ?? "",
            programName: confirmEnrollmentTarget?.programName ?? confirmEnrollmentTarget?.program ?? "",
            confirmCode,
            emailSupport,
            });

            setConfirmEnrollmentTarget(null);
            await loadReservations({silent: true});
            const nextStatus =
                pickReservationStatusFromMutationResponse(res) ?? RESERVATION_STATUS.CONFIRMED;
            setFilter(getParentReservationFilterValueForStatus(nextStatus));
        } catch (error) {
            console.error("[ParentAdmissionReservationsPage] confirm enrollment:", error);
            enqueueSnackbar(
                error?.response?.data?.message || error?.message || "Xác nhận nhập học thất bại.",
                {variant: "error"},
            );
        } finally {
            setConfirmEnrollmentLoadingId(null);
        }
    }, [confirmEnrollmentTarget, loadReservations]);

    const handleCancelReservation = useCallback(async () => {
        const formId = Number(
            cancelReservationTarget?.admissionFormId ?? cancelReservationTarget?.id,
        );
        if (!Number.isFinite(formId) || formId <= 0) {
            enqueueSnackbar("Không xác định được mã đơn.", {variant: "warning"});
            return;
        }
        setCancelLoading(true);
        try {
            const res = await deleteParentAdmissionReservationFormCancel(formId, cancelReason);
            enqueueSnackbar(res?.data?.message || "Hủy hồ sơ thành công.", {variant: "success"});
            setCancelReservationTarget(null);
            setCancelReason("");
            await loadReservations({silent: true});
            setFilter(getParentReservationFilterValueForStatus(RESERVATION_STATUS.CANCELLED));
        } catch (error) {
            console.error("[ParentAdmissionReservationsPage] cancel reservation:", error);
            enqueueSnackbar(
                error?.response?.data?.message || error?.message || "Hủy hồ sơ thất bại.",
                {variant: "error"},
            );
        } finally {
            setCancelLoading(false);
        }
    }, [cancelReservationTarget, cancelReason, loadReservations]);

    useEffect(() => {
        mountedRef.current = true;
        void loadReservations();
        return () => {
            mountedRef.current = false;
        };
    }, [loadReservations]);

    useEffect(() => {
        const refreshIfVisible = () => {
            if (document.visibilityState === "visible") {
                void loadReservations({silent: true});
            }
        };

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void loadReservations({silent: true});
            }
        }, 10000);

        window.addEventListener("focus", refreshIfVisible);
        document.addEventListener("visibilitychange", refreshIfVisible);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("focus", refreshIfVisible);
            document.removeEventListener("visibilitychange", refreshIfVisible);
        };
    }, [loadReservations]);

    useEffect(() => {
        const nextSnapshot = new Map();
        for (const row of reservations) {
            const id = getReservationRowId(row);
            if (id) nextSnapshot.set(id, normalizeReservationStatus(row?.status));
        }
        reservationStatusSnapshotRef.current = nextSnapshot;
    }, [filter]);

    useEffect(() => {
        const currentFilterDef = FILTERS.find((item) => item.value === filter) ?? FILTERS[0];
        if (currentFilterDef.value === "ALL") return;

        const snapshot = reservationStatusSnapshotRef.current;
        for (const row of reservations) {
            const id = getReservationRowId(row);
            if (!id) continue;
            const prevStatus = snapshot.get(id);
            const nextStatus = normalizeReservationStatus(row?.status);
            if (!prevStatus || !nextStatus || prevStatus === nextStatus) continue;
            if (
                reservationStatusMatchesFilter(prevStatus, currentFilterDef) &&
                !reservationStatusMatchesFilter(nextStatus, currentFilterDef)
            ) {
                setFilter(getParentReservationFilterValueForStatus(nextStatus));
                break;
            }
        }

        const nextSnapshot = new Map();
        for (const row of reservations) {
            const id = getReservationRowId(row);
            if (id) nextSnapshot.set(id, normalizeReservationStatus(row?.status));
        }
        reservationStatusSnapshotRef.current = nextSnapshot;
    }, [reservations, filter]);

    const filteredReservations = useMemo(() => {
        const currentFilter = FILTERS.find((item) => item.value === filter) ?? FILTERS[0];
        return reservations.filter((row) => reservationStatusMatchesFilter(row?.status, currentFilter));
    }, [filter, reservations]);

    return (
        <Box sx={{bgcolor: "#f5f8fc", minHeight: "100%", pt: {xs: 14, md: 13}, pb: {xs: 2.5, md: 3}}}>
            <Container maxWidth="lg">
                <Paper
                    elevation={0}
                    sx={{
                        mb: 2,
                        px: {xs: 2, md: 2.5},
                        py: {xs: 2.25, md: 2.6},
                        borderRadius: 2,
                        color: "#fff",
                        background: "linear-gradient(120deg, #2563eb 0%, #1d8ee8 58%, #10a6df 100%)",
                        boxShadow: "0 18px 42px rgba(37,99,235,0.2)"
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                        <Box>
                            <Typography
                                variant="h5"
                                sx={{fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.25}}
                            >
                                Quản lý hồ sơ giữ chỗ
                            </Typography>
                            <Typography sx={{mt: 0.85, color: "rgba(255,255,255,0.86)", fontSize: 14, fontWeight: 400}}>
                                Xem lại các đơn tuyển sinh đã nộp theo từng trạng thái.
                            </Typography>
                        </Box>
                        <Avatar
                            sx={{
                                width: 42,
                                height: 42,
                                flex: "0 0 auto",
                                bgcolor: "rgba(255,255,255,0.18)",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.32)"
                            }}
                        >
                            <AssignmentTurnedInRoundedIcon fontSize="small" />
                        </Avatar>
                    </Stack>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        bgcolor: "#fff",
                        border: "1px solid #dbe3ee",
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)"
                    }}
                >
                    <Box sx={{borderBottom: "1px solid #e5eaf1", px: {xs: 0.5, md: 1.25}}}>
                        <Tabs
                            value={filter}
                            onChange={(_, value) => setFilter(value)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                minHeight: 48,
                                "& .MuiTabs-indicator": {
                                    height: 2,
                                    borderRadius: 999,
                                    bgcolor: APP_PRIMARY_DARK
                                },
                                "& .MuiTab-root": {
                                    minHeight: 48,
                                    px: {xs: 1.5, md: 2},
                                    textTransform: "none",
                                    fontWeight: 500,
                                    color: "#475569",
                                    fontSize: 13
                                },
                                "& .Mui-selected": {
                                    color: `${APP_PRIMARY_DARK} !important`
                                }
                            }}
                        >
                            {FILTERS.map((item) => (
                                <Tab
                                    key={item.value}
                                    value={item.value}
                                    label={`${item.label} (${getFilterCount(reservations, item)})`}
                                />
                            ))}
                        </Tabs>
                    </Box>

                    <Box sx={{px: {xs: 1.5, md: 2}, py: {xs: 2, md: 2.5}}}>
                        {loading ? (
                            <Box sx={{p: 5, textAlign: "center", borderRadius: 2, border: "1px dashed #d8dee8"}}>
                                <CircularProgress size={28} />
                                <Typography sx={{mt: 2, color: "#64748b", fontWeight: 400}}>
                                    Đang tải danh sách đơn đăng ký...
                                </Typography>
                            </Box>
                        ) : filteredReservations.length === 0 ? (
                            <Box sx={{p: 5, textAlign: "center", borderRadius: 2, border: "1px dashed #d8dee8"}}>
                                <AssignmentTurnedInRoundedIcon sx={{fontSize: 34, color: "#94a3b8", mb: 1.5}} />
                                <Typography sx={{fontWeight: 400, color: "#64748b"}}>
                                    Không có đơn đăng ký ở trạng thái này.
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={2.25}>
                                {filteredReservations.map((reservation, index) => (
                                    <ReservationCard
                                        key={reservation?.id ?? `${reservation?.studentName || "reservation"}-${index}`}
                                        reservation={reservation}
                                        onOpenDetail={setSelectedReservation}
                                        onOpenPayment={setPaymentReservation}
                                        onOpenConfirmEnrollment={setConfirmEnrollmentTarget}
                                        onOpenMandatoryDocuments={handleOpenMandatoryDocuments}
                                        onOpenCancelReservation={(r) => {
                                            setCancelReservationTarget(r);
                                            setCancelReason("");
                                        }}
                                        confirmEnrollmentLoadingId={confirmEnrollmentLoadingId}
                                    />
                                ))}
                            </Stack>
                        )}
                    </Box>
                </Paper>
            </Container>
            <DetailDialog reservation={selectedReservation} onClose={() => setSelectedReservation(null)} />
            <ReservationPaymentDialog
                reservation={paymentReservation}
                onClose={() => setPaymentReservation(null)}
                onSubmitted={({status, response} = {}) => {
                    const formId = Number(
                        paymentReservation?.admissionFormId ?? paymentReservation?.id,
                    );
                    setPaymentReservation(null);
                    void (async () => {
                        const rows = await loadReservations({silent: true});
                        const updatedRow =
                            Number.isFinite(formId) && formId > 0
                                ? rows.find(
                                      (row) =>
                                          Number(row?.admissionFormId ?? row?.id) === formId,
                                  )
                                : null;
                        const nextStatus =
                            updatedRow?.status ??
                            pickReservationStatusFromMutationResponse(response) ??
                            status ??
                            RESERVATION_STATUS.PAYMENT_PENDING;
                        setFilter(getParentReservationFilterValueForStatus(nextStatus));
                    })();
                }}
            />
            <MandatoryDocumentsDialog
                open={Boolean(mandatoryDocsReservation)}
                onClose={handleCloseMandatoryDocuments}
                loading={mandatoryDocsLoading}
                mandatoryDocuments={mandatoryDocsPayload.mandatoryDocuments}
                methodDocuments={mandatoryDocsPayload.methodDocuments}
                context={mandatoryDocsPayload.context}
            />
            <ConfirmDialog
                open={Boolean(confirmEnrollmentTarget)}
                title="Xác nhận nhập học"
                description="Bạn có chắc muốn xác nhận nhập học?"
                confirmText="Xác nhận nhập học"
                cancelText="Hủy"
                loading={confirmEnrollmentLoadingId != null}
                onCancel={() => {
                    if (confirmEnrollmentLoadingId != null) return;
                    setConfirmEnrollmentTarget(null);
                }}
                onConfirm={() => void handleConfirmEnrollment()}
            />
            <Dialog
                open={Boolean(cancelReservationTarget)}
                onClose={() => {
                    if (cancelLoading) return;
                    setCancelReservationTarget(null);
                    setCancelReason("");
                }}
                fullWidth
                maxWidth="sm"
                PaperProps={{sx: {borderRadius: 3}}}
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 3,
                        py: 2,
                        bgcolor: "#fff1f2",
                        borderBottom: "1px solid #fecaca",
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CancelOutlinedIcon sx={{color: "#dc2626"}} />
                        <Typography sx={{fontWeight: 700, color: "#dc2626", fontSize: 18}}>
                            Hủy hồ sơ
                        </Typography>
                    </Stack>
                    <IconButton
                        onClick={() => {
                            if (cancelLoading) return;
                            setCancelReservationTarget(null);
                            setCancelReason("");
                        }}
                        disabled={cancelLoading}
                    >
                        <CloseRoundedIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{px: 3, py: 2.5}}>
                    <Typography sx={{mb: 1.5, color: "#334155", fontSize: 14.5}}>
                        Bạn có chắc muốn hủy hồ sơ{" "}
                        <Box component="span" sx={{fontWeight: 700}}>
                            {cancelReservationTarget?.schoolName ?? "này"}
                        </Box>
                        ? Hành động này không thể hoàn tác.
                    </Typography>
                    <Box
                        sx={{
                            mb: 2,
                            px: 2,
                            py: 1.25,
                            borderRadius: 2,
                            bgcolor: "#fff7ed",
                            border: "1px solid #fdba74",
                        }}
                    >
                        <Typography sx={{fontSize: 13.5, color: "#b45309", fontWeight: 600}}>
                            Lưu ý: Tiền đặt cọc giữ chỗ tại trường sẽ không được hoàn lại sau khi hủy.
                        </Typography>
                    </Box>
                    <TextField
                        label="Lý do hủy"
                        required
                        multiline
                        minRows={3}
                        fullWidth
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        disabled={cancelLoading}
                        placeholder="Nhập lý do hủy hồ sơ..."
                        sx={{"& .MuiOutlinedInput-root": {borderRadius: 2}}}
                    />
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2.5, gap: 1}}>
                    <Button
                        variant="outlined"
                        disabled={cancelLoading}
                        onClick={() => {
                            setCancelReservationTarget(null);
                            setCancelReason("");
                        }}
                        sx={{textTransform: "none", borderRadius: 2, fontWeight: 600}}
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="contained"
                        disabled={cancelLoading || !cancelReason.trim()}
                        onClick={() => void handleCancelReservation()}
                        sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            fontWeight: 700,
                            bgcolor: "#dc2626",
                            "&:hover": {bgcolor: "#b91c1c"},
                            boxShadow: "0 4px 12px rgba(220,38,38,0.22)",
                        }}
                    >
                        {cancelLoading ? "Đang hủy..." : "Xác nhận hủy"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
