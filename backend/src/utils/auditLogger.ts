import AuditLog from '../models/AuditLog';
import { UserRole } from '../models/User';
import mongoose from 'mongoose';

interface AuditLogParams {
    actorUserId: mongoose.Types.ObjectId;
    actorRole: UserRole;
    actionType: string;
    entityType: 'Patient' | 'Appointment' | 'Doctor' | 'QueueToken' | 'Schedule' | 'Leave' | 'User' | 'AppointmentType';
    entityId: mongoose.Types.ObjectId;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
}

export const logAudit = async (params: AuditLogParams) => {
    try {
        const log = new AuditLog({
            ...params,
            timestamp: new Date(),
        });
        await log.save();
    } catch (error) {
        console.error('Failed to save audit log:', error);
    }
};
