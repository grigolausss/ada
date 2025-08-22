const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3000;
const dbPath = path.join(__dirname, 'db.json');
const frontendPath = path.join(__dirname, '../frontend');

// --- Helper Functions ---
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const writeDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

const sendResponse = (res, statusCode, contentType, data) => {
    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(data);
};

const serveStaticFile = (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                sendResponse(res, 404, 'text/plain', '404 Not Found');
            } else {
                sendResponse(res, 500, 'text/plain', '500 Server Error');
            }
        } else {
            sendResponse(res, 200, contentType, content);
        }
    });
};

// --- Request Handler ---
const requestHandler = (req, res) => {
    const { method, url } = req;
    const parsedUrl = new URL(url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        const data = body ? JSON.parse(body) : {};

        // --- API Routes ---
        if (pathname.startsWith('/api/')) {
            if (method === 'GET' && pathname === '/api/properties') {
                const db = readDb();
                sendResponse(res, 200, 'application/json', JSON.stringify(db.properties));
            } else if (method === 'GET' && pathname.startsWith('/api/properties/')) {
                const ref = pathname.split('/')[3];
                const db = readDb();
                const property = db.properties.find(p => p.ref === ref);
                if (property) {
                    sendResponse(res, 200, 'application/json', JSON.stringify(property));
                } else {
                    sendResponse(res, 404, 'application/json', JSON.stringify({ message: 'Property not found' }));
                }
            } else if (method === 'POST' && pathname === '/api/session/start') {
                const { phone, token } = data;
                if (!phone || !token) {
                    return sendResponse(res, 400, 'application/json', JSON.stringify({ message: 'Phone and token are required' }));
                }
                const db = readDb();
                const sessionId = `sess_${Date.now()}`;
                db.sessions.push({ id: sessionId, token, otp_ok: false, phone, lead_id: null });
                writeDb(db);
                console.log(`Simulating OTP for ${phone}. OTP: 123456`);
                sendResponse(res, 200, 'application/json', JSON.stringify({ sessionId }));
            } else if (method === 'POST' && pathname === '/api/session/verify') {
                const { sessionId, otp } = data;
                if (otp === '123456') {
                    const db = readDb();
                    const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
                    if (sessionIndex > -1) {
                        db.sessions[sessionIndex].otp_ok = true;
                        let lead = db.leads.find(l => l.phone === db.sessions[sessionIndex].phone);
                        if (!lead) {
                            lead = { id: `lead_${Date.now()}`, phone: db.sessions[sessionIndex].phone, status: 'new' };
                            db.leads.push(lead);
                        }
                        db.sessions[sessionIndex].lead_id = lead.id;
                        delete db.sessions[sessionIndex].phone;
                        writeDb(db);
                        sendResponse(res, 200, 'application/json', JSON.stringify({ success: true }));
                    } else {
                        sendResponse(res, 404, 'application/json', JSON.stringify({ success: false, message: 'Session not found' }));
                    }
                } else {
                    sendResponse(res, 400, 'application/json', JSON.stringify({ success: false, message: 'Invalid OTP' }));
                }
            } else if (method === 'POST' && pathname === '/api/answers') {
                const { sessionId, propertyRef, answers } = data;
                const db = readDb();
                db.answers.push({ session_id: sessionId, property_ref: propertyRef, answers, ts: new Date().toISOString() });
                writeDb(db);
                sendResponse(res, 201, 'application/json', JSON.stringify({ success: true }));
            } else if (method === 'GET' && pathname.startsWith('/api/session/details/')) {
                const sessionId = pathname.split('/')[4];
                const db = readDb();
                const session = db.sessions.find(s => s.id === sessionId);
                if (session && session.lead_id) {
                    const lead = db.leads.find(l => l.id === session.lead_id);
                    const ip = req.socket.remoteAddress;
                    sendResponse(res, 200, 'application/json', JSON.stringify({ phone: lead ? lead.phone : 'N/A', ip }));
                } else {
                    sendResponse(res, 404, 'application/json', JSON.stringify({ message: 'Session or Lead not found' }));
                }
            } else if (method === 'POST' && pathname === '/api/plan-views') {
                const { sessionId, propertyRef } = data;
                const db = readDb();
                db.plan_views.push({ session_id: sessionId, property_ref: propertyRef, ts: new Date().toISOString(), ip: req.socket.remoteAddress });
                writeDb(db);
                sendResponse(res, 201, 'application/json', JSON.stringify({ success: true }));
            } else if (method === 'POST' && pathname === '/api/feedback') {
                const { sessionId, propertyRef, reasons } = data;
                const db = readDb();
                if (!db.feedback) db.feedback = [];
                db.feedback.push({ sessionId, propertyRef, reasons, ts: new Date().toISOString() });
                writeDb(db);
                sendResponse(res, 201, 'application/json', JSON.stringify({ success: true }));
            } else {
                sendResponse(res, 404, 'application/json', JSON.stringify({ message: 'API route not found' }));
            }
        } else {
            let filePath = (pathname === '/' || pathname === '/start') ? path.join(frontendPath, 'index.html') : path.join(frontendPath, pathname);
            serveStaticFile(res, filePath);
        }
    });
};

const server = http.createServer(requestHandler);
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
