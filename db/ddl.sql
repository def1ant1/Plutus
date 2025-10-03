-- db/ddl.sql
-- Plutus OLTP baseline schema with partitioning strategy hints

CREATE TABLE IF NOT EXISTS tenant (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  email TEXT NOT NULL,
  company TEXT,
  source TEXT,
  attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_tenant_created ON lead(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_email ON lead(email);

CREATE TABLE IF NOT EXISTS party (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  first_name TEXT,
  last_name TEXT,
  ssn_fle BYTEA,        -- field-level encrypted blob
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_party_tenant ON party(tenant_id);

CREATE TABLE IF NOT EXISTS application (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  party_id UUID NOT NULL REFERENCES party(id),
  product JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_tenant_status ON application(tenant_id, status, submitted_at DESC);

CREATE TABLE IF NOT EXISTS bureau_pull (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  application_id UUID NOT NULL REFERENCES application(id),
  provider TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decision (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  application_id UUID NOT NULL REFERENCES application(id),
  status TEXT NOT NULL,
  score NUMERIC,
  reasons TEXT[],
  explanation JSONB,     -- SHAP or narrative memo
  decided_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_decision_tenant_app ON decision(tenant_id, application_id);

CREATE TABLE IF NOT EXISTS audit_event (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_entity ON audit_event(tenant_id, entity_type, entity_id, created_at DESC);

-- Partitioning example (Postgres native) for application by month
-- ALTER TABLE application PARTITION BY RANGE (submitted_at);
-- CREATE TABLE application_2025_10 PARTITION OF application FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
