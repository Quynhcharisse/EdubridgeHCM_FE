import React, {useState, useMemo} from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    TablePagination,
    Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import {enqueueSnackbar} from "notistack";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

// Mock data for UI demo
const initialMockCounselors = [
    {
        id: 1,
        fullName: "Nguyễn Thị Mai",
        email: "mai.nguyen@school.edu.vn",
        phone: "0901234567",
        specialty: "Tư vấn tuyển sinh THPT",
        shortBio: "5 năm kinh nghiệm tư vấn tuyển sinh.",
        avatar: null,
        status: "active",
    },
    {
        id: 2,
        fullName: "Trần Văn Minh",
        email: "minh.tran@school.edu.vn",
        phone: "0912345678",
        specialty: "Tư vấn chương trình quốc tế",
        shortBio: "Chuyên gia tư vấn chương trình song ngữ.",
        avatar: null,
        status: "active",
    },
    {
        id: 3,
        fullName: "Lê Thị Hương",
        email: "huong.le@school.edu.vn",
        phone: "0923456789",
        specialty: "Hỗ trợ phụ huynh",
        shortBio: "Tư vấn định hướng và hỗ trợ hồ sơ.",
        avatar: null,
        status: "inactive",
    },
];

const emptyForm = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    specialty: "",
    shortBio: "",
    status: true,
};

export default function SchoolCounselors() {
    const [counselors, setCounselors] = useState(initialMockCounselors);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
    const [selectedCounselor, setSelectedCounselor] = useState(null);
    const [formValues, setFormValues] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormValues((prev) => ({...prev, [name]: value}));
    };

    const handleStatusToggle = (e) => {
        setFormValues((prev) => ({...prev, status: e.target.checked}));
    };

    const filteredCounselors = useMemo(() => {
        let list = counselors;
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (c) =>
                    c.fullName?.toLowerCase().includes(q) ||
                    c.email?.toLowerCase().includes(q)
            );
        }
        if (statusFilter === "active") {
            list = list.filter((c) => c.status === "active");
        } else if (statusFilter === "inactive") {
            list = list.filter((c) => c.status === "inactive");
        }
        return list;
    }, [counselors, search, statusFilter]);

    const paginatedCounselors = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredCounselors.slice(start, start + rowsPerPage);
    }, [filteredCounselors, page, rowsPerPage]);

    const validateCreate = () => {
        const errors = {};
        if (!formValues.fullName?.trim()) errors.fullName = "Họ tên là bắt buộc";
        if (!formValues.email?.trim()) errors.email = "Email là bắt buộc";
        if (!formValues.password?.trim()) errors.password = "Mật khẩu là bắt buộc";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleOpenCreate = () => {
        setFormValues(emptyForm);
        setFormErrors({});
        setCreateModalOpen(true);
    };

    const handleCloseCreate = () => {
        setCreateModalOpen(false);
    };

    const handleCreateSubmit = () => {
        if (!validateCreate()) return;
        const newCounselor = {
            id: Date.now(),
            fullName: formValues.fullName.trim(),
            email: formValues.email.trim(),
            phone: formValues.phone?.trim() || "",
            specialty: formValues.specialty?.trim() || "",
            shortBio: formValues.shortBio?.trim() || "",
            status: formValues.status ? "active" : "inactive",
            avatar: null,
        };
        setCounselors((prev) => [newCounselor, ...prev]);
        enqueueSnackbar("Tạo tài khoản tư vấn viên thành công", {variant: "success"});
        setCreateModalOpen(false);
    };

    const handleOpenView = (counselor) => {
        setSelectedCounselor(counselor);
        setViewModalOpen(true);
    };

    const handleOpenEdit = (counselor) => {
        setSelectedCounselor(counselor);
        setFormValues({
            fullName: counselor.fullName || "",
            email: counselor.email || "",
            phone: counselor.phone || "",
            password: "",
            specialty: counselor.specialty || "",
            shortBio: counselor.shortBio || "",
            status: counselor.status === "active",
        });
        setFormErrors({});
        setEditModalOpen(true);
    };

    const handleEditSubmit = () => {
        if (!selectedCounselor) return;
        const errors = {};
        if (!formValues.fullName?.trim()) errors.fullName = "Họ tên là bắt buộc";
        if (!formValues.email?.trim()) errors.email = "Email là bắt buộc";
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setCounselors((prev) =>
            prev.map((c) =>
                c.id === selectedCounselor.id
                    ? {
                        ...c,
                        fullName: formValues.fullName.trim(),
                        email: formValues.email.trim(),
                        phone: formValues.phone?.trim() || "",
                        specialty: formValues.specialty?.trim() || "",
                        shortBio: formValues.shortBio?.trim() || "",
                        status: formValues.status ? "active" : "inactive",
                    }
                    : c
            )
        );
        enqueueSnackbar("Cập nhật tư vấn viên thành công", {variant: "success"});
        setEditModalOpen(false);
    };

    const handleOpenDisableConfirm = (counselor) => {
        setSelectedCounselor(counselor);
        setDisableConfirmOpen(true);
    };

    const handleDisableConfirm = () => {
        if (!selectedCounselor) return;
        setCounselors((prev) =>
            prev.map((c) =>
                c.id === selectedCounselor.id ? {...c, status: "inactive"} : c
            )
        );
        enqueueSnackbar("Đã vô hiệu hóa tài khoản tư vấn viên", {variant: "info"});
        setDisableConfirmOpen(false);
        setSelectedCounselor(null);
    };

    const getInitials = (name) => {
        if (!name?.trim()) return "?";
        return name
            .trim()
            .split(/\s+/)
            .map((s) => s[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    return (
        <Box sx={{display: "flex", flexDirection: "column", gap: 3, width: "100%"}}>
            {/* Header with gradient */}
            <Box
                sx={{
                    background: "linear-gradient(135deg, #7AA9EB 0%, #0D64DE 100%)",
                    borderRadius: 3,
                    p: 3,
                    color: "white",
                    boxShadow: "0 8px 32px rgba(13, 100, 222, 0.25)",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: {xs: "column", sm: "row"},
                        alignItems: {xs: "stretch", sm: "center"},
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                letterSpacing: "-0.02em",
                                textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}
                        >
                            Counselor Management
                        </Typography>
                        <Typography variant="body2" sx={{mt: 0.5, opacity: 0.95}}>
                            Quản lý tài khoản tư vấn viên của trường
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon/>}
                        onClick={handleOpenCreate}
                        sx={{
                            bgcolor: "rgba(255,255,255,0.95)",
                            color: "#0D64DE",
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            px: 3,
                            py: 1.5,
                            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                            "&:hover": {
                                bgcolor: "white",
                                boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                            },
                        }}
                    >
                        Create Counselor Account
                    </Button>
                </Box>
            </Box>

            {/* Search & Filter */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 20px rgba(13, 100, 222, 0.06)",
                }}
            >
                <CardContent sx={{p: 2.5}}>
                    <Stack
                        direction={{xs: "column", md: "row"}}
                        spacing={2}
                        alignItems={{xs: "stretch", md: "center"}}
                    >
                        <TextField
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            sx={{
                                flex: 1,
                                maxWidth: {md: 360},
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    bgcolor: "#f8fafc",
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{color: "#64748b"}}/>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <FormControl size="small" sx={{minWidth: 160}}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{borderRadius: 2, bgcolor: "#f8fafc"}}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 20px rgba(13, 100, 222, 0.06)",
                    overflow: "hidden",
                }}
            >
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{bgcolor: "#f8fafc"}}>
                                <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>
                                    Counselor
                                </TableCell>
                                <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>
                                    Email
                                </TableCell>
                                <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>
                                    Phone
                                </TableCell>
                                <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>
                                    Specialty
                                </TableCell>
                                <TableCell sx={{fontWeight: 700, color: "#1e293b", py: 2}}>
                                    Status
                                </TableCell>
                                <TableCell
                                    sx={{fontWeight: 700, color: "#1e293b", py: 2}}
                                    align="right"
                                >
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedCounselors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{py: 8}}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: 1.5,
                                            }}
                                        >
                                            <SupportAgentIcon
                                                sx={{fontSize: 56, color: "#cbd5e1"}}
                                            />
                                            <Typography
                                                variant="h6"
                                                sx={{color: "#64748b", fontWeight: 600}}
                                            >
                                                No counselors yet
                                            </Typography>
                                            <Typography variant="body2" sx={{color: "#94a3b8"}}>
                                                {filteredCounselors.length === 0 && counselors.length > 0
                                                    ? "No results match your search or filter."
                                                    : "Create your first counselor account to get started."}
                                            </Typography>
                                            {counselors.length === 0 && (
                                                <Button
                                                    variant="contained"
                                                    startIcon={<AddIcon/>}
                                                    onClick={handleOpenCreate}
                                                    sx={{
                                                        mt: 1,
                                                        borderRadius: 2,
                                                        textTransform: "none",
                                                        fontWeight: 600,
                                                        background: "linear-gradient(135deg, #7AA9EB 0%, #0D64DE 100%)",
                                                    }}
                                                >
                                                    Create Counselor Account
                                                </Button>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedCounselors.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        sx={{
                                            "&:hover": {
                                                bgcolor: "rgba(122, 169, 235, 0.04)",
                                            },
                                        }}
                                    >
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Avatar
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        bgcolor: "#7AA9EB",
                                                        fontSize: "0.875rem",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {getInitials(row.fullName)}
                                                </Avatar>
                                                <Typography
                                                    sx={{fontWeight: 600, color: "#1e293b"}}
                                                >
                                                    {row.fullName}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{color: "#64748b"}}>
                                            {row.email}
                                        </TableCell>
                                        <TableCell sx={{color: "#64748b"}}>
                                            {row.phone || "—"}
                                        </TableCell>
                                        <TableCell sx={{color: "#64748b"}}>
                                            {row.specialty || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Box
                                                component="span"
                                                sx={{
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 999,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    bgcolor:
                                                        row.status === "active"
                                                            ? "rgba(34, 197, 94, 0.12)"
                                                            : "rgba(148, 163, 184, 0.2)",
                                                    color:
                                                        row.status === "active"
                                                            ? "#16a34a"
                                                            : "#64748b",
                                                }}
                                            >
                                                {row.status === "active" ? "Active" : "Inactive"}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                justifyContent="flex-end"
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenView(row)}
                                                    sx={{
                                                        color: "#64748b",
                                                        "&:hover": {color: "#0D64DE", bgcolor: "rgba(13, 100, 222, 0.08)"},
                                                    }}
                                                    title="View"
                                                >
                                                    <VisibilityIcon fontSize="small"/>
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenEdit(row)}
                                                    sx={{
                                                        color: "#64748b",
                                                        "&:hover": {color: "#0D64DE", bgcolor: "rgba(13, 100, 222, 0.08)"},
                                                    }}
                                                    title="Edit"
                                                >
                                                    <EditIcon fontSize="small"/>
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDisableConfirm(row)}
                                                    disabled={row.status === "inactive"}
                                                    sx={{
                                                        color: "#64748b",
                                                        "&:hover": {color: "#dc2626", bgcolor: "rgba(220, 38, 38, 0.08)"},
                                                    }}
                                                    title="Disable"
                                                >
                                                    <BlockIcon fontSize="small"/>
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {filteredCounselors.length > 0 && (
                    <TablePagination
                        component="div"
                        count={filteredCounselors.length}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                        sx={{
                            borderTop: "1px solid #e2e8f0",
                            ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                                color: "#64748b",
                            },
                        }}
                    />
                )}
            </Card>

            {/* Create Counselor Modal */}
            <Dialog
                open={createModalOpen}
                onClose={handleCloseCreate}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: "0 24px 48px rgba(13, 100, 222, 0.12)",
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        color: "#1e293b",
                        borderBottom: "1px solid #e2e8f0",
                        pb: 2,
                    }}
                >
                    Create Counselor Account
                </DialogTitle>
                <DialogContent dividers sx={{pt: 2}}>
                    <Stack spacing={2.5}>
                        <TextField
                            label="Full Name"
                            name="fullName"
                            fullWidth
                            value={formValues.fullName}
                            onChange={handleChange}
                            error={!!formErrors.fullName}
                            helperText={formErrors.fullName}
                            required
                        />
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            fullWidth
                            value={formValues.email}
                            onChange={handleChange}
                            error={!!formErrors.email}
                            helperText={formErrors.email}
                            required
                        />
                        <TextField
                            label="Phone Number"
                            name="phone"
                            fullWidth
                            value={formValues.phone}
                            onChange={handleChange}
                        />
                        <TextField
                            label="Password"
                            name="password"
                            type="password"
                            fullWidth
                            value={formValues.password}
                            onChange={handleChange}
                            error={!!formErrors.password}
                            helperText={formErrors.password}
                            required
                        />
                        <TextField
                            label="Specialty / Field"
                            name="specialty"
                            fullWidth
                            value={formValues.specialty}
                            onChange={handleChange}
                            placeholder="e.g. Tư vấn tuyển sinh THPT"
                        />
                        <TextField
                            label="Short Bio"
                            name="shortBio"
                            fullWidth
                            multiline
                            rows={3}
                            value={formValues.shortBio}
                            onChange={handleChange}
                        />
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                py: 0.5,
                            }}
                        >
                            <Typography sx={{fontWeight: 500, color: "#1e293b"}}>
                                Status
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography
                                    variant="body2"
                                    sx={{color: formValues.status ? "#16a34a" : "#94a3b8"}}
                                >
                                    {formValues.status ? "Active" : "Inactive"}
                                </Typography>
                                <Switch
                                    checked={formValues.status}
                                    onChange={handleStatusToggle}
                                    sx={{
                                        "& .MuiSwitch-switchBase.Mui-checked": {
                                            color: "#0D64DE",
                                        },
                                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                            backgroundColor: "#0D64DE",
                                        },
                                    }}
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{px: 3, py: 2, borderTop: "1px solid #e2e8f0"}}>
                    <Button onClick={handleCloseCreate} color="inherit" sx={{textTransform: "none"}}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateSubmit}
                        variant="contained"
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                            background: "linear-gradient(135deg, #7AA9EB 0%, #0D64DE 100%)",
                        }}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Detail Modal */}
            <Dialog
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{sx: {borderRadius: 3}}}
            >
                <DialogTitle sx={{fontWeight: 700, color: "#1e293b"}}>
                    Counselor Details
                </DialogTitle>
                <DialogContent dividers>
                    {selectedCounselor && (
                        <Stack spacing={2}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: "#7AA9EB",
                                        fontSize: "1.25rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    {getInitials(selectedCounselor.fullName)}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{fontWeight: 600}}>
                                        {selectedCounselor.fullName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedCounselor.email}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Phone
                                </Typography>
                                <Typography variant="body1">
                                    {selectedCounselor.phone || "—"}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Specialty
                                </Typography>
                                <Typography variant="body1">
                                    {selectedCounselor.specialty || "—"}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Bio
                                </Typography>
                                <Typography variant="body1">
                                    {selectedCounselor.shortBio || "—"}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Status
                                </Typography>
                                <Box component="span" sx={{mt: 0.5, display: "inline-block"}}>
                                    <Box
                                        component="span"
                                        sx={{
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 999,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            bgcolor:
                                                selectedCounselor.status === "active"
                                                    ? "rgba(34, 197, 94, 0.12)"
                                                    : "rgba(148, 163, 184, 0.2)",
                                            color:
                                                selectedCounselor.status === "active"
                                                    ? "#16a34a"
                                                    : "#64748b",
                                        }}
                                    >
                                        {selectedCounselor.status === "active"
                                            ? "Active"
                                            : "Inactive"}
                                    </Box>
                                </Box>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewModalOpen(false)} color="inherit">
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<EditIcon/>}
                        onClick={() => {
                            setViewModalOpen(false);
                            handleOpenEdit(selectedCounselor);
                        }}
                        sx={{
                            background: "linear-gradient(135deg, #7AA9EB 0%, #0D64DE 100%)",
                            textTransform: "none",
                        }}
                    >
                        Edit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Modal */}
            <Dialog
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{sx: {borderRadius: 3}}}
            >
                <DialogTitle sx={{fontWeight: 700, color: "#1e293b"}}>
                    Edit Counselor
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{pt: 0.5}}>
                        <TextField
                            label="Full Name"
                            name="fullName"
                            fullWidth
                            value={formValues.fullName}
                            onChange={handleChange}
                            error={!!formErrors.fullName}
                            helperText={formErrors.fullName}
                        />
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            fullWidth
                            value={formValues.email}
                            onChange={handleChange}
                            error={!!formErrors.email}
                            helperText={formErrors.email}
                        />
                        <TextField
                            label="Phone Number"
                            name="phone"
                            fullWidth
                            value={formValues.phone}
                            onChange={handleChange}
                        />
                        <TextField
                            label="Specialty / Field"
                            name="specialty"
                            fullWidth
                            value={formValues.specialty}
                            onChange={handleChange}
                        />
                        <TextField
                            label="Short Bio"
                            name="shortBio"
                            fullWidth
                            multiline
                            rows={3}
                            value={formValues.shortBio}
                            onChange={handleChange}
                        />
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <Typography sx={{fontWeight: 500}}>Status</Typography>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography
                                    variant="body2"
                                    sx={{color: formValues.status ? "#16a34a" : "#94a3b8"}}
                                >
                                    {formValues.status ? "Active" : "Inactive"}
                                </Typography>
                                <Switch
                                    checked={formValues.status}
                                    onChange={handleStatusToggle}
                                    sx={{
                                        "& .MuiSwitch-switchBase.Mui-checked": {color: "#0D64DE"},
                                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                            backgroundColor: "#0D64DE",
                                        },
                                    }}
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{px: 3, py: 2}}>
                    <Button onClick={() => setEditModalOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditSubmit}
                        variant="contained"
                        sx={{
                            background: "linear-gradient(135deg, #7AA9EB 0%, #0D64DE 100%)",
                            textTransform: "none",
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Disable confirmation dialog */}
            <Dialog
                open={disableConfirmOpen}
                onClose={() => setDisableConfirmOpen(false)}
                PaperProps={{sx: {borderRadius: 3, p: 1}}}
            >
                <DialogTitle sx={{display: "flex", alignItems: "center", gap: 1}}>
                    <PersonOffIcon color="error"/> Disable Counselor Account
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to disable the account for{" "}
                        <strong>{selectedCounselor?.fullName}</strong>? They will no longer
                        be able to sign in or access the platform.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2}}>
                    <Button onClick={() => setDisableConfirmOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDisableConfirm}
                        startIcon={<BlockIcon/>}
                    >
                        Disable
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
