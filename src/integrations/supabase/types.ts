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
      content_comments: {
        Row: {
          admin_reply: string | null
          body: string
          created_at: string
          id: string
          item_id: string
          name: string
          replied_at: string | null
          updated_at: string
        }
        Insert: {
          admin_reply?: string | null
          body: string
          created_at?: string
          id?: string
          item_id: string
          name: string
          replied_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_reply?: string | null
          body?: string
          created_at?: string
          id?: string
          item_id?: string
          name?: string
          replied_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          body: string | null
          collection: string
          created_at: string
          id: string
          image_url: string | null
          meta: Json
          published: boolean
          slug: string | null
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          collection: string
          created_at?: string
          id?: string
          image_url?: string | null
          meta?: Json
          published?: boolean
          slug?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          collection?: string
          created_at?: string
          id?: string
          image_url?: string | null
          meta?: Json
          published?: boolean
          slug?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_likes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          visitor_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          visitor_key: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          visitor_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          item_id: string
          name: string
          rating: number
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          item_id: string
          name: string
          rating: number
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          item_id?: string
          name?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reviews_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          currency: string
          email: string
          id: string
          message: string | null
          name: string | null
          order_ref: string
          paid_at: string | null
          phone: string | null
          provider: string
          provider_ref: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          email: string
          id?: string
          message?: string | null
          name?: string | null
          order_ref?: string
          paid_at?: string | null
          phone?: string | null
          provider?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          email?: string
          id?: string
          message?: string | null
          name?: string | null
          order_ref?: string
          paid_at?: string | null
          phone?: string | null
          provider?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          email: string
          id: string
          kind: string
          name: string
          subject: string | null
        }
        Insert: {
          body: string
          created_at?: string
          email: string
          id?: string
          kind?: string
          name: string
          subject?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          email?: string
          id?: string
          kind?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          content: Json
          id: string
          page: string
          section_key: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          page: string
          section_key: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          page?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          bundle_expires_at: string | null
          created_at: string
          currency: string
          email: string
          id: string
          item_id: string | null
          item_title: string | null
          order_ref: string
          paid_at: string | null
          phone: string | null
          provider: string
          provider_ref: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          bundle_expires_at?: string | null
          created_at?: string
          currency?: string
          email: string
          id?: string
          item_id?: string | null
          item_title?: string | null
          order_ref?: string
          paid_at?: string | null
          phone?: string | null
          provider?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bundle_expires_at?: string | null
          created_at?: string
          currency?: string
          email?: string
          id?: string
          item_id?: string | null
          item_title?: string | null
          order_ref?: string
          paid_at?: string | null
          phone?: string | null
          provider?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      script_synopses: {
        Row: {
          item_id: string
          synopsis: string
        }
        Insert: {
          item_id: string
          synopsis?: string
        }
        Update: {
          item_id?: string
          synopsis?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_synopses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          path: string
          referrer: string | null
          user_agent: string | null
          visitor_key: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          user_agent?: string | null
          visitor_key: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          user_agent?: string | null
          visitor_key?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      unlocks: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          item_id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          item_id: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          item_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "unlocks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      read_script_synopsis: {
        Args: { payment_reference?: string; script_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
    },
  },
} as const
