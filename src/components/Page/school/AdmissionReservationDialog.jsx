import React from "react";
import {useNavigate} from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    LinearProgress,
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
    pickAdmissionSchoolsAvailabilityFromResponse,
    pickSchoolAdmissionAvailability,
    postParentAdmissionReservationForm,
    putParentAdmissionSchoolsAvailability,
} from "../../../services/ParentService.jsx";
import {showErrorSnackbar, showSuccessSnackbar, showWarningSnackbar} from "../../ui/AppSnackbar.jsx";
import {AdmissionDocumentsSection} from "../admission/AdmissionDocumentUploadFields.jsx";
import StudentProfilePicker from "../admission/StudentProfilePicker.jsx";
import {
    applyReservationTemplateToDocs,
    buildInitialDocsState,
    buildSubmissionDocumentsPayload,
    cloneEmptyCatalogDocs,
    hasSavedReservationTemplateForStudent,
    mapStudentsForPicker,
    pickOfferingProgramName,
    pickReservationTemplateBodyFromResponse,
    pickStudentProfileIdFromTemplateBody,
    SECTION_LABEL_SX,
} from "../admission/admissionSubmissionUtils.js";

const PARENT_ADMISSION_RESERVATIONS_PATH = "/parent/admission-reservations";

export default function AdmissionReservationDialog({
    open,
    onClose,
    offering,
    campaign,
    school,
    onSubmitted,
}) {
    const navigate = useNavigate();

    const offeringId = React.useMemo(() => {
        const raw = offering?.id;
        if (raw == null) return null;
        const num = Number(raw);
        return Number.isFinite(num) && num > 0 ? num : null;
    }, [offering?.id]);

    const schoolId = React.useMemo(() => {
        const raw = school?.id ?? school?.schoolId;
        if (raw == null) return null;
        const num = Number(raw);
        return Number.isFinite(num) && num > 0 ? num : null;
    }, [school?.id, school?.schoolId]);

    const templateCatalogRef = React.useRef([]);
    const studentDataSeqRef = React.useRef(0);

    const [bootstrapLoading, setBootstrapLoading] = React.useState(false);
    const [templateCatalogError, setTemplateCatalogError] = React.useState("");
    const [studentDataLoading, setStudentDataLoading] = React.useState(false);
    const [templateDocs, setTemplateDocs] = React.useState([]);
    const [templateAlreadySaved, setTemplateAlreadySaved] = React.useState(false);
    const [templateLoadError, setTemplateLoadError] = React.useState("");

    const [studentLoading, setStudentLoading] = React.useState(false);
    const [studentError, setStudentError] = React.useState("");
    const [students, setStudents] = React.useState([]);
    const [selectedStudentId, setSelectedStudentId] = React.useState(null);

    const [availabilityError, setAvailabilityError] = React.useState("");
    const [schoolEligibility, setSchoolEligibility] = React.useState({eligible: null, reason: ""});

    const [submitting, setSubmitting] = React.useState(false);

    const resetState = React.useCallback(() => {
        templateCatalogRef.current = [];
        studentDataSeqRef.current = 0;
        setTemplateDocs([]);
        setTemplateCatalogError("");
        setTemplateAlreadySaved(false);
        setTemplateLoadError("");
        setStudentError("");
        setAvailabilityError("");
        setSchoolEligibility({eligible: null, reason: ""});
        setSubmitting(false);
        setBootstrapLoading(false);
        setStudentDataLoading(false);
    }, []);

    const loadStudentAdmissionData = React.useCallback(
        async (studentProfileId) => {
            const sid = Number(studentProfileId);
            if (!Number.isFinite(sid) || sid <= 0 || !templateCatalogRef.current.length) return;

            const seq = ++studentDataSeqRef.current;
            setStudentDataLoading(true);
            setTemplateLoadError("");
            setAvailabilityError("");
            setSchoolEligibility({eligible: null, reason: ""});
            setTemplateAlreadySaved(false);
            setTemplateDocs(cloneEmptyCatalogDocs(templateCatalogRef.current));

            try {
                const availabilityPromise =
                    schoolId != null
                        ? putParentAdmissionSchoolsAvailability(sid, [schoolId])
                        : Promise.resolve(null);

                const [templateSettled, availabilitySettled] = await Promise.allSettled([
                    getParentAdmissionReservationFormTemplate(sid),
                    availabilityPromise,
                ]);
                if (seq !== studentDataSeqRef.current) return;

                if (schoolId == null) {
                    setSchoolEligibility({
                        eligible: false,
                        reason: "Không xác định được trường để kiểm tra điều kiện nộp hồ sơ.",
                    });
                } else if (availabilitySettled.status === "fulfilled") {
                    const availabilityResult = pickAdmissionSchoolsAvailabilityFromResponse(
                        availabilitySettled.value,
                    );
                    setSchoolEligibility(pickSchoolAdmissionAvailability(availabilityResult, schoolId));
                } else {
                    const availErr = availabilitySettled.reason;
                    setAvailabilityError(
                        availErr?.response?.data?.message ||
                            availErr?.message ||
                            "Không kiểm tra được điều kiện nộp hồ sơ tại trường này.",
                    );
                    setSchoolEligibility({eligible: false, reason: ""});
                }

                if (templateSettled.status === "fulfilled") {
                    const body = pickReservationTemplateBodyFromResponse(templateSettled.value);
                    const bodySid = pickStudentProfileIdFromTemplateBody(body);

                    if (bodySid != null && bodySid !== sid) {
                        setTemplateDocs(cloneEmptyCatalogDocs(templateCatalogRef.current));
                        setTemplateAlreadySaved(false);
                        setTemplateLoadError(
                            "Không tải được hồ sơ giữ chỗ của học sinh này. Vui lòng lưu hồ sơ tại trang Hồ sơ giữ chỗ.",
                        );
                    } else {
                        setTemplateDocs(
                            applyReservationTemplateToDocs(templateCatalogRef.current, body, sid),
                        );
                        const saved = hasSavedReservationTemplateForStudent(body, sid);
                        setTemplateAlreadySaved(saved);
                        if (!saved) {
                            setTemplateLoadError(
                                "Cấu hình hồ sơ giữ chỗ đã bị lỗi thời, cần cấu hình lại tại trang Hồ sơ giữ chỗ.",
                            );
                        }
                    }
                } else {
                    const templateErr = templateSettled.reason;
                    setTemplateDocs(cloneEmptyCatalogDocs(templateCatalogRef.current));
                    setTemplateAlreadySaved(false);
                    if (templateErr?.response?.status === 404) {
                        setTemplateLoadError(
                            "Cấu hình hồ sơ giữ chỗ của học sinh chưa được thiết lập. Vui lòng thiết lập tại trang Hồ sơ giữ chỗ.",
                        );
                    } else {
                        setTemplateLoadError(
                            templateErr?.response?.data?.message ||
                                templateErr?.message ||
                                "Không tải được hồ sơ giữ chỗ.",
                        );
                    }
                }
            } catch (err) {
                if (seq !== studentDataSeqRef.current) return;
                console.error("[AdmissionReservationDialog] load student data:", err);
                setTemplateLoadError(
                    err?.response?.data?.message || err?.message || "Không tải được dữ liệu hồ sơ.",
                );
            } finally {
                if (seq === studentDataSeqRef.current) {
                    setStudentDataLoading(false);
                }
            }
        },
        [schoolId],
    );

    React.useEffect(() => {
        if (!open) {
            resetState();
            return undefined;
        }

        let cancelled = false;
        setBootstrapLoading(true);
        setStudentLoading(true);
        setTemplateCatalogError("");
        setStudentError("");

        (async () => {
            try {
                const [docsRes, studentsRes] = await Promise.all([
                    getParentAdmissionDocuments(),
                    getParentStudent(),
                ]);
                if (cancelled) return;

                const {required, optional} = pickAdmissionDocumentsFromResponse(docsRes);
                const initial = buildInitialDocsState(required, optional);
                templateCatalogRef.current = cloneEmptyCatalogDocs(initial);
                setTemplateDocs(templateCatalogRef.current);
                if (initial.length === 0) {
                    setTemplateCatalogError(
                        "Hệ thống chưa cấu hình danh mục hồ sơ giữ chỗ. Vui lòng hoàn thành tại trang Hồ sơ giữ chỗ.",
                    );
                }

                const list = mapStudentsForPicker(studentsRes);
                setStudents(list);
                if (list.length === 0) {
                    setStudentError(
                        "Bạn chưa có hồ sơ học sinh nào. Vui lòng thêm hồ sơ trước khi nộp đơn.",
                    );
                    setSelectedStudentId(null);
                } else {
                    const firstId = list[0].id;
                    setSelectedStudentId(firstId);
                    if (initial.length > 0) {
                        await loadStudentAdmissionData(firstId);
                    }
                }
            } catch (err) {
                if (cancelled) return;
                console.error("[AdmissionReservationDialog] bootstrap:", err);
                templateCatalogRef.current = [];
                setTemplateDocs([]);
                setStudents([]);
                setSelectedStudentId(null);
                setTemplateCatalogError(
                    err?.response?.data?.message || err?.message || "Không tải được dữ liệu nộp hồ sơ.",
                );
            } finally {
                if (!cancelled) {
                    setBootstrapLoading(false);
                    setStudentLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            studentDataSeqRef.current += 1;
        };
    }, [open, loadStudentAdmissionData, resetState]);

    const handleSelectStudent = React.useCallback(
        (id) => {
            if (id === selectedStudentId) return;
            studentDataSeqRef.current += 1;
            setSelectedStudentId(id);
            loadStudentAdmissionData(id);
        },
        [loadStudentAdmissionData, selectedStudentId],
    );

    const templateDocsLoading = bootstrapLoading || studentDataLoading;

    const validation = React.useMemo(() => {
        if (offeringId == null) {
            return {ok: false, message: "Thiếu mã gói tuyển sinh."};
        }
        if (!Number.isFinite(Number(selectedStudentId)) || Number(selectedStudentId) <= 0) {
            return {ok: false, message: "Vui lòng chọn hồ sơ học sinh."};
        }
        if (templateDocsLoading) {
            return {ok: false, message: ""};
        }
        if (availabilityError) {
            return {ok: false, message: availabilityError};
        }
        if (schoolEligibility.eligible === false) {
            return {
                ok: false,
                message:
                    schoolEligibility.reason ||
                    "Học sinh không đủ điều kiện nộp hồ sơ tại trường này.",
            };
        }
        if (schoolEligibility.eligible !== true) {
            return {ok: false, message: ""};
        }
        if (templateLoadError) {
            return {ok: false, message: templateLoadError};
        }
        if (!templateAlreadySaved) {
            return {
                ok: false,
                message: "Vui lòng lưu hồ sơ giữ chỗ tại trang Hồ sơ giữ chỗ trước khi nộp đơn.",
            };
        }
        const submissionDocuments = buildSubmissionDocumentsPayload(templateDocs);
        if (submissionDocuments.length === 0) {
            return {
                ok: false,
                message: "Hồ sơ giữ chỗ chưa có minh chứng. Vui lòng lưu hồ sơ tại trang Hồ sơ giữ chỗ.",
            };
        }
        return {ok: true, message: ""};
    }, [
        availabilityError,
        offeringId,
        schoolEligibility.eligible,
        schoolEligibility.reason,
        selectedStudentId,
        templateAlreadySaved,
        templateDocs,
        templateDocsLoading,
        templateLoadError,
    ]);

    const handleSubmit = React.useCallback(async () => {
        if (!validation.ok) {
            if (validation.message) showWarningSnackbar(validation.message);
            return;
        }
        const submissionDocuments = buildSubmissionDocumentsPayload(templateDocs);

        setSubmitting(true);
        try {
            const payload = {
                submissionDocuments,
                studentProfileId: Number(selectedStudentId),
                schoolIds: schoolId != null ? [schoolId] : [],
            };
            if (offeringId != null) {
                payload.campusProgramOfferingId = Number(offeringId);
            }
            await postParentAdmissionReservationForm(payload);
            showSuccessSnackbar("Nộp đơn xin giữ chỗ thành công.");
            if (typeof onClose === "function") onClose();
            if (typeof onSubmitted === "function") onSubmitted();
            navigate(PARENT_ADMISSION_RESERVATIONS_PATH);
        } catch (err) {
            console.error("[AdmissionReservationDialog] submit error:", err);
            const msg = err?.response?.data?.message || err?.message || "Nộp đơn thất bại, vui lòng thử lại.";
            showErrorSnackbar(msg);
        } finally {
            setSubmitting(false);
        }
    }, [navigate, offeringId, onClose, onSubmitted, schoolId, selectedStudentId, templateDocs, validation]);

    const handleClose = React.useCallback(() => {
        if (submitting) return;
        if (typeof onClose === "function") onClose();
    }, [onClose, submitting]);

    const programName = pickOfferingProgramName(offering) || "—";
    const campaignName = String(campaign?.name || "").trim() || "—";

    const activeStudent = React.useMemo(
        () => students.find((s) => s.id === selectedStudentId) ?? null,
        [students, selectedStudentId],
    );

    const templateSectionTitle = activeStudent
        ? `Hồ sơ giữ chỗ — ${activeStudent.name}${activeStudent.subLabel ? ` (${activeStudent.subLabel})` : ""}`
        : "Hồ sơ giữ chỗ";

    const showTemplateWarning =
        !templateDocsLoading &&
        selectedStudentId &&
        templateAlreadySaved === false &&
        !templateLoadError;

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
                    disabled={submitting}
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
                        <InfoRow label="Chiến dịch" value={campaignName} />
                        <InfoRow label="Chương trình" value={programName} />
                    </Box>

                    <Divider sx={{borderColor: "rgba(148,163,184,0.25)"}} />

                    <Box>
                        <Typography sx={SECTION_LABEL_SX}>Học sinh nộp đơn</Typography>
                        <StudentProfilePicker
                            students={students}
                            loading={studentLoading || bootstrapLoading}
                            error={studentError}
                            selectedStudentId={selectedStudentId}
                            onSelect={handleSelectStudent}
                            disabled={submitting || templateDocsLoading}
                        />
                    </Box>

                    {templateDocsLoading ? (
                        <LinearProgress
                            sx={{
                                borderRadius: 1,
                                height: 4,
                                bgcolor: "rgba(85,179,217,0.15)",
                                "& .MuiLinearProgress-bar": {bgcolor: "#1e3a8a"},
                            }}
                        />
                    ) : null}

                    {availabilityError ? (
                        <Alert severity="error" sx={{borderRadius: 2}}>
                            {availabilityError}
                        </Alert>
                    ) : null}

                    {!templateDocsLoading &&
                    !availabilityError &&
                    schoolEligibility.eligible === false &&
                    schoolEligibility.reason ? (
                        <Alert severity="warning" sx={{borderRadius: 2}}>
                            {schoolEligibility.reason}
                        </Alert>
                    ) : null}

                    <Divider sx={{borderColor: "rgba(148,163,184,0.25)"}} />

                    <Box>
                        <Typography sx={SECTION_LABEL_SX}>{templateSectionTitle}</Typography>
                        {templateLoadError ? (
                            <Alert severity="warning" sx={{mb: 1.25, borderRadius: 2}}>
                                {templateLoadError}
                            </Alert>
                        ) : null}
                        {showTemplateWarning ? (
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
                                khi nộp đơn.
                            </Typography>
                        ) : null}
                        <AdmissionDocumentsSection
                            docs={templateDocs}
                            docsLoading={templateDocsLoading}
                            docsError={templateCatalogError}
                            cloudinaryReady={false}
                            uploadingSlots={new Set()}
                            disabled
                            readOnly
                            onPickFile={() => {}}
                            onRemoveSlot={() => {}}
                            emptyMessage="Chưa có hồ sơ giữ chỗ cho học sinh này."
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
                    disabled={submitting}
                    sx={{textTransform: "none", fontWeight: 700, px: 2, color: "#475569"}}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={submitting || templateDocsLoading || !validation.ok}
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
