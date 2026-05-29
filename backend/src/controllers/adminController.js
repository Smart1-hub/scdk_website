const bcrypt = require('bcryptjs');
const db     = require('../config/db');

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
async function getUsers(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT id, email, first_name, last_name, role, status, department, phone, last_login, created_at
      FROM users ORDER BY created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
}

// ─── POST /api/admin/users ────────────────────────────────────────────────────
async function createUser(req, res) {
  const { email, password, firstName, lastName, role, department, phone } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ success: false, message: 'email, password, firstName, lastName required.' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, department, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, role, status, department, created_at
    `, [email.toLowerCase(), hash, firstName, lastName, role || 'viewer', department, phone]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Email already exists.' });
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
}

// ─── PATCH /api/admin/users/:id ───────────────────────────────────────────────
async function updateUser(req, res) {
  const allowed = ['first_name','last_name','role','status','department','phone'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  if (!Object.keys(updates).length) {
    return res.status(400).json({ success: false, message: 'No valid fields.' });
  }

  // Prevent self-demotion
  if (req.params.id === req.user.id && updates.role && updates.role !== 'admin') {
    return res.status(400).json({ success: false, message: 'Cannot change your own role.' });
  }

  const sets   = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [req.params.id, ...Object.values(updates)];

  try {
    const { rows } = await db.query(
      `UPDATE users SET ${sets}, updated_at = NOW() WHERE id = $1
       RETURNING id, email, first_name, last_name, role, status, department`,
      values
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
async function deleteUser(req, res) {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
  }
  try {
    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
}

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
async function getPlatformStats(req, res) {
  try {
    const [users, projects, sensors, alerts] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status=\'active\')::int AS active FROM users'),
      db.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status=\'active\')::int AS active FROM projects'),
      db.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status=\'online\')::int AS online FROM sensors'),
      db.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE acknowledged=FALSE)::int AS unread FROM alerts'),
    ]);
    res.json({
      success: true,
      data: {
        users:    users.rows[0],
        projects: projects.rows[0],
        sensors:  sensors.rows[0],
        alerts:   alerts.rows[0],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser, getPlatformStats };
