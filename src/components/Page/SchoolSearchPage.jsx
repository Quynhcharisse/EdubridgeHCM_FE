import React from "react";
import {
    Box,
    Button,
    Card,
    CardMedia,
    Chip,
    Container,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Pagination,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import {LocationOn as LocationIcon, Search as SearchIcon} from "@mui/icons-material";
import TuitionFilter from "../ui/TuitionFilter";

const HCM_DISTRICTS = [
    'Khu vực TPHCM',
    'Quận 1',
    'Quận 3',
    'Quận 4',
    'Quận 5',
    'Quận 6',
    'Quận 7',
    'Quận 8',
    'Quận 10',
    'Quận 11',
    'Quận 12',
    'Quận Bình Thạnh',
    'Quận Tân Bình',
    'Quận Tân Phú',
    'Quận Phú Nhuận',
    'Quận Gò Vấp',
    'Quận Bình Tân',
    'Thành phố Thủ Đức',
    'Huyện Bình Chánh',
    'Huyện Cần Giờ',
    'Huyện Củ Chi',
    'Huyện Hóc Môn',
    'Huyện Nhà Bè'
];

const SCHOOL_LIST = [
    {
        id: 1,
        name: 'Trường THPT Nguyễn Thị Minh Khai',
        district: 'Quận 3',
        type: 'Trường nữ sinh',
        tuition: '6 - 9 triệu/tháng',
        students: '1,120 học sinh',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
        summary: 'Môi trường học tập hiện đại, chú trọng tiếng Anh và hoạt động ngoại khóa toàn diện.'
    },
    {
        id: 2,
        name: 'Trường THPT Gia Định',
        district: 'Bình Thạnh',
        type: 'Trường nam sinh',
        tuition: '5 - 8 triệu/tháng',
        students: '980 học sinh',
        image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=900&q=80',
        summary: 'Trường có thế mạnh về định hướng khối tự nhiên, CLB học thuật và thể thao phát triển.'
    },
    {
        id: 3,
        name: 'Trường THPT Trần Đại Nghĩa',
        district: 'Quận 1',
        type: 'Trường ưu tú',
        tuition: 'Miễn phí',
        students: '1,350 học sinh',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
        summary: 'Mô hình đào tạo chất lượng cao, tập trung phát triển tư duy học sinh và ngoại ngữ.'
    }
];

export default function SchoolSearchPage() {
    const [searchKeyword, setSearchKeyword] = React.useState('');
    const [selectedDistrict, setSelectedDistrict] = React.useState(HCM_DISTRICTS[0]);
    const [tuitionMin, setTuitionMin] = React.useState(0);
    const [tuitionMax, setTuitionMax] = React.useState(30);
    const [selectedProvince, setSelectedProvince] = React.useState(null);
    const [selectedBoardingType, setSelectedBoardingType] = React.useState(null);

    const toggleSingleSelection = (value, setter) => {
        setter((prev) => (prev === value ? null : value));
    };

    const filterChipSx = (isSelected) => ({
        borderRadius: 2,
        fontWeight: isSelected ? 700 : 500,
        color: isSelected ? '#0f4fbf' : '#334155',
        bgcolor: isSelected ? '#eff6ff' : '#ffffff',
        border: `1px solid ${isSelected ? '#93c5fd' : '#cbd5e1'}`,
        cursor: 'pointer',
        px: 0.6,
        py: 0.2,
        transition: 'all 0.22s ease',
        boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.12)' : 'none',
        '&:hover': {
            bgcolor: isSelected ? '#bfdbfe' : '#eff6ff',
            color: '#1d4ed8',
            borderColor: isSelected ? '#3b82f6' : '#93c5fd',
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 14px rgba(15,23,42,0.10)'
        }
    });

    return (
        <Box sx={{pt: '80px', minHeight: '100vh', bgcolor: '#f7fbff'}}>
            <Container maxWidth={false} sx={{maxWidth: '1400px', px: {xs: 2, md: 4}, pt: 2, pb: 4}}>
                <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '300px 1fr'}, gap: 3}}>
                    <Card
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 10px rgba(15,23,42,0.06)',
                            height: 'fit-content',
                            position: {md: 'sticky'},
                            top: {md: 96}
                        }}
                    >
                        <Typography sx={{fontWeight: 700, color: '#0f172a', mb: 1.5}}>Bộ lọc tìm trường</Typography>
                        <Divider sx={{mb: 2}}/>
                        <Stack spacing={2}>
                            <Box>
                                <Typography sx={{fontWeight: 600, fontSize: 14, mb: 1, color: '#334155'}}>Tỉnh, Thành phố</Typography>
                                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                    {['TP.HCM', 'Bình Dương', 'Bà Rịa - Vũng Tàu'].map((province) => (
                                        <Chip
                                            key={province}
                                            label={province}
                                            size="small"
                                            onClick={() => toggleSingleSelection(province, setSelectedProvince)}
                                            sx={filterChipSx(selectedProvince === province)}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography sx={{fontWeight: 600, fontSize: 14, mb: 1, color: '#334155'}}>Nội trú/Bán trú</Typography>
                                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                    {['Nội trú', 'Bán trú'].map((boardingType) => (
                                        <Chip
                                            key={boardingType}
                                            label={boardingType}
                                            size="small"
                                            onClick={() => toggleSingleSelection(boardingType, setSelectedBoardingType)}
                                            sx={filterChipSx(selectedBoardingType === boardingType)}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            <Divider />
                            <Box>
                                <TuitionFilter
                                    tuitionMin={tuitionMin}
                                    tuitionMax={tuitionMax}
                                    onChange={(min, max) => {
                                        setTuitionMin(min);
                                        setTuitionMax(max);
                                    }}
                                />
                            </Box>
                        </Stack>
                    </Card>

                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: {xs: 'column', lg: 'row'},
                                alignItems: {xs: 'stretch', lg: 'center'},
                                gap: 1.5,
                                mb: 2
                            }}
                        >
                            <TextField
                                placeholder="Tìm kiếm trường học..."
                                size="small"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    bgcolor: '#bdbdbd',
                                                    color: '#ffffff',
                                                    width: 26,
                                                    height: 26,
                                                    '&:hover': {bgcolor: '#a8a8a8'}
                                                }}
                                            >
                                                <SearchIcon sx={{fontSize: 16}}/>
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    bgcolor: '#ffffff',
                                    borderRadius: 999,
                                    minWidth: {xs: '100%', lg: 420},
                                    maxWidth: {xs: '100%', lg: 560},
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 999,
                                        pr: 0.5,
                                        '& fieldset': {
                                            border: '1px solid #cbd5e1',
                                        },
                                        '&:hover fieldset': {
                                            border: '1px solid #94a3b8',
                                        },
                                        '&.Mui-focused fieldset': {
                                            border: '1.5px solid #94a3b8',
                                        }
                                    },
                                    '& .MuiInputBase-input': {
                                        py: 1.2,
                                        pl: 1,
                                        color: '#334155',
                                        fontSize: '0.9rem'
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        fontSize: '0.88rem'
                                    },
                                }}
                            />
                            <Box sx={{display: 'flex', gap: 1.5, width: {xs: '100%', lg: 'auto'}}}>
                                <Box sx={{position: 'relative', minWidth: {xs: '100%', md: 250}, maxWidth: {xs: '100%', md: 300}}}>
                                    <LocationIcon
                                        sx={{
                                            position: 'absolute',
                                            left: 14,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#1976d2',
                                            fontSize: 22,
                                            pointerEvents: 'none',
                                            zIndex: 1
                                        }}
                                    />
                                    <TextField
                                        select
                                        size="small"
                                        value={selectedDistrict}
                                        onChange={(e) => setSelectedDistrict(e.target.value)}
                                        sx={{
                                            bgcolor: 'white',
                                            borderRadius: 999,
                                            width: '100%',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 999,
                                                transition: 'all 0.25s ease',
                                                '& fieldset': {borderColor: 'rgba(25,118,210,0.25)'},
                                                '&:hover fieldset': {borderColor: 'rgba(25,118,210,0.6)'},
                                                '&.Mui-focused fieldset': {borderColor: '#1976d2', borderWidth: 2}
                                            },
                                            '& .MuiSelect-select': {
                                                pl: 4.5,
                                                py: 1.1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                fontWeight: 600,
                                                color: '#111827'
                                            }
                                        }}
                                    >
                                        {HCM_DISTRICTS.map((district) => (
                                            <MenuItem key={district} value={district}>{district}</MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap'}}>
                            <Typography sx={{fontWeight: 700, color: '#0f172a'}}>1 - 20 trên 846 trường</Typography>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                <Typography sx={{fontSize: 14, color: '#64748b'}}>Sắp xếp theo</Typography>
                                <TextField select size="small" defaultValue="fit" sx={{minWidth: 170}}>
                                    <MenuItem value="fit">Phù hợp nhất</MenuItem>
                                    <MenuItem value="tuitionAsc">Học phí tăng dần</MenuItem>
                                    <MenuItem value="tuitionDesc">Học phí giảm dần</MenuItem>
                                </TextField>
                            </Box>
                        </Box>

                        <Stack spacing={2}>
                            {SCHOOL_LIST.map((school) => (
                                <Card
                                    key={school.id}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {xs: '1fr', sm: '280px 1fr'},
                                        gap: 2,
                                        p: 2,
                                        borderRadius: 3,
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 10px rgba(15,23,42,0.05)'
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        image={school.image}
                                        alt={school.name}
                                        sx={{height: {xs: 180, sm: 170}, borderRadius: 2}}
                                    />
                                    <Box>
                                        <Typography sx={{fontWeight: 700, fontSize: 24, color: '#0f172a'}}>
                                            {school.name}
                                        </Typography>
                                        <Typography sx={{mt: 0.75, color: '#475569'}}>
                                            {school.summary}
                                        </Typography>
                                        <Box sx={{display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap'}}>
                                            <Chip label={school.district} size="small" />
                                            <Chip label={school.type} size="small" />
                                            <Chip label={school.students} size="small" />
                                            <Chip label={school.tuition} size="small" color="primary" variant="outlined" />
                                        </Box>
                                        <Box sx={{display: 'flex', justifyContent: 'flex-end', mt: 2}}>
                                            <Button size="small" variant="outlined" sx={{textTransform: 'none'}}>
                                                Xem thêm
                                            </Button>
                                        </Box>
                                    </Box>
                                </Card>
                            ))}
                        </Stack>

                        <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
                            <Pagination count={42} page={1} color="primary" />
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
