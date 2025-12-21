
export enum PrizeType {
  EMPTY = 'EMPTY',
  POINT = 'POINT',
  CASH = 'CASH',
  COUPON = 'COUPON',
  PHYSICAL = 'PHYSICAL',
  FRAGMENT = 'FRAGMENT',
}

export interface Prize {
  id: string;
  name: string;
  type: PrizeType;
  value: number; // Monetary value or Point value
  probability: number; // Percentage 0-100
  image?: string;
  fragmentId?: string; // If it's a fragment, which item does it build?
  isRare?: boolean;
}

export interface User {
  name: string;
  points: number;
  inventory: InventoryItem[];
  fragments: Record<string, number>; // fragmentId -> count
}

export interface InventoryItem {
  prizeId: string;
  prizeName: string;
  obtainedAt: number;
  isRedeemed: boolean;
}

export interface DrawLog {
  id: string;
  userName: string;
  prizeName: string;
  prizeType: PrizeType;
  timestamp: number;
  redeemedAt?: number; // Timestamp of when the prize was claimed/redeemed
}
