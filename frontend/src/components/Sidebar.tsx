import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    ListOrdered,
    LogOut,
    UserCog,
    Stethoscope,
    Clock,
    FileText,
    RefreshCw,
    Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: ['ADMIN', 'RECEPTIONIST'] },
        { to: '/patients', icon: <Users size={20} />, label: 'Patients', roles: ['ADMIN', 'RECEPTIONIST'] },
        { to: '/appointments', icon: <Calendar size={20} />, label: 'Appointments', roles: ['ADMIN', 'RECEPTIONIST'] },
        { to: '/queue', icon: <ListOrdered size={20} />, label: 'Queue', roles: ['ADMIN', 'RECEPTIONIST'] },
    ];

    const adminItems = [
        { to: '/admin/doctors', icon: <Stethoscope size={20} />, label: 'Doctors' },
        { to: '/admin/receptionists', icon: <UserCog size={20} />, label: 'Staff' },
        { to: '/admin/schedules', icon: <Clock size={20} />, label: 'Schedules' },
        { to: '/admin/reschedule', icon: <RefreshCw size={20} />, label: 'Reschedule' },
        { to: '/admin/audit-logs', icon: <FileText size={20} />, label: 'Audit Logs' },
    ];

    return (
        <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0 flex-shrink-0 z-30 font-sans">
            <div className="p-6">
                <div className="flex items-center gap-3 text-xl font-bold text-emerald-700 tracking-tight">
                    <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                        <Activity size={20} />
                    </div>
                    <span>ClinicPro</span>
                </div>
            </div>

            <nav className="flex-1 px-4 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="space-y-1">
                    <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Main Menu</p>
                    {navItems.filter(item => item.roles.includes(user?.role || '')).map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm
                                ${isActive
                                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-emerald-600'
                                }
                            `}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                {user?.role === 'ADMIN' && (
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Administration</p>
                        {adminItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm
                                    ${isActive
                                        ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-emerald-600'
                                    }
                                `}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="w-10 h-10 bg-white border border-gray-200 text-emerald-600 rounded-full flex items-center justify-center font-bold shadow-sm">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'User Name'}</p>
                        <p className="text-xs text-emerald-600 font-medium capitalize">{user?.role || 'Role'}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all text-sm font-semibold shadow-sm"
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;