import React from "react";
import { IconButton } from "@mui/material";

export const TABLE_ACTION_ICON_SIZE = 18;

const TABLE_ACTION_BTN_BASE = {
    width: 32,
    height: 32,
    borderRadius: 1.25,
    border: "1px solid",
    p: 0,
    transition:
        "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.15s ease, box-shadow 0.15s ease",
    "& .MuiSvgIcon-root": { fontSize: TABLE_ACTION_ICON_SIZE },
    "&.Mui-disabled": { opacity: 0.45 },
};

const TABLE_ACTION_VARIANTS = {
    view: {
        color: "#1d4ed8",
        bgcolor: "#eff6ff",
        borderColor: "#bfdbfe",
        "&:hover": {
            bgcolor: "#dbeafe",
            borderColor: "#60a5fa",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
            transform: "translateY(-1px)",
        },
    },
    success: {
        color: "#047857",
        bgcolor: "#ecfdf5",
        borderColor: "#86efac",
        "&:hover": {
            bgcolor: "#d1fae5",
            borderColor: "#4ade80",
            boxShadow: "0 2px 8px rgba(5, 150, 105, 0.22)",
            transform: "translateY(-1px)",
        },
    },
    danger: {
        color: "#b91c1c",
        bgcolor: "#fef2f2",
        borderColor: "#fecaca",
        "&:hover": {
            bgcolor: "#fee2e2",
            borderColor: "#f87171",
            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.2)",
            transform: "translateY(-1px)",
        },
    },
};

export default function TableActionIconButton({
    variant = "view",
    disabled,
    onClick,
    "aria-label": ariaLabel,
    children,
    sx,
    ...rest
}) {
    return (
        <IconButton
            size="small"
            disabled={disabled}
            onClick={onClick}
            aria-label={ariaLabel}
            sx={{
                ...TABLE_ACTION_BTN_BASE,
                ...TABLE_ACTION_VARIANTS[variant],
                ...sx,
            }}
            {...rest}
        >
            {children}
        </IconButton>
    );
}
