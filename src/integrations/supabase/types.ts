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
  public: {
    Tables: {
      behavior_incidents: {
        Row: {
          classroom_id: string
          created_at: string
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
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
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
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
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
          updated_at?: string
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
        ]
      }
      care_journal: {
        Row: {
          care_item: string
          completed_at: string
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
          pet_type: Database["public"]["Enums"]["pet_type"]
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
          pet_type?: Database["public"]["Enums"]["pet_type"]
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
          pet_type?: Database["public"]["Enums"]["pet_type"]
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
          created_at: string
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
          started_at: string
          teacher_id: string
          time_per_student: number
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
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
          started_at?: string
          teacher_id: string
          time_per_student?: number
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
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
          started_at?: string
          teacher_id?: string
          time_per_student?: number
          updated_at?: string
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
            foreignKeyName: "classroom_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          classroom_code: string
          created_at?: string | null
          id?: string
          name: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          classroom_code?: string
          created_at?: string | null
          id?: string
          name?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
          created_at: string
          date: string
          difficulty_text: string | null
          id: string
          item_order: number
          item_text: string
          journal_entry: string | null
          last_reminded_at: string | null
          peptalk_count: number
          remind_later_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          difficulty_text?: string | null
          id?: string
          item_order: number
          item_text: string
          journal_entry?: string | null
          last_reminded_at?: string | null
          peptalk_count?: number
          remind_later_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          difficulty_text?: string | null
          id?: string
          item_order?: number
          item_text?: string
          journal_entry?: string | null
          last_reminded_at?: string | null
          peptalk_count?: number
          remind_later_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
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
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
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
        ]
      }
      store_items: {
        Row: {
          classroom_id: string
          created_at: string
          description: string | null
          emoji: string
          id: string
          is_active: boolean
          is_digital: boolean
          name: string
          point_cost: number
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          is_active?: boolean
          is_digital?: boolean
          name: string
          point_cost: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          is_active?: boolean
          is_digital?: boolean
          name?: string
          point_cost?: number
          stock_quantity?: number | null
          updated_at?: string
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
          created_at: string
          id: string
          item_id: string
          order_id: string
          point_cost: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          order_id: string
          point_cost: number
          quantity?: number
        }
        Update: {
          created_at?: string
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
          created_at: string
          delivery_method: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          notes: string | null
          status: string
          student_id: string
          total_points: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          classroom_id: string
          created_at?: string
          delivery_method?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          student_id: string
          total_points: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          classroom_id?: string
          created_at?: string
          delivery_method?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
          total_points?: number
          updated_at?: string
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
        ]
      }
      store_settings: {
        Row: {
          classroom_id: string
          created_at: string
          delivery_days: string[]
          delivery_window: string | null
          id: string
          is_store_open: boolean
          order_cutoff_time: string
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          delivery_days?: string[]
          delivery_window?: string | null
          id?: string
          is_store_open?: boolean
          order_cutoff_time?: string
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          delivery_days?: string[]
          delivery_window?: string | null
          id?: string
          is_store_open?: boolean
          order_cutoff_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: true
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
          id: string
          link_code: string | null
          linked_kid_id: string | null
          name: string
          school_points: number | null
          student_number: string | null
        }
        Insert: {
          avatar_emoji?: string | null
          classroom_id: string
          created_at?: string | null
          id?: string
          link_code?: string | null
          linked_kid_id?: string | null
          name: string
          school_points?: number | null
          student_number?: string | null
        }
        Update: {
          avatar_emoji?: string | null
          classroom_id?: string
          created_at?: string | null
          id?: string
          link_code?: string | null
          linked_kid_id?: string | null
          name?: string
          school_points?: number | null
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
          {
            foreignKeyName: "students_linked_kid_id_fkey"
            columns: ["linked_kid_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          chores_completed: number | null
          created_at: string
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
          updated_at: string
          user_id: string
        }
        Insert: {
          chores_completed?: number | null
          created_at?: string
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
          updated_at?: string
          user_id: string
        }
        Update: {
          chores_completed?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_classroom_code: { Args: never; Returns: string }
      generate_student_link_code: { Args: never; Returns: string }
      generate_student_number: {
        Args: { p_classroom_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_classroom_member: {
        Args: { p_classroom_id: string }
        Returns: boolean
      }
      is_classroom_owner: { Args: { _classroom_id: string }; Returns: boolean }
      is_family_member: { Args: { _family_id: string }; Returns: boolean }
      is_pet_owner: { Args: { _pet_id: string }; Returns: boolean }
      verify_kid_pin: {
        Args: { p_kid_id: string; p_pin: string }
        Returns: boolean
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
      pet_type: "bunny" | "fish" | "hamster" | "turtle" | "bird"
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
  public: {
    Enums: {
      app_role: [
        "guest",
        "individual",
        "parent",
        "child",
        "teacher",
        "school_admin",
        "staff",
      ],
      pet_type: ["bunny", "fish", "hamster", "turtle", "bird"],
    },
  },
} as const
