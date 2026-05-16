import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Play, CheckCircle2, XCircle, GripVertical, ListOrdered, Calendar, Clock, User, Timer, CheckCircle } from 'lucide-react';
import { Reorder } from 'framer-motion';

const Queue: React.FC = () => {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [queue, setQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const initView = async () => {
            if (user?.role === 'DOCTOR') {
                setSelectedDoctor(user.doctorId || '');
            } else {
                try {
                    const res = await api.get('/admin/doctors');
                    setDoctors(res.data);
                    if (res.data.length > 0) setSelectedDoctor(res.data[0]._id);
                } catch (error) {
                    console.error("Failed to fetch doctors");
                }
            }
        };
        initView();
    }, [user]);

    useEffect(() => {
        if (selectedDoctor && date) {
            fetchQueue();
        }
    }, [selectedDoctor, date]);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/queue?doctorId=${selectedDoctor}&date=${date}`);
            setQueue(data);
        } catch (error) {
            console.error('Failed to fetch queue', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!selectedDoctor) return;
        setLoading(true);
        try {
            await api.post(`/queue/sync?doctorId=${selectedDoctor}&date=${date}`);
            await fetchQueue();
        } catch (error) {
            alert('Sync failed');
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            // Optimistic Update for speed
            setQueue(prev => prev.map(item => item._id === id ? { ...item, status } : item));
            await api.patch(`/queue/${id}/status`, { status });
            fetchQueue(); // Refresh to ensure consistency
        } catch (error) {
            alert('Status update failed');
            fetchQueue(); // Revert on fail
        }
    };

    const handleReorder = async (newOrder: any[]) => {
        setQueue(newOrder);
        const tokens = newOrder.map((item, index) => ({
            id: item._id,
            queuePosition: index + 1
        }));

        try {
            await api.patch('/queue/reorder', { tokens });
        } catch (error) {
            console.error('Reorder failed', error);
            fetchQueue();
        }
    };

    // Stats Calculation
    const stats = {
        waiting: queue.filter(i => i.status === 'WAITING').length,
        serving: queue.filter(i => i.status === 'SERVING').length,
        done: queue.filter(i => i.status === 'DONE').length
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50 font-sans flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 shadow-sm">
                            <ListOrdered size={28} />
                        </div>
                        Queue Manager
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">Manage daily patient flow and token assignments.</p>
                </div>

                {/* Live Stats Bar */}
                <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                    <div className="bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 min-w-[140px]">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Timer size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Waiting</p>
                            <p className="text-xl font-extrabold text-gray-800">{stats.waiting}</p>
                        </div>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-3 min-w-[140px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Play size={60} className="text-emerald-500" />
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg relative z-10">
                            <Play size={20} fill="currentColor" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-emerald-600 uppercase">Serving</p>
                            <p className="text-xl font-extrabold text-emerald-700">{stats.serving}</p>
                        </div>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 min-w-[140px]">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Done</p>
                            <p className="text-xl font-extrabold text-gray-800">{stats.done}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col lg:flex-row justify-between items-end gap-6">
                <div className="flex flex-col md:flex-row gap-6 w-full lg:w-auto">
                    {/* Doctor Selector */}
                    <div className="space-y-2 w-full md:w-72">
                        <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5 tracking-wide">
                            Doctor
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={selectedDoctor}
                                disabled={user?.role === 'DOCTOR'}
                                onChange={e => setSelectedDoctor(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50/50 focus:bg-white disabled:bg-gray-50 disabled:text-gray-400 text-sm font-medium appearance-none"
                            >
                                {user?.role === 'DOCTOR' ? (
                                    <option value={user.doctorId}>{user.name}</option>
                                ) : (
                                    <>
                                        {doctors.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Date Selector */}
                    <div className="space-y-2 w-full md:w-56">
                        <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5 tracking-wide">
                            Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                    <button
                        onClick={handleSync}
                        disabled={loading || !selectedDoctor}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Sync Appointments
                    </button>
                </div>
            </div>

            {/* Queue List Headers */}
            <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100/50 rounded-t-2xl border-b border-gray-200">
                <div className="col-span-1">Sort</div>
                <div className="col-span-1">Token</div>
                <div className="col-span-4">Patient Details</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Queue Items */}
            <div className="flex-1 min-h-0 bg-white border-x border-b border-gray-200 rounded-b-2xl shadow-sm md:rounded-t-none rounded-t-2xl overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar">
                    <Reorder.Group axis="y" values={queue} onReorder={handleReorder} className="divide-y divide-gray-100">
                        {queue.length > 0 ? queue.map((item: any) => {
                            const isServing = item.status === 'SERVING';
                            return (
                                <Reorder.Item
                                    key={item._id}
                                    value={item}
                                    whileDrag={{ scale: 1.02, boxShadow: "0px 10px 30px rgba(16, 185, 129, 0.15)", backgroundColor: "#ffffff" }}
                                    className={`
                                        group relative md:grid md:grid-cols-12 flex flex-col gap-4 items-center p-5 transition-all
                                        ${isServing ? 'bg-emerald-50/40' : 'bg-white hover:bg-gray-50'}
                                    `}
                                >
                                    {isServing && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}

                                    {/* Drag Handle */}
                                    <div className="md:col-span-1 flex justify-start pl-2">
                                        <div className="p-2 rounded-lg text-gray-300 cursor-grab active:cursor-grabbing hover:bg-gray-100 hover:text-gray-500 transition-colors">
                                            <GripVertical size={20} />
                                        </div>
                                    </div>

                                    {/* Token */}
                                    <div className="md:col-span-1 w-full md:w-auto flex justify-start">
                                        <div className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner
                                            ${isServing
                                                ? 'bg-emerald-500 text-white shadow-emerald-200'
                                                : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {item.tokenNumber}
                                        </div>
                                    </div>

                                    {/* Patient Info */}
                                    <div className="md:col-span-4 w-full text-center md:text-left">
                                        <p className="font-bold text-gray-800 text-base">{item.patientId?.patientName || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 font-medium flex items-center justify-center md:justify-start gap-1">
                                            <User size={12} />
                                            {item.patientId?.phone || 'No Phone'}
                                        </p>
                                    </div>

                                    {/* Time */}
                                    <div className="md:col-span-2 w-full flex justify-center md:justify-start">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 font-mono">
                                            <Clock size={14} className="text-emerald-500" />
                                            <span>{item.appointmentId?.startTime || '--:--'}</span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="md:col-span-2 w-full flex justify-center md:justify-start">
                                        <span className={`
                                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-wide
                                            ${item.status === 'WAITING' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                            ${item.status === 'SERVING' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse' : ''}
                                            ${item.status === 'DONE' ? 'bg-gray-100 text-gray-500 border-gray-200 line-through decoration-gray-400' : ''}
                                            ${item.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-200' : ''}
                                        `}>
                                            {item.status === 'SERVING' && <Play size={10} fill="currentColor" />}
                                            {item.status}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="md:col-span-2 w-full flex justify-center md:justify-end gap-2">
                                        {item.status === 'WAITING' && (
                                            <button
                                                onClick={() => handleStatusChange(item._id, 'SERVING')}
                                                title="Call Patient"
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all font-bold text-xs"
                                            >
                                                <Play size={14} fill="currentColor" /> Call
                                            </button>
                                        )}
                                        {item.status === 'SERVING' && (
                                            <button
                                                onClick={() => handleStatusChange(item._id, 'DONE')}
                                                title="Mark Done"
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 shadow-lg transition-all font-bold text-xs"
                                            >
                                                <CheckCircle2 size={14} /> Finish
                                            </button>
                                        )}
                                        {item.status !== 'CANCELLED' && item.status !== 'DONE' && (
                                            <button
                                                onClick={() => handleStatusChange(item._id, 'CANCELLED')}
                                                title="Remove"
                                                className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                        )}
                                    </div>
                                </Reorder.Item>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                                    <ListOrdered size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-600">Queue is empty</h3>
                                <p className="text-sm opacity-60 mt-1 max-w-xs text-center">
                                    No patients for <span className="font-mono font-bold text-gray-800">{date}</span>. Try syncing appointments.
                                </p>
                            </div>
                        )}
                    </Reorder.Group>
                </div>
            </div>
        </div>
    );
};

export default Queue;