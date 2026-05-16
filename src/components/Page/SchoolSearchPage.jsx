import React from "react";
import {
    Alert,
    Box,
    Button,
    ButtonBase,
    Card,
    CardMedia,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Modal,
    FormControl,
    IconButton,
    InputAdornment,
    Link,
    LinearProgress,
    MenuItem,
    Pagination,
    Select,
    Slider,
    Stack,
    TextField,
    Typography,
    CircularProgress
} from "@mui/material";
import {
    Add as AddIcon,
    AutoAwesome as SparkleIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    FactCheck as FactCheckIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    Language as LanguageIcon,
    LocationOn as LocationOnIcon,
    PersonOutline as PersonOutlineIcon,
    Phone as PhoneIcon,
    Search as SearchIcon,
    Tune as TuneIcon
} from "@mui/icons-material";
import {useLocation, useNavigate} from "react-router-dom";
import {
    APP_PRIMARY_DARK,
    APP_PRIMARY_MAIN,
    APP_PRIMARY_MUTED_BORDER,
    BRAND_NAVY,
    BRAND_SKY,
    BRAND_SKY_LIGHT,
    HOME_PAGE_SURFACE_GRADIENT,
    landingSectionShadow
} from "../../constants/homeLandingTheme";
import {parseBoardingType} from "../../constants/schoolBoardingType";
import {
    getCompareSchools,
    MAX_COMPARE_SCHOOLS,
    setCompareSchools
} from "../../utils/compareSchoolsStorage";
import {showErrorSnackbar, showSuccessSnackbar, showWarningSnackbar} from "../ui/AppSnackbar.jsx";
import {
    getSchoolStorageKey,
    getUserIdentity
} from "../../utils/savedSchoolsStorage";
import {
    getPublicSchoolCampaignTemplates,
    getPublicSchoolDetail,
    getPublicSchoolList
} from "../../services/SchoolPublicService.jsx";
import {
    deleteParentFavouriteSchool,
    getParentAdmissionDocuments,
    getParentAdmissionReservationFormTemplate,
    putParentAdmissionSchoolsAvailability,
    getParentFavouriteSchools,
    getParentStudent,
    getParentStudentById,
    pickAdmissionDocumentsFromResponse,
    pickStudentDetailBodyFromResponse,
    pickAdmissionSchoolsAvailabilityFromResponse,
    postParentAdmissionReservationForm,
    postParentFavouriteSchool
} from "../../services/ParentService.jsx";
import {AdmissionDocumentsSection} from "./admission/AdmissionDocumentUploadFields.jsx";
import {
    applyReservationTemplateToDocs,
    buildInitialDocsState,
    buildSubmissionDocumentsPayload,
    cloneEmptyCatalogDocs,
    hasSavedReservationTemplateForStudent,
    HOC_BA_THCS_GRADE_LABELS,
    mapStudentProfileForAvailabilitySummary,
    pickReservationTemplateBodyFromResponse,
    pickStudentProfileIdFromTemplateBody,
} from "./admission/admissionSubmissionUtils.js";
import SchoolSearchDetailView from "./SchoolSearchDetailView.jsx";
import {DEFAULT_SCHOOL_IMAGE, mapPublicSchoolDetailToRow, normalizeProvinceName} from "../../utils/schoolPublicMapper.js";

const LOCATION_FALLBACK_PROVINCE = "Tất cả";
const LOCATION_FALLBACK_WARD = "Tất cả";
const FAVOURITE_SYNC_PAGE_SIZE = 200;
const SEARCH_SCHOOLS_LIST_PATH = "/search-schools";
const SEARCH_SCHOOLS_DETAIL_PATH = "/search-schools/detail";
const BATCH_ADMISSION_SCHOOL_IDS_KEY = "edubridge_batch_admission_school_ids";
const PARENT_ADMISSION_RESERVATIONS_PATH = "/parent/admission-reservations";
const TUITION_FILTER_MAX = 100_000_000;

function getSchoolUrlName(school) {
    return String(school?.school ?? school?.name ?? "").trim();
}

function getBatchRowSchoolId(school) {
    const n = Number(school?.id);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function extractParentStudentRecordsFromResponse(response) {
    const data = response?.data;
    if (data == null) return [];
    let inner = data.body ?? data;
    if (typeof inner === "string") {
        try {
            inner = JSON.parse(inner);
        } catch {
            return [];
        }
    }
    if (Array.isArray(inner)) return inner;
    if (Array.isArray(inner?.students)) return inner.students;
    if (Array.isArray(inner?.data)) return inner.data;
    if (inner && typeof inner === "object") return [inner];
    return [];
}

function pickStudentProfileIdFromRecord(student) {
    if (!student || typeof student !== "object") return null;
    const raw = student.studentProfileId ?? student.id ?? student.studentId ?? null;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : null;
}

function pickStudentDisplayNameForSelect(student) {
    if (!student || typeof student !== "object") return "Học sinh";
    const name = String(
        student.studentName || student.childName || student.fullName || student.name || ""
    ).trim();
    return name || "Học sinh";
}

function parseFavouriteListPayload(res) {
    const raw = res?.data?.body ?? res?.body ?? res?.data ?? res;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.content)) return raw.content;
    if (Array.isArray(raw)) return raw;
    return [];
}

function buildFavouriteIdBySchool(items) {
    const map = {};
    for (const item of items) {
        const schoolId = Number(
            item?.schoolId ??
            item?.school?.schoolId ??
            item?.school?.id ??
            item?.id ??
            null
        );
        const favouriteId = Number(item?.id ?? item?.favouriteId ?? null);
        if (Number.isFinite(schoolId) && Number.isFinite(favouriteId)) {
            map[schoolId] = favouriteId;
        }
    }
    return map;
}

function mapPublicSchoolToRow(api) {
    if (!api || typeof api !== "object") return null;
    const campusList = Array.isArray(api.campusList) ? api.campusList : [];
    const firstCampus = campusList[0] ?? null;
    return {
        id: api.id,
        school: api.name ?? "",
        province: LOCATION_FALLBACK_PROVINCE,
        ward: LOCATION_FALLBACK_WARD,
        website: api.websiteUrl || "",
        phone: api.hotline || "",
        emailSupport: String(api.emailSupport || "").trim(),
        email: api.email || api.schoolEmail || api.accountEmail || "",
        counsellorEmail: api.counsellorEmail || "",
        address: firstCampus?.address || api.address || "",
        locationLabel: "TP.HCM",
        description: api.description,
        averageRating: typeof api.averageRating === "number" ? api.averageRating : 0,
        totalCampus: api.totalCampus ?? 0,
        logoUrl: api.logoUrl || null,
        isFavourite: Boolean(api.isFavourite),
        foundingDate: api.foundingDate,
        representativeName: api.representativeName,
        campusList: [],
        curriculumList: [],
        boardingType: "",
        hasDetailLoaded: false
    };
}

function mergeCurriculumList(baseList, campaignList) {
    const merged = [];
    const seen = new Set();
    const pushCurriculum = (curriculum) => {
        if (!curriculum || typeof curriculum !== "object") return;
        const idPart = curriculum?.id != null ? String(curriculum.id) : "";
        const namePart = String(curriculum?.name || "").trim().toLowerCase();
        const typePart = String(curriculum?.curriculumType || "").trim().toUpperCase();
        const key = `${idPart}|${namePart}|${typePart}`;
        if (!idPart && !namePart) return;
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(curriculum);
    };
    (Array.isArray(baseList) ? baseList : []).forEach(pushCurriculum);
    (Array.isArray(campaignList) ? campaignList : []).forEach(pushCurriculum);
    return merged;
}

function pickCurriculumListFromCampaignTemplates(templates) {
    const out = [];
    const campaigns = Array.isArray(templates) ? templates : [];
    for (const campaign of campaigns) {
        const offerings = Array.isArray(campaign?.campusProgramOfferings) ? campaign.campusProgramOfferings : [];
        for (const offering of offerings) {
            const curriculumFromOffering = offering?.curriculum;
            if (curriculumFromOffering && typeof curriculumFromOffering === "object") {
                out.push(curriculumFromOffering);
            }
            const curriculumFromProgram = offering?.program?.curriculum;
            if (curriculumFromProgram && typeof curriculumFromProgram === "object") {
                out.push(curriculumFromProgram);
            }
        }
    }
    return out;
}

function pickTuitionFeesFromCampaignTemplates(templates) {
    const fees = [];
    const campaigns = Array.isArray(templates) ? templates : [];
    for (const campaign of campaigns) {
        const offerings = Array.isArray(campaign?.campusProgramOfferings) ? campaign.campusProgramOfferings : [];
        for (const offering of offerings) {
            const feeCandidates = [
                offering?.tuitionFee,
                offering?.baseTuitionFee,
                offering?.program?.tuitionFee,
                offering?.program?.baseTuitionFee
            ];
            for (const fee of feeCandidates) {
                const feeNumber = Number(fee);
                if (Number.isFinite(feeNumber) && feeNumber > 0) {
                    fees.push(feeNumber);
                    break;
                }
            }
        }
    }
    return fees;
}

function formatVndCompact(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "0 VND";
    return `${Math.round(amount).toLocaleString("vi-VN")} VND`;
}

export default function SchoolSearchPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const userInfo = React.useMemo(() => {
        try {
            return rawUser ? JSON.parse(rawUser) : null;
        } catch {
            return null;
        }
    }, [rawUser]);

    const isParent = userInfo?.role === "PARENT";
    const userIdentity = getUserIdentity(userInfo);
    const canSaveSchool = Boolean(isParent && userInfo);

    const [searchKeyword, setSearchKeyword] = React.useState('');
    const [schools, setSchools] = React.useState([]);
    const [listLoading, setListLoading] = React.useState(true);
    const [listError, setListError] = React.useState(null);
    const [detailLoading, setDetailLoading] = React.useState(false);
    const [detailError, setDetailError] = React.useState(null);
    const [favouriteIdBySchool, setFavouriteIdBySchool] = React.useState({});
    const [selectedDistrict, setSelectedDistrict] = React.useState("");
    const [selectedProvince, setSelectedProvince] = React.useState("");
    const [selectedBoardingType, setSelectedBoardingType] = React.useState(null);
    const [selectedCurriculumType, setSelectedCurriculumType] = React.useState(null);
    const [tuitionRange, setTuitionRange] = React.useState([0, 0]);
    const [isTuitionFilterActive, setIsTuitionFilterActive] = React.useState(false);

    const provinces = React.useMemo(
        () =>
            Array.from(
                new Set(
                    schools
                        .map((s) => normalizeProvinceName(s.province))
                        .filter((value) => Boolean(value) && value !== LOCATION_FALLBACK_PROVINCE)
                )
            ),
        [schools]
    );
    const wardsByProvince = React.useMemo(() => {
        const acc = {};
        for (const s of schools) {
            const p = normalizeProvinceName(s.province);
            if (!p) continue;
            if (!acc[p]) acc[p] = new Set();
            if (s.ward && s.ward !== LOCATION_FALLBACK_WARD) {
                acc[p].add(s.ward);
            }
        }
        return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, Array.from(v)]));
    }, [schools]);
    const allWards = React.useMemo(
        () =>
            Array.from(
                new Set(
                    schools
                        .map((s) => s.ward)
                        .filter((value) => Boolean(value) && value !== LOCATION_FALLBACK_WARD)
                )
            ),
        [schools]
    );

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            setListLoading(true);
            setListError(null);
            try {
                const raw = await getPublicSchoolList();
                if (cancelled) return;
                const rows = raw.map(mapPublicSchoolToRow).filter(Boolean);
                const detailRows = await Promise.all(
                    rows.map(async (row) => {
                        if (!row?.id) return row;
                        try {
                            const [detailBody, campaignTemplates] = await Promise.all([
                                getPublicSchoolDetail(row.id),
                                getPublicSchoolCampaignTemplates(row.id, 0).catch(() => [])
                            ]);
                            const mappedDetail = mapPublicSchoolDetailToRow(detailBody);
                            if (!mappedDetail) return row;
                            const campaignCurriculumList = pickCurriculumListFromCampaignTemplates(campaignTemplates);
                            const tuitionFeeList = pickTuitionFeesFromCampaignTemplates(campaignTemplates);
                            const tuitionFeeMin = tuitionFeeList.length > 0 ? Math.min(...tuitionFeeList) : null;
                            const tuitionFeeMax = tuitionFeeList.length > 0 ? Math.max(...tuitionFeeList) : null;
                            return {
                                ...row,
                                ...mappedDetail,
                                curriculumList: mergeCurriculumList(mappedDetail?.curriculumList, campaignCurriculumList),
                                tuitionFeeMin,
                                tuitionFeeMax
                            };
                        } catch {
                            return row;
                        }
                    })
                );
                if (cancelled) return;
                setSchools(detailRows);
            } catch (e) {
                if (!cancelled) {
                    const msg =
                        e?.response?.data?.message ||
                        e?.message ||
                        "Không tải được danh sách trường.";
                    setListError(msg);
                    setSchools([]);
                }
            } finally {
                if (!cancelled) setListLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    React.useEffect(() => {
        window.scrollTo({top: 0, left: 0, behavior: 'auto'});
    }, []);

    const [compareSchoolKeys, setCompareSchoolKeys] = React.useState(() => {
        if (typeof window === "undefined") return new Set();
        const list = getCompareSchools(userInfo);
        return new Set(list.map((x) => x?.schoolKey).filter(Boolean));
    });

    const toggleSingleSelection = (value, setter) => {
        setter((prev) => (prev === value ? null : value));
    };

    const filterChipSx = (isSelected) => ({
        borderRadius: 999,
        fontWeight: isSelected ? 700 : 600,
        fontSize: '0.8125rem',
        color: isSelected ? BRAND_NAVY : '#64748b',
        bgcolor: isSelected ? 'rgba(45, 95, 115, 0.12)' : 'rgba(255,255,255,0.9)',
        border: `1px solid ${isSelected ? 'rgba(59,130,246,0.42)' : 'rgba(51,65,85,0.10)'}`,
        cursor: 'pointer',
        px: 1,
        py: 0.35,
        transition: 'all 0.34s cubic-bezier(0.2, 0, 0, 1)',
        boxShadow: isSelected ? '0 4px 14px rgba(45, 95, 115, 0.14)' : 'none',
        '&:hover': {
            bgcolor: isSelected ? 'rgba(45, 95, 115, 0.18)' : 'rgba(255,255,255,1)',
            color: BRAND_NAVY,
            borderColor: isSelected ? APP_PRIMARY_DARK : APP_PRIMARY_MUTED_BORDER,
            transform: 'translateY(-1px)',
            boxShadow: landingSectionShadow(3)
        }
    });

    React.useEffect(() => {
        const wards = selectedProvince ? (wardsByProvince[selectedProvince] ?? []) : allWards;
        setSelectedDistrict((prev) => (wards.includes(prev) ? prev : ""));
    }, [selectedProvince, wardsByProvince, allWards]);

    React.useEffect(() => {
        const compare = getCompareSchools(userInfo);
        setCompareSchoolKeys(new Set(compare.map((x) => x?.schoolKey).filter(Boolean)));
    }, [userIdentity]);

    const availableDistricts = selectedProvince ? (wardsByProvince[selectedProvince] ?? []) : allWards;
    const tuitionBounds = React.useMemo(() => {
        const fees = schools
            .flatMap((s) => [Number(s?.tuitionFeeMin), Number(s?.tuitionFeeMax)])
            .filter((value) => Number.isFinite(value) && value > 0);
        if (fees.length === 0) return {min: 0, max: TUITION_FILTER_MAX};
        return {min: 0, max: TUITION_FILTER_MAX};
    }, [schools]);
    React.useEffect(() => {
        setTuitionRange([tuitionBounds.min, tuitionBounds.max]);
        setIsTuitionFilterActive(false);
    }, [tuitionBounds.min, tuitionBounds.max]);
    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    const filteredSchools = schools.filter((s) => {
        const matchProvince = selectedProvince ? normalizeProvinceName(s.province) === selectedProvince : true;
        const matchWard = selectedDistrict ? s.ward === selectedDistrict : true;
        const matchKeyword = normalizedKeyword ? s.school.toLowerCase().includes(normalizedKeyword) : true;
        const campusBoardingType = parseBoardingType(s?.boardingType);
        const matchBoardingType = selectedBoardingType
            ? selectedBoardingType === "Nội trú"
                ? campusBoardingType === "FULL_BOARDING"
                : selectedBoardingType === "Bán trú"
                    ? campusBoardingType === "SEMI_BOARDING"
                    : selectedBoardingType === "Cả hai (Nội trú & Bán trú)"
                        ? campusBoardingType === "BOTH"
                        : true
            : true;
        const curriculumList = Array.isArray(s?.curriculumList) ? s.curriculumList : [];
        const hasCurriculumType = curriculumList.some((curriculum) => {
            const curriculumType = String(curriculum?.curriculumType || "").trim().toUpperCase();
            return curriculumType === selectedCurriculumType;
        });
        const matchCurriculumType = selectedCurriculumType ? hasCurriculumType : true;
        const schoolFeeMin = Number(s?.tuitionFeeMin);
        const schoolFeeMax = Number(s?.tuitionFeeMax);
        const normalizedFeeMin = Number.isFinite(schoolFeeMin) && schoolFeeMin > 0 ? schoolFeeMin : schoolFeeMax;
        const normalizedFeeMax = Number.isFinite(schoolFeeMax) && schoolFeeMax > 0 ? schoolFeeMax : schoolFeeMin;
        const hasFee =
            Number.isFinite(normalizedFeeMin) &&
            normalizedFeeMin > 0 &&
            Number.isFinite(normalizedFeeMax) &&
            normalizedFeeMax > 0;
        const matchTuition = isTuitionFilterActive && tuitionBounds.max > 0
            ? hasFee && normalizedFeeMin <= tuitionRange[1] && normalizedFeeMax >= tuitionRange[0]
            : true;
        return matchProvince && matchWard && matchKeyword && matchBoardingType && matchCurriculumType && matchTuition;
    });
    const shownSchools = filteredSchools.slice(0, 20);
    const totalCount = filteredSchools.length;
    const paginationCount = Math.max(1, Math.ceil(totalCount / 20));
    const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY ?? "";

    const detailRouteActive = location.pathname === SEARCH_SCHOOLS_DETAIL_PATH;
    const detailSchoolNameRaw = React.useMemo(() => {
        const p = new URLSearchParams(location.search);
        return p.get("school");
    }, [location.search]);
    const detailKeyRaw = React.useMemo(() => {
        const p = new URLSearchParams(location.search);
        return p.get("detail");
    }, [location.search]);

    const detailSchool = React.useMemo(() => {
        if (!detailRouteActive) return null;
        if (detailSchoolNameRaw) {
            const normalizedName = detailSchoolNameRaw.trim().toLowerCase();
            const byName = schools.find(
                (s) => getSchoolUrlName(s).toLowerCase() === normalizedName
            );
            if (byName) return byName;
        }
        if (!detailKeyRaw) return null;
        return schools.find((s) => getSchoolStorageKey(s) === detailKeyRaw) ?? null;
    }, [detailKeyRaw, detailRouteActive, detailSchoolNameRaw, schools]);

    React.useEffect(() => {
        if (isParent) return;
        const p = new URLSearchParams(location.search);
        if (p.get("batchAdmission") !== "1") return;
        p.delete("batchAdmission");
        try {
            sessionStorage.removeItem(BATCH_ADMISSION_SCHOOL_IDS_KEY);
        } catch {
        }
        const qs = p.toString();
        navigate({pathname: location.pathname, search: qs ? `?${qs}` : ""}, {replace: true});
    }, [isParent, location.pathname, location.search, navigate]);

    React.useEffect(() => {
        if (!isParent || !detailRouteActive || !detailKeyRaw || listLoading) return;
        const keyTrim = String(detailKeyRaw).trim();
        if (!keyTrim.startsWith("id:")) return;
        if (schools.some((s) => getSchoolStorageKey(s) === keyTrim)) return;
        const idNum = Number(keyTrim.slice(3));
        if (!Number.isFinite(idNum) || idNum <= 0) return;
        let cancelled = false;
        (async () => {
            try {
                const detailBody = await getPublicSchoolDetail(idNum);
                if (cancelled || !detailBody) return;
                const mapped = mapPublicSchoolDetailToRow(detailBody);
                if (!mapped) return;
                setSchools((prev) => {
                    if (prev.some((s) => getSchoolStorageKey(s) === keyTrim)) return prev;
                    const favId = favouriteIdBySchool[idNum];
                    return [
                        {
                            ...mapped,
                            isFavourite: Boolean(favId || mapped.isFavourite),
                        },
                        ...prev,
                    ];
                });
            } catch {
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isParent, detailRouteActive, detailKeyRaw, listLoading, schools, favouriteIdBySchool]);

    const advanceBatchAdmissionAfterSubmit = React.useCallback(() => {
        if (!isParent) return;
        const p = new URLSearchParams(location.search);
        if (p.get("batchAdmission") !== "1") return;
        let ids = [];
        try {
            const raw = sessionStorage.getItem(BATCH_ADMISSION_SCHOOL_IDS_KEY);
            ids = JSON.parse(raw || "[]");
        } catch {
            ids = [];
        }
        if (!Array.isArray(ids)) ids = [];
        const currentId = Number(detailSchool?.id);
        const rest = ids.filter((id) => Number(id) !== currentId);
        if (rest.length === 0) {
            try {
                sessionStorage.removeItem(BATCH_ADMISSION_SCHOOL_IDS_KEY);
            } catch {
            }
            showSuccessSnackbar("Đã hoàn tất nộp hồ sơ cho các trường đã chọn.");
            navigate(SEARCH_SCHOOLS_LIST_PATH, {replace: true});
            return;
        }
        try {
            sessionStorage.setItem(BATCH_ADMISSION_SCHOOL_IDS_KEY, JSON.stringify(rest));
        } catch {
        }
        const nextId = Number(rest[0]);
        if (!Number.isFinite(nextId) || nextId <= 0) {
            try {
                sessionStorage.removeItem(BATCH_ADMISSION_SCHOOL_IDS_KEY);
            } catch {
            }
            p.delete("batchAdmission");
            navigate(
                {pathname: SEARCH_SCHOOLS_DETAIL_PATH, search: p.toString() ? `?${p.toString()}` : ""},
                {replace: true}
            );
            return;
        }
        navigate(
            {
                pathname: SEARCH_SCHOOLS_DETAIL_PATH,
                search: `?detail=${encodeURIComponent(`id:${nextId}`)}&batchAdmission=1`,
            },
            {replace: true}
        );
    }, [isParent, detailSchool?.id, location.search, navigate]);

    React.useEffect(() => {
        if (!detailSchool?.id || detailSchool?.hasDetailLoaded) {
            setDetailError(null);
            setDetailLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            setDetailLoading(true);
            setDetailError(null);
            try {
                const detailBody = await getPublicSchoolDetail(detailSchool.id);
                if (cancelled || !detailBody) return;
                const mapped = mapPublicSchoolDetailToRow(detailBody);
                if (!mapped) return;
                setSchools((prev) =>
                    prev.map((item) =>
                        item?.id === mapped.id
                            ? {
                                ...item,
                                ...mapped
                            }
                            : item
                    )
                );
            } catch (e) {
                if (!cancelled) {
                    const msg =
                        e?.response?.data?.message ||
                        e?.message ||
                        "Không tải được chi tiết trường.";
                    setDetailError(msg);
                }
            } finally {
                if (!cancelled) setDetailLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [detailSchool?.id, detailSchool?.hasDetailLoaded]);

    const openSchoolDetail = React.useCallback(
        (school) => {
            const key = getSchoolStorageKey(school);
            const schoolUrlName = getSchoolUrlName(school);
            const next = new URLSearchParams(location.search);
            if (schoolUrlName) {
                next.set("school", schoolUrlName);
            }
            next.set("detail", key);
            next.delete("consult");
            const qs = next.toString();
            const url = `${SEARCH_SCHOOLS_DETAIL_PATH}${qs ? `?${qs}` : ""}`;
            if (isParent) {
                window.location.assign(url);
                return;
            }
            navigate({pathname: SEARCH_SCHOOLS_DETAIL_PATH, search: qs ? `?${qs}` : ""}, {replace: false});
        },
        [isParent, location.search, navigate]
    );

    const closeSchoolDetail = React.useCallback(() => {
        const next = new URLSearchParams(location.search);
        next.delete("school");
        next.delete("detail");
        next.delete("consult");
        const qs = next.toString();
        const url = `${SEARCH_SCHOOLS_LIST_PATH}${qs ? `?${qs}` : ""}`;
        if (isParent) {
            window.location.replace(url);
            return;
        }
        navigate({pathname: SEARCH_SCHOOLS_LIST_PATH, search: qs ? `?${qs}` : ""}, {replace: true});
    }, [isParent, location.search, navigate]);

    React.useEffect(() => {
        if (detailRouteActive) return;
        const next = new URLSearchParams(location.search);
        const hasDetailParams = next.has("school") || next.has("detail") || next.has("consult");
        if (!hasDetailParams) return;
        next.delete("school");
        next.delete("detail");
        next.delete("consult");
        const qs = next.toString();
        navigate({pathname: SEARCH_SCHOOLS_LIST_PATH, search: qs ? `?${qs}` : ""}, {replace: true});
    }, [detailRouteActive, location.search, navigate]);

    React.useEffect(() => {
        if (!listLoading && detailRouteActive && !detailSchool) {
            const next = new URLSearchParams(location.search);
            next.delete("school");
            next.delete("detail");
            next.delete("consult");
            const qs = next.toString();
            const url = `${SEARCH_SCHOOLS_LIST_PATH}${qs ? `?${qs}` : ""}`;
            if (isParent) {
                window.location.replace(url);
                return;
            }
            navigate({pathname: SEARCH_SCHOOLS_LIST_PATH, search: qs ? `?${qs}` : ""}, {replace: true});
        }
    }, [detailRouteActive, detailSchool, isParent, listLoading, location.search, navigate]);

    React.useEffect(() => {
        if (detailSchool) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        }
        return undefined;
    }, [detailSchool]);

    const syncFavouriteLookup = React.useCallback(async () => {
        if (!isParent) {
            setFavouriteIdBySchool({});
            return {};
        }
        try {
            const res = await getParentFavouriteSchools(0, FAVOURITE_SYNC_PAGE_SIZE);
            const items = parseFavouriteListPayload(res);
            const nextMap = buildFavouriteIdBySchool(items);
            setFavouriteIdBySchool(nextMap);
            return nextMap;
        } catch {
            return null;
        }
    }, [isParent]);

    React.useEffect(() => {
        if (!isParent) {
            setFavouriteIdBySchool({});
            return;
        }
        void syncFavouriteLookup();
    }, [isParent, userIdentity, syncFavouriteLookup]);

    const toggleSave = async (schoolRecord) => {
        if (!isParent || !userInfo) {
            showWarningSnackbar("Bạn phải đăng nhập với vai trò Phụ huynh để yêu thích trường.");
            return;
        }
        const rawId =
            schoolRecord?.schoolId ??
            schoolRecord?.id ??
            (String(schoolRecord?.schoolKey || "").startsWith("id:")
                ? String(schoolRecord.schoolKey).slice(3)
                : null);
        const schoolId = Number(rawId);
        if (!Number.isFinite(schoolId)) {
            showWarningSnackbar("Không xác định được trường để cập nhật yêu thích.");
            return;
        }
        let favouriteId = Number(favouriteIdBySchool[schoolId]);
        const exists = Boolean(
            (Number(detailSchool?.id) === schoolId ? detailSchool?.isFavourite : undefined) ??
                schools.find((s) => Number(s?.id) === schoolId)?.isFavourite ??
                schoolRecord?.isFavourite ??
                Number.isFinite(favouriteId)
        );
        try {
            if (exists) {
                if (!Number.isFinite(favouriteId)) {
                    const refreshed = await syncFavouriteLookup();
                    favouriteId = Number(refreshed?.[schoolId]);
                }
                if (!Number.isFinite(favouriteId)) {
                    showWarningSnackbar("Không tìm thấy id yêu thích để bỏ yêu thích.");
                    return;
                }
                await deleteParentFavouriteSchool(favouriteId);
            } else {
                await postParentFavouriteSchool({schoolId});
            }
        } catch (e) {
            const msg =
                e?.response?.data?.message ||
                e?.message ||
                "Không thể cập nhật trạng thái yêu thích trường lúc này. Vui lòng thử lại.";
            showWarningSnackbar(msg);
            return;
        }
        setSchools((prev) =>
            prev.map((item) =>
                Number(item?.id) === schoolId
                    ? {
                        ...item,
                        isFavourite: !exists
                    }
                    : item
            )
        );
        await syncFavouriteLookup();
        showSuccessSnackbar(exists ? "Đã bỏ trường khỏi Trường yêu thích." : "Đã thêm trường vào Trường yêu thích.");
    };

    const toggleCompare = (schoolRecord) => {
        const schoolKey = getSchoolStorageKey(schoolRecord);
        const current = getCompareSchools(userInfo);
        const exists = current.some((x) => x?.schoolKey === schoolKey);
        let next;
        if (exists) {
            next = current.filter((x) => x?.schoolKey !== schoolKey);
        } else {
            if (current.length >= MAX_COMPARE_SCHOOLS) {
                showWarningSnackbar(`Chỉ được chọn tối đa ${MAX_COMPARE_SCHOOLS} trường để so sánh.`);
                return;
            }
            next = [
                ...current,
                {
                    schoolKey,
                    schoolName: schoolRecord.school,
                    province: schoolRecord.province,
                    ward: schoolRecord.ward,
                    locationLabel: schoolRecord.locationLabel,
                    gradeLevel: schoolRecord.gradeLevel,
                    schoolType: schoolRecord.schoolType
                }
            ];
        }
        setCompareSchools(userInfo, next);
        setCompareSchoolKeys(new Set(next.map((x) => x?.schoolKey).filter(Boolean)));
        showSuccessSnackbar(exists ? "Đã gỡ trường khỏi so sánh." : "Đã thêm vào danh sách so sánh.");
    };

    const compareCount = compareSchoolKeys.size;

    const batchPageSchoolIds = React.useMemo(
        () => shownSchools.map((s) => getBatchRowSchoolId(s)).filter((id) => id != null),
        [shownSchools]
    );

    const [batchAdmissionPickerOpen, setBatchAdmissionPickerOpen] = React.useState(false);
    const [batchAdmissionPickerLoading, setBatchAdmissionPickerLoading] = React.useState(false);
    const [batchAdmissionPickerOptions, setBatchAdmissionPickerOptions] = React.useState([]);
    const [batchAdmissionPickerProfileId, setBatchAdmissionPickerProfileId] = React.useState(null);
    const [batchAdmissionPickerError, setBatchAdmissionPickerError] = React.useState("");

    const availabilityCatalogRef = React.useRef([]);
    const availabilityModalSeqRef = React.useRef(0);

    const [availabilityDialogOpen, setAvailabilityDialogOpen] = React.useState(false);
    const [availabilityPendingSchoolIds, setAvailabilityPendingSchoolIds] = React.useState([]);
    const [availabilityStudentProfileId, setAvailabilityStudentProfileId] = React.useState(null);
    const [availabilityStudentDisplayName, setAvailabilityStudentDisplayName] = React.useState("");
    const [availabilityCheckLoading, setAvailabilityCheckLoading] = React.useState(false);
    const [availabilityError, setAvailabilityError] = React.useState("");
    const [availabilityResult, setAvailabilityResult] = React.useState({
        unavailable: [],
        available: [],
        message: ""
    });
    const [availabilityTemplateDocs, setAvailabilityTemplateDocs] = React.useState([]);
    const [availabilityTemplateError, setAvailabilityTemplateError] = React.useState("");
    const [availabilitySubmitting, setAvailabilitySubmitting] = React.useState(false);
    const [availabilityStudentSummary, setAvailabilityStudentSummary] = React.useState(null);
    const [availabilityImagePreview, setAvailabilityImagePreview] = React.useState(null);

    const closeStudentPickerForAdmission = React.useCallback(() => {
        setBatchAdmissionPickerOpen(false);
        setBatchAdmissionPickerLoading(false);
        setBatchAdmissionPickerOptions([]);
        setBatchAdmissionPickerProfileId(null);
        setBatchAdmissionPickerError("");
    }, []);

    const closeAdmissionAvailabilityDialog = React.useCallback(() => {
        availabilityModalSeqRef.current += 1;
        setAvailabilityDialogOpen(false);
        setAvailabilityPendingSchoolIds([]);
        setAvailabilityStudentProfileId(null);
        setAvailabilityStudentDisplayName("");
        setAvailabilityCheckLoading(false);
        setAvailabilitySubmitting(false);
        setAvailabilityError("");
        setAvailabilityTemplateError("");
        setAvailabilityResult({unavailable: [], available: [], message: ""});
        setAvailabilityTemplateDocs([]);
        setAvailabilityStudentSummary(null);
        setAvailabilityImagePreview(null);
    }, []);

    const handleBatchSubmitFromSearchList = React.useCallback(() => {
        if (!isParent) {
            showWarningSnackbar("Bạn cần đăng nhập với vai trò Phụ huynh.");
            return;
        }
        if (batchPageSchoolIds.length === 0) {
            showWarningSnackbar("Trang này không có trường nào để nộp hồ sơ.");
            return;
        }
        setBatchAdmissionPickerProfileId(null);
        setBatchAdmissionPickerOptions([]);
        setBatchAdmissionPickerError("");
        setBatchAdmissionPickerOpen(true);
    }, [batchPageSchoolIds, isParent]);

    const confirmStudentPickerForAdmission = React.useCallback(() => {
        if (batchAdmissionPickerProfileId == null) {
            showWarningSnackbar("Vui lòng chọn hồ sơ học sinh.");
            return;
        }
        const opt = batchAdmissionPickerOptions.find((o) => o.id === batchAdmissionPickerProfileId);
        setAvailabilityStudentProfileId(batchAdmissionPickerProfileId);
        setAvailabilityStudentDisplayName(String(opt?.name || "").trim() || "Học sinh");
        setAvailabilityStudentSummary(mapStudentProfileForAvailabilitySummary(opt?.raw));
        setAvailabilityPendingSchoolIds([...batchPageSchoolIds]);
        setAvailabilityResult({unavailable: [], available: [], message: ""});
        setAvailabilityError("");
        setAvailabilityTemplateError("");
        setAvailabilityTemplateDocs([]);
        setBatchAdmissionPickerOpen(false);
        setAvailabilityDialogOpen(true);
    }, [batchAdmissionPickerOptions, batchAdmissionPickerProfileId, batchPageSchoolIds]);

    React.useEffect(() => {
        if (!batchAdmissionPickerOpen) return undefined;
        let cancelled = false;
        setBatchAdmissionPickerLoading(true);
        setBatchAdmissionPickerError("");
        (async () => {
            try {
                const res = await getParentStudent();
                if (cancelled) return;
                const raw = extractParentStudentRecordsFromResponse(res);
                const options = raw
                    .map((r) => {
                        const id = pickStudentProfileIdFromRecord(r);
                        if (id == null) return null;
                        return {id, name: pickStudentDisplayNameForSelect(r), raw: r};
                    })
                    .filter(Boolean);
                setBatchAdmissionPickerOptions(options);
                if (options.length === 0) {
                    setBatchAdmissionPickerProfileId(null);
                    setBatchAdmissionPickerError("Bạn chưa có hồ sơ học sinh nào. Vui lòng thêm hồ sơ trước khi nộp.");
                } else {
                    setBatchAdmissionPickerProfileId(options[0].id);
                }
            } catch (e) {
                if (cancelled) return;
                setBatchAdmissionPickerOptions([]);
                setBatchAdmissionPickerProfileId(null);
                setBatchAdmissionPickerError(
                    e?.response?.data?.message || e?.message || "Không tải được danh sách hồ sơ học sinh."
                );
            } finally {
                if (!cancelled) setBatchAdmissionPickerLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [batchAdmissionPickerOpen]);

    const loadAvailabilityCatalogOnce = React.useCallback(async () => {
        if (availabilityCatalogRef.current.length > 0) return availabilityCatalogRef.current;
        const res = await getParentAdmissionDocuments();
        const {required, optional} = pickAdmissionDocumentsFromResponse(res);
        const initial = buildInitialDocsState(required, optional);
        availabilityCatalogRef.current = cloneEmptyCatalogDocs(initial);
        return availabilityCatalogRef.current;
    }, []);

    const fetchAvailabilityModalData = React.useCallback(async () => {
        const sid = Number(availabilityStudentProfileId);
        if (!Number.isFinite(sid) || sid <= 0) return;
        if (availabilityPendingSchoolIds.length === 0) return;

        const seq = ++availabilityModalSeqRef.current;
        setAvailabilityCheckLoading(true);
        setAvailabilityError("");
        setAvailabilityTemplateError("");
        setAvailabilityResult({unavailable: [], available: [], message: ""});
        setAvailabilityTemplateDocs([]);

        try {
            const catalog = await loadAvailabilityCatalogOnce();
            if (seq !== availabilityModalSeqRef.current) return;

            const [templateSettled, availabilitySettled, studentSettled] = await Promise.allSettled([
                getParentAdmissionReservationFormTemplate(sid),
                putParentAdmissionSchoolsAvailability(sid, availabilityPendingSchoolIds),
                getParentStudentById(sid),
            ]);
            if (seq !== availabilityModalSeqRef.current) return;

            if (studentSettled.status === "fulfilled") {
                const studentBody = pickStudentDetailBodyFromResponse(studentSettled.value);
                setAvailabilityStudentSummary(mapStudentProfileForAvailabilitySummary(studentBody));
            }

            if (availabilitySettled.status === "fulfilled") {
                setAvailabilityResult(
                    pickAdmissionSchoolsAvailabilityFromResponse(availabilitySettled.value),
                );
            } else {
                setAvailabilityResult({unavailable: [], available: [], message: ""});
                const availErr = availabilitySettled.reason;
                setAvailabilityError(
                    availErr?.response?.data?.message ||
                        availErr?.message ||
                        "Không kiểm tra được trạng thái trường.",
                );
            }

            if (templateSettled.status === "fulfilled") {
                const body = pickReservationTemplateBodyFromResponse(templateSettled.value);
                const bodySid = pickStudentProfileIdFromTemplateBody(body);
                if (bodySid != null && bodySid !== sid) {
                    setAvailabilityTemplateDocs(cloneEmptyCatalogDocs(catalog));
                    setAvailabilityTemplateError(
                        "Không tải được hồ sơ giữ chỗ của học sinh này. Vui lòng lưu hồ sơ tại trang Hồ sơ giữ chỗ.",
                    );
                } else {
                    const applied = applyReservationTemplateToDocs(catalog, body, sid);
                    setAvailabilityTemplateDocs(applied);
                    if (!hasSavedReservationTemplateForStudent(body, sid)) {
                        setAvailabilityTemplateError(
                            "Học sinh chưa có hồ sơ giữ chỗ. Vui lòng hoàn thành tại trang Hồ sơ giữ chỗ trước khi nộp.",
                        );
                    }
                }
            } else {
                const templateErr = templateSettled.reason;
                setAvailabilityTemplateDocs(cloneEmptyCatalogDocs(catalog));
                if (templateErr?.response?.status === 404) {
                    setAvailabilityTemplateError(
                        "Học sinh chưa có hồ sơ giữ chỗ. Vui lòng hoàn thành tại trang Hồ sơ giữ chỗ trước khi nộp.",
                    );
                } else {
                    setAvailabilityTemplateError(
                        templateErr?.response?.data?.message ||
                            templateErr?.message ||
                            "Không tải được hồ sơ giữ chỗ.",
                    );
                }
            }
        } catch (e) {
            if (seq !== availabilityModalSeqRef.current) return;
            setAvailabilityError(
                e?.response?.data?.message || e?.message || "Không tải được dữ liệu kiểm tra hồ sơ.",
            );
        } finally {
            if (seq === availabilityModalSeqRef.current) {
                setAvailabilityCheckLoading(false);
            }
        }
    }, [availabilityStudentProfileId, availabilityPendingSchoolIds, loadAvailabilityCatalogOnce]);

    React.useEffect(() => {
        if (!availabilityDialogOpen) return undefined;
        if (availabilityStudentProfileId == null || availabilityPendingSchoolIds.length === 0) {
            return undefined;
        }
        fetchAvailabilityModalData();
        return () => {
            availabilityModalSeqRef.current += 1;
        };
    }, [
        availabilityDialogOpen,
        availabilityStudentProfileId,
        availabilityPendingSchoolIds,
        fetchAvailabilityModalData,
    ]);

    const availabilityUnavailableRows = React.useMemo(() => {
        const groups = Array.isArray(availabilityResult.unavailable) ? availabilityResult.unavailable : [];
        const out = [];
        for (const g of groups) {
            if (Array.isArray(g?.schools)) {
                const reason = String(g?.reason || "").trim() || "Không đủ điều kiện.";
                for (const s of g.schools) {
                    out.push({
                        key: `${reason}-${s?.schoolId ?? s?.schoolName}`,
                        schoolId: s?.schoolId,
                        schoolName: String(s?.schoolName || "").trim() || `Trường #${s?.schoolId ?? "—"}`,
                        reason,
                    });
                }
            } else if (g?.schoolId != null || g?.schoolName) {
                out.push({
                    key: `u-${g?.schoolId ?? g?.schoolName}`,
                    schoolId: g.schoolId,
                    schoolName: String(g.schoolName || "").trim() || `Trường #${g.schoolId ?? "—"}`,
                    reason: String(g.reason || g.message || "").trim() || "Không đủ điều kiện.",
                });
            }
        }
        return out;
    }, [availabilityResult.unavailable]);

    const availabilityOrderedDisplayRows = React.useMemo(() => {
        if (!availabilityDialogOpen || availabilityStudentProfileId == null) return [];
        if (availabilityCheckLoading || availabilityError) return [];
        const availableList = Array.isArray(availabilityResult.available) ? availabilityResult.available : [];
        const availableById = new Map();
        for (const a of availableList) {
            const id = Number(a?.schoolId);
            if (Number.isFinite(id)) availableById.set(id, a);
        }
        const unavailableById = new Map();
        for (const row of availabilityUnavailableRows) {
            const id = Number(row?.schoolId);
            if (Number.isFinite(id)) unavailableById.set(id, row);
        }
        return availabilityPendingSchoolIds
            .map((rawId) => {
                const id = Number(rawId);
                if (!Number.isFinite(id)) return null;
                if (availableById.has(id)) {
                    const a = availableById.get(id);
                    return {
                        kind: "available",
                        key: `a-${id}`,
                        schoolId: id,
                        schoolName: String(a?.schoolName || "").trim() || `Trường #${id}`,
                    };
                }
                if (unavailableById.has(id)) {
                    const u = unavailableById.get(id);
                    return {
                        kind: "unavailable",
                        key: `u-${id}`,
                        schoolId: id,
                        schoolName: u.schoolName,
                        reason: u.reason,
                    };
                }
                const school = schools.find((s) => Number(s?.id) === id);
                const schoolName = String(getSchoolUrlName(school) || "").trim() || `Trường #${id}`;
                return {
                    kind: "invalid",
                    key: `i-${id}`,
                    schoolId: id,
                    schoolName,
                    reason: "Hệ thống không trả về trạng thái kiểm tra cho trường này.",
                };
            })
            .filter(Boolean);
    }, [
        availabilityDialogOpen,
        availabilityStudentProfileId,
        availabilityCheckLoading,
        availabilityError,
        availabilityPendingSchoolIds,
        availabilityResult.available,
        availabilityUnavailableRows,
        schools,
    ]);

    const orderedAvailableAdmissionIds = React.useMemo(() => {
        const availableIds = new Set(
            (Array.isArray(availabilityResult.available) ? availabilityResult.available : [])
                .map((a) => Number(a?.schoolId))
                .filter((id) => Number.isFinite(id) && id > 0),
        );
        return availabilityPendingSchoolIds.filter((id) => availableIds.has(Number(id)));
    }, [availabilityPendingSchoolIds, availabilityResult.available]);

    const handleConfirmAdmissionAfterAvailability = React.useCallback(async () => {
        const sid = Number(availabilityStudentProfileId);
        if (!Number.isFinite(sid) || sid <= 0) {
            showWarningSnackbar("Vui lòng chọn hồ sơ học sinh.");
            return;
        }
        if (orderedAvailableAdmissionIds.length === 0) {
            showWarningSnackbar("Không có trường nào đủ điều kiện để nộp hồ sơ.");
            return;
        }
        if (availabilityTemplateError) {
            showWarningSnackbar(availabilityTemplateError);
            return;
        }
        const submissionDocuments = buildSubmissionDocumentsPayload(availabilityTemplateDocs);
        if (submissionDocuments.length === 0) {
            showWarningSnackbar(
                "Hồ sơ giữ chỗ chưa có minh chứng. Vui lòng lưu hồ sơ tại trang Hồ sơ giữ chỗ.",
            );
            return;
        }

        setAvailabilitySubmitting(true);
        try {
            const res = await postParentAdmissionReservationForm({
                studentProfileId: sid,
                schoolIds: orderedAvailableAdmissionIds,
                submissionDocuments,
            });
            showSuccessSnackbar(
                res?.data?.message || "Nộp hồ sơ vào trường thành công.",
            );
            closeAdmissionAvailabilityDialog();
            navigate(PARENT_ADMISSION_RESERVATIONS_PATH);
        } catch (e) {
            console.error("[SchoolSearchPage] submit admission form:", e);
            showErrorSnackbar(
                e?.response?.data?.message || e?.message || "Nộp hồ sơ thất bại, vui lòng thử lại.",
            );
        } finally {
            setAvailabilitySubmitting(false);
        }
    }, [
        availabilityStudentProfileId,
        availabilityTemplateDocs,
        availabilityTemplateError,
        closeAdmissionAvailabilityDialog,
        navigate,
        orderedAvailableAdmissionIds,
    ]);

    const detailKeyForActions = detailSchool ? getSchoolStorageKey(detailSchool) : "";
    const detailIsSaved = Boolean(detailSchool?.isFavourite);
    const detailInCompare = Boolean(detailSchool && compareSchoolKeys.has(detailKeyForActions));

    return (
        <Box
            sx={{
                pt: {xs: 'calc(72px + 8px)', md: 'calc(80px + 12px)'},
                minHeight: '100vh',
                background: HOME_PAGE_SURFACE_GRADIENT,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: {xs: 280, md: 420},
                    height: {xs: 280, md: 420},
                    borderRadius: '50%',
                    top: '-8%',
                    right: '-10%',
                    background:
                        'radial-gradient(circle, rgba(85,179,217,0.26) 0%, rgba(168,224,240,0.12) 42%, transparent 68%)',
                    pointerEvents: 'none'
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: {xs: 220, md: 320},
                    height: {xs: 220, md: 320},
                    borderRadius: '50%',
                    bottom: '12%',
                    left: '-6%',
                    background:
                        'radial-gradient(circle, rgba(136,232,242,0.22) 0%, rgba(214,244,252,0.14) 45%, transparent 72%)',
                    pointerEvents: 'none'
                }
            }}
        >
            <Container maxWidth={false} sx={{maxWidth: '1400px', px: {xs: 2, md: 4}, pt: 1, pb: 6, position: 'relative', zIndex: 1}}>
    

                <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: 'minmax(0, 3fr) minmax(0, 7fr)'}, gap: 3}}>
                    <Card
                        sx={{
                            p: 0,
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '1px solid rgba(203,213,225,0.95)',
                            bgcolor: '#fff',
                            boxShadow: '0 10px 40px rgba(15,23,42,0.07), 0 2px 8px rgba(15,23,42,0.04)',
                            height: 'fit-content',
                            position: {md: 'sticky'},
                            top: {md: 96}
                        }}
                    >
                        <Box
                            sx={{
                                px: 2,
                                py: 1.35,
                                bgcolor: BRAND_NAVY,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.1
                            }}
                        >
                            <TuneIcon sx={{fontSize: 22, color: '#fff'}}/>
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    color: '#fff',
                                    fontSize: '1.02rem',
                                    letterSpacing: '0.02em'
                                }}
                            >
                                Bộ lọc tìm trường
                            </Typography>
                        </Box>
                        <Stack spacing={2} sx={{p: 2, pt: 2}}>
                            <Box>
                                <Typography sx={{fontWeight: 700, fontSize: 13, mb: 1, color: BRAND_NAVY, letterSpacing: '0.02em'}}>Tỉnh, Thành phố</Typography>
                                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                    <Chip
                                        label="Tất cả"
                                        size="small"
                                        onClick={() => setSelectedProvince("")}
                                        sx={filterChipSx(!selectedProvince)}
                                    />
                                    {provinces.map((province) => (
                                        <Chip
                                            key={province}
                                            label={province}
                                            size="small"
                                            onClick={() => toggleSingleSelection(province, setSelectedProvince)}
                                            sx={filterChipSx(selectedProvince === province)}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            <Divider sx={{borderColor: 'rgba(226,232,240,0.95)'}}/>
                            <Box>
                                <Typography sx={{fontWeight: 700, fontSize: 13, mb: 1, color: BRAND_NAVY, letterSpacing: '0.02em'}}>Phường</Typography>
                                <TextField
                                    select
                                    size="small"
                                    value={selectedDistrict}
                                    onChange={(e) => setSelectedDistrict(e.target.value)}
                                    sx={{
                                        bgcolor: 'white',
                                        borderRadius: 999,
                                        width: '100%',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 999,
                                            height: 36,
                                            transition: 'all 0.32s cubic-bezier(0.2, 0, 0, 1)',
                                            bgcolor: 'rgba(255,255,255,0.9)',
                                            '& fieldset': {borderColor: 'rgba(59,130,246,0.22)'},
                                            '&:hover fieldset': {borderColor: 'rgba(59,130,246,0.4)'},
                                            '&.Mui-focused fieldset': {borderColor: BRAND_NAVY, borderWidth: 2}
                                        },
                                        '& .MuiSelect-select': {
                                            pl: 2,
                                            py: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontWeight: 600,
                                            color: '#1e293b'
                                        },
                                        '& .MuiSelect-icon': {
                                            color: '#64748b',
                                            top: 'calc(50% - 9px)'
                                        }
                                    }}
                                    SelectProps={{
                                        displayEmpty: true,
                                        MenuProps: {
                                            PaperProps: {
                                                sx: {
                                                    borderRadius: 2,
                                                    mt: 1,
                                                    maxHeight: 360,
                                                    overflow: 'auto',
                                                    width: 'min(260px, 100%)',
                                                    maxWidth: 260,
                                                    '& .MuiMenuItem-root': {
                                                        py: 1,
                                                        px: 1.5,
                                                        fontSize: 13,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }
                                                }
                                            },
                                            MenuListProps: {
                                                sx: {
                                                    p: 0
                                                }
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <Typography sx={{fontSize: 13, color: '#64748b'}}>Chọn phường</Typography>
                                    </MenuItem>
                                    {availableDistricts.map((district) => (
                                        <MenuItem key={district} value={district}>
                                            {district}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                            <Divider sx={{borderColor: 'rgba(226,232,240,0.95)'}}/>
                            <Box>
                                <Typography sx={{fontWeight: 700, fontSize: 13, mb: 1, color: BRAND_NAVY, letterSpacing: '0.02em'}}>Nội trú/Bán trú</Typography>
                                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                    <Chip
                                        label="Tất cả"
                                        size="small"
                                        onClick={() => setSelectedBoardingType(null)}
                                        sx={filterChipSx(!selectedBoardingType)}
                                    />
                                    {['Nội trú', 'Bán trú', 'Cả hai (Nội trú & Bán trú)'].map((boardingType) => (
                                        <Chip
                                            key={boardingType}
                                            label={boardingType}
                                            size="small"
                                            onClick={() => toggleSingleSelection(boardingType, setSelectedBoardingType)}
                                            sx={filterChipSx(selectedBoardingType === boardingType)}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            <Divider sx={{borderColor: 'rgba(226,232,240,0.95)'}}/>
                            <Box>
                                <Typography sx={{fontWeight: 700, fontSize: 13, mb: 1, color: BRAND_NAVY, letterSpacing: '0.02em'}}>Loại khung chương trình</Typography>
                                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                    <Chip
                                        label="Tất cả"
                                        size="small"
                                        onClick={() => setSelectedCurriculumType(null)}
                                        sx={filterChipSx(!selectedCurriculumType)}
                                    />
                                    <Chip
                                        label="Quốc gia"
                                        size="small"
                                        onClick={() => toggleSingleSelection("NATIONAL", setSelectedCurriculumType)}
                                        sx={filterChipSx(selectedCurriculumType === "NATIONAL")}
                                    />
                                    <Chip
                                        label="Quốc tế"
                                        size="small"
                                        onClick={() => toggleSingleSelection("INTERNATIONAL", setSelectedCurriculumType)}
                                        sx={filterChipSx(selectedCurriculumType === "INTERNATIONAL")}
                                    />
                                </Box>
                            </Box>
                            <Divider sx={{borderColor: 'rgba(226,232,240,0.95)'}}/>
                            <Box>
                                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1}}>
                                    <Typography sx={{fontWeight: 700, fontSize: 13, color: BRAND_NAVY, letterSpacing: '0.02em'}}>
                                        Học phí (VND)
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => {
                                            setTuitionRange([tuitionBounds.min, tuitionBounds.max]);
                                            setIsTuitionFilterActive(false);
                                        }}
                                        disabled={!isTuitionFilterActive}
                                        sx={{
                                            minWidth: 'auto',
                                            textTransform: 'none',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            px: 1,
                                            py: 0.25,
                                            color: BRAND_NAVY
                                        }}
                                    >
                                        Đặt lại
                                    </Button>
                                </Box>
                                {tuitionBounds.max > 0 ? (
                                    <Box sx={{px: 3}}>
                                        <Slider
                                            value={tuitionRange}
                                            onChange={(_, value) => {
                                                if (Array.isArray(value) && value.length === 2) {
                                                    setTuitionRange([Number(value[0]), Number(value[1])]);
                                                    setIsTuitionFilterActive(true);
                                                }
                                            }}
                                            min={tuitionBounds.min}
                                            max={tuitionBounds.max}
                                            step={1_000_000}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={(value) => formatVndCompact(value)}
                                            sx={{
                                                color: BRAND_NAVY,
                                                px: 0.2,
                                                '& .MuiSlider-thumb': {width: 16, height: 16},
                                                '& .MuiSlider-rail': {opacity: 0.24}
                                            }}
                                        />
                                        <Typography sx={{fontSize: 12, color: '#475569', mt: 0.3, textAlign: 'center', fontWeight: 600}}>
                                            {formatVndCompact(tuitionRange[0])} - {formatVndCompact(tuitionRange[1])}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography sx={{fontSize: 12, color: '#64748b'}}>Chưa có dữ liệu học phí để lọc.</Typography>
                                )}
                            </Box>
                        </Stack>
                    </Card>

                    <Box>
                        <Card
                            sx={{
                                mb: 2,
                                p: 0,
                                overflow: 'hidden',
                                borderRadius: 3,
                                border: '1px solid rgba(203,213,225,0.95)',
                                bgcolor: '#fff',
                                boxShadow: '0 10px 40px rgba(15,23,42,0.07), 0 2px 8px rgba(15,23,42,0.04)'
                            }}
                        >
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1.35,
                                    bgcolor: BRAND_NAVY,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.1
                                }}
                            >
                                <SearchIcon sx={{fontSize: 22, color: '#fff'}}/>
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        color: '#fff',
                                        fontSize: '1.02rem',
                                        letterSpacing: '0.02em'
                                    }}
                                >
                                    Tìm kiếm
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    p: {xs: 1.75, sm: 2},
                                    pt: {xs: 1.75, sm: 2},
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5
                                }}
                            >
                                <TextField
                                    placeholder="Tìm kiếm trường học..."
                                    size="small"
                                    fullWidth
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        background: `linear-gradient(90deg, ${BRAND_NAVY}, ${BRAND_SKY})`,
                                                        color: '#ffffff',
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 999,
                                                        boxShadow: '0 8px 22px rgba(45, 95, 115, 0.28)',
                                                        '&:hover': {
                                                            background: `linear-gradient(90deg, ${APP_PRIMARY_DARK}, ${BRAND_NAVY})`,
                                                            boxShadow: '0 10px 28px rgba(45, 95, 115, 0.35)'
                                                        }
                                                    }}
                                                >
                                                    <SearchIcon sx={{fontSize: 18}}/>
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.92)',
                                        borderRadius: 999,
                                        width: '100%',
                                        minWidth: 0,
                                        boxShadow: landingSectionShadow(2),
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 999,
                                            pr: 0.5,
                                            '& fieldset': {
                                                border: '1px solid rgba(59,130,246,0.2)',
                                            },
                                            '&:hover fieldset': {
                                                border: '1px solid rgba(59,130,246,0.38)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                border: `2px solid ${BRAND_NAVY}`,
                                            }
                                        },
                                        '& .MuiInputBase-input': {
                                            py: 1.05,
                                            pl: 1.25,
                                            color: '#1e293b',
                                            fontSize: '0.9rem',
                                            fontWeight: 500
                                        },
                                        '& .MuiInputBase-input::placeholder': {
                                            fontSize: '0.88rem',
                                            color: '#94a3b8'
                                        },
                                    }}
                                />
                                {compareCount > 0 && (
                                    <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => navigate("/compare-schools")}
                                            sx={{
                                                textTransform: "none",
                                                fontWeight: 700,
                                                borderRadius: 999,
                                                px: 2,
                                                bgcolor: BRAND_NAVY,
                                                "&:hover": {bgcolor: APP_PRIMARY_DARK}
                                            }}
                                        >
                                            So sánh ({compareCount})
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </Card>

                        {isParent && !listLoading && shownSchools.length > 0 ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: {xs: "column", sm: "row"},
                                    alignItems: {xs: "stretch", sm: "center"},
                                    justifyContent: "flex-end",
                                    gap: 1.5,
                                    mb: 2
                                }}
                            >
                                <Button
                                    variant="contained"
                                    disabled={batchPageSchoolIds.length === 0}
                                    onClick={handleBatchSubmitFromSearchList}
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 700,
                                        borderRadius: 999,
                                        px: 2.5,
                                        py: 1,
                                        bgcolor: BRAND_NAVY,
                                        alignSelf: {xs: "stretch", sm: "center"},
                                        "&:hover": {bgcolor: APP_PRIMARY_DARK}
                                    }}
                                >
                                    Nộp hồ sơ
                                    {batchPageSchoolIds.length > 0 ? ` (${batchPageSchoolIds.length})` : ""}
                                </Button>
                            </Box>
                        ) : null}

                        {listError && (
                            <Typography sx={{color: "#b45309", fontSize: "0.95rem", mb: 2, fontWeight: 600}}>
                                {listError}
                            </Typography>
                        )}

                        {listLoading ? (
                            <Box sx={{display: "flex", justifyContent: "center", py: 6}}>
                                <CircularProgress sx={{color: BRAND_NAVY}}/>
                            </Box>
                        ) : (
                        <Stack spacing={2}>
                            {shownSchools.map((school) => {
                                const schoolKey = getSchoolStorageKey(school);
                                const isSaved = Boolean(school?.isFavourite);
                                const inCompare = compareSchoolKeys.has(schoolKey);

                                return (
                                    <Card
                                        key={school.id != null ? `school-${school.id}` : `${school.province}-${school.ward}-${school.school}`}
                                        sx={{
                                            position: "relative",
                                            display: 'grid',
                                            gridTemplateColumns: {xs: '1fr', sm: 'minmax(0, 2.6fr) minmax(0, 7.4fr)'},
                                            gap: {xs: 1.25, sm: 2},
                                            p: {xs: 1.25, sm: 1.35},
                                            borderRadius: 3,
                                            border: '1px solid rgba(203,213,225,0.95)',
                                            bgcolor: '#fff',
                                            boxShadow: '0 8px 28px rgba(15,23,42,0.06), 0 2px 10px rgba(15,23,42,0.04)',
                                            transition:
                                                'transform 0.32s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.32s cubic-bezier(0.2, 0, 0.2, 1), border-color 0.32s cubic-bezier(0.2, 0, 0.2, 1), background-color 0.32s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                bgcolor: '#fff',
                                                borderColor: 'rgba(148,163,184,0.65)',
                                                boxShadow: '0 14px 40px rgba(15,23,42,0.1), 0 4px 14px rgba(59,130,246,0.08)'
                                            }
                                        }}
                                    >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%',
                                            maxWidth: {xs: '100%', sm: 148},
                                            justifySelf: {sm: 'center'},
                                            alignSelf: 'stretch',
                                            minHeight: {xs: 128, sm: 132},
                                            py: {xs: 0.35, sm: 0.25},
                                        }}
                                    >
                                        <CardMedia
                                            component="img"
                                            image={school.logoUrl || DEFAULT_SCHOOL_IMAGE}
                                            alt={`${school.school} logo`}
                                            sx={{
                                                height: {xs: 120, sm: 120},
                                                width: {xs: '100%', sm: 120},
                                                maxWidth: '100%',
                                                borderRadius: {xs: 2.5, sm: '50%'},
                                                objectFit: 'contain',
                                                objectPosition: 'center',
                                                display: 'block',
                                                bgcolor: {sm: 'rgba(248,250,252,0.95)'},
                                                p: {sm: 0.65},
                                                m: 0
                                            }}
                                        />
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minHeight: 0,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: {xs: '1.05rem', sm: '1.2rem'},
                                                color: BRAND_NAVY,
                                                lineHeight: 1.2,
                                                mb: 0.75
                                            }}
                                        >
                                            {school.school}
                                        </Typography>
                                        {school.description ? (
                                            <Typography
                                                sx={{
                                                    mt: 0.5,
                                                    color: '#64748b',
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 400,
                                                    lineHeight: 1.45,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    wordBreak: 'break-word',
                                                    minHeight: '2.9em'
                                                }}
                                            >
                                                {String(school.description)}
                                            </Typography>
                                        ) : null}
                                        <Box
                                            sx={{
                                                mt: 0.75,
                                                display: 'flex',
                                                flexDirection: {xs: 'column', sm: 'row'},
                                                flexWrap: {sm: 'wrap'},
                                                alignItems: {sm: 'flex-start'},
                                                justifyContent: 'flex-start',
                                                width: '100%',
                                                gap: {xs: 0.65, sm: 3},
                                                alignSelf: 'stretch'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 0.35,
                                                    flexShrink: {sm: 1},
                                                    minWidth: 0,
                                                    maxWidth: {sm: 280},
                                                    width: {xs: '100%', sm: 'auto'}
                                                }}
                                            >
                                                <LocationOnIcon sx={{fontSize: 13, color: '#000', flexShrink: 0, mt: '2px'}}/>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 400,
                                                        lineHeight: 1.35,
                                                        color: '#0f172a',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        wordBreak: 'break-word',
                                                        minWidth: 0
                                                    }}
                                                >
                                                    {school.address?.trim() ? school.address : 'Đang cập nhật'}
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.35,
                                                    flexShrink: 0,
                                                    minWidth: 0,
                                                    maxWidth: {sm: 200},
                                                    width: {xs: '100%', sm: 'auto'}
                                                }}
                                            >
                                                <LanguageIcon sx={{fontSize: 13, color: '#000', flexShrink: 0}}/>
                                                {school.website ? (
                                                    <Link
                                                        href={school.website.startsWith('http') ? school.website : `https://${school.website}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        sx={{
                                                            fontSize: '0.6875rem',
                                                            color: BRAND_NAVY,
                                                            textDecoration: 'none',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: '100%',
                                                            minWidth: 0,
                                                            '&:hover': {
                                                                color: APP_PRIMARY_DARK,
                                                                textDecoration: 'underline'
                                                            }
                                                        }}
                                                    >
                                                        {school.website.replace(/^https?:\/\//i, '')}
                                                    </Link>
                                                ) : (
                                                    <Typography sx={{fontSize: '0.6875rem', color: '#0f172a'}}>—</Typography>
                                                )}
                                            </Box>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.35,
                                                    flexShrink: 0,
                                                    minWidth: 0,
                                                    width: {xs: '100%', sm: 'auto'}
                                                }}
                                            >
                                                <PhoneIcon sx={{fontSize: 13, color: '#000', flexShrink: 0}}/>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.6875rem',
                                                        color: '#0f172a',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '100%',
                                                        minWidth: 0
                                                    }}
                                                >
                                                    {school.phone || '—'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: 0.65,
                                                mt: 'auto',
                                                pt: 1
                                            }}
                                        >
                                            <ButtonBase
                                                onClick={() => toggleCompare(school)}
                                                title={inCompare ? "Gỡ khỏi so sánh" : "Thêm vào so sánh"}
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.45,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    borderRadius: 999,
                                                    py: 0.45,
                                                    px: 1,
                                                    border: '1px solid',
                                                    borderColor: inCompare ? 'rgba(59,130,246,0.45)' : 'rgba(203,213,225,0.95)',
                                                    color: inCompare ? BRAND_NAVY : '#475569',
                                                    bgcolor: inCompare ? 'rgba(59,130,246,0.12)' : 'rgba(241,245,249,0.98)',
                                                    '&:hover': {
                                                        bgcolor: inCompare ? 'rgba(59,130,246,0.18)' : 'rgba(226,232,240,0.95)',
                                                        borderColor: inCompare ? 'rgba(59,130,246,0.55)' : 'rgba(148,163,184,0.85)'
                                                    }
                                                }}
                                            >
                                                {inCompare ? (
                                                    <CheckCircleIcon sx={{fontSize: 16, color: BRAND_NAVY}}/>
                                                ) : (
                                                    <AddIcon sx={{fontSize: 16, color: '#64748b'}}/>
                                                )}
                                                So sánh
                                            </ButtonBase>
                                            <ButtonBase
                                                disabled={!canSaveSchool}
                                                onClick={() => toggleSave(school)}
                                                title={
                                                    canSaveSchool
                                                        ? isSaved
                                                            ? "Bỏ yêu thích"
                                                            : "Thêm vào yêu thích"
                                                        : "Đăng nhập với vai trò Phụ huynh để yêu thích trường"
                                                }
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.45,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    borderRadius: 999,
                                                    py: 0.45,
                                                    px: 1,
                                                    border: '1px solid',
                                                    borderColor: isSaved ? 'rgba(244,63,94,0.45)' : 'rgba(203,213,225,0.95)',
                                                    color: isSaved ? '#e11d48' : '#475569',
                                                    bgcolor: isSaved ? 'rgba(244,63,94,0.1)' : 'rgba(241,245,249,0.98)',
                                                    '&:hover': {
                                                        bgcolor: isSaved ? 'rgba(244,63,94,0.16)' : 'rgba(226,232,240,0.95)',
                                                        borderColor: isSaved ? 'rgba(244,63,94,0.55)' : 'rgba(148,163,184,0.85)'
                                                    },
                                                    '&.Mui-disabled': {opacity: 0.5}
                                                }}
                                            >
                                                {isSaved ? (
                                                    <FavoriteIcon sx={{fontSize: 16, color: '#e11d48'}}/>
                                                ) : (
                                                    <FavoriteBorderIcon sx={{fontSize: 16, color: '#64748b'}}/>
                                                )}
                                                {isSaved ? "Đã yêu thích" : "Yêu thích"}
                                            </ButtonBase>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => openSchoolDetail(school)}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    borderRadius: 999,
                                                    px: 2,
                                                    py: 0.5,
                                                    fontSize: '0.8125rem',
                                                    borderColor: 'rgba(59,130,246,0.4)',
                                                    color: BRAND_NAVY,
                                                    bgcolor: 'rgba(255,255,255,0.6)',
                                                    ml: {xs: 0, sm: 0.25},
                                                    '&:hover': {
                                                        borderColor: BRAND_NAVY,
                                                        bgcolor: 'rgba(255,255,255,0.95)'
                                                    }
                                                }}
                                            >
                                                Xem chi tiết
                                            </Button>
                                        </Box>
                                    </Box>
                                    </Card>
                                );
                            })}
                        </Stack>
                        )}

                        {!listLoading && (
                        <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
                            <Pagination
                                count={paginationCount}
                                page={1}
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        borderRadius: 2,
                                        fontWeight: 600
                                    },
                                    '& .Mui-selected': {
                                        bgcolor: `${BRAND_NAVY} !important`,
                                        color: '#fff',
                                        '&:hover': {bgcolor: `${APP_PRIMARY_DARK} !important`}
                                    }
                                }}
                            />
                        </Box>
                        )}
                    </Box>
                </Box>
            </Container>

            <Dialog
                open={batchAdmissionPickerOpen}
                onClose={closeStudentPickerForAdmission}
                fullWidth
                maxWidth="xs"
                scroll="body"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
                        maxWidth: 420,
                        boxShadow: "0 24px 48px rgba(15,23,42,0.14), 0 8px 20px rgba(15,23,42,0.06)",
                        border: "1px solid rgba(226,232,240,0.95)",
                        bgcolor: "#fff"
                    }
                }}
            >
                <Box
                    aria-hidden
                    sx={{
                        height: 4,
                        background: `linear-gradient(90deg, ${BRAND_NAVY} 0%, ${BRAND_SKY} 55%, ${BRAND_SKY_LIGHT} 100%)`
                    }}
                />
                <DialogTitle
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 2.25,
                        px: 2.5,
                        pr: 1.5,
                        background: "linear-gradient(180deg, rgba(248,250,252,0.9) 0%, #fff 100%)",
                        borderBottom: "1px solid rgba(226,232,240,0.85)"
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            bgcolor: "rgba(85,179,217,0.12)",
                            color: BRAND_NAVY,
                            border: `1px solid rgba(85,179,217,0.22)`
                        }}
                    >
                        <PersonOutlineIcon sx={{fontSize: 28}}/>
                    </Box>
                    <Box sx={{minWidth: 0}}>
                        <Typography sx={{fontWeight: 800, fontSize: "1.08rem", color: "#0f172a", lineHeight: 1.25}}>
                            Chọn hồ sơ học sinh
                        </Typography>
                        <Typography sx={{mt: 0.35, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.45}}>
                            Dùng hồ sơ này để kiểm tra các trường trên trang hiện tại.
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{px: 2.5, pt: 2.5, pb: 1}}>
                    {batchAdmissionPickerLoading ? (
                        <Box sx={{display: "flex", justifyContent: "center", py: 4}}>
                            <CircularProgress size={36} sx={{color: BRAND_NAVY}}/>
                        </Box>
                    ) : batchAdmissionPickerError ? (
                        <Alert
                            severity={
                                String(batchAdmissionPickerError).includes("Không tải được") ? "error" : "warning"
                            }
                            sx={{
                                mb: 0,
                                borderRadius: 2,
                                "& .MuiAlert-message": {width: "100%"}
                            }}
                        >
                            {batchAdmissionPickerError}
                        </Alert>
                    ) : batchAdmissionPickerOptions.length > 0 ? (
                        <FormControl fullWidth size="small">
                            <Select
                                displayEmpty
                                value={batchAdmissionPickerProfileId ?? ""}
                                onChange={(e) => setBatchAdmissionPickerProfileId(Number(e.target.value))}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: "#fff",
                                    fontWeight: 600,
                                    "& .MuiOutlinedInput-notchedOutline": {borderColor: "rgba(203,213,225,0.95)"},
                                    "&:hover .MuiOutlinedInput-notchedOutline": {borderColor: BRAND_NAVY},
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: BRAND_NAVY,
                                        borderWidth: 2
                                    }
                                }}
                            >
                                {batchAdmissionPickerOptions.map((opt) => (
                                    <MenuItem key={opt.id} value={opt.id}>
                                        {opt.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        <Typography sx={{fontSize: "0.9rem", color: "#64748b", lineHeight: 1.55}}>
                            Chưa có hồ sơ học sinh để chọn.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions
                    sx={{
                        px: 2.5,
                        py: 2,
                        gap: 1.25,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                        bgcolor: "rgba(248,250,252,0.65)",
                        borderTop: "1px solid rgba(226,232,240,0.85)"
                    }}
                >
                    <Button
                        variant="outlined"
                        onClick={closeStudentPickerForAdmission}
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2.25,
                            minHeight: 40,
                            borderColor: "rgba(203,213,225,0.95)",
                            color: "#475569",
                            "&:hover": {borderColor: "#94a3b8", bgcolor: "rgba(248,250,252,0.9)"}
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={confirmStudentPickerForAdmission}
                        disabled={
                            batchAdmissionPickerLoading ||
                            batchAdmissionPickerOptions.length === 0 ||
                            batchAdmissionPickerProfileId == null
                        }
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2.5,
                            minHeight: 40,
                            boxShadow: "0 4px 14px rgba(45,95,115,0.22)",
                            bgcolor: BRAND_NAVY,
                            "&:hover": {bgcolor: APP_PRIMARY_DARK, boxShadow: "0 6px 18px rgba(45,95,115,0.28)"},
                            "&.Mui-disabled": {bgcolor: "#e2e8f0", color: "#94a3b8", boxShadow: "none"}
                        }}
                    >
                        Tiếp tục
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={availabilityDialogOpen}
                onClose={closeAdmissionAvailabilityDialog}
                fullWidth
                maxWidth="md"
                scroll="paper"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
                        boxShadow: "0 24px 48px rgba(15,23,42,0.14), 0 8px 20px rgba(15,23,42,0.06)",
                        border: "1px solid rgba(226,232,240,0.95)",
                        bgcolor: "#fff",
                        maxHeight: "min(92vh, 720px)"
                    }
                }}
            >
                <Box
                    aria-hidden
                    sx={{
                        height: 4,
                        background: `linear-gradient(90deg, ${BRAND_NAVY} 0%, ${BRAND_SKY} 55%, ${BRAND_SKY_LIGHT} 100%)`
                    }}
                />
                <DialogTitle
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1.5,
                        py: 2,
                        px: 2.5,
                        background: "linear-gradient(180deg, rgba(248,250,252,0.9) 0%, #fff 100%)",
                        borderBottom: "1px solid rgba(226,232,240,0.85)"
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{minWidth: 0, pr: 0.5}}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                bgcolor: "rgba(85,179,217,0.12)",
                                color: BRAND_NAVY,
                                border: `1px solid rgba(85,179,217,0.22)`
                            }}
                        >
                            <FactCheckIcon sx={{fontSize: 26}}/>
                        </Box>
                        <Box sx={{minWidth: 0}}>
                            <Typography sx={{fontWeight: 800, fontSize: "1.08rem", color: "#0f172a", lineHeight: 1.25}}>
                                Kiểm tra hồ sơ nộp vào trường
                            </Typography>
                            <Typography sx={{mt: 0.35, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.45}}>
                                Hồ sơ bên trái — danh sách trường và trạng thái kiểm tra bên phải.
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton
                        aria-label="Đóng"
                        size="small"
                        onClick={closeAdmissionAvailabilityDialog}
                        sx={{
                            color: "#64748b",
                            flexShrink: 0,
                            mt: -0.25,
                            "&:hover": {bgcolor: "rgba(15,23,42,0.06)", color: "#0f172a"}
                        }}
                    >
                        <CloseIcon fontSize="small"/>
                    </IconButton>
                </DialogTitle>
                <DialogContent
                    dividers
                    sx={{
                        px: {xs: 2, sm: 2.5},
                        pt: 2.5,
                        pb: 2.5,
                        borderColor: "rgba(226,232,240,0.75)",
                        bgcolor: "#fafbfc"
                    }}
                >
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)"},
                            gap: {xs: 2.5, md: 0},
                            alignItems: "stretch",
                            minHeight: {md: 320}
                        }}
                    >
                        <Box
                            sx={{
                                minWidth: 0,
                                pr: {md: 2.5},
                                pb: {xs: 2.5, md: 0},
                                borderRight: {md: "1px solid rgba(226,232,240,0.9)"},
                                borderBottom: {xs: "1px solid rgba(226,232,240,0.9)", md: "none"}
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    letterSpacing: "0.06em",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    mb: 0.75
                                }}
                            >
                                Hồ sơ học sinh
                            </Typography>
                            <Box
                                sx={{
                                    mb: 2,
                                    px: 1.5,
                                    py: 1.25,
                                    borderRadius: 2,
                                    border: "1px solid rgba(226,232,240,0.95)",
                                    bgcolor: "#fff",
                                    boxShadow: "0 1px 0 rgba(15,23,42,0.04)",
                                    borderLeft: `4px solid ${BRAND_NAVY}`
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        lineHeight: 1.45,
                                        mb: 1.25
                                    }}
                                >
                                    {availabilityStudentDisplayName ||
                                        (availabilityStudentProfileId != null
                                            ? `Hồ sơ #${availabilityStudentProfileId}`
                                            : "—")}
                                </Typography>
                                <Stack
                                    direction={{xs: "column", sm: "row"}}
                                    spacing={{xs: 0.75, sm: 2}}
                                    sx={{mb: 1.5}}
                                >
                                    <Typography sx={{fontSize: "0.875rem", color: "#475569", lineHeight: 1.5}}>
                                        <Box component="span" sx={{fontWeight: 700, color: "#334155"}}>
                                            Giới tính:{" "}
                                        </Box>
                                        {availabilityCheckLoading && !availabilityStudentSummary
                                            ? "…"
                                            : availabilityStudentSummary?.genderLabel || "—"}
                                    </Typography>
                                    <Typography sx={{fontSize: "0.875rem", color: "#475569", lineHeight: 1.5}}>
                                        <Box component="span" sx={{fontWeight: 700, color: "#334155"}}>
                                            CCCD học sinh:{" "}
                                        </Box>
                                        {availabilityCheckLoading && !availabilityStudentSummary
                                            ? "…"
                                            : availabilityStudentSummary?.studentCode || "—"}
                                    </Typography>
                                </Stack>
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "0.72rem",
                                        letterSpacing: "0.04em",
                                        color: "#64748b",
                                        textTransform: "uppercase",
                                        mb: 0.75
                                    }}
                                >
                                    Học bạ THCS (4 năm)
                                </Typography>
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                        gap: 1
                                    }}
                                >
                                    {HOC_BA_THCS_GRADE_LABELS.map((gradeLabel, slotIndex) => {
                                        const url = availabilityStudentSummary?.transcriptSlots?.[slotIndex];
                                        const hasUrl = typeof url === "string" && url.trim() !== "";
                                        return (
                                            <Box key={`availability-transcript-${slotIndex}`}>
                                                <Typography
                                                    sx={{fontSize: "0.74rem", fontWeight: 600, color: "#64748b", mb: 0.4}}
                                                >
                                                    {gradeLabel}
                                                </Typography>
                                                {hasUrl ? (
                                                    <Box
                                                        component="button"
                                                        type="button"
                                                        onClick={() =>
                                                            setAvailabilityImagePreview({
                                                                url: url.trim(),
                                                                title: `Học bạ — ${gradeLabel}`
                                                            })
                                                        }
                                                        sx={{
                                                            display: "block",
                                                            width: "100%",
                                                            p: 0,
                                                            border: "1px solid rgba(34,197,94,0.45)",
                                                            borderRadius: 1.5,
                                                            overflow: "hidden",
                                                            cursor: "pointer",
                                                            bgcolor: "#fff",
                                                            lineHeight: 0
                                                        }}
                                                    >
                                                        <Box
                                                            component="img"
                                                            src={url.trim()}
                                                            alt={gradeLabel}
                                                            sx={{
                                                                width: "100%",
                                                                height: 88,
                                                                objectFit: "cover",
                                                                display: "block"
                                                            }}
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            px: 1,
                                                            py: 2.25,
                                                            borderRadius: 1.5,
                                                            border: "1px dashed rgba(148,163,184,0.55)",
                                                            bgcolor: "#f8fafc",
                                                            textAlign: "center"
                                                        }}
                                                    >
                                                        <Typography sx={{fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600}}>
                                                            Chưa có
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    letterSpacing: "0.06em",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    mb: 1.25
                                }}
                            >
                                Hồ sơ giữ chỗ
                            </Typography>

                            {availabilityTemplateError ? (
                                <Alert severity="warning" sx={{mb: 1.5, borderRadius: 2}}>
                                    {availabilityTemplateError}
                                </Alert>
                            ) : null}

                            <AdmissionDocumentsSection
                                docs={availabilityTemplateDocs}
                                docsLoading={availabilityCheckLoading}
                                docsError={availabilityTemplateError && !availabilityCheckLoading ? "" : ""}
                                cloudinaryReady
                                uploadingSlots={new Set()}
                                disabled
                                readOnly
                                onPickFile={() => {}}
                                onRemoveSlot={() => {}}
                                emptyMessage="Chưa có hồ sơ giữ chỗ cho học sinh này."
                            />
                        </Box>

                        <Box sx={{minWidth: 0, pl: {md: 2.5}, display: "flex", flexDirection: "column"}}>
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    letterSpacing: "0.06em",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    mb: 1.25
                                }}
                            >
                                Các trường
                            </Typography>

                            {availabilityError ? (
                                <Alert
                                    severity="error"
                                    sx={{mb: 1.5, borderRadius: 2}}
                                    onClose={() => setAvailabilityError("")}
                                >
                                    {availabilityError}
                                </Alert>
                            ) : null}

                            {availabilityCheckLoading ? (
                                <Box sx={{mb: 1.5, borderRadius: 2, overflow: "hidden"}}>
                                    <LinearProgress
                                        sx={{
                                            borderRadius: 2,
                                            height: 5,
                                            bgcolor: "rgba(85,179,217,0.15)",
                                            "& .MuiLinearProgress-bar": {bgcolor: BRAND_NAVY}
                                        }}
                                    />
                                </Box>
                            ) : null}

                            {!availabilityCheckLoading &&
                            availabilityStudentProfileId != null &&
                            !availabilityError &&
                            availabilityOrderedDisplayRows.length === 0 ? (
                                <Typography
                                    sx={{fontSize: "0.9rem", color: "#64748b", fontStyle: "italic", lineHeight: 1.55, mb: 1}}
                                >
                                    Chưa có trường nào trong kết quả kiểm tra.
                                </Typography>
                            ) : null}

                            <Stack spacing={1.5} sx={{flex: 1, overflowY: "auto", maxHeight: {md: "min(52vh, 420px)"}, pr: 0.25}}>
                                {!availabilityCheckLoading &&
                                    availabilityOrderedDisplayRows.map((row) => {
                                const rowShell = (children) => (
                                    <Box
                                        key={row.key}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: "#fff",
                                            border: "1px solid rgba(226,232,240,0.95)",
                                            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                                            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                                            "&:hover": {
                                                borderColor: "rgba(148,163,184,0.45)",
                                                boxShadow: "0 6px 16px rgba(15,23,42,0.06)"
                                            }
                                        }}
                                    >
                                        {children}
                                    </Box>
                                );
                                if (row.kind === "available") {
                                    return rowShell(
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: "auto 1fr",
                                                columnGap: 1.25,
                                                alignItems: "start"
                                            }}
                                        >
                                            <Chip
                                                label="Hợp lệ"
                                                size="small"
                                                sx={{
                                                    gridColumn: 1,
                                                    gridRow: 1,
                                                    height: 26,
                                                    fontWeight: 800,
                                                    fontSize: "0.7rem",
                                                    bgcolor: "#dcfce7",
                                                    color: "#166534",
                                                    border: "1px solid #86efac"
                                                }}
                                            />
                                            <Typography
                                                sx={{
                                                    gridColumn: 2,
                                                    gridRow: 1,
                                                    fontSize: "0.94rem",
                                                    color: "#0f172a",
                                                    fontWeight: 600,
                                                    lineHeight: 1.45,
                                                    pt: 0.15
                                                }}
                                            >
                                                {row.schoolName}
                                            </Typography>
                                        </Box>
                                    );
                                }
                                if (row.kind === "unavailable") {
                                    return rowShell(
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: "auto 1fr",
                                                columnGap: 1.25,
                                                rowGap: 0.5,
                                                alignItems: "start"
                                            }}
                                        >
                                            <Chip
                                                label="Chưa mở"
                                                size="small"
                                                sx={{
                                                    gridColumn: 1,
                                                    gridRow: 1,
                                                    height: 26,
                                                    fontWeight: 800,
                                                    fontSize: "0.7rem",
                                                    bgcolor: "#ffedd5",
                                                    color: "#9a3412",
                                                    border: "1px solid #fdba74"
                                                }}
                                            />
                                            <Typography
                                                sx={{
                                                    gridColumn: 2,
                                                    gridRow: 1,
                                                    fontSize: "0.94rem",
                                                    color: "#0f172a",
                                                    fontWeight: 600,
                                                    lineHeight: 1.45,
                                                    pt: 0.15
                                                }}
                                            >
                                                {row.schoolName}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    gridColumn: 2,
                                                    gridRow: 2,
                                                    fontSize: "0.875rem",
                                                    color: "#64748b",
                                                    lineHeight: 1.55,
                                                    whiteSpace: "pre-wrap"
                                                }}
                                            >
                                                ↳ Lý do: {row.reason}
                                            </Typography>
                                        </Box>
                                    );
                                }
                                return rowShell(
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: "auto 1fr",
                                            columnGap: 1.25,
                                            rowGap: 0.5,
                                            alignItems: "start"
                                        }}
                                    >
                                        <Chip
                                            label="Không hợp lệ"
                                            size="small"
                                            sx={{
                                                gridColumn: 1,
                                                gridRow: 1,
                                                height: 26,
                                                fontWeight: 800,
                                                fontSize: "0.7rem",
                                                bgcolor: "#fee2e2",
                                                color: "#991b1b",
                                                border: "1px solid #fecaca"
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                gridColumn: 2,
                                                gridRow: 1,
                                                fontSize: "0.94rem",
                                                color: "#0f172a",
                                                fontWeight: 600,
                                                lineHeight: 1.45,
                                                pt: 0.15
                                            }}
                                        >
                                            {row.schoolName}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                gridColumn: 2,
                                                gridRow: 2,
                                                fontSize: "0.875rem",
                                                color: "#64748b",
                                                lineHeight: 1.55,
                                                whiteSpace: "pre-wrap"
                                            }}
                                        >
                                            ↳ Lý do: {row.reason}
                                        </Typography>
                                    </Box>
                                );
                            })}
                            </Stack>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions
                    sx={{
                        px: 2.5,
                        py: 2,
                        gap: 1.25,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                        bgcolor: "rgba(248,250,252,0.65)",
                        borderTop: "1px solid rgba(226,232,240,0.85)"
                    }}
                >
                    <Button
                        variant="outlined"
                        onClick={closeAdmissionAvailabilityDialog}
                        disabled={availabilitySubmitting}
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2.25,
                            minHeight: 40,
                            borderColor: "rgba(203,213,225,0.95)",
                            color: "#475569",
                            "&:hover": {borderColor: "#94a3b8", bgcolor: "rgba(248,250,252,0.9)"}
                        }}
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmAdmissionAfterAvailability}
                        disabled={
                            availabilityCheckLoading ||
                            availabilitySubmitting ||
                            Boolean(availabilityTemplateError) ||
                            orderedAvailableAdmissionIds.length === 0 ||
                            availabilityStudentProfileId == null
                        }
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2.5,
                            minHeight: 40,
                            boxShadow: "0 4px 14px rgba(45,95,115,0.22)",
                            bgcolor: BRAND_NAVY,
                            "&:hover": {bgcolor: APP_PRIMARY_DARK, boxShadow: "0 6px 18px rgba(45,95,115,0.28)"},
                            "&.Mui-disabled": {bgcolor: "#e2e8f0", color: "#94a3b8", boxShadow: "none"}
                        }}
                    >
                        {availabilitySubmitting ? "Đang nộp..." : "Nộp hồ sơ"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Modal
                open={Boolean(availabilityImagePreview?.url)}
                onClose={() => setAvailabilityImagePreview(null)}
                slotProps={{
                    backdrop: {sx: {backdropFilter: "blur(8px)", bgcolor: "rgba(15, 23, 42, 0.5)"}}
                }}
                sx={{display: "flex", alignItems: "center", justifyContent: "center", p: {xs: 2, md: 3}}}
            >
                <Box sx={{position: "relative", outline: "none", maxWidth: "100%"}}>
                    <IconButton
                        aria-label="Đóng"
                        onClick={() => setAvailabilityImagePreview(null)}
                        sx={{
                            position: "absolute",
                            top: -44,
                            right: 0,
                            color: "#fff",
                            bgcolor: "rgba(15, 23, 42, 0.55)",
                            "&:hover": {bgcolor: "rgba(15, 23, 42, 0.75)"}
                        }}
                    >
                        <CloseIcon/>
                    </IconButton>
                    {availabilityImagePreview?.title ? (
                        <Typography
                            sx={{
                                position: "absolute",
                                top: -44,
                                left: 0,
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                maxWidth: "min(70vw, 320px)"
                            }}
                        >
                            {availabilityImagePreview.title}
                        </Typography>
                    ) : null}
                    <Box
                        component="img"
                        src={availabilityImagePreview?.url || ""}
                        alt={availabilityImagePreview?.title || "Ảnh học bạ"}
                        sx={{
                            maxWidth: "min(92vw, 720px)",
                            maxHeight: "min(82vh, 640px)",
                            borderRadius: 2,
                            boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
                            display: "block"
                        }}
                    />
                </Box>
            </Modal>

            {detailSchool && (
                <SchoolSearchDetailView
                    school={detailSchool}
                    detailKeyRaw={detailKeyRaw}
                    detailLoading={detailLoading}
                    detailError={detailError}
                    maptilerApiKey={maptilerApiKey}
                    onOpenSchoolById={(schoolId) => {
                        const target = schools.find((s) => Number(s?.id) === Number(schoolId));
                        if (target) {
                            openSchoolDetail(target);
                        } else {
                            navigate("/search-schools");
                        }
                    }}
                    onClose={closeSchoolDetail}
                    navigate={navigate}
                    isParent={isParent}
                    canSaveSchool={canSaveSchool}
                    detailIsSaved={detailIsSaved}
                    detailInCompare={detailInCompare}
                    toggleCompare={toggleCompare}
                    toggleSave={toggleSave}
                    onAfterAdmissionReservationSubmitted={
                        isParent ? advanceBatchAdmissionAfterSubmit : undefined
                    }
                />
            )}
        </Box>
    );
}
