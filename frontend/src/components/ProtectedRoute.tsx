import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[]; // Optional: if provided, restricts by role
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // You can replace this with a proper Loading Spinner component
        return <div>Loading...</div>; 
    }

    // 1. Check if user is logged in
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Check Role Permission (if specific roles are required)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect unauthorized users to dashboard
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;