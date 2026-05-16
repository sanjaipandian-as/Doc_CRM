import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Activity, Clock, Shield, Search, Database, RefreshCw, FileJson, ChevronRight, X, Terminal, User,Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditLog {
    _id: string;
    timestamp: string;
    actorUserId: { name: string } | null;
    actorRole: string;
    actionType: string;
    entityType: string;
    newValue?: any;
    oldValue?: any;
}

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<AuditLog[]>('/admin/audit-logs');
            setLogs(data);
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionStyle = (action: string) => {
        const type = action?.toUpperCase();
        if (type?.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/20';
        if (type?.includes('UPDATE') || type?.includes('EDIT') || type?.includes('STATUS')) return 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-500/20';
        if (type?.includes('DELETE') || type?.includes('CANCEL')) return 'bg-red-50 text-red-700 border-red-100 ring-red-500/20';
        return 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-500/20';
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col font-sans bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 shadow-sm">
                            <Activity size={28} />
                        </div>
                        Audit Trail
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">Track system security, data changes, and user activity.</p>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchLogs} 
                    disabled={loading}
                    className="p-3 bg-white text-emerald-600 hover:text-emerald-700 rounded-xl shadow-sm border border-gray-200 hover:border-emerald-200 transition-all"
                    title="Refresh Data"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </motion.button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden relative">
                {loading && logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1">
                        <Loader2 size={48} className="animate-spin text-emerald-600 mb-4" />
                        <p className="text-gray-400 font-medium">Syncing records...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-400 p-12">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Search size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">No Logs Found</h3>
                        <p className="text-gray-400 mt-2">System activity will appear here once recorded.</p>
                    </div>
                ) : (
                    <>
                        {/* --- DESKTOP TABLE --- */}
                        <div className="hidden md:block overflow-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actor</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Entity</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700">
                                                        {new Date(log.timestamp).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold border border-gray-200">
                                                        {(log.actorUserId?.name || 'S').charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {log.actorUserId?.name || 'System User'}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                                            <Shield size={10} className="text-emerald-500" />
                                                            {log.actorRole}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold border ring-1 uppercase tracking-wide ${getActionStyle(log.actionType)}`}>
                                                    {log.actionType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                                    <Database size={14} className="text-gray-400"/>
                                                    {log.entityType}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {(log.newValue || log.oldValue) ? (
                                                    <button 
                                                        onClick={() => setSelectedLog(log)}
                                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 group/btn"
                                                    >
                                                        <FileJson size={14} />
                                                        View Payload
                                                        <ChevronRight size={14} className="transition-transform group-hover/btn:translate-x-0.5" />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300 text-xs italic px-3">No Data</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* --- MOBILE VIEW --- */}
                        <div className="md:hidden flex flex-col divide-y divide-gray-100 overflow-y-auto">
                            {logs.map((log) => (
                                <div key={log._id} className="p-5 bg-white hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ring-1 uppercase tracking-wide ${getActionStyle(log.actionType)}`}>
                                            {log.actionType}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 font-mono">
                                            <Clock size={12} />
                                            {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{log.actorUserId?.name || 'System'}</p>
                                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                <Shield size={10} /> {log.actorRole}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                            <Database size={12} />
                                            <span className="font-semibold">{log.entityType}</span>
                                        </div>
                                        {(log.newValue || log.oldValue) && (
                                            <button 
                                                onClick={() => setSelectedLog(log)}
                                                className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                                            >
                                                Details <ChevronRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                            onClick={() => setSelectedLog(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] relative z-10"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm text-emerald-600">
                                        <FileJson size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Change Details</h3>
                                        <p className="text-xs text-gray-500 font-mono">{selectedLog._id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto bg-gray-900 text-emerald-400 font-mono text-xs leading-relaxed custom-scrollbar">
                                <div className="flex items-center gap-2 mb-2 text-gray-500 pb-2 border-b border-gray-800">
                                    <Terminal size={14} />
                                    <span>JSON Payload</span>
                                </div>
                                <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(selectedLog.newValue || selectedLog.oldValue, null, 2)}
                                </pre>
                            </div>
                            
                            <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
                                <button 
                                    onClick={() => setSelectedLog(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuditLogs;