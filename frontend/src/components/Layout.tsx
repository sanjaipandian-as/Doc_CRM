import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const Layout: React.FC = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-emerald-600 gap-3">
            <Loader2 size={40} className="animate-spin" />
            <span className="font-semibold text-lg">Loading System...</span>
        </div>
    );

    if (!user) return <Navigate to="/login" />;

    const getPageTitle = () => {
        const path = location.pathname.split('/').pop();
        if (!path || path === 'admin' || path === '/') return 'Dashboard';
        return path.replace(/-/g, ' ');
    };

    return (
        <div className="flex h-screen bg-gray-50 w-full overflow-hidden font-sans text-gray-900">
            <Sidebar />
            
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50 relative">
                <header className="bg-white border-b border-gray-200 px-6 md:px-8 py-5 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 capitalize tracking-tight">
                            {getPageTitle()}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900">{user.name || 'Admin User'}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role || 'Administrator'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold shadow-sm">
                            {(user.name?.[0] || 'A').toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;