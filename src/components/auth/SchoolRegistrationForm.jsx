import React, {useState} from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Stack,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Grid,
} from '@mui/material';
import {checkTaxCode, registerSchool} from '../../services/AuthService';
import backgroundLogin from '../../assets/backgroundLogin.png';
import {useNavigate} from 'react-router-dom';

const SchoolRegistrationForm = ({email, onBack}) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Tax code input, 2: Registration form
    const [taxCode, setTaxCode] = useState('');
    const [taxCodeError, setTaxCodeError] = useState('');
    const [isCheckingTaxCode, setIsCheckingTaxCode] = useState(false);
    const [taxCodeData, setTaxCodeData] = useState(null);
    
    // Form data
    const [formData, setFormData] = useState({
        schoolName: '',
        schoolAddress: '',
        campusName: '',
        campusAddress: '',
        taxCode: '',
        websiteUrl: '',
        logoUrl: '',
        foundingDate: '',
        representativeName: '',
        hotline: '',
        businessLicenseUrl: '',
    });
    
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTaxCodeCheck = async () => {
        if (!taxCode.trim()) {
            setTaxCodeError('Vui lòng nhập mã số thuế');
            return;
        }

        setIsCheckingTaxCode(true);
        setTaxCodeError('');

        try {
            const data = await checkTaxCode(taxCode.trim());
            
            // Check if tax code is valid (code '00' means success)
            if (data.code === '00' && data.data) {
                // Tax code is valid
                setTaxCodeData(data.data);
                setFormData(prev => ({
                    ...prev,
                    taxCode: taxCode.trim(),
                    // Map fields from API response to form fields
                    schoolName: data.data.name || data.data.companyName || prev.schoolName,
                    schoolAddress: data.data.address || data.data.companyAddress || prev.schoolAddress,
                    representativeName: data.data.representative || data.data.representativeName || prev.representativeName,
                }));
                setStep(2);
            } else {
                // Tax code is invalid
                setTaxCodeError(data.desc || 'Mã số thuế không hợp lệ');
            }
        } catch (error) {
            console.error('Error checking tax code:', error);
            setTaxCodeError('Có lỗi xảy ra khi kiểm tra mã số thuế. Vui lòng thử lại.');
        } finally {
            setIsCheckingTaxCode(false);
        }
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.schoolName.trim()) {
            errors.schoolName = 'Tên trường là bắt buộc';
        }
        if (!formData.schoolAddress.trim()) {
            errors.schoolAddress = 'Địa chỉ trường là bắt buộc';
        }
        if (!formData.campusName.trim()) {
            errors.campusName = 'Tên cơ sở là bắt buộc';
        }
        if (!formData.campusAddress.trim()) {
            errors.campusAddress = 'Địa chỉ cơ sở là bắt buộc';
        }
        if (!formData.taxCode.trim()) {
            errors.taxCode = 'Mã số thuế là bắt buộc';
        }
        if (!formData.representativeName.trim()) {
            errors.representativeName = 'Tên người đại diện là bắt buộc';
        }
        if (!formData.hotline.trim()) {
            errors.hotline = 'Hotline là bắt buộc';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const registerPayload = {
                email: email,
                role: 'SCHOOL',
                schoolRequest: {
                    schoolName: formData.schoolName.trim(),
                    schoolAddress: formData.schoolAddress.trim(),
                    campusName: formData.campusName.trim(),
                    campusAddress: formData.campusAddress.trim(),
                    taxCode: formData.taxCode.trim(),
                    websiteUrl: formData.websiteUrl.trim() || null,
                    logoUrl: formData.logoUrl.trim() || null,
                    foundingDate: formData.foundingDate || null,
                    representativeName: formData.representativeName.trim(),
                    hotline: formData.hotline.trim(),
                    businessLicenseUrl: formData.businessLicenseUrl.trim() || null,
                    status: 'ACCOUNT_PENDING_VERIFY',
                    rejectionReason: null,
                }
            };

            const response = await registerSchool(registerPayload);
            
            if (response) {
                alert('Đăng ký thành công! Vui lòng đợi admin xác thực tài khoản.');
                navigate('/login');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                top: '64px',
                left: 0,
                right: 0,
                bottom: 0,
                height: 'calc(100vh - 64px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: {xs: 2, md: 3},
                px: {xs: 2, md: 0},
                backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.55), rgba(15,23,42,0.35)), url(${backgroundLogin})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
                overflow: 'auto',
            }}
        >
            <Container maxWidth="md">
                <Paper
                    elevation={8}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        background: 'radial-gradient(circle at top left, rgba(239,246,255,0.96) 0, rgba(239,246,255,0.98) 40%, #ffffff 100%)',
                        border: '1px solid #dbeafe',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {step === 1 ? (
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="h5" sx={{fontWeight: 700, color: '#1e293b'}}>
                                    Nhập mã số thuế
                                </Typography>
                                <Typography variant="body2" sx={{color: '#64748b', mt: 0.5}}>
                                    Vui lòng nhập mã số thuế của trường để hệ thống tự động điền thông tin.
                                </Typography>
                            </Box>

                            <Stack spacing={2}>
                                <TextField
                                    label="Mã số thuế"
                                    value={taxCode}
                                    onChange={(e) => {
                                        setTaxCode(e.target.value);
                                        setTaxCodeError('');
                                    }}
                                    fullWidth
                                    size="small"
                                    error={!!taxCodeError}
                                    helperText={taxCodeError}
                                    placeholder="Nhập mã số thuế"
                                />

                                <Button
                                    variant="contained"
                                    onClick={handleTaxCodeCheck}
                                    disabled={isCheckingTaxCode}
                                    fullWidth
                                    sx={{
                                        py: 1.1,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        borderRadius: 999,
                                        background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)',
                                        boxShadow: '0 10px 30px rgba(37, 99, 235, 0.35)',
                                        '&:hover': {
                                            background: 'linear-gradient(90deg, #1d4ed8 0%, #1d4ed8 100%)',
                                            boxShadow: '0 12px 36px rgba(30, 64, 175, 0.45)',
                                        },
                                    }}
                                >
                                    {isCheckingTaxCode ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        'Kiểm tra mã số thuế'
                                    )}
                                </Button>

                                {taxCodeData && (
                                    <Alert severity="success" sx={{mt: 1}}>
                                        Mã số thuế hợp lệ! Vui lòng điền thông tin bên dưới.
                                    </Alert>
                                )}
                            </Stack>

                            <Button
                                variant="outlined"
                                onClick={onBack}
                                fullWidth
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 999,
                                }}
                            >
                                Quay lại
                            </Button>
                        </Stack>
                    ) : (
                        <Box component="form" onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="h5" sx={{fontWeight: 700, color: '#1e293b'}}>
                                        Đăng ký trường học
                                    </Typography>
                                    <Typography variant="body2" sx={{color: '#64748b', mt: 0.5}}>
                                        Vui lòng điền đầy đủ thông tin để hoàn tất đăng ký.
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Tên trường *"
                                            name="schoolName"
                                            value={formData.schoolName}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            error={!!formErrors.schoolName}
                                            helperText={formErrors.schoolName}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Địa chỉ trường *"
                                            name="schoolAddress"
                                            value={formData.schoolAddress}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            multiline
                                            rows={2}
                                            error={!!formErrors.schoolAddress}
                                            helperText={formErrors.schoolAddress}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Tên cơ sở *"
                                            name="campusName"
                                            value={formData.campusName}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            error={!!formErrors.campusName}
                                            helperText={formErrors.campusName}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Mã số thuế *"
                                            name="taxCode"
                                            value={formData.taxCode}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            error={!!formErrors.taxCode}
                                            helperText={formErrors.taxCode}
                                            disabled
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Địa chỉ cơ sở *"
                                            name="campusAddress"
                                            value={formData.campusAddress}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            multiline
                                            rows={2}
                                            error={!!formErrors.campusAddress}
                                            helperText={formErrors.campusAddress}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Tên người đại diện *"
                                            name="representativeName"
                                            value={formData.representativeName}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            error={!!formErrors.representativeName}
                                            helperText={formErrors.representativeName}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Hotline *"
                                            name="hotline"
                                            value={formData.hotline}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            error={!!formErrors.hotline}
                                            helperText={formErrors.hotline}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Website URL"
                                            name="websiteUrl"
                                            value={formData.websiteUrl}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            placeholder="https://example.com"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Logo URL"
                                            name="logoUrl"
                                            value={formData.logoUrl}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            placeholder="https://example.com/logo.png"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Ngày thành lập"
                                            name="foundingDate"
                                            type="date"
                                            value={formData.foundingDate}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="URL giấy phép kinh doanh"
                                            name="businessLicenseUrl"
                                            value={formData.businessLicenseUrl}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            placeholder="https://example.com/license.pdf"
                                        />
                                    </Grid>
                                </Grid>

                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setStep(1)}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: 999,
                                        }}
                                    >
                                        Quay lại
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={isSubmitting}
                                        fullWidth
                                        sx={{
                                            py: 1.1,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            borderRadius: 999,
                                            background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)',
                                            boxShadow: '0 10px 30px rgba(37, 99, 235, 0.35)',
                                            '&:hover': {
                                                background: 'linear-gradient(90deg, #1d4ed8 0%, #1d4ed8 100%)',
                                                boxShadow: '0 12px 36px rgba(30, 64, 175, 0.45)',
                                            },
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            'Hoàn tất đăng ký'
                                        )}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default SchoolRegistrationForm;
