import {Box, Typography} from "@mui/material";

export function PaymentProofPreview({url, onPreview}) {
    if (!url) {
        return (
            <Typography variant="body2" sx={{color: "#64748b"}}>
                Chưa có minh chứng thanh toán.
            </Typography>
        );
    }
    return (
        <Box
            onClick={onPreview}
            sx={{
                maxWidth: 320,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                cursor: onPreview ? "pointer" : "default",
                bgcolor: "#fff",
            }}
        >
            <Box
                component="img"
                src={url}
                alt="Minh chứng thanh toán"
                loading="lazy"
                sx={{
                    width: "100%",
                    maxHeight: 280,
                    objectFit: "contain",
                    display: "block",
                    bgcolor: "#f8fafc",
                    transition: "transform .25s ease",
                    "&:hover": onPreview ? {transform: "scale(1.02)"} : undefined,
                }}
            />
            <Typography variant="caption" sx={{px: 1, py: 0.75, display: "block", color: "#475569", fontWeight: 700}}>
                Nhấn để phóng to
            </Typography>
        </Box>
    );
}
