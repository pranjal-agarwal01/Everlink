// Email sender — uses Brevo HTTPS API when BREVO_API_KEY is set (production / Render),
// otherwise falls back to Nodemailer SMTP for local dev.
//
// Why two paths: Render's free tier blocks outbound SMTP ports (25, 465, 587),
// so SMTP/Gmail will never work in production. Brevo (formerly Sendinblue) exposes
// an HTTPS REST API that goes over port 443, which Render does allow.

const nodemailer = require('nodemailer');
const { resolve4 } = require('dns').promises;

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

const wrapHtml = (text) => `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#ff6b6b;margin:0 0 16px">Everlink</h2>
        <p style="font-size:15px;line-height:1.6">${text.replace(/\n/g, '<br>')}</p>
        <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
    </div>`;

// --- Brevo (HTTPS API) ---
const sendViaBrevo = async (options) => {
    const fromEmail = (process.env.FROM_EMAIL || process.env.SMTP_EMAIL || '').trim();
    const fromName = process.env.FROM_NAME || 'Everlink';

    if (!fromEmail) {
        throw new Error('FROM_EMAIL is required when using Brevo');
    }

    const body = {
        sender: { name: fromName, email: fromEmail },
        to: [{ email: options.email }],
        subject: options.subject,
        textContent: options.text,
        htmlContent: options.html || wrapHtml(options.text),
    };

    const res = await fetch(BREVO_ENDPOINT, {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            accept: 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        let detail = '';
        try {
            const errBody = await res.json();
            detail = `${errBody.code || ''} ${errBody.message || ''}`.trim();
        } catch {
            detail = await res.text().catch(() => '');
        }
        const err = new Error(`Brevo API ${res.status}: ${detail || 'unknown error'}`);
        err.status = res.status;
        throw err;
    }

    const data = await res.json().catch(() => ({}));
    console.log(`[EMAIL/Brevo] Sent to ${options.email} — id: ${data.messageId || '?'}`);
};

// --- SMTP (local dev fallback) ---
let _transporter = null;

const buildTransporter = async () => {
    const email = (process.env.SMTP_EMAIL || '').trim();
    const pass = (process.env.SMTP_PASSWORD || '').trim();

    if (!email || !pass) {
        console.warn('[EMAIL] No SMTP credentials. Set BREVO_API_KEY (production) or SMTP_EMAIL+SMTP_PASSWORD (local).');
        return null;
    }

    // Explicit IPv4 resolution — Render free tier cannot reach IPv6
    let smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    try {
        const [ipv4] = await resolve4(smtpHost);
        console.log(`[EMAIL/SMTP] ${smtpHost} resolved to IPv4: ${ipv4}`);
        smtpHost = ipv4;
    } catch (dnsErr) {
        console.warn('[EMAIL/SMTP] DNS resolve4 failed, using hostname:', dnsErr.message);
    }

    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpSecure = smtpPort === 465;

    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        auth: { user: email, pass },
        tls: {
            rejectUnauthorized: false,
            servername: process.env.SMTP_HOST || 'smtp.gmail.com',
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });
};

const sendViaSmtp = async (options) => {
    if (!_transporter) {
        _transporter = await buildTransporter();
    }
    if (!_transporter) {
        throw new Error('No email transport configured');
    }

    const fromEmail = (process.env.FROM_EMAIL || process.env.SMTP_EMAIL || '').trim();
    const fromName = process.env.FROM_NAME || 'Everlink';

    try {
        const info = await _transporter.sendMail({
            from: `${fromName} <${fromEmail}>`,
            to: options.email,
            subject: options.subject,
            text: options.text,
            html: options.html || wrapHtml(options.text),
        });
        console.log(`[EMAIL/SMTP] Sent to ${options.email} — id: ${info.messageId}`);
    } catch (err) {
        _transporter = null; // reset on failure so next call rebuilds with fresh DNS
        throw err;
    }
};

// --- Public entrypoint ---
const sendEmail = async (options) => {
    try {
        if (process.env.BREVO_API_KEY) {
            return await sendViaBrevo(options);
        }
        return await sendViaSmtp(options);
    } catch (err) {
        console.error(`[EMAIL] FAILED: ${err.message}`);
        throw err;
    }
};

module.exports = sendEmail;
