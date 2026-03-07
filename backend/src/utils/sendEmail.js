const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Skip sending if we don't have real credentials — log it so dev can see the OTP
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.log('[DEV] Mock Email — no SMTP credentials set. Would have sent:', {
            to: options.email,
            subject: options.subject,
            text: options.message,
        });
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const message = {
        from: `${process.env.FROM_NAME || 'Everlink'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent: %s', info.messageId);
};

module.exports = sendEmail;
