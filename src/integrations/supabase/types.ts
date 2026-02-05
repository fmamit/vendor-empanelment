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
      category_documents: {
        Row: {
          category_id: string
          display_order: number | null
          document_type_id: string
          id: string
          is_mandatory: boolean
        }
        Insert: {
          category_id: string
          display_order?: number | null
          document_type_id: string
          id?: string
          is_mandatory?: boolean
        }
        Update: {
          category_id?: string
          display_order?: number | null
          document_type_id?: string
          id?: string
          is_mandatory?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "category_documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vendor_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          accepted_formats: string[] | null
          created_at: string
          description: string | null
          has_expiry: boolean
          id: string
          max_file_size_mb: number | null
          name: string
          sample_url: string | null
        }
        Insert: {
          accepted_formats?: string[] | null
          created_at?: string
          description?: string | null
          has_expiry?: boolean
          id?: string
          max_file_size_mb?: number | null
          name: string
          sample_url?: string | null
        }
        Update: {
          accepted_formats?: string[] | null
          created_at?: string
          description?: string | null
          has_expiry?: boolean
          id?: string
          max_file_size_mb?: number | null
          name?: string
          sample_url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          read_at: string | null
          recipient_id: string
          related_vendor_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type?: string
          read_at?: string | null
          recipient_id: string
          related_vendor_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          read_at?: string | null
          recipient_id?: string
          related_vendor_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_vendor_id_fkey"
            columns: ["related_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          otp_code: string
          phone_number: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean
          otp_code: string
          phone_number: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          otp_code?: string
          phone_number?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
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
      vendor_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      vendor_documents: {
        Row: {
          created_at: string
          document_type_id: string
          expiry_date: string | null
          file_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          vendor_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          document_type_id: string
          expiry_date?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          vendor_id: string
          version_number?: number
        }
        Update: {
          created_at?: string
          document_type_id?: string
          expiry_date?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          vendor_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_invitations: {
        Row: {
          category_id: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          vendor_id: string | null
        }
        Insert: {
          category_id: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          token: string
          used_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          category_id?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_invitations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vendor_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_invitations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_primary_contact: boolean
          last_login_at: string | null
          phone_number: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary_contact?: boolean
          last_login_at?: string | null
          phone_number: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary_contact?: boolean
          last_login_at?: string | null
          phone_number?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_users_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_verifications: {
        Row: {
          created_at: string
          id: string
          remarks: string | null
          request_data: Json | null
          response_data: Json | null
          status: string
          updated_at: string
          vendor_id: string
          verification_source: string
          verification_type: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          remarks?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
          updated_at?: string
          vendor_id: string
          verification_source?: string
          verification_type: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          remarks?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
          updated_at?: string
          vendor_id?: string
          verification_source?: string
          verification_type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_verifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          approved_at: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          category_id: string
          cin_number: string | null
          company_name: string
          created_at: string
          current_status: Database["public"]["Enums"]["vendor_status"]
          gst_number: string | null
          id: string
          operational_address: string | null
          pan_number: string | null
          primary_contact_name: string
          primary_email: string
          primary_mobile: string
          registered_address: string | null
          rejected_at: string | null
          rejection_reason: string | null
          secondary_contact_name: string | null
          secondary_mobile: string | null
          submitted_at: string | null
          trade_name: string | null
          updated_at: string
          vendor_code: string | null
        }
        Insert: {
          approved_at?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          category_id: string
          cin_number?: string | null
          company_name: string
          created_at?: string
          current_status?: Database["public"]["Enums"]["vendor_status"]
          gst_number?: string | null
          id?: string
          operational_address?: string | null
          pan_number?: string | null
          primary_contact_name: string
          primary_email: string
          primary_mobile: string
          registered_address?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          secondary_contact_name?: string | null
          secondary_mobile?: string | null
          submitted_at?: string | null
          trade_name?: string | null
          updated_at?: string
          vendor_code?: string | null
        }
        Update: {
          approved_at?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          category_id?: string
          cin_number?: string | null
          company_name?: string
          created_at?: string
          current_status?: Database["public"]["Enums"]["vendor_status"]
          gst_number?: string | null
          id?: string
          operational_address?: string | null
          pan_number?: string | null
          primary_contact_name?: string
          primary_email?: string
          primary_mobile?: string
          registered_address?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          secondary_contact_name?: string | null
          secondary_mobile?: string | null
          submitted_at?: string | null
          trade_name?: string | null
          updated_at?: string
          vendor_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vendor_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          delivered_at: string | null
          direction: string
          error_message: string | null
          exotel_message_id: string | null
          id: string
          message_content: string | null
          phone_number: string
          read_at: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          template_name: string | null
          template_variables: Json | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          direction: string
          error_message?: string | null
          exotel_message_id?: string | null
          id?: string
          message_content?: string | null
          phone_number: string
          read_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          template_name?: string | null
          template_variables?: Json | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          exotel_message_id?: string | null
          id?: string
          message_content?: string | null
          phone_number?: string
          read_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          template_name?: string | null
          template_variables?: Json | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          created_at: string
          exotel_api_key: string | null
          exotel_api_token: string | null
          exotel_sid: string | null
          exotel_subdomain: string | null
          id: string
          is_active: boolean | null
          updated_at: string
          waba_id: string | null
          whatsapp_source_number: string | null
        }
        Insert: {
          created_at?: string
          exotel_api_key?: string | null
          exotel_api_token?: string | null
          exotel_sid?: string | null
          exotel_subdomain?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          waba_id?: string | null
          whatsapp_source_number?: string | null
        }
        Update: {
          created_at?: string
          exotel_api_key?: string | null
          exotel_api_token?: string | null
          exotel_sid?: string | null
          exotel_subdomain?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          waba_id?: string | null
          whatsapp_source_number?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          status: string | null
          template_name: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          status?: string | null
          template_name: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          status?: string | null
          template_name?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      workflow_assignments: {
        Row: {
          assigned_at: string
          assigned_to: string
          completed_at: string | null
          due_at: string | null
          id: string
          stage: Database["public"]["Enums"]["vendor_status"]
          vendor_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_to: string
          completed_at?: string | null
          due_at?: string | null
          id?: string
          stage: Database["public"]["Enums"]["vendor_status"]
          vendor_id: string
        }
        Update: {
          assigned_at?: string
          assigned_to?: string
          completed_at?: string | null
          due_at?: string | null
          id?: string
          stage?: Database["public"]["Enums"]["vendor_status"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_assignments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_history: {
        Row: {
          action: Database["public"]["Enums"]["workflow_action"]
          action_by: string
          comments: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["vendor_status"] | null
          id: string
          time_in_stage_minutes: number | null
          to_status: Database["public"]["Enums"]["vendor_status"]
          vendor_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["workflow_action"]
          action_by: string
          comments?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["vendor_status"] | null
          id?: string
          time_in_stage_minutes?: number | null
          to_status: Database["public"]["Enums"]["vendor_status"]
          vendor_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["workflow_action"]
          action_by?: string
          comments?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["vendor_status"] | null
          id?: string
          time_in_stage_minutes?: number | null
          to_status?: Database["public"]["Enums"]["vendor_status"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_history_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_staff_access_vendor: {
        Args: { _user_id: string; _vendor_id: string }
        Returns: boolean
      }
      get_vendor_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_internal_staff: { Args: { _user_id: string }; Returns: boolean }
      is_vendor_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "maker" | "checker" | "approver" | "admin"
      document_status:
        | "uploaded"
        | "under_review"
        | "approved"
        | "rejected"
        | "expired"
      vendor_status:
        | "draft"
        | "pending_review"
        | "in_verification"
        | "pending_approval"
        | "approved"
        | "rejected"
      workflow_action:
        | "submitted"
        | "forwarded"
        | "approved"
        | "rejected"
        | "returned"
        | "assigned"
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
      app_role: ["maker", "checker", "approver", "admin"],
      document_status: [
        "uploaded",
        "under_review",
        "approved",
        "rejected",
        "expired",
      ],
      vendor_status: [
        "draft",
        "pending_review",
        "in_verification",
        "pending_approval",
        "approved",
        "rejected",
      ],
      workflow_action: [
        "submitted",
        "forwarded",
        "approved",
        "rejected",
        "returned",
        "assigned",
      ],
    },
  },
} as const
