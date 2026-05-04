export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  culturezen: {
    Tables: {
      behavior_incidents: {
        Row: {
          classroom_id: string
          created_at: string | null
          description: string | null
          id: string
          incident_type: string
          location: string
          notes: string | null
          parent_notified_at: string | null
          reported_by: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          incident_type: string
          location: string
          notes?: string | null
          parent_notified_at?: string | null
          reported_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          incident_type?: string
          location?: string
          notes?: string | null
          parent_notified_at?: string | null
          reported_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavior_incidents_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_incidents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_incidents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      care_journal: {
        Row: {
          care_item: string
          completed_at: string
          created_at: string | null
          date: string
          difficulty_text: string | null
          id: string
          journal_entry: string | null
          lola_feed_count: number | null
          lola_play_count: number | null
          lola_water_count: number | null
          user_id: string
        }
        Insert: {
          care_item: string
          completed_at: string
          created_at?: string | null
          date: string
          difficulty_text?: string | null
          id?: string
          journal_entry?: string | null
          lola_feed_count?: number | null
          lola_play_count?: number | null
          lola_water_count?: number | null
          user_id: string
        }
        Update: {
          care_item?: string
          completed_at?: string
          created_at?: string | null
          date?: string
          difficulty_text?: string | null
          id?: string
          journal_entry?: string | null
          lola_feed_count?: number | null
          lola_play_count?: number | null
          lola_water_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      care_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          pet_id: string
          student_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          pet_id: string
          student_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          pet_id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "classroom_pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      chore_completions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          chore_id: string
          completed_at: string | null
          id: string
          kid_id: string
          minutes_earned: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          chore_id: string
          completed_at?: string | null
          id?: string
          kid_id: string
          minutes_earned: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          chore_id?: string
          completed_at?: string | null
          id?: string
          kid_id?: string
          minutes_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "chore_completions_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_completions_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id"]
          },
        ]
      }
      chores: {
        Row: {
          created_at: string | null
          description: string
          family_id: string
          frequency: string
          id: string
          is_active: boolean | null
          kid_id: string | null
          minutes_earned: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          family_id: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          kid_id?: string | null
          minutes_earned?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          family_id?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          kid_id?: string | null
          minutes_earned?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chores_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_pets: {
        Row: {
          accessories: string[] | null
          classroom_id: string
          cleanliness: number | null
          created_at: string | null
          energy: number | null
          happiness: number | null
          hunger: number | null
          id: string
          name: string
          pet_type: Database["culturezen"]["Enums"]["pet_type"]
          updated_at: string | null
        }
        Insert: {
          accessories?: string[] | null
          classroom_id: string
          cleanliness?: number | null
          created_at?: string | null
          energy?: number | null
          happiness?: number | null
          hunger?: number | null
          id?: string
          name: string
          pet_type?: Database["culturezen"]["Enums"]["pet_type"]
          updated_at?: string | null
        }
        Update: {
          accessories?: string[] | null
          classroom_id?: string
          cleanliness?: number | null
          created_at?: string | null
          energy?: number | null
          happiness?: number | null
          hunger?: number | null
          id?: string
          name?: string
          pet_type?: Database["culturezen"]["Enums"]["pet_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_pets_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_sessions: {
        Row: {
          classroom_id: string
          created_at: string | null
          current_student_id: string | null
          current_turn_started_at: string | null
          ended_at: string | null
          id: string
          is_active: boolean
          is_paused: boolean
          lola_energy: number
          lola_happiness: number
          lola_hunger: number
          lola_sleeping: boolean
          rotation_mode: string
          rotation_queue: string[]
          started_at: string | null
          teacher_id: string
          time_per_student: number
          updated_at: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          current_student_id?: string | null
          current_turn_started_at?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          is_paused?: boolean
          lola_energy?: number
          lola_happiness?: number
          lola_hunger?: number
          lola_sleeping?: boolean
          rotation_mode?: string
          rotation_queue?: string[]
          started_at?: string | null
          teacher_id: string
          time_per_student?: number
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          current_student_id?: string | null
          current_turn_started_at?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          is_paused?: boolean
          lola_energy?: number
          lola_happiness?: number
          lola_hunger?: number
          lola_sleeping?: boolean
          rotation_mode?: string
          rotation_queue?: string[]
          started_at?: string | null
          teacher_id?: string
          time_per_student?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_sessions_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_sessions_current_student_id_fkey"
            columns: ["current_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_sessions_current_student_id_fkey"
            columns: ["current_student_id"]
            isOneToOne: false
            referencedRelation: "students_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          classroom_code: string
          created_at: string | null
          id: string
          name: string
          school_id: string | null
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          classroom_code: string
          created_at?: string | null
          id?: string
          name: string
          school_id?: string | null
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          classroom_code?: string
          created_at?: string | null
          id?: string
          name?: string
          school_id?: string | null
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_care_items: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string | null
          date: string
          difficulty_text: string | null
          id: string
          item_order: number
          item_text: string
          journal_entry: string | null
          last_reminded_at: string | null
          peptalk_count: number
          remind_later_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          date?: string
          difficulty_text?: string | null
          id?: string
          item_order: number
          item_text: string
          journal_entry?: string | null
          last_reminded_at?: string | null
          peptalk_count?: number
          remind_later_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          date?: string
          difficulty_text?: string | null
          id?: string
          item_order?: number
          item_text?: string
          journal_entry?: string | null
          last_reminded_at?: string | null
          peptalk_count?: number
          remind_later_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          classroom_id: string
          created_at: string
          id: string
          mood_emoji: string
          mood_label: string
          student_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          id?: string
          mood_emoji: string
          mood_label: string
          student_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          id?: string
          mood_emoji?: string
          mood_label?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checkins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checkins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string | null
          family_code: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          family_code: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          family_code?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      kids: {
        Row: {
          age: number | null
          avatar_emoji: string | null
          chores_completed: number | null
          created_at: string | null
          current_streak: number | null
          days_active: number | null
          family_id: string
          id: string
          last_active_date: string | null
          last_fed: string | null
          last_played: string | null
          last_slept: string | null
          last_watered: string | null
          lola_time_from_chores: number | null
          lola_time_from_school: number | null
          longest_streak: number | null
          name: string
          pet_state: Json | null
          pin_hash: string
          pin_needs_reset: boolean | null
          play_sessions: number | null
          total_minutes: number | null
          total_sessions: number | null
          unlocked_toys: string[] | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          avatar_emoji?: string | null
          chores_completed?: number | null
          created_at?: string | null
          current_streak?: number | null
          days_active?: number | null
          family_id: string
          id?: string
          last_active_date?: string | null
          last_fed?: string | null
          last_played?: string | null
          last_slept?: string | null
          last_watered?: string | null
          lola_time_from_chores?: number | null
          lola_time_from_school?: number | null
          longest_streak?: number | null
          name: string
          pet_state?: Json | null
          pin_hash: string
          pin_needs_reset?: boolean | null
          play_sessions?: number | null
          total_minutes?: number | null
          total_sessions?: number | null
          unlocked_toys?: string[] | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          avatar_emoji?: string | null
          chores_completed?: number | null
          created_at?: string | null
          current_streak?: number | null
          days_active?: number | null
          family_id?: string
          id?: string
          last_active_date?: string | null
          last_fed?: string | null
          last_played?: string | null
          last_slept?: string | null
          last_watered?: string | null
          lola_time_from_chores?: number | null
          lola_time_from_school?: number | null
          longest_streak?: number | null
          name?: string
          pet_state?: Json | null
          pin_hash?: string
          pin_needs_reset?: boolean | null
          play_sessions?: number | null
          total_minutes?: number | null
          total_sessions?: number | null
          unlocked_toys?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kids_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_helpers: {
        Row: {
          assigned_date: string | null
          id: string
          pet_id: string
          student_id: string
        }
        Insert: {
          assigned_date?: string | null
          id?: string
          pet_id: string
          student_id: string
        }
        Update: {
          assigned_date?: string | null
          id?: string
          pet_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_helpers_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "classroom_pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_helpers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_helpers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_prompt_dismissed_at: string | null
          account_type_set_at: string | null
          also_parent: boolean | null
          also_teacher: boolean | null
          care_items_enabled: boolean | null
          created_at: string | null
          display_name: string | null
          email: string | null
          encouragement_flag_dismissed: boolean | null
          family_id: string | null
          first_name: string | null
          first_play_at: string | null
          id: string
          is_premium: boolean | null
          last_end_of_day_shown: string | null
          last_name: string | null
          last_reminder_sent_at: string | null
          next_reminder_at: string | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_frequency: string | null
          school_name: string | null
          teacher_beta_approved: boolean | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          account_prompt_dismissed_at?: string | null
          account_type_set_at?: string | null
          also_parent?: boolean | null
          also_teacher?: boolean | null
          care_items_enabled?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          encouragement_flag_dismissed?: boolean | null
          family_id?: string | null
          first_name?: string | null
          first_play_at?: string | null
          id: string
          is_premium?: boolean | null
          last_end_of_day_shown?: string | null
          last_name?: string | null
          last_reminder_sent_at?: string | null
          next_reminder_at?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_frequency?: string | null
          school_name?: string | null
          teacher_beta_approved?: boolean | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          account_prompt_dismissed_at?: string | null
          account_type_set_at?: string | null
          also_parent?: boolean | null
          also_teacher?: boolean | null
          care_items_enabled?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          encouragement_flag_dismissed?: boolean | null
          family_id?: string | null
          first_name?: string | null
          first_play_at?: string | null
          id?: string
          is_premium?: boolean | null
          last_end_of_day_shown?: string | null
          last_name?: string | null
          last_reminder_sent_at?: string | null
          next_reminder_at?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_frequency?: string | null
          school_name?: string | null
          teacher_beta_approved?: boolean | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      school_points_log: {
        Row: {
          awarded_by: string
          created_at: string | null
          id: string
          points: number
          reason: string
          student_id: string
        }
        Insert: {
          awarded_by: string
          created_at?: string | null
          id?: string
          points: number
          reason: string
          student_id: string
        }
        Update: {
          awarded_by?: string
          created_at?: string | null
          id?: string
          points?: number
          reason?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_points_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_points_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      school_staff: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string
          school_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role: string
          school_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_items: {
        Row: {
          classroom_id: string
          created_at: string | null
          description: string | null
          emoji: string
          id: string
          is_active: boolean
          is_digital: boolean
          name: string
          point_cost: number
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          description?: string | null
          emoji?: string
          id?: string
          is_active?: boolean
          is_digital?: boolean
          name: string
          point_cost: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          description?: string | null
          emoji?: string
          id?: string
          is_active?: boolean
          is_digital?: boolean
          name?: string
          point_cost?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_items_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          order_id: string
          point_cost: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          order_id: string
          point_cost: number
          quantity?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          order_id?: string
          point_cost?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          classroom_id: string
          created_at: string | null
          delivery_method: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          notes: string | null
          status: string
          student_id: string
          total_points: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          classroom_id: string
          created_at?: string | null
          delivery_method?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          student_id: string
          total_points: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          classroom_id?: string
          created_at?: string | null
          delivery_method?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
          total_points?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_orders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_orders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          classroom_id: string
          created_at: string | null
          delivery_days: string[]
          delivery_window: string | null
          id: string
          is_store_open: boolean
          order_cutoff_time: string
          store_enabled_at: string | null
          store_enabled_by: string | null
          updated_at: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          delivery_days?: string[]
          delivery_window?: string | null
          id?: string
          is_store_open?: boolean
          order_cutoff_time?: string
          store_enabled_at?: string | null
          store_enabled_by?: string | null
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          delivery_days?: string[]
          delivery_window?: string | null
          id?: string
          is_store_open?: boolean
          order_cutoff_time?: string
          store_enabled_at?: string | null
          store_enabled_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          avatar_emoji: string | null
          classroom_id: string
          created_at: string | null
          email: string | null
          id: string
          joined_at: string | null
          link_code: string | null
          linked_kid_id: string | null
          name: string
          school_points: number | null
          status: string | null
          student_number: string | null
          user_id: string | null
        }
        Insert: {
          avatar_emoji?: string | null
          classroom_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          joined_at?: string | null
          link_code?: string | null
          linked_kid_id?: string | null
          name: string
          school_points?: number | null
          status?: string | null
          student_number?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_emoji?: string | null
          classroom_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          joined_at?: string | null
          link_code?: string | null
          linked_kid_id?: string | null
          name?: string
          school_points?: number | null
          status?: string | null
          student_number?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_linked_kid_id_fkey"
            columns: ["linked_kid_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_waitlist: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          notified_at: string | null
          school_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notified_at?: string | null
          school_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notified_at?: string | null
          school_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          chores_completed: number | null
          created_at: string | null
          current_streak: number
          days_active: number
          id: string
          last_active_date: string | null
          last_fed: string | null
          last_played: string | null
          last_slept: string | null
          last_watered: string | null
          lola_time_remaining: number
          longest_streak: number
          pet_state: Json | null
          play_sessions: number | null
          school_points: number | null
          total_care_actions: number
          total_minutes: number
          total_sessions: number
          unlocked_toys: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chores_completed?: number | null
          created_at?: string | null
          current_streak?: number
          days_active?: number
          id?: string
          last_active_date?: string | null
          last_fed?: string | null
          last_played?: string | null
          last_slept?: string | null
          last_watered?: string | null
          lola_time_remaining?: number
          longest_streak?: number
          pet_state?: Json | null
          play_sessions?: number | null
          school_points?: number | null
          total_care_actions?: number
          total_minutes?: number
          total_sessions?: number
          unlocked_toys?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chores_completed?: number | null
          created_at?: string | null
          current_streak?: number
          days_active?: number
          id?: string
          last_active_date?: string | null
          last_fed?: string | null
          last_played?: string | null
          last_slept?: string | null
          last_watered?: string | null
          lola_time_remaining?: number
          longest_streak?: number
          pet_state?: Json | null
          play_sessions?: number | null
          school_points?: number | null
          total_care_actions?: number
          total_minutes?: number
          total_sessions?: number
          unlocked_toys?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["culturezen"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["culturezen"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["culturezen"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      students_safe: {
        Row: {
          avatar_emoji: string | null
          classroom_id: string | null
          created_at: string | null
          id: string | null
          joined_at: string | null
          name: string | null
          school_points: number | null
          status: string | null
          student_number: string | null
        }
        Insert: {
          avatar_emoji?: string | null
          classroom_id?: string | null
          created_at?: string | null
          id?: string | null
          joined_at?: string | null
          name?: string | null
          school_points?: number | null
          status?: string | null
          student_number?: string | null
        }
        Update: {
          avatar_emoji?: string | null
          classroom_id?: string | null
          created_at?: string | null
          id?: string | null
          joined_at?: string | null
          name?: string | null
          school_points?: number | null
          status?: string | null
          student_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_classroom_code: { Args: never; Returns: string }
      generate_family_code: { Args: never; Returns: string }
      get_kids_for_login: {
        Args: { p_family_id: string }
        Returns: {
          age: number
          avatar_emoji: string
          id: string
          lola_time_from_chores: number
          lola_time_from_school: number
          name: string
        }[]
      }
      is_classroom_owner: { Args: { _classroom_id: string }; Returns: boolean }
      is_family_member: { Args: { _family_id: string }; Returns: boolean }
      is_pet_owner: { Args: { _pet_id: string }; Returns: boolean }
      is_school_staff: { Args: { _school_id: string }; Returns: boolean }
      lookup_family_by_code: {
        Args: { p_code: string }
        Returns: {
          id: string
          name: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "guest"
        | "individual"
        | "parent"
        | "child"
        | "teacher"
        | "school_admin"
        | "staff"
        | "principal"
        | "platform_admin"
        | "authority_admin"
      pet_type: "bunny" | "fish" | "hamster" | "turtle" | "bird"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assignment_standards: {
        Row: {
          assignment_id: string
          created_at: string | null
          id: string
          standard_code: string
          standard_description: string | null
          state: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          id?: string
          standard_code: string
          standard_description?: string | null
          state?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          id?: string
          standard_code?: string
          standard_description?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_standards_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          accommodations_applied: Json | null
          assignment_type: string | null
          created_at: string | null
          created_by: string
          generated_content: string
          goal_number: string | null
          goal_statement: string | null
          grade_level: number | null
          id: string
          iep_goals_targeted: Json | null
          include_lesson: boolean | null
          input_tokens: number | null
          is_template: boolean | null
          lesson_length: string | null
          math_level: string | null
          mode: string
          modifications: string[] | null
          num_questions: number | null
          objectives: string[] | null
          original_assignment_text: string | null
          other_level: string | null
          output_tokens: number | null
          passage_length: string | null
          pdf_url: string | null
          question_format: string | null
          reading_level: string | null
          standards_addressed: string[] | null
          status: string | null
          student_id: string | null
          student_name: string | null
          subject: string
          teacher_id: string | null
          team_id: string | null
          title: string
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          accommodations_applied?: Json | null
          assignment_type?: string | null
          created_at?: string | null
          created_by: string
          generated_content: string
          goal_number?: string | null
          goal_statement?: string | null
          grade_level?: number | null
          id?: string
          iep_goals_targeted?: Json | null
          include_lesson?: boolean | null
          input_tokens?: number | null
          is_template?: boolean | null
          lesson_length?: string | null
          math_level?: string | null
          mode: string
          modifications?: string[] | null
          num_questions?: number | null
          objectives?: string[] | null
          original_assignment_text?: string | null
          other_level?: string | null
          output_tokens?: number | null
          passage_length?: string | null
          pdf_url?: string | null
          question_format?: string | null
          reading_level?: string | null
          standards_addressed?: string[] | null
          status?: string | null
          student_id?: string | null
          student_name?: string | null
          subject: string
          teacher_id?: string | null
          team_id?: string | null
          title: string
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          accommodations_applied?: Json | null
          assignment_type?: string | null
          created_at?: string | null
          created_by?: string
          generated_content?: string
          goal_number?: string | null
          goal_statement?: string | null
          grade_level?: number | null
          id?: string
          iep_goals_targeted?: Json | null
          include_lesson?: boolean | null
          input_tokens?: number | null
          is_template?: boolean | null
          lesson_length?: string | null
          math_level?: string | null
          mode?: string
          modifications?: string[] | null
          num_questions?: number | null
          objectives?: string[] | null
          original_assignment_text?: string | null
          other_level?: string | null
          output_tokens?: number | null
          passage_length?: string | null
          pdf_url?: string | null
          question_format?: string | null
          reading_level?: string | null
          standards_addressed?: string[] | null
          status?: string | null
          student_id?: string | null
          student_name?: string | null
          subject?: string
          teacher_id?: string | null
          team_id?: string | null
          title?: string
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          details: string | null
          due_date: string
          id: string
          status: string | null
          student_id: string | null
          task_type: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          details?: string | null
          due_date: string
          id?: string
          status?: string | null
          student_id?: string | null
          task_type: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          details?: string | null
          due_date?: string
          id?: string
          status?: string | null
          student_id?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      iep_progress_reports: {
        Row: {
          created_at: string | null
          generated_narrative: string
          id: string
          objectives_data: Json
          reporting_period_end: string
          reporting_period_start: string
          student_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          generated_narrative: string
          id?: string
          objectives_data: Json
          reporting_period_end: string
          reporting_period_start: string
          student_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          generated_narrative?: string
          id?: string
          objectives_data?: Json
          reporting_period_end?: string
          reporting_period_start?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iep_progress_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iep_progress_reports_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ieps: {
        Row: {
          accommodations: Json | null
          created_at: string | null
          effective_date: string | null
          file_url: string | null
          goals: Json | null
          id: string
          math_level: string | null
          modifications: Json | null
          reading_level: string | null
          review_date: string | null
          student_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          accommodations?: Json | null
          created_at?: string | null
          effective_date?: string | null
          file_url?: string | null
          goals?: Json | null
          id?: string
          math_level?: string | null
          modifications?: Json | null
          reading_level?: string | null
          review_date?: string | null
          student_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          accommodations?: Json | null
          created_at?: string | null
          effective_date?: string | null
          file_url?: string | null
          goals?: Json | null
          id?: string
          math_level?: string | null
          modifications?: Json | null
          reading_level?: string | null
          review_date?: string | null
          student_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ieps_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ieps_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      probe_responses: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean | null
          objective_numbers: number[] | null
          probe_id: string | null
          question_id: string | null
          student_answer: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          objective_numbers?: number[] | null
          probe_id?: string | null
          question_id?: string | null
          student_answer?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          objective_numbers?: number[] | null
          probe_id?: string | null
          question_id?: string | null
          student_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "probe_responses_probe_id_fkey"
            columns: ["probe_id"]
            isOneToOne: false
            referencedRelation: "probes"
            referencedColumns: ["id"]
          },
        ]
      }
      probe_scores: {
        Row: {
          created_at: string | null
          goal_number: number | null
          id: string
          objective_number: number | null
          overall_score: number | null
          probe_id: string | null
          questions_correct: number | null
          questions_total: number | null
          score_percentage: number | null
          student_id: string | null
          teacher_verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          goal_number?: number | null
          id?: string
          objective_number?: number | null
          overall_score?: number | null
          probe_id?: string | null
          questions_correct?: number | null
          questions_total?: number | null
          score_percentage?: number | null
          student_id?: string | null
          teacher_verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          goal_number?: number | null
          id?: string
          objective_number?: number | null
          overall_score?: number | null
          probe_id?: string | null
          questions_correct?: number | null
          questions_total?: number | null
          score_percentage?: number | null
          student_id?: string | null
          teacher_verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "probe_scores_probe_id_fkey"
            columns: ["probe_id"]
            isOneToOne: false
            referencedRelation: "probes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "probe_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      probes: {
        Row: {
          completed_at: string | null
          created_at: string | null
          frequency: string | null
          goal_number: number | null
          goal_text: string | null
          id: string
          mastery_criterion: Json | null
          objectives: Json | null
          probe_number: number | null
          questions: Json | null
          sent_at: string | null
          shareable_token: string | null
          status: string | null
          student_id: string | null
          teacher_id: string | null
          verified_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          frequency?: string | null
          goal_number?: number | null
          goal_text?: string | null
          id?: string
          mastery_criterion?: Json | null
          objectives?: Json | null
          probe_number?: number | null
          questions?: Json | null
          sent_at?: string | null
          shareable_token?: string | null
          status?: string | null
          student_id?: string | null
          teacher_id?: string | null
          verified_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          frequency?: string | null
          goal_number?: number | null
          goal_text?: string | null
          id?: string
          mastery_criterion?: Json | null
          objectives?: Json | null
          probe_number?: number | null
          questions?: Json | null
          sent_at?: string | null
          shareable_token?: string | null
          status?: string | null
          student_id?: string | null
          teacher_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "probes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_reports: {
        Row: {
          assigned_date: string | null
          assignment_id: string
          completed_date: string | null
          created_at: string | null
          id: string
          mastery_level: string | null
          reported_by: string | null
          score: number | null
          status: string | null
          student_id: string
          student_struggles: string[] | null
          teacher_notes: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_date?: string | null
          assignment_id: string
          completed_date?: string | null
          created_at?: string | null
          id?: string
          mastery_level?: string | null
          reported_by?: string | null
          score?: number | null
          status?: string | null
          student_id: string
          student_struggles?: string[] | null
          teacher_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_date?: string | null
          assignment_id?: string
          completed_date?: string | null
          created_at?: string | null
          id?: string
          mastery_level?: string | null
          reported_by?: string | null
          score?: number | null
          status?: string | null
          student_id?: string
          student_struggles?: string[] | null
          teacher_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_reports_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      school_email_settings: {
        Row: {
          created_at: string
          dpa_signed: boolean
          id: string
          school_domain: string | null
          school_id: string | null
          student_email_format: string
          teacher_email_format: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dpa_signed?: boolean
          id?: string
          school_domain?: string | null
          school_id?: string | null
          student_email_format?: string
          teacher_email_format?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dpa_signed?: boolean
          id?: string
          school_domain?: string | null
          school_id?: string | null
          student_email_format?: string
          teacher_email_format?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_email_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string | null
          district: string | null
          email_domain: string | null
          id: string
          name: string
          state: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          district?: string | null
          email_domain?: string | null
          id?: string
          name: string
          state: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          district?: string | null
          email_domain?: string | null
          id?: string
          name?: string
          state?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_goals: {
        Row: {
          created_at: string | null
          created_by: string | null
          goal_category: string | null
          goal_number: number
          goal_text: string
          id: string
          objectives: Json
          source: string | null
          student_id: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          goal_category?: string | null
          goal_number: number
          goal_text: string
          id?: string
          objectives?: Json
          source?: string | null
          student_id?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          goal_category?: string | null
          goal_number?: number
          goal_text?: string
          id?: string
          objectives?: Json
          source?: string | null
          student_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "student_goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          accommodations: Json | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          email_bounced: boolean | null
          email_status: string | null
          first_name: string | null
          generated_email: string | null
          grade_level: number | null
          id: string
          iep_end_date: string | null
          iep_meeting_date: string | null
          iep_start_date: string | null
          is_caseload_student: boolean | null
          last_name: string | null
          para_email: string | null
          para_name: string | null
          para_type: string | null
          primary_case_manager_id: string | null
          probe_frequency: string | null
          school_id: string
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          accommodations?: Json | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          email_bounced?: boolean | null
          email_status?: string | null
          first_name?: string | null
          generated_email?: string | null
          grade_level?: number | null
          id?: string
          iep_end_date?: string | null
          iep_meeting_date?: string | null
          iep_start_date?: string | null
          is_caseload_student?: boolean | null
          last_name?: string | null
          para_email?: string | null
          para_name?: string | null
          para_type?: string | null
          primary_case_manager_id?: string | null
          probe_frequency?: string | null
          school_id: string
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accommodations?: Json | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          email_bounced?: boolean | null
          email_status?: string | null
          first_name?: string | null
          generated_email?: string | null
          grade_level?: number | null
          id?: string
          iep_end_date?: string | null
          iep_meeting_date?: string | null
          iep_start_date?: string | null
          is_caseload_student?: boolean | null
          last_name?: string | null
          para_email?: string | null
          para_name?: string | null
          para_type?: string | null
          primary_case_manager_id?: string | null
          probe_frequency?: string | null
          school_id?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_primary_case_manager_id_fkey"
            columns: ["primary_case_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string | null
          role_in_team: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role_in_team: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role_in_team?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          created_at: string | null
          founding_member_number: number | null
          id: string
          pricing_locked_at: string | null
          role: string
          steps_completed: Json | null
          tutorial_completed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          founding_member_number?: number | null
          id?: string
          pricing_locked_at?: string | null
          role: string
          steps_completed?: Json | null
          tutorial_completed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          founding_member_number?: number | null
          id?: string
          pricing_locked_at?: string | null
          role?: string
          steps_completed?: Json | null
          tutorial_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          role: string
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_school_id: { Args: never; Returns: string }
      is_team_admin: { Args: { team_uuid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  culturezen: {
    Enums: {
      app_role: [
        "guest",
        "individual",
        "parent",
        "child",
        "teacher",
        "school_admin",
        "staff",
        "principal",
        "platform_admin",
        "authority_admin",
      ],
      pet_type: ["bunny", "fish", "hamster", "turtle", "bird"],
    },
  },
  public: {
    Enums: {},
  },
} as const
A new version of Supabase CLI is available: v2.98.1 (currently installed v2.95.4)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
