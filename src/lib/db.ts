import Dexie from 'dexie';
import type { EntityTable } from 'dexie';

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  isLocal: boolean;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  checked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDevice {
  userId: string;
  nickname: string;
  lastSyncAt?: Date;
}

export interface PurchaseHistory {
  id: string;
  userId: string;
  itemName: string;
  category?: string;
  quantity: number;
  unit: string;
  purchasedAt: Date;
  listId: string;
}

export interface PriceHistory {
  id: string;
  userId: string;
  itemName: string;
  price: number;
  store?: string;
  purchasedAt: Date;
  createdAt: Date;
}

export interface SharedList {
  id: string;
  listId: string;
  shareCode: string;
  ownerUserId: string;
  permission: 'edit' | 'readonly';
  createdAt: Date;
  expiresAt?: Date;
}

export interface ListMember {
  id: string;
  listId: string;
  userId: string;
  joinedAt: Date;
  lastSeenAt?: Date;
  isActive: boolean;
}

export interface ListSuggestionCache {
  listId: string;
  suggestions: {
    name: string;
    quantity: number;
    unit: string;
    category?: string;
  }[];
  createdAt: Date;
  itemsCountWhenGenerated: number;
  lastItemNamesHash: string; // Hash dos últimos 5 itens para detectar mudanças
}

export class CompraiDB extends Dexie {
  shoppingLists!: EntityTable<ShoppingList, 'id'>;
  shoppingItems!: EntityTable<ShoppingItem, 'id'>;
  userDevice!: EntityTable<UserDevice, 'userId'>;
  purchaseHistory!: EntityTable<PurchaseHistory, 'id'>;
  priceHistory!: EntityTable<PriceHistory, 'id'>;
  sharedLists!: EntityTable<SharedList, 'id'>;
  listMembers!: EntityTable<ListMember, 'id'>;
  listSuggestionCache!: EntityTable<ListSuggestionCache, 'listId'>;

  constructor() {
    super('CompraiDB');

    // Version 1: Schema inicial
    this.version(1).stores({
      shoppingLists: 'id, isLocal, syncedAt, updatedAt',
      shoppingItems: 'id, listId, checked, createdAt',
      userDevice: 'userId',
      purchaseHistory: 'id, userId, itemName, purchasedAt',
      priceHistory: 'id, userId, itemName, purchasedAt'
    });

    // Version 2: Adiciona tabelas de compartilhamento
    this.version(2).stores({
      shoppingLists: 'id, isLocal, syncedAt, updatedAt',
      shoppingItems: 'id, listId, checked, createdAt',
      userDevice: 'userId',
      purchaseHistory: 'id, userId, itemName, purchasedAt',
      priceHistory: 'id, userId, itemName, purchasedAt',
      sharedLists: 'id, listId, shareCode',
      listMembers: 'id, listId, userId, isActive'
    });

    // Version 3: Adiciona cache de sugestões de IA (DEPRECATED - tinha primary key errada)
    this.version(3).stores({
      shoppingLists: 'id, isLocal, syncedAt, updatedAt',
      shoppingItems: 'id, listId, checked, createdAt',
      userDevice: 'userId',
      purchaseHistory: 'id, userId, itemName, purchasedAt',
      priceHistory: 'id, userId, itemName, purchasedAt',
      sharedLists: 'id, listId, shareCode',
      listMembers: 'id, listId, userId, isActive',
      listSuggestionCache: 'listId, createdAt'
    });

    // Version 4: Recria cache de sugestões com primary key correta
    this.version(4).stores({
      shoppingLists: 'id, isLocal, syncedAt, updatedAt',
      shoppingItems: 'id, listId, checked, createdAt',
      userDevice: 'userId',
      purchaseHistory: 'id, userId, itemName, purchasedAt',
      priceHistory: 'id, userId, itemName, purchasedAt',
      sharedLists: 'id, listId, shareCode',
      listMembers: 'id, listId, userId, isActive',
      listSuggestionCache: null // Remove a tabela antiga
    }).upgrade(tx => {
      // Limpar dados antigos se existirem
      console.log('[DB] Upgrading to version 4: removing old suggestion cache');
      return tx.table('listSuggestionCache').clear().catch(() => {
        // Ignorar erros se a tabela não existir
      });
    });

    // Version 5: Recria cache de sugestões com schema correto
    this.version(5).stores({
      shoppingLists: 'id, isLocal, syncedAt, updatedAt',
      shoppingItems: 'id, listId, checked, createdAt',
      userDevice: 'userId',
      purchaseHistory: 'id, userId, itemName, purchasedAt',
      priceHistory: 'id, userId, itemName, purchasedAt',
      sharedLists: 'id, listId, shareCode',
      listMembers: 'id, listId, userId, isActive',
      listSuggestionCache: 'listId, createdAt'
    });
  }
}

export const db = new CompraiDB();

// Handler para erros de migração - deleta e recria o banco se necessário
db.on('versionchange', () => {
  console.log('[DB] Version change detected, reloading...');
  db.close();
  window.location.reload();
});

// Detectar erro de upgrade e recriar banco
db.open().catch(async (err) => {
  if (err.name === 'UpgradeError' || err.message?.includes('primary key')) {
    console.warn('[DB] Migration error detected, deleting and recreating database:', err.message);

    // Deletar o banco antigo
    await db.delete();

    // Recarregar a página para recriar o banco
    console.log('[DB] Database deleted, reloading page...');
    window.location.reload();
  } else {
    console.error('[DB] Failed to open database:', err);
  }
});
