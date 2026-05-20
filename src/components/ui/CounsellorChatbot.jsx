import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    Avatar,
    Fade,
    Slide,
    Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    Close as CloseIcon,
    SmartToy as BotIcon,
    ContentCopy as CopyIcon
} from '@mui/icons-material';
import axiosClient from '../../configs/APIConfig.jsx';
import { APP_PRIMARY_DARK, APP_PRIMARY_MAIN } from '../../constants/homeLandingTheme';

const getStoredUser = () => {
    try {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) return null;
        return JSON.parse(rawUser);
    } catch {
        return null;
    }
};

const getUserAvatarUrl = (user) => {
    if (!user || typeof user !== 'object') return '';
    return String(
        user?.picture ||
            user?.avatarUrl ||
            user?.avatar ||
            user?.profileImageUrl ||
            user?.profilePicture ||
            user?.photoUrl ||
            user?.profile?.picture ||
            ''
    ).trim();
};

const getUserInitial = (user) => {
    const nameCandidate = String(user?.fullName || user?.name || user?.email || user?.username || '').trim();
    if (!nameCandidate) return 'U';
    return nameCandidate.charAt(0).toUpperCase();
};

const normalizeBotPayload = (responseData) => {
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
    const source = Array.isArray(body?.source)
        ? body.source
              .map((item) => {
                  if (item && typeof item === 'object') {
                      return {
                          fileName: String(item.fileName || '').trim(),
                          fileUrl: String(item.fileUrl || '').trim()
                      };
                  }
                  const url = String(item || '').trim();
                  return url ? { fileName: url, fileUrl: url } : null;
              })
              .filter(Boolean)
        : [];
    return { text, details, source };
};

const buildSourceViewUrl = (sourceUrl) => {
    const normalized = String(sourceUrl || '').trim();
    if (!normalized) return '';
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(normalized)}`;
};

const parseSourceUrls = (source) => {
    const raw = String(source || '').trim();
    if (!raw) return [];
    return raw.split(';').map((s) => s.trim()).filter(Boolean);
};

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

const getSourceLinkLabel = (rawUrl) => {
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

const CounsellorChatbot = () => {
    const user = getStoredUser();
    const userAvatarUrl = getUserAvatarUrl(user);
    const userInitial = getUserInitial(user);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: 'Xin chào! Tôi là trợ lý tư vấn tuyển sinh của EduBridgeHCM. Tôi có thể giúp gì cho bạn?',
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);

    const handleCopy = (key, text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1500);
        });
    };
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSendMessage = async (messageOverride) => {
        const resolvedMessage = typeof messageOverride === 'string' ? messageOverride : inputMessage;
        if (resolvedMessage.trim() === '' || isSending) return;

        const trimmedInput = resolvedMessage.trim();
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: trimmedInput, sender: 'user', timestamp: new Date() }
        ]);
        setInputMessage('');
        setIsSending(true);

        try {
            const response = await axiosClient.request({
                method: 'POST',
                url: '/counsellor/chat-with-AI-chatbot',
                data: { chatInput: trimmedInput }
            });

            const normalized = normalizeBotPayload(response.data);
            const hasBotContent =
                Boolean(normalized.text) ||
                (Array.isArray(normalized.details) && normalized.details.length > 0) ||
                (Array.isArray(normalized.source) && normalized.source.length > 0);
            if (!hasBotContent) return;

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    text: normalized.text,
                    details: normalized.details,
                    source: normalized.source,
                    sender: 'bot',
                    timestamp: new Date()
                }
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    text: 'Hiện tại chatbot đang bận, vui lòng thử lại sau ít phút.',
                    details: [],
                    source: '',
                    sender: 'bot',
                    timestamp: new Date()
                }
            ]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!user) return null;

    return (
        <>
            <Box
                onClick={() => setIsOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000,
                    cursor: 'pointer',
                    animation: isOpen ? 'none' : 'pulse 2s infinite',
                    display: isOpen ? 'none' : 'block'
                }}
            >
                <Paper
                    elevation={8}
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: APP_PRIMARY_MAIN,
                        color: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            bgcolor: APP_PRIMARY_DARK,
                            transform: 'scale(1.1)',
                            boxShadow: '0 8px 24px rgba(37,99,235,0.4)'
                        }
                    }}
                >
                    <BotIcon sx={{ fontSize: 32 }} />
                </Paper>
            </Box>

            <Fade in={isOpen}>
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        width: { xs: 'calc(100vw - 48px)', sm: 400 },
                        maxWidth: 'calc(100vw - 48px)',
                        height: { xs: 'calc(100vh - 120px)', sm: 600 },
                        maxHeight: { xs: 'calc(100vh - 120px)', sm: 600 },
                        zIndex: 1200,
                        display: isOpen ? 'block' : 'none'
                    }}
                >
                    <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
                        <Paper
                            elevation={24}
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 3,
                                overflow: 'hidden',
                                bgcolor: '#ffffff',
                                boxShadow: '0 12px 48px rgba(0,0,0,0.15)'
                            }}
                        >
                            {/* Header */}
                            <Box
                                sx={{
                                    bgcolor: APP_PRIMARY_MAIN,
                                    color: 'white',
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                                        <BotIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                            Trợ lý Tư vấn
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                                            Thường trực 24/7
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton
                                    onClick={() => setIsOpen(false)}
                                    sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            {/* Messages */}
                            <Box
                                sx={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    p: 2,
                                    bgcolor: '#f5f7fa',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    '&::-webkit-scrollbar': { width: '8px' },
                                    '&::-webkit-scrollbar-track': { bgcolor: '#f1f1f1', borderRadius: '4px' },
                                    '&::-webkit-scrollbar-thumb': {
                                        bgcolor: '#c1c1c1',
                                        borderRadius: '4px',
                                        '&:hover': { bgcolor: '#a8a8a8' }
                                    }
                                }}
                            >
                                {messages.map((message) => {
                                    const sourceUrls =
                                        message.sender === 'bot' && Array.isArray(message.source) ? message.source : [];
                                    return (
                                        <Box
                                            key={message.id}
                                            sx={{
                                                display: 'flex',
                                                justifyContent:
                                                    message.sender === 'user' ? 'flex-end' : 'flex-start',
                                                gap: 1.5,
                                                animation: 'fadeIn 0.3s ease'
                                            }}
                                        >
                                            {message.sender === 'bot' && (
                                                <Avatar
                                                    sx={{
                                                        bgcolor: APP_PRIMARY_MAIN,
                                                        width: 32,
                                                        height: 32,
                                                        order: 0
                                                    }}
                                                >
                                                    <BotIcon sx={{ fontSize: 18 }} />
                                                </Avatar>
                                            )}
                                            <Box
                                                sx={{
                                                    maxWidth: '75%',
                                                    bgcolor:
                                                        message.sender === 'user' ? APP_PRIMARY_MAIN : '#ffffff',
                                                    color: message.sender === 'user' ? 'white' : '#333',
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    order: message.sender === 'user' ? 0 : 1
                                                }}
                                            >
                                                {message.text && (
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
                                                        {message.sender === 'bot' && (
                                                            <Tooltip title={copiedKey === `${message.id}-text` ? 'Đã copy!' : 'Copy'} placement="top">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleCopy(`${message.id}-text`, message.text)}
                                                                    sx={{ p: 0.3, mt: 0.2, flexShrink: 0, color: '#94a3b8', '&:hover': { color: APP_PRIMARY_MAIN } }}
                                                                >
                                                                    <CopyIcon sx={{ fontSize: 13 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                )}
                                                {message.sender === 'bot' &&
                                                    Array.isArray(message.details) &&
                                                    message.details.length > 0 && (
                                                        <Box
                                                            sx={{
                                                                mt: 1,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: 0.5
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                                    Chi tiết
                                                                </Typography>
                                                                <Tooltip title={copiedKey === `${message.id}-details` ? 'Đã copy!' : 'Copy tất cả'} placement="top">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleCopy(
                                                                            `${message.id}-details`,
                                                                            message.details.map(d => d.label ? `${d.label}: ${d.value}` : `• ${d.value}`).join('\n')
                                                                        )}
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
                                                                            sx={{
                                                                                display: 'block',
                                                                                fontSize: '0.75rem',
                                                                                lineHeight: 1.45,
                                                                                color: '#334155'
                                                                            }}
                                                                        >
                                                                            <Box
                                                                                component="span"
                                                                                sx={{
                                                                                    fontWeight: 700,
                                                                                    color: '#0f172a'
                                                                                }}
                                                                            >
                                                                                {detail.label}
                                                                            </Box>
                                                                            {' : '}
                                                                            {detail.value}
                                                                        </Typography>
                                                                    ) : (
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                display: 'block',
                                                                                fontSize: '0.75rem',
                                                                                lineHeight: 1.45,
                                                                                color: '#334155'
                                                                            }}
                                                                        >
                                                                            • {detail.value}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    )}
                                                {sourceUrls.length > 0 && (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.9 }}>
                                                        <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                            Tài liệu tham khảo
                                                        </Typography>
                                                        {sourceUrls.map((src, idx) => {
                                                            const key = `${message.id}-source-${idx}`;
                                                            const label = src.fileName || getSourceLinkLabel(src.fileUrl) || src.fileUrl;
                                                            return (
                                                                <Box
                                                                    key={key}
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 0.5,
                                                                        px: 1,
                                                                        py: 0.5,
                                                                        borderRadius: 1.5,
                                                                        bgcolor: 'rgba(59,130,246,0.08)',
                                                                        border: '1px solid rgba(59,130,246,0.18)'
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        component="a"
                                                                        href={buildSourceViewUrl(src.fileUrl)}
                                                                        title={src.fileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        variant="caption"
                                                                        sx={{
                                                                            flex: 1,
                                                                            fontSize: '0.75rem',
                                                                            textDecoration: 'underline',
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
                                                )}
                                                <Typography
                                                    variant="caption"
                                                    sx={{ display: 'block', mt: 0.5, opacity: 0.7, fontSize: '0.7rem' }}
                                                >
                                                    {message.timestamp.toLocaleTimeString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </Typography>
                                            </Box>
                                            {message.sender === 'user' && (
                                                <Avatar
                                                    src={userAvatarUrl || undefined}
                                                    sx={{
                                                        bgcolor: '#dbeafe',
                                                        color: APP_PRIMARY_MAIN,
                                                        width: 32,
                                                        height: 32,
                                                        order: 1
                                                    }}
                                                >
                                                    {!userAvatarUrl && (
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                                            {userInitial}
                                                        </Typography>
                                                    )}
                                                </Avatar>
                                            )}
                                        </Box>
                                    );
                                })}
                                {isSending && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'flex-start',
                                            gap: 1.5,
                                            animation: 'fadeIn 0.3s ease'
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor: APP_PRIMARY_MAIN,
                                                width: 32,
                                                height: 32,
                                                flexShrink: 0
                                            }}
                                        >
                                            <BotIcon sx={{ fontSize: 18 }} />
                                        </Avatar>
                                        <Box
                                            sx={{
                                                maxWidth: '75%',
                                                bgcolor: '#ffffff',
                                                p: 1.5,
                                                borderRadius: 2,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.75,
                                                    minHeight: 22
                                                }}
                                            >
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    sx={{
                                                        fontSize: '0.875rem',
                                                        lineHeight: 1.5,
                                                        color: '#94a3b8',
                                                        fontStyle: 'italic',
                                                        animation: 'typingLabelPulse 2s ease-in-out infinite'
                                                    }}
                                                >
                                                    Đang trả lời
                                                </Typography>
                                                <Box
                                                    component="span"
                                                    aria-hidden
                                                    sx={{
                                                        display: 'inline-flex',
                                                        gap: '5px',
                                                        alignItems: 'center',
                                                        height: 16
                                                    }}
                                                >
                                                    {[0, 1, 2].map((i) => (
                                                        <Box
                                                            key={i}
                                                            component="span"
                                                            sx={{
                                                                width: 5,
                                                                height: 5,
                                                                borderRadius: '50%',
                                                                bgcolor: '#94a3b8',
                                                                animation: 'typingDots 1.1s ease-in-out infinite',
                                                                animationDelay: `${i * 0.18}s`
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                                <div ref={messagesEndRef} />
                            </Box>

                            {/* Input */}
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: '#ffffff',
                                    borderTop: '1px solid #e5e7eb',
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'flex-end'
                                }}
                            >
                                <TextField
                                    inputRef={inputRef}
                                    fullWidth
                                    multiline
                                    maxRows={4}
                                    placeholder="Nhập câu hỏi của bạn..."
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: '#f5f7fa',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: APP_PRIMARY_MAIN },
                                            '&.Mui-focused fieldset': { borderColor: APP_PRIMARY_MAIN }
                                        }
                                    }}
                                />
                                <IconButton
                                    onClick={handleSendMessage}
                                    disabled={inputMessage.trim() === '' || isSending}
                                    sx={{
                                        bgcolor: APP_PRIMARY_MAIN,
                                        color: 'white',
                                        width: 40,
                                        height: 40,
                                        '&:hover': { bgcolor: APP_PRIMARY_DARK },
                                        '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' }
                                    }}
                                >
                                    <SendIcon />
                                </IconButton>
                            </Box>
                        </Paper>
                    </Slide>
                </Box>
            </Fade>

            {isOpen && (
                <Box
                    onClick={() => setIsOpen(false)}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.3)',
                        zIndex: 1199,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            <style>
                {`
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
                `}
            </style>
        </>
    );
};

export default CounsellorChatbot;
