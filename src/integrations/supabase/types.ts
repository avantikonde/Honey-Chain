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
      ai_predictions: {
        Row: {
          acknowledged: boolean
          created_at: string
          factors: Json
          hive_id: string
          id: string
          recommendation: string
          risk_score: number
          status: string
          title: string
        }
        Insert: {
          acknowledged?: boolean
          created_at?: string
          factors?: Json
          hive_id: string
          id?: string
          recommendation: string
          risk_score: number
          status: string
          title: string
        }
        Update: {
          acknowledged?: boolean
          created_at?: string
          factors?: Json
          hive_id?: string
          id?: string
          recommendation?: string
          risk_score?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_hive_id_fkey"
            columns: ["hive_id"]
            isOneToOne: false
            referencedRelation: "hives"
            referencedColumns: ["id"]
          },
        ]
      }
      apiaries: {
        Row: {
          beekeeper_name: string
          created_at: string
          id: string
          is_demo: boolean
          location: string
          name: string
          owner_id: string | null
          region: string | null
        }
        Insert: {
          beekeeper_name?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          location: string
          name: string
          owner_id?: string | null
          region?: string | null
        }
        Update: {
          beekeeper_name?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          location?: string
          name?: string
          owner_id?: string | null
          region?: string | null
        }
        Relationships: []
      }
      blockchain_records: {
        Row: {
          actor: string
          batch_code: string
          batch_id: string
          block_number: number
          data_hash: string
          event_id: string | null
          event_type: string
          id: string
          mode: string
          network: string
          recorded_at: string
          tx_hash: string
        }
        Insert: {
          actor?: string
          batch_code: string
          batch_id: string
          block_number?: number
          data_hash: string
          event_id?: string | null
          event_type: string
          id?: string
          mode?: string
          network?: string
          recorded_at?: string
          tx_hash: string
        }
        Update: {
          actor?: string
          batch_code?: string
          batch_id?: string
          block_number?: number
          data_hash?: string
          event_id?: string | null
          event_type?: string
          id?: string
          mode?: string
          network?: string
          recorded_at?: string
          tx_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "honey_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockchain_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "traceability_events"
            referencedColumns: ["id"]
          },
        ]
      }
      hives: {
        Row: {
          acoustic_index: number
          activity_pct: number
          apiary_id: string
          code: string
          created_at: string
          health_score: number
          humidity: number
          id: string
          is_demo: boolean
          location: string | null
          owner_id: string | null
          status: string
          temperature: number
          updated_at: string
          weight_kg: number
        }
        Insert: {
          acoustic_index?: number
          activity_pct?: number
          apiary_id: string
          code: string
          created_at?: string
          health_score?: number
          humidity?: number
          id?: string
          is_demo?: boolean
          location?: string | null
          owner_id?: string | null
          status?: string
          temperature?: number
          updated_at?: string
          weight_kg?: number
        }
        Update: {
          acoustic_index?: number
          activity_pct?: number
          apiary_id?: string
          code?: string
          created_at?: string
          health_score?: number
          humidity?: number
          id?: string
          is_demo?: boolean
          location?: string | null
          owner_id?: string | null
          status?: string
          temperature?: number
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "hives_apiary_id_fkey"
            columns: ["apiary_id"]
            isOneToOne: false
            referencedRelation: "apiaries"
            referencedColumns: ["id"]
          },
        ]
      }
      honey_batches: {
        Row: {
          apiary: string
          batch_code: string
          beekeeper_name: string
          created_at: string
          extraction_method: string
          harvest_date: string
          hive_code: string
          hive_id: string | null
          honey_type: string
          id: string
          is_demo: boolean
          location: string
          owner_id: string | null
          quality_status: string
          quantity_kg: number
          stage: string
        }
        Insert: {
          apiary?: string
          batch_code: string
          beekeeper_name?: string
          created_at?: string
          extraction_method?: string
          harvest_date?: string
          hive_code?: string
          hive_id?: string | null
          honey_type?: string
          id?: string
          is_demo?: boolean
          location?: string
          owner_id?: string | null
          quality_status?: string
          quantity_kg?: number
          stage?: string
        }
        Update: {
          apiary?: string
          batch_code?: string
          beekeeper_name?: string
          created_at?: string
          extraction_method?: string
          harvest_date?: string
          hive_code?: string
          hive_id?: string | null
          honey_type?: string
          id?: string
          is_demo?: boolean
          location?: string
          owner_id?: string | null
          quality_status?: string
          quantity_kg?: number
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "honey_batches_hive_id_fkey"
            columns: ["hive_id"]
            isOneToOne: false
            referencedRelation: "hives"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          location: string | null
          organisation: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          location?: string | null
          organisation?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          location?: string | null
          organisation?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      quality_tests: {
        Row: {
          batch_id: string
          id: string
          lab: string | null
          result: string
          test_name: string
          tested_at: string
          value: string
        }
        Insert: {
          batch_id: string
          id?: string
          lab?: string | null
          result?: string
          test_name: string
          tested_at?: string
          value: string
        }
        Update: {
          batch_id?: string
          id?: string
          lab?: string | null
          result?: string
          test_name?: string
          tested_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_tests_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "honey_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_readings: {
        Row: {
          acoustic_index: number
          activity_pct: number
          hive_id: string
          humidity: number
          id: string
          recorded_at: string
          source: string
          temperature: number
          weight_kg: number
        }
        Insert: {
          acoustic_index?: number
          activity_pct: number
          hive_id: string
          humidity: number
          id?: string
          recorded_at?: string
          source?: string
          temperature: number
          weight_kg: number
        }
        Update: {
          acoustic_index?: number
          activity_pct?: number
          hive_id?: string
          humidity?: number
          id?: string
          recorded_at?: string
          source?: string
          temperature?: number
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_hive_id_fkey"
            columns: ["hive_id"]
            isOneToOne: false
            referencedRelation: "hives"
            referencedColumns: ["id"]
          },
        ]
      }
      traceability_events: {
        Row: {
          actor: string
          batch_id: string
          created_at: string
          event_type: string
          id: string
          location: string | null
          notes: string | null
          occurred_at: string
          status: string
          verified: boolean
        }
        Insert: {
          actor: string
          batch_id: string
          created_at?: string
          event_type: string
          id?: string
          location?: string | null
          notes?: string | null
          occurred_at?: string
          status?: string
          verified?: boolean
        }
        Update: {
          actor?: string
          batch_id?: string
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          occurred_at?: string
          status?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "traceability_events_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "honey_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "beekeeper" | "processor" | "consumer" | "admin"
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
      app_role: ["beekeeper", "processor", "consumer", "admin"],
    },
  },
} as const
