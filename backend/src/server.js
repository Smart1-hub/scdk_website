require('dotenv').config();
const express   = require('express');
const http      = require('http');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const { WebSocketServer } = require('ws');

const routes    = require('./routes');
const iotCtrl   = require('./controllers/iotController');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:19006')
  .split(',').map(o => o.trim());

app.use(cors({
  origin:      (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('CORS blocked'))),
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 10, message: { success: false, message: 'Too many login attempts.' } }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── WebSocket (IoT live feed) ────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });
iotCtrl.setWSS(wss);

wss.on('connection', (ws, req) => {
  console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'SCDK IoT live feed active' }));
  ws.on('close', () => console.log('[WS] Client disconnected'));
  ws.on('error', (err) => console.error('[WS] Error:', err.message));
});

// ─── Serve React Build (production) ──────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const build = path.join(__dirname, '../../frontend/build');
  app.use(express.static(build));
  app.get('*', (_req, res) => res.sendFile(path.join(build, 'index.html')));
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 SCDK Platform API  →  http://localhost:${PORT}`);
  console.log(`🔌 WebSocket (IoT)    →  ws://localhost:${PORT}/ws`);
  console.log(`🌍 Environment        →  ${process.env.NODE_ENV || 'development'}\n`);

  // Start MQTT broker connection
  iotCtrl.initMQTT();
});

module.exports = app;
