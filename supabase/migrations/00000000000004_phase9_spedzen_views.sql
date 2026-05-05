-- Phase 9 — SpedZen read-only views (CultureZen side)
-- Applied manually via Supabase SQL editor on 2026-05-05
-- These views are keyed by district_student_id for cross-platform querying by SpedZen.

-- View 1: per-student behavioral summary (last 30 days)
CREATE OR REPLACE VIEW culturezen.student_behavioral_summary AS
SELECT
  sc.district_student_id,
  s.id                                                         AS student_id,
  s.school_points                                              AS total_points_earned,
  COUNT(dc.id) FILTER (
    WHERE dc.created_at >= NOW() - INTERVAL '30 days'
  )                                                            AS checkin_count_last_30_days,
  MAX(dc.created_at)::date                                     AS last_checkin_date,
  (
    SELECT mood_label FROM culturezen.daily_checkins
    WHERE student_id = s.id
    ORDER BY created_at DESC LIMIT 1
  )                                                            AS last_checkin_mood,
  COUNT(bi.id) FILTER (
    WHERE bi.created_at >= NOW() - INTERVAL '30 days'
  )                                                            AS incident_count_last_30_days,
  MAX(bi.created_at)::date                                     AS last_incident_date,
  (
    SELECT incident_type FROM culturezen.behavior_incidents
    WHERE student_id = s.id
    ORDER BY created_at DESC LIMIT 1
  )                                                            AS last_incident_type
FROM culturezen.spedzen_connections sc
JOIN culturezen.students s ON s.id = sc.culturezen_student_id
LEFT JOIN culturezen.daily_checkins dc ON dc.student_id = s.id
LEFT JOIN culturezen.behavior_incidents bi ON bi.student_id = s.id
WHERE sc.district_student_id IS NOT NULL
GROUP BY sc.district_student_id, s.id, s.school_points;

-- View 2: per-student check-in history
CREATE OR REPLACE VIEW culturezen.student_checkin_history AS
SELECT
  sc.district_student_id,
  dc.created_at::date  AS checkin_date,
  dc.mood_label,
  dc.mood_emoji,
  dc.classroom_id
FROM culturezen.daily_checkins dc
JOIN culturezen.students s ON s.id = dc.student_id
JOIN culturezen.spedzen_connections sc ON sc.culturezen_student_id = s.id
WHERE sc.district_student_id IS NOT NULL
ORDER BY dc.created_at DESC;
