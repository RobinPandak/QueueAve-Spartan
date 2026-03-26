-- spartan_events
CREATE TABLE spartan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  venue text,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- spartan_groups
CREATE TABLE spartan_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES spartan_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time,
  sort_order int NOT NULL DEFAULT 1
);

-- spartan_participants
CREATE TABLE spartan_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES spartan_events(id) ON DELETE CASCADE,
  group_id uuid REFERENCES spartan_groups(id) ON DELETE SET NULL,
  name text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  checked_in boolean NOT NULL DEFAULT false,
  checked_in_at timestamptz
);

-- spartan_session_templates
CREATE TABLE spartan_session_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES spartan_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- spartan_metrics
CREATE TABLE spartan_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES spartan_session_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('time', 'count', 'pass_fail')),
  unit text,
  sort_order int NOT NULL DEFAULT 1
);

-- spartan_sessions
CREATE TABLE spartan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES spartan_events(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES spartan_session_templates(id),
  group_id uuid REFERENCES spartan_groups(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- spartan_results
CREATE TABLE spartan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES spartan_sessions(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES spartan_participants(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES spartan_metrics(id) ON DELETE CASCADE,
  time_value interval,
  count_value int,
  pass_value boolean,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, participant_id, metric_id)
);

-- ─── RLS ───────────────────────────────────────────────────────

ALTER TABLE spartan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE spartan_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE spartan_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE spartan_session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE spartan_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE spartan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spartan_results ENABLE ROW LEVEL SECURITY;

-- spartan_events
CREATE POLICY "organizer_crud_events" ON spartan_events
  FOR ALL USING (organizer_id = auth.uid());
CREATE POLICY "public_read_open_events" ON spartan_events
  FOR SELECT USING (status IN ('open', 'completed'));

-- spartan_groups
CREATE POLICY "organizer_crud_groups" ON spartan_groups
  FOR ALL USING (
    event_id IN (SELECT id FROM spartan_events WHERE organizer_id = auth.uid())
  );
CREATE POLICY "public_read_open_groups" ON spartan_groups
  FOR SELECT USING (
    event_id IN (SELECT id FROM spartan_events WHERE status IN ('open', 'completed'))
  );

-- spartan_participants
CREATE POLICY "organizer_crud_participants" ON spartan_participants
  FOR ALL USING (
    event_id IN (SELECT id FROM spartan_events WHERE organizer_id = auth.uid())
  );
CREATE POLICY "participant_register" ON spartan_participants
  FOR INSERT WITH CHECK (
    event_id IN (SELECT id FROM spartan_events WHERE status = 'open')
  );
CREATE POLICY "participant_read_own" ON spartan_participants
  FOR SELECT USING (true);

-- spartan_session_templates
CREATE POLICY "organizer_crud_templates" ON spartan_session_templates
  FOR ALL USING (
    event_id IN (SELECT id FROM spartan_events WHERE organizer_id = auth.uid())
  );

-- spartan_metrics
CREATE POLICY "organizer_crud_metrics" ON spartan_metrics
  FOR ALL USING (
    template_id IN (
      SELECT id FROM spartan_session_templates WHERE event_id IN (
        SELECT id FROM spartan_events WHERE organizer_id = auth.uid()
      )
    )
  );

-- spartan_sessions
CREATE POLICY "organizer_crud_sessions" ON spartan_sessions
  FOR ALL USING (
    event_id IN (SELECT id FROM spartan_events WHERE organizer_id = auth.uid())
  );
CREATE POLICY "public_read_open_sessions" ON spartan_sessions
  FOR SELECT USING (
    event_id IN (SELECT id FROM spartan_events WHERE status IN ('open', 'completed'))
  );

-- spartan_results
CREATE POLICY "organizer_crud_results" ON spartan_results
  FOR ALL USING (
    session_id IN (
      SELECT id FROM spartan_sessions WHERE event_id IN (
        SELECT id FROM spartan_events WHERE organizer_id = auth.uid()
      )
    )
  );
CREATE POLICY "public_read_open_results" ON spartan_results
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM spartan_sessions s
      JOIN spartan_events e ON e.id = s.event_id
      WHERE e.status IN ('open', 'completed')
    )
  );
