import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {Link as RouterLink, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {enqueueSnackbar} from 'notistack';
import AdmissionSubmissionFormContent from './admission/AdmissionSubmissionFormContent.jsx';
import {useAdmissionDocumentUpload} from './admission/useAdmissionDocumentUpload.js';
import {
    applyReservationTemplateToDocs,
    buildInitialDocsState,
    buildSubmissionDocumentsPayload,
    cloneEmptyCatalogDocs,
    hasSavedReservationTemplateForStudent,
    mapStudentsForPicker,
    pickAdmissionReservationFormTemplateIdFromBody,
    pickAdmissionReservationFormTemplateIdFromResponse,
    pickReservationTemplateBodyFromResponse,
    pickStudentProfileIdForTemplateApi,
    pickStudentProfileIdFromTemplateBody,
    validateDocsForSubmit,
} from './admission/admissionSubmissionUtils.js';
import {
    getParentAdmissionDocuments,
    getParentAdmissionReservationFormTemplate,
    getParentStudent,
    pickAdmissionDocumentsFromResponse,
    postParentAdmissionReservationFormTemplate,
    putParentAdmissionReservationFormTemplate,
} from '../../services/ParentService.jsx';
import {APP_PRIMARY_DARK, BRAND_NAVY, BRAND_PASTEL_AURA} from '../../constants/homeLandingTheme';


export default function ParentAdmissionHoldProfilePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const preselectedStudentId = Number(searchParams.get('studentId')) || null;
    const returnUrl = searchParams.get('returnUrl') || null;
    const hasReturnUrl = !!returnUrl;
    const reservationError = Boolean(location.state?.reservationError);
    const reservationRejectReason = String(location.state?.reservationRejectReason ?? '').trim();

    const catalogRef = useRef([]);
    const templateLoadSeqRef = useRef(0);
    const templateBodyRef = useRef(null);
    const lastTemplateResRef = useRef(null);

    const [studentLoading, setStudentLoading] = useState(true);
    const [studentError, setStudentError] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState('');
    const [prefillLoading, setPrefillLoading] = useState(false);
    const [docs, setDocs] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [templateAlreadySaved, setTemplateAlreadySaved] = useState(false);

    const [savedTemplateId, setSavedTemplateId] = useState(null);
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);

    const {cloudinaryReady, uploadingSlots, anyUploading, handlePickFile, handleRemoveSlot} =
        useAdmissionDocumentUpload(setDocs);

    const docsLoading = catalogLoading || prefillLoading;
    const docsError = catalogError;

    const activeStudent = useMemo(
        () => students.find((s) => s.id === selectedStudentId) ?? null,
        [students, selectedStudentId],
    );

    const loadCatalog = useCallback(async () => {
        setCatalogLoading(true);
        setCatalogError('');
        try {
            const res = await getParentAdmissionDocuments();
            const {required, optional} = pickAdmissionDocumentsFromResponse(res);
            const initial = buildInitialDocsState(required, optional);
            catalogRef.current = cloneEmptyCatalogDocs(initial);
            setDocs(catalogRef.current);
            if (initial.length === 0) {
                setCatalogError(
                    'Hệ thống chưa cấu hình danh mục hồ sơ. Vui lòng liên hệ tư vấn hoặc thử lại sau.',
                );
            }
        } catch (err) {
            console.error('[ParentAdmissionHoldProfilePage] load catalog:', err);
            catalogRef.current = [];
            setDocs([]);
            setCatalogError(
                err?.response?.data?.message || err?.message || 'Không tải được danh sách hồ sơ.',
            );
        } finally {
            setCatalogLoading(false);
        }
    }, []);

    const loadTemplateForStudent = useCallback(async (studentProfileId) => {
        const sid = Number(studentProfileId);
        if (!Number.isFinite(sid) || sid <= 0 || !catalogRef.current.length) return;

        const seq = ++templateLoadSeqRef.current;
        setPrefillLoading(true);
        setTemplateAlreadySaved(false);
        setSavedTemplateId(null);
        setIsEditingTemplate(false);
        templateBodyRef.current = null;
        lastTemplateResRef.current = null;
        setDocs(cloneEmptyCatalogDocs(catalogRef.current));

        try {
            const templateRes = await getParentAdmissionReservationFormTemplate(sid);
            if (seq !== templateLoadSeqRef.current) return;

            lastTemplateResRef.current = templateRes;
            const body = pickReservationTemplateBodyFromResponse(templateRes);
            templateBodyRef.current = body;
            const bodySid = pickStudentProfileIdFromTemplateBody(body);

            if (bodySid != null && bodySid !== sid) {
                setDocs(cloneEmptyCatalogDocs(catalogRef.current));
                setTemplateAlreadySaved(false);
                setSavedTemplateId(null);
                templateBodyRef.current = null;
                return;
            }

            setDocs(applyReservationTemplateToDocs(catalogRef.current, body, sid));
            const saved = hasSavedReservationTemplateForStudent(body, sid);
            setTemplateAlreadySaved(saved);
            setSavedTemplateId(
                saved
                    ? pickAdmissionReservationFormTemplateIdFromResponse(templateRes, sid) ??
                      pickAdmissionReservationFormTemplateIdFromBody(body, sid)
                    : null,
            );
        } catch (err) {
            if (seq !== templateLoadSeqRef.current) return;
            const status = err?.response?.status;
            setDocs(cloneEmptyCatalogDocs(catalogRef.current));
            setTemplateAlreadySaved(false);
            setSavedTemplateId(null);
            templateBodyRef.current = null;
            lastTemplateResRef.current = null;
            if (status !== 404) {
                console.warn('[ParentAdmissionHoldProfilePage] load template:', err);
            }
        } finally {
            if (seq === templateLoadSeqRef.current) {
                setPrefillLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);

    useEffect(() => {
        let cancelled = false;
        setStudentLoading(true);
        setStudentError('');
        (async () => {
            try {
                const res = await getParentStudent();
                if (cancelled) return;
                const list = mapStudentsForPicker(res);
                setStudents(list);
                if (list.length === 0) {
                    setStudentError('Bạn chưa có hồ sơ học sinh. Vui lòng thêm tại trang Thông tin con.');
                    setSelectedStudentId(null);
                } else {
                    setSelectedStudentId((prev) => {
                        if (prev != null && list.some((s) => s.id === prev)) return prev;
                        if (preselectedStudentId && list.some((s) => s.id === preselectedStudentId)) return preselectedStudentId;
                        return list[0].id;
                    });
                }
            } catch (err) {
                if (cancelled) return;
                setStudents([]);
                setSelectedStudentId(null);
                setStudentError(
                    err?.response?.data?.message || err?.message || 'Không tải được danh sách học sinh.',
                );
            } finally {
                if (!cancelled) setStudentLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!selectedStudentId || catalogLoading) return undefined;
        loadTemplateForStudent(selectedStudentId);
        return () => {
            templateLoadSeqRef.current += 1;
        };
    }, [selectedStudentId, catalogLoading, loadTemplateForStudent]);

    const handleSelectStudent = useCallback((id) => {
        templateLoadSeqRef.current += 1;
        setSelectedStudentId(id);
        setTemplateAlreadySaved(false);
        setSavedTemplateId(null);
        setIsEditingTemplate(false);
        templateBodyRef.current = null;
        lastTemplateResRef.current = null;
        if (catalogRef.current.length) {
            setDocs(cloneEmptyCatalogDocs(catalogRef.current));
        }
    }, []);

    const resolveTemplateId = useCallback((sid) => {
        const fromState = Number(savedTemplateId);
        if (Number.isFinite(fromState) && fromState > 0) return Math.trunc(fromState);
        return (
            pickAdmissionReservationFormTemplateIdFromResponse(lastTemplateResRef.current, sid) ??
            pickAdmissionReservationFormTemplateIdFromBody(templateBodyRef.current, sid)
        );
    }, [savedTemplateId]);

    const applyTemplateResponse = useCallback((templateRes, sid) => {
        lastTemplateResRef.current = templateRes;
        const body = pickReservationTemplateBodyFromResponse(templateRes);
        templateBodyRef.current = body;
        const bodySid = pickStudentProfileIdFromTemplateBody(body);
        if (bodySid == null || bodySid === sid) {
            setDocs(applyReservationTemplateToDocs(catalogRef.current, body, sid));
            const saved = hasSavedReservationTemplateForStudent(body, sid);
            setTemplateAlreadySaved(saved);
            setSavedTemplateId(
                saved
                    ? pickAdmissionReservationFormTemplateIdFromResponse(templateRes, sid) ??
                      pickAdmissionReservationFormTemplateIdFromBody(body, sid)
                    : null,
            );
        } else {
            setDocs(cloneEmptyCatalogDocs(catalogRef.current));
            setTemplateAlreadySaved(false);
            setSavedTemplateId(null);
            templateBodyRef.current = null;
            lastTemplateResRef.current = null;
        }
    }, []);

    const handleStartEdit = useCallback(() => {
        const sid = Number(selectedStudentId);
        const templateId = Number.isFinite(sid) && sid > 0 ? resolveTemplateId(sid) : null;
        if (templateId) setSavedTemplateId(templateId);
        setIsEditingTemplate(true);
    }, [selectedStudentId, resolveTemplateId]);

    const handleCancelEdit = useCallback(() => {
        setIsEditingTemplate(false);
        if (selectedStudentId) {
            void loadTemplateForStudent(selectedStudentId);
        }
    }, [selectedStudentId, loadTemplateForStudent]);

    const validation = useMemo(
        () => validateDocsForSubmit(docs, {selectedStudentId}),
        [docs, selectedStudentId],
    );

    const handleSubmit = async () => {
        const sid = pickStudentProfileIdForTemplateApi(activeStudent?.raw ?? {}) ?? Number(selectedStudentId);
        if (!Number.isFinite(sid) || sid <= 0) {
            enqueueSnackbar('Không xác định được mã hồ sơ học sinh. Vui lòng chọn lại học sinh.', {
                variant: 'warning',
            });
            return;
        }
        if (!validation.ok) {
            enqueueSnackbar(validation.message, {variant: 'warning'});
            return;
        }
        if (anyUploading) {
            enqueueSnackbar('Vui lòng đợi quá trình tải ảnh hoàn tất.', {variant: 'warning'});
            return;
        }
        const submissionDocuments = buildSubmissionDocumentsPayload(docs);
        if (submissionDocuments.length === 0) {
            enqueueSnackbar('Vui lòng tải lên ít nhất một hồ sơ trước khi lưu.', {variant: 'warning'});
            return;
        }

        const shouldUpdate = templateAlreadySaved || isEditingTemplate;
        const templateId = shouldUpdate ? resolveTemplateId(sid) : null;
        if (shouldUpdate && !templateId) {
            enqueueSnackbar(
                'Không xác định được mã hồ sơ giữ chỗ để cập nhật. Vui lòng tải lại trang.',
                {variant: 'warning'},
            );
            return;
        }

        setSubmitting(true);
        try {
            if (shouldUpdate) {
                await putParentAdmissionReservationFormTemplate({
                    admissionReservationFormTemplateId: templateId,
                    studentProfileId: sid,
                    submissionDocuments,
                });
            } else {
                await postParentAdmissionReservationFormTemplate({
                    studentProfileId: sid,
                    submissionDocuments,
                });
            }
            const templateRes = await getParentAdmissionReservationFormTemplate(sid);
            applyTemplateResponse(templateRes, sid);
            setIsEditingTemplate(false);
            enqueueSnackbar('Lưu mẫu hồ sơ giữ chỗ thành công', {variant: 'success'});
            if (reservationError) {
                navigate(`${location.pathname}${location.search}`, {replace: true, state: null});
            }
        } catch (err) {
            console.error('[ParentAdmissionHoldProfilePage] submit:', err);
            const serverMsg = err?.response?.data?.message || err?.message || 'Lưu hồ sơ thất bại.';
            enqueueSnackbar(serverMsg, {variant: 'error'});
        } finally {
            setSubmitting(false);
        }
    };

    const studentPickerDisabled =
        submitting || anyUploading || studentLoading || isEditingTemplate;
    const documentsLocked = templateAlreadySaved && !isEditingTemplate;
    const documentsDisabled =
        submitting ||
        anyUploading ||
        !selectedStudentId ||
        catalogLoading ||
        prefillLoading ||
        documentsLocked;
    const showSaveFooter = !templateAlreadySaved || isEditingTemplate;

    return (
        <Box
            sx={{
                minHeight: '100%',
                pt: {xs: 14, md: 13},
                pb: {xs: 4, md: 4},
                bgcolor: '#f0f6fc',
                backgroundImage: BRAND_PASTEL_AURA,
            }}
        >
            <Container maxWidth="md">
                {hasReturnUrl && (
                    <Button
                        onClick={() => navigate(returnUrl)}
                        startIcon={<ArrowBackRoundedIcon />}
                        variant="text"
                        sx={{textTransform: 'none', fontWeight: 600, color: BRAND_NAVY, mb: 1, pl: 0, opacity: 0.8, '&:hover': {opacity: 1, bgcolor: 'transparent'}}}
                    >
                        Quay lại
                    </Button>
                )}
       

                {reservationError ? (
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 2,
                            p: 3,
                            borderRadius: 3,
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            bgcolor: 'rgba(254, 226, 226, 0.95)',
                        }}
                    >
                        <Stack spacing={1}>
                            <Typography sx={{fontWeight: 700, color: '#b91c1c'}}>
                                Hồ sơ giữ chỗ bị từ chối. Vui lòng chỉnh sửa lại.
                            </Typography>
                            {reservationRejectReason ? (
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(254, 226, 226, 1)',
                                        border: '1px solid rgba(239, 68, 68, 0.14)',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        fontSize: 14,
                                        color: '#991b1b',
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {`Lý do: ${reservationRejectReason}`}
                                </Box>
                            ) : null}
                        </Stack>
                    </Paper>
                ) : null}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        border: '1px solid rgba(147, 197, 253, 0.45)',
                        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.1)',
                        overflow: 'hidden',
                        bgcolor: '#fff',
                    }}
                >
                    <Box
                        sx={{
                            px: {xs: 2, md: 2.5},
                            py: 1.75,
                            bgcolor: 'rgba(59, 130, 246, 0.06)',
                            borderBottom: '1px solid rgba(147, 197, 253, 0.4)',
                        }}
                    >
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            flexWrap="wrap"
                            gap={1}
                        >
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <AssignmentTurnedInRoundedIcon sx={{color: '#1e3a8a', fontSize: 22}} />
                                <Typography sx={{fontSize: '1.08rem', fontWeight: 800, color: '#1e3a8a'}}>
                                    Hồ sơ giữ chỗ
                                </Typography>
                            </Stack>
                            {templateAlreadySaved && !isEditingTemplate ? (
                                <Button
                                    variant="contained"
                                    size="medium"
                                    startIcon={<EditOutlinedIcon />}
                                    disabled={submitting || anyUploading || docsLoading || studentLoading}
                                    onClick={handleStartEdit}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        borderRadius: 2,
                                        px: 2,
                                        bgcolor: APP_PRIMARY_DARK,
                                        boxShadow: '0 6px 16px rgba(37, 99, 235, 0.22)',
                                    }}
                                >
                                    Chỉnh sửa hồ sơ
                                </Button>
                            ) : null}
                        </Stack>
                    </Box>

                    <Box sx={{px: {xs: 2, md: 2.5}, py: 2.5}}>
                        <AdmissionSubmissionFormContent
                            students={students}
                            studentLoading={studentLoading}
                            studentError={studentError}
                            selectedStudentId={selectedStudentId}
                            onSelectStudent={handleSelectStudent}
                            studentSectionTitle="Học sinh"
                            docs={docs}
                            docsLoading={docsLoading}
                            docsError={docsError}
                            cloudinaryReady={cloudinaryReady}
                            uploadingSlots={uploadingSlots}
                            disabled={documentsDisabled}
                            studentPickerDisabled={studentPickerDisabled}
                            onPickFile={handlePickFile}
                            onRemoveSlot={handleRemoveSlot}
                            documentsSectionTitle={
                                activeStudent
                                    ? `Hồ sơ cần nộp — ${activeStudent.name}${activeStudent.subLabel ? ` (${activeStudent.subLabel})` : ''}`
                                    : 'Hồ sơ cần nộp'
                            }
                        />

                        {!studentLoading && students.length === 0 ? (
                            <Button
                                component={RouterLink}
                                to="/children-info"
                                variant="outlined"
                                sx={{mt: 2, textTransform: 'none', fontWeight: 700, borderRadius: 2}}
                            >
                                Thêm hồ sơ học sinh
                            </Button>
                        ) : null}
                    </Box>

                    {showSaveFooter ? (
                        <Box
                            sx={{
                                px: {xs: 2, md: 2.5},
                                py: 1.75,
                                borderTop: '1px solid rgba(148, 163, 184, 0.22)',
                                bgcolor: '#fafbff',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 1.25,
                                flexWrap: 'wrap',
                            }}
                        >
                            {isEditingTemplate ? (
                                <Button
                                    variant="outlined"
                                    size="large"
                                    disabled={submitting || anyUploading}
                                    onClick={handleCancelEdit}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        borderRadius: 2,
                                        px: 3,
                                        py: 1.1,
                                        width: {xs: '100%', sm: 'auto'},
                                    }}
                                >
                                    Hủy
                                </Button>
                            ) : null}
                            <Button
                                variant="contained"
                                size="large"
                                disabled={
                                    submitting ||
                                    anyUploading ||
                                    docsLoading ||
                                    studentLoading ||
                                    !validation.ok
                                }
                                onClick={handleSubmit}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    borderRadius: 2,
                                    px: 3,
                                    py: 1.1,
                                    bgcolor: APP_PRIMARY_DARK,
                                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.28)',
                                    width: {xs: '100%', sm: 'auto'},
                                }}
                            >
                                {submitting
                                    ? 'Đang lưu...'
                                    : isEditingTemplate
                                      ? 'Lưu thay đổi'
                                      : 'Lưu hồ sơ'}
                            </Button>
                        </Box>
                    ) : null}
                </Paper>
            </Container>
        </Box>
    );
}
