import React from "react";
import {Box, Checkbox, Typography} from "@mui/material";

export const PARENT_ADMISSION_RESERVATIONS_PATH = "/parent/admission-reservations";

export const AVAILABILITY_SECTION_TITLE_SX = {
    fontWeight: 700,
    fontSize: "0.72rem",
    letterSpacing: "0.06em",
    color: "#64748b",
    textTransform: "uppercase",
    mb: 1.25,
};

export const AVAILABILITY_PANEL_SX = {
    borderRadius: 2,
    bgcolor: "#fff",
    border: "1px solid rgba(226,232,240,0.95)",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
    overflow: "hidden",
};

export function getBatchRowSchoolId(school) {
    const n = Number(school?.id ?? school?.schoolId);
    return Number.isFinite(n) && n > 0 ? n : null;
}

export function extractParentStudentRecordsFromResponse(response) {
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

export function pickStudentProfileIdFromRecord(student) {
    if (!student || typeof student !== "object") return null;
    const raw = student.studentProfileId ?? student.id ?? student.studentId ?? null;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : null;
}

export function pickStudentDisplayNameForSelect(student) {
    if (!student || typeof student !== "object") return "Học sinh";
    const name = String(
        student.studentName || student.childName || student.fullName || student.name || ""
    ).trim();
    return name || "Học sinh";
}

export function filterAvailabilitySchoolRows(rows, query) {
    const q = String(query ?? "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => String(row.schoolName ?? "").toLowerCase().includes(q));
}

export function AvailabilitySelectableSchoolRow({row, selected, disabled, onToggle}) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 0.5,
                borderBottom: "1px solid rgba(226,232,240,0.85)",
                "&:last-of-type": {borderBottom: "none"},
            }}
        >
            <Checkbox
                size="small"
                checked={selected}
                disabled={disabled}
                onChange={onToggle}
                sx={{
                    flexShrink: 0,
                    mt: 0.65,
                    ml: 0.35,
                    p: 0.45,
                    color: "#94a3b8",
                    "&.Mui-checked": {color: "#16a34a"},
                }}
            />
            <Box
                component="label"
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "block",
                    px: 1.25,
                    py: 1.15,
                    m: 0,
                    cursor: disabled ? "default" : "pointer",
                    bgcolor: selected ? "rgba(240,253,244,0.95)" : "transparent",
                    transition: "background-color 160ms ease",
                    "&:hover": disabled
                        ? {}
                        : {bgcolor: selected ? "rgba(240,253,244,1)" : "rgba(248,250,252,0.95)"},
                }}
            >
                <Typography
                    title={row.schoolName}
                    sx={{
                        fontSize: "0.9rem",
                        fontWeight: selected ? 700 : 600,
                        color: "#0f172a",
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {row.schoolName}
                </Typography>
            </Box>
        </Box>
    );
}

export function AvailabilityBlockedSchoolRow({row}) {
    return (
        <Box
            sx={{
                px: 1.25,
                py: 1.15,
                borderBottom: "1px solid rgba(226,232,240,0.85)",
                bgcolor: "rgba(248,250,252,0.65)",
                "&:last-of-type": {borderBottom: "none"},
            }}
        >
            <Typography
                title={row.schoolName}
                sx={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#334155",
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                }}
            >
                {row.schoolName}
            </Typography>
            <Typography
                sx={{
                    mt: 0.35,
                    fontSize: "0.8125rem",
                    color: "#64748b",
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                }}
            >
                <Box component="span" sx={{fontWeight: 700, color: "#475569"}}>
                    Lý do:
                </Box>{" "}
                {row.reason}
            </Typography>
        </Box>
    );
}

export function AvailabilityInfoCell({label, value, prominent = false}) {
    return (
        <Box sx={{flex: 1, minWidth: 0, px: {xs: 1.5, md: 2}, py: 1.5}}>
            <Typography
                sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.02em",
                    mb: 0.4,
                    lineHeight: 1.3,
                }}
            >
                {label}
            </Typography>
            <Typography
                sx={{
                    fontSize: prominent ? {xs: "1.05rem", md: "1.1rem"} : "0.9375rem",
                    fontWeight: prominent ? 800 : 600,
                    color: "#0f172a",
                    lineHeight: 1.45,
                    wordBreak: "break-word",
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}
