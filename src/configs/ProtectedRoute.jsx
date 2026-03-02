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
    return !!allowRoles.includes(role);
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

                const data = await GetAccessData();

                if (data != null) {
                    const isValidRole = await CheckIfRoleValid(allowRoles, data.role);
                    if (isValidRole) {
                        setIsAuthenticated(true);
                        setHasValidRole(true);
                        setIsLoading(false);
                        return;
                    } else {
                        await Logout();
                        return;
                    }
                }

                const refreshResponse = await refreshToken();
                if (refreshResponse.status === 401 || refreshResponse.status === 403) {
                    await Logout();
                    return;
                }

                const retryData = await GetAccessData();
                if (retryData != null) {
                    const isValidRole = await CheckIfRoleValid(allowRoles, retryData.role);
                    if (isValidRole) {
                        setIsAuthenticated(true);
                        setHasValidRole(true);
                        setIsLoading(false);
                        return;
                    } else {
                        await Logout();
                        return;
                    }
                } else {
                    await Logout();
                    return;
                }

            } catch (error) {
                console.error("Authentication error:", error);
                await Logout();
            } finally {
                setIsLoading(false);
                setAuthLoading(false);
            }
        };

        checkAuthentication();
    }, [allowRoles]);

    if (isLoading) {
        // Không hiển thị loading UI ở đây nữa, sẽ dùng GlobalLoadingOverlay
        return null;
    }

    if (isAuthenticated && hasValidRole) {
        return children;
    }

    return null;
}