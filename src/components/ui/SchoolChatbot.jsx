import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    Avatar,
    Fade,
    Slide
} from '@mui/material';
import {
    Send as SendIcon,
    Close as CloseIcon,
    SmartToy as BotIcon
} from '@mui/icons-material';
import axiosClient from '../../configs/APIConfig.jsx';
import { APP_PRIMARY_DARK, APP_PRIMARY_MAIN } from '../../constants/homeLandingTheme';
import {
    CHATBOT_TYPING_ANIMATION_CSS,
    ChatbotBotReplyContent,
    normalizeBotPayload
} from './chatbotShared.jsx';

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

const SchoolChatbot = () => {
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
    const [isInputDisabled, setIsInputDisabled] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const handleCopy = (key, text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1500);
        });
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    useEffect(() => {
        const handler = (e) => { if (e.detail !== 'school') setIsOpen(false); };
        window.addEventListener('app-chat-opened', handler);
        return () => window.removeEventListener('app-chat-opened', handler);
    }, []);

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
                url: '/campus/chat-with-AI-chatbot',
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
        } catch (error) {
            const status = error?.response?.status;
            const serverMessage = error?.response?.data?.message;
            const fallbackText = 'Hiện tại chatbot đang bận, vui lòng thử lại sau ít phút.';
            if (status === 400) setIsInputDisabled(true);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    text: status === 400 && serverMessage ? serverMessage : fallbackText,
                    details: [],
                    source: [],
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
                onClick={() => { setIsOpen(true); window.dispatchEvent(new CustomEvent('app-chat-opened', { detail: 'school' })); }}
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
                                {messages.map((message) => (
                                    <Box
                                        key={message.id}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
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
                                                bgcolor: message.sender === 'user' ? APP_PRIMARY_MAIN : '#ffffff',
                                                color: message.sender === 'user' ? 'white' : '#333',
                                                p: 1.5,
                                                borderRadius: 2,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                order: message.sender === 'user' ? 0 : 1
                                            }}
                                        >
                                            {message.sender === 'user' ? (
                                                message.text ? (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontSize: '0.875rem',
                                                            lineHeight: 1.5,
                                                            wordBreak: 'break-word'
                                                        }}
                                                    >
                                                        {message.text}
                                                    </Typography>
                                                ) : null
                                            ) : (
                                                <ChatbotBotReplyContent
                                                    message={message}
                                                    copiedKey={copiedKey}
                                                    onCopy={handleCopy}
                                                />
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
                                ))}
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
                                    disabled={isInputDisabled}
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
                                    disabled={inputMessage.trim() === '' || isSending || isInputDisabled}
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

            <style>{CHATBOT_TYPING_ANIMATION_CSS}</style>
        </>
    );
};

export default SchoolChatbot;
