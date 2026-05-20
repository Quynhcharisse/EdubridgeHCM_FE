import React from "react";
import {useNavigate} from "react-router-dom";
import {
    getParentAdmissionDocuments,
    getParentAdmissionReservationFormTemplate,
    getParentStudent,
    getParentStudentById,
    pickAdmissionDocumentsFromResponse,
    pickAdmissionSchoolsAvailabilityFromResponse,
    pickStudentDetailBodyFromResponse,
    postParentAdmissionReservationForm,
    putParentAdmissionSchoolsAvailability,
} from "../../../services/ParentService.jsx";
import {showErrorSnackbar, showSuccessSnackbar, showWarningSnackbar} from "../../ui/AppSnackbar.jsx";
import {
    applyReservationTemplateToDocs,
    buildInitialDocsState,
    buildSubmissionDocumentsPayload,
    cloneEmptyCatalogDocs,
    hasSavedReservationTemplateForStudent,
    mapStudentProfileForAvailabilitySummary,
    pickReservationTemplateBodyFromResponse,
    pickStudentProfileIdFromTemplateBody,
} from "./admissionSubmissionUtils.js";
import {
    extractParentStudentRecordsFromResponse,
    filterAvailabilitySchoolRows,
    getBatchRowSchoolId,
    PARENT_ADMISSION_RESERVATIONS_PATH,
    pickStudentDisplayNameForSelect,
    pickStudentProfileIdFromRecord,
} from "./batchAdmissionUi.jsx";

/**
 * Batch admission selection + availability check + submit flow for a paginated school list.
 */
export function useBatchAdmissionFromSchoolList({
    isParent,
    pageSchools,
    resolveSchoolName,
    clearSelectionDeps = [],
}) {
    const navigate = useNavigate();

    const [batchAdmissionSelectedIds, setBatchAdmissionSelectedIds] = React.useState([]);

    const batchPageSchoolIds = React.useMemo(
        () => (Array.isArray(pageSchools) ? pageSchools : []).map((s) => getBatchRowSchoolId(s)).filter((id) => id != null),
        [pageSchools],
    );

    const allBatchPageSelected =
        batchPageSchoolIds.length > 0 &&
        batchPageSchoolIds.every((id) => batchAdmissionSelectedIds.includes(id));
    const someBatchPageSelected =
        batchPageSchoolIds.some((id) => batchAdmissionSelectedIds.includes(id)) && !allBatchPageSelected;

    React.useEffect(() => {
        setBatchAdmissionSelectedIds([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies when to reset
    }, clearSelectionDeps);

    const toggleBatchSelectRow = React.useCallback((school) => {
        const id = getBatchRowSchoolId(school);
        if (id == null) return;
        setBatchAdmissionSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }, []);

    const toggleBatchSelectAllShown = React.useCallback(() => {
        setBatchAdmissionSelectedIds((prev) => {
            if (batchPageSchoolIds.length === 0) return prev;
            if (batchPageSchoolIds.every((id) => prev.includes(id))) {
                const pageSet = new Set(batchPageSchoolIds);
                return prev.filter((id) => !pageSet.has(id));
            }
            const next = new Set(prev);
            batchPageSchoolIds.forEach((id) => next.add(id));
            return [...next];
        });
    }, [batchPageSchoolIds]);

    const [batchAdmissionPickerOpen, setBatchAdmissionPickerOpen] = React.useState(false);
    const [batchAdmissionPickerLoading, setBatchAdmissionPickerLoading] = React.useState(false);
    const [batchAdmissionPickerOptions, setBatchAdmissionPickerOptions] = React.useState([]);
    const [batchAdmissionPickerProfileId, setBatchAdmissionPickerProfileId] = React.useState(null);
    const [batchAdmissionPickerError, setBatchAdmissionPickerError] = React.useState("");

    const availabilityCatalogRef = React.useRef([]);
    const availabilityModalSeqRef = React.useRef(0);

    const [availabilityDialogOpen, setAvailabilityDialogOpen] = React.useState(false);
    const [availabilityPendingSchoolIds, setAvailabilityPendingSchoolIds] = React.useState([]);
    const [availabilityStudentProfileId, setAvailabilityStudentProfileId] = React.useState(null);
    const [availabilityStudentDisplayName, setAvailabilityStudentDisplayName] = React.useState("");
    const [availabilityCheckLoading, setAvailabilityCheckLoading] = React.useState(false);
    const [availabilityError, setAvailabilityError] = React.useState("");
    const [availabilityResult, setAvailabilityResult] = React.useState({
        unavailable: [],
        available: [],
        message: "",
    });
    const [availabilityTemplateDocs, setAvailabilityTemplateDocs] = React.useState([]);
    const [availabilityTemplateError, setAvailabilityTemplateError] = React.useState("");
    const [availabilitySubmitting, setAvailabilitySubmitting] = React.useState(false);
    const [availabilityStudentSummary, setAvailabilityStudentSummary] = React.useState(null);
    const [availabilityImagePreview, setAvailabilityImagePreview] = React.useState(null);
    const [availabilitySelectedSchoolIds, setAvailabilitySelectedSchoolIds] = React.useState([]);
    const [availabilitySchoolSearch, setAvailabilitySchoolSearch] = React.useState("");
    const [availabilitySubmitConfirmOpen, setAvailabilitySubmitConfirmOpen] = React.useState(false);

    const closeStudentPickerForAdmission = React.useCallback(() => {
        setBatchAdmissionPickerOpen(false);
        setBatchAdmissionPickerLoading(false);
        setBatchAdmissionPickerOptions([]);
        setBatchAdmissionPickerProfileId(null);
        setBatchAdmissionPickerError("");
    }, []);

    const closeAdmissionAvailabilityDialog = React.useCallback(() => {
        availabilityModalSeqRef.current += 1;
        setAvailabilityDialogOpen(false);
        setAvailabilityPendingSchoolIds([]);
        setAvailabilityStudentProfileId(null);
        setAvailabilityStudentDisplayName("");
        setAvailabilityCheckLoading(false);
        setAvailabilitySubmitting(false);
        setAvailabilityError("");
        setAvailabilityTemplateError("");
        setAvailabilityResult({unavailable: [], available: [], message: ""});
        setAvailabilityTemplateDocs([]);
        setAvailabilityStudentSummary(null);
        setAvailabilityImagePreview(null);
        setAvailabilitySelectedSchoolIds([]);
        setAvailabilitySchoolSearch("");
        setAvailabilitySubmitConfirmOpen(false);
    }, []);

    const handleBatchSubmitFromList = React.useCallback(() => {
        if (!isParent) {
            showWarningSnackbar("Bạn cần đăng nhập với vai trò Phụ huynh.");
            return;
        }
        if (batchAdmissionSelectedIds.length === 0) {
            showWarningSnackbar("Vui lòng chọn ít nhất một trường.");
            return;
        }
        setBatchAdmissionPickerProfileId(null);
        setBatchAdmissionPickerOptions([]);
        setBatchAdmissionPickerError("");
        setBatchAdmissionPickerOpen(true);
    }, [batchAdmissionSelectedIds.length, isParent]);

    const confirmStudentPickerForAdmission = React.useCallback(() => {
        if (batchAdmissionPickerProfileId == null) {
            showWarningSnackbar("Vui lòng chọn hồ sơ học sinh.");
            return;
        }
        const opt = batchAdmissionPickerOptions.find((o) => o.id === batchAdmissionPickerProfileId);
        setAvailabilityStudentProfileId(batchAdmissionPickerProfileId);
        setAvailabilityStudentDisplayName(String(opt?.name || "").trim() || "Học sinh");
        setAvailabilityStudentSummary(mapStudentProfileForAvailabilitySummary(opt?.raw));
        setAvailabilityPendingSchoolIds([...batchAdmissionSelectedIds]);
        setAvailabilityResult({unavailable: [], available: [], message: ""});
        setAvailabilityError("");
        setAvailabilityTemplateError("");
        setAvailabilityTemplateDocs([]);
        setAvailabilitySelectedSchoolIds([]);
        setAvailabilitySchoolSearch("");
        setAvailabilitySubmitConfirmOpen(false);
        setBatchAdmissionPickerOpen(false);
        setAvailabilityDialogOpen(true);
    }, [batchAdmissionPickerOptions, batchAdmissionPickerProfileId, batchAdmissionSelectedIds]);

    React.useEffect(() => {
        if (!batchAdmissionPickerOpen) return undefined;
        let cancelled = false;
        setBatchAdmissionPickerLoading(true);
        setBatchAdmissionPickerError("");
        (async () => {
            try {
                const res = await getParentStudent();
                if (cancelled) return;
                const raw = extractParentStudentRecordsFromResponse(res);
                const options = raw
                    .map((r) => {
                        const id = pickStudentProfileIdFromRecord(r);
                        if (id == null) return null;
                        return {id, name: pickStudentDisplayNameForSelect(r), raw: r};
                    })
                    .filter(Boolean);
                setBatchAdmissionPickerOptions(options);
                if (options.length === 0) {
                    setBatchAdmissionPickerProfileId(null);
                    setBatchAdmissionPickerError("Bạn chưa có hồ sơ học sinh nào. Vui lòng thêm hồ sơ trước khi nộp.");
                } else {
                    setBatchAdmissionPickerProfileId(options[0].id);
                }
            } catch (e) {
                if (cancelled) return;
                setBatchAdmissionPickerOptions([]);
                setBatchAdmissionPickerProfileId(null);
                setBatchAdmissionPickerError(
                    e?.response?.data?.message || e?.message || "Không tải được danh sách hồ sơ học sinh.",
                );
            } finally {
                if (!cancelled) setBatchAdmissionPickerLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [batchAdmissionPickerOpen]);

    const loadAvailabilityCatalogOnce = React.useCallback(async () => {
        if (availabilityCatalogRef.current.length > 0) return availabilityCatalogRef.current;
        const res = await getParentAdmissionDocuments();
        const {required, optional} = pickAdmissionDocumentsFromResponse(res);
        const initial = buildInitialDocsState(required, optional);
        availabilityCatalogRef.current = cloneEmptyCatalogDocs(initial);
        return availabilityCatalogRef.current;
    }, []);

    const fetchAvailabilityModalData = React.useCallback(async () => {
        const sid = Number(availabilityStudentProfileId);
        if (!Number.isFinite(sid) || sid <= 0) return;
        if (availabilityPendingSchoolIds.length === 0) return;

        const seq = ++availabilityModalSeqRef.current;
        setAvailabilityCheckLoading(true);
        setAvailabilityError("");
        setAvailabilityTemplateError("");
        setAvailabilityResult({unavailable: [], available: [], message: ""});
        setAvailabilityTemplateDocs([]);
        setAvailabilitySelectedSchoolIds([]);
        setAvailabilitySchoolSearch("");

        try {
            const catalog = await loadAvailabilityCatalogOnce();
            if (seq !== availabilityModalSeqRef.current) return;

            const [templateSettled, availabilitySettled, studentSettled] = await Promise.allSettled([
                getParentAdmissionReservationFormTemplate(sid),
                putParentAdmissionSchoolsAvailability(sid, availabilityPendingSchoolIds),
                getParentStudentById(sid),
            ]);
            if (seq !== availabilityModalSeqRef.current) return;

            if (studentSettled.status === "fulfilled") {
                const studentBody = pickStudentDetailBodyFromResponse(studentSettled.value);
                setAvailabilityStudentSummary(mapStudentProfileForAvailabilitySummary(studentBody));
            }

            if (availabilitySettled.status === "fulfilled") {
                setAvailabilityResult(
                    pickAdmissionSchoolsAvailabilityFromResponse(availabilitySettled.value),
                );
            } else {
                setAvailabilityResult({unavailable: [], available: [], message: ""});
                const availErr = availabilitySettled.reason;
                setAvailabilityError(
                    availErr?.response?.data?.message ||
                        availErr?.message ||
                        "Không kiểm tra được trạng thái trường.",
                );
            }

            if (templateSettled.status === "fulfilled") {
                const body = pickReservationTemplateBodyFromResponse(templateSettled.value);
                const bodySid = pickStudentProfileIdFromTemplateBody(body);
                if (bodySid != null && bodySid !== sid) {
                    setAvailabilityTemplateDocs(cloneEmptyCatalogDocs(catalog));
                    setAvailabilityTemplateError(
                        "Không tải được hồ sơ giữ chỗ của học sinh này. Vui lòng lưu hồ sơ tại trang Hồ sơ giữ chỗ.",
                    );
                } else {
                    const applied = applyReservationTemplateToDocs(catalog, body, sid);
                    setAvailabilityTemplateDocs(applied);
                    if (!hasSavedReservationTemplateForStudent(body, sid)) {
                        setAvailabilityTemplateError("__TEMPLATE_OUTDATED__");
                    }
                }
            } else {
                const templateErr = templateSettled.reason;
                setAvailabilityTemplateDocs(cloneEmptyCatalogDocs(catalog));
                if (templateErr?.response?.status === 404) {
                    setAvailabilityTemplateError("__TEMPLATE_NULL__");
                } else {
                    setAvailabilityTemplateError(
                        templateErr?.response?.data?.message ||
                            templateErr?.message ||
                            "Không tải được hồ sơ giữ chỗ.",
                    );
                }
            }
        } catch (e) {
            if (seq !== availabilityModalSeqRef.current) return;
            setAvailabilityError(
                e?.response?.data?.message || e?.message || "Không tải được dữ liệu kiểm tra hồ sơ.",
            );
        } finally {
            if (seq === availabilityModalSeqRef.current) {
                setAvailabilityCheckLoading(false);
            }
        }
    }, [availabilityStudentProfileId, availabilityPendingSchoolIds, loadAvailabilityCatalogOnce]);

    React.useEffect(() => {
        if (!availabilityDialogOpen) return undefined;
        if (availabilityStudentProfileId == null || availabilityPendingSchoolIds.length === 0) {
            return undefined;
        }
        fetchAvailabilityModalData();
        return () => {
            availabilityModalSeqRef.current += 1;
        };
    }, [
        availabilityDialogOpen,
        availabilityStudentProfileId,
        availabilityPendingSchoolIds,
        fetchAvailabilityModalData,
    ]);

    const availabilityUnavailableRows = React.useMemo(() => {
        const groups = Array.isArray(availabilityResult.unavailable) ? availabilityResult.unavailable : [];
        const out = [];
        for (const g of groups) {
            if (Array.isArray(g?.schools)) {
                const reason = String(g?.reason || "").trim() || "Không đủ điều kiện.";
                for (const s of g.schools) {
                    out.push({
                        key: `${reason}-${s?.schoolId ?? s?.schoolName}`,
                        schoolId: s?.schoolId,
                        schoolName: String(s?.schoolName || "").trim() || `Trường #${s?.schoolId ?? "—"}`,
                        reason,
                    });
                }
            } else if (g?.schoolId != null || g?.schoolName) {
                out.push({
                    key: `u-${g?.schoolId ?? g?.schoolName}`,
                    schoolId: g.schoolId,
                    schoolName: String(g.schoolName || "").trim() || `Trường #${g.schoolId ?? "—"}`,
                    reason: String(g.reason || g.message || "").trim() || "Không đủ điều kiện.",
                });
            }
        }
        return out;
    }, [availabilityResult.unavailable]);

    const availabilityOrderedDisplayRows = React.useMemo(() => {
        if (!availabilityDialogOpen || availabilityStudentProfileId == null) return [];
        if (availabilityCheckLoading || availabilityError) return [];
        const availableList = Array.isArray(availabilityResult.available) ? availabilityResult.available : [];
        const availableById = new Map();
        for (const a of availableList) {
            const id = Number(a?.schoolId);
            if (Number.isFinite(id)) availableById.set(id, a);
        }
        const unavailableById = new Map();
        for (const row of availabilityUnavailableRows) {
            const id = Number(row?.schoolId);
            if (Number.isFinite(id)) unavailableById.set(id, row);
        }
        const lookupSchools = Array.isArray(pageSchools) ? pageSchools : [];
        return availabilityPendingSchoolIds
            .map((rawId) => {
                const id = Number(rawId);
                if (!Number.isFinite(id)) return null;
                if (availableById.has(id)) {
                    const a = availableById.get(id);
                    return {
                        kind: "available",
                        key: `a-${id}`,
                        schoolId: id,
                        schoolName: String(a?.schoolName || "").trim() || `Trường #${id}`,
                    };
                }
                if (unavailableById.has(id)) {
                    const u = unavailableById.get(id);
                    return {
                        kind: "unavailable",
                        key: `u-${id}`,
                        schoolId: id,
                        schoolName: u.schoolName,
                        reason: u.reason,
                    };
                }
                const school = lookupSchools.find((s) => Number(getBatchRowSchoolId(s)) === id);
                const schoolName =
                    String(resolveSchoolName?.(school) || "").trim() || `Trường #${id}`;
                return {
                    kind: "invalid",
                    key: `i-${id}`,
                    schoolId: id,
                    schoolName,
                    reason: "Hệ thống không trả về trạng thái kiểm tra cho trường này.",
                };
            })
            .filter(Boolean);
    }, [
        availabilityDialogOpen,
        availabilityStudentProfileId,
        availabilityCheckLoading,
        availabilityError,
        availabilityPendingSchoolIds,
        availabilityResult.available,
        availabilityUnavailableRows,
        pageSchools,
        resolveSchoolName,
    ]);

    const orderedAvailableAdmissionIds = React.useMemo(() => {
        const availableIds = new Set(
            (Array.isArray(availabilityResult.available) ? availabilityResult.available : [])
                .map((a) => Number(a?.schoolId))
                .filter((id) => Number.isFinite(id) && id > 0),
        );
        return availabilityPendingSchoolIds.filter((id) => availableIds.has(Number(id)));
    }, [availabilityPendingSchoolIds, availabilityResult.available]);

    React.useEffect(() => {
        if (!availabilityDialogOpen || availabilityCheckLoading || availabilityError) return;
        setAvailabilitySelectedSchoolIds(orderedAvailableAdmissionIds);
    }, [
        availabilityDialogOpen,
        availabilityCheckLoading,
        availabilityError,
        orderedAvailableAdmissionIds,
    ]);

    const selectedAvailableAdmissionIds = React.useMemo(() => {
        const selected = new Set(
            (Array.isArray(availabilitySelectedSchoolIds) ? availabilitySelectedSchoolIds : [])
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id) && id > 0),
        );
        return orderedAvailableAdmissionIds.filter((id) => selected.has(Number(id)));
    }, [orderedAvailableAdmissionIds, availabilitySelectedSchoolIds]);

    const toggleAvailabilitySchoolSelected = React.useCallback((schoolId) => {
        const id = Number(schoolId);
        if (!Number.isFinite(id)) return;
        setAvailabilitySelectedSchoolIds((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const exists = list.some((item) => Number(item) === id);
            if (exists) return list.filter((item) => Number(item) !== id);
            return [...list, id];
        });
    }, []);

    const availabilitySchoolGroups = React.useMemo(() => {
        const available = [];
        const blocked = [];
        for (const row of availabilityOrderedDisplayRows) {
            if (row.kind === "available") available.push(row);
            else blocked.push(row);
        }
        return {available, blocked};
    }, [availabilityOrderedDisplayRows]);

    const filteredAvailableSchoolRows = React.useMemo(
        () => filterAvailabilitySchoolRows(availabilitySchoolGroups.available, availabilitySchoolSearch),
        [availabilitySchoolGroups.available, availabilitySchoolSearch],
    );

    const filteredBlockedSchoolRows = React.useMemo(
        () => filterAvailabilitySchoolRows(availabilitySchoolGroups.blocked, availabilitySchoolSearch),
        [availabilitySchoolGroups.blocked, availabilitySchoolSearch],
    );

    const allFilteredAvailableSelected = React.useMemo(() => {
        if (filteredAvailableSchoolRows.length === 0) return false;
        const selected = new Set(
            availabilitySelectedSchoolIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)),
        );
        return filteredAvailableSchoolRows.every((row) => selected.has(Number(row.schoolId)));
    }, [filteredAvailableSchoolRows, availabilitySelectedSchoolIds]);

    const toggleSelectAllFilteredAvailable = React.useCallback(() => {
        const nextChecked = !allFilteredAvailableSelected;
        setAvailabilitySelectedSchoolIds((prev) => {
            const selected = new Set(
                (Array.isArray(prev) ? prev : []).map((id) => Number(id)).filter((id) => Number.isFinite(id)),
            );
            if (nextChecked) {
                filteredAvailableSchoolRows.forEach((row) => selected.add(Number(row.schoolId)));
            } else {
                filteredAvailableSchoolRows.forEach((row) => selected.delete(Number(row.schoolId)));
            }
            return orderedAvailableAdmissionIds.filter((id) => selected.has(Number(id)));
        });
    }, [allFilteredAvailableSelected, filteredAvailableSchoolRows, orderedAvailableAdmissionIds]);

    const validateBeforeAvailabilitySubmit = React.useCallback(() => {
        const sid = Number(availabilityStudentProfileId);
        if (!Number.isFinite(sid) || sid <= 0) {
            showWarningSnackbar("Vui lòng chọn hồ sơ học sinh.");
            return false;
        }
        if (orderedAvailableAdmissionIds.length === 0) {
            showWarningSnackbar("Không có trường nào đủ điều kiện để nộp hồ sơ.");
            return false;
        }
        if (selectedAvailableAdmissionIds.length === 0) {
            showWarningSnackbar("Vui lòng chọn ít nhất một trường hợp lệ để nộp hồ sơ.");
            return false;
        }
        if (availabilityTemplateError) {
            showWarningSnackbar(availabilityTemplateError);
            return false;
        }
        const submissionDocuments = buildSubmissionDocumentsPayload(availabilityTemplateDocs);
        if (submissionDocuments.length === 0) {
            showWarningSnackbar(
                "Hồ sơ giữ chỗ chưa có minh chứng. Vui lòng lưu hồ sơ tại trang Hồ sơ giữ chỗ.",
            );
            return false;
        }
        return true;
    }, [
        availabilityStudentProfileId,
        availabilityTemplateDocs,
        availabilityTemplateError,
        orderedAvailableAdmissionIds.length,
        selectedAvailableAdmissionIds.length,
    ]);

    const handleRequestSubmitAdmissionAfterAvailability = React.useCallback(() => {
        if (!validateBeforeAvailabilitySubmit()) return;
        setAvailabilitySubmitConfirmOpen(true);
    }, [validateBeforeAvailabilitySubmit]);

    const handleConfirmAdmissionAfterAvailability = React.useCallback(async () => {
        if (!validateBeforeAvailabilitySubmit()) return;

        const sid = Number(availabilityStudentProfileId);
        const submissionDocuments = buildSubmissionDocumentsPayload(availabilityTemplateDocs);

        setAvailabilitySubmitting(true);
        try {
            const res = await postParentAdmissionReservationForm({
                studentProfileId: sid,
                schoolIds: selectedAvailableAdmissionIds,
                submissionDocuments,
            });
            showSuccessSnackbar(
                res?.data?.message || "Nộp hồ sơ vào trường thành công.",
            );
            setAvailabilitySubmitConfirmOpen(false);
            closeAdmissionAvailabilityDialog();
            setBatchAdmissionSelectedIds([]);
            navigate(PARENT_ADMISSION_RESERVATIONS_PATH);
        } catch (e) {
            console.error("[useBatchAdmissionFromSchoolList] submit admission form:", e);
            showErrorSnackbar(
                e?.response?.data?.message || e?.message || "Nộp hồ sơ thất bại, vui lòng thử lại.",
            );
        } finally {
            setAvailabilitySubmitting(false);
        }
    }, [
        availabilityStudentProfileId,
        availabilityTemplateDocs,
        closeAdmissionAvailabilityDialog,
        navigate,
        selectedAvailableAdmissionIds,
        validateBeforeAvailabilitySubmit,
    ]);

    return {
        batchAdmissionSelectedIds,
        batchPageSchoolIds,
        allBatchPageSelected,
        someBatchPageSelected,
        toggleBatchSelectRow,
        toggleBatchSelectAllShown,
        handleBatchSubmitFromList,
        batchAdmissionPickerOpen,
        batchAdmissionPickerLoading,
        batchAdmissionPickerOptions,
        batchAdmissionPickerProfileId,
        setBatchAdmissionPickerProfileId,
        batchAdmissionPickerError,
        closeStudentPickerForAdmission,
        confirmStudentPickerForAdmission,
        availabilityDialogOpen,
        closeAdmissionAvailabilityDialog,
        availabilityStudentProfileId,
        availabilityStudentDisplayName,
        availabilityCheckLoading,
        availabilityError,
        setAvailabilityError,
        availabilityTemplateDocs,
        availabilityTemplateError,
        availabilitySubmitting,
        availabilityStudentSummary,
        availabilityImagePreview,
        setAvailabilityImagePreview,
        availabilitySelectedSchoolIds,
        availabilitySchoolSearch,
        setAvailabilitySchoolSearch,
        availabilitySubmitConfirmOpen,
        setAvailabilitySubmitConfirmOpen,
        availabilityOrderedDisplayRows,
        selectedAvailableAdmissionIds,
        orderedAvailableAdmissionIds,
        toggleAvailabilitySchoolSelected,
        availabilitySchoolGroups,
        filteredAvailableSchoolRows,
        filteredBlockedSchoolRows,
        allFilteredAvailableSelected,
        toggleSelectAllFilteredAvailable,
        handleRequestSubmitAdmissionAfterAvailability,
        handleConfirmAdmissionAfterAvailability,
    };
}
