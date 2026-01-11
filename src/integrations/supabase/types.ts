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
          created_at: string | null
          display_name: string | null
          email: string | null
          first_play_at: string | null
          id: string
          is_premium: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_prompt_dismissed_at?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_play_at?: string | null
          id: string
          is_premium?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_prompt_dismissed_at?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_play_at?: string | null
          id?: string
          is_premium?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          avatar_emoji: string | null
          classroom_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          avatar_emoji?: string | null
          classroom_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          avatar_emoji?: string | null
          classroom_id?: string
          created_at?: string | null
          id?: string
          name?: string
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
      user_progress: {
        Row: {
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
          total_minutes: number
          total_sessions: number
          updated_at: string
          user_id: string
        }
        Insert: {
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
          total_minutes?: number
          total_sessions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
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
          total_minutes?: number
          total_sessions?: number
          updated_at?: string
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
      is_classroom_owner: { Args: { _classroom_id: string }; Returns: boolean }
      is_pet_owner: { Args: { _pet_id: string }; Returns: boolean }
    }
    Enums: {
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
      pet_type: ["bunny", "fish", "hamster", "turtle", "bird"],
    },
  },
} as const
