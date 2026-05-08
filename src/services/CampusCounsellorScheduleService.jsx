import axiosClient from "../configs/APIConfig.jsx";









export const getCounsellorAvailableList = async () => {
  const response = await axiosClient.get("/campus/counsellor/available/list");
  return response ?? null;
};

export function parseCounsellorAvailableListBody(res) {
  const body = res?.data?.body ?? res?.data?.data?.body;
  return Array.isArray(body) ? body : [];
}

function logCounsellorAssign(stage, data) {
  const prefix = "[counsellor/assign]";
  if (import.meta.env.DEV) {
    
    console.info(prefix, stage, data);
  }
}







export function normalizeCounsellorAssignPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("counsellor/assign: payload is required");
  }
  const out = { ...payload };
  const rawAction = out.action;
  if (rawAction == null || rawAction === "") {
    throw new Error("counsellor/assign: action is required (ASSIGN or UNASSIGN)");
  }
  out.action = String(rawAction).toUpperCase();
  if (out.action !== "ASSIGN" && out.action !== "UNASSIGN") {
    throw new Error("counsellor/assign: action must be ASSIGN or UNASSIGN");
  }
  if (out.action === "UNASSIGN") {
    const fromArr = Array.isArray(out.slotIds) ? out.slotIds : Array.isArray(out.slot_ids) ? out.slot_ids : [];
    let slotIds = fromArr.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0);
    if (slotIds.length === 0) {
      const one = Number(out.slotId ?? out.slot_id);
      if (Number.isFinite(one) && one > 0) slotIds = [one];
    }
    if (slotIds.length > 0) {
      out.slotIds = [...new Set(slotIds)];
    } else {
      delete out.slotIds;
    }
    delete out.slotId;
    delete out.slot_id;
    delete out.slot_ids;
    delete out.templateIds;
    if (Array.isArray(out.counsellorIds) && out.counsellorIds.length > 0) {
      out.counsellorIds = out.counsellorIds.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0);
      if (out.counsellorIds.length === 0) delete out.counsellorIds;
    } else {
      delete out.counsellorIds;
    }
    const startDate = typeof out.startDate === "string" ? out.startDate.trim() : "";
    const endDate = typeof out.endDate === "string" ? out.endDate.trim() : "";
    if (startDate) out.startDate = startDate;
    else delete out.startDate;
    if (endDate) out.endDate = endDate;
    else delete out.endDate;
    delete out.start_date;
    delete out.end_date;

    const hasSlotIds = Array.isArray(out.slotIds) && out.slotIds.length > 0;
    const hasCounsellorIds = Array.isArray(out.counsellorIds) && out.counsellorIds.length > 0;
    const hasRange = Boolean(out.startDate) && Boolean(out.endDate);
    if (!hasSlotIds && !(hasCounsellorIds && hasRange)) {
      throw new Error("Hủy gán: gửi slotIds hoặc điền đủ startDate và endDate.");
    }
    if (hasCounsellorIds && hasRange && String(out.startDate) > String(out.endDate)) {
      throw new Error("Hủy gán: startDate phải nhỏ hơn hoặc bằng endDate.");
    }
    delete out.campusId;
    delete out.campus_id;
  }
  if (out.action === "ASSIGN") {
    const tids = Array.isArray(out.templateIds)
      ? out.templateIds.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)
      : [];
    const cids = Array.isArray(out.counsellorIds)
      ? out.counsellorIds.map((x) => Number(x)).filter((x) => Number.isFinite(x))
      : [];
    if (tids.length === 0) {
      throw new Error("counsellor/assign ASSIGN: templateIds is required (non-empty array)");
    }
    if (cids.length === 0) {
      throw new Error("counsellor/assign ASSIGN: counsellorIds is required");
    }
    const campaignId = Number(out.campaignId ?? out.campaign_id);
    if (!Number.isFinite(campaignId) || campaignId <= 0) {
      throw new Error("counsellor/assign ASSIGN: campaignId is required");
    }
    out.templateIds = tids;
    out.counsellorIds = cids;
    out.campaignId = campaignId;
    delete out.campaign_id;
    const startDate = typeof out.startDate === "string" ? out.startDate.trim() : "";
    const endDate = typeof out.endDate === "string" ? out.endDate.trim() : "";
    if (startDate) out.startDate = startDate;
    else if (out.startDate !== null) delete out.startDate;
    if (endDate) out.endDate = endDate;
    else if (out.endDate !== null) delete out.endDate;
    delete out.start_date;
    delete out.end_date;
    delete out.slotIds;
    delete out.slot_ids;
    delete out.slotId;
    delete out.slot_id;
  }
  return out;
}






export function isCounsellorAssignResponseSuccess(res) {
  const st = res && typeof res === "object" && "status" in res ? Number(res.status) : 0;
  return st >= 200 && st < 300;
}




export const postCounsellorAssign = async (payload) => {
  const normalized = normalizeCounsellorAssignPayload(payload);
  const action = normalized.action;
  logCounsellorAssign("→ request", { action, payload: { ...normalized } });
  try {
    const response = await axiosClient.post("/campus/counsellor/assign", normalized);
    const st = response?.status ?? 0;
    logCounsellorAssign("← response OK", {
      status: st,
      message: response?.data?.message,
      body: response?.data?.body ?? null,
      slotsCount: Array.isArray(response?.data?.body?.slots) ? response.data.body.slots.length : null,
    });
    return response ?? null;
  } catch (e) {
    logCounsellorAssign("← response error", {
      status: e?.response?.status,
      message: e?.response?.data?.message ?? e?.message,
      data: e?.response?.data ?? null,
    });
    throw e;
  }
};






export function parseCounsellorAssignSuccessBody(res) {
  const body = res?.data?.body;
  if (body == null || typeof body !== "object") return null;
  const slots = Array.isArray(body.slots) ? body.slots : null;
  const raw = String(body.action ?? "").toUpperCase();
  const action = raw === "UNASSIGN" ? "UNASSIGN" : "ASSIGN";
  const removedSlotIds = Array.isArray(body.removedSlotIds)
    ? body.removedSlotIds.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)
    : [];
  const blockedSlotIds = Array.isArray(body.blockedSlotIds)
    ? body.blockedSlotIds.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)
    : [];
  const blockedAppointmentDates = Array.isArray(body.blockedAppointmentDates)
    ? body.blockedAppointmentDates.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  const deletedCount = Number(body.deletedCount);
  const blockedCount = Number(body.blockedCount);
  return {
    action,
    slots,
    removedSlotIds,
    blockedSlotIds,
    blockedAppointmentDates,
    deletedCount: Number.isFinite(deletedCount) ? deletedCount : null,
    blockedCount: Number.isFinite(blockedCount) ? blockedCount : null,
  };
}






export const getCounsellorAssignedSlots = async (counsellorId) => {
  const params = {};
  if (counsellorId != null && counsellorId !== "" && counsellorId !== "ALL") {
    const cid = Number(counsellorId);
    if (!Number.isNaN(cid)) params.counsellorId = cid;
  }
  const response = await axiosClient.get("/campus/counsellor/slots/assigned", {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  if (import.meta.env.DEV) {
    const rows = response?.data?.body;
    
    console.info("[GET /campus/counsellor/slots/assigned]", { params, count: Array.isArray(rows) ? rows.length : "?" });
  }
  return response ?? null;
};

export function parseCounsellorAssignedSlotsBody(res) {
  const d = res?.data;
  if (!d || typeof d !== "object") return [];
  const body = d.body ?? d.data?.body ?? d.result ?? d.data?.result ?? d.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(d)) return d;
  return [];
}
