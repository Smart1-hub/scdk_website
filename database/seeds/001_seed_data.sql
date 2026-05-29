-- ============================================================
-- SCDK Platform – Seed Data
-- Run AFTER migrations
-- ============================================================

-- ─── USERS (passwords are bcrypt of 'Password123!') ──────────────────────────
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, department) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'admin@scdk.io',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/DSIZLO2', 'System',  'Admin',   'admin',   'active', 'Technology'),
  ('a1000000-0000-0000-0000-000000000002', 'amara@scdk.io',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/DSIZLO2', 'Amara',   'Osei',    'admin',   'active', 'Executive'),
  ('a1000000-0000-0000-0000-000000000003', 'marcus@scdk.io',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/DSIZLO2', 'Marcus',  'Chen',    'manager', 'active', 'Engineering'),
  ('a1000000-0000-0000-0000-000000000004', 'lena@scdk.io',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/DSIZLO2', 'Lena',    'Brandt',  'manager', 'active', 'Urban Planning'),
  ('a1000000-0000-0000-0000-000000000005', 'viewer@scdk.io',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/DSIZLO2', 'James',   'Okafor',  'viewer',  'active', 'GIS');

-- ─── PROJECTS ────────────────────────────────────────────────────────────────
INSERT INTO projects (id, name, code, description, status, phase, country, city, location, start_date, end_date, budget, budget_spent, progress, manager_id, tags) VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'Accra Smart Corridor',
    'SCDK-GHA-001',
    'Development of a 12km smart mobility corridor integrating IoT sensors, adaptive traffic management, and real-time GIS monitoring across Accra''s central business district.',
    'active', 'construction',
    'Ghana', 'Accra',
    ST_GeographyFromText('POINT(-0.1870 5.6037)'),
    '2023-01-15', '2025-06-30',
    4200000.00, 2940000.00, 70,
    'a1000000-0000-0000-0000-000000000003',
    ARRAY['GIS','IoT','Smart Mobility','Infrastructure']
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'Lagos Digital Twin',
    'SCDK-NGA-001',
    'Full-scale digital twin of Lagos Island covering 28km², integrating live traffic, utility, and environmental sensor feeds with a 3D city model.',
    'active', 'commissioning',
    'Nigeria', 'Lagos',
    ST_GeographyFromText('POINT(3.3792 6.5244)'),
    '2022-09-01', '2024-12-31',
    7800000.00, 7020000.00, 90,
    'a1000000-0000-0000-0000-000000000003',
    ARRAY['Digital Twin','IoT','Urban Planning','Smart City']
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'Nairobi Green Grid',
    'SCDK-KEN-001',
    'Sustainable urban energy grid integrating solar microgrids, smart metering, and predictive demand management for Nairobi''s Westlands district.',
    'active', 'design',
    'Kenya', 'Nairobi',
    ST_GeographyFromText('POINT(36.8219 -1.2921)'),
    '2024-03-01', '2026-08-31',
    5500000.00, 825000.00, 15,
    'a1000000-0000-0000-0000-000000000004',
    ARRAY['Energy','Sustainability','GIS','Smart Grid']
  );

-- ─── PROJECT MEMBERS ─────────────────────────────────────────────────────────
INSERT INTO project_members (project_id, user_id, role) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'manager'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', 'gis_analyst'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'manager'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'urban_planner'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'manager');

-- ─── TASKS ───────────────────────────────────────────────────────────────────
INSERT INTO tasks (project_id, title, status, priority, assignee_id, reporter_id, due_date) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Install traffic sensors at 5 key intersections', 'done',        'high',     'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', '2024-03-15'),
  ('b1000000-0000-0000-0000-000000000001', 'GIS boundary mapping of corridor',                'done',        'high',     'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', '2024-02-28'),
  ('b1000000-0000-0000-0000-000000000001', 'IoT dashboard integration testing',               'in_progress', 'critical', 'a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', '2024-06-01'),
  ('b1000000-0000-0000-0000-000000000001', 'Stakeholder presentation – Q2 review',            'todo',        'medium',   'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', '2024-06-15'),
  ('b1000000-0000-0000-0000-000000000002', 'Complete 3D model of Lagos Island',               'in_progress', 'high',     'a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', '2024-05-30'),
  ('b1000000-0000-0000-0000-000000000002', 'Connect live utility feeds to twin',              'review',      'critical', 'a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', '2024-06-10'),
  ('b1000000-0000-0000-0000-000000000003', 'Solar microgrid site surveys',                    'todo',        'high',     'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', '2024-07-01');

-- ─── IoT SENSORS ─────────────────────────────────────────────────────────────
INSERT INTO sensors (project_id, name, device_id, sensor_type, status, location, unit, threshold) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Accra CBD Traffic Node 01', 'DEV-ACC-T01', 'traffic',     'online',  ST_GeographyFromText('POINT(-0.1870 5.6037)'),  'vehicles/hr', 800),
  ('b1000000-0000-0000-0000-000000000001', 'Accra CBD Air Quality 01',  'DEV-ACC-A01', 'air_quality', 'online',  ST_GeographyFromText('POINT(-0.1880 5.6040)'),  'AQI',         150),
  ('b1000000-0000-0000-0000-000000000001', 'Accra Temp Sensor 01',      'DEV-ACC-TM1', 'temperature', 'online',  ST_GeographyFromText('POINT(-0.1860 5.6030)'),  '°C',          38),
  ('b1000000-0000-0000-0000-000000000002', 'Lagos Energy Meter 01',     'DEV-LAG-E01', 'energy',      'online',  ST_GeographyFromText('POINT(3.3800 6.5250)'),   'kWh',         5000),
  ('b1000000-0000-0000-0000-000000000002', 'Lagos Water Sensor 01',     'DEV-LAG-W01', 'water',       'online',  ST_GeographyFromText('POINT(3.3780 6.5240)'),   'L/min',       200),
  ('b1000000-0000-0000-0000-000000000002', 'Lagos Noise Monitor 01',    'DEV-LAG-N01', 'noise',       'offline', ST_GeographyFromText('POINT(3.3810 6.5260)'),   'dB',          70);

-- ─── DIGITAL TWINS ───────────────────────────────────────────────────────────
INSERT INTO digital_twins (project_id, name, model_url, live_data_feed) VALUES
  ('b1000000-0000-0000-0000-000000000002', 'Lagos Island Digital Twin', '/models/lagos-island.glb', TRUE);

-- ─── ALERTS ──────────────────────────────────────────────────────────────────
INSERT INTO alerts (project_id, severity, title, message, acknowledged) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'warning',  'High Traffic Volume Detected',    'Traffic sensor DEV-ACC-T01 recorded 850 vehicles/hr, exceeding threshold.', FALSE),
  ('b1000000-0000-0000-0000-000000000002', 'critical', 'Sensor Offline: Lagos Noise 01',  'Device DEV-LAG-N01 has been offline for 2 hours. Check connectivity.',        FALSE),
  ('b1000000-0000-0000-0000-000000000002', 'info',     'Digital Twin sync completed',     'Lagos Island model synced successfully with 6 live data feeds.',              TRUE);
