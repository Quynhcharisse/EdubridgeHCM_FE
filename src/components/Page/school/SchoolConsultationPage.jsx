import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { enqueueSnackbar } from "notistack";
import {
  CAMPUS_OFFLINE_CONSULTATION_STATUSES,
  CAMPUS_OFFLINE_TAB_LABELS,
  getCampusOfflineConsultations,
  parseCampusOfflineConsultationsResponse,
} from "../../../services/CampusOfflineConsultationService.jsx";
import {
  adminTableBodyRowSx,
  adminTableContainerSx,
  adminTableHeadCellSx,
  adminTableHeadRowSx,
} from "../../../constants/adminTableStyles.js";

const PAGE_SIZE = 10;

const statusChipSx = {
  height: 26,
  fontWeight: 700,
  fontSize: 11.5,
  borderRadius: "13px",
  "& .MuiChip-label": { px: 1.25 },
};

function StatusChip({ status }) {
  const s = String(status || "").toUpperCase();
  if (s.includes("PENDING")) {
    return (
      <Chip
        size="small"
        label="Chờ xử lý"
        sx={{ ...statusChipSx, bgcolor: "rgba(245,158,11,0.16)", color: "#d97706", border: "1px solid rgba(251,191,36,0.35)" }}
      />
    );
  }
  if (s.includes("CONFIRM")) {
    return (
      <Chip
        size="small"
        label="Đã xác nhận"
        sx={{ ...statusChipSx, bgcolor: "rgba(16,185,129,0.16)", color: "#059669", border: "1px solid rgba(52,211,153,0.35)" }}
      />
    );
  }
  if (s.includes("PROGRESS") || s.includes("IN_PROGRESS")) {
    return (
      <Chip
        size="small"
        label="Đang diễn ra"
        sx={{ ...statusChipSx, bgcolor: "rgba(59,130,246,0.16)", color: "#2563eb", border: "1px solid rgba(96,165,250,0.35)" }}
      />
    );
  }
  if (s.includes("COMPLETE")) {
    return (
      <Chip
        size="small"
        label="Hoàn tất"
        sx={{ ...statusChipSx, bgcolor: "rgba(71,85,105,0.16)", color: "#475569", border: "1px solid rgba(71,85,105,0.28)" }}
      />
    );
  }
  if (s.includes("CANCEL")) {
    return (
      <Chip
        size="small"
        label="Đã hủy"
        sx={{ ...statusChipSx, bgcolor: "rgba(239,68,68,0.16)", color: "#dc2626", border: "1px solid rgba(248,113,113,0.35)" }}
      />
    );
  }
  if (s.includes("NO_SHOW") || s.includes("NOSHOW")) {
    return (
      <Chip
        size="small"
        label="Vắng mặt"
        sx={{ ...statusChipSx, bgcolor: "rgba(168,85,247,0.16)", color: "#7c3aed", border: "1px solid rgba(167,139,250,0.35)" }}
      />
    );
  }
  const label = String(status || "—").replace(/^CONSULTATION_/i, "").replace(/_/g, " ").trim();
  return (
    <Chip
      size="small"
      label={label || "—"}
      sx={{ ...statusChipSx, bgcolor: "rgba(148,163,184,0.15)", color: "#64748b", border: "1px solid rgba(148,163,184,0.3)" }}
    />
  );
}

const formatDate = (value) => {
  if (!value) return "—";
  try {
    const [y, m, d] = String(value).split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return String(value);
  }
};

const formatTime = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 5);
};

const detailModalSx = {
  sectionBorder: "1px solid #bfdbfe",
  sectionBg: "rgba(255,255,255,0.8)",
  labelColor: "#1e40af",
  titleColor: "#1d4ed8",
};

function DetailSection({ title, icon, children }) {
  return (
    <Box sx={{ border: detailModalSx.sectionBorder, borderRadius: 2.5, p: 2, bgcolor: detailModalSx.sectionBg }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.75 }}>
        <Box
          sx={{
            width: 38, height: 38, borderRadius: 1.5, display: "flex", alignItems: "center",
            justifyContent: "center", bgcolor: "rgba(37,99,235,0.1)", color: detailModalSx.titleColor,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: 16, fontWeight: 800, color: detailModalSx.titleColor, letterSpacing: "-0.02em" }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

function DetailField({ label, value, grid = 6, children }) {
  return (
    <Grid size={{ xs: 12, sm: grid }}>
      <Box sx={{ bgcolor: "#fff", border: "1px solid #dbeafe", borderRadius: 1.75, p: 1.5, height: "100%" }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: detailModalSx.labelColor, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
          {label}
        </Typography>
        {children ?? (
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>
            {value ?? "—"}
          </Typography>
        )}
      </Box>
    </Grid>
  );
}

function DetailModal({ open, row, onClose }) {
  if (!row) return null;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: { borderRadius: 2.5, overflow: "hidden", border: "1px solid #93c5fd", boxShadow: "0 20px 45px -12px rgba(29,78,216,0.18)" },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
          color: "#fff", fontWeight: 800, fontSize: 17, px: 3, py: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        Chi tiết lịch tư vấn
        <IconButton size="small" onClick={onClose} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: "#eff6ff", p: 2.5 }}>
        <Stack spacing={2}>
          <DetailSection title="Thông tin phụ huynh" icon={<PersonOutlineOutlinedIcon />}>
            <Grid container spacing={1.5}>
              <DetailField label="Họ tên phụ huynh" value={row.parentName} grid={6} />
              <DetailField label="Số điện thoại" value={row.phone} grid={6} />
            </Grid>
          </DetailSection>

          <DetailSection title="Thông tin buổi tư vấn" icon={<EventAvailableOutlinedIcon />}>
            <Grid container spacing={1.5}>
              <DetailField label="Ngày hẹn" value={formatDate(row.appointmentDate)} grid={6} />
              <DetailField label="Giờ hẹn" value={formatTime(row.appointmentTime)} grid={6} />
              <DetailField label="Tư vấn viên" value={row.counsellorName || "N/A"} grid={6} />
              <DetailField label="Trạng thái" grid={6}>
                <StatusChip status={row.status} />
              </DetailField>
              {row.startDateOfWeek && row.endDateOfWeek && (
                <DetailField label="Tuần tư vấn" value={`${formatDate(row.startDateOfWeek)} – ${formatDate(row.endDateOfWeek)}`} grid={12} />
              )}
            </Grid>
          </DetailSection>

          <DetailSection title="Nội dung & ghi chú" icon={<StickyNote2OutlinedIcon />}>
            <Grid container spacing={1.5}>
              <DetailField label="Câu hỏi" value={row.question || "—"} grid={12} />
              <DetailField label="Ghi chú" value={row.note || "—"} grid={12} />
              {row.cancelReason && (
                <DetailField label="Lý do hủy" value={row.cancelReason} grid={12} />
              )}
            </Grid>
          </DetailSection>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function SkeletonRows({ count = PAGE_SIZE, cols = 7 }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: cols }).map((__, j) => (
        <TableCell key={j} align="center">
          <Skeleton variant="text" width="80%" sx={{ mx: "auto" }} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export default function SchoolConsultationPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const currentStatus = CAMPUS_OFFLINE_CONSULTATION_STATUSES[activeTab];

  const fetchData = useCallback(
    async (status, pageNum) => {
      setLoading(true);
      try {
        const response = await getCampusOfflineConsultations({ status, page: pageNum - 1, pageSize: PAGE_SIZE });
        const parsed = parseCampusOfflineConsultationsResponse(response);
        setRows(parsed.items);
        setTotalPages(parsed.totalPages);
        setTotalItems(parsed.totalItems);
      } catch (err) {
        enqueueSnackbar("Không thể tải danh sách lịch tư vấn.", { variant: "error" });
        setRows([]);
        setTotalPages(0);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(currentStatus, page);
  }, [fetchData, currentStatus, page]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const handlePageChange = (_, value) => setPage(value);

  const handleViewDetail = (row) => {
    setSelectedRow(row);
    setDetailOpen(true);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Card
        elevation={0}
        sx={{
          mb: 3, borderRadius: 3, overflow: "hidden",
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 52, height: 52, borderRadius: 2, display: "flex", alignItems: "center",
                justifyContent: "center", bgcolor: "rgba(255,255,255,0.15)",
              }}
            >
              <GroupsOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                Quản lý lịch hẹn
              </Typography>
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.75)", mt: 0.5 }}>
                Danh sách lịch hẹn tư vấn trực tiếp tại cơ sở
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #bfdbfe", mb: 2, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            bgcolor: "#eff6ff",
            "& .MuiTabs-indicator": { bgcolor: "#2563eb", height: 3 },
            "& .MuiTab-root": { fontWeight: 700, fontSize: 13, color: "#64748b", textTransform: "none", minHeight: 48, px: 2.5 },
            "& .Mui-selected": { color: "#1d4ed8" },
          }}
        >
          {CAMPUS_OFFLINE_CONSULTATION_STATUSES.map((s) => (
            <Tab key={s} label={CAMPUS_OFFLINE_TAB_LABELS[s]} />
          ))}
        </Tabs>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} elevation={0} sx={{ ...adminTableContainerSx, borderRadius: 2.5 }}>
        <Table size="small" sx={{ "& .MuiTableCell-root": { px: 1.5, py: 1 } }}>
          <TableHead>
            <TableRow sx={adminTableHeadRowSx}>
              {["STT", "Phụ huynh", "Số điện thoại", "Tư vấn viên", "Ngày hẹn", "Giờ hẹn", "Trạng thái", ""].map((h) => (
                <TableCell key={h} align="center" sx={adminTableHeadCellSx}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <SkeletonRows count={PAGE_SIZE} cols={8} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: "#94a3b8" }}>
                  <Stack alignItems="center" spacing={1}>
                    <EventAvailableOutlinedIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                      Không có lịch tư vấn nào
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={row.id ?? idx} sx={adminTableBodyRowSx}>
                  <TableCell align="center" sx={{ color: "#64748b", fontSize: 13 }}>
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: 13 }}>
                    {row.parentName || "—"}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: 13 }}>
                    {row.phone || "—"}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: 13 }}>
                    {row.counsellorName || "N/A"}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: 13 }}>
                    {formatDate(row.appointmentDate)}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: 13 }}>
                    {formatTime(row.appointmentTime)}
                  </TableCell>
                  <TableCell align="center">
                    <StatusChip status={row.status} />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetail(row)}
                      sx={{ color: "#3b82f6", "&:hover": { bgcolor: "rgba(59,130,246,0.1)" } }}
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
        <Typography sx={{ fontSize: 13, color: "#64748b" }}>
          {loading ? (
            <Skeleton width={120} />
          ) : (
            `Tổng ${totalItems} lịch tư vấn`
          )}
        </Typography>
        {!loading && totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="small"
            shape="rounded"
          />
        )}
      </Stack>

      <DetailModal open={detailOpen} row={selectedRow} onClose={() => setDetailOpen(false)} />
    </Box>
  );
}
