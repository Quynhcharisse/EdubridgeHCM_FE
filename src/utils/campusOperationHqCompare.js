
export const OP_SCALAR_KEYS = [
  "maxBookingPerSlot",
  "minCounsellorPerSlot",
  "maxCounsellorsPerSlot",
  "slotDurationInMinutes",
  "bufferBetweenSlotsMinutes",
  "allowBookingBeforeHours",
];

export function numOpScalar(v) {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}




export function computeOpScalarVsHq(effectiveOp, hqOp, hqMissing) {
  const out = {};
  if (hqMissing || !hqOp || typeof hqOp !== "object") {
    for (const k of OP_SCALAR_KEYS) out[k] = null;
    return out;
  }
  for (const k of OP_SCALAR_KEYS) {
    out[k] = numOpScalar(effectiveOp?.[k]) !== numOpScalar(hqOp[k]);
  }
  return out;
}
