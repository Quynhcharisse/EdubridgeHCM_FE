import { Box, Fade, IconButton, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export default function ImageLightboxOverlay({ open, url, title = "", onClose }) {
    const visible = Boolean(open && url);

    return (
        <Fade in={visible} timeout={220}>
            <Box
                onClick={onClose}
                role="presentation"
                sx={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 1500,
                    bgcolor: "rgba(15, 23, 42, 0.72)",
                    backdropFilter: "blur(4px)",
                    display: visible ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                }}
            >
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose?.();
                    }}
                    aria-label="Đóng xem ảnh"
                    sx={{
                        position: "fixed",
                        top: 16,
                        right: 16,
                        color: "#fff",
                        bgcolor: "rgba(255,255,255,0.12)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                    }}
                >
                    <CloseRoundedIcon />
                </IconButton>
                <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{ maxWidth: "min(92vw, 760px)", textAlign: "center" }}
                >
                    {title ? (
                        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 15, mb: 1.5, px: 2 }}>
                            {title}
                        </Typography>
                    ) : null}
                    {url ? (
                        <Box
                            component="img"
                            src={url}
                            alt={title || "Xem ảnh"}
                            sx={{
                                maxWidth: "100%",
                                maxHeight: "80vh",
                                objectFit: "contain",
                                borderRadius: 2,
                                boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
                            }}
                        />
                    ) : null}
                </Box>
            </Box>
        </Fade>
    );
}
