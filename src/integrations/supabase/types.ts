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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      allowed_games: {
        Row: {
          added_at: string
          cooldown_seconds: number | null
          enabled: boolean
          game_id: string
          is_paid: boolean
          name: string | null
          no_timer: boolean
          script_url: string | null
          session_seconds: number | null
          universe_id: string | null
        }
        Insert: {
          added_at?: string
          cooldown_seconds?: number | null
          enabled?: boolean
          game_id: string
          is_paid?: boolean
          name?: string | null
          no_timer?: boolean
          script_url?: string | null
          session_seconds?: number | null
          universe_id?: string | null
        }
        Update: {
          added_at?: string
          cooldown_seconds?: number | null
          enabled?: boolean
          game_id?: string
          is_paid?: boolean
          name?: string | null
          no_timer?: boolean
          script_url?: string | null
          session_seconds?: number | null
          universe_id?: string | null
        }
        Relationships: []
      }
      analytics_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          details: Json
          id: string
          kind: string
          message: string
          severity: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          details?: Json
          id?: string
          kind: string
          message: string
          severity?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          message?: string
          severity?: string
        }
        Relationships: []
      }
      analytics_daily: {
        Row: {
          active_at_snapshot: number
          cooldown_at_snapshot: number
          cooldowns_cleared: number
          day: string
          sessions_expired: number
          sessions_started: number
          total_checks: number
          unique_hwids: number
          updated_at: string
        }
        Insert: {
          active_at_snapshot?: number
          cooldown_at_snapshot?: number
          cooldowns_cleared?: number
          day: string
          sessions_expired?: number
          sessions_started?: number
          total_checks?: number
          unique_hwids?: number
          updated_at?: string
        }
        Update: {
          active_at_snapshot?: number
          cooldown_at_snapshot?: number
          cooldowns_cleared?: number
          day?: string
          sessions_expired?: number
          sessions_started?: number
          total_checks?: number
          unique_hwids?: number
          updated_at?: string
        }
        Relationships: []
      }
      analytics_hourly: {
        Row: {
          day: string
          hour: number
          sessions_started: number
          total_checks: number
          updated_at: string
        }
        Insert: {
          day: string
          hour: number
          sessions_started?: number
          total_checks?: number
          updated_at?: string
        }
        Update: {
          day?: string
          hour?: number
          sessions_started?: number
          total_checks?: number
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          auto_ban_threshold: number
          cooldown_seconds: number
          dau_drop_alert_pct: number
          id: number
          kill_switch: boolean
          retention_d1_green: number
          retention_d1_yellow: number
          retention_d7_green: number
          retention_d7_yellow: number
          retention_drop_alert_pct: number
          script_content: string
          session_seconds: number
          stickiness_green: number
          stickiness_yellow: number
          throttle_seconds: number
          updated_at: string
          wau_drop_alert_pct: number
        }
        Insert: {
          auto_ban_threshold?: number
          cooldown_seconds?: number
          dau_drop_alert_pct?: number
          id?: number
          kill_switch?: boolean
          retention_d1_green?: number
          retention_d1_yellow?: number
          retention_d7_green?: number
          retention_d7_yellow?: number
          retention_drop_alert_pct?: number
          script_content?: string
          session_seconds?: number
          stickiness_green?: number
          stickiness_yellow?: number
          throttle_seconds?: number
          updated_at?: string
          wau_drop_alert_pct?: number
        }
        Update: {
          auto_ban_threshold?: number
          cooldown_seconds?: number
          dau_drop_alert_pct?: number
          id?: number
          kill_switch?: boolean
          retention_d1_green?: number
          retention_d1_yellow?: number
          retention_d7_green?: number
          retention_d7_yellow?: number
          retention_drop_alert_pct?: number
          script_content?: string
          session_seconds?: number
          stickiness_green?: number
          stickiness_yellow?: number
          throttle_seconds?: number
          updated_at?: string
          wau_drop_alert_pct?: number
        }
        Relationships: []
      }
      app_settings_audit: {
        Row: {
          changed_at: string
          changed_by: string | null
          changed_by_email: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          source: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          changed_by_email?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          source?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          changed_by_email?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          source?: string | null
        }
        Relationships: []
      }
      banned_hwids: {
        Row: {
          banned_at: string
          hwid: string
          reason: string | null
        }
        Insert: {
          banned_at?: string
          hwid: string
          reason?: string | null
        }
        Update: {
          banned_at?: string
          hwid?: string
          reason?: string | null
        }
        Relationships: []
      }
      feedback_entries: {
        Row: {
          created_at: string
          hwid: string
          id: string
          ip: string
          message: string
          place_id: string
          type: string
          username: string
          version: string
        }
        Insert: {
          created_at?: string
          hwid: string
          id?: string
          ip?: string
          message: string
          place_id: string
          type: string
          username: string
          version: string
        }
        Update: {
          created_at?: string
          hwid?: string
          id?: string
          ip?: string
          message?: string
          place_id?: string
          type?: string
          username?: string
          version?: string
        }
        Relationships: []
      }
      feedback_log: {
        Row: {
          created_at: string
          hwid: string
          id: string
          ip: string
        }
        Insert: {
          created_at?: string
          hwid: string
          id?: string
          ip?: string
        }
        Update: {
          created_at?: string
          hwid?: string
          id?: string
          ip?: string
        }
        Relationships: []
      }
      game_cache: {
        Row: {
          created_at: string
          creator_name: string | null
          game_description: string | null
          game_id: string
          game_name: string
          universe_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_name?: string | null
          game_description?: string | null
          game_id: string
          game_name: string
          universe_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_name?: string | null
          game_description?: string | null
          game_id?: string
          game_name?: string
          universe_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hwid_daily_seen: {
        Row: {
          check_count: number
          day: string
          first_seen_at: string
          hwid: string
          last_game_id: string | null
          last_seen_at: string
          sessions_started: number
        }
        Insert: {
          check_count?: number
          day: string
          first_seen_at?: string
          hwid: string
          last_game_id?: string | null
          last_seen_at?: string
          sessions_started?: number
        }
        Update: {
          check_count?: number
          day?: string
          first_seen_at?: string
          hwid?: string
          last_game_id?: string | null
          last_seen_at?: string
          sessions_started?: number
        }
        Relationships: []
      }
      hwid_sessions: {
  Row: {
  cooldown_start: string | null
  created_at: string
  hwid: string
  session_token: string | null
  session_token_created_at: string | null
  last_check_at: string | null
          last_game_id: string | null
          last_script_url: string | null
          session_start: string | null
          status: string
          throttle_violations: number
        }
  Insert: {
  cooldown_start?: string | null
  created_at?: string
  hwid: string
  session_token?: string | null
  session_token_created_at?: string | null
  last_check_at?: string | null
          last_game_id?: string | null
          last_script_url?: string | null
          session_start?: string | null
          status?: string
          throttle_violations?: number
        }
  Update: {
  cooldown_start?: string | null
  created_at?: string
  hwid?: string
  session_token?: string | null
  session_token_created_at?: string | null
  last_check_at?: string | null
          last_game_id?: string | null
          last_script_url?: string | null
          session_start?: string | null
          status?: string
          throttle_violations?: number
        }
        Relationships: []
      }
      loader_hwid_events: {
        Row: {
          created_at: string
          detail: string | null
          hwid: string
          id: string
          loader_id: string
          result: string
          user_id: number | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          hwid: string
          id?: string
          loader_id: string
          result: string
          user_id?: number | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          hwid?: string
          id?: string
          loader_id?: string
          result?: string
          user_id?: number | null
        }
        Relationships: []
      }
      loader_hwids: {
        Row: {
          created_at: string
          expires_at: string | null
          hwid: string
          id: string
          last_attempt_at: string | null
          last_denied_reason: string | null
          last_used_at: string | null
          last_user_id: number | null
          loader_id: string
          lock_user_id: boolean
          max_uses: number | null
          note: string | null
          paused: boolean
          roblox_user_id: number | null
          tier: string | null
          use_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          hwid: string
          id?: string
          last_attempt_at?: string | null
          last_denied_reason?: string | null
          last_used_at?: string | null
          last_user_id?: number | null
          loader_id: string
          lock_user_id?: boolean
          max_uses?: number | null
          note?: string | null
          paused?: boolean
          roblox_user_id?: number | null
          tier?: string | null
          use_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          hwid?: string
          id?: string
          last_attempt_at?: string | null
          last_denied_reason?: string | null
          last_used_at?: string | null
          last_user_id?: number | null
          loader_id?: string
          lock_user_id?: boolean
          max_uses?: number | null
          note?: string | null
          paused?: boolean
          roblox_user_id?: number | null
          tier?: string | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "loader_hwids_loader_id_fkey"
            columns: ["loader_id"]
            isOneToOne: false
            referencedRelation: "loader_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      loader_scripts: {
        Row: {
          created_at: string
          hwid_required: boolean
          id: string
          is_active: boolean
          name: string | null
          obfuscate: boolean
          script_content: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hwid_required?: boolean
          id: string
          is_active?: boolean
          name?: string | null
          obfuscate?: boolean
          script_content?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hwid_required?: boolean
          id?: string
          is_active?: boolean
          name?: string | null
          obfuscate?: boolean
          script_content?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_scripts: {
        Row: {
          created_at: string
          game_id: string
          notes: string | null
          script_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_id: string
          notes?: string | null
          script_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          notes?: string | null
          script_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          hwid: string
          id: string
          script_url: string | null
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          expires_at?: string
          hwid: string
          id?: string
          script_url?: string | null
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          hwid?: string
          id?: string
          script_url?: string | null
          token?: string
          used?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      acknowledge_alert: { Args: { _id: string }; Returns: undefined }
      check_hwid: {
        Args: { p_game_id?: string; p_hwid: string }
        Returns: Json
      }
      check_loader_hwid:
        | {
            Args: { _hwid: string; _loader_id: string }
            Returns: {
              allowed: boolean
              expires_at: string
              reason: string
            }[]
          }
        | {
            Args: { _hwid: string; _loader_id: string; _user_id?: number }
            Returns: {
              allowed: boolean
              expires_at: string
              locked_user_id: number
              reason: string
              uses_left: number
            }[]
          }
      cleanup_expired_sessions: { Args: never; Returns: Json }
      compute_growth_alerts: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      validate_session_token: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
