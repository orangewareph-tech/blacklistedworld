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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          summary: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          summary?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          summary?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      pre_assessments: {
        Row: {
          admin_notes: string | null
          alias: string | null
          amount_usd: number | null
          city: string | null
          country: string | null
          created_at: string
          description: string
          email: string | null
          id: string
          industry: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social: string | null
          status: Database["public"]["Enums"]["report_status"]
          subject_name: string
          submitter_id: string
          ticket_number: string | null
          transaction_type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          alias?: string | null
          amount_usd?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          description: string
          email?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          subject_name: string
          submitter_id: string
          ticket_number?: string | null
          transaction_type: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          alias?: string | null
          amount_usd?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string
          email?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          subject_name?: string
          submitter_id?: string
          ticket_number?: string | null
          transaction_type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          block_reason: string | null
          blocked_at: string | null
          blocked_until: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email_verified_at: string | null
          id: string
          is_verified: boolean
          phone: string | null
          phone_verified_at: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_until?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_verified_at?: string | null
          id: string
          is_verified?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_until?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_verified_at?: string | null
          id?: string
          is_verified?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      report_evidence: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          report_id: string
          size_bytes: number | null
          uploader_id: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          report_id: string
          size_bytes?: number | null
          uploader_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          report_id?: string
          size_bytes?: number | null
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_flags: {
        Row: {
          created_at: string
          details: string | null
          flagger_id: string | null
          id: string
          reason: string
          report_id: string
          resolved: boolean
        }
        Insert: {
          created_at?: string
          details?: string | null
          flagger_id?: string | null
          id?: string
          reason: string
          report_id: string
          resolved?: boolean
        }
        Update: {
          created_at?: string
          details?: string | null
          flagger_id?: string | null
          id?: string
          reason?: string
          report_id?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "report_flags_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          alias: string | null
          amount_usd: number | null
          bank_partial: string | null
          category: string
          city: string | null
          country: string | null
          court_case_no: string | null
          created_at: string
          description: string
          email: string | null
          id: string
          incident_date: string | null
          industry: string | null
          national_id_partial: string | null
          passport_partial: string | null
          phone: string | null
          police_report_no: string | null
          reference_no: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk: Database["public"]["Enums"]["risk_level"]
          social: string | null
          status: Database["public"]["Enums"]["report_status"]
          subject_name: string
          submitter_id: string | null
          ticket_number: string | null
          transaction_type: string
          updated_at: string
          wallet: string | null
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          alias?: string | null
          amount_usd?: number | null
          bank_partial?: string | null
          category: string
          city?: string | null
          country?: string | null
          court_case_no?: string | null
          created_at?: string
          description: string
          email?: string | null
          id?: string
          incident_date?: string | null
          industry?: string | null
          national_id_partial?: string | null
          passport_partial?: string | null
          phone?: string | null
          police_report_no?: string | null
          reference_no?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk?: Database["public"]["Enums"]["risk_level"]
          social?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          subject_name: string
          submitter_id?: string | null
          ticket_number?: string | null
          transaction_type: string
          updated_at?: string
          wallet?: string | null
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          alias?: string | null
          amount_usd?: number | null
          bank_partial?: string | null
          category?: string
          city?: string | null
          country?: string | null
          court_case_no?: string | null
          created_at?: string
          description?: string
          email?: string | null
          id?: string
          incident_date?: string | null
          industry?: string | null
          national_id_partial?: string | null
          passport_partial?: string | null
          phone?: string | null
          police_report_no?: string | null
          reference_no?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk?: Database["public"]["Enums"]["risk_level"]
          social?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          subject_name?: string
          submitter_id?: string | null
          ticket_number?: string | null
          transaction_type?: string
          updated_at?: string
          wallet?: string | null
          website?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          email: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
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
      generate_ticket_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_account_blocked: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          _action: string
          _metadata?: Json
          _summary?: string
          _target_id?: string
          _target_type?: string
        }
        Returns: string
      }
      record_security_event: {
        Args: {
          _email: string
          _event_type: string
          _ip: string
          _metadata?: Json
          _user_agent: string
          _user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      report_status: "pending" | "approved" | "rejected" | "resolved"
      risk_level: "low" | "medium" | "high"
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
      app_role: ["admin", "user"],
      report_status: ["pending", "approved", "rejected", "resolved"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
