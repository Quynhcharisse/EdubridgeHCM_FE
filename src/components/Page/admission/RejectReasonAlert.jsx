import React from "react";
import {Box, Paper, Stack, Typography} from "@mui/material";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";

const VARIANT_STYLES = {
    profile: {
        border: "1px solid #f87171",
        borderLeft: "4px solid #dc2626",
        bgcolor: "#fef2f2",
        titleColor: "#991b1b",
        textColor: "#7f1d1d",
        iconColor: "#dc2626",
        boxShadow: "0 4px 14px rgba(220, 38, 38, 0.12)",
    },
    payment: {
        border: "1px solid #fda4af",
        borderLeft: "4px solid #e11d48",
        bgcolor: "#fff1f2",
        titleColor: "#9f1239",
        textColor: "#881337",
        iconColor: "#e11d48",
        boxShadow: "0 4px 14px rgba(225, 29, 72, 0.1)",
    },
};

export default function RejectReasonAlert({title, reason, variant = "profile"}) {
    const text = String(reason ?? "").trim();
    if (!text) return null;

    const style = VARIANT_STYLES[variant] ?? VARIANT_STYLES.profile;

    return (
        <Paper
            elevation={0}
            role="alert"
            sx={{
                p: 2,
                borderRadius: 2.5,
                border: style.border,
                borderLeft: style.borderLeft,
                bgcolor: style.bgcolor,
                boxShadow: style.boxShadow,
            }}
        >
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <ReportProblemRoundedIcon
                    sx={{color: style.iconColor, fontSize: 28, flexShrink: 0, mt: 0.1}}
                />
                <Box sx={{minWidth: 0}}>
                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            color: style.titleColor,
                            mb: 0.75,
                            letterSpacing: "0.01em",
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: "0.9375rem",
                            color: style.textColor,
                            lineHeight: 1.6,
                            fontWeight: 500,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {text}
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
}
