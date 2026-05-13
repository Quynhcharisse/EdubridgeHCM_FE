import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    Avatar,
    Box,
    Button,
    Container,
    Link,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import {Link as RouterLink, useNavigate, useSearchParams} from "react-router-dom";
import {enqueueSnackbar} from "notistack";
import AdmissionReservationDialog from "./school/AdmissionReservationDialog.jsx";
import {APP_PRIMARY_DARK, BRAND_NAVY} from "../../constants/homeLandingTheme";

function parseOfferingId(raw) {
    if (raw == null) return null;
    const n = Number(String(raw).trim());
    return Number.isFinite(n) && n > 0 ? n : null;
}

export default function ParentAdmissionHoldProfilePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const paramOfferingId = useMemo(() => {
        const fromQuery =
            searchParams.get("campusProgramOfferingId") ||
            searchParams.get("offeringId") ||
            searchParams.get("offering");
        return parseOfferingId(fromQuery);
    }, [searchParams]);

    const [idInput, setIdInput] = useState(() => (paramOfferingId != null ? String(paramOfferingId) : ""));
    const [activeOfferingId, setActiveOfferingId] = useState(paramOfferingId);
    const [dialogOpen, setDialogOpen] = useState(paramOfferingId != null);

    useEffect(() => {
        if (paramOfferingId != null) {
            setIdInput(String(paramOfferingId));
            setActiveOfferingId(paramOfferingId);
            setDialogOpen(true);
        }
    }, [paramOfferingId]);

    const offeringStub = useMemo(() => {
        if (activeOfferingId == null) return null;
        return {id: activeOfferingId};
    }, [activeOfferingId]);

    const openForm = useCallback(() => {
        const parsed = parseOfferingId(idInput);
        if (parsed == null) {
            enqueueSnackbar("Vui lòng nhập mã chương trình tuyển sinh (số nguyên dương).", {variant: "warning"});
            return;
        }
        setActiveOfferingId(parsed);
        setDialogOpen(true);
    }, [idInput]);

    const handleDialogClose = useCallback(() => {
        setDialogOpen(false);
    }, []);

    const handleSubmitted = useCallback(() => {
        navigate("/parent/admission-reservations");
    }, [navigate]);

    return (
        <Box sx={{bgcolor: "#f5f8fc", minHeight: "100%", pt: {xs: 14, md: 13}, pb: {xs: 2.5, md: 3}}}>
            <Container maxWidth="md">
                <Paper
                    elevation={0}
                    sx={{
                        mb: 2,
                        px: {xs: 2, md: 2.5},
                        py: {xs: 2.25, md: 2.6},
                        borderRadius: 2,
                        color: "#fff",
                        background: "linear-gradient(120deg, #2563eb 0%, #1d8ee8 58%, #10a6df 100%)",
                        boxShadow: "0 18px 42px rgba(37,99,235,0.2)",
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                        <Box>
                            <Typography variant="h5" sx={{fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.25}}>
                                Hồ sơ giữ chỗ
                            </Typography>
                            <Typography sx={{mt: 0.85, color: "rgba(255,255,255,0.86)", fontSize: 14, fontWeight: 400}}>
                                Điền và gửi hồ sơ xin giữ chỗ theo chương trình tuyển sinh đã chọn.
                            </Typography>
                        </Box>
                        <Avatar
                            sx={{
                                width: 42,
                                height: 42,
                                flex: "0 0 auto",
                                bgcolor: "rgba(255,255,255,0.18)",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.32)",
                            }}
                        >
                            <NoteAddOutlinedIcon fontSize="small" />
                        </Avatar>
                    </Stack>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        p: {xs: 2, md: 2.75},
                        bgcolor: "#fff",
                        border: "1px solid #dbe3ee",
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                    }}
                >
                    <Typography sx={{fontSize: 15, color: "#475569", mb: 2, lineHeight: 1.6}}>
                        Chọn hồ sơ học sinh, tải ảnh minh chứng theo yêu cầu của nhà trường và gửi đơn. Mã{" "}
                        <Box component="span" sx={{fontWeight: 700, color: BRAND_NAVY}}>
                            campusProgramOfferingId
                        </Box>{" "}
                        gắn với từng gói tuyển sinh; bạn có thể bắt đầu từ trang tìm trường hoặc nhập mã nếu đã có.
                    </Typography>

                    <Stack spacing={1.5} sx={{maxWidth: 420}}>
                        <TextField
                            label="Mã chương trình tuyển sinh (campusProgramOfferingId)"
                            value={idInput}
                            onChange={(e) => setIdInput(e.target.value)}
                            fullWidth
                            size="small"
                            type="text"
                            inputMode="numeric"
                            placeholder="Ví dụ: 12345"
                        />
                        <Typography variant="caption" sx={{color: "#64748b", display: "block", mt: -0.5}}>
                            Có thể mở sẵn form bằng URL{" "}
                            <Box component="code" sx={{fontSize: "0.8rem", bgcolor: "#f1f5f9", px: 0.5, borderRadius: 0.5}}>
                                /parent/admission-hold-profile?campusProgramOfferingId=…
                            </Box>
                        </Typography>
                        <Stack direction={{xs: "column", sm: "row"}} spacing={1.25} alignItems={{sm: "center"}}>
                            <Button
                                variant="contained"
                                onClick={openForm}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    px: 2.5,
                                    boxShadow: "0 8px 18px rgba(37,99,235,0.28)",
                                    bgcolor: APP_PRIMARY_DARK,
                                }}
                            >
                                Mở form nộp hồ sơ
                            </Button>
                            <Link
                                component={RouterLink}
                                to="/search-schools"
                                underline="hover"
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    fontWeight: 600,
                                    color: BRAND_NAVY,
                                    fontSize: 14,
                                }}
                            >
                                Tìm trường và chương trình
                                <OpenInNewRoundedIcon sx={{fontSize: 18}} />
                            </Link>
                        </Stack>
                    </Stack>
                </Paper>
            </Container>

            <AdmissionReservationDialog
                open={dialogOpen && offeringStub != null}
                onClose={handleDialogClose}
                onSubmitted={handleSubmitted}
                offering={offeringStub || undefined}
                campaign={{}}
                school={{}}
            />
        </Box>
    );
}
