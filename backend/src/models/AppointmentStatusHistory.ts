import mongoose, { Schema, Document } from 'mongoose';
import { AppointmentStatus } from './Appointment';

export interface IAppointmentStatusHistory extends Document {
    appointmentId: mongoose.Types.ObjectId;
    fromStatus: AppointmentStatus;
    toStatus: AppointmentStatus;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    note?: string;
}

const AppointmentStatusHistorySchema: Schema = new Schema(
    {
        appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
        fromStatus: { type: String, enum: Object.values(AppointmentStatus), required: true },
        toStatus: { type: String, enum: Object.values(AppointmentStatus), required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
    }
);

// Indexes for fast history lookups
AppointmentStatusHistorySchema.index({ appointmentId: 1, changedAt: -1 });
AppointmentStatusHistorySchema.index({ changedBy: 1 });

export default mongoose.model<IAppointmentStatusHistory>('AppointmentStatusHistory', AppointmentStatusHistorySchema);
