import mongoose, { Schema, Document } from 'mongoose';

export enum QueueStatus {
    WAITING = 'WAITING',
    SERVING = 'SERVING',
    DONE = 'DONE',
    CANCELLED = 'CANCELLED',
}

export interface IQueueToken extends Document {
    doctorId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    appointmentId?: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    tokenNumber: number;
    queuePosition: number;
    status: QueueStatus;
    createdAt: Date;
    updatedAt: Date;
}

const QueueTokenSchema: Schema = new Schema(
    {
        doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
        date: { type: String, required: true },
        appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
        tokenNumber: { type: Number, required: true },
        queuePosition: { type: Number, required: true },
        status: { type: String, enum: Object.values(QueueStatus), default: QueueStatus.WAITING },
    },
    { timestamps: true }
);

// Indexes for quick lookups
QueueTokenSchema.index({ doctorId: 1, date: 1, queuePosition: 1 });
QueueTokenSchema.index({ patientId: 1 });
QueueTokenSchema.index({ status: 1, doctorId: 1, date: 1 });

export default mongoose.model<IQueueToken>('QueueToken', QueueTokenSchema);
