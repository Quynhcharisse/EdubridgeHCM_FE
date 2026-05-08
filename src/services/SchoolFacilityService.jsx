import axiosClient from "../configs/APIConfig.jsx";


export function parseSchoolConfigResponseBody(res) {
  let body = res?.data?.body ?? res?.data?.data?.body ?? res?.body ?? {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  return body && typeof body === "object" ? body : {};
}






export function schoolConfigKeyedBodyForNormalize(res, k) {
  const raw = parseSchoolConfigResponseBody(res);
  if (k == null || String(k).trim() === "") return raw;
  if (raw[k] != null && typeof raw[k] === "object") {
    return {[k]: raw[k]};
  }
  return raw;
}


export const SCHOOL_CONFIG_KEY = {
  ADMISSION_SETTINGS_DATA: "admissionSettingsData",
  DOCUMENT_REQUIREMENTS_DATA: "documentRequirementsData",
  FINANCE_POLICY_DATA: "financePolicyData",
  OPERATION_SETTINGS_DATA: "operationSettingsData",
  FACILITY_DATA: "facilityData",
  QUOTA_CONFIG_DATA: "quotaConfigData",
  RESOURCE_DISTRIBUTION_DATA: "resourceDistributionData",
};





export const getSchoolConfig = async (schoolId) => {
  const response = await axiosClient.get(`/school/config/${Number(schoolId) || schoolId}`);
  return response;
};





export const getSchoolConfigByKey = async (k) => {
  const response = await axiosClient.get("/school/config/key", {
    params: { k },
  });
  return response;
};










export const updateSchoolConfig = async (schoolId, payload) => {
  const response = await axiosClient.put(`/school/config/${Number(schoolId) || schoolId}`, payload);
  return response;
};


function campusConfigPathId(campusId) {
  if (campusId == null || campusId === "") return null;
  const n = Number(campusId);
  if (Number.isFinite(n)) return n;
  const s = String(campusId).trim();
  return s || null;
}







export const getCampusConfig = async () => {
  const response = await axiosClient.get("/campus/config");
  return response;
};












export const updateCampusConfig = async (campusId, payload) => {
  const id = campusConfigPathId(campusId);
  if (id == null) return Promise.reject(new Error("campusId is required"));
  const response = await axiosClient.put(`/campus/${id}/config`, payload);
  return response;
};


export const getSchoolCampusConfigList = async () => {
  const response = await axiosClient.get("/school/config/campus/list");
  return response;
};





export const previewMandatoryDocsImport = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post("/school/config/import/mandatory/docs/preview", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response;
};





export const validateMandatoryDocImportRow = async (rows) => {
  const payload = {rows: Array.isArray(rows) ? rows : []};
  const response = await axiosClient.post("/school/config/validate-row", payload);
  return response;
};





export const confirmMandatoryDocImportRows = async (rows) => {
  const payload = {rows: Array.isArray(rows) ? rows : []};
  const response = await axiosClient.post("/school/config/confirm", payload);
  return response;
};

function parseFacilityConfigBlock(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    try {
      const p = JSON.parse(t);
      return p && typeof p === "object" ? p : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw;
  return null;
}


export function parseSchoolCampusConfigListBody(res) {
  const body = res?.data?.body ?? res?.data?.data?.body;
  if (!Array.isArray(body)) return [];
  return body.map((row) => {
    if (!row || typeof row !== "object") return row;
    const direct =
      parseFacilityConfigBlock(row.facilityConfig) ??
      parseFacilityConfigBlock(row.facility_config);
    if (direct) return {...row, facilityConfig: direct};
    const alt = row.facilityJson ?? row.facility_json;
    const parsedAlt = parseFacilityConfigBlock(alt);
    if (parsedAlt) return {...row, facilityConfig: parsedAlt};
    return row;
  });
}





export function schoolCampusListRowPolicyText(row) {
  const p = row?.policyDetail;
  if (p == null || p === "") return null;
  if (typeof p === "string") {
    const t = p.trim();
    return t || null;
  }
  if (typeof p === "object") {
    const full = p.fullTextRendered != null ? String(p.fullTextRendered).trim() : "";
    if (full) return full;
    const raw = p.rawCustomNote != null ? String(p.rawCustomNote).trim() : "";
    if (raw) return raw;
  }
  return null;
}
