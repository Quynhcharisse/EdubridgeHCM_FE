import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState} from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import PhotoPreviewIcon from "@mui/icons-material/Photo";
import {useNavigate} from "react-router-dom";

import {enqueueSnackbar} from "notistack";
import CloudinaryUpload from "../../ui/CloudinaryUpload.jsx";
import {usePlatformMediaImageRules} from "../../../hooks/usePlatformMediaImageRules.js";
import {formatMediaImageRulesCaption} from "../../../utils/platformMediaConfig.js";
import ConfirmDialog, {ConfirmHighlight} from "../../ui/ConfirmDialog.jsx";
import CreatePostRichTextEditor from "../../ui/CreatePostRichTextEditor.jsx";

function plainTextLengthFromHtml(html) {
  if (html == null || html === "") return 0;
  const s = String(html);
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = s;
    return (el.textContent || "").length;
  }
  return s.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").length;
}


function overviewToInitialEditorHtml(stored) {
  const raw = stored ?? "";
  const s = String(raw).trim();
  if (!s) return "";
  if (/<[a-z][\s/>]/i.test(s)) return String(raw);
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<p>${esc}</p>`;
}

function formatIsoLocalDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toIsoLocalDateTime(raw) {
  if (raw == null || raw === "") return formatIsoLocalDateTime(new Date());
  if (typeof raw === "string") {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return formatIsoLocalDateTime(d);
    return raw.length >= 19 ? raw.slice(0, 19) : raw;
  }
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = raw;
    return formatIsoLocalDateTime(new Date(y, mo - 1, d, h, mi, s));
  }
  return formatIsoLocalDateTime(new Date());
}

function formatViDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("vi-VN");
}

function normalizeFacilityCode(raw) {
  return String(raw || "").trim().toLowerCase();
}

function imageCardSx() {
  return {
    border: "1px solid rgba(226,232,240,1)",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
    bgcolor: "white",
  };
}

function normalizeFacilityData(raw) {
  const fd = raw && typeof raw === "object" ? raw : {};
  const imageData = fd.imageData && typeof fd.imageData === "object" ? fd.imageData : {};
  const list = Array.isArray(imageData.imageList) ? imageData.imageList : [];
  return {
    itemList: Array.isArray(fd.itemList) ? fd.itemList : [],
    overview: fd.overview ?? "",
    imageData: {
      coverUrl: imageData.coverUrl ?? "",
      imageList: list.map((img) => ({
        url: img.url ?? "",
        name: img.name ?? "",
        altName: img.altName ?? "",
        facilityCode: img.facilityCode ?? "",
        uploadDate: img.uploadDate ? toIsoLocalDateTime(img.uploadDate) : formatIsoLocalDateTime(new Date()),
        isUsage: img.isUsage ?? true,
      })),
    },
  };
}




export const SchoolFacilityFacilityForm = forwardRef(function SchoolFacilityFacilityForm(
  {value, onChange, loading = false, saving = false, readOnly = false, perCampus = false},
  ref
) {
  
  const valueRef = useRef(value);
  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  const formLocked = loading || saving || readOnly;
  
  const blockPointerSx = formLocked ? { pointerEvents: "none", cursor: "default" } : undefined;
  const facilityData = useMemo(() => normalizeFacilityData(value), [value]);
  const { loading: mediaImageRulesLoading, rules: mediaImageRules } = usePlatformMediaImageRules();
  const mediaImageUploadHint =
    formatMediaImageRulesCaption(mediaImageRules) ||
    (mediaImageRulesLoading ? "Đang tải cấu hình định dạng và dung lượng ảnh…" : "Không tải được cấu hình ảnh từ hệ thống. Vui lòng thử lại sau.");


  const setFacilityData = useCallback(
    (updater) => {
      const current = normalizeFacilityData(valueRef.current);
      const next = typeof updater === "function" ? updater(current) : updater;
      onChange?.(next);
    },
    [onChange]
  );

  const overview = facilityData.overview ?? "";
  const overviewPlainLen = useMemo(() => plainTextLengthFromHtml(overview), [overview]);
  const coverUrl = facilityData.imageData?.coverUrl ?? "";
  const imageItems = facilityData.imageData?.imageList ?? [];

  const setOverview = useCallback(
    (v) => {
      setFacilityData((prev) => ({...prev, overview: v}));
    },
    [setFacilityData]
  );

  const setCoverUrl = useCallback(
    (v) => {
      setFacilityData((prev) => ({
        ...prev,
        imageData: {...prev.imageData, coverUrl: v},
      }));
    },
    [setFacilityData]
  );

  const setImageItems = useCallback(
    (nextListOrFn) => {
      setFacilityData((prev) => {
        const cur = normalizeFacilityData(prev).imageData?.imageList ?? [];
        const nextList = typeof nextListOrFn === "function" ? nextListOrFn(cur) : nextListOrFn;
        const im = prev.imageData && typeof prev.imageData === "object" ? prev.imageData : {};
        return {
          ...prev,
          imageData: {...im, imageList: nextList},
        };
      });
    },
    [setFacilityData]
  );

  const [facilityItems, setFacilityItemsState] = useState([]);

  useEffect(() => {
    const raw = Array.isArray(facilityData.itemList) ? facilityData.itemList : [];
    setFacilityItemsState((prev) =>
      raw.map((i, idx) => {
        const prevRow = prev[idx];
        
        const id =
          prevRow != null && prev.length === raw.length
            ? prevRow.id
            : `api-row-${idx}`;
        return {
          id,
          facilityCode: i.facilityCode ?? "",
          name: i.name ?? "",
          value: i.value ?? "",
          unit: i.unit ?? "",
          category: i.category ?? "",
        };
      })
    );
  }, [facilityData.itemList]);

  const syncItemListUp = useCallback(
    (rows) => {
      const itemList = rows.map((it) => ({
        facilityCode: it.facilityCode,
        name: it.name,
        value: it.value === "" || it.value == null ? "" : Number(it.value) || 0,
        unit: it.unit,
        category: it.category,
      }));
      setFacilityData((prev) => ({...prev, itemList}));
    },
    [setFacilityData]
  );

  const [categoriesFilter, setCategoriesFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedFacilityId, setExpandedFacilityId] = useState(null);
  const [facilityErrorsById, setFacilityErrorsById] = useState({});

  const [confirmDeleteFacilityOpen, setConfirmDeleteFacilityOpen] = useState(false);
  const [facilityIdToDelete, setFacilityIdToDelete] = useState(null);
  const [confirmDeleteImageOpen, setConfirmDeleteImageOpen] = useState(false);
  const [imageUrlToDelete, setImageUrlToDelete] = useState(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const facilityRowRefs = useRef({});
  const pendingScrollFacilityIdRef = useRef(null);

  const facilityCategories = useMemo(() => {
    const set = new Set(facilityItems.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [facilityItems]);

  const filteredFacilities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return facilityItems.filter((item) => {
      if (categoriesFilter !== "ALL" && item.category !== categoriesFilter) return false;
      if (!q) return true;
      return (
        item.name?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.unit?.toLowerCase().includes(q)
      );
    });
  }, [facilityItems, categoriesFilter, search]);

  const validateFacilities = useCallback(() => {
    const errorsById = {};
    const facilityCodeCount = facilityItems.reduce((acc, item) => {
      const code = item.facilityCode?.trim();
      if (!code) return acc;
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});

    facilityItems.forEach((item) => {
      const errors = {};
      if (!item.facilityCode?.trim()) {
        errors.facilityCode = "Mã cơ sở vật chất là bắt buộc";
      } else if (facilityCodeCount[item.facilityCode.trim()] > 1) {
        errors.facilityCode = "Mã cơ sở vật chất không được trùng";
      }
      if (!item.name?.trim()) errors.name = "Tên là bắt buộc";
      if (item.value == null || item.value === "" || Number.isNaN(Number(item.value)) || Number(item.value) <= 0) {
        errors.value = "Số lượng phải lớn hơn 0";
      }
      if (!item.unit?.trim()) errors.unit = "Đơn vị là bắt buộc";
      if (!item.category?.trim()) errors.category = "Danh mục là bắt buộc";
      if (Object.keys(errors).length > 0) errorsById[item.id] = errors;
    });
    setFacilityErrorsById(errorsById);
    return Object.keys(errorsById).length === 0;
  }, [facilityItems]);

  useImperativeHandle(
    ref,
    () => ({
      validate: () => validateFacilities(),
    }),
    [validateFacilities]
  );

  const handleUpdateFacilityField = useCallback(
    (facilityId, field, val) => {
      setFacilityItemsState((prev) => {
        const next = prev.map((it) => (it.id === facilityId ? {...it, [field]: val} : it));
        syncItemListUp(next);
        return next;
      });
      setFacilityErrorsById((prev) => {
        if (!prev[facilityId]) return prev;
        const next = {...prev};
        delete next[facilityId];
        return next;
      });
    },
    [syncItemListUp]
  );

  const openDeleteFacilityConfirm = useCallback((facilityId) => {
    setFacilityIdToDelete(facilityId);
    setConfirmDeleteFacilityOpen(true);
  }, []);

  const handleDeleteFacility = useCallback(() => {
    if (!facilityIdToDelete) return;
    setFacilityItemsState((prev) => {
      const next = prev.filter((it) => it.id !== facilityIdToDelete);
      syncItemListUp(next);
      return next;
    });
    setFacilityErrorsById((prev) => {
      if (!prev[facilityIdToDelete]) return prev;
      const next = {...prev};
      delete next[facilityIdToDelete];
      return next;
    });
    if (expandedFacilityId === facilityIdToDelete) setExpandedFacilityId(null);
    setConfirmDeleteFacilityOpen(false);
    setFacilityIdToDelete(null);
    enqueueSnackbar("Xoá cơ sở vật chất thành công", {variant: "success"});
  }, [expandedFacilityId, facilityIdToDelete, syncItemListUp]);

  const handleAddFacility = useCallback(() => {
    const id = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newItem = {
      id,
      facilityCode: "",
      name: "",
      value: "1",
      unit: "",
      category: "",
    };
    setFacilityItemsState((prev) => {
      const next = [...prev, newItem];
      syncItemListUp(next);
      return next;
    });
    setExpandedFacilityId(id);
    pendingScrollFacilityIdRef.current = id;
  }, [syncItemListUp]);

  useEffect(() => {
    const targetId = pendingScrollFacilityIdRef.current;
    if (!targetId) return;
    const node = facilityRowRefs.current[targetId];
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollIntoView({behavior: "smooth", block: "center"});
      pendingScrollFacilityIdRef.current = null;
    });
  }, [facilityItems]);

  const openDeleteImageConfirm = useCallback((url) => {
    setImageUrlToDelete(url);
    setConfirmDeleteImageOpen(true);
  }, []);

  const handleDeleteImage = useCallback(() => {
    if (!imageUrlToDelete) return;
    setImageItems((list) => list.filter((img) => img.url !== imageUrlToDelete));
    setConfirmDeleteImageOpen(false);
    setImageUrlToDelete(null);
    enqueueSnackbar("Xoá ảnh thành công", {variant: "success"});
  }, [imageUrlToDelete, setImageItems]);

  const handleCoverUploaded = useCallback(
    (results) => {
      const first = results?.[0];
      if (!first?.url) return;
      setCoverUrl(first.url);
      enqueueSnackbar("Tải ảnh cover lên thành công", {variant: "success"});
    },
    [setCoverUrl]
  );

  const handleFacilityImagesUploaded = useCallback(
    (facility) => (results) => {
      const normalizedCode = normalizeFacilityCode(facility?.facilityCode);
      if (!normalizedCode) {
        enqueueSnackbar("Vui lòng nhập mã cơ sở vật chất trước khi tải ảnh", {variant: "warning"});
        return;
      }
      const nowIso = formatIsoLocalDateTime(new Date());
      const nextImages = (results || [])
        .filter((r) => r?.url)
        .map((r) => ({
          url: r.url,
          name: facility.name ?? "",
          altName: facility.name ?? "",
          facilityCode: facility.facilityCode ?? "",
          uploadDate: nowIso,
          isUsage: true,
        }));
      if (nextImages.length === 0) return;
      setImageItems((list) => [...list, ...nextImages]);
      enqueueSnackbar(`Đã tải ${nextImages.length} ảnh lên thành công`, {variant: "success"});
    },
    [setImageItems]
  );

  const handleOpenImagePreview = useCallback((url) => {
    setImagePreviewUrl(url);
    setImagePreviewOpen(true);
  }, []);

  const imagePreviewItem = useMemo(() => {
    if (!imagePreviewUrl) return null;
    return imageItems.find((i) => i.url === imagePreviewUrl) || null;
  }, [imageItems, imagePreviewUrl]);

  const updatePreviewField = useCallback(
    (field, val) => {
      if (!imagePreviewItem) return;
      const codeUrl = imagePreviewItem.url;
      setImageItems((list) => list.map((img) => (img.url === codeUrl ? {...img, [field]: val} : img)));
    },
    [imagePreviewItem, setImageItems]
  );

  return (
    <Box sx={{width: "100%", display: "flex", flexDirection: "column", gap: 3, pb: 1}}>
      {!perCampus ? (
        <Card sx={{borderRadius: "12px", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)", border: "1px solid rgba(226,232,240,1)"}}>
          <CardContent sx={{p: 3}}>
            <Typography sx={{fontWeight: 900, color: "#0f172a", mb: 1.25, fontSize: 18}}>Tổng quan cơ sở vật chất</Typography>
            {loading ? (
              <Stack spacing={1.5}>
                <Skeleton variant="rounded" height={120} sx={{borderRadius: "12px"}}/>
                <Skeleton variant="text" width="35%"/>
              </Stack>
            ) : (
              <Box>
                <Box sx={{display: "flex", flexDirection: "column", gap: 0.75}}>
                  <CreatePostRichTextEditor
                    initialHtml={overviewToInitialEditorHtml(overview)}
                    onChange={setOverview}
                    disabled={formLocked}
                    minEditorHeight={260}
                    maxEditorHeight={480}
                  />
                </Box>
                <Box sx={{display: "flex", justifyContent: "space-between", mt: 1}}>
                  <Typography
                    variant="caption"
                    sx={{color: "#94a3b8"}}
                  >
                    {overviewPlainLen} ký tự
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : null}

      {}
      <Card sx={{borderRadius: "12px", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)", border: "1px solid rgba(226,232,240,1)"}}>
        <CardContent sx={{p: 3}}>
          <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2}}>
            <Typography sx={{fontWeight: 900, color: "#0f172a", fontSize: 18}}>Danh sách cơ sở vật chất</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon/>}
              disabled={formLocked}
              onClick={handleAddFacility}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
                boxShadow: "0 10px 24px rgba(37, 99, 235, 0.18)",
                ...blockPointerSx,
              }}
            >
              Thêm cơ sở vật chất
            </Button>
          </Box>

          <Typography variant="subtitle2" sx={{fontWeight: 800, color: "#0f172a", mb: 1.25}}>
            Ảnh bìa
          </Typography>
          {loading ? (
            <Skeleton variant="rounded" height={180} sx={{borderRadius: "12px", mb: 2.5}}/>
          ) : (
            <Box
              sx={{
                border: "1px dashed rgba(203, 213, 225, 1)",
                borderRadius: "12px",
                p: 0,
                bgcolor: "#f1f5f9",
                position: "relative",
                overflow: "hidden",
                mb: 2.5,
                ...(formLocked ? blockPointerSx : {}),
              }}
            >
              <CloudinaryUpload
                  inputId="school-facility-cover-upload"
                  accept="image
export default function SchoolFacilityConfiguration() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/school/facility-config?tab=facility", {replace: true});
  }, [navigate]);
  return (
    <Box sx={{display: "flex", justifyContent: "center", p: 4}}>
      <CircularProgress/>
    </Box>
  );
}
