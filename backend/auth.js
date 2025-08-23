const crypto = require('crypto');

// It's critical that this secret is not hardcoded in a real app.
// It should come from environment variables.
const HMAC_SECRET = process.env.HMAC_SECRET || 'a-secure-secret-for-mvp-dont-use-in-prod';

const createSignedToken = (sessionId) => {
    const payload = {
        sessionId,
        // Set expiration to 30 minutes from now
        expires: Date.now() + (30 * 60 * 1000),
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
        .createHmac('sha256', HMAC_SECRET)
        .update(payloadBase64)
        .digest('base64url');

    return `${payloadBase64}.${signature}`;
};

const verifySignedToken = (token) => {
    if (!token) {
        return { valid: false, reason: 'No token provided' };
    }

    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) {
        return { valid: false, reason: 'Invalid token format' };
    }

    const expectedSignature = crypto
        .createHmac('sha256', HMAC_SECRET)
        .update(payloadBase64)
        .digest('base64url');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));

        if (Date.now() > payload.expires) {
            return { valid: false, reason: 'Token expired' };
        }

        return { valid: true, sessionId: payload.sessionId };
    }

    return { valid: false, reason: 'Invalid signature' };
};

const createOtp = () => {
    // Generate a 6-digit numeric OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// In a real app, you'd use a library like bcrypt.
// For zero-dependency, we'll use HMAC which is better than plaintext.
const hashValue = (value) => {
    return crypto.createHmac('sha256', HMAC_SECRET).update(value).digest('hex');
};

module.exports = {
    createSignedToken,
    verifySignedToken,
    createOtp,
    hashValue,
};
