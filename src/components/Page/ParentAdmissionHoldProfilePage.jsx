import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Link,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import {enqueueSnackbar} from 'notistack';
import AdmissionSubmissionFormContent from './admission/AdmissionSubmissionFormContent.jsx';
import {useAdmissionDocumentUpload} from './admission/useAdmissionDocumentUpload.js';
import {
    applySubmissionPrefillToDocs,
    buildInitialDocsState,
    buildSubmissionDocumentsPayload,
    mapStudentsForPicker,
    pickSubmissionDocumentsFromTemplateResponse,
    validateDocsForSubmit,
} from './admission/admissionSubmissionUtils.js';
import {
    getParentAdmissionDocuments,
    getParentAdmissionReservationFormTemplate,
    getParentStudent,
    pickAdmissionDocumentsFromResponse,
    postParentAdmissionReservationFormTemplate,
} from '../../services/ParentService.jsx';
import {APP_PRIMARY_DARK, BRAND_NAVY, BRAND_PASTEL_AURA} from '../../constants/homeLandingTheme';

export default function ParentAdmissionHoldProfilePage() {
    const navigate = useNavigate();
    const catalogRef = useRef([]);

    const [studentLoading, setStudentLoading] = useState(true);
    const [studentError, setStudentError] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState('');
    const [prefillLoading, setPrefillLoading] = useState(false);
    const [docs, setDocs] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const {cloudinaryReady, uploadingSlots, anyUploading, handlePickFile, handleRemoveSlot} =
        useAdmissionDocumentUpload(setDocs);

    const docsLoading = catalogLoading || prefillLoading;
    const docsError = catalogError;

    const loadCatalog = useCallback(async () => {
        setCatalogLoading(true);
        setCatalogError('');
        try {
            const res = await getParentAdmissionDocuments();
            const {required, optional} = pickAdmissionDocumentsFromResponse(res);
            const initial = buildInitialDocsState(required, optional);
            catalogRef.current = initial.map((d) => ({
                ...d,
                slots: d.slots.map(() => null),
            }));
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

    const applyPrefill = useCallback(async (studentProfileId) => {
        const sid = Number(studentProfileId);
        if (!Number.isFinite(sid) || sid <= 0 || !catalogRef.current.length) return;
        setPrefillLoading(true);
        try {
            const templateRes = await getParentAdmissionReservationFormTemplate(sid);
            const existing = pickSubmissionDocumentsFromTemplateResponse(templateRes);
            setDocs(applySubmissionPrefillToDocs(catalogRef.current, existing));
        } catch (err) {
            console.warn('[ParentAdmissionHoldProfilePage] prefill:', err);
            setDocs(catalogRef.current);
        } finally {
            setPrefillLoading(false);
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
        let cancelled = false;
        (async () => {
            await applyPrefill(selectedStudentId);
            if (cancelled) return;
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedStudentId, catalogLoading, applyPrefill]);

    const handleSelectStudent = useCallback(
        (id) => {
            setSelectedStudentId(id);
            if (catalogRef.current.length) {
                setDocs(catalogRef.current);
            }
        },
        [],
    );

    const validation = useMemo(
        () => validateDocsForSubmit(docs, {selectedStudentId}),
        [docs, selectedStudentId],
    );

    const handleSubmit = async () => {
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

        setSubmitting(true);
        try {
            await postParentAdmissionReservationFormTemplate({
                studentProfileId: Number(selectedStudentId),
                submissionDocuments,
            });
            enqueueSnackbar('Đã lưu hồ sơ giữ chỗ thành công.', {variant: 'success'});
            navigate('/parent/admission-reservations');
        } catch (err) {
            console.error('[ParentAdmissionHoldProfilePage] submit:', err);
            enqueueSnackbar(
                err?.response?.data?.message || err?.message || 'Lưu hồ sơ thất bại.',
                {variant: 'error'},
            );
        } finally {
            setSubmitting(false);
        }
    };

    const formDisabled = submitting || anyUploading || !selectedStudentId || catalogLoading;

    return (
        <Box
            sx={{
                minHeight: '100%',
                pt: {xs: 14, md: 13},
                pb: {xs: 12, md: 4},
                bgcolor: '#f0f6fc',
                backgroundImage: BRAND_PASTEL_AURA,
            }}
        >
            <Container maxWidth="md">
                <Typography
                    variant="h5"
                    sx={{fontWeight: 700, color: BRAND_NAVY, mb: 2, letterSpacing: -0.2}}
                >
                    Hồ sơ giữ chỗ
                </Typography>

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
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <AssignmentTurnedInRoundedIcon sx={{color: '#1e3a8a', fontSize: 22}} />
                            <Typography sx={{fontSize: '1.08rem', fontWeight: 800, color: '#1e3a8a'}}>
                                Nộp hồ sơ giữ chỗ
                            </Typography>
                        </Stack>
                        <Typography sx={{mt: 0.75, fontSize: 14, color: '#475569', pl: 4.25}}>
                            Chọn học sinh, tải ảnh minh chứng theo từng loại hồ sơ bên dưới (giống khi nộp tại trang
                            trường).
                        </Typography>
                    </Box>

                    <Box sx={{px: {xs: 2, md: 2.5}, py: 2.5}}>
                        <AdmissionSubmissionFormContent
                            students={students}
                            studentLoading={studentLoading}
                            studentError={studentError}
                            selectedStudentId={selectedStudentId}
                            onSelectStudent={handleSelectStudent}
                            studentSectionTitle={
                                students.length > 1
                                    ? `Học sinh (chọn 1 trong ${students.length})`
                                    : 'Học sinh'
                            }
                            docs={docs}
                            docsLoading={docsLoading}
                            docsError={docsError}
                            cloudinaryReady={cloudinaryReady}
                            uploadingSlots={uploadingSlots}
                            disabled={formDisabled}
                            onPickFile={handlePickFile}
                            onRemoveSlot={handleRemoveSlot}
                            documentsSectionTitle="Hồ sơ cần nộp"
                            documentsHint="Ảnh JPG / PNG / WEBP, tối đa 5MB. Bấm ô « Tải ảnh lên » cho từng loại hồ sơ bắt buộc."
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

                    <Stack
                        direction={{xs: 'column', sm: 'row'}}
                        spacing={1.25}
                        alignItems={{sm: 'center'}}
                        justifyContent="space-between"
                        sx={{
                            px: {xs: 2, md: 2.5},
                            py: 1.75,
                            borderTop: '1px solid rgba(148, 163, 184, 0.22)',
                            bgcolor: '#fafbff',
                        }}
                    >
                        <Link
                            component={RouterLink}
                            to="/parent/admission-reservations"
                            underline="hover"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontWeight: 600,
                                color: BRAND_NAVY,
                                fontSize: 14,
                            }}
                        >
                            <ListAltRoundedIcon sx={{fontSize: 18}} />
                            Xem đơn đã nộp
                        </Link>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={
                                submitting ? (
                                    <CircularProgress size={18} color="inherit" />
                                ) : (
                                    <SaveRoundedIcon />
                                )
                            }
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
                            {submitting ? 'Đang lưu...' : 'Lưu hồ sơ'}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
