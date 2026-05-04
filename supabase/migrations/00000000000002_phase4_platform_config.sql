CREATE OR REPLACE FUNCTION culturezen.has_role(_user_id uuid, _role culturezen.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = culturezen
AS $$
  SELECT EXISTS (
    SELECT 1 FROM culturezen.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE TABLE culturezen.platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE culturezen.platform_config ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_platform_config_updated_at
  BEFORE UPDATE ON culturezen.platform_config
  FOR EACH ROW EXECUTE FUNCTION culturezen.update_updated_at();

CREATE POLICY "Authenticated users can read config"
  ON culturezen.platform_config FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Platform admins can write config"
  ON culturezen.platform_config FOR ALL
  TO authenticated
  USING (culturezen.has_role(auth.uid(), 'platform_admin'::culturezen.app_role))
  WITH CHECK (culturezen.has_role(auth.uid(), 'platform_admin'::culturezen.app_role));

INSERT INTO culturezen.platform_config (key, value, description)
VALUES (
  'approved_teacher_domains',
  '["twincitiesacademy.org"]'::jsonb,
  'Email domains with automatic teacher beta access'
);
