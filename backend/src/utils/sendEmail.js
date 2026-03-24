const nodemailer = require('nodemailer');

// Reset singleton so a failed connection gets recreated on next attempt
let _transporter = null;

const createTransporter = () => {
    const email = (process.env.SMTP_EMAIL || '').trim();
    const pass  = (process.env.SMTP_PASSWORD || '').trim();

    if (!email || !pass) {
        console.warn('[EMAIL] No SMTP credentials in environment — emails will NOT be sent.');
        return null;
    }

    console.log(`[EMAIL] Creating transporter for ${email} on port 465 (SSL)`);

    // Port 465 + secure:true is the most reliable config on cloud hosts like Render.
    // Port 587 (STARTTLS) is often blocked by cloud providers.
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,          // SSL — works reliably on Render
        auth: { user: email, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
        greetingTimeout:   15000,
        socketTimeout:     15000,
    });
};

const sendEmail = async (options) => {
    if (!_transporter) {
        _transporter = createTransporter();
    }

    if (!_transporter) {
        // Dev fallback
        console.log('[EMAIL] Skipping send — no credentials.');
        return;
    }

    const fromEmail = (process.env.FROM_EMAIL || process.env.SMTP_EMAIL || '').trim();
    const fromName  = process.env.FROM_NAME || 'Everlink';

    const message = {
        from: `${fromName} <${fromEmail}>`,
        to:   options.email,
        subject: options.subject,
        text: options.text,
        html: options.html || `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                <h2 style="color:#ff6b6b;margin:0 0 16px">Everlink</h2>
                <p style="font-size:15px;line-height:1.6">${options.text.replace(/\n/g, '<br>')}</p>
                <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
            </div>`
    };

    try {
        const info = await _transporter.sendMail(message);
        console.log(`[EMAIL] Sent to ${options.email} — id: ${info.messageId}`);
    } catch (err) {
        // Reset singleton so next attempt gets a fresh connection
        _transporter = null;
        console.error(`[EMAIL] FAILED to send to ${options.email}`);
        console.error(`[EMAIL] Error code: ${err.code}`);
        console.error(`[EMAIL] Error message: ${err.message}`);
        throw err; // re-throw so caller's .catch() handles it
    }
};

module.exports = sendEmail;
