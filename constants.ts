import { Prize, PrizeType } from './types';

export const COST_PER_DRAW = 30; // 30 Points
export const FRAGMENTS_NEEDED = 3;

// Total Probability sums to 100%
export const PRIZE_POOL: Prize[] = [
  // --- Empty (19.52%) ---
  { id: 'empty_1', name: '再接再厉', type: PrizeType.EMPTY, value: 0, probability: 19.52 },

  // --- Points (15%) ---
  { id: 'pt_5', name: '5 积分', type: PrizeType.POINT, value: 5, probability: 10.0 },
  { id: 'pt_10', name: '10 积分', type: PrizeType.POINT, value: 10, probability: 3.0 },
  { id: 'pt_20', name: '20 积分', type: PrizeType.POINT, value: 20, probability: 2.0 },

  // --- Cash Red Packets (36%) ---
  { id: 'cash_5', name: '5元 微信红包', type: PrizeType.CASH, value: 5, probability: 15.0 },
  { id: 'cash_10', name: '10元 微信红包', type: PrizeType.CASH, value: 10, probability: 10.0 },
  { id: 'cash_20', name: '20元 微信红包', type: PrizeType.CASH, value: 20, probability: 8.0 },
  { id: 'cash_100', name: '100元 现金红包', type: PrizeType.CASH, value: 100, probability: 3.0, isRare: true },

  // --- Coupons (7.5%) ---
  { id: 'coupon_50', name: '50元 课程代金券', type: PrizeType.COUPON, value: 50, probability: 6.0 },
  { id: 'coupon_200', name: '200元 课程代金券', type: PrizeType.COUPON, value: 200, probability: 1.5, isRare: true },

  // --- Physical Items (18.5%) ---
  { id: 'phys_drink', name: '运动饮料/能量棒', type: PrizeType.PHYSICAL, value: 5, probability: 8.0 },
  { id: 'phys_badge', name: '纪念徽章', type: PrizeType.PHYSICAL, value: 20, probability: 5.0 },
  { id: 'phys_gear', name: '随机运动装备', type: PrizeType.PHYSICAL, value: 55, probability: 5.0 },
  { id: 'phys_shirt', name: '运动T恤/短裤', type: PrizeType.PHYSICAL, value: 100, probability: 2.0, isRare: true },
  { id: 'phys_jacket', name: '运动外套', type: PrizeType.PHYSICAL, value: 180, probability: 1.0, isRare: true },
  { id: 'phys_band', name: '运动手环', type: PrizeType.PHYSICAL, value: 200, probability: 0.5, isRare: true },

  // --- Fragments (0.48%) ---
  { 
    id: 'frag_500', 
    name: '500元红包碎片', 
    type: PrizeType.FRAGMENT, 
    value: 500 / 3, 
    probability: 0.24, 
    fragmentId: 'LEGENDARY_RED_PACKET',
    isRare: true 
  },
  { 
    id: 'frag_free', 
    name: '季度免单碎片', 
    type: PrizeType.FRAGMENT, 
    value: 3500 / 3, 
    probability: 0.24, 
    fragmentId: 'LEGENDARY_FREE_PASS',
    isRare: true 
  },
];

export const FRAGMENT_DEFINITIONS: Record<string, string> = {
  'LEGENDARY_RED_PACKET': '500元超级红包',
  'LEGENDARY_FREE_PASS': '价值3500元季度免单'
};