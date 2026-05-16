import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Link,
    Paper,
    Stack,
    Tab,
    Tabs,
    Typography
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import {enqueueSnackbar} from "notistack";
import {
    getParentAdmissionReservationForms,
    pickAdmissionReservationFormsFromResponse
} from "../../services/ParentService.jsx";
import {AdmissionDocumentsSection} from "./admission/AdmissionDocumentUploadFields.jsx";
import ReservationPaymentDialog from "./admission/ReservationPaymentDialog.jsx";
import {
    isReservationConfirmed,
    normalizeParentAdmissionReservationRow,
    reservationToReadonlyDocs,
    sanitizeReservationDisplayValue,
} from "./admission/admissionSubmissionUtils.js";
import {APP_PRIMARY_DARK, BRAND_NAVY} from "../../constants/homeLandingTheme";

const FILTERS = [
    {value: "ALL", label: "Tất cả"},
    {value: "PENDING", label: "Chờ duyệt", statuses: ["RESERVATION_PENDING", "PENDING"]},
    {
        value: "CONFIRMED",
        label: "Đã xác nhận",
        statuses: ["RESERVATION_APPROVAL", "RESERVATION_CONFIRMED", "CONFIRMED", "APPROVED", "ACCEPTED"]
    },
    {
        value: "PAYMENT_PENDING",
        label: "Chờ duyệt thanh toán",
        statuses: ["RESERVATION_PAYMENT_PENDING"]
    },
    {value: "REJECTED", label: "Từ chối", statuses: ["RESERVATION_REJECTED", "REJECTED"]},
    {value: "CANCELLED", label: "Đã hủy", statuses: ["RESERVATION_CANCELLED", "CANCELLED"]}
];

const STATUS_META = {
    RESERVATION_PENDING: {
        label: "Chờ duyệt",
        color: "#c2410c",
        bg: "#ffedd5",
        border: "#fed7aa"
    },
    PENDING: {
        label: "Chờ duyệt",
        color: "#c2410c",
        bg: "#ffedd5",
        border: "#fed7aa"
    },
    RESERVATION_CONFIRMED: {
        label: "Đã xác nhận",
        color: "#047857",
        bg: "#d1fae5",
        border: "#a7f3d0"
    },
    RESERVATION_APPROVAL: {
        label: "Đã xác nhận",
        color: "#047857",
        bg: "#d1fae5",
        border: "#a7f3d0"
    },
    CONFIRMED: {
        label: "Đã xác nhận",
        color: "#047857",
        bg: "#d1fae5",
        border: "#a7f3d0"
    },
    APPROVED: {
        label: "Đã xác nhận",
        color: "#047857",
        bg: "#d1fae5",
        border: "#a7f3d0"
    },
    RESERVATION_PAYMENT_PENDING: {
        label: "Chờ duyệt thanh toán",
        color: "#1d4ed8",
        bg: "#dbeafe",
        border: "#93c5fd"
    },
    REJECTED: {
        label: "Từ chối",
        color: "#b91c1c",
        bg: "#fee2e2",
        border: "#fecaca"
    },
    RESERVATION_REJECTED: {
        label: "Từ chối",
        color: "#b91c1c",
        bg: "#fee2e2",
        border: "#fecaca"
    },
    CANCELLED: {
        label: "Đã hủy",
        color: "#475569",
        bg: "#e2e8f0",
        border: "#cbd5e1"
    },
    RESERVATION_CANCELLED: {
        label: "Đã hủy",
        color: "#475569",
        bg: "#e2e8f0",
        border: "#cbd5e1"
    }
};

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
    const key = String(status || "").trim().toUpperCase();
    return STATUS_META[key] || {
        label: hasText(status) ? String(status).replaceAll("_", " ") : "Đang xử lý",
        color: "#334155",
        bg: "#e2e8f0",
        border: "#cbd5e1"
    };
};

const getFilterCount = (rows, filter) => {
    if (filter.value === "ALL") return rows.length;
    const allowed = new Set(filter.statuses || []);
    return rows.filter((row) => allowed.has(String(row?.status || "").trim().toUpperCase())).length;
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

function ReservationCard({reservation, onOpenDetail, onOpenPayment}) {
    const statusMeta = getStatusMeta(reservation?.status);
    const showPayment = isReservationConfirmed(reservation?.status);
    const cardTitle = isDisplayableValue(reservation?.schoolName)
        ? reservation.schoolName
        : isDisplayableValue(reservation?.studentName)
          ? reservation.studentName
          : "Đơn đăng ký";
    const submittedDate = formatDateOnly(reservation?.createdTime);

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
                        {isDisplayableValue(reservation?.studentCode) ? (
                            <Typography sx={{fontSize: 13.5, color: "#64748b", mb: 0.75}}>
                                CCCD học sinh: {reservation.studentCode}
                            </Typography>
                        ) : null}
                        <Stack spacing={0.75}>
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
                        </Stack>
                    </Box>
                </Stack>
                <Stack
                    direction={{xs: "column", sm: "row"}}
                    spacing={1}
                    sx={{flex: {xs: "1 1 auto", md: "0 0 auto"}, width: {xs: "100%", md: "auto"}}}
                >
                    {showPayment ? (
                        <Button
                            variant="contained"
                            startIcon={<PaymentsRoundedIcon />}
                            onClick={() => onOpenPayment(reservation)}
                            sx={{
                                borderRadius: 999,
                                px: 2.4,
                                fontWeight: 600,
                                bgcolor: "#059669",
                                boxShadow: "0 8px 18px rgba(5, 150, 105, 0.22)",
                                "&:hover": {bgcolor: "#047857"},
                                flex: {xs: "1 1 auto", sm: "0 0 auto"},
                            }}
                        >
                            Thanh toán
                        </Button>
                    ) : null}
                    <Button
                        variant="outlined"
                        startIcon={<ArticleOutlinedIcon />}
                        onClick={() => onOpenDetail(reservation)}
                        sx={{
                            borderRadius: 999,
                            px: 2.4,
                            fontWeight: 500,
                            borderColor: "#bfdbfe",
                            color: BRAND_NAVY,
                            flex: {xs: "1 1 auto", sm: "0 0 auto"},
                        }}
                    >
                        Xem chi tiết
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
}

function DetailDialog({reservation, onClose}) {
    const open = Boolean(reservation);
    const statusMeta = getStatusMeta(reservation?.status);
    const readonlyDocs = useMemo(
        () => (reservation ? reservationToReadonlyDocs(reservation) : []),
        [reservation],
    );
    const detailTitleSuffix = isDisplayableValue(reservation?.studentName)
        ? ` — ${reservation.studentName}`
        : isDisplayableValue(reservation?.schoolName)
          ? ` — ${reservation.schoolName}`
          : "";

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
                        <DetailSection title="Thông tin học sinh">
                            <DetailLineRow label="Học sinh" value={reservation?.studentName} />
                            <DetailLineRow label="Giới tính" value={getGenderLabel(reservation?.gender)} />
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
                            <DetailLineRow
                                label="Mã gói tuyển sinh"
                                value={
                                    reservation?.campusProgramOfferingId != null
                                        ? String(reservation.campusProgramOfferingId)
                                        : null
                                }
                            />
                            <DetailLineRow label="Ngày nộp" value={formatDateOnly(reservation?.createdTime) ?? undefined} />
                            <DetailLineRow label="Mã chuyển" value={reservation?.transferCode} />
                            <DetailLineRow label="Lý do từ chối" value={reservation?.rejectReason} />
                            <DetailLineRow label="Lý do hủy" value={reservation?.cancelReason} />
                            {isDisplayableValue(reservation?.paymentProofUrl) ? (
                                <Box sx={{py: 0.8, borderBottom: "1px dashed #c7d8ea"}}>
                                    <Typography sx={{fontSize: 14.5, color: "#1e293b"}}>
                                        <Box component="span" sx={{color: "#2563eb", fontWeight: 700}}>
                                            Minh chứng thanh toán:
                                        </Box>{" "}
                                        <Link
                                            href={reservation.paymentProofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{fontWeight: 600}}
                                        >
                                            Xem ảnh / tệp
                                        </Link>
                                    </Typography>
                                </Box>
                            ) : null}
                        </DetailSection>

                        <Paper
                            elevation={0}
                            sx={{p: 2, borderRadius: 3, border: "1px solid #c7e2f8", bgcolor: "rgba(255,255,255,0.65)"}}
                        >
                            <Typography sx={{fontWeight: 700, color: BRAND_NAVY, mb: 1.5}}>
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
                                emptyMessage="Chưa có ảnh minh chứng trong đơn này."
                            />
                        </Paper>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function ParentAdmissionReservationsPage() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [paymentReservation, setPaymentReservation] = useState(null);
    const mountedRef = useRef(true);

    const loadReservations = useCallback(async ({silent = false} = {}) => {
        if (!silent) setLoading(true);
        try {
            const response = await getParentAdmissionReservationForms();
            const raw = pickAdmissionReservationFormsFromResponse(response);
            const rows = raw
                .map((item, index) => normalizeParentAdmissionReservationRow(item, index))
                .filter(Boolean);
            if (mountedRef.current) setReservations(rows);
        } catch (error) {
            console.error("[ParentAdmissionReservationsPage] load error:", error);
            if (mountedRef.current && !silent) {
                setReservations([]);
                enqueueSnackbar("Không thể tải danh sách đơn đăng ký. Vui lòng thử lại sau.", {variant: "error"});
            }
        } finally {
            if (mountedRef.current && !silent) setLoading(false);
        }
    }, []);

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

    const filteredReservations = useMemo(() => {
        if (filter === "ALL") return reservations;
        const currentFilter = FILTERS.find((item) => item.value === filter);
        const allowed = new Set(currentFilter?.statuses || []);
        return reservations.filter((row) => allowed.has(String(row?.status || "").trim().toUpperCase()));
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
                onSubmitted={() => {
                    setPaymentReservation(null);
                    void loadReservations({silent: true});
                }}
            />
        </Box>
    );
}
