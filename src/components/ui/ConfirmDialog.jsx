import React from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grow,
    IconButton,
} from "@mui/material";
import {alpha} from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

const DIALOG_KEYFRAMES = {
    "@keyframes confirmDialogBodyIn": {
        "0%": {opacity: 0, transform: "translateY(-14px)"},
        "100%": {opacity: 1, transform: "translateY(0)"},
    },
    "@keyframes confirmDialogActionsIn": {
        "0%": {opacity: 0, transform: "translateY(10px)"},
        "100%": {opacity: 1, transform: "translateY(0)"},
    },
};

export function ConfirmHighlight({children}) {
    return (
        <Box component="span" sx={{fontWeight: 700, color: "inherit"}}>
            {children}
        </Box>
    );
}

const ConfirmDialog = ({
    open,
    title,
    description,
    extraDescription,
    children,
    cancelText = "Hủy",
    confirmText = "Xác nhận",
    loading = false,
    onCancel,
    onConfirm,
    dialogSx,
    paperSx,
    backdropSx,
    titleSx,
    titleTextSx,
    contentSx,
    descriptionSx,
    confirmButtonSx,
    cancelButtonSx,
    variant = "classic",
    confirmColor = "primary",
    maxWidth = "sm",
}) => {
    const isModern = variant === "modern";
    const titleFontSize = isModern ? 32 : 20;
    const bodyFontSize = isModern ? 16 : 17;
    const subBodyFontSize = isModern ? 14 : 15;
    const btnHeight = isModern ? 48 : 34;
    const btnMinWidth = isModern ? 118 : 84;
    const btnPx = isModern ? 3.8 : 2.25;
    const btnFontSize = isModern ? 15 : 14;

    const confirmPalette =
        confirmColor === "error"
            ? {
                  background: "#dc2626",
                  boxShadow: "0 4px 12px rgba(220,38,38,0.32)",
                  "&:hover": {
                      background: "#b91c1c",
                      boxShadow: "0 6px 14px rgba(220,38,38,0.38)",
                  },
                  "&.Mui-disabled": {
                      color: "#fecaca",
                      background: "#fca5a5",
                      boxShadow: "none",
                  },
              }
            : {
                  background: "#3b82f6",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.38)",
                  "&:hover": {
                      background: "#2563eb",
                      boxShadow: "0 6px 14px rgba(37,99,235,0.44)",
                  },
                  "&.Mui-disabled": {
                      color: "#e2e8f0",
                      background: "#93c5fd",
                      boxShadow: "none",
                  },
              };

    const handleDialogClose = (event, reason) => {
        if (loading) return;
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
        }
        onCancel?.(event, reason);
    };

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            disableEscapeKeyDown
            aria-labelledby="confirm-dialog-title"
            maxWidth={maxWidth}
            fullWidth
            TransitionComponent={Grow}
            transitionDuration={{enter: 320, exit: 220}}
            sx={{
                ...DIALOG_KEYFRAMES,
                ...dialogSx,
                "& .MuiDialog-container": {
                    alignItems: "center",
                    justifyContent: "center",
                },
                "& .MuiBackdrop-root": {
                    backgroundColor: alpha("#0f172a", 0.36),
                    transition: "opacity 0.28s ease",
                    ...backdropSx,
                },
                "& .MuiPaper-root": {
                    borderRadius: 3,
                    boxShadow: isModern ? "0 20px 44px rgba(15,23,42,0.22)" : "0 20px 40px rgba(15,23,42,0.18)",
                    border: "1px solid #dbe5f3",
                    background: "#ffffff",
                    overflow: "hidden",
                    ...paperSx,
                },
            }}
        >
            <DialogTitle
                id="confirm-dialog-title"
                sx={{
                    cursor: "default",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    gap: 1,
                    pt: isModern ? 1.7 : 1.5,
                    pb: isModern ? 1.55 : 1.65,
                    px: isModern ? 3.2 : 2.5,
                    bgcolor: isModern ? "#eef4ff" : "#dbeafe",
                    borderBottom: "1px solid #93c5fd",
                    ...titleSx,
                }}
            >
                <Box
                    component="span"
                    sx={{
                        fontSize: titleFontSize,
                        lineHeight: 1.3,
                        fontWeight: 700,
                        color: "#1f2937",
                        pr: 1,
                        ...titleTextSx,
                    }}
                >
                    {title || "Xác nhận"}
                </Box>
                {!isModern && (
                    <IconButton
                        onClick={onCancel}
                        disabled={loading}
                        size="small"
                        aria-label="Đóng"
                        sx={{
                            color: "#9ca3af",
                            p: 0.35,
                            "&:hover": {bgcolor: "rgba(15,23,42,0.06)", color: "#6b7280"},
                        }}
                    >
                        <CloseIcon sx={{fontSize: 20}} />
                    </IconButton>
                )}
            </DialogTitle>
            {(description || extraDescription || children != null) && (
                <DialogContent
                    sx={(theme) => ({
                        textAlign: "left",
                        bgcolor: "#ffffff",
                        animation: open ? "confirmDialogBodyIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both" : "none",
                        "&.MuiDialogContent-root": {
                            padding: 0,
                            paddingLeft: theme.spacing(isModern ? 3.2 : 2.5),
                            paddingRight: theme.spacing(isModern ? 3.2 : 2.5),
                            paddingTop: theme.spacing(isModern ? 2 : 2.75),
                            paddingBottom: theme.spacing(children != null ? 2 : 2.25),
                        },
                        "& .MuiDialogContentText-root": {
                            margin: 0,
                        },
                        ...contentSx,
                    })}
                >
                    {description && (
                        <DialogContentText
                            component="div"
                            sx={{
                                fontSize: bodyFontSize,
                                fontWeight: 500,
                                lineHeight: 1.55,
                                color: "#374151",
                                mt: 0,
                                mb: extraDescription || children != null ? 1.25 : 0,
                                textAlign: "left",
                                ...descriptionSx,
                            }}
                        >
                            {description}
                        </DialogContentText>
                    )}
                    {extraDescription && (
                        <DialogContentText
                            component="div"
                            sx={{
                                fontSize: subBodyFontSize,
                                fontWeight: 400,
                                lineHeight: 1.55,
                                color: "#6b7280",
                                mb: children != null ? 2 : 0,
                                textAlign: "left",
                            }}
                        >
                            {extraDescription}
                        </DialogContentText>
                    )}
                    {children != null ? <Box sx={{mt: description || extraDescription ? 0 : 0.5}}>{children}</Box> : null}
                </DialogContent>
            )}
            <DialogActions
                sx={(theme) => ({
                    gap: 1,
                    justifyContent: "flex-end",
                    borderTop: "1px solid #e8eef5",
                    background: "#ffffff",
                    animation: open ? "confirmDialogActionsIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both" : "none",
                    padding: theme.spacing(1.5, 2.5, 2),
                })}
            >
                <Button
                    onClick={onCancel}
                    disabled={loading}
                    sx={{
                        textTransform: "none",
                        borderRadius: 1.5,
                        px: btnPx,
                        minWidth: btnMinWidth,
                        height: btnHeight,
                        fontSize: btnFontSize,
                        fontWeight: 600,
                        color: "#0f172a",
                        border: "1px solid rgba(15,23,42,0.14)",
                        backgroundColor: "#ffffff",
                        transition: "background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
                        "&:hover": {
                            backgroundColor: "#f8fafc",
                            borderColor: "rgba(15,23,42,0.22)",
                            transform: "translateY(-1px)",
                        },
                        "&:active": {transform: "translateY(0)"},
                        ...cancelButtonSx,
                    }}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    variant="contained"
                    disableElevation
                    sx={{
                        textTransform: "none",
                        px: btnPx + 0.35,
                        minWidth: btnMinWidth + 12,
                        height: btnHeight,
                        borderRadius: 1.5,
                        fontSize: btnFontSize,
                        fontWeight: 700,
                        transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
                        "&:hover:not(.Mui-disabled)": {transform: "translateY(-1px)"},
                        "&:active:not(.Mui-disabled)": {transform: "translateY(0)"},
                        ...confirmPalette,
                        ...confirmButtonSx,
                    }}
                    startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
