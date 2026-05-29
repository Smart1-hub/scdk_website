const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db      = require('../config/db');

// ─── Token helpers ────────────────────────────────────────────────────────────
function signAccess(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function signRefresh(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required.' });
  }

  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1 AND status = $2',
      [email.toLowerCase(), 'active']
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const accessToken  = signAccess(user);
    const refreshToken = signRefresh(user.id);
    const expiresAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id, email: user.email, role: user.role,
        firstName: user.first_name, lastName: user.last_name,
        department: user.department, avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token required.' });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const { rows } = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const { rows: users } = await db.query(
      'SELECT * FROM users WHERE id = $1 AND status = $2',
      [payload.id, 'active']
    );
    if (!users.length) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const newAccessToken  = signAccess(users[0]);
    const newRefreshToken = signRefresh(users[0].id);
    const expiresAt       = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Rotate refresh token
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [users[0].id, newRefreshToken, expiresAt]
    );

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]).catch(() => {});
  }
  res.json({ success: true, message: 'Logged out.' });
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
async function me(req, res) {
  try {
    const { rows } = await db.query(
      'SELECT id, email, first_name, last_name, role, status, avatar_url, department, phone, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = { login, refresh, logout, me };
