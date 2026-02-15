/**
 * Email Test Endpoint for SMTP Debugging
 * This helps diagnose email configuration issues
 */

const express = require('express');
const router = express.Router();
const { sendMailWithFallback, getEmailSender, getSmtpConfig } = require('../utils/emailConfig');

// Test email endpoint for debugging SMTP
router.post('/test-email', async (req, res) => {
    try {
        console.log('🧪 Email test endpoint called');
        
        // Log current SMTP configuration (without password)
        const smtpConfig = getSmtpConfig();
        const configToLog = {
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            requireTLS: smtpConfig.requireTLS,
            user: smtpConfig.auth.user,
            password: smtpConfig.auth.pass ? '***SET***' : 'NOT_SET'
        };
        
        console.log('📧 Current SMTP Config:', configToLog);
        
        // Test email content
        const testEmail = {
            from: getEmailSender(),
            to: smtpConfig.auth.user, // Send to self for testing
            subject: '🧪 KudiMall SMTP Test',
            html: `
                <h2>🧪 SMTP Test Email</h2>
                <p>If you receive this email, your SMTP configuration is working correctly!</p>
                <p><strong>Configuration used:</strong></p>
                <ul>
                    <li>Host: ${smtpConfig.host}</li>
                    <li>Port: ${smtpConfig.port}</li>
                    <li>Secure: ${smtpConfig.secure}</li>
                    <li>User: ${smtpConfig.auth.user}</li>
                </ul>
                <p>Test sent at: ${new Date().toISOString()}</p>
            `
        };

        console.log('📤 Sending test email...');
        const result = await sendMailWithFallback(testEmail);
        
        console.log('✅ Test email sent successfully!', result.messageId);
        
        res.json({
            success: true,
            message: 'Test email sent successfully',
            config: configToLog,
            messageId: result.messageId,
            sentTo: smtpConfig.auth.user
        });
        
    } catch (error) {
        console.error('❌ Email test failed:', error);
        
        res.status(500).json({
            success: false,
            error: 'Email test failed',
            details: error.message,
            code: error.code,
            command: error.command,
            config: {
                host: process.env.EMAIL_HOST || 'NOT_SET',
                port: process.env.EMAIL_PORT || 'NOT_SET',
                user: process.env.EMAIL_USER || 'NOT_SET',
                password: process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT_SET',
                secure: process.env.EMAIL_SECURE || 'NOT_SET'
            }
        });
    }
});

module.exports = router;