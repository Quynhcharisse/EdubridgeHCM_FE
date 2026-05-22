import React from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { ContentCopy as CopyIcon, InsertDriveFileOutlined as InsertDriveFileOutlinedIcon } from '@mui/icons-material';
import { APP_PRIMARY_MAIN } from '../../constants/homeLandingTheme';

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i;

export const isImageSourceUrl = (url) => IMAGE_EXT_RE.test(String(url || '').trim());

export const normalizeBotPayload = (responseData) => {
    const body = responseData?.body ?? responseData;
    const text = String(body?.summary || body?.message || body?.text || body?.output || '').trim();
    const details = Array.isArray(body?.details)
        ? body.details
              .map((item) => {
                  if (item && typeof item === 'object') {
                      const label = String(item?.label || '').trim();
                      const value = String(item?.value || '').trim();
                      if (!value) return null;
                      return { label, value };
                  }
                  const textValue = String(item || '').trim();
                  if (!textValue) return null;
                  return { label: '', value: textValue };
              })
              .filter(Boolean)
        : [];
    const source = normalizeSourceList(body?.source);
    return { text, details, source };
};

export const buildSourceViewUrl = (sourceUrl) => {
    const normalized = String(sourceUrl || '').trim();
    if (!normalized) return '';
    if (isImageSourceUrl(normalized)) return normalized;
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(normalized)}`;
};

export const parseSourceUrls = (source) => {
    const raw = String(source || '').trim();
    if (!raw) return [];
    return raw.split(';').map((s) => s.trim()).filter(Boolean);
};

export function normalizeSourceList(source) {
    if (Array.isArray(source)) {
        return source
            .map((item) => {
                if (item && typeof item === 'object') {
                    return {
                        fileName: String(item.fileName || '').trim(),
                        fileUrl: String(item.fileUrl || '').trim()
                    };
                }
                const url = String(item || '').trim();
                return url ? { fileName: '', fileUrl: url } : null;
            })
            .filter((item) => Boolean(item?.fileUrl));
    }
    return parseSourceUrls(source).map((url) => ({ fileName: '', fileUrl: url }));
}

const TRAILING_UUID_RE = /_?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const stripTrailingUuid = (segment) => {
    let s = String(segment || '').trim();
    if (!s) return s;
    let prev;
    do {
        prev = s;
        s = s.replace(TRAILING_UUID_RE, '');
    } while (s !== prev);
    return s;
};

const humanizeStorageSegment = (segment) => {
    const core = stripTrailingUuid(String(segment || '').trim()).replace(/\.[^.]+$/i, '');
    return core.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
};

export const getSourceLinkLabel = (rawUrl) => {
    const fallback = String(rawUrl || '').trim();
    if (!fallback) return '';
    try {
        const u = new URL(fallback);
        const parts = u.pathname.split('/').filter(Boolean);
        const eduIdx = parts.findIndex((p) => p.toLowerCase() === 'edubridge');
        const segs = eduIdx >= 0 ? parts.slice(eduIdx + 1) : parts;
        if (segs.length === 0) return fallback;
        const last = segs[segs.length - 1];
        const lastIsFile = /\.[a-z0-9]{2,8}$/i.test(last);
        const fileExt = lastIsFile ? (last.match(/(\.[^./]+)$/i)?.[1] || '').toLowerCase() : '';
        const lastNoExt = last.replace(/\.[^.]+$/i, '');
        const baseCore = stripTrailingUuid(lastNoExt);
        let chosen = lastNoExt;
        if (lastIsFile && segs.length >= 2) {
            const parent = segs[segs.length - 2];
            chosen = /^(school|campus)_info$/i.test(baseCore) ? parent : lastNoExt;
        } else if (!lastIsFile) {
            chosen = last;
        }
        const label = humanizeStorageSegment(chosen);
        if (!label) return fallback;
        const withExt = fileExt ? `${label}${fileExt}` : label;
        if (withExt.length > 120) return `${withExt.slice(0, 117)}…`;
        return withExt;
    } catch {
        return fallback;
    }
};

const chatDocRowElevatedSx = {
    border: '1px solid rgba(15, 23, 42, 0.12)',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.07), 0 8px 24px -6px rgba(15, 23, 42, 0.18)',
    transition: 'box-shadow 0.18s ease, transform 0.18s ease',
    '&:hover': {
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.1), 0 12px 32px -8px rgba(15, 23, 42, 0.26)',
        transform: 'translateY(-1px)'
    },
    '&:hover .chat-doc-name': { textDecoration: 'underline' }
};

export function ChatbotBotReplyContent({ message, copiedKey, onCopy }) {
    const sourceList = normalizeSourceList(message?.source);
    const imageSources = sourceList.filter((src) => isImageSourceUrl(src.fileUrl));
    const docSources = sourceList.filter((src) => !isImageSourceUrl(src.fileUrl));

    return (
        <>
            {message.text ? (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            flex: 1,
                            fontSize: '0.875rem',
                            lineHeight: 1.5,
                            wordBreak: 'break-word'
                        }}
                    >
                        {message.text}
                    </Typography>
                    <Tooltip title={copiedKey === `${message.id}-text` ? 'Đã copy!' : 'Copy'} placement="top">
                        <IconButton
                            size="small"
                            onClick={() => onCopy(`${message.id}-text`, message.text)}
                            sx={{ p: 0.3, mt: 0.2, flexShrink: 0, color: '#94a3b8', '&:hover': { color: APP_PRIMARY_MAIN } }}
                        >
                            <CopyIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            ) : null}
            {Array.isArray(message.details) && message.details.length > 0 ? (
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography
                            variant="caption"
                            sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}
                        >
                            Chi tiết
                        </Typography>
                        <Tooltip title={copiedKey === `${message.id}-details` ? 'Đã copy!' : 'Copy tất cả'} placement="top">
                            <IconButton
                                size="small"
                                onClick={() =>
                                    onCopy(
                                        `${message.id}-details`,
                                        message.details.map((d) => (d.label ? `${d.label}: ${d.value}` : `• ${d.value}`)).join('\n')
                                    )
                                }
                                sx={{ p: 0.3, color: '#94a3b8', '&:hover': { color: APP_PRIMARY_MAIN } }}
                            >
                                <CopyIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    {message.details.map((detail, index) => (
                        <Box
                            key={`${message.id}-detail-${index}`}
                            sx={{
                                px: 1,
                                py: 0.6,
                                borderRadius: 1.2,
                                bgcolor: 'rgba(59,130,246,0.08)',
                                border: '1px solid rgba(59,130,246,0.18)'
                            }}
                        >
                            {detail.label ? (
                                <Typography
                                    variant="caption"
                                    sx={{ display: 'block', fontSize: '0.75rem', lineHeight: 1.45, color: '#334155' }}
                                >
                                    <Box component="span" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {detail.label}
                                    </Box>
                                    {' : '}
                                    {detail.value}
                                </Typography>
                            ) : (
                                <Typography
                                    variant="caption"
                                    sx={{ display: 'block', fontSize: '0.75rem', lineHeight: 1.45, color: '#334155' }}
                                >
                                    • {detail.value}
                                </Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            ) : null}
            {imageSources.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.9 }}>
                    <Typography
                        variant="caption"
                        sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                        Hình ảnh tham khảo
                    </Typography>
                    {imageSources.map((src, idx) => {
                        const key = `${message.id}-image-${idx}`;
                        const label = src.fileName || getSourceLinkLabel(src.fileUrl) || 'Hình ảnh';
                        return (
                            <Box
                                key={key}
                                component="a"
                                href={src.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={label}
                                sx={{
                                    display: 'block',
                                    lineHeight: 0,
                                    borderRadius: 1.5,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(59,130,246,0.18)',
                                    bgcolor: 'rgba(59,130,246,0.04)'
                                }}
                            >
                                <Box
                                    component="img"
                                    src={src.fileUrl}
                                    alt={label}
                                    sx={{
                                        display: 'block',
                                        width: '100%',
                                        maxWidth: 280,
                                        height: 'auto',
                                        maxHeight: 220,
                                        objectFit: 'contain'
                                    }}
                                />
                            </Box>
                        );
                    })}
                </Box>
            ) : null}
            {docSources.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: imageSources.length > 0 ? 0.75 : 0.9 }}>
                    <Typography
                        variant="caption"
                        sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                        Tài liệu tham khảo
                    </Typography>
                    {docSources.map((src, idx) => {
                        const key = `${message.id}-source-${idx}`;
                        const label = src.fileName || getSourceLinkLabel(src.fileUrl) || src.fileUrl;
                        return (
                            <Box
                                key={key}
                                component="a"
                                href={buildSourceViewUrl(src.fileUrl)}
                                title={src.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 0.85,
                                    textDecoration: 'none',
                                    width: 'max-content',
                                    maxWidth: '100%',
                                    py: 0.65,
                                    px: 1.1,
                                    borderRadius: 2,
                                    bgcolor: '#ffffff',
                                    color: '#0f172a',
                                    ...chatDocRowElevatedSx
                                }}
                            >
                                <InsertDriveFileOutlinedIcon sx={{ fontSize: 22, flexShrink: 0, color: '#475569' }} />
                                <Typography
                                    className="chat-doc-name"
                                    variant="caption"
                                    sx={{
                                        flex: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        lineHeight: 1.35,
                                        color: APP_PRIMARY_MAIN,
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {label}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            ) : null}
        </>
    );
}

export const CHATBOT_TYPING_ANIMATION_CSS = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes typingDots {
        0%, 70%, 100% {
            transform: translateY(0);
            opacity: 0.35;
        }
        35% {
            transform: translateY(-5px);
            opacity: 1;
        }
    }
    @keyframes typingLabelPulse {
        0%, 100% { opacity: 0.72; }
        50% { opacity: 1; }
    }
`;
