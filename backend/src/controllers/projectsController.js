const db = require('../config/db');

// ─── GET /api/projects ────────────────────────────────────────────────────────
async function getProjects(req, res) {
  const { status, search, limit = 20, offset = 0 } = req.query;
  try {
    let sql = `
      SELECT
        p.*,
        ST_AsGeoJSON(p.location)::json  AS location_geojson,
        ST_AsGeoJSON(p.boundary)::json  AS boundary_geojson,
        u.first_name || ' ' || u.last_name AS manager_name,
        COUNT(DISTINCT pm.user_id)::int  AS member_count,
        COUNT(DISTINCT t.id)::int        AS task_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done')::int AS tasks_done
      FROM projects p
      LEFT JOIN users u ON u.id = p.manager_id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { params.push(status); sql += ` AND p.status = $${params.length}`; }
    if (search) { params.push(`%${search}%`); sql += ` AND (p.name ILIKE $${params.length} OR p.city ILIKE $${params.length})`; }

    // Viewers only see projects they're members of
    if (req.user.role === 'viewer') {
      params.push(req.user.id);
      sql += ` AND EXISTS (SELECT 1 FROM project_members pm2 WHERE pm2.project_id = p.id AND pm2.user_id = $${params.length})`;
    }

    sql += ` GROUP BY p.id, u.first_name, u.last_name ORDER BY p.updated_at DESC`;
    params.push(parseInt(limit)); sql += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); sql += ` OFFSET $${params.length}`;

    const { rows } = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Projects] getProjects:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
}

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
async function getProject(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT
        p.*,
        ST_AsGeoJSON(p.location)::json  AS location_geojson,
        ST_AsGeoJSON(p.boundary)::json  AS boundary_geojson,
        u.first_name || ' ' || u.last_name AS manager_name,
        u.email AS manager_email
      FROM projects p
      LEFT JOIN users u ON u.id = p.manager_id
      WHERE p.id = $1
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Project not found.' });

    // Fetch members
    const { rows: members } = await db.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, pm.role AS project_role
      FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1
    `, [req.params.id]);

    res.json({ success: true, data: { ...rows[0], members } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch project.' });
  }
}

// ─── POST /api/projects ───────────────────────────────────────────────────────
async function createProject(req, res) {
  const { name, code, description, country, city, lat, lng, startDate, endDate, budget, tags } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'name and code are required.' });

  try {
    const locationSQL = (lat && lng)
      ? `ST_GeographyFromText('POINT(${parseFloat(lng)} ${parseFloat(lat)})')`
      : 'NULL';

    const { rows } = await db.query(`
      INSERT INTO projects (name, code, description, country, city, location, start_date, end_date, budget, manager_id, tags)
      VALUES ($1, $2, $3, $4, $5, ${locationSQL}, $6, $7, $8, $9, $10)
      RETURNING *
    `, [name, code, description, country, city, startDate, endDate, budget, req.user.id, tags || []]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Project code already exists.' });
    res.status(500).json({ success: false, message: 'Failed to create project.' });
  }
}

// ─── PATCH /api/projects/:id ──────────────────────────────────────────────────
async function updateProject(req, res) {
  const allowed = ['name','description','status','phase','country','city','start_date','end_date','budget','budget_spent','progress','tags'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  if (!Object.keys(updates).length) {
    return res.status(400).json({ success: false, message: 'No valid fields to update.' });
  }

  const sets   = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [req.params.id, ...Object.values(updates)];

  try {
    const { rows } = await db.query(
      `UPDATE projects SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Project not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update project.' });
  }
}

// ─── GET /api/projects/map — GeoJSON for Leaflet ──────────────────────────────
async function getProjectsGeoJSON(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT
        p.id, p.name, p.code, p.status, p.city, p.country, p.progress,
        ST_AsGeoJSON(p.location)::json AS geometry
      FROM projects p
      WHERE p.location IS NOT NULL
    `);

    const geojson = {
      type: 'FeatureCollection',
      features: rows.map(r => ({
        type: 'Feature',
        geometry: r.geometry,
        properties: { id: r.id, name: r.name, code: r.code, status: r.status, city: r.city, country: r.country, progress: r.progress },
      })),
    };

    res.json({ success: true, data: geojson });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch GeoJSON.' });
  }
}

module.exports = { getProjects, getProject, createProject, updateProject, getProjectsGeoJSON };
