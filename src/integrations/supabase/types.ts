export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string;
          actor_email: string | null;
          actor_id: string;
          created_at: string;
          details: Json;
          id: string;
          target_id: string | null;
          target_label: string | null;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_email?: string | null;
          actor_id: string;
          created_at?: string;
          details?: Json;
          id?: string;
          target_id?: string | null;
          target_label?: string | null;
          target_type?: string;
        };
        Update: {
          action?: string;
          actor_email?: string | null;
          actor_id?: string;
          created_at?: string;
          details?: Json;
          id?: string;
          target_id?: string | null;
          target_label?: string | null;
          target_type?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          created_at: string;
          id: string;
          query_count: number;
          updated_at: string;
          usage_date: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          query_count?: number;
          updated_at?: string;
          usage_date?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          query_count?: number;
          updated_at?: string;
          usage_date?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          client_message_id: string | null;
          content: string;
          created_at: string;
          id: string;
          parts: Json;
          role: string;
          thread_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          client_message_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          parts?: Json;
          role: string;
          thread_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          client_message_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          parts?: Json;
          role?: string;
          thread_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "chat_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_threads: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      paper_holdings: {
        Row: {
          avg_price: number;
          created_at: string;
          id: string;
          shares: number;
          symbol: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avg_price?: number;
          created_at?: string;
          id?: string;
          shares?: number;
          symbol: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avg_price?: number;
          created_at?: string;
          id?: string;
          shares?: number;
          symbol?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      paper_trades: {
        Row: {
          created_at: string;
          id: string;
          price: number;
          shares: number;
          side: string;
          symbol: string;
          total: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          price: number;
          shares: number;
          side: string;
          symbol: string;
          total: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          price?: number;
          shares?: number;
          side?: string;
          symbol?: string;
          total?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      paper_wallets: {
        Row: {
          cash_balance: number;
          created_at: string;
          starting_balance: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cash_balance?: number;
          created_at?: string;
          starting_balance?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cash_balance?: number;
          created_at?: string;
          starting_balance?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount_cents: number;
          channel: string;
          created_at: string;
          currency: string;
          id: string;
          plan_cycle: string;
          provider: string;
          provider_order_id: string | null;
          reference_code: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_cents: number;
          channel: string;
          created_at?: string;
          currency?: string;
          id?: string;
          plan_cycle: string;
          provider?: string;
          provider_order_id?: string | null;
          reference_code?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_cents?: number;
          channel?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          plan_cycle?: string;
          provider?: string;
          provider_order_id?: string | null;
          reference_code?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      price_alerts: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          kind: string;
          last_triggered_at: string | null;
          last_triggered_price: number | null;
          note: string | null;
          notify_browser: boolean;
          notify_in_app: boolean;
          repeat_alert: boolean;
          symbol: string;
          threshold: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: string;
          last_triggered_at?: string | null;
          last_triggered_price?: number | null;
          note?: string | null;
          notify_browser?: boolean;
          notify_in_app?: boolean;
          repeat_alert?: boolean;
          symbol: string;
          threshold: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: string;
          last_triggered_at?: string | null;
          last_triggered_price?: number | null;
          note?: string | null;
          notify_browser?: boolean;
          notify_in_app?: boolean;
          repeat_alert?: boolean;
          symbol?: string;
          threshold?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          lang: string;
          plan: string;
          plan_expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          lang?: string;
          plan?: string;
          plan_expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          lang?: string;
          plan?: string;
          plan_expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_symbols: {
        Row: {
          change_pct: number;
          created_at: string;
          id: string;
          indices: string[];
          is_active: boolean;
          name_ar: string;
          name_en: string;
          price: number;
          sector: string;
          symbol: string;
          updated_at: string;
        };
        Insert: {
          change_pct?: number;
          created_at?: string;
          id?: string;
          indices?: string[];
          is_active?: boolean;
          name_ar: string;
          name_en: string;
          price?: number;
          sector?: string;
          symbol: string;
          updated_at?: string;
        };
        Update: {
          change_pct?: number;
          created_at?: string;
          id?: string;
          indices?: string[];
          is_active?: boolean;
          name_ar?: string;
          name_en?: string;
          price?: number;
          sector?: string;
          symbol?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_set_plan: {
        Args: { _plan: string; _user_id: string };
        Returns: Json;
      };
      admin_set_role: {
        Args: { _make_admin: boolean; _user_id: string };
        Returns: Json;
      };
      admin_set_role_by_email: {
        Args: { _email: string; _make_admin: boolean };
        Returns: Json;
      };
      ai_quota_status: { Args: never; Returns: Json };
      can_manage_access: { Args: never; Returns: boolean };
      consume_ai_query: { Args: never; Returns: Json };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_owner_user: { Args: { _user_id: string }; Returns: boolean };
      is_privileged_user: { Args: { _user_id: string }; Returns: boolean };
      is_super_owner: { Args: never; Returns: boolean };
      owner_emails: { Args: never; Returns: string[] };
      paper_portfolio: { Args: never; Returns: Json };
      paper_trade: {
        Args: {
          _price: number;
          _shares: number;
          _side: string;
          _symbol: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
