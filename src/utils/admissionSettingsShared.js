export function normalizeOcrCriterion(item) {
  if (typeof item === "string") {
    return {label: item.trim(), validations: []};
  }
  if (!item || typeof item !== "object") {
    return {label: "", validations: []};
  }
  const validations = Array.isArray(item?.validations)
    ? item.validations.map((v) => String(v ?? "").trim()).filter(Boolean)
    : [];
  return {
    label: item?.label != null ? String(item.label) : "",
    validations: validations.length > 0 ? [validations[0]] : [],
  };
}

export function normalizeOcrCriteriaList(criteria) {
  if (!Array.isArray(criteria)) return [];
  return criteria.map((item) => normalizeOcrCriterion(item));
}

/** Áp dụng dòng import Excel: chỉ đổi code/name/required, giữ ocrCriteria cũ (khớp theo code rồi name). */
export function mergeMandatoryDocFromImport(imported, existingDocs) {
  const code = String(imported?.code ?? "").trim();
  const name = String(imported?.name ?? "").trim();
  const required = imported?.required === true;
  const existingList = Array.isArray(existingDocs) ? existingDocs : [];
  const byCode = new Map();
  const byName = new Map();
  for (const doc of existingList) {
    const existingCode = String(doc?.code ?? "").trim();
    const existingName = String(doc?.name ?? "").trim();
    if (existingCode && !byCode.has(existingCode)) byCode.set(existingCode, doc);
    if (existingName && !byName.has(existingName)) byName.set(existingName, doc);
  }
  const matched = (code && byCode.get(code)) || (name && byName.get(name)) || null;
  return {
    code,
    name,
    required,
    ocrCriteria: matched ? normalizeOcrCriteriaList(matched.ocrCriteria) : [],
  };
}

const LOCKED_CRITERION_SUFFIX = "phải có cấu trúc giống với hình ảnh mẫu của tài liệu";

export function isLockedCriterionLabel(label) {
  return String(label ?? "").trimEnd().endsWith(LOCKED_CRITERION_SUFFIX);
}

function isTemplateImageUrl(url) {
  if (!url) return false;
  if (url.includes("/image/upload/")) return true;
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}

function sanitizeOcrCriteriaForApi(criteria) {
  return normalizeOcrCriteriaList(criteria)
    .map((item) => String(item.label ?? "").trim())
    .filter(Boolean);
}

function pickMethodAdmissionProcessSource(adm) {
  if (Array.isArray(adm.methodAdmissionProcess)) return adm.methodAdmissionProcess;
  if (Array.isArray(adm.admissionProcesses)) return adm.admissionProcesses;
  return [];
}

function pickByMethodDocumentGroups(adm) {
  if (Array.isArray(adm.methodDocumentRequirements)) return adm.methodDocumentRequirements;
  if (Array.isArray(adm.documentRequirementsData?.byMethod)) return adm.documentRequirementsData.byMethod;
  if (Array.isArray(adm.documentRequirements?.byMethod)) return adm.documentRequirements.byMethod;
  return [];
}

function pickMandatoryAllDocuments(adm) {
  if (Array.isArray(adm.mandatoryAllDocumentRequirements)) return adm.mandatoryAllDocumentRequirements;
  if (Array.isArray(adm.documentRequirementsData?.mandatoryAll)) return adm.documentRequirementsData.mandatoryAll;
  if (Array.isArray(adm.documentRequirements?.mandatoryAll)) return adm.documentRequirements.mandatoryAll;
  return [];
}

function hasDocumentRequirementsInForm(adm) {
  return (
    Array.isArray(adm.methodDocumentRequirements) ||
    Array.isArray(adm.mandatoryAllDocumentRequirements) ||
    Array.isArray(adm.documentRequirementsData) ||
    Array.isArray(adm.documentRequirements)
  );
}

function sanitizeMandatoryAllForApi(docs) {
  return docs
    .map((doc) => {
      const base = {
        code: String(doc?.code ?? "").trim(),
        name: doc?.name != null ? String(doc.name) : "",
        required: doc?.required === true,
      };
      const templateFileUrl = doc?.templateFileUrl ? String(doc.templateFileUrl).trim() : "";
      base.templateFileUrl = templateFileUrl;
      const lockedCriterion = isTemplateImageUrl(templateFileUrl)
        ? `Hình ảnh${base.name ? ` "${base.name}"` : ""} phải có cấu trúc giống với hình ảnh mẫu của tài liệu`
        : null;
      const fromApi = Array.isArray(doc?.validateCriterion)
        ? doc.validateCriterion.map((item) => String(item ?? "").trim()).filter(Boolean)
        : [];
      const manualCriteria = (
        fromApi.length > 0 ? fromApi : sanitizeOcrCriteriaForApi(doc?.ocrCriteria)
      ).filter((label) => label !== lockedCriterion);
      base.validateCriterion = lockedCriterion ? [lockedCriterion, ...manualCriteria] : manualCriteria;
      return base;
    })
    .filter((doc) => doc.code || doc.name);
}

function sanitizeByMethodDocumentsForApi(groups, allowedMethodCodeSet) {
  return groups
    .map((group) => {
      const methodCode = String(group?.methodCode ?? "").trim();
      const documents = Array.isArray(group?.documents)
        ? group.documents
            .map((doc) => ({
              code: String(doc?.code ?? "").trim(),
              name: doc?.name != null ? String(doc.name) : "",
              required: doc?.required === true,
              templateUrl: doc?.templateUrl != null ? String(doc.templateUrl).trim() : "",
            }))
            .filter((doc) => doc.code || doc.name)
        : [];
      return {methodCode, documents};
    })
    .filter((group) => {
      const code = String(group?.methodCode || "").trim();
      return code && allowedMethodCodeSet.has(code);
    });
}

/**
 * Chuẩn hoá payload PUT admissionSettingsData (nền tảng + trường).
 * Contract nền tảng: allowedMethods, methodAdmissionProcess, documentRequirementsData.
 * @param {Record<string, unknown>} adm
 */
export function sanitizeAdmissionSettingsForApi(adm) {
  if (!adm || typeof adm !== "object") return adm;
  const raw = Array.isArray(adm.allowedMethods) ? adm.allowedMethods : [];
  const normalized = raw.map((m) => {
    const {__isNewRow: _r, ...rest} = m && typeof m === "object" ? m : {};
    return {
      code: String(rest?.code ?? "").trim(),
      description: rest?.description != null ? String(rest.description) : "",
      displayName: rest?.displayName != null ? String(rest.displayName) : "",
    };
  });
  const withCode = normalized.filter((m) => m.code);
  const seen = new Set();
  const methods = [];
  for (let i = withCode.length - 1; i >= 0; i--) {
    if (seen.has(withCode[i].code)) continue;
    seen.add(withCode[i].code);
    methods.unshift(withCode[i]);
  }

  const allowedMethodCodeSet = new Set(methods.map((m) => String(m.code || "").trim()).filter(Boolean));

  const methodAdmissionProcess = pickMethodAdmissionProcessSource(adm)
    .map((g) => {
      const methodCode = String(g?.methodCode ?? "").trim();
      const steps = Array.isArray(g?.steps)
        ? g.steps.map((s, idx) => ({
            stepName: s?.stepName != null ? String(s.stepName) : "",
            stepOrder: s?.stepOrder != null && !Number.isNaN(Number(s.stepOrder)) ? Number(s.stepOrder) : idx + 1,
            description: s?.description != null ? String(s.description) : "",
          }))
        : [];
      return {methodCode, steps};
    })
    .filter((row) => {
      const code = String(row?.methodCode || "").trim();
      return code && allowedMethodCodeSet.has(code);
    });

  const transcriptTemplateImageUrl = adm.transcriptTemplateImageUrl != null
    ? String(adm.transcriptTemplateImageUrl).trim()
    : "";

  const payload = {
    allowedMethods: methods,
    admissionProcesses: methodAdmissionProcess,
    methodAdmissionProcess,
    transcriptTemplateImageUrl,
  };

  if (typeof adm.autoCloseOnFull === "boolean") {
    payload.autoCloseOnFull = adm.autoCloseOnFull;
  }
  if (adm.quotaAlertThresholdPercent != null && !Number.isNaN(Number(adm.quotaAlertThresholdPercent))) {
    payload.quotaAlertThresholdPercent = Math.min(
      100,
      Math.max(0, Number(adm.quotaAlertThresholdPercent)),
    );
  }

  if (hasDocumentRequirementsInForm(adm)) {
    const mandatoryAll = sanitizeMandatoryAllForApi(pickMandatoryAllDocuments(adm));
    const byMethod = sanitizeByMethodDocumentsForApi(
      pickByMethodDocumentGroups(adm),
      allowedMethodCodeSet,
    );
    payload.methodDocumentRequirements = byMethod;
    payload.documentRequirements = {mandatoryAll, byMethod};
    payload.documentRequirementsData = {mandatoryAll, byMethod};
  }

  return payload;
}

export function admissionSettingsComparableJson(adm) {
  try {
    return JSON.stringify(sanitizeAdmissionSettingsForApi(adm));
  } catch {
    return "";
  }
}
