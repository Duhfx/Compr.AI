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
  deviceId: string;
  nickname: string;
  lastSyncAt?: Date;
}

export interface PurchaseHistory {
  id: string;
  deviceId: string;
  itemName: string;
  category?: string;
  quantity: number;
  unit: string;
  purchasedAt: Date;
  listId: string;
}

export interface PriceHistory {
  id: string;
  deviceId: string;
  itemName: string;
  price: number;
  store?: string;
  purchasedAt: Date;
  createdAt: Date;
}

export class CompraiDB extends Dexie {
  shoppingLists!: EntityTable<ShoppingList, 'id'>;
  shoppingItems!: EntityTable<ShoppingItem, 'id'>;
  userDevice!: EntityTable<UserDevice, 'deviceId'>;
  purchaseHistory!: EntityTable<PurchaseHistory, 'id'>;
  priceHistory!: EntityTable<PriceHistory, 'id'>;

  constructor() {
    super('CompraiDB');

    this.version(1).stores({
      shoppingLists: 'id, isLocal, syncedAt, updatedAt',
      shoppingItems: 'id, listId, checked, createdAt',
      userDevice: 'deviceId',
      purchaseHistory: 'id, deviceId, itemName, purchasedAt',
      priceHistory: 'id, deviceId, itemName, purchasedAt'
    });
  }
}

export const db = new CompraiDB();
