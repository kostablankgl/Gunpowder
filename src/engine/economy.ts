import { WeaponSlots, DerivedStats, MarketSegment, MarketAnalysis } from '../types';
import { calculateDerivedStats } from './physics';
import { generateReviewTags } from './reviewGenerator';

export interface SegmentProfile {
  id: MarketSegment;
  name: string;
  description: string;
  targetPrice: number; // reference acceptable price ©
  maxPrice: number;
  weightMin: number; // optimal min kg
  weightMax: number; // optimal max kg
  minEnergy: number; // min muzzle Joules desired
  maxMOA: number; // maximum acceptable dispersion MOA
  preferCompact: boolean;
  recoilTolerance: number; // acceptable recoil impulse N·s
}

export const SEGMENT_PROFILES: Record<MarketSegment, SegmentProfile> = {
  hunters: {
    id: 'hunters',
    name: 'Промысловые охотники и любители',
    description: 'Ценят малый вес для длительных пеших переходов, высокую убойную силу (энергию) и классическую надежность. Автоогонь строго запрещен.',
    targetPrice: 650,
    maxPrice: 1600,
    weightMin: 2.7,
    weightMax: 3.5,
    minEnergy: 1600,
    maxMOA: 2.8,
    preferCompact: false,
    recoilTolerance: 10.5,
  },
  sports: {
    id: 'sports',
    name: 'Спортивная стрельба и IPSC',
    description: 'Одержимы минутной кучностью (sub-MOA), сухим спортивным спуском, минимальным подбросом ствола для быстрого сплита и планками для оптики. Готовы платить высокую цену.',
    targetPrice: 1200,
    maxPrice: 3200,
    weightMin: 3.2,
    weightMax: 4.8,
    minEnergy: 400,
    maxMOA: 1.5,
    preferCompact: false,
    recoilTolerance: 6.0,
  },
  self_defense: {
    id: 'self_defense',
    name: 'Гражданская самооборона и скрытое ношение',
    description: 'Требуют сверхкомпактные габариты (< 220–250 мм), абсолютную безотказность, доступную народную цену и мягкую отдачу при стрельбе одной рукой.',
    targetPrice: 350,
    maxPrice: 900,
    weightMin: 0.6,
    weightMax: 1.4,
    minEnergy: 250,
    maxMOA: 6.0,
    preferCompact: true,
    recoilTolerance: 4.8,
  },
};

/**
 * Calculates demand score (0-100), monthly sales, profitability and tags
 * for a weapon in a specific civilian market segment.
 *
 * Rules:
 * 1. Automatic fire is strictly forbidden: if fireMode === 'auto' or 'both', demand = 0.
 * 2. Overpressured / broken weapons cannot be sold (demand = 0).
 * 3. Hunters: love low weight & high power.
 * 4. Sports: love sub-MOA accuracy, crisp trigger, low climb.
 * 5. Self-Defense: love compact length (< 250mm) and affordable price.
 */
export function calculateDemand(
  gun: WeaponSlots,
  segment: MarketSegment,
  price: number,
  marketingBudget: number = 0,
  precalculatedStats?: DerivedStats
): MarketAnalysis {
  const derived = precalculatedStats || calculateDerivedStats(gun, 'classic');
  const profile = SEGMENT_PROFILES[segment];
  const unitCost = derived.unitCost;
  const unitPrice = Math.max(1, price);
  const unitMargin = Number((unitPrice - unitCost).toFixed(1));

  // RULE 1: Automatic fire is illegal for civilians
  const fireMode = gun.trigger.mode;
  if (fireMode === 'auto' || fireMode === 'both') {
    return {
      segment,
      demandScore: 0,
      monthlySales: 0,
      unitPrice,
      unitCost,
      unitMargin,
      monthlyRevenue: 0,
      monthlyProfit: -marketingBudget,
      satisfactionRating: 1.0,
      verdict: 'Запрещено законодательством: полностью автоматический огонь или переводчик на очередь нелегален для гражданского рынка!',
      reviewTags: ['ILLEGAL_AUTO'],
      isForbidden: true,
      forbiddenReason: 'Оборот автоматического оружия среди гражданского населения запрещен законом. Требуется одиночный УСМ (Single).',
    };
  }

  // Broken / burst chamber check
  if (derived.isBroken) {
    return {
      segment,
      demandScore: 0,
      monthlySales: 0,
      unitPrice,
      unitCost,
      unitMargin,
      monthlyRevenue: 0,
      monthlyProfit: -marketingBudget,
      satisfactionRating: 1.0,
      verdict: 'Опасный брак: патронник не выдерживает давления, оружие взрывается при выстреле!',
      reviewTags: ['EXPLODED', 'KLINIT'],
      isForbidden: true,
      forbiddenReason: derived.breakageReason || 'Оружие разрывает при выстреле из-за превышения давления пороховых газов.',
    };
  }

  // Base score
  let score = 50;

  // Segment Specific Calculations
  if (segment === 'hunters') {
    // 1. Weight: Hunters hate heavy weapons (> 3.5 kg)
    if (derived.weaponMass <= 3.2) {
      score += 18;
    } else if (derived.weaponMass <= 3.6) {
      score += 8;
    } else {
      score -= (derived.weaponMass - 3.6) * 22; // heavy penalty for brick
    }

    // 2. Power: Need high muzzle energy (Rifle / heavy intermediate)
    if (derived.energy >= 2500) {
      score += 22;
    } else if (derived.energy >= 1800) {
      score += 14;
    } else if (derived.energy < 900) {
      score -= 35; // Too weak for game hunting
    }

    // 3. Accuracy: Hunters need MOA <= 2.5
    if (derived.accuracyMOA <= 1.8) score += 10;
    else if (derived.accuracyMOA > 3.5) score -= 18;

    // 4. Ergonomics & Reliability
    if (derived.reliability >= 90) score += 10;
    if (gun.stock.type === 'fixedWood' || gun.stock.type === 'polymer') score += 6;
  } else if (segment === 'sports') {
    // 1. Accuracy: Sports shooters want sub-MOA precision
    if (derived.accuracyMOA <= 1.0) {
      score += 32;
    } else if (derived.accuracyMOA <= 1.6) {
      score += 20;
    } else if (derived.accuracyMOA > 2.8) {
      score -= 30; // Unacceptable for sport matches
    }

    // 2. Trigger Quality: Must have crisp match trigger
    if (derived.triggerQuality >= 85) score += 16;
    else if (derived.triggerQuality < 65) score -= 18;

    // 3. Recoil climb: Needs rapid double-tap speed
    if (derived.muzzleClimb <= 3.0) score += 14;
    else if (derived.muzzleClimb > 7.0) score -= 16;

    // 4. Modern rails for optics
    if (gun.topInterface.type === 'picatinny' || gun.topInterface.type === 'weaver') score += 10;
    if (gun.handguard.lowerInterface === 'mlok' || gun.handguard.lowerInterface === 'picatinny') score += 6;
  } else if (segment === 'self_defense') {
    // 1. Compactness: must be short (pistol format < 250mm)
    if (derived.overallLength <= 230) {
      score += 35;
    } else if (derived.overallLength <= 320) {
      score += 15;
    } else {
      score -= Math.min(50, (derived.overallLength - 320) * 0.12); // Long carbines are hard to carry concealed
    }

    // 2. Weight: Should be light for holster carry (< 1.2 kg)
    if (derived.weaponMass <= 1.1) score += 18;
    else if (derived.weaponMass > 2.0) score -= 22;

    // 3. Reliability: Must not jam in critical emergency
    if (derived.reliability >= 95) score += 18;
    else if (derived.reliability < 80) score -= 30;

    // 4. Controllable felt recoil
    if (derived.muzzleClimb <= 4.5) score += 8;
    else if (derived.muzzleClimb > 8.0) score -= 18;
  }

  // Price Elasticity
  const priceRatio = unitPrice / profile.targetPrice;
  if (priceRatio < 0.8) {
    score += Math.min(20, (0.8 - priceRatio) * 35); // Bargain bonus
  } else if (priceRatio > 1.0) {
    score -= Math.min(45, (priceRatio - 1.0) * 40); // Price resistance
  }

  // Marketing boost
  const marketingMult = 1 + Math.min(0.35, Math.log10(1 + Math.max(0, marketingBudget) / 100) * 0.18);

  const demandScore = Math.min(100, Math.max(0, Math.round(score)));

  // Monthly Sales Volume (units)
  // Base volume by segment
  const segmentBaseCap = {
    hunters: 450,
    sports: 300,
    self_defense: 950,
  }[segment];

  const salesFactor = (demandScore / 100) * (demandScore / 100);
  const monthlySales = Math.round(segmentBaseCap * salesFactor * marketingMult * (unitPrice > profile.maxPrice ? 0.3 : 1.0));

  const monthlyRevenue = Math.round(monthlySales * unitPrice);
  const monthlyProfit = Math.round(monthlySales * unitMargin - marketingBudget);

  // Customer satisfaction rating (1.0 - 5.0)
  let stars = 2.5 + (demandScore / 100) * 2.3;
  if (derived.reliability < 75) stars -= 1.0;
  if (unitPrice > profile.targetPrice * 1.5) stars -= 0.6;
  const satisfactionRating = Number(Math.min(5.0, Math.max(1.0, stars)).toFixed(1));

  // Generate tags
  const reviewTags = generateReviewTags(gun, segment, derived, unitPrice);

  let verdict = 'Умеренный интерес среди покупателей.';
  if (demandScore >= 80) {
    verdict = 'Бестселлер! Оружейные магазины формируют очереди за предварительным заказом.';
  } else if (demandScore >= 60) {
    verdict = 'Хороший коммерческий успех. Оружие уверенно занимает свою нишу.';
  } else if (demandScore >= 35) {
    verdict = 'Посредственные продажи. Покупатели жалуются на цену или несоответствие ТТХ.';
  } else {
    verdict = 'Провал продаж. Модель не подходит под нужды данного сегмента.';
  }

  return {
    segment,
    demandScore,
    monthlySales,
    unitPrice,
    unitCost,
    unitMargin,
    monthlyRevenue,
    monthlyProfit,
    satisfactionRating,
    verdict,
    reviewTags,
    isForbidden: false,
  };
}
