export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      system_settings: {
        Row: {
          key: string
          value: string
          description: string | null
          data_type: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          description?: string | null
          data_type?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          description?: string | null
          data_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      matrices: {
        Row: {
          id: string
          code: string
          name: string | null
          type: Database["public"]["Enums"]["matrix_type"]
          created_at: string
          is_active: boolean | null
        }
        Insert: {
          id?: string
          code: string
          name?: string | null
          type?: Database["public"]["Enums"]["matrix_type"]
          created_at?: string
          is_active?: boolean | null
        }
        Update: {
          id?: string
          code?: string
          name?: string | null
          type?: Database["public"]["Enums"]["matrix_type"]
          created_at?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          id: string
          primary_matrix_id: string | null
          secondary_matrix_id: string | null
          sku_slug: string
          drive_link: string | null
          payhip_link: string | null
          cached_traffic_score: number | null
          cached_revenue_score: number | null
          total_score: number | null // Generated column
          current_rarity: Database["public"]["Enums"]["rarity_tier"] | null
          highest_rarity_achieved: Database["public"]["Enums"]["rarity_tier"] | null
          lifecycle_state: Database["public"]["Enums"]["lifecycle_stage"] | null
          created_at: string
          last_synced_at: string | null
          is_retired: boolean | null
        }
        Insert: {
          id?: string
          primary_matrix_id?: string | null
          secondary_matrix_id?: string | null
          sku_slug: string
          drive_link?: string | null
          payhip_link?: string | null
          cached_traffic_score?: number | null
          cached_revenue_score?: number | null
          // total_score is generated always
          current_rarity?: Database["public"]["Enums"]["rarity_tier"] | null
          highest_rarity_achieved?: Database["public"]["Enums"]["rarity_tier"] | null
          lifecycle_state?: Database["public"]["Enums"]["lifecycle_stage"] | null
          created_at?: string
          last_synced_at?: string | null
          is_retired?: boolean | null
        }
        Update: {
          id?: string
          primary_matrix_id?: string | null
          secondary_matrix_id?: string | null
          sku_slug?: string
          drive_link?: string | null
          payhip_link?: string | null
          cached_traffic_score?: number | null
          cached_revenue_score?: number | null
          // total_score is generated always
          current_rarity?: Database["public"]["Enums"]["rarity_tier"] | null
          highest_rarity_achieved?: Database["public"]["Enums"]["rarity_tier"] | null
          lifecycle_state?: Database["public"]["Enums"]["lifecycle_stage"] | null
          created_at?: string
          last_synced_at?: string | null
          is_retired?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_primary_matrix_id_fkey"
            columns: ["primary_matrix_id"]
            referencedRelation: "matrices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_secondary_matrix_id_fkey"
            columns: ["secondary_matrix_id"]
            referencedRelation: "matrices"
            referencedColumns: ["id"]
          }
        ]
      }
      pins: {
        Row: {
          id: string
          external_pin_id: string
          asset_id: string | null
          title: string | null
          description: string | null
          image_url: string | null
          last_stats: Json | null
          is_active_on_platform: boolean | null
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          external_pin_id: string
          asset_id?: string | null
          title?: string | null
          description?: string | null
          image_url?: string | null
          last_stats?: Json | null
          is_active_on_platform?: boolean | null
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          external_pin_id?: string
          asset_id?: string | null
          title?: string | null
          description?: string | null
          image_url?: string | null
          last_stats?: Json | null
          is_active_on_platform?: boolean | null
          last_synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pins_asset_id_fkey"
            columns: ["asset_id"]
            referencedRelation: "assets"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          payhip_transaction_id: string | null
          asset_id: string
          amount: number
          currency: string | null
          source: string | null
          occurred_at: string | null
        }
        Insert: {
          id?: string
          payhip_transaction_id?: string | null
          asset_id: string
          amount: number
          currency?: string | null
          source?: string | null
          occurred_at?: string | null
        }
        Update: {
          id?: string
          payhip_transaction_id?: string | null
          asset_id?: string
          amount?: number
          currency?: string | null
          source?: string | null
          occurred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_asset_id_fkey"
            columns: ["asset_id"]
            referencedRelation: "assets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      v_asset_health_check: {
        Row: {
          // Original Asset Fields
          id: string
          primary_matrix_id: string | null
          secondary_matrix_id: string | null
          sku_slug: string
          drive_link: string | null
          payhip_link: string | null
          cached_traffic_score: number | null
          cached_revenue_score: number | null
          total_score: number | null
          current_rarity: Database["public"]["Enums"]["rarity_tier"] | null
          highest_rarity_achieved: Database["public"]["Enums"]["rarity_tier"] | null
          lifecycle_state: Database["public"]["Enums"]["lifecycle_stage"] | null
          created_at: string
          last_synced_at: string | null
          is_retired: boolean | null
          
          // Augmented View Fields
          link_status: 'CRITICAL' | 'WARNING' | 'OK' | null
          pin_count: number | null
          last_sale_at: string | null
          days_since_sale: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_primary_matrix_id_fkey"
            columns: ["primary_matrix_id"]
            referencedRelation: "matrices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_secondary_matrix_id_fkey"
            columns: ["secondary_matrix_id"]
            referencedRelation: "matrices"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      trigger_reignite: {
        Args: {
          target_asset_id: string
        }
        Returns: void
      }
      recalculate_asset_score: {
        Args: {
          target_asset_id: string
        }
        Returns: void
      }
    }
    Enums: {
      rarity_tier: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
      lifecycle_stage: 'INCUBATION' | 'MONETIZATION' | 'DOMINANCE'
      matrix_type: 'PRIMARY' | 'SECONDARY'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// === EXPORTED INTERFACES FOR APP CONSUMPTION ===

// The Raw Table Row (Useful for Inserts/Updates)
export type AssetRow = Database['public']['Tables']['assets']['Row'];

// The Enriched Asset (Used in Frontend Views / Intelligence Layers)
// Prefer this type for Arena, Swarm, and Cards.
export type Asset = Database['public']['Views']['v_asset_health_check']['Row'];

// Matrix Type
export type Matrix = Database['public']['Tables']['matrices']['Row'];

// Helper for Enums
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Helper for Tables
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];