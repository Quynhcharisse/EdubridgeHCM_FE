import {useEffect, useState} from "react";
import {refreshToken} from "../services/AuthService.jsx";
import {getAccess, signout} from "../services/AccountService.jsx";
import {useLoading} from "../contexts/LoadingContext.jsx";

async function GetAccessData() {
    try {
        const response = await getAccess();
        if (response && response.status === 200) {
            return response.data.body;
        } else {
            return null;
        }
    } catch (error) {
        console.error("GetAccessData error:", error);
        return null;
    }
}

async function Logout() {
    try {
        const res = await signout();
        if (res && res.status === 200) {
            if (localStorage.length > 0) {
                localStorage.clear();
            }
            if (sessionStorage.length > 0) {
                sessionStorage.clear();
            }
            setTimeout(() => {
                window.location.href = "/login";
            }, 1000);
        } else {
            // Nếu logout fail, vẫn clear storage và redirect
            if (localStorage.length > 0) {
                localStorage.clear();
            }
            if (sessionStorage.length > 0) {
                sessionStorage.clear();
            }
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Logout error:", error);
        // Vẫn clear storage và redirect dù có lỗi
        if (localStorage.length > 0) {
            localStorage.clear();
        }
        if (sessionStorage.length > 0) {
            sessionStorage.clear();
        }
        window.location.href = "/login";
    }
}

async function CheckIfRoleValid(allowRoles, role) {
    if (!role) return false;
    // Normalize role to uppercase for comparison
    const normalizedRole = role.toUpperCase();
    const normalizedAllowRoles = allowRoles.map(r => r.toUpperCase());
    return normalizedAllowRoles.includes(normalizedRole);
}

export default function ProtectedRoute({children, allowRoles = []}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasValidRole, setHasValidRole] = useState(false);
    const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);
    const {setAuthLoading} = useLoading();

    useEffect(() => {
        const checkAuthentication = async () => {
            if (hasAttemptedAuth) {
                return;
            }

            try {
                setIsLoading(true);
                setAuthLoading(true);
                setHasAttemptedAuth(true);

                // First, try to get access data
                const data = await GetAccessData();

                if (data != null && data.role) {
                    // User is authenticated, check role
                    const isValidRole = await CheckIfRoleValid(allowRoles, data.role);
                    if (isValidRole) {
                        setIsAuthenticated(true);
                        setHasValidRole(true);
                        setIsLoading(false);
                        setAuthLoading(false);
                        return;
                    } else {
                        // User has wrong role, redirect to home (don't logout, just redirect)
                        console.warn(`User has role ${data.role} but route requires:`, allowRoles);
                        window.location.href = "/home";
                        return;
                    }
                }

                // If no data, try to refresh token
                try {
                    const refreshResponse = await refreshToken();
                    if (refreshResponse && refreshResponse.status === 200) {
                        // Retry getting access data after refresh
                        const retryData = await GetAccessData();
                        if (retryData != null && retryData.role) {
                            const isValidRole = await CheckIfRoleValid(allowRoles, retryData.role);
                            if (isValidRole) {
                                setIsAuthenticated(true);
                                setHasValidRole(true);
                                setIsLoading(false);
                                setAuthLoading(false);
                                return;
                            } else {
                                // User has wrong role after refresh, redirect to home (don't logout)
                                console.warn(`User has role ${retryData.role} but route requires:`, allowRoles);
                                window.location.href = "/home";
                                return;
                            }
                        }
                    }
                } catch (refreshError) {
                    // Refresh failed, user is not authenticated
                    console.log("Token refresh failed, user not authenticated");
                }

                // If we reach here, user is not authenticated
                // Clear any stale data and redirect to login
                if (localStorage.length > 0) {
                    localStorage.clear();
                }
                if (sessionStorage.length > 0) {
                    sessionStorage.clear();
                }
                window.location.href = "/login";

            } catch (error) {
                console.error("Authentication error:", error);
                // On error, clear storage and redirect to login
                if (localStorage.length > 0) {
                    localStorage.clear();
                }
                if (sessionStorage.length > 0) {
                    sessionStorage.clear();
                }
                window.location.href = "/login";
            } finally {
                setIsLoading(false);
                setAuthLoading(false);
            }
        };

        checkAuthentication();
    }, [allowRoles, setAuthLoading]);

    if (isLoading) {
        // Không hiển thị loading UI ở đây nữa, sẽ dùng GlobalLoadingOverlay
        return null;
    }

    if (isAuthenticated && hasValidRole) {
        return children;
    }

    return null;
}