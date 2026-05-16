import React from "react";
import {
    Box,
    Button,
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
    getParentAdmissionReservationFormTemplate,
    getParentStudent,
    pickAdmissionDocumentsFromResponse,
    postParentAdmissionReservationForm,
} from "../../../services/ParentService.jsx";
import {showErrorSnackbar, showSuccessSnackbar, showWarningSnackbar} from "../../ui/AppSnackbar.jsx";
import {isCloudinaryConfigured, uploadFileToCloudinary} from "../../../utils/cloudinaryUpload.js";
import {AdmissionDocumentsSection} from "../admission/AdmissionDocumentUploadFields.jsx";
import StudentProfilePicker from "../admission/StudentProfilePicker.jsx";
import {
    applyReservationTemplateToDocs,
    buildInitialDocsState,
    buildSubmissionDocumentsPayload,
    cloneEmptyCatalogDocs,
    formatBytes,
    hasSavedReservationTemplateForStudent,
    isAllowedImage,
    mapStudentsForPicker,
    MAX_IMAGE_BYTES,
    pickOfferingProgramName,
    pickReservationTemplateBodyFromResponse,
    pickStudentProfileIdFromTemplateBody,
    SECTION_LABEL_SX,
    validateDocsForSubmit,
} from "../admission/admissionSubmissionUtils.js";

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

    const templateCatalogRef = React.useRef([]);
    const offeringCatalogRef = React.useRef([]);
    const templateLoadSeqRef = React.useRef(0);

    const [templateCatalogLoading, setTemplateCatalogLoading] = React.useState(false);
    const [templateCatalogError, setTemplateCatalogError] = React.useState("");
    const [templatePrefillLoading, setTemplatePrefillLoading] = React.useState(false);
    const [templateDocs, setTemplateDocs] = React.useState([]);
    const [templateAlreadySaved, setTemplateAlreadySaved] = React.useState(false);

    const [offeringDocsLoading, setOfferingDocsLoading] = React.useState(false);
    const [offeringDocsError, setOfferingDocsError] = React.useState("");
    const [offeringDocs, setOfferingDocs] = React.useState([]);

    const [studentLoading, setStudentLoading] = React.useState(false);
    const [studentError, setStudentError] = React.useState("");
    const [students, setStudents] = React.useState([]);
    const [selectedStudentId, setSelectedStudentId] = React.useState(null);

    const [uploadingSlots, setUploadingSlots] = React.useState(() => new Set());
    const [submitting, setSubmitting] = React.useState(false);

    const cloudinaryReady = isCloudinaryConfigured();

    const resetState = React.useCallback(() => {
        templateCatalogRef.current = [];
        offeringCatalogRef.current = [];
        templateLoadSeqRef.current = 0;
        setTemplateDocs([]);
        setTemplateCatalogError("");
        setTemplateAlreadySaved(false);
        setOfferingDocs([]);
        setOfferingDocsError("");
        setStudentError("");
        setUploadingSlots(new Set());
        setSubmitting(false);
    }, []);

    React.useEffect(() => {
        if (!open) {
            resetState();
            return undefined;
        }
        let cancelled = false;
        setTemplateCatalogLoading(true);
        setTemplateCatalogError("");
        (async () => {
            try {
                const res = await getParentAdmissionDocuments();
                if (cancelled) return;
                const {required, optional} = pickAdmissionDocumentsFromResponse(res);
                const initial = buildInitialDocsState(required, optional);
                templateCatalogRef.current = cloneEmptyCatalogDocs(initial);
                setTemplateDocs(templateCatalogRef.current);
                if (initial.length === 0) {
                    setTemplateCatalogError(
                        "Hệ thống chưa cấu hình danh mục hồ sơ giữ chỗ. Vui lòng hoàn thành tại trang Hồ sơ giữ chỗ.",
                    );
                }
            } catch (err) {
                if (cancelled) return;
                console.error("[AdmissionReservationDialog] load template catalog:", err);
                templateCatalogRef.current = [];
                setTemplateDocs([]);
                setTemplateCatalogError(
                    err?.response?.data?.message || err?.message || "Không tải được danh mục hồ sơ giữ chỗ.",
                );
            } finally {
                if (!cancelled) setTemplateCatalogLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, resetState]);

    React.useEffect(() => {
        if (!open) return undefined;
        if (offeringId == null) {
            offeringCatalogRef.current = [];
            setOfferingDocs([]);
            setOfferingDocsError("Không xác định được gói tuyển sinh để tải danh sách hồ sơ.");
            return undefined;
        }
        let cancelled = false;
        setOfferingDocsLoading(true);
        setOfferingDocsError("");
        (async () => {
            try {
                const res = await getParentAdmissionDocuments(offeringId);
                if (cancelled) return;
                const {required, optional} = pickAdmissionDocumentsFromResponse(res);
                const initial = buildInitialDocsState(required, optional);
                offeringCatalogRef.current = cloneEmptyCatalogDocs(initial);
                setOfferingDocs(offeringCatalogRef.current);
                if (initial.length === 0) {
                    setOfferingDocsError(
                        "Nhà trường chưa cấu hình danh sách hồ sơ cần nộp cho gói này.",
                    );
                }
            } catch (err) {
                if (cancelled) return;
                console.error("[AdmissionReservationDialog] load offering docs:", err);
                offeringCatalogRef.current = [];
                setOfferingDocs([]);
                setOfferingDocsError(
                    err?.response?.data?.message || err?.message || "Không tải được danh sách hồ sơ theo chương trình.",
                );
            } finally {
                if (!cancelled) setOfferingDocsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, offeringId]);

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
                console.error("[AdmissionReservationDialog] load students:", err);
                setStudents([]);
                setSelectedStudentId(null);
                setStudentError(
                    err?.response?.data?.message || err?.message || "Không tải được danh sách hồ sơ học sinh.",
                );
            } finally {
                if (!cancelled) setStudentLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open]);

    const loadTemplateForStudent = React.useCallback(async (studentProfileId) => {
        const sid = Number(studentProfileId);
        if (!Number.isFinite(sid) || sid <= 0 || !templateCatalogRef.current.length) return;

        const seq = ++templateLoadSeqRef.current;
        setTemplatePrefillLoading(true);
        setTemplateAlreadySaved(false);
        setTemplateDocs(cloneEmptyCatalogDocs(templateCatalogRef.current));

        try {
            const templateRes = await getParentAdmissionReservationFormTemplate(sid);
            if (seq !== templateLoadSeqRef.current) return;

            const body = pickReservationTemplateBodyFromResponse(templateRes);
            const bodySid = pickStudentProfileIdFromTemplateBody(body);

            if (bodySid != null && bodySid !== sid) {
                setTemplateDocs(cloneEmptyCatalogDocs(templateCatalogRef.current));
                setTemplateAlreadySaved(false);
                return;
            }

            setTemplateDocs(applyReservationTemplateToDocs(templateCatalogRef.current, body, sid));
            setTemplateAlreadySaved(hasSavedReservationTemplateForStudent(body, sid));
        } catch (err) {
            if (seq !== templateLoadSeqRef.current) return;
            setTemplateDocs(cloneEmptyCatalogDocs(templateCatalogRef.current));
            setTemplateAlreadySaved(false);
            const status = err?.response?.status;
            if (status !== 404) {
                console.warn("[AdmissionReservationDialog] load template:", err);
            }
        } finally {
            if (seq === templateLoadSeqRef.current) {
                setTemplatePrefillLoading(false);
            }
        }
    }, []);

    React.useEffect(() => {
        if (!open || !selectedStudentId || templateCatalogLoading) return undefined;
        loadTemplateForStudent(selectedStudentId);
        return () => {
            templateLoadSeqRef.current += 1;
        };
    }, [open, selectedStudentId, templateCatalogLoading, loadTemplateForStudent]);

    const handleSelectStudent = React.useCallback((id) => {
        templateLoadSeqRef.current += 1;
        setSelectedStudentId(id);
        setTemplateAlreadySaved(false);
        if (templateCatalogRef.current.length) {
            setTemplateDocs(cloneEmptyCatalogDocs(templateCatalogRef.current));
        }
    }, []);

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
            const slotKey = `offering-${docIndex}-${slotIndex}`;
            setSlotUploading(slotKey, true);
            try {
                const result = await uploadFileToCloudinary(file);
                setOfferingDocs((prev) => {
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
        setOfferingDocs((prev) => {
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
    const templateDocsLoading = templateCatalogLoading || templatePrefillLoading;

    const validation = React.useMemo(() => {
        if (offeringId == null) {
            return {ok: false, message: "Thiếu mã gói tuyển sinh."};
        }
        if (!templateAlreadySaved) {
            return {
                ok: false,
                message:
                    "Vui lòng lưu hồ sơ giữ chỗ tại trang Hồ sơ giữ chỗ trước khi nộp đơn theo chương trình.",
            };
        }
        return validateDocsForSubmit(offeringDocs, {selectedStudentId});
    }, [offeringDocs, offeringId, selectedStudentId, templateAlreadySaved]);

    const handleSubmit = React.useCallback(async () => {
        if (!validation.ok) {
            if (validation.message) showWarningSnackbar(validation.message);
            return;
        }
        if (anyUploading) {
            showWarningSnackbar("Vui lòng đợi quá trình tải ảnh hoàn tất.");
            return;
        }
        const submissionDocuments = buildSubmissionDocumentsPayload(offeringDocs);
        if (submissionDocuments.length === 0) {
            showWarningSnackbar("Vui lòng tải lên ít nhất 1 hồ sơ theo chương trình trước khi nộp.");
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
    }, [anyUploading, offeringDocs, offeringId, onClose, onSubmitted, selectedStudentId, validation]);

    const handleClose = React.useCallback(() => {
        if (submitting || anyUploading) return;
        if (typeof onClose === "function") onClose();
    }, [anyUploading, onClose, submitting]);

    const programName = pickOfferingProgramName(offering) || "—";
    const campaignName = String(campaign?.name || "").trim() || "—";
    const schoolName = String(school?.name || "").trim() || "—";

    const activeStudent = React.useMemo(
        () => students.find((s) => s.id === selectedStudentId) ?? null,
        [students, selectedStudentId]
    );

    const templateSectionTitle = activeStudent
        ? `Hồ sơ giữ chỗ — ${activeStudent.name}${activeStudent.subLabel ? ` (${activeStudent.subLabel})` : ""}`
        : "Hồ sơ giữ chỗ";

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
                        <Typography sx={SECTION_LABEL_SX}>Học sinh nộp đơn</Typography>
                        <StudentProfilePicker
                            students={students}
                            loading={studentLoading}
                            error={studentError}
                            selectedStudentId={selectedStudentId}
                            onSelect={handleSelectStudent}
                            disabled={submitting}
                        />
                    </Box>

                    <Divider sx={{borderColor: "rgba(148,163,184,0.25)"}} />

                    <Box>
                        <Typography sx={SECTION_LABEL_SX}>{templateSectionTitle}</Typography>
                        {!templateAlreadySaved && !templateDocsLoading && selectedStudentId ? (
                            <Typography
                                sx={{
                                    fontSize: "0.85rem",
                                    color: "#b45309",
                                    fontWeight: 600,
                                    mb: 1.25,
                                    lineHeight: 1.5,
                                }}
                            >
                                Chưa có hồ sơ giữ chỗ đã lưu. Vui lòng hoàn thành tại trang Hồ sơ giữ chỗ trước
                                khi nộp đơn theo chương trình.
                            </Typography>
                        ) : null}
                        <AdmissionDocumentsSection
                            docs={templateDocs}
                            docsLoading={templateDocsLoading}
                            docsError={templateCatalogError}
                            cloudinaryReady={cloudinaryReady}
                            uploadingSlots={uploadingSlots}
                            disabled
                            readOnly
                            onPickFile={() => {}}
                            onRemoveSlot={() => {}}
                            emptyMessage="Chưa có hồ sơ giữ chỗ cho học sinh này."
                        />
                    </Box>

                    <Divider sx={{borderColor: "rgba(148,163,184,0.25)"}} />

                    <Box>
                        <Typography sx={SECTION_LABEL_SX}>Hồ sơ theo chương trình tuyển sinh</Typography>
                        <AdmissionDocumentsSection
                            docs={offeringDocs}
                            docsLoading={offeringDocsLoading}
                            docsError={offeringDocsError}
                            cloudinaryReady={cloudinaryReady}
                            uploadingSlots={uploadingSlots}
                            disabled={submitting || !templateAlreadySaved}
                            onPickFile={handlePickFile}
                            onRemoveSlot={handleRemoveSlot}
                            emptyMessage="Không có hồ sơ nào cần nộp theo gói tuyển sinh này."
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
                    disabled={
                        submitting ||
                        anyUploading ||
                        offeringDocsLoading ||
                        templateDocsLoading ||
                        !validation.ok
                    }
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
