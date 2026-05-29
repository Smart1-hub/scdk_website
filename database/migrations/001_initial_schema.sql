-- ============================================================
-- SCDK Platform – Master Database Schema
-- PostgreSQL 16+ with PostGIS 3.x
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── ENUM TYPES ──────────────────────────────────────────────────────────────
CREATE TYPE user_role      AS ENUM ('admin', 'manager', 'viewer');
CREATE TYPE user_status    AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE project_phase  AS ENUM ('inception', 'design', 'procurement', 'construction', 'commissioning', 'handover');
CREATE TYPE task_status    AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority  AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE sensor_type    AS ENUM ('temperature', 'humidity', 'air_quality', 'traffic', 'energy', 'water', 'noise', 'waste');
CREATE TYPE sensor_status  AS ENUM ('online', 'offline', 'maintenance', 'error');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

-- ─── USERS & AUTH ────────────────────────────────────────────────────────────
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  role             user_role NOT NULL DEFAULT 'viewer',
  status           user_status NOT NULL DEFAULT 'active',
  avatar_url       TEXT,
  phone            VARCHAR(30),
  department       VARCHAR(100),
  last_login       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  code            VARCHAR(30) UNIQUE NOT NULL,
  description     TEXT,
  status          project_status NOT NULL DEFAULT 'planning',
  phase           project_phase NOT NULL DEFAULT 'inception',
  country         VARCHAR(100),
  city            VARCHAR(100),
  location        GEOGRAPHY(POINT, 4326),          -- PostGIS spatial column
  boundary        GEOGRAPHY(POLYGON, 4326),         -- Project boundary polygon
  start_date      DATE,
  end_date        DATE,
  budget          NUMERIC(18,2),
  budget_spent    NUMERIC(18,2) DEFAULT 0,
  progress        SMALLINT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  manager_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  thumbnail_url   TEXT,
  tags            TEXT[],
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_status    ON projects(status);
CREATE INDEX idx_projects_manager   ON projects(manager_id);
CREATE INDEX idx_projects_location  ON projects USING GIST(location);
CREATE INDEX idx_projects_boundary  ON projects USING GIST(boundary);

-- Project members (many-to-many)
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(60) DEFAULT 'member',
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- ─── TASKS ───────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  status       task_status NOT NULL DEFAULT 'todo',
  priority     task_priority NOT NULL DEFAULT 'medium',
  assignee_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  position     INTEGER DEFAULT 0,
  tags         TEXT[],
  attachments  JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project  ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status   ON tasks(status);

-- Task comments
CREATE TABLE task_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── GIS LAYERS ──────────────────────────────────────────────────────────────
CREATE TABLE gis_layers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  layer_type  VARCHAR(60) NOT NULL,   -- 'infrastructure','boundary','sensor','route'
  visible     BOOLEAN DEFAULT TRUE,
  style       JSONB DEFAULT '{}',     -- Leaflet style overrides
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gis_features (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  layer_id   UUID NOT NULL REFERENCES gis_layers(id) ON DELETE CASCADE,
  name       VARCHAR(255),
  geometry   GEOGRAPHY NOT NULL,      -- supports Point, LineString, Polygon
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gis_features_layer    ON gis_features(layer_id);
CREATE INDEX idx_gis_features_geometry ON gis_features USING GIST(geometry);

-- ─── IoT SENSORS ─────────────────────────────────────────────────────────────
CREATE TABLE sensors (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  name         VARCHAR(255) NOT NULL,
  device_id    VARCHAR(100) UNIQUE NOT NULL,
  sensor_type  sensor_type NOT NULL,
  status       sensor_status NOT NULL DEFAULT 'offline',
  location     GEOGRAPHY(POINT, 4326) NOT NULL,
  unit         VARCHAR(30),
  min_val      NUMERIC,
  max_val      NUMERIC,
  threshold    NUMERIC,
  metadata     JSONB DEFAULT '{}',
  last_seen    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sensors_project  ON sensors(project_id);
CREATE INDEX idx_sensors_type     ON sensors(sensor_type);
CREATE INDEX idx_sensors_location ON sensors USING GIST(location);

CREATE TABLE sensor_readings (
  id         BIGSERIAL PRIMARY KEY,
  sensor_id  UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  value      NUMERIC NOT NULL,
  raw_data   JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sensor_readings_sensor ON sensor_readings(sensor_id);
CREATE INDEX idx_sensor_readings_time   ON sensor_readings(recorded_at DESC);

-- Partition sensor_readings by month for performance
-- (in production, use pg_partman for automation)

-- ─── DIGITAL TWIN ────────────────────────────────────────────────────────────
CREATE TABLE digital_twins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  model_url       TEXT,               -- URL to 3D model file (GLTF/GLB)
  config          JSONB DEFAULT '{}', -- camera position, layers, overlays
  live_data_feed  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE twin_overlays (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  twin_id     UUID NOT NULL REFERENCES digital_twins(id) ON DELETE CASCADE,
  sensor_id   UUID REFERENCES sensors(id) ON DELETE SET NULL,
  name        VARCHAR(255),
  overlay_type VARCHAR(60),           -- 'heatmap','traffic','energy','water'
  config      JSONB DEFAULT '{}',
  enabled     BOOLEAN DEFAULT TRUE
);

-- ─── AI ASSISTANT ────────────────────────────────────────────────────────────
CREATE TABLE ai_conversations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title      VARCHAR(255) DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant')),
  content         TEXT NOT NULL,
  tokens_used     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_conv ON ai_messages(conversation_id);

-- ─── ALERTS ──────────────────────────────────────────────────────────────────
CREATE TABLE alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_id   UUID REFERENCES sensors(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  severity    alert_severity NOT NULL DEFAULT 'info',
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  ack_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  ack_at      TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_project ON alerts(project_id);
CREATE INDEX idx_alerts_ack     ON alerts(acknowledged);

-- ─── AUDIT LOG ───────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(60),
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user   ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_time   ON audit_logs(created_at DESC);

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at     BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at  BEFORE UPDATE ON projects       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at     BEFORE UPDATE ON tasks          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_twins_updated_at     BEFORE UPDATE ON digital_twins  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_conv_updated_at   BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
