import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
    name: string;
    email: string;
    specialization?: string;
    isActive: boolean;
    defaultSlotDurationMinutes: number;
    createdAt: Date;
    updatedAt: Date;
}

const DoctorSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        specialization: { type: String },
        isActive: { type: Boolean, default: true },
        defaultSlotDurationMinutes: { type: Number, default: 15 },
    },
    { timestamps: true }
);

// Indexes for fast retrieval
DoctorSchema.index({ isActive: 1 });
DoctorSchema.index({ name: 1 });
DoctorSchema.index({ specialization: 1 });

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
