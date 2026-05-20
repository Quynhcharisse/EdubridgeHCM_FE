import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Paper,
    Radio,
    Stack,
    Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import {enqueueSnackbar} from "notistack";
import {
    getParentProgramsOffering,
    getParentQrCodeInfo,
    pickParentProgramsOfferingFromResponse,
    pickParentQrCodeInfoFromResponse,
    putParentAdmissionReservationFormPayment,
} from "../../../services/ParentService.jsx";
import ImageUpload from "../../ui/ImageUpload.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import {RESERVATION_STATUS} from "../../../constants/reservationStatusConfig.js";
import {isCloudinaryConfigured} from "../../../utils/cloudinaryUpload.js";
import {buildVietQrImageUrl} from "../../../utils/vietQr.js";
import {BRAND_NAVY} from "../../../constants/homeLandingTheme";
import {
    MAX_PARENT_PAYMENT_AGAIN_ATTEMPTS,
    canParentRetryReservationPayment,
    isParentReservationPaymentAgain,
    pickReservationPaymentAgainCount,
} from "../../../constants/reservationStatusConfig.js";

const ADMISSION_METHOD_LABELS = {
    HOC_BA: "Xét học bạ",
    THI_TUYEN: "Thi tuyển",
    XET_TUYEN: "Xét tuyển",
};

function formatVnd(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return null;
    return `${new Intl.NumberFormat("vi-VN", {maximumFractionDigits: 0}).format(amount)} đ`;
}

function formatDateOnly(value) {
    if (value == null || String(value).trim() === "") return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).trim();
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function admissionMethodLabel(code) {
    const key = String(code ?? "").trim().toUpperCase();
    if (!key) return null;
    return ADMISSION_METHOD_LABELS[key] || key.replaceAll("_", " ");
}

function pickAdmissionFormId(reservation) {
    const id = Number(reservation?.admissionFormId ?? reservation?.id);
    return Number.isFinite(id) && id > 0 ? Math.trunc(id) : null;
}

function OfferingOptionCard({offering, selected, onSelect}) {
    const disabled = !offering.canSubmit;
    const programName = String(offering?.programName ?? "").trim() || "Chương trình";
    const method = admissionMethodLabel(offering?.admissionMethod);
    const openDate = formatDateOnly(offering?.openDate);
    const closeDate = formatDateOnly(offering?.closeDate);
    const quota =
        Number.isFinite(Number(offering?.remainingQuota)) && Number.isFinite(Number(offering?.quota))
            ? `Còn ${offering.remainingQuota}/${offering.quota} chỗ`
            : null;
    const reason = String(offering?.unavailableReason ?? "").trim();

    return (
        <Paper
            elevation={0}
            onClick={disabled ? undefined : onSelect}
            sx={{
                p: 1.75,
                borderRadius: 2,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.62 : 1,
                border: selected ? "2px solid #2563eb" : "1px solid #cfe5fb",
                bgcolor: selected ? "rgba(239,246,255,0.85)" : "#fff",
                boxShadow: selected ? "0 8px 20px rgba(37,99,235,0.12)" : "0 4px 12px rgba(37, 99, 235, 0.05)",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease",
                ...(!disabled && {
                    "&:hover": {
                        borderColor: "#93c5fd",
                        boxShadow: "0 8px 20px rgba(37,99,235,0.1)",
                    },
                }),
            }}
        >
            <Stack direction="row" alignItems="flex-start" spacing={1}>
                <Radio
                    checked={selected}
                    disabled={disabled}
                    size="small"
                    sx={{mt: -0.25, p: 0.5}}
                />
                <Box sx={{minWidth: 0, flex: 1}}>
                    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75} sx={{mb: 0.35}}>
                        <Typography sx={{fontWeight: 700, color: BRAND_NAVY, fontSize: 15, lineHeight: 1.35}}>
                            {programName}
                        </Typography>
                        {!offering.canSubmit ? (
                            <Chip label="Không khả dụng" size="small" color="default" sx={{height: 22}} />
                        ) : null}
                    </Stack>
                    {method ? (
                        <Typography sx={{fontSize: 13, color: "#64748b"}}>
                            Phương thức: {method}
                        </Typography>
                    ) : null}
                    {openDate || closeDate ? (
                        <Typography sx={{fontSize: 13, color: "#475569", mt: 0.25}}>
                            {openDate && closeDate
                                ? `Mở đăng ký: ${openDate} – ${closeDate}`
                                : openDate
                                  ? `Mở từ: ${openDate}`
                                  : `Đến: ${closeDate}`}
                        </Typography>
                    ) : null}
                    {quota ? (
                        <Typography sx={{fontSize: 13, color: "#047857", fontWeight: 600, mt: 0.45}}>
                            {quota}
                        </Typography>
                    ) : null}
                    {reason ? (
                        <Typography sx={{fontSize: 12.5, color: "#b91c1c", mt: 0.5}}>
                            {reason}
                        </Typography>
                    ) : null}
                </Box>
            </Stack>
        </Paper>
    );
}

function LockedProgramDisplay({reservation}) {
    const programName = String(reservation?.programName ?? "").trim() || "Chương trình đã chọn";
    const method = admissionMethodLabel(reservation?.admissionMethodCode ?? reservation?.methodName);
    return (
        <Paper
            elevation={0}
            sx={{
                p: 1.75,
                borderRadius: 2,
                border: "2px solid #2563eb",
                bgcolor: "rgba(239,246,255,0.85)",
                boxShadow: "0 8px 20px rgba(37,99,235,0.12)",
            }}
        >
            <Typography sx={{fontWeight: 700, color: BRAND_NAVY, fontSize: 15, lineHeight: 1.35}}>
                {programName}
            </Typography>
            {method ? (
                <Typography sx={{fontSize: 13, color: "#64748b", mt: 0.5}}>
                    Phương thức: {method}
                </Typography>
            ) : null}
            <Typography sx={{fontSize: 12.5, color: "#64748b", mt: 1, lineHeight: 1.5}}>
                Chương trình học đã chọn khi thanh toán lần đầu — không thể thay đổi khi thanh toán lại.
            </Typography>
        </Paper>
    );
}

export default function ReservationPaymentDialog({reservation, onClose, onSubmitted}) {
    const open = Boolean(reservation);
    const admissionFormId = pickAdmissionFormId(reservation);
    const schoolName = String(reservation?.schoolName ?? "").trim() || "Trường";
    const cloudinaryReady = isCloudinaryConfigured();
    const isPaymentAgain = isParentReservationPaymentAgain(reservation);
    const paymentAgainCount = pickReservationPaymentAgainCount(reservation);
    const paymentAgainRemaining = Math.max(0, MAX_PARENT_PAYMENT_AGAIN_ATTEMPTS - paymentAgainCount);
    const canRetryPayment = canParentRetryReservationPayment(reservation);
    const paymentRejectReason = String(reservation?.rejectReason ?? "").trim();

    const [offeringsLoading, setOfferingsLoading] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [offerings, setOfferings] = useState([]);
    const [bankInfo, setBankInfo] = useState(null);
    const [reservationFee, setReservationFee] = useState(null);
    const [selectedOfferingId, setSelectedOfferingId] = useState(null);
    const [paymentUrl, setPaymentUrl] = useState(null);
    const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false);

    useEffect(() => {
        if (!open) {
            setOfferings([]);
            setBankInfo(null);
            setReservationFee(null);
            setSelectedOfferingId(null);
            setPaymentUrl(null);
            setSubmitting(false);
            setPaymentConfirmOpen(false);
            return undefined;
        }

        setPaymentUrl(isPaymentAgain ? null : String(reservation?.paymentProofUrl ?? "").trim() || null);

        const presetId = Number(reservation?.campusProgramOfferingId);
        if (Number.isFinite(presetId) && presetId > 0) {
            setSelectedOfferingId(presetId);
        } else {
            setSelectedOfferingId(null);
        }

        if (!admissionFormId) {
            enqueueSnackbar("Không xác định được mã đơn để thanh toán.", {variant: "warning"});
            return undefined;
        }

        let cancelled = false;

        if (!isPaymentAgain) {
            setOfferingsLoading(true);
            (async () => {
                try {
                    const res = await getParentProgramsOffering(admissionFormId);
                    if (cancelled) return;
                    const list = pickParentProgramsOfferingFromResponse(res);
                    setOfferings(list);
                    if (list.length === 0) {
                        enqueueSnackbar("Chưa có chương trình được phép giữ chỗ.", {variant: "info"});
                    } else if (!Number.isFinite(presetId) || presetId <= 0) {
                        const firstSelectable = list.find((o) => o.canSubmit);
                        if (firstSelectable) {
                            setSelectedOfferingId(firstSelectable.campusProgramOfferingId);
                        }
                    }
                } catch (error) {
                    if (cancelled) return;
                    console.error("[ReservationPaymentDialog] load offerings:", error);
                    setOfferings([]);
                    enqueueSnackbar(
                        error?.response?.data?.message || "Không tải được danh sách chương trình.",
                        {variant: "error"},
                    );
                } finally {
                    if (!cancelled) setOfferingsLoading(false);
                }
            })();
        } else {
            setOfferings([]);
            setOfferingsLoading(false);
        }

        setQrLoading(true);

        (async () => {
            try {
                const res = await getParentQrCodeInfo(admissionFormId);
                if (cancelled) return;
                const {bankInfo: bank, reservationFee: fee} = pickParentQrCodeInfoFromResponse(res);
                setBankInfo(bank);
                setReservationFee(fee);
            } catch (error) {
                if (cancelled) return;
                console.error("[ReservationPaymentDialog] load qr info:", error);
                setBankInfo(null);
                setReservationFee(null);
                enqueueSnackbar(
                    error?.response?.data?.message || "Không tải được thông tin thanh toán.",
                    {variant: "error"},
                );
            } finally {
                if (!cancelled) setQrLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, admissionFormId, isPaymentAgain, reservation?.campusProgramOfferingId, reservation?.paymentProofUrl]);

    const vietQrUrl = useMemo(
        () => buildVietQrImageUrl(bankInfo, {amount: reservationFee}),
        [bankInfo, reservationFee],
    );
    const selectedOffering = useMemo(
        () =>
            offerings.find((o) => o.campusProgramOfferingId === selectedOfferingId) ?? null,
        [offerings, selectedOfferingId],
    );
    const reservationFeeLabel = formatVnd(reservationFee);

    const titleSuffix = reservation?.studentName ? ` — ${reservation.studentName}` : "";

    const validateBeforePaymentSubmit = useCallback(() => {
        if (!admissionFormId) {
            enqueueSnackbar("Không xác định được mã đơn.", {variant: "warning"});
            return false;
        }
        if (!selectedOfferingId) {
            enqueueSnackbar(
                isPaymentAgain
                    ? "Không xác định được chương trình học của đơn."
                    : "Vui lòng chọn chương trình học.",
                {variant: "warning"},
            );
            return false;
        }
        if (isPaymentAgain && !canRetryPayment) {
            enqueueSnackbar(
                `Đã vượt quá ${MAX_PARENT_PAYMENT_AGAIN_ATTEMPTS} lần thanh toán lại. Vui lòng liên hệ nhà trường.`,
                {variant: "warning"},
            );
            return false;
        }
        const url = String(paymentUrl ?? "").trim();
        if (!url) {
            enqueueSnackbar("Vui lòng tải ảnh minh chứng thanh toán.", {variant: "warning"});
            return false;
        }
        if (!cloudinaryReady && !/^https?:\/\//i.test(url)) {
            enqueueSnackbar("Chưa cấu hình Cloudinary, không thể tải ảnh lên.", {variant: "error"});
            return false;
        }
        return true;
    }, [
        admissionFormId,
        canRetryPayment,
        cloudinaryReady,
        isPaymentAgain,
        paymentUrl,
        selectedOfferingId,
    ]);

    const handleSubmitPayment = useCallback(async () => {
        if (!validateBeforePaymentSubmit()) return;

        const url = String(paymentUrl ?? "").trim();
        setSubmitting(true);
        try {
            const res = await putParentAdmissionReservationFormPayment({
                admissionFormId,
                campusProgramOfferingId: selectedOfferingId,
                paymentUrl: url,
                action: isPaymentAgain ? "payment-again" : "payment",
            });
            enqueueSnackbar(
                isPaymentAgain
                    ? "Nộp minh chứng thanh toán lại thành công."
                    : "Nộp minh chứng thanh toán thành công.",
                {variant: "success"},
            );
            setPaymentConfirmOpen(false);
            const nextStatus =
                res?.data?.body?.status ??
                res?.data?.status ??
                RESERVATION_STATUS.PAYMENT_PENDING;
            if (typeof onSubmitted === "function") onSubmitted({status: nextStatus, response: res});
            else if (typeof onClose === "function") onClose();
        } catch (error) {
            console.error("[ReservationPaymentDialog] submit payment:", error);
            enqueueSnackbar(
                error?.response?.data?.message || error?.message || "Nộp minh chứng thanh toán thất bại.",
                {variant: "error"},
            );
        } finally {
            setSubmitting(false);
        }
    }, [
        admissionFormId,
        isPaymentAgain,
        onClose,
        onSubmitted,
        paymentUrl,
        selectedOfferingId,
        validateBeforePaymentSubmit,
    ]);

    const handleRequestPaymentSubmit = useCallback(() => {
        if (!validateBeforePaymentSubmit()) return;
        setPaymentConfirmOpen(true);
    }, [validateBeforePaymentSubmit]);

    const handleDialogClose = useCallback(() => {
        if (submitting) return;
        if (paymentConfirmOpen) {
            setPaymentConfirmOpen(false);
            return;
        }
        if (typeof onClose === "function") onClose();
    }, [onClose, paymentConfirmOpen, submitting]);

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            fullWidth
            maxWidth="lg"
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
                <Stack direction="row" alignItems="center" spacing={1}>
                    <PaymentsRoundedIcon sx={{color: BRAND_NAVY}} />
                    <Box>
                        <Typography sx={{fontSize: 20, fontWeight: 700, color: "#0f172a"}}>
                            {isPaymentAgain ? "Thanh toán lại" : "Thanh toán giữ chỗ"}
                            {titleSuffix}
                        </Typography>
                        <Typography sx={{fontSize: 13.5, color: "#475569", mt: 0.25}}>
                            {schoolName}
                        </Typography>
                    </Box>
                </Stack>
                <IconButton onClick={handleDialogClose} disabled={submitting} aria-label="Đóng">
                    <CloseRoundedIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{bgcolor: "#e8f4fc", borderColor: "#b8d8f4", p: {xs: 2, md: 3}}}>
                {isPaymentAgain && paymentRejectReason ? (
                    <Alert severity="error" sx={{borderRadius: 2, mb: 2}}>
                        <Typography sx={{fontWeight: 700, fontSize: 14, mb: 0.35}}>
                            Lý do từ chối thanh toán
                        </Typography>
                        <Typography sx={{fontSize: 14, lineHeight: 1.5}}>{paymentRejectReason}</Typography>
                    </Alert>
                ) : null}
                <Stack
                    direction={{xs: "column", md: "row"}}
                    spacing={2.5}
                    alignItems="stretch"
                    sx={{minHeight: {md: 360}}}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            flex: 1,
                            p: 2,
                            borderRadius: 3,
                            border: "1px solid #c7e2f8",
                            bgcolor: "rgba(255,255,255,0.72)",
                            minWidth: 0,
                        }}
                    >
                        <Typography sx={{fontWeight: 700, color: BRAND_NAVY, mb: 1.5}}>
                            {isPaymentAgain ? "Chương trình học" : "Chọn chương trình học"}
                        </Typography>
                        {isPaymentAgain ? (
                            <LockedProgramDisplay reservation={reservation} />
                        ) : offeringsLoading ? (
                            <Box sx={{py: 5, textAlign: "center"}}>
                                <CircularProgress size={28} />
                                <Typography sx={{mt: 1.5, color: "#64748b", fontSize: 14}}>
                                    Đang tải chương trình...
                                </Typography>
                            </Box>
                        ) : offerings.length === 0 ? (
                            <Box
                                sx={{
                                    py: 4,
                                    px: 2,
                                    textAlign: "center",
                                    borderRadius: 2,
                                    border: "1px dashed #cbd5e1",
                                    bgcolor: "#f8fafc",
                                }}
                            >
                                <Typography sx={{color: "#64748b"}}>
                                    Chưa có chương trình để chọn. Vui lòng liên hệ nhà trường.
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={1.25} sx={{maxHeight: {md: 420}, overflowY: "auto", pr: 0.5}}>
                                {offerings.map((offering) => (
                                    <OfferingOptionCard
                                        key={offering.campusProgramOfferingId}
                                        offering={offering}
                                        selected={
                                            selectedOfferingId === offering.campusProgramOfferingId
                                        }
                                        onSelect={() =>
                                            setSelectedOfferingId(offering.campusProgramOfferingId)
                                        }
                                    />
                                ))}
                            </Stack>
                        )}
                        {!isPaymentAgain && selectedOffering ? (
                            <Box sx={{mt: 2, pt: 1.5, borderTop: "1px dashed #c7d8ea"}}>
                                <Typography sx={{fontSize: 13, color: "#64748b"}}>
                                    Đã chọn:{" "}
                                    <Box component="span" sx={{fontWeight: 700, color: BRAND_NAVY}}>
                                        {selectedOffering.programName || "Chương trình"}
                                    </Box>
                                </Typography>
                            </Box>
                        ) : null}
                    </Paper>

                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{display: {xs: "none", md: "block"}, borderColor: "#b8d8f4"}}
                    />

                    <Paper
                        elevation={0}
                        sx={{
                            flex: 1,
                            p: 2,
                            borderRadius: 3,
                            border: "1px solid #c7e2f8",
                            bgcolor: "rgba(255,255,255,0.72)",
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1} sx={{mb: 1.5}}>
                            <QrCode2RoundedIcon sx={{color: BRAND_NAVY}} />
                            <Typography sx={{fontWeight: 700, color: BRAND_NAVY}}>
                                Quét mã QR thanh toán
                            </Typography>
                        </Stack>

                        {reservationFeeLabel ? (
                            <Box
                                sx={{
                                    mb: 2,
                                    px: 1.75,
                                    py: 1.25,
                                    borderRadius: 2,
                                    bgcolor: "rgba(209,250,229,0.65)",
                                    border: "1px solid #a7f3d0",
                                }}
                            >
                                <Typography sx={{fontSize: 13, color: "#047857", fontWeight: 600}}>
                                    Phí giữ chỗ
                                </Typography>
                                <Typography sx={{fontSize: 22, fontWeight: 800, color: "#065f46", lineHeight: 1.2}}>
                                    {reservationFeeLabel}
                                </Typography>
                            </Box>
                        ) : null}

                        <Typography sx={{fontSize: 13.5, color: "#64748b", mb: 2}}>
                            Quét mã VietQR và chuyển khoản đúng số tiền phí giữ chỗ. Sau khi thanh toán, vui lòng
                            lưu biên lai.
                        </Typography>

                        {qrLoading ? (
                            <Box sx={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center"}}>
                                <CircularProgress size={28} />
                            </Box>
                        ) : (
                            <>
                                {bankInfo ? (
                                    <Stack spacing={1} sx={{mb: 2}}>
                                        {bankInfo.bankName ? (
                                            <Typography sx={{fontSize: 14, color: "#1e293b"}}>
                                                <Box component="span" sx={{fontWeight: 700, color: "#2563eb"}}>
                                                    Ngân hàng:
                                                </Box>{" "}
                                                {bankInfo.bankName}
                                            </Typography>
                                        ) : null}
                                        <Typography sx={{fontSize: 14, color: "#1e293b"}}>
                                            <Box component="span" sx={{fontWeight: 700, color: "#2563eb"}}>
                                                Số tài khoản:
                                            </Box>{" "}
                                            {bankInfo.accountNo}
                                        </Typography>
                                        {bankInfo.accountName ? (
                                            <Typography sx={{fontSize: 14, color: "#1e293b"}}>
                                                <Box component="span" sx={{fontWeight: 700, color: "#2563eb"}}>
                                                    Chủ tài khoản:
                                                </Box>{" "}
                                                {bankInfo.accountName}
                                            </Typography>
                                        ) : null}
                                    </Stack>
                                ) : null}

                                <Box
                                    sx={{
                                        flex: 1,
                                        minHeight: 220,
                                        borderRadius: 2,
                                        border: "1px dashed #cbd5e1",
                                        bgcolor: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        p: 2,
                                    }}
                                >
                                    {vietQrUrl ? (
                                        <Box
                                            component="img"
                                            src={vietQrUrl}
                                            alt={`Mã QR thanh toán ${schoolName}`}
                                            sx={{
                                                width: "100%",
                                                maxWidth: 280,
                                                height: "auto",
                                                objectFit: "contain",
                                            }}
                                        />
                                    ) : (
                                        <Typography
                                            variant="body2"
                                            sx={{color: "#64748b", textAlign: "center", px: 2}}
                                        >
                                            {bankInfo
                                                ? "Không tạo được mã QR. Vui lòng chuyển khoản thủ công theo thông tin tài khoản phía trên."
                                                : "Trường chưa cấu hình thông tin tài khoản thanh toán. Vui lòng liên hệ nhà trường."}
                                        </Typography>
                                    )}
                                </Box>
                            </>
                        )}
                    </Paper>
                </Stack>

                <Paper
                    elevation={0}
                    sx={{
                        mt: 2.5,
                        p: 2,
                        borderRadius: 3,
                        border: "1px solid #c7e2f8",
                        bgcolor: "rgba(255,255,255,0.72)",
                    }}
                >
                    <Typography sx={{fontWeight: 700, color: BRAND_NAVY, mb: 0.75}}>
                        Nộp minh chứng thanh toán
                    </Typography>
                    <Typography sx={{fontSize: 13.5, color: "#64748b", mb: isPaymentAgain ? 1.5 : 2}}>
                        Tải ảnh biên lai / screenshot chuyển khoản sau khi đã thanh toán phí giữ chỗ.
                    </Typography>
                    {isPaymentAgain ? (
                        <Stack spacing={1.25} sx={{mb: 2}}>
                            <Alert severity="warning" sx={{borderRadius: 2}}>
                                <Typography sx={{fontSize: 14, lineHeight: 1.55}}>
                                    Lưu ý: Thanh toán lại tối đa {MAX_PARENT_PAYMENT_AGAIN_ATTEMPTS} lần đối với các
                                    đơn bị từ chối thanh toán.
                                    {paymentAgainCount > 0
                                        ? ` (Đã thanh toán lại ${paymentAgainCount}/${MAX_PARENT_PAYMENT_AGAIN_ATTEMPTS} lần${
                                              paymentAgainRemaining > 0
                                                  ? `, còn ${paymentAgainRemaining} lần`
                                                  : ", đã hết lượt"
                                          })`
                                        : ""}
                                </Typography>
                            </Alert>
                            {!canRetryPayment ? (
                                <Alert severity="error" sx={{borderRadius: 2}}>
                                    Bạn đã hết lượt thanh toán lại. Vui lòng liên hệ nhà trường để được hỗ trợ.
                                </Alert>
                            ) : null}
                        </Stack>
                    ) : null}
                    {!cloudinaryReady ? (
                        <Typography sx={{fontSize: 13, color: "#b45309", mb: 1.5}}>
                            Chưa cấu hình Cloudinary — không thể tải ảnh mới lên.
                        </Typography>
                    ) : null}
                    <Box
                        sx={{
                            width: "100%",
                            maxWidth: 360,
                            mx: "auto",
                        }}
                    >
                        <ImageUpload
                            value={paymentUrl}
                            onChange={setPaymentUrl}
                            onError={(msg) => enqueueSnackbar(msg, {variant: "warning"})}
                            disabled={submitting || !cloudinaryReady}
                            receiptPreview
                            receiptPreviewHeight={400}
                            previewFit="contain"
                        />
                    </Box>
                    <Box sx={{mt: 2, display: "flex", justifyContent: "flex-end"}}>
                        <Button
                            variant="contained"
                            onClick={handleRequestPaymentSubmit}
                            disabled={
                                submitting ||
                                (!isPaymentAgain && offeringsLoading) ||
                                !selectedOfferingId ||
                                !String(paymentUrl ?? "").trim() ||
                                (isPaymentAgain && !canRetryPayment)
                            }
                            sx={{
                                borderRadius: 999,
                                px: 2.75,
                                fontWeight: 600,
                                bgcolor: "#059669",
                                "&:hover": {bgcolor: "#047857"},
                            }}
                        >
                            {submitting
                                ? "Đang gửi..."
                                : isPaymentAgain
                                  ? "Thanh toán lại"
                                  : "Thanh toán"}
                        </Button>
                    </Box>
                </Paper>
            </DialogContent>
            <ConfirmDialog
                open={paymentConfirmOpen}
                title={isPaymentAgain ? "Xác nhận thanh toán lại" : "Xác nhận thanh toán"}
                description={
                    isPaymentAgain
                        ? "Bạn có chắc muốn gửi minh chứng thanh toán lại cho đơn này?"
                        : "Bạn có chắc muốn gửi minh chứng thanh toán phí giữ chỗ?"
                }
                confirmText={isPaymentAgain ? "Thanh toán lại" : "Thanh toán"}
                cancelText="Hủy"
                loading={submitting}
                onCancel={() => {
                    if (submitting) return;
                    setPaymentConfirmOpen(false);
                }}
                onConfirm={() => void handleSubmitPayment()}
            />
        </Dialog>
    );
}
