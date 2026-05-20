import React from 'react';
import {Box, CircularProgress, IconButton, Stack, Typography} from '@mui/material';
import {CheckCircle as CheckCircleIcon, PersonOutline as PersonOutlineIcon} from '@mui/icons-material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

const PAGE_SIZE = 6;

export default function StudentProfilePicker({
    students,
    loading,
    error,
    selectedStudentId,
    onSelect,
    disabled = false,
}) {
    const [page, setPage] = React.useState(0);

    React.useEffect(() => {
        if (!selectedStudentId) return;
        const idx = students.findIndex((s) => s.id === selectedStudentId);
        if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE));
    }, [selectedStudentId, students]);

    if (loading) {
        return (
            <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={18} sx={{color: '#2563eb'}} />
                <Typography sx={{fontSize: '0.92rem', color: '#475569'}}>Đang tải hồ sơ học sinh...</Typography>
            </Stack>
        );
    }

    if (!students.length) {
        return (
            <Typography sx={{fontSize: '0.92rem', color: '#b45309', fontWeight: 600}}>
                {error || 'Bạn chưa có hồ sơ học sinh nào.'}
            </Typography>
        );
    }

    const totalPages = Math.ceil(students.length / PAGE_SIZE);
    const safePage = Math.min(page, totalPages - 1);
    const visibleStudents = students.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

    return (
        <Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: students.length > 1 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                        md: students.length > 2 ? 'repeat(3, minmax(0, 1fr))' : undefined,
                    },
                    gridTemplateRows: totalPages > 1 ? 'repeat(2, auto)' : undefined,
                    gap: 1.25,
                    minHeight: totalPages > 1 ? 126 : undefined,
                    alignContent: 'start',
                }}
            >
                {visibleStudents.map((s) => {
                    const selected = selectedStudentId === s.id;
                    const onlyOne = students.length === 1;
                    return (
                        <Box
                            key={s.id}
                            role={onlyOne ? undefined : 'button'}
                            tabIndex={onlyOne || disabled ? -1 : 0}
                            onClick={() => {
                                if (onlyOne || disabled) return;
                                onSelect(s.id);
                            }}
                            onKeyDown={(e) => {
                                if (onlyOne || disabled) return;
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelect(s.id);
                                }
                            }}
                            sx={{
                                p: 1.35,
                                borderRadius: 2,
                                bgcolor: selected ? 'rgba(219,234,254,0.55)' : '#fff',
                                border: '1.5px solid',
                                borderColor: selected ? '#1d4ed8' : 'rgba(148,163,184,0.45)',
                                cursor: onlyOne || disabled ? 'default' : 'pointer',
                                transition: 'border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease',
                                boxShadow: selected ? '0 6px 16px rgba(37,99,235,0.12)' : '0 2px 8px rgba(15,23,42,0.04)',
                                '&:hover':
                                    onlyOne || disabled
                                        ? {}
                                        : {
                                              borderColor: selected ? '#1e3a8a' : 'rgba(59,130,246,0.6)',
                                              bgcolor: 'rgba(219,234,254,0.4)',
                                          },
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        bgcolor: selected ? 'rgba(59,130,246,0.18)' : '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <PersonOutlineIcon
                                        sx={{fontSize: 20, color: selected ? '#1e3a8a' : '#64748b'}}
                                    />
                                </Box>
                                <Box sx={{minWidth: 0, flex: 1}}>
                                    <Typography
                                        sx={{
                                            fontSize: '0.96rem',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            lineHeight: 1.3,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {s.name}
                                    </Typography>
                                    {s.subLabel ? (
                                        <Typography sx={{fontSize: '0.76rem', color: '#64748b', mt: 0.15}}>
                                            {s.subLabel}
                                        </Typography>
                                    ) : null}
                                </Box>
                                {!onlyOne ? (
                                    selected ? (
                                        <CheckCircleIcon sx={{fontSize: 20, color: '#1d4ed8'}} />
                                    ) : (
                                        <Box
                                            sx={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: '50%',
                                                border: '2px solid rgba(148,163,184,0.6)',
                                            }}
                                        />
                                    )
                                ) : null}
                            </Stack>
                        </Box>
                    );
                })}
            </Box>

            {totalPages > 1 ? (
                <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5} sx={{mt: 1}}>
                    <IconButton
                        size="small"
                        disabled={safePage === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        sx={{color: '#1d4ed8', '&.Mui-disabled': {color: 'rgba(148,163,184,0.5)'}}}
                    >
                        <ChevronLeftRoundedIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{fontSize: '0.82rem', fontWeight: 600, color: '#475569', minWidth: 40, textAlign: 'center'}}>
                        {safePage + 1} / {totalPages}
                    </Typography>
                    <IconButton
                        size="small"
                        disabled={safePage === totalPages - 1}
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        sx={{color: '#1d4ed8', '&.Mui-disabled': {color: 'rgba(148,163,184,0.5)'}}}
                    >
                        <ChevronRightRoundedIcon fontSize="small" />
                    </IconButton>
                </Stack>
            ) : null}
        </Box>
    );
}
