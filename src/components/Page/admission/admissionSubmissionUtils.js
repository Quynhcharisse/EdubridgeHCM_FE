import {
    normalizeReservationStatus,
    pickReservationPaymentAgainCount,
} from '../../../constants/reservationStatusConfig.js';

export const HOC_BA_THCS_CODE = 'HOC_BA';
export const HOC_BA_THCS_GRADE_LABELS = ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];

export const DOCUMENT_LABELS = {
    HOC_BA: 'Học bạ',
    GIAY_KSTN: 'Giấy khai sinh',
    GIAY_KHAI_SINH: 'Giấy khai sinh',
    ANH_THE: 'Ảnh thẻ',
    HB12: 'Học bạ lớp 12',
    CCCD: 'CCCD/CMND',
};

export function documentLabelForCode(code) {
    const key = String(code || '').trim().toUpperCase();
    return DOCUMENT_LABELS[key] || String(code || '').trim() || 'Minh chứng';
}

export const ACCEPT_IMAGE_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/x-png', 'image/webp']);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const SECTION_LABEL_SX = {
    fontSize: '0.78rem',
    fontWeight: 800,
    color: '#1e3a8a',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    mb: 0.8,
};

export function isAllowedImage(file) {
    const type = (file?.type || '').toLowerCase();
    if (ACCEPT_IMAGE_MIME.has(type)) return true;
    const name = (file?.name || '').toLowerCase();
    return /\.(jpe?g|png|webp)$/i.test(name);
}

export function formatBytes(n) {
    if (!Number.isFinite(n)) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function unwrapApiBody(data) {
    if (data == null) return null;
    let inner = data.body ?? data;
    if (typeof inner === 'string') {
        try {
            inner = JSON.parse(inner);
        } catch {
            return null;
        }
    }
    if (inner && typeof inner === 'object' && inner.body != null && typeof inner.body === 'object' && !Array.isArray(inner.body)) {
        inner = inner.body;
    }
    return inner && typeof inner === 'object' ? inner : null;
}

export function extractStudentRecords(response) {
    const data = response?.data;
    if (data == null) return [];
    let inner = data.body ?? data;
    if (typeof inner === 'string') {
        try {
            inner = JSON.parse(inner);
        } catch {
            return [];
        }
    }
    if (Array.isArray(inner)) return inner;
    if (Array.isArray(inner?.students)) return inner.students;
    if (Array.isArray(inner?.data)) return inner.data;
    if (inner && typeof inner === 'object') return [inner];
    return [];
}

export function pickStudentName(student) {
    if (!student || typeof student !== 'object') return '';
    return student.studentName || student.childName || student.fullName || student.name || '';
}

export function pickStudentId(student) {
    return pickStudentProfileIdForTemplateApi(student);
}

export function pickStudentProfileIdForTemplateApi(student) {
    if (!student || typeof student !== 'object') return null;
    const raw =
        student.studentProfileId ??
        student.profileId ??
        student.id ??
        student.studentId ??
        null;
    if (raw == null) return null;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? Math.trunc(num) : null;
}

const GENDER_LABELS = {
    MALE: 'Nam',
    FEMALE: 'Nữ',
    OTHER: 'Khác',
    M: 'Nam',
    F: 'Nữ',
};

export function pickStudentGenderLabel(student) {
    const raw = student?.gender;
    if (raw == null) return '';
    const key = String(raw).trim().toUpperCase();
    return GENDER_LABELS[key] || (typeof raw === 'string' ? raw : '');
}

export function pickStudentCode(student) {
    if (!student || typeof student !== 'object') return '';
    const raw = student.studentCode ?? student.student_code;
    return raw != null ? String(raw).trim() : '';
}

const TRANSCRIPT_GRADE_ORDER = ['GRADE_06', 'GRADE_07', 'GRADE_08', 'GRADE_09'];

/** Map BE `transcriptImages` → 4 slot URL (lớp 6–9). */
export function mapTranscriptImagesToSlots(transcripts) {
    const slots = buildEmptySlots(HOC_BA_THCS_GRADE_LABELS.length);
    for (const row of Array.isArray(transcripts) ? transcripts : []) {
        const grade = String(row?.grade ?? row?.gradeLevel ?? '').trim().toUpperCase();
        const slotIndex = TRANSCRIPT_GRADE_ORDER.indexOf(grade);
        const url = row?.imageUrl ?? row?.url;
        if (slotIndex >= 0 && url != null && String(url).trim() !== '') {
            slots[slotIndex] = String(url).trim();
        }
    }
    return slots;
}

export function mapStudentProfileForAvailabilitySummary(student) {
    if (!student || typeof student !== 'object') return null;
    const genderLabel = pickStudentGenderLabel(student);
    const studentCode = pickStudentCode(student);
    return {
        genderLabel: genderLabel || '—',
        studentCode: studentCode || '—',
        transcriptSlots: mapTranscriptImagesToSlots(student.transcriptImages),
    };
}

export function pickStudentBirthYear(student) {
    const raw = student?.dateOfBirth || student?.dob || student?.birthday;
    if (!raw) return '';
    const m = String(raw).match(/(\d{4})/);
    return m ? m[1] : '';
}

export function pickStudentSubLabel(student) {
    return pickStudentGenderLabel(student);
}

export function mapStudentsForPicker(response) {
    return extractStudentRecords(response)
        .map((s) => ({
            id: pickStudentId(s),
            name: pickStudentName(s) || 'Học sinh',
            subLabel: pickStudentSubLabel(s),
            raw: s,
        }))
        .filter((s) => s.id != null);
}

export function buildEmptySlots(count) {
    return Array.from({length: count}, () => null);
}

export function buildInitialDocsState(required, optional) {
    const list = [];
    for (const item of required || []) {
        if (!item || !item.code) continue;
        const slotCount = item.code === HOC_BA_THCS_CODE ? HOC_BA_THCS_GRADE_LABELS.length : 1;
        list.push({
            code: String(item.code),
            name: String(item.name || item.code || ''),
            required: true,
            slots: buildEmptySlots(slotCount),
        });
    }
    for (const item of optional || []) {
        if (!item || !item.code) continue;
        const slotCount = item.code === HOC_BA_THCS_CODE ? HOC_BA_THCS_GRADE_LABELS.length : 1;
        list.push({
            code: String(item.code),
            name: String(item.name || item.code || ''),
            required: false,
            slots: buildEmptySlots(slotCount),
        });
    }
    return list;
}

function normalizeDocListItem(item) {
    if (!item || typeof item !== 'object') return null;
    const code = item.code ?? item.key ?? item.documentCode;
    if (code == null || String(code).trim() === '') return null;
    return {
        code: String(code).trim(),
        name: String(item.name || item.label || item.documentName || code).trim(),
        required: item.required !== false,
    };
}

function docsFromMandatoryAll(mandatoryAll) {
    const required = [];
    const optional = [];
    for (const raw of mandatoryAll || []) {
        const item = normalizeDocListItem(raw);
        if (!item) continue;
        if (item.required) required.push(item);
        else optional.push(item);
    }
    return {required, optional};
}

export function pickTemplateFormDocumentsFromResponse(response) {
    const data = response?.data;
    if (data == null) return {required: [], optional: []};

    let required = Array.isArray(data.required) ? data.required : [];
    let optional = Array.isArray(data.optional) ? data.optional : [];

    const inner = unwrapApiBody(data);
    if (inner) {
        if (!required.length && Array.isArray(inner.required)) required = inner.required;
        if (!optional.length && Array.isArray(inner.optional)) optional = inner.optional;

        const mandatoryAll =
            inner.mandatoryAll ||
            inner.documentRequirements?.mandatoryAll ||
            inner.documentRequirementsData?.mandatoryAll ||
            inner.admissionSettingsData?.documentRequirements?.mandatoryAll ||
            inner.admissionSettingsData?.documentRequirementsData?.mandatoryAll;
        if ((!required.length && !optional.length) && Array.isArray(mandatoryAll)) {
            return docsFromMandatoryAll(mandatoryAll);
        }

        const byMethod =
            inner.byMethod ||
            inner.documentRequirements?.byMethod ||
            inner.documentRequirementsData?.byMethod;
        if ((!required.length && !optional.length) && Array.isArray(byMethod)) {
            const merged = [];
            for (const group of byMethod) {
                const docs = group?.documents || group?.items;
                if (!Array.isArray(docs)) continue;
                for (const d of docs) {
                    const item = normalizeDocListItem(d);
                    if (item) merged.push(item);
                }
            }
            if (merged.length) {
                return {
                    required: merged.filter((d) => d.required),
                    optional: merged.filter((d) => !d.required),
                };
            }
        }
    }

    const normalizedRequired = (required || []).map(normalizeDocListItem).filter(Boolean);
    const normalizedOptional = (optional || []).map(normalizeDocListItem).filter(Boolean);
    if (normalizedRequired.length || normalizedOptional.length) {
        return {required: normalizedRequired, optional: normalizedOptional};
    }

    const subs =
        (inner && (inner.submissionDocuments || inner.templateSubmissionDocuments)) ||
        (Array.isArray(data.submissionDocuments) ? data.submissionDocuments : []);
    if (Array.isArray(subs) && subs.length) {
        const fromKeys = subs
            .map((s) => {
                const code = s?.key ?? s?.code;
                if (code == null || String(code).trim() === '') return null;
                return {
                    code: String(code).trim(),
                    name: documentLabelForCode(code),
                    required: true,
                };
            })
            .filter(Boolean);
        if (fromKeys.length) return {required: fromKeys, optional: []};
    }

    return {required: [], optional: []};
}

export function pickReservationTemplateBodyFromResponse(response) {
    const data = response?.data;
    return unwrapApiBody(data);
}

export function pickStudentProfileIdFromTemplateBody(body) {
    if (!body || typeof body !== 'object') return null;
    const raw = body.studentProfileId ?? body.studentId;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

export function pickAdmissionReservationFormTemplateIdFromBody(body, studentProfileId = null) {
    if (!body || typeof body !== 'object') return null;
    const sid = Number(
        studentProfileId ?? body.studentProfileId ?? body.studentId ?? body.student?.id,
    );
    const explicit =
        body.admissionReservationFormTemplateId ??
        body.admission_reservation_form_template_id ??
        body.reservationFormTemplateId ??
        body.reservationTemplateId ??
        body.formTemplateId ??
        body.templateId ??
        body.admissionReservationFormTemplate?.id;
    const fromExplicit = Number(explicit);
    if (Number.isFinite(fromExplicit) && fromExplicit > 0) {
        return Math.trunc(fromExplicit);
    }
    const bodyId = Number(body.id);
    if (Number.isFinite(bodyId) && bodyId > 0) {
        // If the body has a dedicated studentProfileId field, body.id is always the template record ID.
        const hasExplicitSid =
            body.studentProfileId != null || body.studentId != null || body.student?.id != null;
        if (hasExplicitSid) return Math.trunc(bodyId);
        // No studentProfileId in body: skip body.id only if it equals the caller-supplied sid,
        // which would mean the endpoint returned the student record, not a template record.
        if (!Number.isFinite(sid) || sid <= 0 || bodyId !== sid) return Math.trunc(bodyId);
    }
    return null;
}

export function pickAdmissionReservationFormTemplateIdFromResponse(response, studentProfileId = null) {
    const fromBody = pickAdmissionReservationFormTemplateIdFromBody(
        pickReservationTemplateBodyFromResponse(response),
        studentProfileId,
    );
    if (fromBody) return fromBody;
    const data = response?.data;
    if (!data || typeof data !== 'object') return null;
    const top = Number(data.admissionReservationFormTemplateId);
    if (Number.isFinite(top) && top > 0) return Math.trunc(top);
    return null;
}

export function templateBodyBelongsToStudent(body, studentProfileId) {
    const expected = Number(studentProfileId);
    if (!Number.isFinite(expected) || expected <= 0) return false;
    const actual = pickStudentProfileIdFromTemplateBody(body);
    if (actual == null) return false;
    return actual === expected;
}

export function cloneEmptyCatalogDocs(catalogDocs) {
    return (catalogDocs || []).map((d) => ({
        ...d,
        slots: d.slots.map(() => null),
    }));
}

function templateBodyHasSavedContent(body) {
    if (!body || typeof body !== 'object') return false;
    if (body.isApplied === true || body.isApplied === 'true') return true;
    const meta = pickProfileMetaDataFromTemplate(body);
    if (
        meta.some(
            (d) =>
                Array.isArray(d?.imageUrl) &&
                d.imageUrl.some((u) => typeof u === 'string' && u.trim() !== ''),
        )
    ) {
        return true;
    }
    const transcripts = body.transcriptImages;
    return (
        Array.isArray(transcripts) &&
        transcripts.some((t) => t?.imageUrl != null && String(t.imageUrl).trim() !== '')
    );
}

export function hasSavedReservationTemplate(body) {
    return templateBodyHasSavedContent(body);
}

export function hasSavedReservationTemplateForStudent(body, studentProfileId) {
    const sid = Number(studentProfileId);
    if (!Number.isFinite(sid) || sid <= 0) return false;
    if (!templateBodyHasSavedContent(body)) return false;
    const bodySid = pickStudentProfileIdFromTemplateBody(body);
    if (bodySid != null && bodySid !== sid) return false;
    if (bodySid === sid) return true;
    // bodySid == null: body doesn't carry studentProfileId (BE omits it).
    // The template was fetched by studentProfileId query param, so if it has
    // saved content it belongs to this student.
    return true;
}

export function pickProfileMetaDataFromTemplate(body) {
    if (!body || typeof body !== 'object') return [];
    const raw =
        body.profileMetaData ||
        body.profileMetadata ||
        body.submissionDocuments ||
        body.documents ||
        body.submittedDocuments;
    return Array.isArray(raw) ? raw : [];
}

/** Keys gửi khi duyệt/từ chối đơn (profileMetaData + HOC_BA nếu có học bạ). */
export function pickCheckedDocumentsFromReservation(item) {
    if (!item || typeof item !== 'object') return [];
    const keys = new Set();
    for (const doc of pickProfileMetaDataFromTemplate(item)) {
        const key = String(doc?.key ?? doc?.code ?? '').trim();
        if (!key) continue;
        const urls = Array.isArray(doc?.imageUrl) ? doc.imageUrl : [];
        const hasImage = urls.some((u) => u != null && String(u).trim() !== '');
        if (hasImage) keys.add(key);
    }
    const transcripts = Array.isArray(item.transcriptImages) ? item.transcriptImages : [];
    if (transcripts.some((t) => t?.imageUrl != null && String(t.imageUrl).trim() !== '')) {
        keys.add(HOC_BA_THCS_CODE);
    }
    return Array.from(keys);
}

export function pickSubmissionDocumentsFromTemplateResponse(response) {
    const inner = pickReservationTemplateBodyFromResponse(response);
    if (!inner) return [];
    return pickProfileMetaDataFromTemplate(inner);
}

const RESERVATION_NA_LITERALS = new Set(['n/a', 'na', 'null', 'undefined', '-', '—', 'none']);

export function sanitizeReservationDisplayValue(value) {
    if (value == null) return null;
    const s = String(value).trim();
    if (!s) return null;
    if (RESERVATION_NA_LITERALS.has(s.toLowerCase())) return null;
    return s;
}

function pickReservationField(item, ...keys) {
    if (!item || typeof item !== 'object') return null;
    for (const key of keys) {
        const v = sanitizeReservationDisplayValue(item[key]);
        if (v != null) return v;
    }
    return null;
}

function pickReservationNumericId(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

export const CONFIRMED_RESERVATION_STATUSES = new Set([
    'RESERVATION_APPROVAL',
    'RESERVATION_CONFIRMED',
    'CONFIRMED',
    'APPROVED',
    'ACCEPTED',
]);

export function isReservationConfirmed(status) {
    const key = String(status || '').trim().toUpperCase();
    return CONFIRMED_RESERVATION_STATUSES.has(key);
}

export function normalizeParentAdmissionReservationRow(item, index = 0) {
    if (!item || typeof item !== 'object') return null;
    const profileMetadata = pickProfileMetaDataFromTemplate(item);
    const transcriptImages = Array.isArray(item.transcriptImages) ? item.transcriptImages : [];
    const campusProgramOfferingId = pickReservationNumericId(item.campusProgramOfferingId);
    const schoolId = pickReservationNumericId(
        item.schoolId ?? item.school?.id ?? item.school?.schoolId,
    );

    const admissionFormId = pickReservationNumericId(
        item.admissionFormId ?? item.id ?? item.formId,
    );

    return {
        ...item,
        id: admissionFormId ?? index,
        admissionFormId,
        schoolId,
        studentProfileId: pickReservationNumericId(item.studentProfileId),
        parentProfileId: pickReservationNumericId(item.parentProfileId),
        studentName: pickReservationField(item, 'studentName', 'childName', 'studentProfileName'),
        studentCode: pickReservationField(item, 'studentCode'),
        gender: item.gender ?? null,
        identityCard: pickReservationField(item, 'identityCard'),
        schoolName: pickReservationField(item, 'schoolName'),
        programName: pickReservationField(item, 'programName'),
        campusName: pickReservationField(item, 'campusName'),
        campusProgramOfferingId,
        parentName: pickReservationField(item, 'parentName', 'guardianName'),
        parentPhone: pickReservationField(item, 'parentPhone', 'phone'),
        parentEmail: pickReservationField(item, 'parentEmail'),
        address: pickReservationField(item, 'address'),
        methodName: pickReservationField(item, 'methodName'),
        admissionMethodCode: pickReservationField(item, 'admissionMethodCode', 'methodCode'),
        createdTime: item.createdTime ?? item.submittedAt ?? item.createdAt ?? item.createdDate ?? null,
        updatedTime: item.updatedTime ?? null,
        status: normalizeReservationStatus(item.status ?? item.formStatus) || null,
        rejectReason: pickReservationField(item, 'rejectReason'),
        cancelReason: pickReservationField(item, 'cancelReason'),
        paymentAgainCount: pickReservationPaymentAgainCount(item),
        transferCode: pickReservationField(item, 'transferCode'),
        paymentProofUrl: pickReservationField(item, 'paymentProofUrl'),
        profileMetadata,
        transcriptImages,
    };
}

export function submissionDocumentsToReadonlyDocs(submissionDocuments) {
    if (!Array.isArray(submissionDocuments)) return [];
    return submissionDocuments
        .map((doc) => {
            const code = String(doc?.key ?? doc?.code ?? '').trim();
            if (!code) return null;
            let urls = Array.isArray(doc?.imageUrl) ? doc.imageUrl : [];
            urls = urls
                .map((u) => (typeof u === 'string' ? u.trim() : ''))
                .filter((u) => u !== '');
            if (!urls.length && doc?.url != null && String(doc.url).trim() !== '') {
                urls = [String(doc.url).trim()];
            }
            if (!urls.length) return null;
            const slotCount = code === HOC_BA_THCS_CODE ? HOC_BA_THCS_GRADE_LABELS.length : urls.length;
            const slots = Array.from({length: slotCount}, (_, i) => urls[i] ?? null);
            return {
                code,
                name: documentLabelForCode(code),
                required: true,
                slots,
            };
        })
        .filter(Boolean);
}

export function reservationToReadonlyDocs(reservation) {
    if (!reservation || typeof reservation !== 'object') return [];
    let docs = submissionDocumentsToReadonlyDocs(
        reservation.profileMetadata ?? pickProfileMetaDataFromTemplate(reservation),
    );

    const transcripts = Array.isArray(reservation.transcriptImages) ? reservation.transcriptImages : [];
    if (!transcripts.length) return docs;

    const slots = mapTranscriptImagesToSlots(transcripts);
    if (!slots.some((u) => u != null && String(u).trim() !== '')) return docs;

    const hocBaIndex = docs.findIndex((d) => d.code === HOC_BA_THCS_CODE);
    if (hocBaIndex >= 0) {
        docs = docs.slice();
        docs[hocBaIndex] = {...docs[hocBaIndex], slots};
    } else {
        docs = [
            ...docs,
            {
                code: HOC_BA_THCS_CODE,
                name: documentLabelForCode(HOC_BA_THCS_CODE),
                required: true,
                slots,
            },
        ];
    }
    return docs;
}

export function applyReservationTemplateToDocs(catalogDocs, templateBody, studentProfileId) {
    if (!Array.isArray(catalogDocs) || !catalogDocs.length) return catalogDocs || [];
    const empty = cloneEmptyCatalogDocs(catalogDocs);
    if (!templateBody || typeof templateBody !== 'object') return empty;
    if (
        studentProfileId != null &&
        !templateBodyBelongsToStudent(templateBody, studentProfileId)
    ) {
        return empty;
    }
    const meta = pickProfileMetaDataFromTemplate(templateBody);
    let next = applySubmissionPrefillToDocs(empty, meta);

    const transcripts = Array.isArray(templateBody?.transcriptImages) ? templateBody.transcriptImages : [];
    if (!transcripts.length) return next;

    const hocBaIndex = next.findIndex((d) => d.code === HOC_BA_THCS_CODE);
    if (hocBaIndex < 0) return next;

    const slots = mapTranscriptImagesToSlots(transcripts);
    next = next.slice();
    next[hocBaIndex] = {...next[hocBaIndex], slots};
    return next;
}

export function applySubmissionPrefillToDocs(docs, submissionDocuments) {
    if (!Array.isArray(submissionDocuments) || !submissionDocuments.length) return docs;
    return docs.map((doc) => {
        const match = submissionDocuments.find(
            (s) => String(s?.key ?? s?.code ?? '').trim() === doc.code,
        );
        if (!match) return doc;
        const urls = (Array.isArray(match.imageUrl) ? match.imageUrl : [])
            .map((u) => (typeof u === 'string' ? u.trim() : ''))
            .filter(Boolean);
        if (!urls.length) return doc;
        const slots = doc.slots.map((_, i) => urls[i] ?? null);
        return {...doc, slots};
    });
}

export function buildSubmissionDocumentsPayload(docs) {
    return docs
        .map((doc) => {
            const imageUrl = doc.slots.filter((u) => typeof u === 'string' && u.trim() !== '');
            if (imageUrl.length === 0) return null;
            return {key: doc.code, imageUrl};
        })
        .filter(Boolean);
}

export function pickOfferingProgramName(offering) {
    if (!offering || typeof offering !== 'object') return '';
    return (
        offering?.program?.name ||
        offering?.curriculum?.name ||
        offering?.programName ||
        offering?.name ||
        ''
    );
}

export function validateDocsForSubmit(docs, {requireStudent = true, selectedStudentId = null} = {}) {
    if (requireStudent && (!Number.isFinite(Number(selectedStudentId)) || Number(selectedStudentId) <= 0)) {
        return {ok: false, message: 'Vui lòng chọn hồ sơ học sinh.'};
    }
    for (const doc of docs) {
        if (!doc.required) continue;
        const filledAll = doc.slots.every((u) => typeof u === 'string' && u.trim() !== '');
        if (!filledAll) {
            if (doc.code === HOC_BA_THCS_CODE) {
                return {
                    ok: false,
                    message: `Vui lòng tải đủ ${HOC_BA_THCS_GRADE_LABELS.length} ảnh học bạ THCS (4 năm cấp 2).`,
                };
            }
            return {ok: false, message: `Vui lòng tải ảnh hồ sơ "${doc.name}".`};
        }
    }
    return {ok: true, message: ''};
}
