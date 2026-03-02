import React from "react";
import {Box, Drawer} from "@mui/material";
import {Outlet, useLocation} from "react-router-dom";
import AuthHeader from "../partials/AuthHeader.jsx";
import AdminSidebar from "../partials/AdminSidebar.jsx";

const DRAWER_WIDTH = 280;

export default function AdminLayout() {
    const location = useLocation();

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8fafc'}}>
            <AuthHeader/>
            <Box sx={{display: 'flex', flex: 1, pt: '65px'}}>
                <Drawer
                    variant="permanent"
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            borderRight: '1px solid #e0e7ff',
                            bgcolor: 'white',
                            height: 'calc(100vh - 65px)',
                            top: '65px',
                            animation: 'slideInLeft 0.3s ease-out',
                            '@keyframes slideInLeft': {
                                '0%': {
                                    transform: 'translateX(-100%)',
                                    opacity: 0,
                                },
                                '100%': {
                                    transform: 'translateX(0)',
                                    opacity: 1,
                                },
                            },
                        },
                    }}
                >
                    <AdminSidebar currentPath={location.pathname}/>
                </Drawer>
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        pt: 3,
                        pb: 3,
                        pl: 7,
                        pr: 4,
                        minHeight: 'calc(100vh - 65px)',
                        bgcolor: '#f8fafc',
                        overflow: 'auto',
                        animation: 'fadeInUp 0.4s ease-out',
                        '@keyframes fadeInUp': {
                            '0%': {
                                opacity: 0,
                                transform: 'translateY(10px)',
                            },
                            '100%': {
                                opacity: 1,
                                transform: 'translateY(0)',
                            },
                        },
                    }}
                >
                    <Box sx={{ml: -3}}>
                        <Outlet/>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
