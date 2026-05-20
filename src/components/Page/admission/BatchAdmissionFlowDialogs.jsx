import React from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputAdornment,
    LinearProgress,
    MenuItem,
    Modal,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    Close as CloseIcon,
    FactCheck as FactCheckIcon,
    PersonOutline as PersonOutlineIcon,
    Search as SearchIcon,
} from "@mui/icons-material";
import {
    APP_PRIMARY_DARK,
    BRAND_NAVY,
    BRAND_SKY,
    BRAND_SKY_LIGHT,
} from "../../../constants/homeLandingTheme";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import {AdmissionDocumentsSection} from "./AdmissionDocumentUploadFields.jsx";
import {HOC_BA_THCS_GRADE_LABELS} from "./admissionSubmissionUtils.js";
import {
    AVAILABILITY_PANEL_SX,
    AVAILABILITY_SECTION_TITLE_SX,
    AvailabilityBlockedSchoolRow,
    AvailabilityInfoCell,
    AvailabilitySelectableSchoolRow,
} from "./batchAdmissionUi.jsx";

export default function BatchAdmissionFlowDialogs({
    batchAdmissionPickerOpen,
    batchAdmissionPickerLoading,
    batchAdmissionPickerOptions,
    batchAdmissionPickerProfileId,
    setBatchAdmissionPickerProfileId,
    batchAdmissionPickerError,
    closeStudentPickerForAdmission,
    confirmStudentPickerForAdmission,
    availabilityDialogOpen,
    closeAdmissionAvailabilityDialog,
    availabilityStudentProfileId,
    availabilityStudentDisplayName,
    availabilityCheckLoading,
    availabilityError,
    setAvailabilityError,
    availabilityTemplateDocs,
    availabilityTemplateError,
    availabilitySubmitting,
    availabilityStudentSummary,
    availabilityImagePreview,
    setAvailabilityImagePreview,
    availabilitySchoolSearch,
    setAvailabilitySchoolSearch,
    availabilitySubmitConfirmOpen,
    setAvailabilitySubmitConfirmOpen,
    availabilityOrderedDisplayRows,
    selectedAvailableAdmissionIds,
    orderedAvailableAdmissionIds,
    toggleAvailabilitySchoolSelected,
    availabilitySchoolGroups,
    filteredAvailableSchoolRows,
    filteredBlockedSchoolRows,
    allFilteredAvailableSelected,
    toggleSelectAllFilteredAvailable,
    availabilitySelectedSchoolIds,
    handleRequestSubmitAdmissionAfterAvailability,
    handleConfirmAdmissionAfterAvailability,
}) {
    return (
        <>
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
                        bgcolor: "#fff",
                    },
                }}
            >
                <Box
                    aria-hidden
                    sx={{
                        height: 4,
                        background: `linear-gradient(90deg, ${BRAND_NAVY} 0%, ${BRAND_SKY} 55%, ${BRAND_SKY_LIGHT} 100%)`,
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
                        borderBottom: "1px solid rgba(226,232,240,0.85)",
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
                            border: `1px solid rgba(85,179,217,0.22)`,
                        }}
                    >
                        <PersonOutlineIcon sx={{fontSize: 28}} />
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
                            <CircularProgress size={36} sx={{color: BRAND_NAVY}} />
                        </Box>
                    ) : batchAdmissionPickerError ? (
                        <Alert
                            severity={
                                String(batchAdmissionPickerError).includes("Không tải được") ? "error" : "warning"
                            }
                            sx={{
                                mb: 0,
                                borderRadius: 2,
                                "& .MuiAlert-message": {width: "100%"},
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
                                        borderWidth: 2,
                                    },
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
                        borderTop: "1px solid rgba(226,232,240,0.85)",
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
                            "&:hover": {borderColor: "#94a3b8", bgcolor: "rgba(248,250,252,0.9)"},
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
                            "&.Mui-disabled": {bgcolor: "#e2e8f0", color: "#94a3b8", boxShadow: "none"},
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
                maxWidth="lg"
                scroll="paper"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
                        boxShadow: "0 24px 48px rgba(15,23,42,0.14), 0 8px 20px rgba(15,23,42,0.06)",
                        border: "1px solid rgba(226,232,240,0.95)",
                        bgcolor: "#fff",
                        width: "min(96vw, 1120px)",
                        maxWidth: "min(96vw, 1120px)",
                        maxHeight: "min(94vh, 860px)",
                    },
                }}
            >
                <Box
                    aria-hidden
                    sx={{
                        height: 4,
                        background: `linear-gradient(90deg, ${BRAND_NAVY} 0%, ${BRAND_SKY} 55%, ${BRAND_SKY_LIGHT} 100%)`,
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
                        borderBottom: "1px solid rgba(226,232,240,0.85)",
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
                                border: `1px solid rgba(85,179,217,0.22)`,
                            }}
                        >
                            <FactCheckIcon sx={{fontSize: 26}} />
                        </Box>
                        <Box sx={{minWidth: 0}}>
                            <Typography sx={{fontWeight: 800, fontSize: "1.08rem", color: "#0f172a", lineHeight: 1.25}}>
                                Kiểm tra hồ sơ nộp vào trường
                            </Typography>
                            <Typography sx={{mt: 0.35, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.45}}>
                                Xem hồ sơ và trạng thái từng trường trước khi nộp.
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
                            "&:hover": {bgcolor: "rgba(15,23,42,0.06)", color: "#0f172a"},
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent
                    dividers
                    sx={{
                        px: {xs: 2, sm: 2.5},
                        pt: 2.5,
                        pb: 2.5,
                        borderColor: "rgba(226,232,240,0.75)",
                        bgcolor: "#fafbfc",
                    }}
                >
                    <Stack spacing={2.5}>
                        <Box sx={{minWidth: 0}}>
                            <Typography sx={AVAILABILITY_SECTION_TITLE_SX}>Hồ sơ học sinh</Typography>
                            <Box sx={{...AVAILABILITY_PANEL_SX, mb: 2}}>
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {xs: "1fr", md: "repeat(3, 1fr)"},
                                    }}
                                >
                                    {[
                                        {
                                            label: "Học sinh",
                                            prominent: true,
                                            value:
                                                availabilityStudentDisplayName ||
                                                (availabilityStudentProfileId != null
                                                    ? `Hồ sơ #${availabilityStudentProfileId}`
                                                    : "—"),
                                        },
                                        {
                                            label: "Giới tính",
                                            value:
                                                availabilityCheckLoading && !availabilityStudentSummary
                                                    ? "…"
                                                    : availabilityStudentSummary?.genderLabel || "—",
                                        },
                                        {
                                            label: "CCCD học sinh",
                                            value:
                                                availabilityCheckLoading && !availabilityStudentSummary
                                                    ? "…"
                                                    : availabilityStudentSummary?.studentCode || "—",
                                        },
                                    ].map((field, fieldIdx, arr) => (
                                        <Box
                                            key={field.label}
                                            sx={{
                                                borderBottom: {
                                                    xs:
                                                        fieldIdx < arr.length - 1
                                                            ? "1px solid rgba(226,232,240,0.95)"
                                                            : "none",
                                                    md: "none",
                                                },
                                                borderRight: {
                                                    md:
                                                        fieldIdx < arr.length - 1
                                                            ? "1px solid rgba(226,232,240,0.95)"
                                                            : "none",
                                                },
                                            }}
                                        >
                                            <AvailabilityInfoCell
                                                label={field.label}
                                                prominent={field.prominent === true}
                                                value={field.value}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                                <Divider sx={{borderColor: "rgba(226,232,240,0.95)"}} />
                                <Box sx={{px: {xs: 1.5, md: 2}, py: 1.5, bgcolor: "#fafbfc"}}>
                                    <Typography
                                        sx={{
                                            ...AVAILABILITY_SECTION_TITLE_SX,
                                            mb: 1.25,
                                            color: "#475569",
                                        }}
                                    >
                                        Học bạ THCS (4 năm)
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {
                                                xs: "repeat(2, minmax(0, 1fr))",
                                                md: "repeat(4, minmax(0, 1fr))",
                                            },
                                            gap: 1.25,
                                        }}
                                    >
                                        {HOC_BA_THCS_GRADE_LABELS.map((gradeLabel, slotIndex) => {
                                            const url = availabilityStudentSummary?.transcriptSlots?.[slotIndex];
                                            const hasUrl = typeof url === "string" && url.trim() !== "";
                                            return (
                                                <Box
                                                    key={`availability-transcript-${slotIndex}`}
                                                    sx={{
                                                        minWidth: 0,
                                                        borderRadius: 1.5,
                                                        border: "1px solid #dbeafe",
                                                        overflow: "hidden",
                                                        bgcolor: "#fff",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            py: 0.7,
                                                            px: 1,
                                                            bgcolor: "#eef4ff",
                                                            borderBottom: "1px solid #dbeafe",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        <Typography
                                                            sx={{
                                                                fontSize: "0.8125rem",
                                                                fontWeight: 700,
                                                                color: "#1e40af",
                                                                lineHeight: 1.3,
                                                            }}
                                                        >
                                                            {gradeLabel}
                                                        </Typography>
                                                    </Box>
                                                    {hasUrl ? (
                                                        <Box
                                                            component="button"
                                                            type="button"
                                                            onClick={() =>
                                                                setAvailabilityImagePreview({
                                                                    url: url.trim(),
                                                                    title: `Học bạ — ${gradeLabel}`,
                                                                })
                                                            }
                                                            sx={{
                                                                display: "block",
                                                                width: "100%",
                                                                p: 0,
                                                                border: "none",
                                                                overflow: "hidden",
                                                                cursor: "pointer",
                                                                bgcolor: "#fff",
                                                                lineHeight: 0,
                                                            }}
                                                        >
                                                            <Box
                                                                component="img"
                                                                src={url.trim()}
                                                                alt={gradeLabel}
                                                                sx={{
                                                                    width: "100%",
                                                                    height: {xs: 240, sm: 280, md: 320},
                                                                    objectFit: "cover",
                                                                    objectPosition: "center top",
                                                                    display: "block",
                                                                }}
                                                            />
                                                        </Box>
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                minHeight: {xs: 240, sm: 280, md: 320},
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                bgcolor: "#f8fafc",
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "0.8125rem",
                                                                    color: "#94a3b8",
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Chưa có
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)"},
                                gap: {xs: 2.5, md: 0},
                                alignItems: "stretch",
                                minHeight: {md: 380},
                            }}
                        >
                            <Box
                                sx={{
                                    minWidth: 0,
                                    pr: {md: 2.5},
                                    pb: {xs: 2.5, md: 0},
                                    borderRight: {md: "1px solid rgba(226,232,240,0.9)"},
                                    borderBottom: {xs: "1px solid rgba(226,232,240,0.9)", md: "none"},
                                }}
                            >
                                <Typography sx={AVAILABILITY_SECTION_TITLE_SX}>Hồ sơ giữ chỗ</Typography>

                                {availabilityTemplateError ? (
                                    <Alert severity="warning" sx={{mb: 1.5, borderRadius: 2}}>
                                        {availabilityTemplateError === "__TEMPLATE_NULL__" ? (
                                            <>
                                                Cấu hình hồ sơ giữ chỗ của học sinh chưa được thiết lập. Vui lòng thiết lập{" "}
                                                <a
                                                    href="/parent/admission-hold-profile"
                                                    style={{color: "inherit", fontWeight: 700, textDecoration: "underline"}}
                                                >
                                                    tại đây
                                                </a>
                                                .
                                            </>
                                        ) : availabilityTemplateError === "__TEMPLATE_OUTDATED__" ? (
                                            <>
                                                Cấu hình hồ sơ giữ chỗ đã bị lỗi thời, cần cấu hình lại.{" "}
                                                <a
                                                    href="/parent/admission-hold-profile"
                                                    style={{color: "inherit", fontWeight: 700, textDecoration: "underline"}}
                                                >
                                                    Cấu hình lại tại đây
                                                </a>
                                                .
                                            </>
                                        ) : availabilityTemplateError}
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

                            <Box
                                sx={{
                                    minWidth: 0,
                                    pl: {md: 2.5},
                                    display: "flex",
                                    flexDirection: "column",
                                    flex: 1,
                                    minHeight: {md: 400},
                                }}
                            >
                                <Typography sx={AVAILABILITY_SECTION_TITLE_SX}>Các trường</Typography>

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
                                                "& .MuiLinearProgress-bar": {bgcolor: BRAND_NAVY},
                                            }}
                                        />
                                    </Box>
                                ) : null}

                                {!availabilityCheckLoading &&
                                availabilityStudentProfileId != null &&
                                !availabilityError &&
                                availabilityOrderedDisplayRows.length === 0 ? (
                                    <Typography
                                        sx={{
                                            fontSize: "0.9rem",
                                            color: "#64748b",
                                            fontStyle: "italic",
                                            lineHeight: 1.55,
                                        }}
                                    >
                                        Chưa có trường nào trong kết quả kiểm tra.
                                    </Typography>
                                ) : null}

                                {!availabilityCheckLoading && !availabilityError ? (
                                    <Box
                                        sx={{
                                            ...AVAILABILITY_PANEL_SX,
                                            display: "flex",
                                            flexDirection: "column",
                                            flex: 1,
                                            minHeight: {md: 360},
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                px: 1.5,
                                                pt: 1.75,
                                                pb: 1.5,
                                                borderBottom: "1px solid rgba(226,232,240,0.95)",
                                                bgcolor: "#fafbfc",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                justifyContent="space-between"
                                                spacing={1}
                                                sx={{mb: 1}}
                                            >
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    <Typography
                                                        sx={{
                                                            fontSize: "0.8125rem",
                                                            fontWeight: 700,
                                                            color: "#166534",
                                                        }}
                                                    >
                                                        Chọn nộp {selectedAvailableAdmissionIds.length}/
                                                        {availabilitySchoolGroups.available.length}
                                                    </Typography>
                                                    {availabilitySchoolGroups.blocked.length > 0 ? (
                                                        <Typography
                                                            sx={{
                                                                fontSize: "0.8125rem",
                                                                fontWeight: 700,
                                                                color: "#64748b",
                                                            }}
                                                        >
                                                            · Không nộp {availabilitySchoolGroups.blocked.length}
                                                        </Typography>
                                                    ) : null}
                                                </Stack>
                                                {filteredAvailableSchoolRows.length > 0 ? (
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        disabled={availabilitySubmitting}
                                                        onClick={toggleSelectAllFilteredAvailable}
                                                        sx={{
                                                            flexShrink: 0,
                                                            textTransform: "none",
                                                            fontWeight: 700,
                                                            fontSize: "0.8125rem",
                                                            color: "#2563eb",
                                                            minWidth: 0,
                                                            px: 0.5,
                                                        }}
                                                    >
                                                        {allFilteredAvailableSelected ? "Bỏ chọn" : "Chọn tất cả"}
                                                    </Button>
                                                ) : null}
                                            </Stack>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder="Tìm tên trường..."
                                                value={availabilitySchoolSearch}
                                                disabled={availabilitySubmitting}
                                                onChange={(e) => setAvailabilitySchoolSearch(e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchIcon sx={{fontSize: 20, color: "#94a3b8"}} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: 1.75,
                                                        bgcolor: "#fff",
                                                        fontSize: "0.9rem",
                                                    },
                                                }}
                                            />
                                        </Box>

                                        <Box
                                            sx={{
                                                flex: 1,
                                                overflowY: "auto",
                                                minHeight: {xs: 280, md: 320},
                                                maxHeight: {xs: 420, md: "min(58vh, 620px)"},
                                            }}
                                        >
                                            {filteredAvailableSchoolRows.length > 0 ||
                                            filteredBlockedSchoolRows.length > 0 ? (
                                                <Box>
                                                    {filteredAvailableSchoolRows.map((row) => {
                                                        const isSelected = availabilitySelectedSchoolIds.some(
                                                            (id) => Number(id) === Number(row.schoolId),
                                                        );
                                                        return (
                                                            <AvailabilitySelectableSchoolRow
                                                                key={row.key}
                                                                row={row}
                                                                selected={isSelected}
                                                                disabled={availabilitySubmitting}
                                                                onToggle={() =>
                                                                    toggleAvailabilitySchoolSelected(row.schoolId)
                                                                }
                                                            />
                                                        );
                                                    })}
                                                    {filteredBlockedSchoolRows.length > 0 ? (
                                                        <>
                                                            {filteredAvailableSchoolRows.length > 0 ? (
                                                                <Box
                                                                    sx={{
                                                                        px: 1.5,
                                                                        py: 1,
                                                                        bgcolor: "rgba(248,250,252,0.95)",
                                                                        borderTop:
                                                                            "1px solid rgba(226,232,240,0.95)",
                                                                        borderBottom:
                                                                            "1px solid rgba(226,232,240,0.95)",
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: "0.72rem",
                                                                            fontWeight: 700,
                                                                            letterSpacing: "0.06em",
                                                                            textTransform: "uppercase",
                                                                            color: "#64748b",
                                                                        }}
                                                                    >
                                                                        Không thể nộp
                                                                    </Typography>
                                                                </Box>
                                                            ) : null}
                                                            {filteredBlockedSchoolRows.map((row) => (
                                                                <AvailabilityBlockedSchoolRow
                                                                    key={row.key}
                                                                    row={row}
                                                                />
                                                            ))}
                                                        </>
                                                    ) : null}
                                                </Box>
                                            ) : availabilitySchoolGroups.available.length > 0 ||
                                              availabilitySchoolGroups.blocked.length > 0 ? (
                                                <Typography
                                                    sx={{
                                                        px: 1.5,
                                                        py: 2,
                                                        fontSize: "0.875rem",
                                                        color: "#64748b",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    Không có trường khớp từ khóa tìm kiếm.
                                                </Typography>
                                            ) : null}
                                        </Box>
                                    </Box>
                                ) : null}
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions
                    sx={{
                        px: 2.5,
                        py: 2,
                        gap: 1.25,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                        bgcolor: "rgba(248,250,252,0.65)",
                        borderTop: "1px solid rgba(226,232,240,0.85)",
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
                            "&:hover": {borderColor: "#94a3b8", bgcolor: "rgba(248,250,252,0.9)"},
                        }}
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleRequestSubmitAdmissionAfterAvailability}
                        disabled={
                            availabilityCheckLoading ||
                            availabilitySubmitting ||
                            Boolean(availabilityTemplateError) ||
                            orderedAvailableAdmissionIds.length === 0 ||
                            selectedAvailableAdmissionIds.length === 0 ||
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
                            "&.Mui-disabled": {bgcolor: "#e2e8f0", color: "#94a3b8", boxShadow: "none"},
                        }}
                    >
                        {availabilitySubmitting
                            ? "Đang nộp..."
                            : selectedAvailableAdmissionIds.length > 0
                              ? `Nộp hồ sơ (${selectedAvailableAdmissionIds.length})`
                              : "Nộp hồ sơ"}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={availabilitySubmitConfirmOpen}
                title="Xác nhận nộp hồ sơ"
                description={`Bạn có chắc muốn nộp hồ sơ giữ chỗ cho ${availabilityStudentDisplayName || "học sinh này"} vào ${selectedAvailableAdmissionIds.length} trường đã chọn?`}
                confirmText="Nộp hồ sơ"
                cancelText="Hủy"
                loading={availabilitySubmitting}
                onCancel={() => {
                    if (availabilitySubmitting) return;
                    setAvailabilitySubmitConfirmOpen(false);
                }}
                onConfirm={() => void handleConfirmAdmissionAfterAvailability()}
            />

            <Modal
                open={Boolean(availabilityImagePreview?.url)}
                onClose={() => setAvailabilityImagePreview(null)}
                slotProps={{
                    backdrop: {sx: {backdropFilter: "blur(8px)", bgcolor: "rgba(15, 23, 42, 0.5)"}},
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
                            "&:hover": {bgcolor: "rgba(15, 23, 42, 0.75)"},
                        }}
                    >
                        <CloseIcon />
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
                                maxWidth: "min(70vw, 320px)",
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
                            display: "block",
                        }}
                    />
                </Box>
            </Modal>
        </>
    );
}
