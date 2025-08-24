const http = require('http');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const crypto = require('crypto');
const db = require('./db');
const auth = require('./auth');

const PORT = process.env.PORT || 3000;

// --- Helper Functions ---
const parseCookies = (cookieHeader = '') => cookieHeader.split(';').reduce((acc, cookie) => { if (!cookie.includes('=')) return acc; const [key, value] = cookie.trim().split('='); acc[key] = value; return acc; }, {});
const sendResponse = (res, statusCode, contentType, data, headers = {}) => { res.writeHead(statusCode, { 'Content-Type': contentType, ...headers }); res.end(data); };
const getBody = async (req) => { let body = ''; for await (const chunk of req) { body += chunk; } try { if (req.headers['content-type'] === 'application/json') return body ? JSON.parse(body) : {}; return body; } catch (e) { return null; } };
const serveStaticFile = (res, filePath, basePath) => {
    const resolvedPath = path.resolve(basePath, filePath);
    if (!resolvedPath.startsWith(basePath)) return sendResponse(res, 403, 'text/plain', 'Forbidden');
    const ext = path.extname(resolvedPath).toLowerCase();
    const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png' };
    fs.readFile(resolvedPath, (err, content) => { if (err) { sendResponse(res, 404, 'text/plain', `Not Found: ${filePath}`); } else { sendResponse(res, 200, mimeTypes[ext] || 'application/octet-stream', content); } });
};

// --- Main Server Logic ---
const server = http.createServer(async (req, res) => {
    const { method, url } = req;
    const { pathname } = new URL(url, `http://${req.headers.host}`);
    console.log(`Request: ${method} ${pathname}`);

    try {
        if (pathname.startsWith('/api/')) {
            const body = await getBody(req);
            if (body === null) return sendResponse(res, 400, 'application/json', JSON.stringify({ message: 'Invalid JSON' }));

            if (method === 'POST' && pathname === '/api/session/start') {
                const { nome, cognome, email, phone, ref } = body;
                const validRefs = ["R806", "R703", "R509", "H420", "R160", "R430", "R520", "H505", "R530-D", "R500-A"];
                if (!nome || !cognome || !email || !phone || !ref || !validRefs.includes(ref.toUpperCase())) return sendResponse(res, 400, 'application/json', JSON.stringify({ message: 'Dati invalidi' }));
                let lead = await db.find('leads', l => l.email === email) || await db.push('leads', { id: `lead_${crypto.randomUUID()}`, nome, cognome, email, phone });
                const otp = auth.createOtp();
                const session = await db.push('sessions', { id: `sess_${crypto.randomUUID()}`, lead_id: lead.id, property_ref: ref, created_at: new Date().toISOString(), verified: false, otp_hash: auth.hashValue(otp), otp_expires: Date.now() + 600000, otp_attempts: 0 });
                console.log(`---- OTP per ${email}: ${otp} ----`);
                return sendResponse(res, 200, 'application/json', JSON.stringify({ sessionId: session.id }));
            }
            if (method === 'POST' && pathname === '/api/otp/verify') {
                const { sessionId, code } = body;
                if (!sessionId || !code) return sendResponse(res, 400, 'application/json', JSON.stringify({ message: 'Payload incompleto.' }));
                const session = await db.find('sessions', s => s.id === sessionId);
                if (!session || session.verified || session.otp_attempts >= 5 || Date.now() > session.otp_expires) return sendResponse(res, 400, 'application/json', JSON.stringify({ message: 'Sessione non valida o OTP scaduto.' }));
                if (auth.hashValue(code) !== session.otp_hash) {
                    session.otp_attempts++; await db.update('sessions', s => s.id === sessionId, () => session);
                    return sendResponse(res, 400, 'application/json', JSON.stringify({ message: 'Codice OTP non valido.' }));
                }
                session.verified = true; await db.update('sessions', s => s.id === sessionId, () => session);
                const token = auth.createSignedToken(sessionId);
                const cookie = `session_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=1800`;
                return sendResponse(res, 200, 'application/json', JSON.stringify({ success: true }), { 'Set-Cookie': cookie });
            }
            return sendResponse(res, 404, 'application/json', JSON.stringify({ message: 'Endpoint API non trovato.' }));

        } else {
            const isStaffRoute = pathname.startsWith('/staff-console');
            const basePath = isStaffRoute ? path.join(__dirname, '../staff-console') : path.join(__dirname, '../frontend');
            let resourcePath = '';
            if (isStaffRoute) {
                resourcePath = pathname.substring(14) || 'login.html';
            } else {
                if (pathname === '/' || pathname.startsWith('/start')) {
                    resourcePath = 'index.html';
                } else {
                    resourcePath = pathname.substring(1);
                }
            }
            return serveStaticFile(res, resourcePath, basePath);
        }
    } catch (error) {
        console.error("Unhandled Server Error:", error);
        sendResponse(res, 500, 'text/plain', 'Internal Server Error');
    }
});

server.listen(PORT, () => { console.log(`Zero-dependency server running on http://localhost:${PORT}`); });
