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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      emitter_subscriptions: {
        Row: {
          created_at: string
          id: string
          ticker: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ticker: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          body_text: string
          categories: string[] | null
          category: string
          company_name: string
          created_at: string
          date: string
          description: string | null
          full_date: string
          id: string
          price: number
          price_change: number
          price_change_percent: number
          published_at: string | null
          sector: string
          source_url: string | null
          ticker: string
          title: string
        }
        Insert: {
          body_text?: string
          categories?: string[] | null
          category?: string
          company_name: string
          created_at?: string
          date?: string
          description?: string | null
          full_date?: string
          id?: string
          price?: number
          price_change?: number
          price_change_percent?: number
          published_at?: string | null
          sector?: string
          source_url?: string | null
          ticker: string
          title: string
        }
        Update: {
          body_text?: string
          categories?: string[] | null
          category?: string
          company_name?: string
          created_at?: string
          date?: string
          description?: string | null
          full_date?: string
          id?: string
          price?: number
          price_change?: number
          price_change_percent?: number
          published_at?: string | null
          sector?: string
          source_url?: string | null
          ticker?: string
          title?: string
        }
        Relationships: []
      }
      news_bookmarks: {
        Row: {
          created_at: string
          id: string
          news_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          user_id?: string
        }
        Relationships: []
      }
      news_comments: {
        Row: {
          created_at: string
          id: string
          likes: number
          news_id: string
          parent_id: string | null
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          likes?: number
          news_id: string
          parent_id?: string | null
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          likes?: number
          news_id?: string
          parent_id?: string | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "news_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      news_votes: {
        Row: {
          created_at: string
          id: string
          news_id: string
          user_id: string
          vote: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          user_id: string
          vote: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          user_id?: string
          vote?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          notify_email: boolean
          notify_telegram: boolean
          notify_web: boolean
          phone: string | null
          telegram_chat_id: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          notify_email?: boolean
          notify_telegram?: boolean
          notify_web?: boolean
          phone?: string | null
          telegram_chat_id?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          notify_email?: boolean
          notify_telegram?: boolean
          notify_web?: boolean
          phone?: string | null
          telegram_chat_id?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          payment_id: string | null
          period: string
          plan_id: string
          starts_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          period: string
          plan_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          period?: string
          plan_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_source_subscriptions: {
        Row: {
          created_at: string
          id: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_plan: {
        Args: { _user_id?: string }
        Returns: {
          expires_at: string
          is_blocked: boolean
          is_trial: boolean
          max_emitters: number
          max_sources: number
          plan_id: string
          trial_active: boolean
          trial_days_left: number
          trial_started_at: string
        }[]
      }
      start_trial_if_needed: { Args: never; Returns: string }
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
  public: {
    Enums: {},
  },
} as const
