import React from 'react';
import {
    Box,
    CircularProgress,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    DeleteOutline as DeleteOutlineIcon,
    InsertPhoto as InsertPhotoIcon,
} from '@mui/icons-material';
import {HOC_BA_THCS_GRADE_LABELS} from './admissionSubmissionUtils.js';

export function AdmissionDocumentsSection({
    docs,
    docsLoading,
    docsError,
    cloudinaryReady,
    uploadingSlots,
    disabled,
    onPickFile,
    onRemoveSlot,
    emptyMessage = 'Không có hồ sơ nào cần nộp.',
}) {
    if (!cloudinaryReady) {
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
        <Stack spacing={2}>
            {docs.map((doc, docIndex) => (
                <DocumentItem
                    key={`${doc.code}-${docIndex}`}
                    ordinal={docIndex + 1}
                    doc={doc}
                    docIndex={docIndex}
                    uploadingSlots={uploadingSlots}
                    disabled={disabled}
                    onPickFile={onPickFile}
                    onRemoveSlot={onRemoveSlot}
                />
            ))}
        </Stack>
    );
}

function DocumentItem({ordinal, doc, docIndex, uploadingSlots, disabled, onPickFile, onRemoveSlot}) {
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
                        : {xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'minmax(0, 220px)'},
                    gap: 1.25,
                    maxWidth: isMultiSlot ? 'none' : {md: 240},
                }}
            >
                {doc.slots.map((url, slotIndex) => {
                    const slotKey = `${docIndex}-${slotIndex}`;
                    const isUploading = uploadingSlots.has(slotKey);
                    const slotLabel = isMultiSlot
                        ? HOC_BA_THCS_GRADE_LABELS[slotIndex] || `Ảnh ${slotIndex + 1}`
                        : 'Ảnh hồ sơ';
                    return (
                        <UploadSlot
                            key={slotKey}
                            label={slotLabel}
                            url={url}
                            uploading={isUploading}
                            disabled={disabled}
                            onPick={(file) => onPickFile(docIndex, slotIndex, file)}
                            onRemove={() => onRemoveSlot(docIndex, slotIndex)}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}

function UploadSlot({label, url, uploading, disabled, onPick, onRemove}) {
    const inputRef = React.useRef(null);
    const handleClickPicker = () => {
        if (disabled || uploading) return;
        inputRef.current?.click();
    };
    const handleChange = (e) => {
        const file = e.target.files?.[0] || null;
        e.target.value = '';
        if (file) onPick(file);
    };
    const hasUrl = typeof url === 'string' && url.trim() !== '';

    return (
        <Box>
            <Typography sx={{fontSize: '0.74rem', fontWeight: 600, color: '#64748b', mb: 0.4}}>
                {label}
            </Typography>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleChange}
                disabled={disabled || uploading}
            />
            {hasUrl ? (
                <Box
                    sx={{
                        position: 'relative',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: '1px solid rgba(34,197,94,0.45)',
                        bgcolor: '#f0fdf4',
                        aspectRatio: '1',
                    }}
                >
                    <Box
                        component="img"
                        src={url}
                        alt={label}
                        sx={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
                    />
                    {uploading ? (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                bgcolor: 'rgba(15,23,42,0.55)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <CircularProgress size={26} sx={{color: '#fff'}} />
                        </Box>
                    ) : (
                        <Stack direction="row" spacing={0.5} sx={{position: 'absolute', top: 6, right: 6}}>
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
                                        onClick={onRemove}
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
            ) : (
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
                        aspectRatio: '1',
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
