export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          client_id: string | null
          created_at: string | null
          deletion_mark: boolean | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          ts_code: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          deletion_mark?: boolean | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          ts_code?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          deletion_mark?: boolean | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          ts_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_weeks: {
        Row: {
          created_at: string | null
          id: string
          name: string
          period_from: string
          period_to: string
          required_hours: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          period_from: string
          period_to: string
          required_hours: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          period_from?: string
          period_to?: string
          required_hours?: number
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      media_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_managers: {
        Row: {
          created_at: string | null
          id: string
          manager_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manager_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manager_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_managers_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_managers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          deletion_mark: boolean | null
          department_id: string | null
          description: string | null
          email: string | null
          first_custom_week_id: string | null
          first_week: string | null
          hidden: boolean | null
          id: string
          job_position: string | null
          login: string
          name: string
          password: string
          type: string
        }
        Insert: {
          created_at?: string | null
          deletion_mark?: boolean | null
          department_id?: string | null
          description?: string | null
          email?: string | null
          first_custom_week_id?: string | null
          first_week?: string | null
          hidden?: boolean | null
          id?: string
          job_position?: string | null
          login: string
          name: string
          password: string
          type: string
        }
        Update: {
          created_at?: string | null
          deletion_mark?: boolean | null
          department_id?: string | null
          description?: string | null
          email?: string | null
          first_custom_week_id?: string | null
          first_week?: string | null
          hidden?: boolean | null
          id?: string
          job_position?: string | null
          login?: string
          name?: string
          password?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_first_custom_week_id_fkey"
            columns: ["first_custom_week_id"]
            isOneToOne: false
            referencedRelation: "custom_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      visible_clients: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visible_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visible_clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      visible_types: {
        Row: {
          created_at: string | null
          id: string
          type_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          type_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          type_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visible_types_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "media_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visible_types_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      week_hours: {
        Row: {
          client_id: string
          created_at: string | null
          hours: number
          id: string
          media_type_id: string
          user_id: string
          week_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          hours: number
          id?: string
          media_type_id: string
          user_id: string
          week_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          hours?: number
          id?: string
          media_type_id?: string
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_hours_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_hours_media_type_id_fkey"
            columns: ["media_type_id"]
            isOneToOne: false
            referencedRelation: "media_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_hours_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "custom_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      week_percentages: {
        Row: {
          created_at: string | null
          id: string
          percentage: number
          user_id: string
          week_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          percentage: number
          user_id: string
          week_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          percentage?: number
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_percentages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_percentages_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "custom_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      week_status_names: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      week_statuses: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          week_id: string
          week_status_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          week_id: string
          week_status_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          week_id?: string
          week_status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_statuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_statuses_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "custom_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_statuses_week_status_id_fkey"
            columns: ["week_status_id"]
            isOneToOne: false
            referencedRelation: "week_status_names"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
