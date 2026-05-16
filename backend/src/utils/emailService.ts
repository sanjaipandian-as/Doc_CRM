import nodemailer from 'nodemailer';
import Appointment, { IAppointment } from '../models/Appointment';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import AppointmentType from '../models/AppointmentType';

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Test SMTP connection
export const testSMTPConnection = async (): Promise<void> => {
    try {
        console.log('🔍 Testing SMTP connection...');
        console.log(`Host: ${process.env.SMTP_HOST}`);
        console.log(`Port: ${process.env.SMTP_PORT}`);
        console.log(`User: ${process.env.SMTP_USER}`);

        await transporter.verify();
        console.log('✅ SMTP connection successful!');
    } catch (error) {
        console.error('❌ SMTP connection failed:', error);
    }
};

export const sendTestEmail = async (toEmail: string): Promise<void> => {
    try {
        console.log(`📧 Sending test email to ${toEmail}...`);

        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Clinic Management System'}" <${process.env.SMTP_FROM_EMAIL || 'sachin06kaizen@gmail.com'}>`,
            to: toEmail,
            subject: 'Test Email from Clinic Management System',
            html: `<h1>Test Email</h1><p>This is a test email from the Clinic Management System.</p><p>If you received this, the email system is working correctly!</p>`,
        });

        console.log(`✅ Test email sent: ${info.messageId}`);
    } catch (error) {
        console.error('❌ Failed to send test email:', error);
    }
};

export const sendAppointmentCreatedToDoctor = async (appointmentId: string): Promise<void> => {
    try {
        console.log(`📧 Starting email send for appointment: ${appointmentId}`);

        // Fetch appointment details
        const appointment = await Appointment.findById(appointmentId)
            .populate('doctorId')
            .populate('patientId')
            .populate('appointmentTypeId');

        if (!appointment) {
            console.error(`❌ Appointment ${appointmentId} not found`);
            return;
        }

        const doctor = appointment.doctorId as any;
        const patient = appointment.patientId as any;
        const appointmentType = appointment.appointmentTypeId as any;

        console.log(`👨‍⚕️ Doctor: ${doctor?.name} (${doctor?._id})`);
        console.log(`🏥 Doctor Email: ${doctor?.email}`);

        if (!doctor?.email) {
            console.error(`❌ Doctor email not found for appointment ${appointmentId}`);
            return;
        }

        // Generate HTML email content
        const emailContent = generateAppointmentEmailHTML(
            doctor.name,
            patient.name,
            patient.phone,
            appointment.date,
            appointment.startTime,
            appointment.endTime,
            appointmentType?.name || 'General'
        );

        // Send email
        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'Clinic Management System'}" <${process.env.SMTP_FROM_EMAIL || 'sachin06kaizen@gmail.com'}>`,
            to: doctor.email,
            subject: `New Appointment Scheduled - ${appointment.date} at ${appointment.startTime}`,
            html: emailContent,
        };

        console.log(`📨 Sending email to: ${mailOptions.to}`);
        console.log(`📨 From: ${mailOptions.from}`);
        console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
        console.log(`SMTP User: ${process.env.SMTP_USER}`);

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${doctor.email}: ${info.messageId}`);
    } catch (error) {
        console.error('❌ Error sending appointment email to doctor:', error);
        // Don't throw - we don't want email failures to break the appointment creation
    }
};

const generateAppointmentEmailHTML = (
    doctorName: string,
    patientName: string,
    patientPhone: string,
    date: string,
    startTime: string,
    endTime: string,
    appointmentType: string
): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background-color: #f3f4f6;
                margin: 0;
                padding: 0;
            }
            .wrapper {
                width: 100%;
                table-layout: fixed;
                background-color: #f3f4f6;
                padding-bottom: 40px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 16px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                margin-top: 40px;
            }
            .header {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.025em;
            }
            .header p {
                margin: 10px 0 0;
                opacity: 0.9;
                font-size: 16px;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 12px;
                color: #111827;
            }
            .intro-text {
                font-size: 16px;
                color: #4b5563;
                margin-bottom: 32px;
            }
            .appointment-card {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 32px;
            }
            .card-title {
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #6b7280;
                margin-bottom: 20px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 10px;
            }
            .detail-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            .detail-item {
                margin-bottom: 20px;
            }
            .detail-label {
                font-size: 12px;
                font-weight: 600;
                color: #9ca3af;
                text-transform: uppercase;
                margin-bottom: 4px;
            }
            .detail-value {
                font-size: 16px;
                font-weight: 600;
                color: #111827;
            }
            .highlight-box {
                background: #eff6ff;
                border-radius: 8px;
                padding: 16px;
                margin-top: 10px;
                border-left: 4px solid #3b82f6;
            }
            .highlight-label {
                font-size: 11px;
                font-weight: 700;
                color: #1d4ed8;
                text-transform: uppercase;
                margin-bottom: 2px;
            }
            .highlight-value {
                font-size: 18px;
                font-weight: 700;
                color: #1e3a8a;
            }
            .footer {
                background-color: #f9fafb;
                padding: 30px;
                text-align: center;
                font-size: 13px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
            }
            .footer p {
                margin: 5px 0;
            }
            .badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 9999px;
                font-size: 12px;
                font-weight: 600;
                background-color: #dcfce7;
                color: #166534;
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1>DeskDoc</h1>
                    <p>New Appointment Confirmation</p>
                </div>
                
                <div class="content">
                    <p class="greeting">Hello Dr. ${doctorName},</p>
                    <p class="intro-text">A new patient has been scheduled for a consultation. Here are the appointment details:</p>
                    
                    <div class="appointment-card">
                        <div class="card-title">Appointment Summary</div>
                        
                        <div style="margin-bottom: 24px;">
                            <div class="detail-label">Doctor</div>
                            <div class="detail-value" style="font-size: 20px; color: #1e40af;">Dr. ${doctorName}</div>
                        </div>

                        <div style="display: flex; gap: 20px; margin-bottom: 24px;">
                            <div style="flex: 1;">
                                <div class="detail-label">Date</div>
                                <div class="highlight-box">
                                    <div class="highlight-label">Scheduled For</div>
                                    <div class="highlight-value">${formatDate(date)}</div>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 20px; margin-bottom: 24px;">
                            <div style="flex: 1;">
                                <div class="detail-label">Time Slot</div>
                                <div class="detail-value">${startTime} - ${endTime}</div>
                            </div>
                            <div style="flex: 1;">
                                <div class="detail-label">Type</div>
                                <div class="badge">${appointmentType}</div>
                            </div>
                        </div>

                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                            <div style="display: flex; gap: 20px;">
                                <div style="flex: 1;">
                                    <div class="detail-label">Patient Name</div>
                                    <div class="detail-value">${patientName}</div>
                                </div>
                                <div style="flex: 1;">
                                    <div class="detail-label">Contact</div>
                                    <div class="detail-value">${patientPhone}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; text-align: center;">
                        Please ensure you are available at the scheduled time. 
                        If you need to reschedule, please contact the clinic administrator.
                    </p>
                </div>
                
                <div class="footer">
                    <p><strong>DeskDoc Clinic Management System</strong></p>
                    <p>This is an automated notification. Please do not reply.</p>
                    <p>&copy; ${new Date().getFullYear()} DeskDoc. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
};
