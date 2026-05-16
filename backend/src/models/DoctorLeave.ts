import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorLeave extends Document {
    doctorId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DoctorLeaveSchema: Schema = new Schema(
    {
        doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
        date: { type: String, required: true },
        reason: { type: String },
    },
    { timestamps: true }
);

// Ensure a doctor can't have multiple leave records for the same day
DoctorLeaveSchema.index({ doctorId: 1, date: 1 }, { unique: true });

export default mongoose.model<IDoctorLeave>('DoctorLeave', DoctorLeaveSchema);
