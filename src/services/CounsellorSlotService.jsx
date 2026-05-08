import axiosClient from "../configs/APIConfig.jsx";


export async function getCounsellorSlots({ startDate, endDate }, axiosConfig = {}) {
  return axiosClient.get("/counsellor/slots", {
    params: { startDate, endDate },
    ...axiosConfig,
  });
}


export async function getCounsellorsForAppointment({ appointmentDate, appointmentTime }, axiosConfig = {}) {
  return axiosClient.get("/counsellor", {
    params: { appointmentDate, appointmentTime },
    ...axiosConfig,
  });
}

export function parseCounsellorSlotsBody(response) {
  const body = response?.data?.body;
  return Array.isArray(body) ? body : [];
}

export function parseCounsellorsForAppointmentBody(response) {
  const body = response?.data?.body;
  return Array.isArray(body) ? body : [];
}
