import axiosClient from '../configs/APIConfig.jsx';

export const getParentStudent = async () => {
    const response = await axiosClient.get('/parent/student');
    return response || null;
};

/**
 * Chi tiết một hồ sơ học sinh (GET /parent/student/{id}) — dùng cho panel « i »; BE tách khỏi payload history chat.
 * TVV có thể gọi cùng endpoint nếu BE cho phép role COUNSELLOR.
 */
export const getParentStudentById = async (studentProfileId) => {
    const id = studentProfileId != null ? String(studentProfileId).trim() : '';
    if (!id) {
        throw new Error('studentProfileId is required');
    }
    const response = await axiosClient.get(`/parent/student/${encodeURIComponent(id)}`, {
        headers: {'X-Device-Type': 'web'},
    });
    return response || null;
};

/**
 * Trích object hồ sơ từ envelope API (message + body, hoặc body là chuỗi JSON).
 * Dùng chung cho GET /parent/student/{id} và GET counsellor tương ứng nếu cùng shape.
 */
export function pickStudentDetailBodyFromResponse(response) {
    const data = response?.data;
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
    return inner && typeof inner === 'object' && !Array.isArray(inner) ? inner : null;
}

/**
 * Map body chi tiết (GET /parent/student/{id}) → state panel chat (cùng các field Header/counsellor đang dùng).
 */
export function normalizeStudentDetailBodyForPanel(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    const subjectsInSystem = Array.isArray(body.subjectsInSystem) ? body.subjectsInSystem : [];
    const pid = body.id ?? body.studentProfileId ?? body.studentId ?? null;
    const childName = String(body.childName ?? body.studentName ?? body.StudentName ?? '').trim();
    const studentName = String(body.studentName ?? body.childName ?? childName).trim();
    const pCode = body.personalityCode ?? body.personalityTypeCode ?? body.personalityType?.code ?? '';
    return {
        ...body,
        studentProfileId: pid != null ? String(pid) : '',
        childName: childName || studentName,
        studentName: studentName || childName,
        personalityCode: pCode,
        personalityTypeCode: body.personalityTypeCode ?? body.personalityCode ?? pCode,
        traits: Array.isArray(body.traits) ? body.traits : [],
        academicProfileMetadata: Array.isArray(body.academicProfileMetadata) ? body.academicProfileMetadata : [],
        academicInfos: Array.isArray(body.academicInfos) ? body.academicInfos : [],
        favouriteJob: body.favouriteJob ?? body.favoriteJob ?? '',
        gender: body.gender ?? '',
        studentCode: body.studentCode != null ? String(body.studentCode) : '',
        subjectsInSystem,
    };
}

/** Danh sách hồ sơ học sinh của phụ huynh (GET /parent/student) — cùng endpoint với {@link getParentStudent}. */
export const getStudents = async () => getParentStudent();

export const postParentStudent = async (payload) => {
    const response = await axiosClient.post('/parent/student', payload);
    return response || null;
};

export const putParentStudent = async (payload) => {
    const response = await axiosClient.put('/parent/student', payload);
    return response || null;
};

export const getParentPersonalityTypes = async () => {
    const response = await axiosClient.get('/parent/personality/type');
    return response || null;
};

export const getParentMajors = async () => {
    const response = await axiosClient.get('/parent/major');
    return response || null;
};

export const getParentSubjects = async () => {
    const response = await axiosClient.get('/parent/subject');
    return response || null;
};

export const postParentTranscriptAutoFill = async (payload) => {
    const response = await axiosClient.post('/parent/transcript/auto/fill', payload);
    return response || null;
};

export const postParentFavouriteSchool = async (payload) => {
    const response = await axiosClient.post('/parent/favourite/school', payload);
    return response || null;
};

export const getParentFavouriteSchools = async (page = 0, pageSize = 10) => {
    const response = await axiosClient.get('/parent/favourite/school', {
        params: {page, pageSize},
    });
    return response || null;
};

export const deleteParentFavouriteSchool = async (schoolId) => {
    const response = await axiosClient.delete(`/parent/favourite/school/${schoolId}`);
    return response || null;
};

export const getParentAdmissionDocuments = async (campusProgramOfferingId) => {
    const id = campusProgramOfferingId != null ? String(campusProgramOfferingId).trim() : '';
    const config = {};
    if (id) {
        config.params = {campusProgramOfferingId: id};
    }
    const response = await axiosClient.get('/parent/documents', config);
    return response || null;
};

function normalizeAdmissionDocItem(item) {
    if (!item || typeof item !== 'object') return null;
    const code = item.code ?? item.key ?? item.documentCode;
    if (code == null || String(code).trim() === '') return null;
    return {
        code: String(code).trim(),
        name: String(item.name || item.label || item.documentName || code).trim(),
        required: item.required !== false,
    };
}

export function pickAdmissionDocumentsFromResponse(response) {
    const data = response?.data;
    if (data == null) return {required: [], optional: []};
    let inner = data.body ?? data;
    if (typeof inner === 'string') {
        try {
            inner = JSON.parse(inner);
        } catch {
            return {required: [], optional: []};
        }
    }
    if (inner && typeof inner === 'object' && !Array.isArray(inner) && inner.body != null) {
        const nested = inner.body;
        inner = Array.isArray(nested) || (nested && typeof nested === 'object') ? nested : inner;
    }

    if (Array.isArray(inner)) {
        const required = [];
        const optional = [];
        for (const raw of inner) {
            const item = normalizeAdmissionDocItem(raw);
            if (!item) continue;
            if (item.required) required.push(item);
            else optional.push(item);
        }
        return {required, optional};
    }

    if (inner && typeof inner === 'object') {
        const required = (Array.isArray(inner.required) ? inner.required : [])
            .map(normalizeAdmissionDocItem)
            .filter(Boolean);
        const optional = (Array.isArray(inner.optional) ? inner.optional : [])
            .map(normalizeAdmissionDocItem)
            .filter(Boolean);
        if (required.length || optional.length) {
            return {required, optional};
        }
    }

    return {required: [], optional: []};
}

export const postParentAdmissionReservationForm = async (payload) => {
    const sid = Number(payload?.studentProfileId);
    const schoolIds = (Array.isArray(payload?.schoolIds) ? payload.schoolIds : [])
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0);
    const body = {
        studentProfileId: Math.trunc(sid),
        schoolIds,
        submissionDocuments: Array.isArray(payload?.submissionDocuments)
            ? payload.submissionDocuments
            : [],
    };
    const offeringId = Number(payload?.campusProgramOfferingId);
    if (Number.isFinite(offeringId) && offeringId > 0) {
        body.campusProgramOfferingId = Math.trunc(offeringId);
    }
    const response = await axiosClient.post('/parent/admission/reservation/form', body);
    return response || null;
};

export const getParentAdmissionReservationFormTemplate = async (studentProfileId) => {
    const sid = Number(studentProfileId);
    if (!Number.isFinite(sid) || sid <= 0) {
        throw new Error('studentProfileId is required');
    }
    const response = await axiosClient.get('/parent/admission/reservation/form/template', {
        params: {studentProfileId: sid},
    });
    return response || null;
};

function normalizeTemplateStudentProfileId(studentProfileId) {
    const sid = Number(studentProfileId);
    if (!Number.isFinite(sid) || sid <= 0) {
        throw new Error('studentProfileId is required');
    }
    return Math.trunc(sid);
}

export const postParentAdmissionReservationFormTemplate = async (payload) => {
    const sid = normalizeTemplateStudentProfileId(payload?.studentProfileId);
    const body = {
        studentProfileId: sid,
        submissionDocuments: Array.isArray(payload?.submissionDocuments)
            ? payload.submissionDocuments
            : [],
    };
    const response = await axiosClient.post('/parent/admission/reservation/form/template', body, {
        params: {studentProfileId: sid},
    });
    return response || null;
};

export const getParentAdmissionReservationForms = async () => {
    const response = await axiosClient.get('/parent/admission/reservation/form');
    return response || null;
};

export const putParentAdmissionSchoolsAvailability = async (studentProfileId, schoolIds = []) => {
    const sid = Number(studentProfileId);
    if (!Number.isFinite(sid) || sid <= 0) {
        throw new Error('studentProfileId is required');
    }
    const ids = (Array.isArray(schoolIds) ? schoolIds : [])
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0);
    const response = await axiosClient.put(
        '/parent/admission/schools/availability',
        ids,
        {
            params: {studentProfileId: Math.trunc(sid)},
            headers: {'Content-Type': 'application/json'},
        },
    );
    return response || null;
};

export function flattenAdmissionSchoolsUnavailable(unavailable) {
    const out = [];
    for (const item of Array.isArray(unavailable) ? unavailable : []) {
        if (!item || typeof item !== 'object') continue;
        if (Array.isArray(item.schools)) {
            const reason = String(item.reason || item.message || '').trim() || 'Không đủ điều kiện.';
            for (const s of item.schools) {
                if (!s || typeof s !== 'object') continue;
                out.push({
                    schoolId: s.schoolId,
                    schoolName: String(s.schoolName || '').trim() || `Trường #${s.schoolId ?? '—'}`,
                    reason,
                });
            }
            continue;
        }
        const schoolId = item.schoolId ?? item.id;
        const schoolName = String(item.schoolName || item.name || '').trim();
        if (schoolId == null && !schoolName) continue;
        out.push({
            schoolId,
            schoolName: schoolName || `Trường #${schoolId ?? '—'}`,
            reason: String(item.reason || item.message || '').trim() || 'Không đủ điều kiện.',
        });
    }
    return out;
}

export function pickAdmissionSchoolsAvailabilityFromResponse(response) {
    const data = response?.data;
    const topMessage = typeof data?.message === 'string' ? data.message : '';
    if (data == null) {
        return {unavailable: [], available: [], message: topMessage};
    }
    let inner = data.body ?? data;
    if (typeof inner === 'string') {
        try {
            inner = JSON.parse(inner);
        } catch {
            return {unavailable: [], available: [], message: topMessage};
        }
    }
    if (inner && typeof inner === 'object' && inner.body != null && typeof inner.body === 'object' && !Array.isArray(inner.body)) {
        inner = inner.body;
    }
    const unavailable = Array.isArray(inner?.unavailable) ? inner.unavailable : [];
    const available = Array.isArray(inner?.available) ? inner.available : [];
    return {unavailable, available, message: topMessage || (typeof inner?.message === 'string' ? inner.message : '')};
}

export function pickAdmissionReservationFormsFromResponse(response) {
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
    if (inner && typeof inner === 'object' && !Array.isArray(inner) && Array.isArray(inner.body)) {
        inner = inner.body;
    }
    return Array.isArray(inner) ? inner : [];
}
