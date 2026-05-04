
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


-- ============================================================
-- SCHEMA
-- ============================================================

CREATE SCHEMA IF NOT EXISTS "culturezen";

ALTER SCHEMA "culturezen" OWNER TO "postgres";

COMMENT ON SCHEMA "culturezen" IS 'CultureZen application schema';


-- ============================================================
-- TYPES
-- ============================================================

CREATE TYPE "culturezen"."pet_type" AS ENUM (
    'bunny',
    'fish',
    'hamster',
    'turtle',
    'bird'
);

ALTER TYPE "culturezen"."pet_type" OWNER TO "postgres";


CREATE TYPE "culturezen"."app_role" AS ENUM (
    'guest',
    'individual',
    'parent',
    'child',
    'teacher',
    'school_admin',
    'staff',
    'principal',
    'platform_admin',
    'authority_admin'
);

ALTER TYPE "culturezen"."app_role" OWNER TO "postgres";


-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION "culturezen"."generate_classroom_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE new_code TEXT; code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM culturezen.classrooms WHERE classroom_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

ALTER FUNCTION "culturezen"."generate_classroom_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "culturezen"."generate_family_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE new_code TEXT; code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM culturezen.families WHERE family_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

ALTER FUNCTION "culturezen"."generate_family_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "culturezen"."get_kids_for_login"("p_family_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "age" integer, "avatar_emoji" "text", "lola_time_from_chores" integer, "lola_time_from_school" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'culturezen'
    AS $$
  SELECT k.id, k.name, k.age, k.avatar_emoji, k.lola_time_from_chores, k.lola_time_from_school
  FROM culturezen.kids k WHERE k.family_id = p_family_id;
$$;

ALTER FUNCTION "culturezen"."get_kids_for_login"("p_family_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "culturezen"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'culturezen'
    AS $$
BEGIN
  INSERT INTO culturezen.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

ALTER FUNCTION "culturezen"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "culturezen"."is_classroom_owner"("_classroom_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'culturezen'
    AS $$
  SELECT EXISTS (SELECT 1 FROM culturezen.classrooms WHERE id = _classroom_id AND teacher_id = auth.uid())
$$;

ALTER FUNCTION "culturezen"."is_classroom_owner"("_classroom_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "culturezen"."is_family_member"("_family_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'culturezen'
    AS $$
  SELECT EXISTS (SELECT 1 FROM culturezen.family_members WHERE family_id = _family_id AND user_id = auth.uid())
$$;

ALTER FUNCTION "culturezen"."is_family_member"("_family_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "culturezen"."is_pet_owner"("_pet_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'culturezen'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM culturezen.classroom_pets cp
    JOIN culturezen.classrooms c ON cp.classroom_id = c.id
    WHERE cp.id = _pet_id AND c.teacher_id = auth.uid()
  )
$$;

ALTER FUNCTION "culturezen"."is_pet_owner"("_pet_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "culturezen"."is_school_staff"("_school_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'culturezen'
    AS $$
  SELECT EXISTS (SELECT 1 FROM culturezen.school_staff WHERE school_id = _school_id AND user_id = auth.uid())
$$;

ALTER FUNCTION "culturezen"."is_school_staff"("_school_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "culturezen"."lookup_family_by_code"("p_code" "text") RETURNS TABLE("id" "uuid", "name" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'culturezen'
    AS $$
  SELECT f.id, f.name FROM culturezen.families f
  WHERE f.family_code = UPPER(p_code) LIMIT 1;
$$;

ALTER FUNCTION "culturezen"."lookup_family_by_code"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "culturezen"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

ALTER FUNCTION "culturezen"."update_updated_at"() OWNER TO "postgres";


SET default_tablespace = '';
SET default_table_access_method = "heap";


-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "culturezen"."behavior_incidents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "reported_by" "uuid" NOT NULL,
    "incident_type" "text" NOT NULL,
    "location" "text" NOT NULL,
    "severity" "text" DEFAULT 'minor'::"text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'reported'::"text" NOT NULL,
    "parent_notified_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."behavior_incidents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."care_journal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "care_item" "text" NOT NULL,
    "difficulty_text" "text",
    "completed_at" timestamp with time zone NOT NULL,
    "journal_entry" "text",
    "lola_feed_count" integer DEFAULT 0,
    "lola_water_count" integer DEFAULT 0,
    "lola_play_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."care_journal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."care_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pet_id" "uuid" NOT NULL,
    "student_id" "uuid",
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."care_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."chore_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chore_id" "uuid" NOT NULL,
    "kid_id" "uuid" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "minutes_earned" integer NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone
);

ALTER TABLE "culturezen"."chore_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."chores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "family_id" "uuid" NOT NULL,
    "kid_id" "uuid",
    "description" "text" NOT NULL,
    "minutes_earned" integer DEFAULT 5 NOT NULL,
    "frequency" "text" DEFAULT 'daily'::"text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."chores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."classroom_pets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "pet_type" "culturezen"."pet_type" DEFAULT 'bunny'::"culturezen"."pet_type" NOT NULL,
    "name" "text" NOT NULL,
    "hunger" integer DEFAULT 50,
    "happiness" integer DEFAULT 50,
    "cleanliness" integer DEFAULT 50,
    "energy" integer DEFAULT 50,
    "accessories" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "classroom_pets_cleanliness_check" CHECK ((("cleanliness" >= 0) AND ("cleanliness" <= 100))),
    CONSTRAINT "classroom_pets_energy_check" CHECK ((("energy" >= 0) AND ("energy" <= 100))),
    CONSTRAINT "classroom_pets_happiness_check" CHECK ((("happiness" >= 0) AND ("happiness" <= 100))),
    CONSTRAINT "classroom_pets_hunger_check" CHECK ((("hunger" >= 0) AND ("hunger" <= 100)))
);

ALTER TABLE "culturezen"."classroom_pets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."classroom_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_paused" boolean DEFAULT false NOT NULL,
    "lola_sleeping" boolean DEFAULT false NOT NULL,
    "lola_happiness" integer DEFAULT 80 NOT NULL,
    "lola_energy" integer DEFAULT 70 NOT NULL,
    "lola_hunger" integer DEFAULT 50 NOT NULL,
    "current_student_id" "uuid",
    "current_turn_started_at" timestamp with time zone,
    "time_per_student" integer DEFAULT 600 NOT NULL,
    "rotation_queue" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "rotation_mode" "text" DEFAULT 'manual'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."classroom_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."classrooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "school_id" "uuid",
    "name" "text" NOT NULL,
    "classroom_code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."classrooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."daily_care_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "item_text" "text" NOT NULL,
    "difficulty_text" "text",
    "item_order" integer NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "journal_entry" "text",
    "remind_later_count" integer DEFAULT 0 NOT NULL,
    "peptalk_count" integer DEFAULT 0 NOT NULL,
    "last_reminded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."daily_care_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."families" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" DEFAULT 'My Family'::"text" NOT NULL,
    "family_code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."families" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."family_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "family_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'parent'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."family_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."kids" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "family_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "age" integer,
    "pin_hash" "text" NOT NULL,
    "pin_needs_reset" boolean DEFAULT false,
    "avatar_emoji" "text" DEFAULT '👶'::"text",
    "lola_time_from_chores" integer DEFAULT 0,
    "lola_time_from_school" integer DEFAULT 0,
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "total_sessions" integer DEFAULT 0,
    "total_minutes" integer DEFAULT 0,
    "days_active" integer DEFAULT 0,
    "last_active_date" "date",
    "last_fed" timestamp with time zone,
    "last_watered" timestamp with time zone,
    "last_played" timestamp with time zone,
    "last_slept" timestamp with time zone,
    "unlocked_toys" "text"[] DEFAULT ARRAY['hayPile'::"text"],
    "play_sessions" integer DEFAULT 0,
    "chores_completed" integer DEFAULT 0,
    "pet_state" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."kids" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."pet_helpers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pet_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "assigned_date" "date" DEFAULT CURRENT_DATE
);

ALTER TABLE "culturezen"."pet_helpers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "display_name" "text",
    "first_name" "text",
    "last_name" "text",
    "is_premium" boolean DEFAULT false,
    "user_type" "text",
    "also_teacher" boolean DEFAULT false,
    "also_parent" boolean DEFAULT false,
    "account_type_set_at" timestamp with time zone,
    "family_id" "uuid",
    "school_name" "text",
    "teacher_beta_approved" boolean DEFAULT false,
    "care_items_enabled" boolean DEFAULT false,
    "reminder_frequency" "text" DEFAULT '3hours'::"text",
    "quiet_hours_enabled" boolean DEFAULT false,
    "quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone,
    "quiet_hours_end" time without time zone DEFAULT '07:00:00'::time without time zone,
    "last_reminder_sent_at" timestamp with time zone,
    "next_reminder_at" timestamp with time zone,
    "encouragement_flag_dismissed" boolean DEFAULT false,
    "account_prompt_dismissed_at" timestamp with time zone,
    "first_play_at" timestamp with time zone,
    "last_end_of_day_shown" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."school_points_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "points" integer NOT NULL,
    "reason" "text" NOT NULL,
    "awarded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."school_points_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."school_staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "school_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "invited_by" "uuid",
    "invited_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."school_staff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."schools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "domain" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."schools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."store_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "emoji" "text" DEFAULT '🎁'::"text" NOT NULL,
    "point_cost" integer NOT NULL,
    "description" "text",
    "is_digital" boolean DEFAULT false NOT NULL,
    "stock_quantity" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."store_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."store_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "point_cost" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."store_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."store_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "total_points" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "delivery_method" "text" DEFAULT 'homeroom'::"text" NOT NULL,
    "notes" "text",
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "fulfilled_at" timestamp with time zone,
    "fulfilled_by" "uuid",
    "cancelled_at" timestamp with time zone,
    "cancelled_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."store_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."store_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "delivery_days" "text"[] DEFAULT ARRAY['monday'::"text", 'wednesday'::"text", 'friday'::"text"] NOT NULL,
    "order_cutoff_time" time without time zone DEFAULT '15:00:00'::time without time zone NOT NULL,
    "delivery_window" "text" DEFAULT 'advisory'::"text",
    "is_store_open" boolean DEFAULT true NOT NULL,
    "store_enabled_by" "uuid",
    "store_enabled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."store_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "avatar_emoji" "text" DEFAULT '👤'::"text",
    "student_number" "text",
    "school_points" integer DEFAULT 0,
    "linked_kid_id" "uuid",
    "link_code" character varying,
    "user_id" "uuid",
    "email" "text",
    "status" "text" DEFAULT 'active'::"text",
    "joined_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."students" OWNER TO "postgres";


CREATE OR REPLACE VIEW "culturezen"."students_safe" AS
 SELECT "id",
    "classroom_id",
    "name",
    "avatar_emoji",
    "student_number",
    "school_points",
    "status",
    "joined_at",
    "created_at"
   FROM "culturezen"."students";

ALTER VIEW "culturezen"."students_safe" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."teacher_waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "school_name" "text" NOT NULL,
    "notified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."teacher_waitlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."user_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "last_fed" timestamp with time zone,
    "last_watered" timestamp with time zone,
    "last_played" timestamp with time zone,
    "last_slept" timestamp with time zone,
    "total_sessions" integer DEFAULT 0 NOT NULL,
    "total_minutes" integer DEFAULT 0 NOT NULL,
    "days_active" integer DEFAULT 0 NOT NULL,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "longest_streak" integer DEFAULT 0 NOT NULL,
    "last_active_date" "date",
    "lola_time_remaining" integer DEFAULT 30 NOT NULL,
    "pet_state" "jsonb",
    "unlocked_toys" "text"[] DEFAULT ARRAY['hayPile'::"text"],
    "chores_completed" integer DEFAULT 0,
    "school_points" integer DEFAULT 0,
    "play_sessions" integer DEFAULT 0,
    "total_care_actions" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."user_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "culturezen"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "culturezen"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "culturezen"."user_roles" OWNER TO "postgres";


-- ============================================================
-- PRIMARY KEYS & UNIQUE CONSTRAINTS
-- ============================================================

ALTER TABLE ONLY "culturezen"."behavior_incidents"
    ADD CONSTRAINT "behavior_incidents_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."care_journal"
    ADD CONSTRAINT "care_journal_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."care_logs"
    ADD CONSTRAINT "care_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."chore_completions"
    ADD CONSTRAINT "chore_completions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."chores"
    ADD CONSTRAINT "chores_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."classroom_pets"
    ADD CONSTRAINT "classroom_pets_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."classroom_sessions"
    ADD CONSTRAINT "classroom_sessions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."classrooms"
    ADD CONSTRAINT "classrooms_classroom_code_key" UNIQUE ("classroom_code");

ALTER TABLE ONLY "culturezen"."classrooms"
    ADD CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."daily_care_items"
    ADD CONSTRAINT "daily_care_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."families"
    ADD CONSTRAINT "families_family_code_key" UNIQUE ("family_code");

ALTER TABLE ONLY "culturezen"."families"
    ADD CONSTRAINT "families_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."family_members"
    ADD CONSTRAINT "family_members_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."kids"
    ADD CONSTRAINT "kids_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."pet_helpers"
    ADD CONSTRAINT "pet_helpers_pet_id_student_id_assigned_date_key" UNIQUE ("pet_id", "student_id", "assigned_date");

ALTER TABLE ONLY "culturezen"."pet_helpers"
    ADD CONSTRAINT "pet_helpers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."school_points_log"
    ADD CONSTRAINT "school_points_log_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."school_staff"
    ADD CONSTRAINT "school_staff_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."schools"
    ADD CONSTRAINT "schools_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."store_items"
    ADD CONSTRAINT "store_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."store_order_items"
    ADD CONSTRAINT "store_order_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."store_orders"
    ADD CONSTRAINT "store_orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."store_settings"
    ADD CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."teacher_waitlist"
    ADD CONSTRAINT "teacher_waitlist_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");


-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE TRIGGER "update_behavior_incidents_updated_at" BEFORE UPDATE ON "culturezen"."behavior_incidents" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_chores_updated_at" BEFORE UPDATE ON "culturezen"."chores" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_classroom_pets_updated_at" BEFORE UPDATE ON "culturezen"."classroom_pets" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_classroom_sessions_updated_at" BEFORE UPDATE ON "culturezen"."classroom_sessions" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_classrooms_updated_at" BEFORE UPDATE ON "culturezen"."classrooms" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_daily_care_items_updated_at" BEFORE UPDATE ON "culturezen"."daily_care_items" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_families_updated_at" BEFORE UPDATE ON "culturezen"."families" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_kids_updated_at" BEFORE UPDATE ON "culturezen"."kids" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "culturezen"."profiles" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_schools_updated_at" BEFORE UPDATE ON "culturezen"."schools" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_store_items_updated_at" BEFORE UPDATE ON "culturezen"."store_items" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_store_orders_updated_at" BEFORE UPDATE ON "culturezen"."store_orders" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_store_settings_updated_at" BEFORE UPDATE ON "culturezen"."store_settings" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();

CREATE OR REPLACE TRIGGER "update_user_progress_updated_at" BEFORE UPDATE ON "culturezen"."user_progress" FOR EACH ROW EXECUTE FUNCTION "culturezen"."update_updated_at"();


-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE ONLY "culturezen"."behavior_incidents"
    ADD CONSTRAINT "behavior_incidents_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "culturezen"."classrooms"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."behavior_incidents"
    ADD CONSTRAINT "behavior_incidents_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."behavior_incidents"
    ADD CONSTRAINT "behavior_incidents_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "culturezen"."behavior_incidents"
    ADD CONSTRAINT "behavior_incidents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "culturezen"."students"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."care_journal"
    ADD CONSTRAINT "care_journal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."care_logs"
    ADD CONSTRAINT "care_logs_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "culturezen"."classroom_pets"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."care_logs"
    ADD CONSTRAINT "care_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "culturezen"."students"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "culturezen"."chore_completions"
    ADD CONSTRAINT "chore_completions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "culturezen"."chore_completions"
    ADD CONSTRAINT "chore_completions_chore_id_fkey" FOREIGN KEY ("chore_id") REFERENCES "culturezen"."chores"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."chore_completions"
    ADD CONSTRAINT "chore_completions_kid_id_fkey" FOREIGN KEY ("kid_id") REFERENCES "culturezen"."kids"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."chores"
    ADD CONSTRAINT "chores_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "culturezen"."families"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."chores"
    ADD CONSTRAINT "chores_kid_id_fkey" FOREIGN KEY ("kid_id") REFERENCES "culturezen"."kids"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "culturezen"."classroom_pets"
    ADD CONSTRAINT "classroom_pets_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "culturezen"."classrooms"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."classroom_sessions"
    ADD CONSTRAINT "classroom_sessions_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "culturezen"."classrooms"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."classroom_sessions"
    ADD CONSTRAINT "classroom_sessions_current_student_id_fkey" FOREIGN KEY ("current_student_id") REFERENCES "culturezen"."students"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "culturezen"."classroom_sessions"
    ADD CONSTRAINT "classroom_sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."classrooms"
    ADD CONSTRAINT "classrooms_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "culturezen"."schools"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "culturezen"."classrooms"
    ADD CONSTRAINT "classrooms_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "culturezen"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."daily_care_items"
    ADD CONSTRAINT "daily_care_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."family_members"
    ADD CONSTRAINT "family_members_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "culturezen"."families"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."family_members"
    ADD CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."kids"
    ADD CONSTRAINT "kids_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "culturezen"."families"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."pet_helpers"
    ADD CONSTRAINT "pet_helpers_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "culturezen"."classroom_pets"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."pet_helpers"
    ADD CONSTRAINT "pet_helpers_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "culturezen"."students"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."school_points_log"
    ADD CONSTRAINT "school_points_log_awarded_by_fkey" FOREIGN KEY ("awarded_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."school_points_log"
    ADD CONSTRAINT "school_points_log_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "culturezen"."students"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."school_staff"
    ADD CONSTRAINT "school_staff_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "culturezen"."school_staff"
    ADD CONSTRAINT "school_staff_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "culturezen"."schools"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."school_staff"
    ADD CONSTRAINT "school_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."store_items"
    ADD CONSTRAINT "store_items_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "culturezen"."classrooms"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."store_order_items"
    ADD CONSTRAINT "store_order_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "culturezen"."store_items"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."store_order_items"
    ADD CONSTRAINT "store_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "culturezen"."store_orders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."store_orders"
    ADD CONSTRAINT "store_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "culturezen"."store_orders"
    ADD CONSTRAINT "store_orders_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "culturezen"."store_orders"
    ADD CONSTRAINT "store_orders_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "culturezen"."classrooms"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."store_orders"
    ADD CONSTRAINT "store_orders_fulfilled_by_fkey" FOREIGN KEY ("fulfilled_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "culturezen"."store_orders"
    ADD CONSTRAINT "store_orders_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "culturezen"."students"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."store_settings"
    ADD CONSTRAINT "store_settings_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "culturezen"."classrooms"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."store_settings"
    ADD CONSTRAINT "store_settings_store_enabled_by_fkey" FOREIGN KEY ("store_enabled_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "culturezen"."students"
    ADD CONSTRAINT "students_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "culturezen"."classrooms"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."students"
    ADD CONSTRAINT "students_linked_kid_id_fkey" FOREIGN KEY ("linked_kid_id") REFERENCES "culturezen"."kids"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "culturezen"."students"
    ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "culturezen"."teacher_waitlist"
    ADD CONSTRAINT "teacher_waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


-- ============================================================
-- ROW LEVEL SECURITY — ENABLE
-- ============================================================

ALTER TABLE "culturezen"."behavior_incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."care_journal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."care_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."chore_completions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."chores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."classroom_pets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."classroom_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."classrooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."daily_care_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."families" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."family_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."kids" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."pet_helpers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."school_points_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."school_staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."schools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."store_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."store_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."store_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."store_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."teacher_waitlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."user_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culturezen"."user_roles" ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- ROW LEVEL SECURITY — POLICIES
-- ============================================================

CREATE POLICY "Anyone can create family" ON "culturezen"."families" FOR INSERT WITH CHECK (true);

CREATE POLICY "Family members can manage chore completions" ON "culturezen"."chore_completions" USING ((EXISTS ( SELECT 1
   FROM "culturezen"."chores" "c"
  WHERE (("c"."id" = "chore_completions"."chore_id") AND "culturezen"."is_family_member"("c"."family_id")))));

CREATE POLICY "Family members can manage chores" ON "culturezen"."chores" USING ("culturezen"."is_family_member"("family_id"));

CREATE POLICY "Family members can manage kids" ON "culturezen"."kids" USING ("culturezen"."is_family_member"("family_id"));

CREATE POLICY "Family members can update family" ON "culturezen"."families" FOR UPDATE USING ("culturezen"."is_family_member"("id"));

CREATE POLICY "Family members can view family" ON "culturezen"."families" FOR SELECT USING ("culturezen"."is_family_member"("id"));

CREATE POLICY "Family members can view kids" ON "culturezen"."kids" FOR SELECT USING ("culturezen"."is_family_member"("family_id"));

CREATE POLICY "Family members can view members" ON "culturezen"."family_members" FOR SELECT USING ("culturezen"."is_family_member"("family_id"));

CREATE POLICY "School staff can view school" ON "culturezen"."schools" FOR SELECT USING ("culturezen"."is_school_staff"("id"));

CREATE POLICY "School staff can view staff" ON "culturezen"."school_staff" FOR SELECT USING ("culturezen"."is_school_staff"("school_id"));

CREATE POLICY "Teachers can manage care logs for own pets" ON "culturezen"."care_logs" USING ("culturezen"."is_pet_owner"("pet_id"));

CREATE POLICY "Teachers can manage incidents in own classrooms" ON "culturezen"."behavior_incidents" USING ("culturezen"."is_classroom_owner"("classroom_id"));

CREATE POLICY "Teachers can manage order items" ON "culturezen"."store_order_items" USING ((EXISTS ( SELECT 1
   FROM "culturezen"."store_orders" "so"
  WHERE (("so"."id" = "store_order_items"."order_id") AND "culturezen"."is_classroom_owner"("so"."classroom_id")))));

CREATE POLICY "Teachers can manage own classrooms" ON "culturezen"."classrooms" USING (("auth"."uid"() = "teacher_id"));

CREATE POLICY "Teachers can manage own sessions" ON "culturezen"."classroom_sessions" USING (("auth"."uid"() = "teacher_id"));

CREATE POLICY "Teachers can manage pet helpers" ON "culturezen"."pet_helpers" USING ("culturezen"."is_pet_owner"("pet_id"));

CREATE POLICY "Teachers can manage pets in own classrooms" ON "culturezen"."classroom_pets" USING ("culturezen"."is_classroom_owner"("classroom_id"));

CREATE POLICY "Teachers can manage points in own classrooms" ON "culturezen"."school_points_log" USING ((EXISTS ( SELECT 1
   FROM "culturezen"."students" "s"
  WHERE (("s"."id" = "school_points_log"."student_id") AND "culturezen"."is_classroom_owner"("s"."classroom_id")))));

CREATE POLICY "Teachers can manage store items" ON "culturezen"."store_items" USING ("culturezen"."is_classroom_owner"("classroom_id"));

CREATE POLICY "Teachers can manage store orders" ON "culturezen"."store_orders" USING ("culturezen"."is_classroom_owner"("classroom_id"));

CREATE POLICY "Teachers can manage store settings" ON "culturezen"."store_settings" USING ("culturezen"."is_classroom_owner"("classroom_id"));

CREATE POLICY "Teachers can manage students in own classrooms" ON "culturezen"."students" USING ("culturezen"."is_classroom_owner"("classroom_id"));

CREATE POLICY "Users can insert own profile" ON "culturezen"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "Users can join family" ON "culturezen"."family_members" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can manage own care journal" ON "culturezen"."care_journal" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can manage own daily care items" ON "culturezen"."daily_care_items" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can manage own progress" ON "culturezen"."user_progress" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can manage own waitlist entry" ON "culturezen"."teacher_waitlist" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can update own profile" ON "culturezen"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));

CREATE POLICY "Users can view own profile" ON "culturezen"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));

CREATE POLICY "Users can view own roles" ON "culturezen"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));


-- ============================================================
-- daily_checkins (folded from unapplied migration 20260502183846)
-- ============================================================

CREATE TABLE IF NOT EXISTS "culturezen"."daily_checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "mood_emoji" "text" NOT NULL,
    "mood_label" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "culturezen"."daily_checkins" OWNER TO "postgres";

ALTER TABLE ONLY "culturezen"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "culturezen"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "culturezen"."classrooms"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "culturezen"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "culturezen"."students"("id") ON DELETE CASCADE;

CREATE INDEX "idx_daily_checkins_classroom_date" ON "culturezen"."daily_checkins" ("classroom_id", "created_at" DESC);

CREATE INDEX "idx_daily_checkins_student" ON "culturezen"."daily_checkins" ("student_id", "created_at" DESC);

ALTER TABLE "culturezen"."daily_checkins" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own checkins" ON "culturezen"."daily_checkins"
    FOR INSERT TO "authenticated"
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "culturezen"."students"
            WHERE "students"."id" = "daily_checkins"."student_id"
              AND "students"."user_id" = "auth"."uid"()
              AND "students"."classroom_id" = "daily_checkins"."classroom_id"
        )
    );

CREATE POLICY "Students can view own checkins" ON "culturezen"."daily_checkins"
    FOR SELECT TO "authenticated"
    USING (
        EXISTS (
            SELECT 1 FROM "culturezen"."students"
            WHERE "students"."id" = "daily_checkins"."student_id"
              AND "students"."user_id" = "auth"."uid"()
        )
    );

CREATE POLICY "Teachers can view checkins for own classrooms" ON "culturezen"."daily_checkins"
    FOR SELECT TO "authenticated"
    USING (
        EXISTS (
            SELECT 1 FROM "culturezen"."classrooms"
            WHERE "classrooms"."id" = "daily_checkins"."classroom_id"
              AND "classrooms"."teacher_id" = "auth"."uid"()
        )
    );

GRANT ALL ON TABLE "culturezen"."daily_checkins" TO "anon";
GRANT ALL ON TABLE "culturezen"."daily_checkins" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."daily_checkins" TO "service_role";


-- ============================================================
-- SCHEMA-LEVEL GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA "culturezen" TO "postgres";
GRANT USAGE ON SCHEMA "culturezen" TO "anon";
GRANT USAGE ON SCHEMA "culturezen" TO "authenticated";
GRANT USAGE ON SCHEMA "culturezen" TO "service_role";

GRANT ALL ON FUNCTION "culturezen"."generate_classroom_code"() TO "anon";
GRANT ALL ON FUNCTION "culturezen"."generate_classroom_code"() TO "authenticated";
GRANT ALL ON FUNCTION "culturezen"."generate_classroom_code"() TO "service_role";

GRANT ALL ON FUNCTION "culturezen"."generate_family_code"() TO "anon";
GRANT ALL ON FUNCTION "culturezen"."generate_family_code"() TO "authenticated";
GRANT ALL ON FUNCTION "culturezen"."generate_family_code"() TO "service_role";

GRANT ALL ON FUNCTION "culturezen"."get_kids_for_login"("p_family_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "culturezen"."get_kids_for_login"("p_family_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "culturezen"."get_kids_for_login"("p_family_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "culturezen"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "culturezen"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "culturezen"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "culturezen"."is_classroom_owner"("_classroom_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "culturezen"."is_classroom_owner"("_classroom_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "culturezen"."is_classroom_owner"("_classroom_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "culturezen"."is_family_member"("_family_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "culturezen"."is_family_member"("_family_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "culturezen"."is_family_member"("_family_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "culturezen"."is_pet_owner"("_pet_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "culturezen"."is_pet_owner"("_pet_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "culturezen"."is_pet_owner"("_pet_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "culturezen"."is_school_staff"("_school_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "culturezen"."is_school_staff"("_school_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "culturezen"."is_school_staff"("_school_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "culturezen"."lookup_family_by_code"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "culturezen"."lookup_family_by_code"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "culturezen"."lookup_family_by_code"("p_code" "text") TO "service_role";

GRANT ALL ON FUNCTION "culturezen"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "culturezen"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "culturezen"."update_updated_at"() TO "service_role";

GRANT ALL ON TABLE "culturezen"."behavior_incidents" TO "anon";
GRANT ALL ON TABLE "culturezen"."behavior_incidents" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."behavior_incidents" TO "service_role";

GRANT ALL ON TABLE "culturezen"."care_journal" TO "anon";
GRANT ALL ON TABLE "culturezen"."care_journal" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."care_journal" TO "service_role";

GRANT ALL ON TABLE "culturezen"."care_logs" TO "anon";
GRANT ALL ON TABLE "culturezen"."care_logs" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."care_logs" TO "service_role";

GRANT ALL ON TABLE "culturezen"."chore_completions" TO "anon";
GRANT ALL ON TABLE "culturezen"."chore_completions" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."chore_completions" TO "service_role";

GRANT ALL ON TABLE "culturezen"."chores" TO "anon";
GRANT ALL ON TABLE "culturezen"."chores" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."chores" TO "service_role";

GRANT ALL ON TABLE "culturezen"."classroom_pets" TO "anon";
GRANT ALL ON TABLE "culturezen"."classroom_pets" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."classroom_pets" TO "service_role";

GRANT ALL ON TABLE "culturezen"."classroom_sessions" TO "anon";
GRANT ALL ON TABLE "culturezen"."classroom_sessions" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."classroom_sessions" TO "service_role";

GRANT ALL ON TABLE "culturezen"."classrooms" TO "anon";
GRANT ALL ON TABLE "culturezen"."classrooms" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."classrooms" TO "service_role";

GRANT ALL ON TABLE "culturezen"."daily_care_items" TO "anon";
GRANT ALL ON TABLE "culturezen"."daily_care_items" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."daily_care_items" TO "service_role";

GRANT ALL ON TABLE "culturezen"."families" TO "anon";
GRANT ALL ON TABLE "culturezen"."families" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."families" TO "service_role";

GRANT ALL ON TABLE "culturezen"."family_members" TO "anon";
GRANT ALL ON TABLE "culturezen"."family_members" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."family_members" TO "service_role";

GRANT ALL ON TABLE "culturezen"."kids" TO "anon";
GRANT ALL ON TABLE "culturezen"."kids" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."kids" TO "service_role";

GRANT ALL ON TABLE "culturezen"."pet_helpers" TO "anon";
GRANT ALL ON TABLE "culturezen"."pet_helpers" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."pet_helpers" TO "service_role";

GRANT ALL ON TABLE "culturezen"."profiles" TO "anon";
GRANT ALL ON TABLE "culturezen"."profiles" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."profiles" TO "service_role";

GRANT ALL ON TABLE "culturezen"."school_points_log" TO "anon";
GRANT ALL ON TABLE "culturezen"."school_points_log" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."school_points_log" TO "service_role";

GRANT ALL ON TABLE "culturezen"."school_staff" TO "anon";
GRANT ALL ON TABLE "culturezen"."school_staff" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."school_staff" TO "service_role";

GRANT ALL ON TABLE "culturezen"."schools" TO "anon";
GRANT ALL ON TABLE "culturezen"."schools" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."schools" TO "service_role";

GRANT ALL ON TABLE "culturezen"."store_items" TO "anon";
GRANT ALL ON TABLE "culturezen"."store_items" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."store_items" TO "service_role";

GRANT ALL ON TABLE "culturezen"."store_order_items" TO "anon";
GRANT ALL ON TABLE "culturezen"."store_order_items" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."store_order_items" TO "service_role";

GRANT ALL ON TABLE "culturezen"."store_orders" TO "anon";
GRANT ALL ON TABLE "culturezen"."store_orders" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."store_orders" TO "service_role";

GRANT ALL ON TABLE "culturezen"."store_settings" TO "anon";
GRANT ALL ON TABLE "culturezen"."store_settings" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."store_settings" TO "service_role";

GRANT ALL ON TABLE "culturezen"."students" TO "anon";
GRANT ALL ON TABLE "culturezen"."students" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."students" TO "service_role";

GRANT ALL ON TABLE "culturezen"."students_safe" TO "anon";
GRANT ALL ON TABLE "culturezen"."students_safe" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."students_safe" TO "service_role";

GRANT ALL ON TABLE "culturezen"."teacher_waitlist" TO "anon";
GRANT ALL ON TABLE "culturezen"."teacher_waitlist" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."teacher_waitlist" TO "service_role";

GRANT ALL ON TABLE "culturezen"."user_progress" TO "anon";
GRANT ALL ON TABLE "culturezen"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."user_progress" TO "service_role";

GRANT ALL ON TABLE "culturezen"."user_roles" TO "anon";
GRANT ALL ON TABLE "culturezen"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "culturezen"."user_roles" TO "service_role";


-- ============================================================
-- DEFAULT PRIVILEGES
-- ============================================================

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "culturezen" GRANT ALL ON TABLES TO "service_role";
