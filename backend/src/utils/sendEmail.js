const nodemailer = require('nodemailer');
const { resolve4 } = require('dns').promises;

let _transporter = null;

const buildTransporter = async () => {
    const email = (process.env.SMTP_EMAIL || '').trim();
    const pass  = (process.env.SMTP_PASSWORD || '').trim();

    if (!email || !pass) {
        console.warn('[EMAIL] No SMTP credentials in environment. Set SMTP_EMAIL and SMTP_PASSWORD on Render.');
        return null;
    }

    // Explicitly resolve smtp.gmail.com to an IPv4 address.
    // Render free tier cannot reach IPv6 — this sidesteps the OS DNS preference entirely.
    let smtpHost = 'smtp.gmail.com';
    try {
        const [ipv4] = await resolve4('smtp.gmail.com');
        smtpHost = ipv4;
        console.log(`[EMAIL] smtp.gmail.com resolved to IPv4: ${smtpHost}`);
    } catch (dnsErr) {
        console.warn('[EMAIL] DNS resolve4 failed, using hostname:', dnsErr.message);
    }

    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpSecure = smtpPort === 465; // 465 = SSL, 587 = STARTTLS

    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        pool: true,           // reuse SMTP connections
        maxConnections: 3,
        maxMessages: 100,
        auth: { user: email, pass },
        tls: {
            rejectUnauthorized: false,
            servername: 'smtp.gmail.com', // SNI uses hostname even when connecting by IP
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });
};

const sendEmail = async (options) => {
    if (!_transporter) {
        _transporter = await buildTransporter();
    }

    if (!_transporter) {
        throw new Error('Email transporter could not be built — check SMTP credentials in .env');
    }

    const fromEmail = (process.env.FROM_EMAIL || process.env.SMTP_EMAIL || '').trim();
    const fromName  = process.env.FROM_NAME || 'Everlink';

    try {
        const info = await _transporter.sendMail({
            from: `${fromName} <${fromEmail}>`,
            to:   options.email,
            subject: options.subject,
            text: options.text,
            html: options.html || `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                    <h2 style="color:#ff6b6b;margin:0 0 16px">Everlink</h2>
                    <p style="font-size:15px;line-height:1.6">${options.text.replace(/\n/g, '<br>')}</p>
                    <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
                </div>`,
        });
        console.log(`[EMAIL] Sent to ${options.email} — id: ${info.messageId}`);
    } catch (err) {
        _transporter = null; // reset so next attempt rebuilds with fresh DNS
        console.error(`[EMAIL] FAILED: ${err.code} — ${err.message}`);
        throw err;
    }
};

module.exports = sendEmail;
