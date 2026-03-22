export const genderOptions = [
    {value: 'MALE', label: 'Nam'},
    {value: 'FEMALE', label: 'Nữ'},
    {value: 'OTHER', label: 'Khác'},
];

export const GRADE_LEVELS = [
    {key: 'g06', label: 'Lớp 06'},
    {key: 'g07', label: 'Lớp 07'},
    {key: 'g08', label: 'Lớp 08'},
    {key: 'g09', label: 'Lớp 09'},
];

export function emptyGrades() {
    return {g06: '', g07: '', g08: '', g09: ''};
}

export function normalizeSubjectGroups(body) {
    if (body == null) return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.subjects)) return body.subjects;
    if (Array.isArray(body.groups)) return body.groups;
    return [];
}

export function parseBody(res) {
    const raw = res?.data?.body;
    if (raw == null) return res?.data ?? null;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
    return raw;
}

export function normalizePersonalityGroups(body) {
    if (body == null) return null;
    if (Array.isArray(body)) {
        return body.length ? {'Danh sách': body} : null;
    }
    if (typeof body === 'object') {
        const hasArray = Object.values(body).some((v) => Array.isArray(v) && v.length > 0);
        return hasArray ? body : null;
    }
    return null;
}

export function findPersonalityById(groups, idStr) {
    if (!groups || idStr === '' || idStr == null) return null;
    for (const items of Object.values(groups)) {
        if (!Array.isArray(items)) continue;
        const found = items.find((x) => String(x?.id) === String(idStr));
        if (found) return found;
    }
    return null;
}

function normalizeGradeObject(v) {
    const e = emptyGrades();
    if (!v || typeof v !== 'object') return e;
    GRADE_LEVELS.forEach(({key}) => {
        const x = v[key];
        if (x != null && x !== '') e[key] = String(x);
    });
    return e;
}

export function normalizeRegularGradesFromApi(input) {
    if (!input) return {};
    if (Array.isArray(input)) {
        const out = {};
        input.forEach((row) => {
            const id = row.subjectId ?? row.id;
            if (id == null) return;
            const src = row.grades && typeof row.grades === 'object' ? row.grades : row;
            out[String(id)] = normalizeGradeObject(src);
        });
        return out;
    }
    if (typeof input === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(input)) {
            if (v != null && typeof v === 'object') {
                out[String(k)] = normalizeGradeObject(v);
            }
        }
        return out;
    }
    return {};
}

export function normalizeForeignFromApi(input) {
    const defaultRows = [{rowId: 'foreign-0', subjectId: ''}];
    if (!Array.isArray(input) || input.length === 0) {
        return {rows: defaultRows, grades: {}};
    }
    const rows = [];
    const grades = {};
    input.forEach((row, idx) => {
        const rowId =
            row.rowId != null && String(row.rowId).length > 0
                ? String(row.rowId)
                : `foreign-${idx}`;
        rows.push({
            rowId,
            subjectId:
                row.subjectId != null && row.subjectId !== ''
                    ? Number(row.subjectId)
                    : '',
        });
        const src = row.grades && typeof row.grades === 'object' ? row.grades : row;
        grades[rowId] = normalizeGradeObject(src);
    });
    return {rows, grades};
}

export function getEmptyStudentState() {
    return {
        form: {name: '', gender: ''},
        selectedPersonalityId: '',
        favoriteMajorCodes: [],
        regularGrades: {},
        foreignRows: [{rowId: 'foreign-0', subjectId: ''}],
        foreignGrades: {},
    };
}

export function applyStudentBodyToState(body) {
    const raw = body?.student ?? body?.data ?? body;
    if (!raw || typeof raw !== 'object') {
        return getEmptyStudentState();
    }
    const name = raw.studentName ?? raw.name ?? raw.fullName ?? '';
    const gender = raw.gender ?? '';
    const pid = raw.personalityTypeId ?? raw.personalityId ?? raw.mbtiTypeId;
    const selectedPersonalityId =
        pid != null && pid !== '' ? String(pid) : '';
    const majors = raw.favoriteMajorCodes ?? raw.majorCodes ?? raw.favoriteMajors;
    const favoriteMajorCodes = Array.isArray(majors)
        ? majors.map((x) => Number(x)).filter((n) => !Number.isNaN(n))
        : [];
    const regularGrades = normalizeRegularGradesFromApi(
        raw.regularGrades ?? raw.regularSubjectGrades ?? raw.schoolReport?.regular,
    );
    const {rows, grades} = normalizeForeignFromApi(
        raw.foreignLanguages ?? raw.foreignLanguageRows ?? raw.schoolReport?.foreignLanguages,
    );
    return {
        form: {name, gender},
        selectedPersonalityId,
        favoriteMajorCodes,
        regularGrades,
        foreignRows: rows,
        foreignGrades: grades,
    };
}

export function buildStudentPayload({
    form,
    selectedPersonalityId,
    favoriteMajorCodes,
    regularGrades,
    foreignRows,
    foreignGrades,
}) {
    return {
        studentName: form.name,
        gender: form.gender || null,
        personalityTypeId: selectedPersonalityId
            ? Number(selectedPersonalityId)
            : null,
        favoriteMajorCodes,
        regularGrades: Object.entries(regularGrades).map(([subjectId, g]) => ({
            subjectId: Number(subjectId),
            ...g,
        })),
        foreignLanguages: foreignRows.map((r) => ({
            subjectId: r.subjectId === '' ? null : r.subjectId,
            ...(foreignGrades[r.rowId] || emptyGrades()),
        })),
    };
}

export function setStudentState(setters, mapped) {
    setters.setForm(mapped.form);
    setters.setSelectedPersonalityId(mapped.selectedPersonalityId);
    setters.setFavoriteMajorCodes(mapped.favoriteMajorCodes);
    setters.setRegularGrades(mapped.regularGrades);
    setters.setForeignRows(mapped.foreignRows);
    setters.setForeignGrades(mapped.foreignGrades);
}
