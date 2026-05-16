import React from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import {
    AssignmentTurnedIn as AssignmentTurnedInIcon,
    Close as CloseIcon,
} from "@mui/icons-material";
import {
    getParentAdmissionDocuments,
    getParentStudent,
    pickAdmissionDocumentsFromResponse,
    postParentAdmissionReservationForm,
} from "../../../services/ParentService.jsx";
import {getProfile} from "../../../services/AccountService.jsx";
import {showErrorSnackbar, showSuccessSnackbar, showWarningSnackbar} from "../../ui/AppSnackbar.jsx";
import {isCloudinaryConfigured, uploadFileToCloudinary} from "../../../utils/cloudinaryUpload.js";
import {AdmissionDocumentsSection} from "../admission/AdmissionDocumentUploadFields.jsx";
import StudentProfilePicker from "../admission/StudentProfilePicker.jsx";
import {
    buildInitialDocsState,
    buildSubmissionDocumentsPayload,
    formatBytes,
    isAllowedImage,
    mapStudentsForPicker,
    MAX_IMAGE_BYTES,
    pickOfferingProgramName,
    SECTION_LABEL_SX,
    validateDocsForSubmit,
} from "../admission/admissionSubmissionUtils.js";

function pickParentInfoFromProfileResponse(response) {
    const rawBody = response?.data?.body ?? response?.body ?? null;
    let body = rawBody;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch {
            body = null;
        }
    }
    const parent = body?.parent || {};
    const name = String(parent?.name || body?.name || body?.fullName || "").trim();
    const phone = String(
        parent?.phone || body?.phone || body?.phoneNumber || body?.mobile || body?.phoneNo || ""
    ).trim();
    const email = String(parent?.email || body?.email || "").trim();
    return {name, phone, email};
}

export default function AdmissionReservationDialog({
    open,
    onClose,
    offering,
    campaign,
    school,
    onSubmitted,
}) {
    const offeringId = React.useMemo(() => {
        const raw = offering?.id;
        if (raw == null) return null;
        const num = Number(raw);
        return Number.isFinite(num) && num > 0 ? num : null;
    }, [offering?.id]);

    const [docsLoading, setDocsLoading] = React.useState(false);
    const [docsError, setDocsError] = React.useState("");
    const [docs, setDocs] = React.useState([]);

    const [studentLoading, setStudentLoading] = React.useState(false);
    const [studentError, setStudentError] = React.useState("");
    const [students, setStudents] = React.useState([]);
    const [selectedStudentId, setSelectedStudentId] = React.useState(null);

    const [parentInfo, setParentInfo] = React.useState({
        name: "",
        phone: "",
        email: "",
    });

    const [uploadingSlots, setUploadingSlots] = React.useState(() => new Set());
    const [submitting, setSubmitting] = React.useState(false);

    const cloudinaryReady = isCloudinaryConfigured();

    const resetState = React.useCallback(() => {
        setDocs([]);
        setDocsError("");
        setStudentError("");
        setUploadingSlots(new Set());
        setSubmitting(false);
    }, []);

    React.useEffect(() => {
        if (!open) {
            resetState();
            return undefined;
        }
        if (offeringId == null) {
            setDocs([]);
            setDocsError("Không xác định được gói tuyển sinh để tải danh sách hồ sơ.");
            return undefined;
        }
        let cancelled = false;
        setDocsLoading(true);
        setDocsError("");
        (async () => {
            try {
                const res = await getParentAdmissionDocuments(offeringId);
                if (cancelled) return;
                const {required, optional} = pickAdmissionDocumentsFromResponse(res);
                const initial = buildInitialDocsState(required, optional);
                setDocs(initial);
                if (initial.length === 0) {
                    setDocsError("Nhà trường chưa cấu hình danh sách hồ sơ cần nộp cho gói này.");
                }
            } catch (err) {
                if (cancelled) return;
                console.error("[AdmissionReservationDialog] load docs error:", err);
                setDocs([]);
                setDocsError(err?.response?.data?.message || err?.message || "Không tải được danh sách hồ sơ.");
            } finally {
                if (!cancelled) setDocsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, offeringId, resetState]);

    React.useEffect(() => {
        if (!open) return undefined;
        let cancelled = false;
        setStudentLoading(true);
        setStudentError("");
        (async () => {
            try {
                const res = await getParentStudent();
                if (cancelled) return;
                const list = mapStudentsForPicker(res);
                setStudents(list);
                if (list.length === 0) {
                    setStudentError("Bạn chưa có hồ sơ học sinh nào. Vui lòng thêm hồ sơ trước khi nộp đơn.");
                    setSelectedStudentId(null);
                } else {
                    setSelectedStudentId((prev) => {
                        if (prev != null && list.some((s) => s.id === prev)) return prev;
                        return list[0].id;
                    });
                }
            } catch (err) {
                if (cancelled) return;
                console.error("[AdmissionReservationDialog] load students error:", err);
                setStudents([]);
                setSelectedStudentId(null);
                setStudentError(err?.response?.data?.message || err?.message || "Không tải được danh sách hồ sơ học sinh.");
            } finally {
                if (!cancelled) setStudentLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open]);

    React.useEffect(() => {
        if (!open) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const res = await getProfile();
                if (cancelled) return;
                setParentInfo(pickParentInfoFromProfileResponse(res));
            } catch (err) {
                if (cancelled) return;
                console.warn("[AdmissionReservationDialog] load parent profile failed:", err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open]);

    const setSlotUploading = React.useCallback((slotKey, isUploading) => {
        setUploadingSlots((prev) => {
            const next = new Set(prev);
            if (isUploading) next.add(slotKey);
            else next.delete(slotKey);
            return next;
        });
    }, []);

    const handlePickFile = React.useCallback(
        async (docIndex, slotIndex, file) => {
            if (!file) return;
            if (!cloudinaryReady) {
                showErrorSnackbar("Chưa cấu hình Cloudinary, không thể tải ảnh lên.");
                return;
            }
            if (!isAllowedImage(file)) {
                showWarningSnackbar("Chỉ hỗ trợ định dạng ảnh JPG, JPEG, PNG, WEBP.");
                return;
            }
            if (file.size > MAX_IMAGE_BYTES) {
                showWarningSnackbar(`Ảnh vượt quá ${formatBytes(MAX_IMAGE_BYTES)}, vui lòng chọn ảnh nhỏ hơn.`);
                return;
            }
            const slotKey = `${docIndex}-${slotIndex}`;
            setSlotUploading(slotKey, true);
            try {
                const result = await uploadFileToCloudinary(file);
                setDocs((prev) => {
                    const next = prev.slice();
                    const target = next[docIndex];
                    if (!target) return prev;
                    const slots = target.slots.slice();
                    slots[slotIndex] = result.url;
                    next[docIndex] = {...target, slots};
                    return next;
                });
            } catch (err) {
                console.error("[AdmissionReservationDialog] upload error:", err);
                showErrorSnackbar(err?.message || "Tải ảnh lên thất bại, vui lòng thử lại.");
            } finally {
                setSlotUploading(slotKey, false);
            }
        },
        [cloudinaryReady, setSlotUploading]
    );

    const handleRemoveSlot = React.useCallback((docIndex, slotIndex) => {
        setDocs((prev) => {
            const next = prev.slice();
            const target = next[docIndex];
            if (!target) return prev;
            const slots = target.slots.slice();
            slots[slotIndex] = null;
            next[docIndex] = {...target, slots};
            return next;
        });
    }, []);

    const anyUploading = uploadingSlots.size > 0;

    const validation = React.useMemo(
        () =>
            offeringId == null
                ? {ok: false, message: "Thiếu mã gói tuyển sinh."}
                : validateDocsForSubmit(docs, {selectedStudentId}),
        [docs, offeringId, selectedStudentId]
    );

    const handleSubmit = React.useCallback(async () => {
        if (!validation.ok) {
            if (validation.message) showWarningSnackbar(validation.message);
            return;
        }
        if (anyUploading) {
            showWarningSnackbar("Vui lòng đợi quá trình tải ảnh hoàn tất.");
            return;
        }
        const submissionDocuments = buildSubmissionDocumentsPayload(docs);
        if (submissionDocuments.length === 0) {
            showWarningSnackbar("Vui lòng tải lên ít nhất 1 hồ sơ trước khi nộp.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                submissionDocuments,
                campusProgramOfferingId: Number(offeringId),
                studentProfileId: Number(selectedStudentId),
            };
            await postParentAdmissionReservationForm(payload);
            showSuccessSnackbar("Nộp đơn xin giữ chỗ thành công.");
            if (typeof onSubmitted === "function") onSubmitted();
            if (typeof onClose === "function") onClose();
        } catch (err) {
            console.error("[AdmissionReservationDialog] submit error:", err);
            const msg = err?.response?.data?.message || err?.message || "Nộp đơn thất bại, vui lòng thử lại.";
            showErrorSnackbar(msg);
        } finally {
            setSubmitting(false);
        }
    }, [anyUploading, docs, offeringId, onClose, onSubmitted, selectedStudentId, validation]);

    const handleClose = React.useCallback(() => {
        if (submitting || anyUploading) return;
        if (typeof onClose === "function") onClose();
    }, [anyUploading, onClose, submitting]);

    const programName = pickOfferingProgramName(offering) || "—";
    const campaignName = String(campaign?.name || "").trim() || "—";
    const schoolName = String(school?.name || "").trim() || "—";

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    border: "1px solid rgba(147,197,253,0.45)",
                    boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
                    overflow: "hidden",
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    color: "#1e3a8a",
                    pb: 1.2,
                    pr: 5,
                    bgcolor: "rgba(59,130,246,0.06)",
                    position: "relative",
                    borderBottom: "1px solid rgba(147,197,253,0.4)",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <AssignmentTurnedInIcon sx={{color: "#1e3a8a", fontSize: 22}} />
                    <Typography sx={{fontSize: "1.08rem", fontWeight: 800, color: "#1e3a8a"}}>
                        Đơn xin giữ chỗ
                    </Typography>
                </Stack>
                <IconButton
                    aria-label="Đóng"
                    onClick={handleClose}
                    disabled={submitting || anyUploading}
                    sx={{position: "absolute", top: 8, right: 8, color: "#475569"}}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{pt: "20px !important", pb: 2, bgcolor: "#ffffff"}}>
                <Stack spacing={2.5}>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: "rgba(248,250,252,0.9)",
                            border: "1px solid rgba(226,232,240,0.9)",
                        }}
                    >
                        <InfoRow label="Trường" value={schoolName} />
                        <InfoRow label="Chiến dịch" value={campaignName} />
                        <InfoRow label="Chương trình" value={programName} />
                    </Box>

                    <Divider sx={{borderColor: "rgba(148,163,184,0.25)"}} />

                    <Box>
                        <Typography sx={SECTION_LABEL_SX}>Phụ huynh</Typography>
                        <Stack spacing={0.5}>
                            <InfoRow label="Họ và tên" value={parentInfo.name || "—"} />
                            <InfoRow label="Số điện thoại" value={parentInfo.phone || "—"} />
                            {parentInfo.email ? <InfoRow label="Email" value={parentInfo.email} /> : null}
                        </Stack>
                    </Box>

                    <Divider sx={{borderColor: "rgba(148,163,184,0.25)"}} />

                    <Box>
                        <Typography sx={SECTION_LABEL_SX}>
                            Học sinh nộp đơn
                            {students.length > 1 ? ` (chọn 1 trong ${students.length})` : ""}
                        </Typography>
                        <StudentProfilePicker
                            students={students}
                            loading={studentLoading}
                            error={studentError}
                            selectedStudentId={selectedStudentId}
                            onSelect={setSelectedStudentId}
                            disabled={submitting}
                        />
                    </Box>

                    <Divider sx={{borderColor: "rgba(148,163,184,0.25)"}} />

                    <Box>
                        <Typography sx={SECTION_LABEL_SX}>Hồ sơ cần nộp</Typography>
                        <AdmissionDocumentsSection
                            docs={docs}
                            docsLoading={docsLoading}
                            docsError={docsError}
                            cloudinaryReady={cloudinaryReady}
                            uploadingSlots={uploadingSlots}
                            disabled={submitting}
                            onPickFile={handlePickFile}
                            onRemoveSlot={handleRemoveSlot}
                        />
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 2.5,
                    py: 1.5,
                    borderTop: "1px solid rgba(148,163,184,0.22)",
                    bgcolor: "#fff",
                    gap: 1,
                }}
            >
                <Button
                    onClick={handleClose}
                    disabled={submitting || anyUploading}
                    sx={{textTransform: "none", fontWeight: 700, px: 2, color: "#475569"}}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={submitting || anyUploading || docsLoading || !validation.ok}
                    variant="contained"
                    sx={{
                        textTransform: "none",
                        fontWeight: 800,
                        borderRadius: 2,
                        px: 2.5,
                        bgcolor: "#2563eb",
                        boxShadow: "0 4px 12px rgba(37,99,235,0.22)",
                        "&:hover": {
                            bgcolor: "#1d4ed8",
                            boxShadow: "0 6px 16px rgba(37,99,235,0.3)",
                        },
                        "&.Mui-disabled": {
                            bgcolor: "rgba(59,130,246,0.45)",
                            color: "rgba(255,255,255,0.85)",
                        },
                    }}
                >
                    {submitting ? "Đang nộp..." : "Nộp đơn"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function InfoRow({label, value}) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{lineHeight: 1.65}}>
            <Typography
                sx={{
                    fontSize: "0.92rem",
                    fontWeight: 600,
                    color: "#475569",
                    minWidth: 130,
                    flexShrink: 0,
                }}
            >
                {label}:
            </Typography>
            <Typography sx={{fontSize: "0.96rem", color: "#0f172a", fontWeight: 600}}>
                {value || "—"}
            </Typography>
        </Stack>
    );
}
