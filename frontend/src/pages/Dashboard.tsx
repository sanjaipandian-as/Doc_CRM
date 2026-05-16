import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, CheckCircle, XCircle, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
    const { user } = useAuth(); // Get current user context
    const [stats, setStats] = useState({
        today: 0,
        checkedIn: 0,
        completed: 0,
        cancelled: 0
    });
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get today's date in YYYY-MM-DD
                const today = new Date().toISOString().split('T')[0];
                
                // Construct query based on Role
                // If DOCTOR -> Filter by their ID
                // If ADMIN/RECEPTIONIST -> Fetch all
                const query = user?.role === 'DOCTOR' 
                    ? `/appointments?date=${today}&doctorId=${user.doctorId}`
                    : `/appointments?date=${today}`;

                const { data } = await api.get(query);
                
                // Sort by time (Backend usually does this, but good to ensure for dashboard)
                const sortedData = data.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
                
                setAppointments(sortedData);

                // Calculate Stats locally from the fetched list
                setStats({
                    today: data.length,
                    checkedIn: data.filter((a: any) => 
                        a.status === 'CHECKED_IN' || a.status === 'IN_QUEUE' || a.status === 'SERVING'
                    ).length,
                    completed: data.filter((a: any) => a.status === 'COMPLETED').length,
                    cancelled: data.filter((a: any) => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]); // Re-run if user changes

    const statCards = [
        { 
            label: "Today's Appointments", 
            value: stats.today, 
            icon: <Calendar size={24} />, 
            bg: "bg-emerald-100", 
            text: "text-emerald-600" 
        },
        { 
            label: "Checked In / In Queue", 
            value: stats.checkedIn, 
            icon: <Clock size={24} />, 
            bg: "bg-blue-100", 
            text: "text-blue-600" 
        },
        { 
            label: "Completed", 
            value: stats.completed, 
            icon: <CheckCircle size={24} />, 
            bg: "bg-green-100", 
            text: "text-green-600" 
        },
        { 
            label: "Cancelled / No Show", 
            value: stats.cancelled, 
            icon: <XCircle size={24} />, 
            bg: "bg-red-100", 
            text: "text-red-600" 
        },
    ];

    const getStatusStyle = (status: string) => {
        // Handle undefined status just in case
        if (!status) return 'bg-gray-50 text-gray-600';
        
        switch (status.toUpperCase()) {
            case 'SCHEDULED': return 'bg-emerald-100 text-emerald-700';
            case 'CHECKED_IN': return 'bg-blue-100 text-blue-700';
            case 'IN_QUEUE': return 'bg-yellow-100 text-yellow-700';
            case 'SERVING': return 'bg-purple-100 text-purple-700';
            case 'COMPLETED': return 'bg-gray-100 text-gray-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            case 'NO_SHOW': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <LayoutDashboard className="text-emerald-600" />
                    Dashboard
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Overview of today's clinic activity 
                    {user?.role === 'DOCTOR' && <span className="font-semibold text-emerald-600"> (My Schedule)</span>}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow"
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.text}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-lg font-bold text-gray-800">Today's Schedule</h2>
                    {/* Link this to the full appointments page if needed */}
                    <button className="px-3 py-1.5 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
                        View All
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-emerald-50 text-emerald-700 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b border-emerald-100">Time</th>
                                <th className="px-6 py-4 border-b border-emerald-100">Patient</th>
                                <th className="px-6 py-4 border-b border-emerald-100">Doctor</th>
                                <th className="px-6 py-4 border-b border-emerald-100">Type</th>
                                <th className="px-6 py-4 border-b border-emerald-100">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {appointments.length > 0 ? appointments.slice(0, 10).map((app: any) => ( // Limit to first 10 for dashboard
                                <tr key={app._id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-700 font-mono">
                                        {app.startTime}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">{app.patientId?.patientName || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{app.patientId?.phone || ''}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {app.doctorId?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {app.appointmentTypeId?.name || 'General'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyle(app.status)}`}>
                                            {app.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">
                                        No appointments scheduled for today
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;