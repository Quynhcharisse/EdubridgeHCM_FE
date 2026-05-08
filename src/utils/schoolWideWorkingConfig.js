








export function isWorkingConfigMeaningful(wc) {
  if (!wc || typeof wc !== "object") return false;
  if (Array.isArray(wc.workShifts) && wc.workShifts.length > 0) return true;
  if (Array.isArray(wc.regularDays) && wc.regularDays.length > 0) return true;
  if (Array.isArray(wc.weekendDays) && wc.weekendDays.length > 0) return true;
  if (wc.note != null && String(wc.note).trim() !== "") return true;
  if (Boolean(wc.isOpenSunday ?? wc.openSunday)) return true;
  return false;
}











function normalizeWorkingConfigShape(wc) {
  const w = wc && typeof wc === "object" ? wc : {};
  return {
    note: w.note != null ? String(w.note) : "",
    workShifts: Array.isArray(w.workShifts) ? w.workShifts : [],
    regularDays: Array.isArray(w.regularDays) ? w.regularDays : [],
    weekendDays: Array.isArray(w.weekendDays) ? w.weekendDays : [],
    isOpenSunday: Boolean(w.isOpenSunday ?? w.openSunday),
  };
}





export function resolveSchoolWideWorkingConfigDisplay(hqOp, cur) {
  const hqOpObj = hqOp && typeof hqOp === "object" ? hqOp : {};
  const hqWc = hqOpObj.workingConfig ?? hqOpObj.working_config;
  const fromHq = normalizeWorkingConfigShape(hqWc && typeof hqWc === "object" ? hqWc : {});
  if (isWorkingConfigMeaningful(fromHq)) return fromHq;

  const cw = cur?.workingConfig ?? cur?.working_config;
  return normalizeWorkingConfigShape(cw && typeof cw === "object" ? cw : {});
}
