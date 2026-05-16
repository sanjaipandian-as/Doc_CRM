import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
    APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
    APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
    APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
}

export enum NotificationTarget {
    DOCTOR = 'DOCTOR',
    PATIENT = 'PATIENT',
}

export enum NotificationChannel {
    SMS = 'SMS',
    EMAIL = 'EMAIL',
}

export enum NotificationStatus {
    QUEUED = 'QUEUED',
    SENT = 'SENT',
    FAILED = 'FAILED',
}

export interface INotificationOutbox extends Document {
    type: NotificationType;
    target: NotificationTarget;
    doctorId?: mongoose.Types.ObjectId;
    patientId?: mongoose.Types.ObjectId;
    appointmentId: mongoose.Types.ObjectId;
    channel: NotificationChannel;
    status: NotificationStatus;
    payload: any;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationOutboxSchema: Schema = new Schema(
    {
        type: { type: String, enum: Object.values(NotificationType), required: true },
        target: { type: String, enum: Object.values(NotificationTarget), required: true },
        doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
        appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
        channel: { type: String, enum: Object.values(NotificationChannel), required: true },
        status: { type: String, enum: Object.values(NotificationStatus), default: NotificationStatus.QUEUED },
        payload: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

// Indexes for notification processing
NotificationOutboxSchema.index({ status: 1, createdAt: 1 });
NotificationOutboxSchema.index({ appointmentId: 1 });
NotificationOutboxSchema.index({ patientId: 1 });
NotificationOutboxSchema.index({ doctorId: 1 });

export default mongoose.model<INotificationOutbox>('NotificationOutbox', NotificationOutboxSchema);
