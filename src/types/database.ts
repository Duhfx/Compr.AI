// src/types/database.ts
// Types para o schema do Supabase

export interface Database {
  public: {
    Tables: {
      shopping_lists: {
        Row: {
          id: string;
          user_id: string; // Changed from device_id
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string; // Changed from device_id
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string; // Changed from device_id
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      shopping_items: {
        Row: {
          id: string;
          list_id: string;
          name: string;
          quantity: number;
          unit: string;
          category: string | null;
          checked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          name: string;
          quantity?: number;
          unit?: string;
          category?: string | null;
          checked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          name?: string;
          quantity?: number;
          unit?: string;
          category?: string | null;
          checked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      shared_lists: {
        Row: {
          id: string;
          list_id: string;
          share_code: string;
          owner_user_id: string; // Changed from owner_device_id
          permission: 'edit' | 'readonly';
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          list_id: string;
          share_code: string;
          owner_user_id: string; // Changed from owner_device_id
          permission?: 'edit' | 'readonly';
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          list_id?: string;
          share_code?: string;
          owner_user_id?: string; // Changed from owner_device_id
          permission?: 'edit' | 'readonly';
          created_at?: string;
          expires_at?: string | null;
        };
      };
      list_members: {
        Row: {
          id: string;
          list_id: string;
          user_id: string; // Changed from device_id
          joined_at: string;
          last_seen_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          list_id: string;
          user_id: string; // Changed from device_id
          joined_at?: string;
          last_seen_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          list_id?: string;
          user_id?: string; // Changed from device_id
          joined_at?: string;
          last_seen_at?: string | null;
          is_active?: boolean;
        };
      };
      purchase_history: {
        Row: {
          id: string;
          user_id: string; // Changed from device_id
          item_name: string;
          category: string | null;
          quantity: number | null;
          unit: string | null;
          purchased_at: string;
          list_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string; // Changed from device_id
          item_name: string;
          category?: string | null;
          quantity?: number | null;
          unit?: string | null;
          purchased_at?: string;
          list_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string; // Changed from device_id
          item_name?: string;
          category?: string | null;
          quantity?: number | null;
          unit?: string | null;
          purchased_at?: string;
          list_id?: string | null;
        };
      };
      price_history: {
        Row: {
          id: string;
          user_id: string; // Changed from device_id
          item_name: string;
          price: number;
          store: string | null;
          purchased_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string; // Changed from device_id
          item_name: string;
          price: number;
          store?: string | null;
          purchased_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string; // Changed from device_id
          item_name?: string;
          price?: number;
          store?: string | null;
          purchased_at?: string;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          user_id: string;
          nickname: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          nickname: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          nickname?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      list_members_with_names: {
        Row: {
          id: string;
          list_id: string;
          user_id: string;
          joined_at: string;
          last_seen_at: string | null;
          is_active: boolean;
          nickname: string;
          avatar_url: string | null;
        };
      };
    };
  };
}
