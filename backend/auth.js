const crypto = require('crypto');

const HMAC_SECRET = process.env.HMAC_SECRET || 'a-very-secret-key-that-should-be-in-env';

const createSignedToken = (sessionId, duration = 30 * 60 * 1000) => {
    const payload = {
        sessionId,
        expires: Date.now() + duration,
    };
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payloadBase64).digest('base64url');
    return `${payloadBase64}.${signature}`;
};

const verifySignedToken = (token) => {
    if (!token) return { valid: false };

    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return { valid: false };

    const expectedSignature = crypto.createHmac('sha256', HMAC_SECRET).update(payloadBase64).digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return { valid: false, reason: 'Invalid signature' };
    }

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (Date.now() > payload.expires) {
        return { valid: false, reason: 'Token expired' };
    }

    return { valid: true, sessionId: payload.sessionId };
};

const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const hashValue = (value) => crypto.createHmac('sha256', HMAC_SECRET).update(value).digest('hex');

module.exports = {
    createSignedToken,
    verifySignedToken,
    createOtp,
    hashValue,
};
