// src/types/index.ts
// Tipos centralizados do Compr.AI

// Re-exportar tipos do database
export type { Database } from './database';

// Tipos de Listas
export interface ListWithStats {
  id: string;
  name: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  createdAt: Date;
  updatedAt: Date;
  totalItems: number;
  checkedItems: number;
  progress: number;
  uncheckedItems?: number;
}

// Tipos de Itens
export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  checked: boolean;
  checkedByUserNickname?: string;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de Usuário
export interface User {
  id: string;
  email: string;
  nickname?: string;
  created_at: string;
}

// Tipos de Histórico
export interface PurchaseHistoryItem {
  id: string;
  user_id: string;
  item_name: string;
  category?: string;
  quantity: number;
  unit: string;
  purchased_at: string;
  list_id?: string;
}

export interface PriceHistoryItem {
  id: string;
  user_id: string;
  item_name: string;
  price: number;
  store?: string;
  purchased_at: string;
  created_at: string;
}

// Tipos de Compartilhamento
export interface SharedList {
  id: string;
  list_id: string;
  share_code: string;
  owner_user_id: string;
  permission: 'edit' | 'readonly';
  created_at: string;
  expires_at?: string;
}

export interface ListMember {
  id: string;
  list_id: string;
  user_id: string;
  joined_at: string;
  last_seen_at?: string;
  is_active: boolean;
}
