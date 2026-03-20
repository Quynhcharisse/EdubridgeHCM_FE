import React from "react";
import {Box, Button, Container, MenuItem, TextField, Typography} from "@mui/material";
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

export default function SchoolSearchPage() {
    const [searchKeyword, setSearchKeyword] = React.useState('');
    const [selectedDistrict, setSelectedDistrict] = React.useState(HCM_DISTRICTS[0]);
    const [tuitionMin, setTuitionMin] = React.useState(0);
    const [tuitionMax, setTuitionMax] = React.useState(30);

    return (
        <Box sx={{pt: '80px', minHeight: '100vh', bgcolor: '#f7fbff'}}>
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #64b5f6 100%)',
                    py: {xs: 4, md: 5}
                }}
            >
                <Container maxWidth={false} sx={{maxWidth: '1400px', px: {xs: 2, md: 4}}}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: {xs: 'column', md: 'row'},
                            alignItems: {xs: 'stretch', md: 'center'},
                            gap: {xs: 2, md: 4},
                            bgcolor: 'rgba(255,255,255,0.12)',
                            borderRadius: 3,
                            p: {xs: 2, md: 2.5},
                            border: '1px solid rgba(255,255,255,0.35)',
                            backdropFilter: 'blur(10px)',
                            width: '100%',
                            mx: 'auto'
                        }}
                    >
                        <TextField
                            placeholder="Tìm kiếm trường học..."
                            size="small"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            sx={{
                                bgcolor: 'white',
                                borderRadius: 2,
                                flex: 1,
                                minWidth: {xs: '100%', md: 100},
                                maxWidth: {xs: '100%', md: 550},
                                '& .MuiOutlinedInput-root fieldset': {
                                    borderColor: 'rgba(25,118,210,0.2)',
                                },
                                '& .MuiOutlinedInput-root:hover fieldset': {
                                    borderColor: 'rgba(25,118,210,0.4)',
                                },
                                '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                                    borderColor: '#1976d2',
                                    borderWidth: 2,
                                },
                            }}
                        />
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
                                        '&.Mui-focused fieldset': {borderColor: '#ffffff', borderWidth: 2}
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
                        <TuitionFilter
                            tuitionMin={tuitionMin}
                            tuitionMax={tuitionMax}
                            onChange={(min, max) => {
                                setTuitionMin(min);
                                setTuitionMax(max);
                            }}
                        />
                        <Button
                            variant="contained"
                            sx={{
                                bgcolor: 'white',
                                color: '#1976d2',
                                minWidth: 48,
                                height: 40,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                '&:hover': {bgcolor: '#e3f2fd'}
                            }}
                        >
                            <SearchIcon/>
                        </Button>
                    </Box>
                </Container>
            </Box>
            <Container maxWidth={false} sx={{maxWidth: '1400px', px: {xs: 2, md: 4}, py: 4}}>
                <Typography sx={{color: '#64748b', fontWeight: 500}}>
                    Danh sách trường sẽ hiển thị tại đây.
                </Typography>
            </Container>
        </Box>
    );
}
