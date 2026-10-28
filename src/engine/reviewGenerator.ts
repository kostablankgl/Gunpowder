import { WeaponSlots, DerivedStats, MarketSegment, CustomerReview } from '../types';
import { calculateDerivedStats } from './physics';

export interface ReviewTagMeta {
  id: string;
  label: string;
  tone: 'positive' | 'negative' | 'neutral';
  color: string;
  description: string;
}

export const REVIEW_TAGS_DICTIONARY: Record<string, ReviewTagMeta> = {
  BOLNO: {
    id: 'BOLNO',
    label: 'Сушит плечо / Больно',
    tone: 'negative',
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Огромный импульс отдачи при чересчур малой массе оружия.',
  },
  KLINIT: {
    id: 'KLINIT',
    label: 'Клинит / Задержки',
    tone: 'negative',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Низкая надежность механизмов, частые перекосы и утыкания патронов.',
  },
  BUDGET: {
    id: 'BUDGET',
    label: 'Народная цена',
    tone: 'positive',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Отличное соотношение цены и функционала для простого покупателя.',
  },
  SNIPER_ACCURACY: {
    id: 'SNIPER_ACCURACY',
    label: 'Минутный ствол',
    tone: 'positive',
    color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Выдающаяся кучность sub-MOA, пули ложатся пуля в пулю.',
  },
  GLASS_TRIGGER: {
    id: 'GLASS_TRIGGER',
    label: 'Хрустальный спуск',
    tone: 'positive',
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Четкий, сухой и предсказуемый срыв курка без потяга.',
  },
  HEAVY_AS_BRICK: {
    id: 'HEAVY_AS_BRICK',
    label: 'Тяжелый лом',
    tone: 'negative',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    description: 'Слишком тяжелый образец для ходовой охоты или ношения.',
  },
  COMPACT_CARRY: {
    id: 'COMPACT_CARRY',
    label: 'Удобен под пиджаком',
    tone: 'positive',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Идеальные габариты для скрытого ношения и самообороны.',
  },
  EXPLODED: {
    id: 'EXPLODED',
    label: 'Разрыв патронника!',
    tone: 'negative',
    color: 'bg-red-600/30 text-red-200 border-red-500 font-bold',
    description: 'Смертельно опасный брак: ресивер лопнул от давления!',
  },
  ILLEGAL_AUTO: {
    id: 'ILLEGAL_AUTO',
    label: 'Вне закона (Авто)',
    tone: 'negative',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Стрельба очередями запрещена гражданским кодексом.',
  },
  SOFT_RECOIL: {
    id: 'SOFT_RECOIL',
    label: 'Мягкий как воздух',
    tone: 'positive',
    color: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'Минимальный подброс и демпфер приклада позволяют стрелять в темпе.',
  },
  PREMIUM: {
    id: 'PREMIUM',
    label: 'Премиум-класс',
    tone: 'neutral',
    color: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
    description: 'Высокая стоимость и превосходная отделка для ценителей.',
  },
};

/**
 * Generates technical review tags based on weapon characteristics and segment
 */
export function generateReviewTags(
  gun: WeaponSlots,
  segment: MarketSegment,
  derivedInput?: DerivedStats,
  priceInput?: number
): string[] {
  const derived = derivedInput || calculateDerivedStats(gun, 'classic');
  const price = priceInput !== undefined ? priceInput : derived.unitCost * 1.35;
  const tags: string[] = [];

  // Critical broken check
  if (derived.isBroken) {
    tags.push('EXPLODED');
    tags.push('KLINIT');
    return tags;
  }

  // Illegal full-auto check
  if (gun.trigger.mode === 'auto' || gun.trigger.mode === 'both') {
    tags.push('ILLEGAL_AUTO');
  }

  // 1. Recoil impulse vs Weight: "BOLNO" (painful shoulder kick)
  const impulse = derived.recoilImpulse || 6.5;
  const weight = derived.weaponMass;
  if (impulse > 8.0 && weight < 2.5) {
    tags.push('BOLNO');
  } else if (impulse < 4.2 && derived.muzzleClimb < 3.2) {
    tags.push('SOFT_RECOIL');
  }

  // 2. Reliability: "KLINIT"
  if (derived.reliability < 78) {
    tags.push('KLINIT');
  }

  // 3. Price & Value: "BUDGET" or "PREMIUM"
  if (price < 500 && derived.reliability >= 80) {
    tags.push('BUDGET');
  } else if (price > 1300 && derived.ergonomics >= 75) {
    tags.push('PREMIUM');
  }

  // 4. Accuracy: "SNIPER_ACCURACY"
  if (derived.accuracyMOA <= 1.2) {
    tags.push('SNIPER_ACCURACY');
  }

  // 5. Weight: "HEAVY_AS_BRICK"
  if (weight > 4.2) {
    tags.push('HEAVY_AS_BRICK');
  }

  // 6. Trigger: "GLASS_TRIGGER"
  if (derived.triggerQuality >= 84) {
    tags.push('GLASS_TRIGGER');
  }

  // 7. Compactness: "COMPACT_CARRY"
  if (derived.overallLength <= 240 && weight <= 1.2) {
    tags.push('COMPACT_CARRY');
  }

  return tags;
}

/**
 * Mock function preparing prompt string for Gemini LLM to generate realistic reviews
 */
export function generateReviewText(tags: string[], segment: MarketSegment, gunName: string = 'Образец'): string {
  const segmentNames = {
    hunters: 'Охотник-промысловик с 15-летним стажем (тайга, медведь, лось)',
    sports: 'Стрелок-практик открытого класса IPSC (спортсмен высшей лиги)',
    self_defense: 'Владелец оружия самообороны для защиты дома и семьи',
  };

  const tagsList = tags.map(t => REVIEW_TAGS_DICTIONARY[t]?.label || t).join(', ');

  return `System: Ты — реалистичный покупатель гражданского оружия.
Напиши живой, эмоциональный отзыв об оружии "${gunName}" для оружейного форума.
Профиль покупателя: ${segmentNames[segment]}.
Ключевые факты и впечатления (теги ТТХ): [${tagsList || 'Стандартные характеристики'}].
Тональность: если есть теги "BOLNO" или "KLINIT" — вырази раздражение. Если "SNIPER_ACCURACY" или "BUDGET" — искренний восторг. Без канцеляризмов.`;
}

/**
 * Generates synthetic realistic customer reviews for UI display
 */
export function generateCustomerReviews(
  tags: string[],
  segment: MarketSegment,
  gunName: string = 'Карабин'
): CustomerReview[] {
  const reviews: CustomerReview[] = [];

  if (tags.includes('EXPLODED')) {
    reviews.push({
      id: 'rev-boom-1',
      author: 'Сергей «Калибр»',
      avatar: '💥',
      role: 'Пострадавший владелец',
      rating: 1,
      tags: ['EXPLODED', 'KLINIT'],
      text: `Чуть пальцы не оторвало! На первой же пачке ресивер треснул по шву, патронник раздуло. Давление в гильзе просто разорвало сталь. Срочно отзывайте партию, это опасно для жизни!`,
      date: 'Вчера',
      verifiedPurchase: true,
    });
    return reviews;
  }

  if (tags.includes('ILLEGAL_AUTO')) {
    reviews.push({
      id: 'rev-atf-1',
      author: 'Виктор Михайлович',
      avatar: '⚖️',
      role: 'Оружейный юрист',
      rating: 1,
      tags: ['ILLEGAL_AUTO'],
      text: `В магазине отказались регистрировать в ЛРО! Переводчик на автоогонь делает этот карабин вне закона на гражданском рынке. Поставьте одиночный УСМ, иначе изымут.`,
      date: '2 дня назад',
      verifiedPurchase: true,
    });
    return reviews;
  }

  if (segment === 'hunters') {
    if (tags.includes('BOLNO')) {
      reviews.push({
        id: 'rev-hunt-1',
        author: 'Михалыч (Вологда)',
        avatar: '🧔‍♂️',
        role: 'Промысловик',
        rating: 2,
        tags: ['BOLNO'],
        text: `Оружие лёгкое, но отдача в плечо как копытом лося! После трёх выстрелов по секачу ключица ныла два дня. Без толкового затыльника-демпфера стрелять невозможно.`,
        date: '3 дня назад',
        verifiedPurchase: true,
      });
    }

    if (tags.includes('HEAVY_AS_BRICK')) {
      reviews.push({
        id: 'rev-hunt-2',
        author: 'Алексей Е.',
        avatar: '🌲',
        role: 'Охотник выходного дня',
        rating: 3,
        tags: ['HEAVY_AS_BRICK'],
        text: `Пройти с ним 15 км по бурелому — спина отваливается. Железа не пожалели, надёжный, но баланс вперёд валится. Для засидки пойдёт, для ходовой — тяжеловат.`,
        date: 'Неделю назад',
        verifiedPurchase: true,
      });
    }

    if (tags.includes('SNIPER_ACCURACY')) {
      reviews.push({
        id: 'rev-hunt-3',
        author: 'Олег Смирнов',
        avatar: '🎯',
        role: 'Варминт-охотник',
        rating: 5,
        tags: ['SNIPER_ACCURACY'],
        text: `На 200 метров укладывает серию из 5 пуль в спичечный коробок! Жёсткий ствол не ведёт даже после пяти выстрелов подряд. Очень доволен точностью.`,
        date: '4 дня назад',
        verifiedPurchase: true,
      });
    }

    if (reviews.length === 0) {
      reviews.push({
        id: 'rev-hunt-def',
        author: 'Дмитрий В.',
        avatar: '🏕️',
        role: 'Охотник',
        rating: 4,
        tags: tags.slice(0, 2),
        text: `Добротное рабочее ружье. Собрано крепко, прикладистое. Патроны кушает любые, за свои деньги в хозяйстве точно пригодится.`,
        date: '5 дней назад',
        verifiedPurchase: true,
      });
    }
  } else if (segment === 'sports') {
    if (tags.includes('GLASS_TRIGGER')) {
      reviews.push({
        id: 'rev-sport-1',
        author: 'Максим «Flash»',
        avatar: '⚡',
        role: 'Мастер спорта IPSC',
        rating: 5,
        tags: ['GLASS_TRIGGER', 'SNIPER_ACCURACY'],
        text: `Спуск просто сказка — короткий, сухой как щелчок стеклянной палочки! Сплиты получаются 0.14 секунды без увода с мишени. В своей категории это топ.`,
        date: 'Вчера',
        verifiedPurchase: true,
      });
    }

    if (tags.includes('KLINIT')) {
      reviews.push({
        id: 'rev-sport-2',
        author: 'Артем Г.',
        avatar: '⏱️',
        role: 'Стрелок-практик',
        rating: 2,
        tags: ['KLINIT'],
        text: `На втором упражнении словил клин гильзы в патроннике и слил весь матч! Механика сырая, грязь и пыль вообще не переваривает. Требуется доводка.`,
        date: '3 дня назад',
        verifiedPurchase: true,
      });
    }

    if (reviews.length === 0) {
      reviews.push({
        id: 'rev-sport-def',
        author: 'Роман К.',
        avatar: '🏆',
        role: 'Практическая стрельба',
        rating: 4,
        tags: tags.slice(0, 2),
        text: `Хорошая база для тюнинга. Оптика садится ровно, баланс удобный для быстрой вскидки. Рекомендую для клубных соревнований.`,
        date: '2 дня назад',
        verifiedPurchase: true,
      });
    }
  } else {
    // self_defense
    if (tags.includes('COMPACT_CARRY')) {
      reviews.push({
        id: 'rev-sd-1',
        author: 'Евгений Т.',
        avatar: '🧥',
        role: 'Гражданский владелец',
        rating: 5,
        tags: ['COMPACT_CARRY', 'BUDGET'],
        text: `В поясной кобуре незаметен даже под лёгкой рубашкой. Достаётся моментально, ни за что не цепляется. Именно то, что нужно для спокойствия семьи.`,
        date: 'Вчера',
        verifiedPurchase: true,
      });
    }

    if (tags.includes('BUDGET')) {
      reviews.push({
        id: 'rev-sd-2',
        author: 'Николай П.',
        avatar: '🛡️',
        role: 'Охранник',
        rating: 5,
        tags: ['BUDGET'],
        text: `Купил по разумной цене без переплаты за раскрученный бренд. Отстрелял две сотни патронов в тире — ни единого сбоя.`,
        date: '6 дней назад',
        verifiedPurchase: true,
      });
    }

    if (reviews.length === 0) {
      reviews.push({
        id: 'rev-sd-def',
        author: 'Константин',
        avatar: '🏠',
        role: 'Защита дома',
        rating: 4,
        tags: tags.slice(0, 2),
        text: `Удобный хват, интуитивный предохранитель. Жена тоже попробовала в тире — отдачу контролирует спокойно. Рекомендую.`,
        date: '4 дня назад',
        verifiedPurchase: true,
      });
    }
  }

  return reviews;
}
