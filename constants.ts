import { Prize, PrizeType, Rarity } from './types';

// Total Probability Check: 20+20+3.52+2+15+5+3+2+4+1.5+10+5+5+2+1+0.5+0.24+0.24 = 100%

export const PRIZE_POOL: Prize[] = [
  // 1. 纯空奖 (20%)
  { id: 'p_empty', name: '再接再厉', type: PrizeType.EMPTY, value: 0, probability: 20.0, rarity: Rarity.COMMON, description: '差一点点就中了！' },
  
  // 2. 积分返还奖 (25.52%)
  { id: 'p_pt_5', name: '5积分', type: PrizeType.POINT, value: 5, probability: 20.0, rarity: Rarity.COMMON, description: '价值1元' },
  { id: 'p_pt_10', name: '10积分', type: PrizeType.POINT, value: 10, probability: 3.52, rarity: Rarity.COMMON, description: '价值2元' },
  { id: 'p_pt_20', name: '20积分', type: PrizeType.POINT, value: 20, probability: 2.0, rarity: Rarity.UNCOMMON, description: '价值4元' },

  // 3. 现金红包类 (25%)
  { id: 'p_cash_5', name: '5元红包', type: PrizeType.CASH, value: 5, probability: 15.0, rarity: Rarity.UNCOMMON, description: '微信红包' },
  { id: 'p_cash_10', name: '10元红包', type: PrizeType.CASH, value: 10, probability: 5.0, rarity: Rarity.UNCOMMON, description: '微信红包' },
  { id: 'p_cash_20', name: '20元红包', type: PrizeType.CASH, value: 20, probability: 3.0, rarity: Rarity.RARE, description: '微信红包' },
  { id: 'p_cash_100', name: '100元红包', type: PrizeType.CASH, value: 100, probability: 2.0, rarity: Rarity.LEGENDARY, description: '大额红包！' },

  // 4. 课程代金券 (5.5%)
  { id: 'p_vou_50', name: '50元课程券', type: PrizeType.VOUCHER, value: 50, probability: 4.0, rarity: Rarity.UNCOMMON, description: '课程代金券' },
  { id: 'p_vou_200', name: '200元课程券', type: PrizeType.VOUCHER, value: 200, probability: 1.5, rarity: Rarity.RARE, description: '大额课程券' },

  // 5. 实物奖品 (23.5%)
  { id: 'p_item_drink', name: '运动饮料/能量棒', type: PrizeType.PHYSICAL, value: 5, probability: 10.0, rarity: Rarity.COMMON, description: '补充能量' },
  { id: 'p_item_badge', name: '纪念徽章', type: PrizeType.PHYSICAL, value: 20, probability: 5.0, rarity: Rarity.UNCOMMON, description: '限量版' },
  { id: 'p_item_gear', name: '随机运动装备', type: PrizeType.PHYSICAL, value: 55, probability: 5.0, rarity: Rarity.RARE, description: '跳绳/瑜伽垫/哑铃等' },
  { id: 'p_item_cloth', name: '运动T恤/短裤', type: PrizeType.PHYSICAL, value: 100, probability: 2.0, rarity: Rarity.RARE, description: 'EPE定制' },
  { id: 'p_item_coat', name: '运动外套', type: PrizeType.PHYSICAL, value: 180, probability: 1.0, rarity: Rarity.LEGENDARY, description: '高端外套' },
  { id: 'p_item_band', name: '运动手环', type: PrizeType.PHYSICAL, value: 200, probability: 0.5, rarity: Rarity.LEGENDARY, description: '智能监测' },

  // 6. 传说碎片 (0.48%)
  { id: 'p_frag_500', name: '500元红包碎片', type: PrizeType.FRAGMENT, value: 0, probability: 0.24, rarity: Rarity.LEGENDARY, description: '集齐3个兑换500元' },
  { id: 'p_frag_free', name: '季度免单碎片', type: PrizeType.FRAGMENT, value: 0, probability: 0.24, rarity: Rarity.LEGENDARY, description: '集齐3个兑换3500元免单' },
];

export const COST_PER_DRAW = 30; // 30 Points
