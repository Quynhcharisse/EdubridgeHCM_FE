import React from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Typography
} from "@mui/material";
import {
    Add as AddIcon,
    ChecklistOutlined as ChecklistOutlinedIcon,
    CastForEducation as CastForEducationIcon,
    DescriptionOutlined as DescriptionOutlinedIcon,
    Lock as LockIcon,
    MoreVert as MoreVertIcon,
    MenuBookOutlined as MenuBookOutlinedIcon,
    PlaceOutlined as PlaceOutlinedIcon,
    RouteOutlined as RouteOutlinedIcon,
    SchoolOutlined as SchoolOutlinedIcon,
    SourceOutlined as SourceOutlinedIcon,
    StairsOutlined as StairsOutlinedIcon,
    TimelineOutlined as TimelineOutlinedIcon,
    TodayOutlined as TodayOutlinedIcon,
    ViewListOutlined as ViewListOutlinedIcon,
    Wc as WcIcon
} from "@mui/icons-material";
import {FaSchool} from "react-icons/fa";
import {useNavigate} from "react-router-dom";
import {enqueueSnackbar} from "notistack";

import {getUserIdentity} from "../../utils/savedSchoolsStorage";
import {
    getCompareSchools,
    MAX_COMPARE_SCHOOLS,
    setCompareSchools
} from "../../utils/compareSchoolsStorage";
import {
    BRAND_NAVY,
    HOME_PAGE_SURFACE_GRADIENT,
    landingSectionShadow
} from "../../constants/homeLandingTheme";
import {getPublicSchoolCampaignTemplates, getPublicSchoolDetail} from "../../services/SchoolPublicService.jsx";
import {mapPublicSchoolDetailToRow} from "../../utils/schoolPublicMapper.js";
import {normalizeBoardingTypeForApi, parseBoardingType} from "../../constants/schoolBoardingType.js";

const SCHOOL_ICON_TINTS = ["#2563eb", "#3b82f6", "#0ea5e9", "#38bdf8"];
const NEARBY_MARK_KM = 10;
const COMPARE_LABEL_COL_WIDTH = 220;
const COMPARE_SCHOOL_COL_WIDTH = 260;
const COMPARE_SCHOOL_COL_MIN = 180;
const COMPARE_TABLE_COL_GAP = 16;
const COMPARE_TABLE_FIT_ALL_COLS_AT = 4;

function compareTableGridColumns(schoolCount) {
    const n = Math.max(1, Number(schoolCount) || 1);
    const schoolCols =
        n >= COMPARE_TABLE_FIT_ALL_COLS_AT
            ? `repeat(${n}, minmax(${COMPARE_SCHOOL_COL_MIN}px, 1fr))`
            : `repeat(${n}, ${COMPARE_SCHOOL_COL_WIDTH}px)`;
    return `${COMPARE_LABEL_COL_WIDTH}px ${schoolCols}`;
}

function compareTableScrollMinWidth(schoolCount) {
    const n = Math.max(1, Number(schoolCount) || 1);
    const schoolColWidth = n >= COMPARE_TABLE_FIT_ALL_COLS_AT ? COMPARE_SCHOOL_COL_MIN : COMPARE_SCHOOL_COL_WIDTH;
    return COMPARE_LABEL_COL_WIDTH + n * schoolColWidth + (n - 1) * COMPARE_TABLE_COL_GAP;
}

function compareTableInnerWidth(schoolCount) {
    return Math.max(1, Number(schoolCount) || 1) >= COMPARE_TABLE_FIT_ALL_COLS_AT ? "100%" : "max-content";
}

function formatLocation(row) {
    if (row?.locationLabel) return String(row.locationLabel);
    const w = row?.ward;
    const p = row?.province;
    if (w && p) return `${w}, ${p}`;
    return p || w || "—";
}

function parseSchoolIdFromKey(schoolKey) {
    const s = String(schoolKey || "").trim();
    if (!s.startsWith("id:")) return null;
    const id = Number(s.slice(3));
    return Number.isFinite(id) ? id : null;
}

function toText(value, fallback = "—") {
    const t = String(value ?? "").trim();
    return t || fallback;
}

function decodeHtmlToPlainText(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (typeof document !== "undefined") {
        const div = document.createElement("div");
        div.innerHTML = raw;
        return String(div.innerText || div.textContent || "")
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
    return raw
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/p>/gi, " ")
        .replace(/<\/li>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/** Chuyển HTML thành các dòng plain text (giữ đoạn từ p, li, br...). */
function htmlToComparePlainLines(value) {
    const raw = String(value || "").trim();
    if (!raw) return [];
    if (typeof document !== "undefined") {
        const div = document.createElement("div");
        div.innerHTML = raw;
        return String(div.innerText || div.textContent || "")
            .replace(/\u00a0/g, " ")
            .split(/\n+/)
            .map((line) => line.replace(/\s+/g, " ").trim())
            .filter(Boolean);
    }
    const single = decodeHtmlToPlainText(raw);
    return single ? [single] : [];
}

function stripHtml(value) {
    return decodeHtmlToPlainText(value);
}

function formatMoney(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(n);
}

function formatDistanceKm(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return `${n.toFixed(2)} km`;
}

function formatDateDisplay(value) {
    if (!value) return "—";
    if (Array.isArray(value) && value.length >= 3) {
        const [y, m, d] = value;
        if ([y, m, d].every((n) => Number.isFinite(Number(n)))) {
            return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
        }
    }
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return String(value);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function formatFoundingDate(value) {
    if (!value) return "—";
    const text = String(value).trim();
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    return formatDateDisplay(value);
}

function mapCampaignStatusLabel(status) {
    const key = String(status || "").trim().toUpperCase();
    if (key === "OPEN_ADMISSION_CAMPAIGN" || key === "OPEN") return "Đang mở nhận hồ sơ";
    if (key === "CLOSED_ADMISSION_CAMPAIGN" || key === "CLOSED") return "Đã đóng";
    if (key === "DRAFT") return "Nháp";
    return key ? key : "—";
}

function mapBoardingTypeLabel(raw) {
    const parsed = parseBoardingType(raw);
    if (parsed) return normalizeBoardingTypeForApi(parsed);
    const text = String(raw || "").trim();
    return text || "—";
}

function feeUnitLabel(value) {
    const key = String(value || "").trim().toUpperCase();
    if (key === "YEAR") return "năm";
    if (key === "SEMESTER") return "học kỳ";
    if (key === "QUARTER") return "quý";
    if (key === "MONTH") return "tháng";
    return key ? key.toLowerCase() : "";
}

function pickPrimaryCampaign(campaigns) {
    const list = Array.isArray(campaigns) ? campaigns : [];
    const open = list.find((c) => String(c?.status || "").toUpperCase() === "OPEN_ADMISSION_CAMPAIGN");
    return open || list[0] || null;
}

function collectAllowedMethods(campaigns) {
    const map = new Map();
    (Array.isArray(campaigns) ? campaigns : []).forEach((campaign) => {
        const sources = [
            ...(Array.isArray(campaign?.schoolAllowedMethods) ? campaign.schoolAllowedMethods : []),
            ...(Array.isArray(campaign?.campaignConfig?.allowedMethods) ? campaign.campaignConfig.allowedMethods : [])
        ];
        sources.forEach((method) => {
            const name = String(method?.displayName || method?.code || "").trim();
            if (!name) return;
            map.set(String(method?.code || name), name);
        });
    });
    return Array.from(map.values());
}

function normalizeProcessSteps(rawSteps) {
    const steps = Array.isArray(rawSteps) ? rawSteps : [];
    return steps
        .map((step, idx) => {
            const order = Number(step?.stepOrder);
            const stepNo = Number.isFinite(order) ? order : idx + 1;
            const stepName = String(step?.stepName || "").trim() || `Bước ${stepNo}`;
            return {stepOrder: stepNo, stepName, label: `${stepNo}. ${stepName}`};
        })
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .slice(0, 12);
}

/** Quy trình tuyển sinh theo từng phương thức (allowedMethods + admissionMethodDetails). */
function collectProcessStepsByMethod(campaigns) {
    const map = new Map();
    const orderKeys = [];

    const ensureMethod = (code, displayName) => {
        const key = String(code || displayName || "").trim();
        if (!key) return null;
        if (!map.has(key)) {
            map.set(key, {
                methodCode: String(code || "").trim(),
                displayName: String(displayName || code || "").trim(),
                steps: []
            });
            orderKeys.push(key);
        }
        return map.get(key);
    };

    (Array.isArray(campaigns) ? campaigns : []).forEach((campaign) => {
        const allowedSources = [
            ...(Array.isArray(campaign?.schoolAllowedMethods) ? campaign.schoolAllowedMethods : []),
            ...(Array.isArray(campaign?.campaignConfig?.allowedMethods) ? campaign.campaignConfig.allowedMethods : [])
        ];
        allowedSources.forEach((method) => {
            const code = String(method?.code || "").trim();
            const name = String(method?.displayName || code).trim();
            const entry = ensureMethod(code, name);
            if (entry && name) entry.displayName = name;
        });

        (Array.isArray(campaign?.admissionMethodDetails) ? campaign.admissionMethodDetails : []).forEach((timeline) => {
            const code = String(timeline?.methodCode || "").trim();
            const name = String(timeline?.displayName || code).trim();
            const entry = ensureMethod(code, name);
            if (!entry) return;
            if (name) entry.displayName = name;
            const nextSteps = normalizeProcessSteps(timeline?.admissionProcessSteps);
            if (nextSteps.length > entry.steps.length) entry.steps = nextSteps;
        });
    });

    return orderKeys.map((key) => map.get(key)).filter((group) => group?.displayName);
}

function resolveOfferingForCompare(offering) {
    const curriculumRaw = offering?.curriculum && typeof offering.curriculum === "object" ? offering.curriculum : {};
    const programFromItem = offering?.program && typeof offering.program === "object" ? offering.program : {};
    const programFromCurriculum =
        curriculumRaw?.program && typeof curriculumRaw.program === "object" ? curriculumRaw.program : {};
    const program = Object.keys(programFromItem).length > 0 ? programFromItem : programFromCurriculum;
    let curriculum = curriculumRaw;
    if (curriculumRaw?.program) {
        const {program: _nested, ...rest} = curriculumRaw;
        curriculum = Object.keys(rest).length > 0 ? rest : curriculumRaw;
    }
    if ((!curriculum || !Object.keys(curriculum).length) && program?.curriculum) {
        curriculum = program.curriculum;
    }
    return {program, curriculum};
}

/** Loại bỏ dòng trùng trong cùng một cột trường (so sánh). */
function uniqueCompareLines(lines, {bullet = true} = {}) {
    const seen = new Set();
    const result = [];
    (Array.isArray(lines) ? lines : []).forEach((line) => {
        const raw = String(line || "").trim();
        if (!raw || raw === "—") return;
        const normalized = raw.replace(/^\s*-\s*/, "").trim().toLowerCase();
        if (!normalized || seen.has(normalized)) return;
        seen.add(normalized);
        if (bullet && !raw.startsWith("-")) {
            result.push(`- ${raw}`);
            return;
        }
        result.push(raw);
    });
    return result;
}

function collectProgramOfferings(campaigns) {
    const map = new Map();
    (Array.isArray(campaigns) ? campaigns : []).forEach((campaign) => {
        (Array.isArray(campaign?.campusProgramOfferings) ? campaign.campusProgramOfferings : []).forEach((offering) => {
            const {program, curriculum} = resolveOfferingForCompare(offering);
            const curriculumId = Number(curriculum?.id);
            const nameKey = String(curriculum?.name || program?.name || offering?.programName || "")
                .trim()
                .toLowerCase();
            const offeringId = Number(offering?.id);
            const key =
                Number.isFinite(curriculumId) && curriculumId > 0
                    ? `cur:${curriculumId}`
                    : nameKey
                      ? `name:${nameKey}`
                      : Number.isFinite(offeringId) && offeringId > 0
                        ? `id:${offeringId}`
                        : `${offering?.campusId}-${offering?.admissionMethod}`;
            if (!map.has(key)) map.set(key, offering);
        });
    });
    return Array.from(map.values());
}

function mergePublicDetailForCompare(detailRaw) {
    const mapped = mapPublicSchoolDetailToRow(detailRaw);
    if (!mapped) return detailRaw || null;
    return {
        ...mapped,
        name: mapped.school || detailRaw?.name,
        hotline: detailRaw?.hotline ?? null,
        websiteUrl: detailRaw?.websiteUrl ?? mapped?.website ?? "",
        foundingDate: detailRaw?.foundingDate ?? mapped?.foundingDate ?? null,
        totalCampus: detailRaw?.totalCampus ?? mapped?.totalCampus ?? null
    };
}

function collectFacilitySummary(campusList) {
    const overviews = [];
    const itemLines = [];
    const images = [];
    const seenUrls = new Set();
    const pushImage = (url, name) => {
        const normalizedUrl = String(url || "").trim();
        if (!normalizedUrl || seenUrls.has(normalizedUrl)) return;
        seenUrls.add(normalizedUrl);
        images.push({
            key: normalizedUrl,
            url: normalizedUrl,
            name: String(name || "").trim() || "Ảnh CSVC"
        });
    };
    (Array.isArray(campusList) ? campusList : []).forEach((campus) => {
        const facility = campus?.facility && typeof campus.facility === "object" ? campus.facility : {};
        const overviewText = stripHtml(facility?.overview);
        if (overviewText && !overviews.includes(overviewText)) overviews.push(overviewText);
        (Array.isArray(facility?.itemList) ? facility.itemList : []).forEach((item) => {
            const name = String(item?.name || "").trim();
            if (!name) return;
            const value = item?.value;
            const unit = String(item?.unit || "").trim();
            const valueText = value == null || value === "" ? "" : ` ${value}`;
            const unitText = unit ? ` ${unit}` : "";
            const itemLine = `${name}: ${String(valueText + unitText).trim() || "—"}`;
            if (!itemLines.includes(itemLine)) itemLines.push(itemLine);
        });
        const imageData = facility?.imageData || {};
        pushImage(imageData?.coverUrl, "Ảnh đại diện");
        (Array.isArray(imageData?.imageList) ? imageData.imageList : []).forEach((img, idx) => {
            pushImage(img?.url, img?.name || img?.altName || `Ảnh ${idx + 1}`);
        });
    });
    return {overviews, itemLines, images};
}

function mapMethodLabel(method) {
    const s = String(method || "").trim().toUpperCase();
    if (s === "COOPERATIVE") return "Học tập hợp tác";
    if (s === "VISUAL_PRACTICE") return "Trực quan - thực hành";
    if (s === "PROJECT_BASED") return "Học theo dự án";
    if (s === "EXPERIENTIAL") return "Học qua trải nghiệm";
    if (!s) return "";
    return s
        .split("_")
        .filter(Boolean)
        .map((part) => part[0] + part.slice(1).toLowerCase())
        .join(" ");
}

function metricIconByLabel(label) {
    const text = String(label || "").toLowerCase();
    if (text.includes("địa chỉ") || text.includes("quận")) return PlaceOutlinedIcon;
    if (text.includes("campus")) return SchoolOutlinedIcon;
    if (text.includes("nội trú") || text.includes("bán trú")) return WcIcon;
    if (text.includes("phương thức")) return SourceOutlinedIcon;
    if (text.includes("phỏng vấn")) return TimelineOutlinedIcon;
    if (text.includes("quy trình")) return StairsOutlinedIcon;
    if (text.includes("hồ sơ đặc biệt")) return DescriptionOutlinedIcon;
    if (text.includes("hồ sơ")) return ChecklistOutlinedIcon;
    if (text.includes("mốc tuyển sinh") || text.includes("deadline")) return TodayOutlinedIcon;
    if (text.includes("trạng thái")) return RouteOutlinedIcon;
    if (text.includes("loại chương trình")) return CastForEducationIcon;
    if (text.includes("số môn")) return ViewListOutlinedIcon;
    if (text.includes("phương pháp học")) return MenuBookOutlinedIcon;
    return DescriptionOutlinedIcon;
}

function haversineKm(a, b) {
    const lat1 = Number(a?.lat);
    const lon1 = Number(a?.lng);
    const lat2 = Number(b?.lat);
    const lon2 = Number(b?.lng);
    if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const aa =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

function getSchoolDistanceKm(detail, userLocation) {
    const campuses = Array.isArray(detail?.campusList) ? detail.campusList : [];
    let min = null;
    campuses.forEach((campus) => {
        const dist = haversineKm(
            {lat: userLocation?.lat, lng: userLocation?.lng},
            {lat: campus?.latitude, lng: campus?.longitude}
        );
        if (!Number.isFinite(dist)) return;
        if (min == null || dist < min) min = dist;
    });
    return min;
}

function buildComparisonPayload(row, detail, campaigns, userLocation) {
    const campusList = Array.isArray(detail?.campusList) ? detail.campusList : [];
    const campaignList = Array.isArray(campaigns) ? campaigns : [];
    const primaryCampaign = pickPrimaryCampaign(campaignList);
    const distanceKm = getSchoolDistanceKm(detail, userLocation);
    const campusDistricts = Array.from(
        new Set(campusList.map((campus) => String(campus?.district || "").trim()).filter(Boolean))
    );
    const boardingLabels = Array.from(
        new Set(campusList.map((campus) => mapBoardingTypeLabel(campus?.boardingType)).filter((x) => x && x !== "—"))
    );
    const campusAddressLines = uniqueCompareLines(
        campusList.map((campus) => toText(campus?.address, "")).filter((address) => address && address !== "—"),
        {bullet: false}
    );
    const hotline = toText(detail?.hotline, "");
    const website = toText(detail?.website || detail?.websiteUrl, "");
    const allowedMethods = collectAllowedMethods(campaignList);
    const allowedMethodsLines = allowedMethods.length
        ? allowedMethods.map((name) => `- ${name}`)
        : ["—"];
    const processStepsByMethod = collectProcessStepsByMethod(campaignList);
    const mandatoryDocLines = Array.from(
        new Set(
            campaignList.flatMap((campaign) =>
                (Array.isArray(campaign?.mandatoryAll) ? campaign.mandatoryAll : [])
                    .map((doc) => String(doc?.name || doc?.code || "").trim())
                    .filter(Boolean)
            )
        )
    ).map((name) => `- ${name}`);
    const reservationFeeLines = uniqueCompareLines(
        campaignList.flatMap((campaign) =>
            (Array.isArray(campaign?.admissionMethodDetails) ? campaign.admissionMethodDetails : []).map((method) => {
                const fee = Number(method?.reservationFee);
                if (!Number.isFinite(fee)) return "";
                const label = toText(method?.displayName || method?.methodCode, "Phương thức");
                return `${label}: ${formatMoney(fee)}`;
            })
        ),
        {bullet: false}
    );
    const quotaTotalLines = uniqueCompareLines(
        campaignList
        .map((campaign) => {
            const total = Number(campaign?.campaignTotalQuota);
            if (!Number.isFinite(total)) return "";
            return `${toText(campaign?.name, "Chiến dịch")}: ${total} học sinh`;
        }),
        {bullet: false}
    );
    const quotaRemainingLines = uniqueCompareLines(
        campaignList.map((campaign) => {
            const remaining = Number(campaign?.campaignRemainingQuota);
            if (!Number.isFinite(remaining)) return "";
            return `${toText(campaign?.name, "Chiến dịch")}: còn ${remaining} chỉ tiêu`;
        }),
        {bullet: false}
    );
    const campaignTimelineLines = uniqueCompareLines(
        campaignList.map((campaign) => {
            const start = formatDateDisplay(campaign?.startDate);
            const end = formatDateDisplay(campaign?.endDate);
            if (start === "—" && end === "—") return "";
            return `${toText(campaign?.name, "Chiến dịch")}: ${start} - ${end}`;
        }),
        {bullet: false}
    );
    const campaignStatusLines = uniqueCompareLines(
        campaignList.map(
            (campaign) => `${toText(campaign?.name, "Chiến dịch")}: ${mapCampaignStatusLabel(campaign?.status)}`
        ),
        {bullet: false}
    );
    const offerings = collectProgramOfferings(campaignList);
    const programNameLines = uniqueCompareLines(
        offerings.map((offering) => {
            const {program, curriculum} = resolveOfferingForCompare(offering);
            const name = String(curriculum?.name || program?.name || offering?.programName || "").trim();
            return name || "";
        })
    );
    const tuitionFeeLines = uniqueCompareLines(
        offerings.map((offering) => {
            const {program} = resolveOfferingForCompare(offering);
            const tuition = Number(offering?.tuitionFee ?? program?.baseTuitionFee);
            if (!Number.isFinite(tuition)) return "";
            const unit = feeUnitLabel(program?.feeUnit);
            return `${formatMoney(tuition)}${unit ? ` / ${unit}` : ""}`;
        })
    );
    const learningMethodsLines = Array.from(
        new Set(
            offerings.flatMap((offering) => {
                const program = offering?.program || {};
                const curriculum = offering?.curriculum || program?.curriculum || {};
                return (Array.isArray(curriculum?.methodLearnings) ? curriculum.methodLearnings : []).map((m) =>
                    mapMethodLabel(m)
                );
            })
        )
    )
        .filter(Boolean)
        .map((label) => `- ${label}`);
    const graduationStandardHtmlList = (() => {
        const seen = new Set();
        const list = [];
        offerings.forEach((offering) => {
            const {program} = resolveOfferingForCompare(offering);
            const html = String(program?.graduationStandard || "").trim();
            if (!html) return;
            const key = html.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            list.push(html);
        });
        return list;
    })();
    const graduationStandardLines = uniqueCompareLines(
        graduationStandardHtmlList.length
            ? graduationStandardHtmlList.flatMap((html) => htmlToComparePlainLines(html))
            : offerings.flatMap((offering) => {
                  const {program} = resolveOfferingForCompare(offering);
                  return htmlToComparePlainLines(program?.graduationStandard);
              })
    );
    const facilitySummary = collectFacilitySummary(campusList);
    const facilityOverviewLines = facilitySummary.overviews.length
        ? uniqueCompareLines(facilitySummary.overviews)
        : ["—"];
    const facilityItemLines = facilitySummary.itemLines.length
        ? uniqueCompareLines(facilitySummary.itemLines)
        : ["—"];
    const facilityImages = facilitySummary.images;
    const now = Date.now();
    const latestEnd = campaignList.reduce((max, campaign) => {
        const endMs = new Date(campaign?.endDate).getTime();
        return Number.isFinite(endMs) && (max == null || endMs > max) ? endMs : max;
    }, null);

    return {
        logoUrl: toText(detail?.logoUrl || row?.logoUrl, ""),
        schoolName: toText(detail?.name || row?.schoolName),
        foundingDateLabel: formatFoundingDate(detail?.foundingDate),
        boardingTypeLabel: boardingLabels.length ? boardingLabels.join(" / ") : "—",
        campusAddressLines: campusAddressLines.length ? campusAddressLines : ["—"],
        districts: campusDistricts.length ? campusDistricts.join(", ") : "—",
        hotlineContact: hotline !== "—" ? hotline : "",
        websiteUrl: website !== "—" ? website : "",
        campaignStatusLabel: primaryCampaign
            ? mapCampaignStatusLabel(primaryCampaign.status)
            : campaignStatusLines[0] || "—",
        campaignStatusLines: campaignStatusLines.length ? campaignStatusLines : ["—"],
        campaignTimeLines: campaignTimelineLines.length ? campaignTimelineLines : ["—"],
        allowedMethodsLines,
        processStepsByMethod,
        quotaTotalLines: quotaTotalLines.length ? quotaTotalLines : ["—"],
        quotaRemainingLines: quotaRemainingLines.length ? quotaRemainingLines : ["—"],
        mandatoryDocLines: mandatoryDocLines.length ? mandatoryDocLines : ["—"],
        reservationFeeLines: reservationFeeLines.length ? reservationFeeLines : ["—"],
        programNameLines: programNameLines.length ? programNameLines : ["—"],
        tuitionFeeLines: tuitionFeeLines.length ? tuitionFeeLines : ["—"],
        learningMethodsLines: learningMethodsLines.length ? learningMethodsLines : ["—"],
        learningMethodsChipText: learningMethodsLines.map((l) => l.replace(/^\s*-\s*/, "")).join(" | "),
        graduationStandardLines: graduationStandardLines.length ? graduationStandardLines : ["—"],
        graduationStandardHtmlList,
        facilityOverviewLines,
        facilityItemLines,
        facilityImages,
        distanceKmNumber: Number.isFinite(distanceKm) ? distanceKm : null,
        distanceLabel: distanceKm == null ? "—" : formatDistanceKm(distanceKm),
        deadlineDays:
            latestEnd != null && Number.isFinite(latestEnd) ? Math.floor((latestEnd - now) / (1000 * 60 * 60 * 24)) : null
    };
}

export default function CompareSchoolsPage() {
    const navigate = useNavigate();

    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    let userInfo = null;
    try {
        userInfo = raw ? JSON.parse(raw) : null;
    } catch {
        userInfo = null;
    }

    const userIdentity = getUserIdentity(userInfo);
    const [rows, setRows] = React.useState(() => getCompareSchools(userInfo));
    const [menuAnchor, setMenuAnchor] = React.useState(null);
    const [menuSchoolKey, setMenuSchoolKey] = React.useState(null);
    const [loadingDetail, setLoadingDetail] = React.useState(false);
    const [detailError, setDetailError] = React.useState("");
    const [comparePayloadByKey, setComparePayloadByKey] = React.useState({});
    const [userLocation, setUserLocation] = React.useState(null);

    React.useEffect(() => {
        setRows(getCompareSchools(userInfo));
    }, [userIdentity]);

    React.useEffect(() => {
        if (typeof navigator === "undefined" || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: Number(position.coords.latitude),
                    lng: Number(position.coords.longitude)
                });
            },
            () => {
                setUserLocation(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 60000
            }
        );
    }, []);

    React.useEffect(() => {
        if (!rows.length) {
            setComparePayloadByKey({});
            setDetailError("");
            setLoadingDetail(false);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoadingDetail(true);
            setDetailError("");
            try {
                const entries = await Promise.all(
                    rows.map(async (row) => {
                        const schoolId = parseSchoolIdFromKey(row?.schoolKey);
                        if (!Number.isFinite(schoolId)) {
                            return [
                                row?.schoolKey,
                                buildComparisonPayload(row, null, [], userLocation)
                            ];
                        }
                        const [detailRaw, campaigns] = await Promise.all([
                            getPublicSchoolDetail(schoolId),
                            getPublicSchoolCampaignTemplates(schoolId, 0).catch(() => [])
                        ]);
                        const detail = mergePublicDetailForCompare(detailRaw);
                        return [
                            row?.schoolKey,
                            buildComparisonPayload(row, detail, campaigns, userLocation)
                        ];
                    })
                );
                if (cancelled) return;
                setComparePayloadByKey(Object.fromEntries(entries.filter(([k]) => Boolean(k))));
            } catch (error) {
                if (cancelled) return;
                const message = String(error?.response?.data?.message || error?.message || "").trim();
                setDetailError(message || "Không tải được dữ liệu so sánh chi tiết.");
            } finally {
                if (!cancelled) setLoadingDetail(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [rows, userLocation]);

    const onRemove = (schoolKey) => {
        const next = rows.filter((x) => x?.schoolKey !== schoolKey);
        setCompareSchools(userInfo, next);
        setRows(next);
        enqueueSnackbar("Đã gỡ trường khỏi danh sách so sánh.", {autoHideDuration: 2000});
        setMenuAnchor(null);
        setMenuSchoolKey(null);
    };

    const openMenu = (e, schoolKey) => {
        setMenuAnchor(e.currentTarget);
        setMenuSchoolKey(schoolKey);
    };

    const closeMenu = () => {
        setMenuAnchor(null);
        setMenuSchoolKey(null);
    };

    const cardSurface = {
        bgcolor: "#fff",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        boxShadow: landingSectionShadow(2)
    };

    const remainingSlots = Math.max(0, MAX_COMPARE_SCHOOLS - rows.length);
    const activeAddCount = remainingSlots > 0 ? 1 : 0;
    const lockedAddCount = remainingSlots > 0 ? remainingSlots - 1 : 0;

    const renderSchoolCard = (row, index) => {
        const tint = SCHOOL_ICON_TINTS[index % SCHOOL_ICON_TINTS.length];
        const loc = formatLocation(row);
        const grade = row?.gradeLevel ? String(row.gradeLevel).trim() : "";
        const type = row?.schoolType ? String(row.schoolType).trim() : "";

        return (
            <Card
                key={row?.schoolKey}
                elevation={0}
                sx={{
                    ...cardSurface,
                    p: 1.5,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative"
                }}
            >
                <Box sx={{display: "flex", alignItems: "flex-start", gap: 1, pr: 3.5}}>
                    <Box sx={{flexShrink: 0, mt: 0.1, lineHeight: 0, display: "flex"}}>
                        <FaSchool size={20} color={tint}/>
                    </Box>
                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: 14,
                            lineHeight: 1.3,
                            color: "#1e293b",
                            wordBreak: "break-word"
                        }}
                    >
                        Trường {row?.schoolName || "—"}
                    </Typography>
                </Box>

                <IconButton
                    size="small"
                    onClick={(e) => openMenu(e, row?.schoolKey)}
                    sx={{
                        position: "absolute",
                        top: 4,
                        right: 2,
                        color: "#94a3b8",
                        "&:hover": {color: BRAND_NAVY, bgcolor: "rgba(59,130,246,0.08)"}
                    }}
                    aria-label="Tùy chọn trường"
                >
                    <MoreVertIcon fontSize="small"/>
                </IconButton>

                <Box sx={{mt: 1, display: "flex", flexDirection: "column", gap: 0.5}}>
                    <Box sx={{display: "flex", alignItems: "flex-start", gap: 0.75}}>
                        <PlaceOutlinedIcon sx={{fontSize: 16, color: "#94a3b8", mt: 0.1, flexShrink: 0}}/>
                        <Typography sx={{fontSize: 12, color: "#64748b", lineHeight: 1.4}}>
                            {loc}
                        </Typography>
                    </Box>
                    {grade ? (
                        <Box sx={{display: "flex", alignItems: "flex-start", gap: 0.75}}>
                            <CastForEducationIcon
                                sx={{fontSize: 16, color: "#94a3b8", mt: 0.1, flexShrink: 0}}/>
                            <Typography sx={{fontSize: 12, color: "#64748b", lineHeight: 1.4}}>
                                {grade}
                            </Typography>
                        </Box>
                    ) : null}
                    {type ? (
                        <Box sx={{display: "flex", alignItems: "flex-start", gap: 0.75}}>
                            <WcIcon sx={{fontSize: 16, color: "#94a3b8", mt: 0.1, flexShrink: 0}}/>
                            <Typography sx={{fontSize: 12, color: "#64748b", lineHeight: 1.4}}>
                                {type}
                            </Typography>
                        </Box>
                    ) : null}
                </Box>
            </Card>
        );
    };

    const renderAddCard = (locked) => (
        <Card
            elevation={0}
            onClick={locked ? undefined : () => navigate("/search-schools")}
            sx={{
                ...cardSurface,
                minHeight: 96,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 1.5,
                cursor: locked ? "not-allowed" : "pointer",
                bgcolor: locked ? "#f1f5f9" : "#fff",
                borderColor: locked ? "#e2e8f0" : "#e5e7eb",
                opacity: locked ? 0.92 : 1,
                transition: "background-color 0.15s ease, border-color 0.15s ease",
                ...(!locked && {
                    "&:hover": {
                        borderColor: BRAND_NAVY,
                        bgcolor: "rgba(59,130,246,0.04)"
                    }
                })
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.75,
                    color: locked ? "#64748b" : "#64748b"
                }}
            >
                {locked ? (
                    <LockIcon sx={{fontSize: 22, color: "#475569"}}/>
                ) : (
                    <AddIcon sx={{fontSize: 26, color: "#64748b", fontWeight: 300}}/>
                )}
                <Typography sx={{fontSize: 13, fontWeight: locked ? 500 : 600, color: locked ? "#64748b" : "#475569"}}>
                    Thêm trường
                </Typography>
            </Box>
        </Card>
    );

    const richRows = React.useMemo(
        () =>
            rows.map((row) => ({
                raw: row,
                detail: comparePayloadByKey[row?.schoolKey] || buildComparisonPayload(row, null, [], userLocation)
            })),
        [rows, comparePayloadByKey, userLocation]
    );

    const sections = [
        {
            key: "general",
            title: "1. Thông tin chung",
            tone: "#2563eb",
            rows: [
                {label: "Năm thành lập", render: (d) => d.foundingDateLabel},
                {label: "Hình thức đào tạo", render: (d) => d.boardingTypeLabel}
            ]
        },
        {
            key: "location",
            title: "2. Vị trí & Liên hệ",
            tone: "#0d9488",
            rows: [
                {label: "Địa chỉ", render: (d) => d.campusAddressLines},
                {label: "Khu vực (Quận/Huyện)", render: (d) => d.districts},
                {label: "Hotline / Website", render: () => "", isHotlineWebsite: true}
            ]
        },
        {
            key: "admission",
            title: "3. Thông tin tuyển sinh",
            tone: "#ca8a04",
            rows: [
                {label: "Trạng thái tuyển sinh", render: (d) => d.campaignStatusLabel},
                {label: "Thời gian tuyển sinh", render: (d) => d.campaignTimeLines},
                {label: "Phương thức xét tuyển", render: (d) => d.allowedMethodsLines},
                {
                    label: "Quy trình các bước",
                    render: (d) => (Array.isArray(d.processStepsByMethod) && d.processStepsByMethod.length ? "" : "—"),
                    isProcessByMethod: true
                }
            ]
        },
        {
            key: "quota",
            title: "4. Chỉ tiêu & Hồ sơ",
            tone: "#ea580c",
            rows: [
                {label: "Tổng chỉ tiêu năm nay", render: (d) => d.quotaTotalLines},
                {label: "Chỉ tiêu còn lại", render: (d) => d.quotaRemainingLines},
                {label: "Hồ sơ bắt buộc", render: (d) => d.mandatoryDocLines},
                {label: "Lệ phí giữ chỗ", render: (d) => d.reservationFeeLines}
            ]
        },
        {
            key: "curriculum",
            title: "5. Chương trình học & Học phí",
            tone: "#6d28d9",
            rows: [
                {label: "Tên chương trình", render: (d) => d.programNameLines},
                {label: "Mức học phí gốc", render: (d) => d.tuitionFeeLines},
                {label: "Hình thức học tập", render: (d) => d.learningMethodsChipText},
                {
                    label: "Chuẩn đầu ra",
                    render: (d) => d.graduationStandardHtmlList,
                    isGraduationHtml: true
                }
            ]
        },
        {
            key: "facility",
            title: "6. Cơ sở vật chất",
            tone: "#0369a1",
            rows: [
                {label: "Tổng quan CSVC", render: (d) => d.facilityOverviewLines},
                {label: "Danh sách phòng chức năng", render: (d) => d.facilityItemLines},
                {label: "Ảnh CSVC", render: (d) => d.facilityImages, isFacilityImages: true}
            ]
        }
    ];

    const sectionStripeBg = (index) => (index % 2 === 0 ? "#ffffff" : "#eff6ff");
    const leftCriteriaColBg = "#ffffff";
    const compareCellTextSx = {
        fontSize: "0.9rem",
        color: "#475569",
        fontWeight: 400,
        lineHeight: 1.55
    };
    const compareSchoolColSx =
        richRows.length >= COMPARE_TABLE_FIT_ALL_COLS_AT
            ? {minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word"}
            : {};
    const compareTableRowSx =
        richRows.length >= COMPARE_TABLE_FIT_ALL_COLS_AT ? {width: "100%"} : {};
    const sectionTitleSx = (tone) => ({
        fontSize: "0.98rem",
        fontWeight: 800,
        color: tone || "#1e3a8a",
        letterSpacing: "0.02em",
        lineHeight: 1.35
    });
    const rowLabelSx = {
        fontSize: "0.9rem",
        fontWeight: 700,
        color: "#1e293b",
        lineHeight: 1.4
    };

    const normalizeWebsiteHref = (url) => {
        const text = String(url || "").trim();
        if (!text) return "";
        if (/^https?:\/\//i.test(text)) return text;
        return `https://${text}`;
    };

    const compareRichHtmlSx = {
        fontSize: "0.9rem",
        color: "#475569",
        fontWeight: 400,
        lineHeight: 1.6,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        "& p": {margin: "0.4em 0"},
        "& ul, & ol": {margin: "0.35em 0", pl: 2.2},
        "& li": {marginBottom: "0.25em"},
        "& strong, & b": {fontWeight: 600, color: "#334155"}
    };

    const renderGraduationStandardHtml = (detail) => {
        const htmlList = Array.isArray(detail?.graduationStandardHtmlList) ? detail.graduationStandardHtmlList : [];
        if (htmlList.length > 0) {
            return (
                <Stack spacing={1}>
                    {htmlList.map((html, idx) => (
                        <Box
                            key={`grad-html-${idx}`}
                            sx={compareRichHtmlSx}
                            dangerouslySetInnerHTML={{__html: html}}
                        />
                    ))}
                </Stack>
            );
        }
        const lines = Array.isArray(detail?.graduationStandardLines) ? detail.graduationStandardLines : [];
        if (!lines.length || (lines.length === 1 && lines[0] === "—")) {
            return <Typography sx={compareCellTextSx}>—</Typography>;
        }
        return (
            <Stack spacing={0.45}>
                {lines.map((line, idx) => {
                    const text = String(line || "").replace(/^\s*-\s*/, "").trim();
                    return (
                        <Typography key={`grad-line-${idx}`} sx={compareCellTextSx}>
                            {text}
                        </Typography>
                    );
                })}
            </Stack>
        );
    };

    const renderHotlineWebsite = (detail) => {
        const hotline = String(detail?.hotlineContact || "").trim();
        const website = String(detail?.websiteUrl || "").trim();
        const href = normalizeWebsiteHref(website);
        if (!hotline && !website) {
            return <Typography sx={compareCellTextSx}>—</Typography>;
        }
        return (
            <Stack spacing={0.4}>
                {hotline ? <Typography sx={compareCellTextSx}>{hotline}</Typography> : null}
                {website ? (
                    <Typography
                        component="a"
                        href={href || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            ...compareCellTextSx,
                            color: href ? "#2563eb" : "#475569",
                            textDecoration: href ? "underline" : "none",
                            wordBreak: "break-all",
                            "&:hover": href ? {color: "#1d4ed8"} : undefined
                        }}
                    >
                        {website}
                    </Typography>
                ) : null}
            </Stack>
        );
    };

    const renderFacilityImages = (images) => {
        const list = Array.isArray(images) ? images : [];
        if (!list.length) {
            return <Typography sx={compareCellTextSx}>—</Typography>;
        }
        return (
            <Box sx={{display: "flex", flexWrap: "wrap", gap: 0.75}}>
                {list.slice(0, 8).map((img) => (
                    <Box
                        key={img.key}
                        component="img"
                        src={img.url}
                        alt={img.name || "Ảnh CSVC"}
                        loading="lazy"
                        title={img.name || "Ảnh CSVC"}
                        sx={{
                            width: 92,
                            height: 68,
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "1px solid #e2e8f0",
                            bgcolor: "#f8fafc"
                        }}
                    />
                ))}
            </Box>
        );
    };

    const renderMethodStepTimeline = (steps, methodKey) => {
        const list = Array.isArray(steps) ? steps : [];
        if (!list.length) return null;
        return (
            <Stack spacing={0.35}>
                {list.map((step, idx) => {
                    const isLast = idx === list.length - 1;
                    return (
                        <Box key={`${methodKey}-step-${idx}`} sx={{display: "flex", alignItems: "center", gap: 0.55}}>
                            <Box sx={{position: "relative", flexShrink: 0}}>
                                <Box
                                    sx={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: "50%",
                                        bgcolor: "rgba(37,99,235,0.14)",
                                        border: "1px solid rgba(37,99,235,0.4)",
                                        color: "#1d4ed8",
                                        fontSize: "0.63rem",
                                        fontWeight: 600,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    {step.stepOrder}
                                </Box>
                                {!isLast ? (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            left: "50%",
                                            top: 16,
                                            transform: "translateX(-50%)",
                                            width: 1.5,
                                            height: 13,
                                            bgcolor: "rgba(59,130,246,0.28)",
                                            borderRadius: 999
                                        }}
                                    />
                                ) : null}
                            </Box>
                            <Typography sx={{...compareCellTextSx, fontSize: "0.85rem", mt: 0.05}}>
                                {step.stepName}
                            </Typography>
                        </Box>
                    );
                })}
            </Stack>
        );
    };

    const renderProcessByMethod = (detail) => {
        const groups = Array.isArray(detail?.processStepsByMethod) ? detail.processStepsByMethod : [];
        if (!groups.length) return null;
        return (
            <Stack spacing={1.1} sx={{mt: 0.45}}>
                {groups.map((group) => {
                    const methodKey = `${detail?.schoolName || "school"}-${group.methodCode || group.displayName}`;
                    return (
                        <Box key={methodKey}>
                            <Typography
                                sx={{
                                    fontSize: "0.9rem",
                                    fontWeight: 700,
                                    color: "#1e293b",
                                    lineHeight: 1.4,
                                    mb: group.steps?.length ? 0.4 : 0.2
                                }}
                            >
                                {group.displayName}
                            </Typography>
                            {group.steps?.length ? (
                                renderMethodStepTimeline(group.steps, methodKey)
                            ) : (
                                <Typography sx={{...compareCellTextSx, fontSize: "0.85rem", color: "#94a3b8"}}>
                                    Chưa có quy trình chi tiết
                                </Typography>
                            )}
                        </Box>
                    );
                })}
            </Stack>
        );
    };

    return (
        <Box
            sx={{
                pt: "90px",
                minHeight: "100vh",
                background: HOME_PAGE_SURFACE_GRADIENT
            }}
        >
            <Box sx={{maxWidth: 1200, mx: "auto", px: {xs: 2, md: 3}, pb: 5}}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                        flexWrap: "wrap",
                        gap: 1.5
                    }}
                >
                    <Typography sx={{fontWeight: 800, fontSize: 20, color: "#1e293b"}}>
                        So sánh trường
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => navigate("/search-schools")}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderColor: "rgba(59,130,246,0.35)",
                            color: BRAND_NAVY,
                            "&:hover": {borderColor: BRAND_NAVY, bgcolor: "rgba(59,130,246,0.06)"}
                        }}
                    >
                        Tìm thêm trường
                    </Button>
                </Box>

                <Typography sx={{color: "#64748b", fontSize: 14, mb: 2, maxWidth: 720}}>
                    Chọn tối đa {MAX_COMPARE_SCHOOLS} trường. Dùng nút &quot;+&quot; ở trang tìm trường hoặc ô bên dưới để thêm.
                </Typography>

                <Box
                    sx={{
                        width: "100%",
                        maxWidth: "100%",
                        overflowX: rows.length >= 3 ? "auto" : "visible",
                        WebkitOverflowScrolling: "touch",
                        pb: rows.length >= 3 ? 0.5 : 0
                    }}
                >
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns:
                                rows.length >= 4
                                    ? `repeat(${rows.length}, minmax(220px, 1fr))`
                                    : {
                                          xs: "1fr",
                                          sm: "repeat(2, minmax(0, 1fr))",
                                          lg: `repeat(${Math.max(rows.length, 1)}, minmax(0, 1fr))`
                                      },
                            gap: 2,
                            width: rows.length >= 4 ? "max-content" : "100%",
                            minWidth: rows.length >= 4 ? rows.length * 220 + (rows.length - 1) * 16 : undefined
                        }}
                    >
                    {rows.map((row, i) => renderSchoolCard(row, i))}
                    {activeAddCount > 0 ? renderAddCard(false) : null}
                    {Array.from({length: lockedAddCount}).map((_, i) => (
                        <React.Fragment key={`lock-${i}`}>{renderAddCard(true)}</React.Fragment>
                    ))}
                    </Box>
                </Box>

                {rows.length > 0 ? (
                    <Box sx={{mt: 2}}>
                        {loadingDetail || detailError ? (
                            <Box sx={{p: {xs: 1.1, md: 1.35}, borderBottom: "1px solid rgba(148,163,184,0.25)", bgcolor: "#fff", borderRadius: 2}}>
                                {loadingDetail ? (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CircularProgress size={18}/>
                                        <Typography sx={{fontSize: "0.9rem", color: "#475569"}}>Đang tải dữ liệu chi tiết...</Typography>
                                    </Stack>
                                ) : null}
                                {!loadingDetail && detailError ? (
                                    <Alert severity="warning">
                                        {detailError}
                                    </Alert>
                                ) : null}
                            </Box>
                        ) : null}

                        {richRows.length >= COMPARE_TABLE_FIT_ALL_COLS_AT ? (
                            <Typography sx={{fontSize: "0.82rem", color: "#64748b", mb: 0.75, display: {xs: "block", md: "none"}}}>
                                Cuộn ngang để xem đủ {richRows.length} trường trên màn hình nhỏ
                            </Typography>
                        ) : richRows.length >= 3 ? (
                            <Typography sx={{fontSize: "0.82rem", color: "#64748b", mb: 0.75}}>
                                Cuộn ngang để xem đủ {richRows.length} trường
                            </Typography>
                        ) : null}
                        <Box
                            sx={{
                                width: "100%",
                                maxWidth: "100%",
                                overflowX: "auto",
                                overflowY: "hidden",
                                WebkitOverflowScrolling: "touch",
                                scrollbarGutter: "stable",
                                bgcolor: "transparent",
                                pb: 1.5,
                                mx: {xs: -1, sm: 0}
                            }}
                        >
                            <Box
                                sx={{
                                    width: compareTableInnerWidth(richRows.length),
                                    minWidth: compareTableScrollMinWidth(richRows.length),
                                    pr: 2,
                                    boxSizing: "border-box"
                                }}
                            >
                                <Box
                                    sx={{
                                        ...compareTableRowSx,
                                        display: "grid",
                                        gridTemplateColumns: compareTableGridColumns(richRows.length),
                                        columnGap: `${COMPARE_TABLE_COL_GAP}px`,
                                        position: "sticky",
                                        top: 0,
                                        zIndex: 5,
                                        bgcolor: "transparent",
                                        borderBottom: "1px solid rgba(59,130,246,0.22)"
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: "sticky",
                                            left: 0,
                                            zIndex: 6,
                                            px: 1.4,
                                            py: 1.2,
                                            bgcolor: leftCriteriaColBg,
                                            borderRight: "1px solid rgba(59,130,246,0.25)",
                                            borderTopLeftRadius: 12,
                                            borderTopRightRadius: 12
                                        }}
                                    >
                                    </Box>
                                    {richRows.map((item) => (
                                        <Box
                                            key={`sticky-head-${item.raw?.schoolKey}`}
                                            sx={{
                                                ...compareSchoolColSx,
                                                px: 1.2,
                                                py: 1.1,
                                                borderLeft: "1px solid rgba(59,130,246,0.2)",
                                                bgcolor: "#2563eb",
                                                color: "#fff",
                                                borderTopLeftRadius: 14,
                                                borderTopRightRadius: 14,
                                                boxShadow: "0 10px 24px rgba(37,99,235,0.28)"
                                            }}
                                        >
                                            <Stack direction="row" spacing={0.9} alignItems="center">
                                                <Avatar src={item.detail.logoUrl || undefined} sx={{width: 34, height: 34, bgcolor: "#dbeafe"}}>
                                                    {String(item.detail.schoolName || "?").charAt(0)}
                                                </Avatar>
                                                <Box sx={{minWidth: 0}}>
                                                    <Typography sx={{fontWeight: 800, color: "#ffffff", fontSize: "0.92rem", lineHeight: 1.35}}>
                                                        {item.detail.schoolName}
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() => navigate("/search-schools")}
                                                        sx={{mt: 0.25, p: 0, minWidth: 0, textTransform: "none", fontSize: "0.72rem", fontWeight: 700, color: "#dbeafe"}}
                                                    >
                                                        Xem chi tiết
                                                    </Button>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    ))}
                                </Box>

                                {sections.map((section, sectionIdx) => (
                                    <Box key={section.key} sx={{bgcolor: sectionStripeBg(sectionIdx)}}>
                                        <Box
                                            sx={{
                                                ...compareTableRowSx,
                                                display: "grid",
                                                gridTemplateColumns: compareTableGridColumns(richRows.length),
                                                columnGap: `${COMPARE_TABLE_COL_GAP}px`,
                                                borderTop: "1px solid rgba(59,130,246,0.16)"
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    position: "sticky",
                                                    left: 0,
                                                    zIndex: 3,
                                                    px: 1.4,
                                                    py: 1.15,
                                                    bgcolor: leftCriteriaColBg,
                                                    borderRight: "1px solid rgba(59,130,246,0.2)",
                                                    borderLeft: `4px solid ${section.tone || "#2563eb"}`,
                                                    borderRadius: "10px",
                                                    boxShadow: "0 3px 10px rgba(37,99,235,0.14)",
                                                    "&::after": {
                                                        content: '""',
                                                        position: "absolute",
                                                        right: -16,
                                                        top: "50%",
                                                        width: 16,
                                                        borderTop: "2px solid rgba(29,78,216,0.45)",
                                                        transform: "translateY(-50%)",
                                                        zIndex: 2
                                                    }
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        right: -4,
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        width: 7,
                                                        height: 7,
                                                        borderRadius: "50%",
                                                        bgcolor: section.tone || "#1d4ed8",
                                                        opacity: 0.88,
                                                        zIndex: 3
                                                    }}
                                                />
                                                <Typography sx={sectionTitleSx(section.tone)}>{section.title}</Typography>
                                            </Box>
                                            {richRows.map((item, colIdx) => {
                                                const isLastCol = colIdx === richRows.length - 1;
                                                return (
                                                    <Box
                                                        key={`sec-head-${section.key}-${item.raw?.schoolKey}`}
                                                        sx={{
                                                            ...compareSchoolColSx,
                                                            position: "relative",
                                                            px: 1.2,
                                                            py: 1.1,
                                                            borderLeft: "1px solid rgba(59,130,246,0.14)",
                                                            bgcolor: "#ffffff",
                                                            borderRadius: "10px",
                                                            boxShadow: "0 3px 10px rgba(15,23,42,0.08)",
                                                            "&::after": !isLastCol
                                                                ? {
                                                                      content: '""',
                                                                      position: "absolute",
                                                                      right: -16,
                                                                      top: "50%",
                                                                      width: 16,
                                                                      borderTop: "2px solid rgba(29,78,216,0.45)",
                                                                      transform: "translateY(-50%)",
                                                                      zIndex: 1
                                                                  }
                                                                : undefined
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                position: "absolute",
                                                                left: -4,
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                width: 7,
                                                                height: 7,
                                                                borderRadius: "50%",
                                                                bgcolor: "#1d4ed8",
                                                                opacity: 0.88,
                                                                zIndex: 2
                                                            }}
                                                        />
                                                        <Box
                                                            sx={{
                                                                position: "absolute",
                                                                right: -4,
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                width: 7,
                                                                height: 7,
                                                                borderRadius: "50%",
                                                                bgcolor: "#1d4ed8",
                                                                opacity: 0.88,
                                                                zIndex: 2
                                                            }}
                                                        />
                                                    </Box>
                                                );
                                            })}
                                        </Box>

                                        {section.rows.map((rowMeta) => (
                                            <Box
                                                key={`${section.key}-${rowMeta.label}`}
                                                sx={{
                                                    ...compareTableRowSx,
                                                    display: "grid",
                                                    gridTemplateColumns: compareTableGridColumns(richRows.length),
                                                    columnGap: `${COMPARE_TABLE_COL_GAP}px`,
                                                    borderTop: "1px dashed rgba(59,130,246,0.22)"
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        position: "sticky",
                                                        left: 0,
                                                        zIndex: 2,
                                                        pl: 2.9,
                                                        pr: 1.4,
                                                        py: 1.05,
                                                        bgcolor: leftCriteriaColBg,
                                                        borderRight: "1px solid rgba(59,130,246,0.2)",
                                                        borderRadius: "10px",
                                                        boxShadow: "0 3px 10px rgba(15,23,42,0.08)",
                                                        "&::after": {
                                                            content: '""',
                                                            position: "absolute",
                                                            right: -16,
                                                            top: "50%",
                                                            width: 16,
                                                            borderTop: "2px solid rgba(29,78,216,0.45)",
                                                            transform: "translateY(-50%)",
                                                            zIndex: 2
                                                        }
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            position: "absolute",
                                                            right: -4,
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            width: 7,
                                                            height: 7,
                                                            borderRadius: "50%",
                                                            bgcolor: "#1d4ed8",
                                                            opacity: 0.88,
                                                            zIndex: 3
                                                        }}
                                                    />
                                                    <Stack direction="row" spacing={0.7} alignItems="center">
                                                        {(() => {
                                                            const MetricIcon = metricIconByLabel(rowMeta.label);
                                                            return (
                                                                <MetricIcon
                                                                    sx={{fontSize: 17, color: section.tone || "#1d4ed8", flexShrink: 0}}
                                                                />
                                                            );
                                                        })()}
                                                        <Typography sx={rowLabelSx}>{rowMeta.label}</Typography>
                                                    </Stack>
                                                </Box>
                                                {richRows.map((item, colIdx) => {
                                                    const cellText = rowMeta.render(item.detail);
                                                    const isLastCol = colIdx === richRows.length - 1;
                                                    return (
                                                        <Box
                                                            key={`${section.key}-${rowMeta.label}-${item.raw?.schoolKey}`}
                                                            sx={{
                                                                ...compareSchoolColSx,
                                                                position: "relative",
                                                                pl: 2.4,
                                                                pr: 1.2,
                                                                py: 1.05,
                                                                borderLeft: "1px solid rgba(59,130,246,0.14)",
                                                                bgcolor: "#ffffff",
                                                                borderRadius: "10px",
                                                                boxShadow: "0 4px 12px rgba(15,23,42,0.09)",
                                                                "&::after": !isLastCol
                                                                    ? {
                                                                          content: '""',
                                                                          position: "absolute",
                                                                          right: -16,
                                                                          top: "50%",
                                                                          width: 16,
                                                                          borderTop: "2px solid rgba(29,78,216,0.45)",
                                                                          transform: "translateY(-50%)",
                                                                          zIndex: 1
                                                                      }
                                                                    : undefined
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    position: "absolute",
                                                                    left: -4,
                                                                    top: "50%",
                                                                    transform: "translateY(-50%)",
                                                                    width: 7,
                                                                    height: 7,
                                                                    borderRadius: "50%",
                                                                    bgcolor: "#1d4ed8",
                                                                    opacity: 0.88,
                                                                    zIndex: 2
                                                                }}
                                                            />
                                                            <Box
                                                                sx={{
                                                                    position: "absolute",
                                                                    right: -4,
                                                                    top: "50%",
                                                                    transform: "translateY(-50%)",
                                                                    width: 7,
                                                                    height: 7,
                                                                    borderRadius: "50%",
                                                                    bgcolor: "#1d4ed8",
                                                                    opacity: 0.88,
                                                                    zIndex: 2
                                                                }}
                                                            />
                                                            {rowMeta.isFacilityImages ? (
                                                                renderFacilityImages(cellText)
                                                            ) : rowMeta.isGraduationHtml ? (
                                                                renderGraduationStandardHtml(item.detail)
                                                            ) : rowMeta.isHotlineWebsite ? (
                                                                renderHotlineWebsite(item.detail)
                                                            ) : rowMeta.isProcessByMethod ? (
                                                                renderProcessByMethod(item.detail)
                                                            ) : section.key === "general" && rowMeta.label === "Hình thức đào tạo" ? (
                                                                <Stack direction="row" flexWrap="wrap" useFlexGap sx={{gap: 0.5}}>
                                                                    {String(cellText)
                                                                        .split("/")
                                                                        .map((x) => x.trim())
                                                                        .filter(Boolean)
                                                                        .map((label) => (
                                                                            <Chip
                                                                                key={`${item.raw?.schoolKey}-${label}`}
                                                                                size="small"
                                                                                label={label}
                                                                                sx={{
                                                                                    height: 22,
                                                                                    fontSize: "0.72rem",
                                                                                    fontWeight: 500,
                                                                                    bgcolor: label.includes("Nội trú")
                                                                                        ? "rgba(124,58,237,0.14)"
                                                                                        : "rgba(37,99,235,0.14)",
                                                                                    color: label.includes("Nội trú") ? "#6d28d9" : "#1d4ed8",
                                                                                    border: "1px solid rgba(148,163,184,0.35)"
                                                                                }}
                                                                            />
                                                                        ))}
                                                                </Stack>
                                                            ) : section.key === "curriculum" && rowMeta.label === "Hình thức học tập" ? (
                                                                <Stack direction="row" flexWrap="wrap" useFlexGap sx={{gap: 0.45}}>
                                                                    {String(cellText)
                                                                        .split("|")
                                                                        .map((x) => x.trim())
                                                                        .filter(Boolean)
                                                                        .map((tag) => (
                                                                            <Chip
                                                                                key={`${item.raw?.schoolKey}-${tag}`}
                                                                                size="small"
                                                                                label={tag}
                                                                                sx={{
                                                                                    height: 22,
                                                                                    fontSize: "0.72rem",
                                                                                    fontWeight: 500,
                                                                                    bgcolor: "rgba(59,130,246,0.1)",
                                                                                    color: "#1d4ed8",
                                                                                    border: "1px solid rgba(59,130,246,0.24)"
                                                                                }}
                                                                            />
                                                                        ))}
                                                                </Stack>
                                                            ) : (
                                                                <>
                                                                    {Array.isArray(cellText) ? (
                                                                        <Stack spacing={0.45}>
                                                                            {cellText.map((line, idx) => {
                                                                                const rawLine = String(line || "");
                                                                                const normalizedLine =
                                                                                    cellText.length === 1
                                                                                        ? rawLine.replace(/^\s*-\s*/, "")
                                                                                        : rawLine;
                                                                                const isBullet = normalizedLine.trim().startsWith("-");
                                                                                const bulletText = normalizedLine.replace(/^\s*-\s*/, "").trim();
                                                                                if (isBullet) {
                                                                                    return (
                                                                                        <Box
                                                                                            key={`${section.key}-${rowMeta.label}-${item.raw?.schoolKey}-${idx}`}
                                                                                            sx={{display: "flex", alignItems: "flex-start", gap: 0.7}}
                                                                                        >
                                                                                            <Box
                                                                                                sx={{
                                                                                                    width: 6,
                                                                                                    height: 6,
                                                                                                    borderRadius: "50%",
                                                                                                    bgcolor: "#2563eb",
                                                                                                    mt: 0.62,
                                                                                                    flexShrink: 0
                                                                                                }}
                                                                                            />
                                                                                            <Typography sx={compareCellTextSx}>
                                                                                                {bulletText}
                                                                                            </Typography>
                                                                                        </Box>
                                                                                    );
                                                                                }
                                                                                return (
                                                                                    <Typography
                                                                                        key={`${section.key}-${rowMeta.label}-${item.raw?.schoolKey}-${idx}`}
                                                                                        sx={{...compareCellTextSx, whiteSpace: "pre-line"}}
                                                                                    >
                                                                                        {normalizedLine}
                                                                                    </Typography>
                                                                                );
                                                                            })}
                                                                        </Stack>
                                                                    ) : (
                                                                        <Typography sx={compareCellTextSx}>
                                                                            {cellText}
                                                                        </Typography>
                                                                    )}
                                                                </>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                ) : null}

                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
                    <MenuItem
                        onClick={() => menuSchoolKey && onRemove(menuSchoolKey)}
                        sx={{fontSize: 14}}
                    >
                        Gỡ khỏi so sánh
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );
}
