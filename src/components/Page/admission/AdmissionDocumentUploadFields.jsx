import React, {useState} from 'react';
import {
    Box,
    CircularProgress,
    IconButton,
    Modal,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Close as CloseIcon,
    CloudUpload as CloudUploadIcon,
    DeleteOutline as DeleteOutlineIcon,
    InsertPhoto as InsertPhotoIcon,
    ZoomIn as ZoomInIcon,
} from '@mui/icons-material';
import {HOC_BA_THCS_GRADE_LABELS} from './admissionSubmissionUtils.js';

function ImagePreviewModal({preview, onClose}) {
    const open = Boolean(preview?.url);
    return (
        <Modal
            open={open}
            onClose={onClose}
            slotProps={{
                backdrop: {
                    sx: {
                        backdropFilter: 'blur(8px)',
                        bgcolor: 'rgba(15, 23, 42, 0.5)',
                    },
                },
            }}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: {xs: 2, md: 3},
            }}
        >
            <Box sx={{position: 'relative', outline: 'none', maxWidth: '100%'}}>
                <IconButton
                    aria-label="Đóng"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: -44,
                        right: 0,
                        color: '#fff',
                        bgcolor: 'rgba(15, 23, 42, 0.55)',
                        '&:hover': {bgcolor: 'rgba(15, 23, 42, 0.75)'},
                    }}
                >
                    <CloseIcon />
                </IconButton>
                {preview?.title ? (
                    <Typography
                        sx={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 15,
                            mb: 1,
                            textAlign: 'center',
                            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                        }}
                    >
                        {preview.title}
                    </Typography>
                ) : null}
                <Box
                    component="img"
                    src={preview?.url || ''}
                    alt={preview?.title || 'Minh chứng'}
                    sx={{
                        display: 'block',
                        maxWidth: 'min(92vw, 900px)',
                        maxHeight: '82vh',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        borderRadius: 2,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
                    }}
                />
            </Box>
        </Modal>
    );
}

export function AdmissionDocumentsSection({
    docs,
    docsLoading,
    docsError,
    cloudinaryReady,
    uploadingSlots,
    disabled,
    onPickFile,
    onRemoveSlot,
    readOnly = false,
    emptyMessage = 'Không có hồ sơ nào cần nộp.',
}) {
    const [preview, setPreview] = useState(null);

    if (!readOnly && !cloudinaryReady) {
        return (
            <Box
                sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(254,242,242,0.95)',
                    border: '1px solid rgba(248,113,113,0.45)',
                }}
            >
                <Typography sx={{fontSize: '0.88rem', color: '#b91c1c', fontWeight: 600}}>
                    Chưa cấu hình Cloudinary (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET). Bạn sẽ
                    không thể tải ảnh hồ sơ lên.
                </Typography>
            </Box>
        );
    }

    if (docsLoading) {
        return (
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{py: 2}}>
                <CircularProgress size={22} sx={{color: '#2563eb'}} />
                <Typography sx={{fontSize: '0.95rem', color: '#475569'}}>Đang tải danh sách hồ sơ...</Typography>
            </Stack>
        );
    }

    if (docsError) {
        return (
            <Typography sx={{fontSize: '0.95rem', color: '#b45309', fontWeight: 600}}>{docsError}</Typography>
        );
    }

    if (!docs.length) {
        return <Typography sx={{fontSize: '0.95rem', color: '#475569'}}>{emptyMessage}</Typography>;
    }

    return (
        <>
            <Stack spacing={2}>
                {docs.map((doc, docIndex) => (
                    <DocumentItem
                        key={`${doc.code}-${docIndex}`}
                        ordinal={docIndex + 1}
                        doc={doc}
                        docIndex={docIndex}
                        uploadingSlots={uploadingSlots}
                        disabled={disabled}
                        readOnly={readOnly}
                        onPickFile={onPickFile}
                        onRemoveSlot={onRemoveSlot}
                        onViewImage={(url, title) => setPreview({url, title})}
                    />
                ))}
            </Stack>
            <ImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
        </>
    );
}

function DocumentItem({
    ordinal,
    doc,
    docIndex,
    uploadingSlots,
    disabled,
    readOnly,
    onPickFile,
    onRemoveSlot,
    onViewImage,
}) {
    const filledSlotCount = doc.slots.filter(
        (url) => typeof url === 'string' && url.trim() !== '',
    ).length;
    if (readOnly && filledSlotCount === 0) return null;

    const slotCount = doc.slots.length;
    const isMultiSlot = slotCount > 1;

    return (
        <Box
            sx={{
                p: {xs: 1.5, sm: 2},
                borderRadius: 2,
                bgcolor: '#fff',
                border: '1px solid rgba(191, 219, 254, 0.65)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.06)',
            }}
        >
            <Typography sx={{fontSize: '0.96rem', color: '#0f172a', lineHeight: 1.55, mb: 1}}>
                <Box component="span" sx={{fontWeight: 800, mr: 0.5}}>
                    {ordinal}.
                </Box>
                {doc.name}
                {doc.required ? (
                    <Box component="span" sx={{ml: 0.6, color: '#b91c1c', fontSize: '0.84rem', fontWeight: 600}}>
                        (bắt buộc)
                    </Box>
                ) : (
                    <Box component="span" sx={{ml: 0.6, color: '#64748b', fontSize: '0.84rem', fontWeight: 500}}>
                        (tùy chọn)
                    </Box>
                )}
                {isMultiSlot ? (
                    <Box component="span" sx={{ml: 0.6, color: '#64748b', fontSize: '0.86rem'}}>
                        — {slotCount} ảnh (Lớp 6 → Lớp 9)
                    </Box>
                ) : null}
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: isMultiSlot
                        ? {xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))'}
                        : {xs: 'auto'},
                    justifyContent: isMultiSlot ? undefined : 'flex-start',
                    gap: 1.25,
                }}
            >
                {doc.slots.map((url, slotIndex) => {
                    const hasUrl = typeof url === 'string' && url.trim() !== '';
                    if (readOnly && !hasUrl) return null;

                    const slotKey = `${docIndex}-${slotIndex}`;
                    const isUploading = uploadingSlots.has(slotKey);
                    const slotLabel = isMultiSlot
                        ? HOC_BA_THCS_GRADE_LABELS[slotIndex] || `Ảnh ${slotIndex + 1}`
                        : 'Ảnh hồ sơ';
                    const viewTitle = isMultiSlot ? `${doc.name} — ${slotLabel}` : doc.name;
                    return (
                        <UploadSlot
                            key={slotKey}
                            label={slotLabel}
                            url={url}
                            uploading={isUploading}
                            disabled={disabled}
                            readOnly={readOnly}
                            onPick={(file) => onPickFile(docIndex, slotIndex, file)}
                            onRemove={() => onRemoveSlot(docIndex, slotIndex)}
                            onView={() => onViewImage(url, viewTitle)}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}

function UploadSlot({label, url, uploading, disabled, readOnly, onPick, onRemove, onView}) {
    const inputRef = React.useRef(null);
    const handleClickPicker = (e) => {
        e?.stopPropagation?.();
        if (disabled || uploading) return;
        inputRef.current?.click();
    };
    const handleChange = (e) => {
        const file = e.target.files?.[0] || null;
        e.target.value = '';
        if (file) onPick(file);
    };
    const handleView = (e) => {
        e?.stopPropagation?.();
        if (uploading || !hasUrl) return;
        onView();
    };
    const hasUrl = typeof url === 'string' && url.trim() !== '';

    if (readOnly && !hasUrl) {
        return (
            <Box>
                <Typography sx={{fontSize: '0.74rem', fontWeight: 600, color: '#64748b', mb: 0.4}}>
                    {label}
                </Typography>
                <Box
                    sx={{
                        px: 1.5,
                        py: 1.25,
                        borderRadius: 1.5,
                        border: '1px dashed rgba(148,163,184,0.55)',
                        bgcolor: '#f8fafc',
                    }}
                >
                    <Typography sx={{fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600}}>
                        Chưa có
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Typography sx={{fontSize: '0.74rem', fontWeight: 600, color: '#64748b', mb: 0.4}}>
                {label}
            </Typography>
            {!readOnly ? (
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleChange}
                    disabled={disabled || uploading}
                />
            ) : null}
            {hasUrl ? (
                <Box
                    sx={{
                        position: 'relative',
                        display: 'inline-block',
                        maxWidth: '100%',
                        lineHeight: 0,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: '1px solid rgba(34, 197, 94, 0.45)',
                        bgcolor: '#fff',
                    }}
                >
                    <Box
                        component="button"
                        type="button"
                        onClick={handleView}
                        disabled={uploading}
                        aria-label={`Xem ảnh ${label}`}
                        sx={{
                            border: 'none',
                            p: 0,
                            m: 0,
                            display: 'block',
                            lineHeight: 0,
                            bgcolor: 'transparent',
                            cursor: uploading ? 'default' : 'zoom-in',
                        }}
                    >
                        <Box
                            component="img"
                            src={url}
                            alt={label}
                            sx={{
                                display: 'block',
                                maxWidth: 'min(100vw - 64px, 320px)',
                                maxHeight: 320,
                                width: 'auto',
                                height: 'auto',
                            }}
                        />
                    </Box>

                    {uploading ? (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                bgcolor: 'rgba(15,23,42,0.55)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2,
                            }}
                        >
                            <CircularProgress size={26} sx={{color: '#fff'}} />
                        </Box>
                    ) : readOnly ? (
                        <Tooltip title="Xem ảnh">
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={handleView}
                                    sx={{
                                        position: 'absolute',
                                        top: 6,
                                        right: 6,
                                        zIndex: 3,
                                        bgcolor: 'rgba(255,255,255,0.92)',
                                        color: '#1e3a8a',
                                        border: '1px solid rgba(148,163,184,0.4)',
                                        width: 28,
                                        height: 28,
                                    }}
                                >
                                    <ZoomInIcon sx={{fontSize: 16}} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    ) : (
                        <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{position: 'absolute', top: 6, right: 6, zIndex: 3}}
                        >
                            <Tooltip title="Xem ảnh">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={handleView}
                                        disabled={disabled}
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.92)',
                                            color: '#1e3a8a',
                                            border: '1px solid rgba(148,163,184,0.4)',
                                            width: 28,
                                            height: 28,
                                        }}
                                    >
                                        <ZoomInIcon sx={{fontSize: 16}} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Thay ảnh">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={handleClickPicker}
                                        disabled={disabled}
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.92)',
                                            color: '#1e3a8a',
                                            border: '1px solid rgba(148,163,184,0.4)',
                                            width: 28,
                                            height: 28,
                                        }}
                                    >
                                        <CloudUploadIcon sx={{fontSize: 16}} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Xóa ảnh">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove();
                                        }}
                                        disabled={disabled}
                                        sx={{
                                            bgcolor: 'rgba(254,242,242,0.95)',
                                            color: '#b91c1c',
                                            border: '1px solid rgba(248,113,113,0.4)',
                                            width: 28,
                                            height: 28,
                                        }}
                                    >
                                        <DeleteOutlineIcon sx={{fontSize: 16}} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Stack>
                    )}
                </Box>
            ) : readOnly ? null : (
                <Box
                    role="button"
                    tabIndex={disabled || uploading ? -1 : 0}
                    onClick={handleClickPicker}
                    onKeyDown={(e) => {
                        if (disabled || uploading) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClickPicker();
                        }
                    }}
                    sx={{
                        aspectRatio: '4 / 3',
                        minHeight: 120,
                        borderRadius: 1.5,
                        border: '2px dashed rgba(59,130,246,0.4)',
                        bgcolor: uploading ? 'rgba(219,234,254,0.4)' : '#f8fafc',
                        cursor: disabled || uploading ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.65 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.4,
                        transition: 'border-color 0.2s ease, background-color 0.2s ease',
                        '&:hover':
                            disabled || uploading
                                ? {}
                                : {
                                      borderColor: 'rgba(59,130,246,0.7)',
                                      bgcolor: 'rgba(219,234,254,0.45)',
                                  },
                    }}
                >
                    {uploading ? (
                        <>
                            <CircularProgress size={22} />
                            <Typography sx={{fontSize: '0.74rem', color: '#1e3a8a', fontWeight: 700}}>
                                Đang tải...
                            </Typography>
                        </>
                    ) : (
                        <>
                            <InsertPhotoIcon sx={{fontSize: 26, color: '#3b82f6'}} />
                            <Typography sx={{fontSize: '0.78rem', color: '#1e3a8a', fontWeight: 700}}>
                                Tải ảnh lên
                            </Typography>
                            <Typography sx={{fontSize: '0.7rem', color: '#94a3b8'}}>JPG / PNG / WEBP</Typography>
                        </>
                    )}
                </Box>
            )}
        </Box>
    );
}
