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
    if (!student || typeof student !== 'object') return null;
    const raw = student.studentProfileId ?? student.id ?? student.studentId ?? null;
    if (raw == null) return null;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : null;
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

export function pickStudentBirthYear(student) {
    const raw = student?.dateOfBirth || student?.dob || student?.birthday;
    if (!raw) return '';
    const m = String(raw).match(/(\d{4})/);
    return m ? m[1] : '';
}

export function pickStudentSubLabel(student) {
    const parts = [];
    const gender = pickStudentGenderLabel(student);
    if (gender) parts.push(gender);
    const birthYear = pickStudentBirthYear(student);
    if (birthYear) parts.push(`Sinh năm ${birthYear}`);
    const code = student?.studentCode;
    if (code != null && String(code).trim() !== '') parts.push(`CCCD: ${String(code).trim()}`);
    return parts.join(' • ');
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

/** GET template / documents — required + optional. */
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

export function pickSubmissionDocumentsFromTemplateResponse(response) {
    const data = response?.data;
    const inner = unwrapApiBody(data);
    if (!inner) return [];
    const raw =
        inner.submissionDocuments ||
        inner.profileMetadata ||
        inner.documents ||
        inner.submittedDocuments;
    return Array.isArray(raw) ? raw : [];
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
