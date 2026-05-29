const db = require('../config/db');

// ─── GET /api/projects/:projectId/tasks ───────────────────────────────────────
async function getTasks(req, res) {
  const { status, assigneeId } = req.query;
  try {
    let sql = `
      SELECT t.*,
        u.first_name || ' ' || u.last_name AS assignee_name,
        u.avatar_url AS assignee_avatar,
        r.first_name || ' ' || r.last_name AS reporter_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN users r ON r.id = t.reporter_id
      WHERE t.project_id = $1
    `;
    const params = [req.params.projectId];
    if (status)     { params.push(status);     sql += ` AND t.status = $${params.length}`; }
    if (assigneeId) { params.push(assigneeId); sql += ` AND t.assignee_id = $${params.length}`; }
    sql += ' ORDER BY t.position ASC, t.created_at ASC';

    const { rows } = await db.query(sql, params);

    // Group by status for Kanban
    const kanban = { todo: [], in_progress: [], review: [], done: [] };
    rows.forEach(t => { if (kanban[t.status]) kanban[t.status].push(t); });

    res.json({ success: true, data: rows, kanban });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
}

// ─── POST /api/projects/:projectId/tasks ──────────────────────────────────────
async function createTask(req, res) {
  const { title, description, priority, assigneeId, dueDate, tags } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'title is required.' });

  try {
    const { rows } = await db.query(`
      INSERT INTO tasks (project_id, title, description, priority, assignee_id, reporter_id, due_date, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [req.params.projectId, title, description, priority || 'medium', assigneeId || null, req.user.id, dueDate || null, tags || []]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create task.' });
  }
}

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
async function updateTask(req, res) {
  const allowed = ['title','description','status','priority','assignee_id','due_date','position','tags'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  if (!Object.keys(updates).length) {
    return res.status(400).json({ success: false, message: 'No valid fields.' });
  }

  // Auto-set completed_at
  if (updates.status === 'done') updates.completed_at = new Date();
  if (updates.status && updates.status !== 'done') updates.completed_at = null;

  const sets   = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [req.params.id, ...Object.values(updates)];

  try {
    const { rows } = await db.query(
      `UPDATE tasks SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
}

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
async function deleteTask(req, res) {
  try {
    const { rowCount } = await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
