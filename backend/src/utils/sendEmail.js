const nodemailer = require('nodemailer');

// Singleton transporter — created once, reused for speed
let _transporter = null;

const getTransporter = () => {
    if (_transporter) return _transporter;

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        return null; // Dev mode — no real credentials
    }

    _transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for port 465, false for 587
        auth: {
            user: process.env.SMTP_EMAIL.trim(),
            pass: process.env.SMTP_PASSWORD.trim(),
        },
        tls: {
            rejectUnauthorized: false // Avoids cert issues on Render
        }
    });

    return _transporter;
};

const sendEmail = async (options) => {
    const transporter = getTransporter();

    if (!transporter) {
        console.log('[DEV] Mock Email — no SMTP credentials. Would have sent:', {
            to: options.email,
            subject: options.subject,
        });
        if (process.env.NODE_ENV === 'development') {
            console.log('[DEV] OTP message:', options.text);
        }
        return;
    }

    const message = {
        from: `${process.env.FROM_NAME || 'Everlink'} <${(process.env.FROM_EMAIL || process.env.SMTP_EMAIL).trim()}>`,
        to: options.email,
        subject: options.subject,
        text: options.text,
        html: options.html || `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#ff6b6b">Everlink</h2>
            <p>${options.text.replace(/\n/g, '<br>')}</p>
            <p style="color:#888;font-size:12px">If you didn't request this, you can ignore this email.</p>
        </div>`
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent:', info.messageId);
};

module.exports = sendEmail;
