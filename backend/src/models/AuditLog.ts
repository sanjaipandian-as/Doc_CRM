import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from './User';

export interface IAuditLog extends Document {
    actorUserId: mongoose.Types.ObjectId;
    actorRole: UserRole;
    actionType: string;
    entityType: 'Patient' | 'Appointment' | 'Doctor' | 'QueueToken' | 'Schedule' | 'Leave' | 'User' | 'AppointmentType';
    entityId: mongoose.Types.ObjectId;
    oldValue?: any;
    newValue?: any;
    timestamp: Date;
    ipAddress?: string;
}

const AuditLogSchema: Schema = new Schema(
    {
        actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actorRole: { type: String, enum: Object.values(UserRole), required: true },
        actionType: { type: String, required: true },
        entityType: { type: String, required: true },
        entityId: { type: Schema.Types.ObjectId, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now },
        ipAddress: { type: String },
    }
);

// Index for filtering
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ actorUserId: 1 });
AuditLogSchema.index({ timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
