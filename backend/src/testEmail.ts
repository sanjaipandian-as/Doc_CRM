import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const testEmail = async () => {
    try {
        console.log('🚀 Starting Email Test Script...\n');

        // Log configuration
        console.log('📋 Configuration:');
        console.log(`  SMTP Host: ${process.env.SMTP_HOST}`);
        console.log(`  SMTP Port: ${process.env.SMTP_PORT}`);
        console.log(`  SMTP User: ${process.env.SMTP_USER}`);
        console.log(`  From Email: ${process.env.SMTP_FROM_EMAIL || 'sachin06kaizen@gmail.com'}`);
        console.log(`  From Name: ${process.env.SMTP_FROM_NAME || 'Clinic Management System'}\n`);

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Test connection
        console.log('🔍 Testing SMTP Connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!\n');

        // Send test email
        console.log('📧 Sending Test Email...');
        const testRecipient = 'lasercodes0@gmail.com';

        const htmlContent = `
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
                .status-card {
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
                .info-item {
                    margin-bottom: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .info-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #6b7280;
                }
                .info-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #111827;
                }
                .success-badge {
                    display: inline-block;
                    background-color: #dcfce7;
                    color: #166534;
                    padding: 6px 12px;
                    border-radius: 9999px;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
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
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="header">
                        <h1>DeskDoc</h1>
                        <p>Email Service Verification</p>
                    </div>
                    
                    <div class="content">
                        <p class="greeting">System Check Successful! 👋</p>
                        <p class="intro-text">This is a test email to verify that the DeskDoc Clinic Management System email service is fully operational.</p>
                        
                        <div class="status-card">
                            <div class="card-title">Service Status</div>
                            
                            <div class="info-item">
                                <span class="info-label">SMTP Connection</span>
                                <span class="success-badge">Active</span>
                            </div>
                            
                            <div class="info-item">
                                <span class="info-label">Sender Address</span>
                                <span class="info-value">${process.env.SMTP_FROM_EMAIL || 'sachin06kaizen@gmail.com'}</span>
                            </div>
                            
                            <div class="info-item">
                                <span class="info-label">Timestamp</span>
                                <span class="info-value">${new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        })}</span>
                            </div>
                        </div>
                        
                        <div style="background: #eff6ff; border-radius: 12px; padding: 20px; border-left: 4px solid #3b82f6;">
                            <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 600;">
                                ✅ All systems are operational. The clinic can now send automated appointment notifications and reminders.
                            </p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p><strong>DeskDoc Clinic Management System</strong></p>
                        <p>This is an automated system test. Please do not reply.</p>
                        <p>&copy; ${new Date().getFullYear()} DeskDoc. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Clinic Management System'}" <${process.env.SMTP_FROM_EMAIL || 'sachin06kaizen@gmail.com'}>`,
            to: testRecipient,
            subject: '🏥 Test Email - DeskDoc System',
            html: htmlContent,
        });

        console.log(`✅ Email sent successfully!`);
        console.log(`📬 Message ID: ${info.messageId}`);
        console.log(`📧 Recipient: ${testRecipient}`);
        console.log(`⏰ Sent at: ${new Date().toLocaleString()}\n`);

        console.log('✨ Test completed successfully!');
        console.log('📩 Check your inbox at lasercodes0@gmail.com');

        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed with error:');
        console.error(error);
        process.exit(1);
    }
};

testEmail();
