import mongoose, { Schema, Document } from 'mongoose';

export enum AppointmentStatus {
    SCHEDULED = 'SCHEDULED',
    CHECKED_IN = 'CHECKED_IN',
    IN_QUEUE = 'IN_QUEUE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

export enum BookingMode {
    NORMAL = 'NORMAL',
    BACKDATED = 'BACKDATED',
}

export interface IAppointment extends Document {
    doctorId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    appointmentTypeId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    durationMinutes: number;
    status: AppointmentStatus;
    bookingMode: BookingMode;
    cancellationReason?: string;
    rescheduleReason?: string;
    createdBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
    {
        doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
        appointmentTypeId: { type: Schema.Types.ObjectId, ref: 'AppointmentType', required: true },
        date: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        durationMinutes: { type: Number, required: true },
        status: { type: String, enum: Object.values(AppointmentStatus), default: AppointmentStatus.SCHEDULED },
        bookingMode: { type: String, enum: Object.values(BookingMode), default: BookingMode.NORMAL },
        cancellationReason: { type: String },
        rescheduleReason: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

// Index for quick lookups
AppointmentSchema.index({ doctorId: 1, date: 1 });
AppointmentSchema.index({ patientId: 1 });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
