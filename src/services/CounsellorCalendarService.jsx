import axiosClient from "../configs/APIConfig.jsx";

export const getCounsellorCalendar = async ({ startDate, endDate }) => {
  const response = await axiosClient.get("/counsellor/calendar", {
    params: {
      startDate,
      endDate,
    },
  });
  return response || null;
};

export const parseCounsellorCalendarBody = (response) => {
  const payload = response?.data?.body ?? response?.data ?? {};
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.body)) return payload.body;
  return [];
};

export const getCounsellorSlotsByDate = async (date) => {
  const response = await axiosClient.get("/counsellor/slots/by-date", {
    params: { date },
  });
  return response || null;
};

export const getCounsellorAdmissionCampaigns = async () => {
  const response = await axiosClient.get("/counsellor/admission-campaigns");
  return response || null;
};

export const getCounsellorAppointmentsByCampaign = async (campaignId) => {
  const response = await axiosClient.get(`/counsellor/consultation/offline/by-campaign/${campaignId}`);
  return response || null;
};
