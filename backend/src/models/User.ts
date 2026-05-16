import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
    ADMIN = 'ADMIN',
    RECEPTIONIST = 'RECEPTIONIST',
    DOCTOR = 'DOCTOR',
}

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    doctorId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: Object.values(UserRole), required: true },
        doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    },
    { timestamps: true }
);

// Indexes for fast retrieval
UserSchema.index({ role: 1 });
UserSchema.index({ doctorId: 1 });

export default mongoose.model<IUser>('User', UserSchema);
