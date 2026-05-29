const db   = require('../config/db');
const mqtt = require('mqtt');
const { WebSocketServer } = require('ws');

// ─── In-memory latest readings cache ─────────────────────────────────────────
const latestReadings = new Map(); // device_id → { value, recorded_at }

// ─── WebSocket server (attached in server.js) ─────────────────────────────────
let wss = null;

function broadcastToClients(data) {
  if (!wss) return;
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
}

// ─── MQTT setup ──────────────────────────────────────────────────────────────
function initMQTT() {
  if (!process.env.MQTT_BROKER_URL) {
    console.log('[IoT] MQTT_BROKER_URL not set — skipping MQTT connection');
    return null;
  }

  const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `scdk-backend-${Date.now()}`,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    console.log('[IoT] MQTT connected');
    client.subscribe('scdk/sensors/#');
  });

  // Topic format: scdk/sensors/<device_id>
  client.on('message', async (topic, payload) => {
    try {
      const deviceId = topic.split('/')[2];
      const data     = JSON.parse(payload.toString());
      const value    = parseFloat(data.value);

      if (isNaN(value)) return;

      // Persist to DB
      const { rows } = await db.query(
        'SELECT id, threshold, sensor_type FROM sensors WHERE device_id = $1',
        [deviceId]
      );
      if (!rows.length) return;

      const sensor = rows[0];
      await db.query(
        'INSERT INTO sensor_readings (sensor_id, value, raw_data) VALUES ($1, $2, $3)',
        [sensor.id, value, data]
      );
      await db.query('UPDATE sensors SET last_seen = NOW(), status = $1 WHERE id = $2', ['online', sensor.id]);

      // Cache + broadcast
      latestReadings.set(deviceId, { value, recorded_at: new Date() });
      broadcastToClients({ type: 'SENSOR_UPDATE', deviceId, sensorId: sensor.id, value, timestamp: new Date() });

      // Threshold alert
      if (sensor.threshold && value > sensor.threshold) {
        await db.query(
          `INSERT INTO alerts (sensor_id, severity, title, message)
           VALUES ($1, 'warning', $2, $3)`,
          [sensor.id, `Threshold exceeded: ${sensor.sensor_type}`, `Device ${deviceId} reported ${value} (threshold: ${sensor.threshold})`]
        );
        broadcastToClients({ type: 'ALERT', sensorId: sensor.id, deviceId, value, threshold: sensor.threshold });
      }
    } catch (err) {
      console.error('[IoT] Message processing error:', err.message);
    }
  });

  client.on('error', (err) => console.error('[IoT] MQTT error:', err.message));
  return client;
}

// ─── GET /api/iot/sensors ─────────────────────────────────────────────────────
async function getSensors(req, res) {
  const { projectId, type, status } = req.query;
  try {
    let sql = `
      SELECT s.*,
        ST_AsGeoJSON(s.location)::json AS location_geojson,
        lr.value AS latest_value,
        lr.recorded_at AS latest_reading_at
      FROM sensors s
      LEFT JOIN LATERAL (
        SELECT value, recorded_at FROM sensor_readings
        WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1
      ) lr ON TRUE
      WHERE 1=1
    `;
    const params = [];
    if (projectId) { params.push(projectId); sql += ` AND s.project_id = $${params.length}`; }
    if (type)      { params.push(type);      sql += ` AND s.sensor_type = $${params.length}`; }
    if (status)    { params.push(status);    sql += ` AND s.status = $${params.length}`; }
    sql += ' ORDER BY s.name';

    const { rows } = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sensors.' });
  }
}

// ─── GET /api/iot/sensors/:id/readings ────────────────────────────────────────
async function getSensorReadings(req, res) {
  const { hours = 24, limit = 100 } = req.query;
  try {
    const { rows } = await db.query(`
      SELECT value, recorded_at FROM sensor_readings
      WHERE sensor_id = $1 AND recorded_at > NOW() - INTERVAL '${parseInt(hours)} hours'
      ORDER BY recorded_at DESC
      LIMIT $2
    `, [req.params.id, parseInt(limit)]);
    res.json({ success: true, data: rows.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch readings.' });
  }
}

// ─── GET /api/iot/sensors/geojson ─────────────────────────────────────────────
async function getSensorsGeoJSON(req, res) {
  const { projectId } = req.query;
  try {
    let sql = `
      SELECT s.id, s.name, s.device_id, s.sensor_type, s.status,
        ST_AsGeoJSON(s.location)::json AS geometry,
        lr.value AS latest_value
      FROM sensors s
      LEFT JOIN LATERAL (
        SELECT value FROM sensor_readings WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1
      ) lr ON TRUE
      WHERE s.location IS NOT NULL
    `;
    const params = [];
    if (projectId) { params.push(projectId); sql += ` AND s.project_id = $${params.length}`; }

    const { rows } = await db.query(sql, params);
    const geojson = {
      type: 'FeatureCollection',
      features: rows.map(r => ({
        type: 'Feature',
        geometry: r.geometry,
        properties: { id: r.id, name: r.name, deviceId: r.device_id, type: r.sensor_type, status: r.status, latestValue: r.latest_value },
      })),
    };
    res.json({ success: true, data: geojson });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sensor GeoJSON.' });
  }
}

module.exports = { initMQTT, getSensors, getSensorReadings, getSensorsGeoJSON, broadcastToClients, setWSS: (w) => { wss = w; } };
