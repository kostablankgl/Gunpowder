import {
  WeaponSlots,
  DerivedStats,
  ValidationIssue,
  TechnicalSpecification,
  ContestResult,
  CompetitorDesign,
  WeaponLayout,
  CountryId,
  CartridgeClass,
  Ammo,
  Chambering,
  RecoilAnalysis,
} from '../types';

export function cartridgeToAmmo(cartridge: WeaponSlots['cartridge']): Ammo {
  let powderLoad = 1.6;
  if (cartridge.class === 'pistol') {
    powderLoad = Number((0.25 + cartridge.caseLength * 0.012).toFixed(2));
  } else if (cartridge.class === 'intermediate') {
    powderLoad = Number((0.85 + cartridge.caseLength * 0.02).toFixed(2));
  } else {
    powderLoad = Number((1.5 + cartridge.caseLength * 0.028).toFixed(2));
  }

  return {
    id: cartridge.id,
    name: cartridge.name,
    caliber: cartridge.bulletDiameter,
    caseLength: cartridge.caseLength,
    powderLoad,
    pressure: cartridge.maxPressure,
    bulletMass: cartridge.bulletMass,
    class: cartridge.class,
    cost: cartridge.cost,
  };
}

export function createChambering(
  barrel: WeaponSlots['barrel'],
  receiver: WeaponSlots['receiver'],
  cartridge: WeaponSlots['cartridge']
): Chambering {
  const matMultiplier = barrel.material === 'composite' ? 1.15 : barrel.material === 'stainless' ? 1.08 : 1.0;
  const chamberPressureLimit = Math.round(receiver.strength * matMultiplier);
  return {
    id: `chamber-${cartridge.id}`,
    name: `Патронник ${cartridge.name}`,
    caliber: cartridge.bulletDiameter,
    caseLength: cartridge.caseLength,
    chamberPressureLimit,
  };
}

export function calculateBarrelRigidity(barrel: WeaponSlots['barrel']): number {
  const profileBase = { light: 40, medium: 72, heavy: 96 }[barrel.profile];
  const matFactor = { steel: 1.0, stainless: 1.06, composite: 1.25 }[barrel.material];
  // Rigidity drops sharply with length (400mm is reference length)
  const lengthRatio = barrel.length / 400;
  const lengthPenalty = Math.max(0, (lengthRatio - 1.0) * 42);
  const rigidity = Math.round(profileBase * matFactor - lengthPenalty);
  return Math.min(100, Math.max(10, rigidity));
}

export function calculateRecoil(slots: WeaponSlots, customAmmo?: Ammo): RecoilAnalysis {
  const ammo = customAmmo || cartridgeToAmmo(slots.cartridge);
  const { barrel, stock, muzzleDevice, receiver } = slots;

  const lengthRatio = Math.min(1.25, barrel.length / (slots.cartridge.lRef || 415));
  const v0 = Math.round((slots.cartridge.vRef || 700) * (0.55 + 0.45 * Math.min(1.0, lengthRatio)));
  const vGas = ammo.class === 'pistol' ? 1200 : ammo.class === 'intermediate' ? 1350 : 1500;

  // Recoil impulse I = (m_bullet * v0 + m_powder * vGas) / 1000 (N·s)
  const rawImpulse = (ammo.bulletMass * v0 + ammo.powderLoad * vGas) / 1000;
  const brakeCoeff = 1 - (muzzleDevice.recoilReduction / 100) * 0.65;
  const recoilImpulse = Number((rawImpulse * brakeCoeff).toFixed(2));

  const isPistol = (stock.type === 'none' || barrel.length <= 160) && slots.cartridge.class === 'pistol';
  const barrelMass = calculateBarrelMass(barrel.length, barrel.profile, barrel.material, slots.cartridge.bulletDiameter);
  const receiverMass = calculateReceiverMass(receiver, isPistol);
  const stockMass = calculateStockMass(stock);
  const hgMass = calculateHandguardMass(slots.handguard);
  const approxWeaponMass = Number((barrelMass + receiverMass + stockMass + hgMass + 0.7).toFixed(2));

  let climbFactor = 1.0;
  if (stock.type === 'none') climbFactor = 2.6; // No shoulder contact -> heavy muzzle rise
  else if (stock.type === 'fixedWood') climbFactor = 1.3; // Drop comb axis
  else if (stock.type === 'folding') climbFactor = 1.15;
  else if (stock.type === 'telescopic' || stock.type === 'polymer') climbFactor = 0.95; // Straight bore axis

  let compDamping = 1.0;
  if (muzzleDevice.type === 'compensator') compDamping = 0.48; // Cuts climb in half
  else if (muzzleDevice.type === 'suppressor') compDamping = 0.68;
  else if (muzzleDevice.type === 'flashHider') compDamping = 0.88;

  const frontBias = Math.max(0.65, 1.3 - (barrelMass / Math.max(1, approxWeaponMass)) * 0.7);

  const muzzleClimb = Number(
    Math.min(15, Math.max(0.5, (recoilImpulse / Math.max(0.8, approxWeaponMass)) * climbFactor * compDamping * frontBias * 2.2)).toFixed(1)
  );

  const feltRecoil = Number(((recoilImpulse / Math.max(0.7, approxWeaponMass)) * (stock.recoilDamper ? 0.82 : 1.0)).toFixed(1));

  return {
    recoilImpulse,
    muzzleClimb,
    feltRecoil,
  };
}

export function calculateBarrelMass(
  lengthMm: number,
  profile: 'light' | 'medium' | 'heavy',
  material: 'steel' | 'stainless' | 'composite',
  bulletDiameter: number
): number {
  const profileCoeffs = { light: 0.85, medium: 1.2, heavy: 1.65 };
  const matCoeffs = { steel: 1.0, stainless: 1.05, composite: 0.68 };
  
  const base = profileCoeffs[profile] * (lengthMm / 500) * (0.8 + 0.04 * (bulletDiameter - 7.62));
  return Number((base * matCoeffs[material]).toFixed(2));
}

export function calculateBarrelCost(
  lengthMm: number,
  profile: 'light' | 'medium' | 'heavy',
  material: 'steel' | 'stainless' | 'composite'
): number {
  const kMat = { steel: 1.0, stainless: 1.45, composite: 2.2 };
  const heavyExtra = profile === 'heavy' ? 1.35 : profile === 'medium' ? 1.1 : 1.0;
  return Number(((kMat[material] * (lengthMm / 100) * 1.2) * heavyExtra).toFixed(1));
}

export function calculateReceiverMass(receiver: WeaponSlots['receiver'], isCompact: boolean = false): number {
  const methodMult = {
    milled: 1.3,
    stamped: 0.8,
    cast: 1.1,
    polymerMolded: 0.5,
  };
  const sizeFactor = isCompact ? 0.55 : 1.0;
  return Number((receiver.mass * methodMult[receiver.method] * sizeFactor).toFixed(2));
}

export function calculateReceiverCost(
  receiver: WeaponSlots['receiver'],
  country: CountryId = 'USSR'
): number {
  let cost = receiver.cost;
  if (country === 'USSR') {
    if (receiver.method === 'stamped') cost *= 0.8;
    if (receiver.method === 'milled') cost *= 1.1;
  }
  return Number(cost.toFixed(1));
}

export function calculateEmptyMagazineMass(magazine: WeaponSlots['magazine']): number {
  if (!magazine) return 0.25;
  const isPolymer = magazine.material === 'polymer';
  if (magazine.type === 'drum') {
    return isPolymer ? 0.42 : 0.65;
  }
  if (magazine.type === 'tube') {
    return 0.12;
  }
  // Standard box magazine
  const cap = magazine.capacity || 30;
  if (cap <= 10) return isPolymer ? 0.08 : 0.14;
  if (cap <= 20) return isPolymer ? 0.12 : 0.20;
  if (cap <= 35) return isPolymer ? 0.16 : 0.26;
  return isPolymer ? 0.22 : 0.34;
}

export function calculateAmmoMass(magazine: WeaponSlots['magazine'], cartridge: WeaponSlots['cartridge']): number {
  if (!magazine || !cartridge) return 0;
  const caseAndPowder = cartridge.class === 'pistol' ? 6.5 : cartridge.class === 'intermediate' ? 9.5 : 14.0;
  const singleRoundKg = (cartridge.bulletMass + caseAndPowder) / 1000;
  return Number((magazine.capacity * singleRoundKg).toFixed(2));
}

export function calculateMagazineMass(magazine: WeaponSlots['magazine'], cartridge: WeaponSlots['cartridge']): number {
  return Number((calculateEmptyMagazineMass(magazine) + calculateAmmoMass(magazine, cartridge)).toFixed(2));
}

export function calculateStockMass(stock: WeaponSlots['stock']): number {
  if (!stock || stock.type === 'none') return 0;
  const masses = {
    fixedWood: 0.58,
    folding: 0.28,
    telescopic: 0.38,
    polymer: 0.34,
    none: 0,
  };
  const extra = stock.recoilDamper ? 0.08 : 0;
  return Number((masses[stock.type] + extra).toFixed(2));
}

export function calculateHandguardMass(handguard: WeaponSlots['handguard']): number {
  if (!handguard || handguard.material === 'none' || handguard.length === 0) return 0;
  const masses = {
    wood: 0.26,
    aluminum: 0.30,
    polymer: 0.18,
    none: 0,
  };
  return masses[handguard.material] || 0.20;
}

export interface CartridgeClassLimits {
  maxBulletMass: number; // grams
  maxVelocity: number; // m/s
  maxEnergy: number; // Joules
  maxPressure: number; // bar
  maxCaseLength: number; // mm
  recoilCoeff: number; // 0.05 | 0.09 | 0.12
}

export const CARTRIDGE_LIMITS: Record<CartridgeClass, CartridgeClassLimits> = {
  pistol: {
    maxBulletMass: 10.5,
    maxVelocity: 500,
    maxEnergy: 750,
    maxPressure: 2600,
    maxCaseLength: 30,
    recoilCoeff: 0.05,
  },
  intermediate: {
    maxBulletMass: 10.5,
    maxVelocity: 940,
    maxEnergy: 2100,
    maxPressure: 3850,
    maxCaseLength: 46,
    recoilCoeff: 0.09,
  },
  rifle: {
    maxBulletMass: 14.5,
    maxVelocity: 960,
    maxEnergy: 4200,
    maxPressure: 4400,
    maxCaseLength: 68,
    recoilCoeff: 0.12,
  },
};

export function calculateDerivedStats(
  slots: WeaponSlots,
  layout: WeaponLayout,
  country: CountryId = 'USSR',
  batchSize: number = 20000,
  climate: 'normal' | 'dust' | 'frost' | 'mud' = 'normal'
): DerivedStats {
  const {
    cartridge,
    barrel,
    action,
    receiver,
    magazine,
    trigger,
    stock,
    topInterface,
    handguard,
    muzzleDevice,
    topAttachment,
    lowerAttachment,
  } = slots;

  const limits = CARTRIDGE_LIMITS[cartridge.class];

  // 8.1 Bullet Velocity with class upper limit Math.min()
  const lengthRatio = Math.min(1.25, barrel.length / cartridge.lRef);
  const rawVelocity = Math.round(cartridge.vRef * (0.55 + 0.45 * Math.min(1.0, lengthRatio)));
  const velocity = Math.min(limits.maxVelocity, rawVelocity);

  // 8.2 Muzzle Energy (Joules) capped strictly by class limits
  const rawEnergy = Math.round(0.5 * (cartridge.bulletMass / 1000) * velocity * velocity);
  const energy = Math.min(limits.maxEnergy, rawEnergy);

  // 8.3 Flatness (0 - 100)
  const flatnessRaw = 50 + (velocity - 400) * 0.08 - (cartridge.bulletMass - 7) * 2.0;
  const flatness = Math.min(100, Math.max(0, Math.round(flatnessRaw)));

  // 8.4 Optimal Twist & Twist Penalty (MOA) - Calibrated to realistic rifling
  const optimalTwist = Math.round(
    (30 * (cartridge.bulletDiameter * cartridge.bulletDiameter)) / cartridge.bulletMass
  );
  const twistDiff = Math.abs(barrel.twist - optimalTwist);
  const twistPenalty = (twistDiff / Math.max(50, optimalTwist)) * 14.0;

  // Detect compact pistol configuration
  const isPistol = (stock.type === 'none' || barrel.length <= 160) && cartridge.class === 'pistol';

  // Masses
  const barrelMass = calculateBarrelMass(barrel.length, barrel.profile, barrel.material, cartridge.bulletDiameter);
  const receiverMass = calculateReceiverMass(receiver, isPistol);
  const emptyMagMass = calculateEmptyMagazineMass(magazine);
  const ammoMass = calculateAmmoMass(magazine, cartridge);
  const stockMass = calculateStockMass(stock);
  const hgMass = calculateHandguardMass(handguard);
  const topOpticMass = topAttachment ? topAttachment.mass : 0;
  const lowerOpticMass = lowerAttachment ? lowerAttachment.mass : 0;
  const actionMass = isPistol
    ? Math.max(0.18, Number((action.boltMass * 0.52).toFixed(2)))
    : action.boltMass + (action.requiresGasTube ? 0.25 : 0.05);

  // Standard military & GOST dry weapon weight with empty magazine (tested against ТЗ)
  const weaponMass = Number(
    (
      barrelMass +
      receiverMass +
      emptyMagMass +
      stockMass +
      hgMass +
      topInterface.mass +
      muzzleDevice.mass +
      topOpticMass +
      lowerOpticMass +
      actionMass +
      (isPistol ? 0.08 : 0.12) // trigger mechanism, pins and springs
    ).toFixed(2)
  );

  // Loaded mass (снаряженная масса с полным боекомплектом в магазине)
  const loadedMass = Number((weaponMass + ammoMass).toFixed(2));

  // 8.5 Recoil Formula with Class-Dependent Coeff (pistol: 0.05, intermediate: 0.09, rifle: 0.12)
  const recoilCoeff = limits.recoilCoeff;
  const muzzleReduction = muzzleDevice.recoilReduction / 100;
  const stockDamperMod = stock.recoilDamper ? 0.85 : 1.0;
  const noStockPenalty = stock.type === 'none' ? 1.35 : 1.0; // Two-handed grip without shoulder stock kicks harder
  const recoilEnergy = Math.round(energy * (1 - muzzleReduction) * stockDamperMod * recoilCoeff);
  const feltRecoil = Number(((recoilEnergy * noStockPenalty) / Math.max(0.7, weaponMass)).toFixed(1));

  // 8.7 Unit Cost
  const barrelCost = calculateBarrelCost(barrel.length, barrel.profile, barrel.material);
  const receiverCost = calculateReceiverCost(receiver, country) * (isPistol ? 0.65 : 1.0);
  const magCost = magazine.capacity > 30 ? 4.5 : 2.5;
  const stockCost = stock.type === 'none' ? 0 : stock.recoilDamper ? 6.0 : 3.5;
  const hgCost = handguard.material === 'none' ? 0 : handguard.lowerInterface !== 'none' ? 6.5 : 2.5;
  const topAttCost = topAttachment ? topAttachment.cost : 0;
  const lowerAttCost = lowerAttachment ? lowerAttachment.cost : 0;

  const sumNodesCost =
    cartridge.cost +
    barrelCost +
    receiverCost +
    action.cost +
    magCost +
    trigger.cost +
    stockCost +
    topInterface.cost +
    hgCost +
    muzzleDevice.cost +
    topAttCost +
    lowerAttCost;

  const methodFactors = { milled: 6, stamped: 1, cast: 2, polymerMolded: 1.5 };
  const methodFactor = methodFactors[receiver.method];
  const productionMarkup = sumNodesCost * (methodFactor - 1) * (1 / Math.max(1000, batchSize)) * 100;
  const unitCost = Number((sumNodesCost + productionMarkup).toFixed(1));

  // Ammo and Chambering integrity check
  const ammo = cartridgeToAmmo(cartridge);
  const chambering = createChambering(barrel, receiver, cartridge);
  const isBroken = ammo.pressure > chambering.chamberPressureLimit || ammo.pressure > receiver.strength;
  const breakageReason = isBroken
    ? `Разрыв ствола и патронника: пиковое давление газов (${ammo.pressure} бар) превысило предел прочности узла запирания (${Math.min(chambering.chamberPressureLimit, receiver.strength)} бар)!`
    : undefined;

  // 8.8 Reliability
  let climatePenalty = 0;
  if (climate === 'dust') climatePenalty = 14;
  else if (climate === 'mud') climatePenalty = 16;
  else if (climate === 'frost') climatePenalty = 10;

  // Gas regulation or manual action mitigates climate
  if (action.gasAdjustable) {
    climatePenalty = Math.max(0, climatePenalty - 8);
  }
  if (action.type === 'manual') {
    climatePenalty = Math.max(0, climatePenalty - 10);
  }

  let rel = action.reliabilityBase;
  if (magazine.type === 'drum') rel -= 6;
  if (magazine.type === 'tube') rel -= 3;
  if (barrel.length < 250 && action.type === 'gas') rel -= 8;
  
  if (isBroken) {
    rel = 0;
  }

  if (!action.gasAdjustable && action.type === 'gas') rel -= 4;
  if (action.type === 'manual') rel += 6;
  rel -= climatePenalty;
  const reliability = isBroken ? 0 : Math.min(100, Math.max(5, Math.round(rel)));

  // 8.10 Trigger Quality: Heavy Penalty for Bullpup (long flex link rod)
  const isBullpupPenaltyApplied = layout === 'bullpup';
  const bullpupTriggerPenalty = isBullpupPenaltyApplied ? 25 : 0;
  const kPull = isBullpupPenaltyApplied ? 0.35 : 0.15;
  const triggerQuality = Math.min(
    100,
    Math.max(
      10,
      Math.round(
        100 - trigger.pullLength * kPull - (trigger.type === 'twoStage' ? 2 : 8) - bullpupTriggerPenalty
      )
    )
  );

  // 8.11 Accuracy (MOA) and Barrel Rigidity
  // Rigidity index: thin/long barrel flexes and loses accuracy under heat & vibration
  const barrelRigidity = calculateBarrelRigidity(barrel);
  let rigidityMOAPenalty = 0;
  if (barrelRigidity < 70) {
    rigidityMOAPenalty = Number((((70 - barrelRigidity) / 70) * 2.6).toFixed(2));
  }

  const baseMOAByAction = {
    manual: 1.4,
    gas: 2.8,
    delayedBlowback: 3.2,
    recoil: 3.8,
    blowback: 4.8,
  };
  let accuracy = baseMOAByAction[action.type] + twistPenalty + rigidityMOAPenalty;
  accuracy += (100 - triggerQuality) * 0.025;

  if (barrel.profile === 'light') accuracy += 1.8;
  if (barrel.profile === 'medium') accuracy += 0.4;
  if (barrel.length < 300) accuracy += 1.2;

  // Attachments bonuses and penalties
  if (topAttachment) {
    accuracy += topAttachment.accuracyBonus;
    // Check recoil rating penalty
    if (topInterface.recoilCapacity < topAttachment.requiredRecoilCapacity) {
      accuracy += 3.5; // Loses zero!
    }
  }
  if (lowerAttachment) {
    accuracy += lowerAttachment.accuracyBonus;
  }

  // Shooting handheld without shoulder stock increases dispersion
  if (stock.type === 'none') {
    accuracy += 1.5;
  }

  // Dovetail with rifle cartridge loses zero
  if (
    (topInterface.type === 'dovetail11' || topInterface.type === 'dovetail38') &&
    cartridge.class === 'rifle' &&
    topAttachment
  ) {
    accuracy += 3.0;
  }

  const accuracyMOA = Number(Math.max(0.6, accuracy).toFixed(2));

  // 8.12 Ergonomics
  let ergo = 68;
  if (stock.type === 'fixedWood' || stock.type === 'telescopic') ergo += 8;
  if (stock.type === 'folding') ergo += 4;
  if (stock.type === 'none') ergo += 14; // Light, compact, rapid point-and-shoot
  if (weaponMass > 3.8) ergo -= (weaponMass - 3.8) * 8.0;
  if (weaponMass < 1.2) ergo += 6; // Ultra-light handy weapon
  if (topInterface.height > 10) ergo -= (topInterface.height - 10) * 1.2;
  if (layout === 'bullpup') ergo -= 15; // Bullpup ergonomics penalty
  if (triggerQuality > 75) ergo += 4;

  if (topAttachment) ergo += topAttachment.ergonomicsBonus;
  if (lowerAttachment) ergo += lowerAttachment.ergonomicsBonus;

  const ergonomics = Math.min(100, Math.max(15, Math.round(ergo)));
  const leftHandedFriendly = layout !== 'bullpup';

  // 8.13 Standardization
  let stand = topInterface.standardization;
  if (handguard.lowerInterface === 'picatinny') stand = Math.min(100, stand + 15);
  else if (handguard.lowerInterface === 'mlok') stand = Math.min(100, stand + 10);
  const standardization = Math.round(stand);

  // 8.14 Manufacturability
  let manuf = 100;
  if (receiver.method === 'milled') manuf -= 35;
  if (receiver.method === 'cast') manuf -= 15;
  if (receiver.method === 'stamped') manuf += 12;
  if (receiver.material === 'polymer') manuf += 8;
  const manufacturability = Math.min(100, Math.max(20, Math.round(manuf)));

  // Cyclic rate
  const cyclicRate = action.type === 'manual' ? 25 : action.cyclicRate;

  // Overall Length
  const stockLen = stock.type === 'none' ? 0 : stock.length;
  const barrelLen = barrel.length;
  const receiverExtra = isPistol ? 55 : 150;
  const overallLength = layout === 'bullpup' 
    ? Math.round(barrelLen + 180 + (muzzleDevice.type !== 'none' ? 40 : 0))
    : Math.round(barrelLen + stockLen + receiverExtra + (muzzleDevice.type !== 'none' ? 50 : 0));

  // Recoil breakdown (Impulse N·s and Muzzle Climb degrees)
  const recoilAnalysis = calculateRecoil(slots, ammo);

  return {
    velocity,
    energy,
    flatness,
    weaponMass,
    unitCost,
    reliability,
    accuracyMOA,
    ergonomics,
    standardization,
    manufacturability,
    cyclicRate,
    feltRecoil: recoilAnalysis.feltRecoil,
    recoilEnergy,
    recoilImpulse: recoilAnalysis.recoilImpulse,
    muzzleClimb: recoilAnalysis.muzzleClimb,
    isBroken,
    breakageReason,
    barrelRigidity,
    leftHandedFriendly,
    triggerQuality,
    optimalTwist,
    overallLength,
    recoilCoeff,
    isBullpupPenaltyApplied,
    loadedMass,
    massBreakdown: {
      barrel: barrelMass,
      receiver: receiverMass,
      magazine: emptyMagMass,
      stock: stockMass,
      action: actionMass,
      handguard: hgMass,
      attachments: Number((topInterface.mass + muzzleDevice.mass + topOpticMass + lowerOpticMass).toFixed(2)),
      ammo: ammoMass,
      other: 0.12,
    },
    costBreakdown: {
      nodesSum: Number(sumNodesCost.toFixed(1)),
      productionMarkup: Number(productionMarkup.toFixed(1)),
    },
  };
}

export function validateWeapon(
  slots: WeaponSlots,
  currentYear: number,
  unlockedTechs: string[],
  layout?: WeaponLayout
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { cartridge, barrel, action, receiver, trigger, topInterface, handguard, muzzleDevice, topAttachment, lowerAttachment } = slots;

  // 9.1 Blowback + Intermediate/Rifle
  if (action.type === 'blowback' && (cartridge.class === 'intermediate' || cartridge.class === 'rifle')) {
    issues.push({
      type: 'error',
      code: 'BLOWBACK_HEAVY_CARTRIDGE',
      title: 'Свободный затвор недопустим под данный патрон',
      description: 'Масса затвора будет слишком большой (более 2.5–3 кг) для безопасного запирания: гильзу разорвёт при выстреле. Требуется жёсткое запирание (газоотвод) или полусвободный затвор.',
      affectedSlot: 'action',
    });
  }

  // 9.2 Cartridge longer than receiver length
  if (cartridge.overallLength > receiver.length) {
    issues.push({
      type: 'error',
      code: 'CARTRIDGE_EXCEEDS_RECEIVER',
      title: 'Патрон не помещается в патронник и ствольную коробку',
      description: `Длина патрона (${cartridge.overallLength} мм) превышает габарит приёмника (${receiver.length} мм).`,
      affectedSlot: 'cartridge',
    });
  }

  // 9.3 Receiver strength < Max pressure (Hard failure)
  if (receiver.strength < cartridge.maxPressure) {
    issues.push({
      type: 'error',
      code: 'RECEIVER_UNDERPRESSURE',
      title: 'Ресивер не выдержит давление',
      description: `Ресивер не выдержит давление: прочность ствольной коробки (${receiver.strength} бар) ниже пикового давления патрона (${cartridge.maxPressure} бар). Разрыв патронника при первом выстреле!`,
      affectedSlot: 'receiver',
    });
  }

  // 9.3b Bullpup trigger warning if direct trigger
  if (layout === 'bullpup' && trigger.type === 'direct') {
    issues.push({
      type: 'warning',
      code: 'BULLPUP_TRIGGER_SLUGGISH',
      title: 'Длинная спусковая тяга ухудшает спуск',
      description: 'В компоновке Bullpup спусковая тяга через весь корпус даёт вязкий спуск (-22 к качеству УСМ). Рекомендуется двухступенчатый УСМ (Two-Stage) для компенсации.',
      affectedSlot: 'trigger',
    });
  }

  // 9.4 Polymer receiver + rifle cartridge
  if (receiver.material === 'polymer' && cartridge.class === 'rifle') {
    issues.push({
      type: 'error',
      code: 'POLYMER_RIFLE_FORBIDDEN',
      title: 'Полимер не держит импульс винтовочного патрона',
      description: 'Мощный винтовочный патрон вызовет пластическую деформацию полимерной ствольной коробки и срыв направляющих затвора.',
      affectedSlot: 'receiver',
    });
  }

  // 9.5 Picatinny tech availability
  if (topInterface.type === 'picatinny' && currentYear < 1985 && !unlockedTechs.includes('picatinny_standard')) {
    issues.push({
      type: 'error',
      code: 'PICATINNY_ANACHRONISM',
      title: 'Планка Пикатинни еще не стандартизирована',
      description: `Стандарт MIL-STD-1913 появится только в 1985–1995 гг. Сейчас доступен ласточкин хвост или Weaver.`,
      affectedSlot: 'topInterface',
    });
  }

  // 9.6 Suppressor requires threaded barrel
  if (muzzleDevice.type === 'suppressor' && barrel.thread === 'none') {
    issues.push({
      type: 'error',
      code: 'SUPPRESSOR_NO_THREAD',
      title: 'Глушитель не на что закрепить',
      description: 'Для установки тактического глушителя требуется нарезка резьбы на стволе (выберите M14 или M18 в настройках ствола).',
      affectedSlot: 'muzzleDevice',
    });
  }

  // 9.7 Attachment requires higher recoil capacity than rail
  if (topAttachment && topInterface.type !== 'none') {
    if (topInterface.recoilCapacity < topAttachment.requiredRecoilCapacity) {
      issues.push({
        type: 'warning',
        code: 'ATTACHMENT_RECOIL_OVERLOAD',
        title: 'Прицел сбивает среднюю точку попадания (СТП)',
        description: `Прицел ${topAttachment.name} требует планку со стойкостью ${topAttachment.requiredRecoilCapacity} Дж, а ${topInterface.type} держит только ${topInterface.recoilCapacity} Дж. Штраф к кучности +3.5 MOA!`,
        affectedSlot: 'topAttachment',
      });
    }
  }

  // 9.8 Dovetail + rifle cartridge optics
  if (
    (topInterface.type === 'dovetail11' || topInterface.type === 'dovetail38') &&
    cartridge.class === 'rifle' &&
    topAttachment
  ) {
    issues.push({
      type: 'warning',
      code: 'DOVETAIL_RIFLE_DRIFT',
      title: 'Ненадёжная посадка на ласточкином хвосте',
      description: 'Энергия отдачи винтовочного патрона сдвигает оптический прицел по пазам ласточкиного хвоста. Требуется планка Weaver или штифтовый упор.',
      affectedSlot: 'topInterface',
    });
  }

  // 9.9 Stamping before 1935
  if (receiver.method === 'stamped' && currentYear < 1935 && !unlockedTechs.includes('stamped_metal')) {
    issues.push({
      type: 'error',
      code: 'STAMPING_BEFORE_TECH',
      title: 'Технология холодной штамповки еще не освоена',
      description: 'На заводах отсутствуют вытяжные прессы нужного тоннажа. Изучите технологию в КБ или используйте фрезеровку.',
      affectedSlot: 'receiver',
    });
  }

  // 9.10 Polymers before 1965
  if (receiver.material === 'polymer' && currentYear < 1965 && !unlockedTechs.includes('polymers_gen1')) {
    issues.push({
      type: 'error',
      code: 'POLYMERS_RECEIVER_BEFORE_TECH',
      title: 'Оружейные полимеры для ствольной коробки не изобретены',
      description: 'Стеклонаполненные термостойкие полиамиды для ресивера появятся только во 2-й половине 1960-х годов.',
      affectedSlot: 'receiver',
    });
  }

  if (slots.magazine.material === 'polymer' && currentYear < 1965 && !unlockedTechs.includes('polymers_gen1')) {
    issues.push({
      type: 'error',
      code: 'POLYMERS_MAGAZINE_BEFORE_TECH',
      title: 'Полимерные магазины не изобретены',
      description: 'Пластиковые и бакелитовые магазины появятся только во 2-й половине 1960-х годов. Используйте проверенный стальной магазин.',
      affectedSlot: 'magazine',
    });
  }

  // Lower attachment check
  if (lowerAttachment && handguard.lowerInterface === 'none') {
    issues.push({
      type: 'error',
      code: 'LOWER_ATTACHMENT_NO_RAIL',
      title: 'Нет нижнего интерфейса для подствольного оборудования',
      description: `Установленный аксессуар (${lowerAttachment.name}) требует цевьё с планкой Picatinny или пазами M-LOK.`,
      affectedSlot: 'lowerAttachment',
    });
  }

  return issues;
}

export function checkTZCompliance(
  stats: DerivedStats,
  tz: TechnicalSpecification,
  slots: WeaponSlots
): {
  passed: boolean;
  isAcceptableWithNotes: boolean;
  criticalPassed: boolean;
  failedItems: { name: string; current: string; required: string; note: string; isCritical: boolean }[];
  passedItems: { name: string; current: string; required: string }[];
  recommendations: string[];
} {
  const failedItems: { name: string; current: string; required: string; note: string; isCritical: boolean }[] = [];
  const passedItems: { name: string; current: string; required: string }[] = [];
  const recommendations: string[] = [];

  let criticalPassed = true;

  // 1. Cartridge class check (CRITICAL)
  if (slots.cartridge.class !== tz.requiredClass) {
    criticalPassed = false;
    failedItems.push({
      name: 'Класс патрона',
      current: slots.cartridge.class,
      required: tz.requiredClass,
      note: `ТЗ строго требует ${tz.requiredClass} патрон.`,
      isCritical: true,
    });
    recommendations.push(`Смените патрон на калибр класса "${tz.requiredClass}".`);
  } else {
    passedItems.push({
      name: 'Класс патрона',
      current: slots.cartridge.name,
      required: tz.requiredClass,
    });
  }

  // 2. Minimum firing rate / action capability (CRITICAL if auto required)
  if (tz.minRate > 100 && stats.cyclicRate < tz.minRate) {
    criticalPassed = false;
    failedItems.push({
      name: 'Темп стрельбы',
      current: `${stats.cyclicRate} выстр/мин`,
      required: `≥ ${tz.minRate} выстр/мин`,
      note: 'В ТЗ требуется автоматическое оружие, а установлена ручная перезарядка.',
      isCritical: true,
    });
    recommendations.push('Установите автоматический газовый двигатель или свободный затвор.');
  } else if (tz.minRate > 0 && stats.cyclicRate < tz.minRate) {
    failedItems.push({
      name: 'Темп стрельбы',
      current: `${stats.cyclicRate} в/м`,
      required: `≥ ${tz.minRate} в/м`,
      note: 'Темп стрельбы незначительно ниже норматива.',
      isCritical: false,
    });
  } else {
    passedItems.push({
      name: 'Темп стрельбы',
      current: `${stats.cyclicRate} в/м`,
      required: `≥ ${tz.minRate} в/м`,
    });
  }

  // 3. Reliability (Soft tolerance within 5% with note)
  if (stats.reliability < tz.minReliability) {
    const relDeficit = tz.minReliability - stats.reliability;
    const isCritical = relDeficit > 8;
    if (isCritical) criticalPassed = false;

    failedItems.push({
      name: 'Надёжность',
      current: `${stats.reliability}%`,
      required: `≥ ${tz.minReliability}%`,
      note: `Недостаточная надёжность в климате "${tz.climate}" (дефицит ${relDeficit}%).`,
      isCritical,
    });
    recommendations.push(
      'Для повышения надёжности: добавьте регулируемый газоотвод (+5%), смените дисковый магазин на секторный (+8%) или проверьте прочность ствольной коробки.'
    );
  } else {
    passedItems.push({
      name: 'Надёжность',
      current: `${stats.reliability}%`,
      required: `≥ ${tz.minReliability}%`,
    });
  }

  // 4. Mass (Soft tolerance within 10% with minor remark)
  if (stats.weaponMass > tz.maxMass) {
    const massDiff = stats.weaponMass - tz.maxMass;
    const isCritical = massDiff > tz.maxMass * 0.12; // Over 12% is a hard fail
    if (isCritical) criticalPassed = false;

    failedItems.push({
      name: 'Масса оружия',
      current: `${stats.weaponMass} кг`,
      required: `≤ ${tz.maxMass} кг`,
      note: isCritical
        ? `Критический перевес на +${massDiff.toFixed(2)} кг.`
        : `Небольшой перевес на +${massDiff.toFixed(2)} кг (допустимо с замечанием комиссии).`,
      isCritical,
    });
    recommendations.push(
      `Для снижения массы на ${(massDiff * 1000).toFixed(0)} г: выберите ствол профиля Light/Medium (-250..400 г), рамочный/полимерный приклад (-150 г) или штампованную коробку.`
    );
  } else {
    passedItems.push({
      name: 'Масса оружия',
      current: `${stats.weaponMass} кг`,
      required: `≤ ${tz.maxMass} кг`,
    });
  }

  // 5. Unit Cost (Soft tolerance within 12% with remark)
  if (stats.unitCost > tz.maxUnitCost) {
    const costDiff = stats.unitCost - tz.maxUnitCost;
    const isCritical = costDiff > tz.maxUnitCost * 0.15;
    if (isCritical) criticalPassed = false;

    failedItems.push({
      name: 'Себестоимость серии',
      current: `${stats.unitCost} ©`,
      required: `≤ ${tz.maxUnitCost} ©`,
      note: isCritical
        ? `Смета превышена на +${costDiff.toFixed(1)} ©`
        : `Превышение сметы на +${costDiff.toFixed(1)} © (компенсируется высокой серией).`,
      isCritical,
    });
    recommendations.push(
      'Для удешевления: используйте штамповку вместо фрезеровки, деревянное или простое цевьё, либо снимите дорогостоящую оптику.'
    );
  } else {
    passedItems.push({
      name: 'Себестоимость',
      current: `${stats.unitCost} ©`,
      required: `≤ ${tz.maxUnitCost} ©`,
    });
  }

  // 6. Accuracy MOA (Soft tolerance within 15%)
  if (stats.accuracyMOA > tz.minAccuracyMOA) {
    const moaDiff = stats.accuracyMOA - tz.minAccuracyMOA;
    const isCritical = moaDiff > tz.minAccuracyMOA * 0.25;
    if (isCritical) criticalPassed = false;

    failedItems.push({
      name: 'Кучность (MOA)',
      current: `${stats.accuracyMOA} MOA`,
      required: `≤ ${tz.minAccuracyMOA} MOA`,
      note: isCritical
        ? `Рассеивание выстрелов превышает лимит на +${moaDiff.toFixed(1)} MOA.`
        : `Кучность чуть ниже требований (+${moaDiff.toFixed(1)} MOA).`,
      isCritical,
    });
    recommendations.push(
      `Скорректируйте шаг нарезов ствола ближе к оптимуму (${stats.optimalTwist} мм), используйте двухступенчатый спуск или оптику.`
    );
  } else {
    passedItems.push({
      name: 'Кучность (MOA)',
      current: `${stats.accuracyMOA} MOA`,
      required: `≤ ${tz.minAccuracyMOA} MOA`,
    });
  }

  // 7. Standardization
  if (stats.standardization < tz.minStandardization) {
    const standDiff = tz.minStandardization - stats.standardization;
    failedItems.push({
      name: 'Стандартизация',
      current: `${stats.standardization}%`,
      required: `≥ ${tz.minStandardization}%`,
      note: `Недостаточный уровень стандартизации планок (-${standDiff}%).`,
      isCritical: false,
    });
    recommendations.push('Установите стандартные планки Weaver или Picatinny.');
  } else {
    passedItems.push({
      name: 'Стандартизация',
      current: `${stats.standardization}%`,
      required: `≥ ${tz.minStandardization}%`,
    });
  }

  const passed = failedItems.length === 0;
  const isAcceptableWithNotes = criticalPassed && !failedItems.some((i) => i.isCritical);

  return { passed, isAcceptableWithNotes, criticalPassed, failedItems, passedItems, recommendations };
}

export function generateCompetitors(
  tz: TechnicalSpecification,
  country: CountryId
): CompetitorDesign[] {
  const competitorDefs =
    country === 'USSR'
      ? [
          {
            bureauName: 'КБ Завода им. Дегтярёва (КБД)',
            style: 'cheap_mass' as const,
            weaponSuffix: 'Дегтярёв Проект-У',
          },
          {
            bureauName: 'Тульское ЦКИБ СОО',
            style: 'precision_cost' as const,
            weaponSuffix: 'ТКБ Экспериментальный',
          },
          {
            bureauName: 'Ижевский машиностроительный (Ижмаш)',
            style: 'conservative' as const,
            weaponSuffix: 'ИЖ-Модель А',
          },
        ]
      : [
          {
            bureauName: 'Colt Manufacturing',
            style: 'conservative' as const,
            weaponSuffix: 'Colt Model Prototype',
          },
          {
            bureauName: 'ArmaLite Inc.',
            style: 'innovative' as const,
            weaponSuffix: 'AR-System Project',
          },
          {
            bureauName: 'Springfield Armory',
            style: 'cheap_mass' as const,
            weaponSuffix: 'SA Mil-Pattern',
          },
        ];

  return competitorDefs.map((def) => {
    // Generate realistic stats based on style
    let rel = tz.minReliability + (Math.random() * 8 - 2);
    let mass = tz.maxMass - Math.random() * 0.4;
    let cost = tz.maxUnitCost * (0.8 + Math.random() * 0.25);
    let moa = tz.minAccuracyMOA * (0.75 + Math.random() * 0.35);
    let rate = tz.minRate + Math.round(Math.random() * 100);
    let stand = tz.minStandardization + Math.round(Math.random() * 20);

    if (def.style === 'cheap_mass') {
      cost *= 0.78;
      rel -= 3;
      moa += 0.8;
      mass -= 0.2;
    } else if (def.style === 'precision_cost') {
      moa = Math.max(0.8, moa * 0.65);
      cost *= 1.35;
      rel += 2;
    } else if (def.style === 'innovative') {
      mass *= 0.88;
      stand += 15;
      rel -= 4; // experimental teething trouble
    }

    const derived: DerivedStats = {
      velocity: 700 + Math.round(Math.random() * 150),
      energy: 1800 + Math.round(Math.random() * 1200),
      flatness: 60 + Math.round(Math.random() * 25),
      weaponMass: Number(mass.toFixed(2)),
      unitCost: Number(cost.toFixed(1)),
      reliability: Math.min(100, Math.round(rel)),
      accuracyMOA: Number(moa.toFixed(2)),
      ergonomics: 60 + Math.round(Math.random() * 25),
      standardization: Math.min(100, Math.round(stand)),
      manufacturability: 70 + Math.round(Math.random() * 20),
      cyclicRate: rate,
      feltRecoil: 6.5,
      recoilEnergy: 24,
      recoilImpulse: 6.8,
      muzzleClimb: 4.2,
      isBroken: false,
      barrelRigidity: 75,
      leftHandedFriendly: true,
      triggerQuality: 70,
      optimalTwist: 240,
      overallLength: 850,
      recoilCoeff: 0.09,
      massBreakdown: {
        barrel: Number((mass * 0.35).toFixed(2)),
        receiver: Number((mass * 0.30).toFixed(2)),
        magazine: Number((mass * 0.15).toFixed(2)),
        stock: Number((mass * 0.12).toFixed(2)),
        action: 0.35,
        handguard: 0.25,
        attachments: 0.0,
        other: 0.15,
      },
      costBreakdown: {
        nodesSum: Number((cost * 0.85).toFixed(1)),
        productionMarkup: Number((cost * 0.15).toFixed(1)),
      },
    };

    // Threshold check
    const passed =
      derived.reliability >= tz.minReliability &&
      derived.weaponMass <= tz.maxMass &&
      derived.unitCost <= tz.maxUnitCost &&
      derived.accuracyMOA <= tz.minAccuracyMOA;

    return {
      bureauName: def.bureauName,
      style: def.style,
      weaponName: `${def.weaponSuffix}`,
      slots: {},
      derived,
      score: 0,
      passedThresholds: passed,
      breakdown: {},
    };
  });
}

export function evaluateContest(
  playerStats: DerivedStats,
  slots: WeaponSlots,
  tz: TechnicalSpecification,
  country: CountryId,
  precomputedCompetitors?: CompetitorDesign[]
): ContestResult {
  const compliance = checkTZCompliance(playerStats, tz, slots);
  const competitors = precomputedCompetitors || generateCompetitors(tz, country);

  // Scoring function based on TZ priorities and market
  const calculateScore = (stats: DerivedStats, passed: boolean, withNotes: boolean = false) => {
    if (!passed && !withNotes) return 0;
    let score = 50;

    // Weights from market
    const weights: Record<string, number> =
      tz.market === 'civilian'
        ? {
            accuracyMOA: 0.30,
            ergonomics: 0.20,
            standardization: 0.15,
            unitCost: 0.20,
            reliability: 0.15,
          }
        : {
            reliability: 0.30,
            unitCost: 0.20,
            weaponMass: 0.20,
            accuracyMOA: 0.15,
            standardization: 0.15,
          };

    // Priority multipliers
    tz.priority.forEach((p) => {
      if (weights[p]) weights[p] *= 1.4;
    });

    // Score calculations
    // Reliability
    score += (stats.reliability / 100) * (weights.reliability || 0.2) * 100;
    // Mass
    const massMargin = Math.max(-0.2, (tz.maxMass - stats.weaponMass) / tz.maxMass);
    score += massMargin * (weights.weaponMass || 0.2) * 100;
    // Cost
    const costMargin = Math.max(-0.2, (tz.maxUnitCost - stats.unitCost) / tz.maxUnitCost);
    score += costMargin * (weights.unitCost || 0.2) * 100;
    // Accuracy
    const moaMargin = Math.max(-0.2, (tz.minAccuracyMOA - stats.accuracyMOA) / tz.minAccuracyMOA);
    score += moaMargin * (weights.accuracyMOA || 0.2) * 100;
    // Standardization
    score += (stats.standardization / 100) * (weights.standardization || 0.1) * 60;
    // Ergonomics
    score += (stats.ergonomics / 100) * (weights.ergonomics || 0.1) * 60;

    // Penalty if accepted with notes (soft tolerance)
    if (withNotes && !passed) {
      score *= 0.88;
    }

    return Math.round(score);
  };

  const isPlayerEligible = compliance.passed || compliance.isAcceptableWithNotes;
  const playerScore = calculateScore(playerStats, compliance.passed, compliance.isAcceptableWithNotes);

  competitors.forEach((c) => {
    c.score = calculateScore(c.derived, c.passedThresholds);
  });

  const allEntries = [
    { name: 'Ваше КБ', isPlayer: true, score: playerScore, passed: isPlayerEligible },
    ...competitors.map((c) => ({ name: c.bureauName, isPlayer: false, score: c.score, passed: c.passedThresholds })),
  ].sort((a, b) => b.score - a.score);

  const playerRank = allEntries.findIndex((e) => e.isPlayer) + 1;

  let verdict: 'accepted' | 'accepted_with_notes' | 'rejected' = 'rejected';
  let verdictTitle = '';
  let verdictText = '';
  let payout = 0;
  let reputationGain = 0;

  if (!isPlayerEligible) {
    verdict = 'rejected';
    verdictTitle = 'Проект отклонён государственной комиссией';
    verdictText = `Оружие не прошло критические испытания ТЗ. Зафиксированы грубые несоответствия: ${compliance.failedItems
      .filter((i) => i.isCritical)
      .map((i) => `${i.name} (${i.current} вместо ${i.required})`)
      .join(', ')}. Конструкция снята с конкурса.`;
    payout = 0;
    reputationGain = -5;
  } else if (playerRank === 1 && compliance.passed) {
    verdict = 'accepted';
    verdictTitle = 'Безоговорочная победа в конкурсе! Принят на вооружение';
    verdictText = `Государственная комиссия признала проект вашего КБ лучшим среди всех участников конкурса. Отмечены превосходные параметры и полное соблюдение ТЗ. Заключён генеральный серийный контракт!`;
    payout = tz.budgetReward;
    reputationGain = tz.prestigeReward;
  } else if (playerRank === 1 && compliance.isAcceptableWithNotes) {
    verdict = 'accepted_with_notes';
    verdictTitle = 'Победа с замечанием комиссии (Принят в серию)';
    verdictText = `Комиссия признала превосходство конструкции над конкурентами, однако обязала устранить мелкие замечания (${compliance.failedItems.map((i) => i.name).join(', ')}) в ходе выпуска установочной заводской серии. Контракт утверждён!`;
    payout = Math.round(tz.budgetReward * 0.9);
    reputationGain = Math.round(tz.prestigeReward * 0.85);
  } else if (playerRank === 2 && playerScore >= 70) {
    verdict = 'accepted_with_notes';
    verdictTitle = 'Принят в опытную войсковую партию';
    verdictText = `Проект занял 2-е место, уступив лидеру по отдельным весовым критериям, однако комиссия сочла схему перспективной. Выделено финансирование на опытную партию и доводку узлов.`;
    payout = Math.round(tz.budgetReward * 0.65);
    reputationGain = Math.round(tz.prestigeReward * 0.5);
  } else {
    verdict = 'rejected';
    verdictTitle = 'Победу одержало конкурирующее КБ';
    verdictText = `Хотя ваше оружие преодолело обязательные нормативы, конкурент (${allEntries[0].name}) продемонстрировал более выгодные параметры по ключевым приоритетам ТЗ. Контракт достался сопернику.`;
    payout = 25; // consolation subsidy
    reputationGain = 2;
  }

  const criteriaBreakdown = [
    {
      criterion: 'Надёжность и безотказность',
      requirement: `≥ ${tz.minReliability}% (${tz.climate})`,
      playerValue: `${playerStats.reliability}%`,
      status: (playerStats.reliability >= tz.minReliability ? 'pass' : 'fail') as 'pass' | 'fail',
      note: playerStats.reliability >= tz.minReliability ? 'Выдержало полигонные испытания' : 'Задержки при стрельбе в климатической камере',
    },
    {
      criterion: 'Масса оружия без патронов',
      requirement: `≤ ${tz.maxMass} кг`,
      playerValue: `${playerStats.weaponMass} кг`,
      status: (playerStats.weaponMass <= tz.maxMass ? 'pass' : 'fail') as 'pass' | 'fail',
      note: playerStats.weaponMass <= tz.maxMass ? 'Укладывается в переносимый носимый вес' : 'Слишком тяжёлое для пехотинца',
    },
    {
      criterion: 'Себестоимость серии',
      requirement: `≤ ${tz.maxUnitCost} ©`,
      playerValue: `${playerStats.unitCost} ©`,
      status: (playerStats.unitCost <= tz.maxUnitCost ? 'pass' : 'fail') as 'pass' | 'fail',
      note: playerStats.unitCost <= tz.maxUnitCost ? 'Экономически целесообразно' : 'Превышает плановый бюджет министерства',
    },
    {
      criterion: 'Кучность (MOA)',
      requirement: `≤ ${tz.minAccuracyMOA} MOA`,
      playerValue: `${playerStats.accuracyMOA} MOA`,
      status: (playerStats.accuracyMOA <= tz.minAccuracyMOA ? 'pass' : 'fail') as 'pass' | 'fail',
      note: playerStats.accuracyMOA <= tz.minAccuracyMOA ? 'Отличная баллистика' : 'Большой разброс попаданий',
    },
    {
      criterion: 'Стандартизация и интерфейсы',
      requirement: `≥ ${tz.minStandardization}%`,
      playerValue: `${playerStats.standardization}%`,
      status: (playerStats.standardization >= tz.minStandardization ? 'pass' : 'fail') as 'pass' | 'fail',
      note: playerStats.standardization >= tz.minStandardization ? 'Совместимо с армейским снабжением' : 'Нестандартные узлы крепления',
    },
  ];

  return {
    passed: compliance.passed,
    playerScore,
    rank: playerRank,
    totalCompetitors: allEntries.length,
    verdict,
    verdictTitle,
    verdictText,
    payout,
    reputationGain,
    competitors,
    criteriaBreakdown,
  };
}

export function generateDynamicTZ(year: number, country: CountryId): TechnicalSpecification {
  const isPostWar = year >= 1945;
  const isModern = year >= 1980;

  type Archetype = {
    type: TechnicalSpecification['weaponType'];
    typeName: string;
    class: TechnicalSpecification['requiredClass'];
    titleTemplate: string;
    client: TechnicalSpecification['client'];
    clientName: string;
    market: TechnicalSpecification['market'];
    baseMass: number;
    baseCost: number;
    baseMoa: number;
    baseRel: number;
    baseRate: number;
  };

  const archetypes: Archetype[] = [];

  // Pistol archetype (always available across all eras)
  archetypes.push({
    type: 'pistol',
    typeName: 'Пистолет',
    class: 'pistol',
    titleTemplate: `Самозарядный служебный пистолет (${year})`,
    client: country === 'USSR' ? 'army' : 'police',
    clientName: country === 'USSR' ? 'ГРАУ / Комендатура РККА' : 'Law Enforcement Division',
    market: country === 'USA' ? 'both' : 'military',
    baseMass: 0.90,
    baseCost: 11.5,
    baseMoa: 4.5,
    baseRel: 84,
    baseRate: 40,
  });

  if (year < 1950) {
    archetypes.push({
      type: 'submachineGun',
      typeName: 'Пистолет-пулемёт',
      class: 'pistol',
      titleTemplate: `Фронтовой пистолет-пулемёт (${year})`,
      client: 'army',
      clientName: country === 'USSR' ? 'ГРАУ РККА' : 'Ordnance Department',
      market: 'military',
      baseMass: 3.4,
      baseCost: 14.0,
      baseMoa: 7.5,
      baseRel: 76,
      baseRate: 650,
    });
  }

  if (year >= 1943) {
    archetypes.push({
      type: 'assaultRifle',
      typeName: 'Штурмовой автомат',
      class: 'intermediate',
      titleTemplate: `Общевойсковой автомат пехоты (${year})`,
      client: 'army',
      clientName: country === 'USSR' ? 'Министерство обороны' : 'US Army Materiel Command',
      market: 'military',
      baseMass: 3.6,
      baseCost: 22.0,
      baseMoa: 4.8,
      baseRel: 82,
      baseRate: 600,
    });
  }

  archetypes.push({
    type: 'sniperRifle',
    typeName: 'Снайперская винтовка',
    class: 'rifle',
    titleTemplate: `Высокоточная марксманская винтовка (${year})`,
    client: 'special_forces',
    clientName: country === 'USSR' ? 'Управление спецназа ГРУ' : 'Special Operations Command',
    market: isModern ? 'both' : 'military',
    baseMass: 4.5,
    baseCost: 55.0,
    baseMoa: 1.8,
    baseRel: 84,
    baseRate: 35,
  });

  if (country === 'USA') {
    archetypes.push({
      type: 'battleRifle',
      typeName: 'Охотничий карабин',
      class: 'rifle',
      titleTemplate: `Коммерческий охотничий карабин (${year})`,
      client: 'hunters',
      clientName: 'Ассоциация стрелкового спорта США',
      market: 'civilian',
      baseMass: 3.8,
      baseCost: 45.0,
      baseMoa: 1.6,
      baseRel: 72,
      baseRate: 15,
    });
  } else if (country === 'USSR' && year >= 1949) {
    archetypes.push({
      type: 'battleRifle',
      typeName: 'Карабин для спецчастей',
      class: 'intermediate',
      titleTemplate: `Карабин армейский самозарядный (${year})`,
      client: 'special_forces',
      clientName: 'ГРАУ / Войска специального назначения',
      market: 'military',
      baseMass: 3.5,
      baseCost: 24.0,
      baseMoa: 2.8,
      baseRel: 88,
      baseRate: 40,
    });
  }

  const selectedArch = archetypes[Math.floor(Math.random() * archetypes.length)];
  const climates: ('normal' | 'dust' | 'frost' | 'mud')[] = ['normal', 'dust', 'frost', 'mud'];
  const chosenClimate = climates[Math.floor(Math.random() * climates.length)];

  const minStandardization = isModern ? 70 : isPostWar ? 40 : 25;
  const targetBatch = selectedArch.market === 'civilian' ? 25000 : 40000;

  return {
    id: `dyn_tz_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: selectedArch.titleTemplate,
    year,
    country,
    client: selectedArch.client,
    clientName: selectedArch.clientName,
    weaponType: selectedArch.type,
    weaponTypeName: selectedArch.typeName,
    requiredClass: selectedArch.class,
    minReliability: selectedArch.baseRel,
    minRate: selectedArch.baseRate,
    maxMass: selectedArch.baseMass,
    maxUnitCost: selectedArch.baseCost,
    minAccuracyMOA: selectedArch.baseMoa,
    minStandardization,
    deadlineWeeks: 24,
    budgetReward: Math.round(350 + Math.random() * 300),
    prestigeReward: Math.round(25 + Math.random() * 25),
    climate: chosenClimate,
    priority: selectedArch.market === 'civilian' ? ['accuracyMOA', 'unitCost', 'ergonomics'] : ['reliability', 'unitCost', 'weaponMass'],
    market: selectedArch.market,
    description: `Оперативное техническое задание от генералитета на проектирование системы класса "${selectedArch.typeName}". Полигонные испытания будут проходить в условиях "${chosenClimate}".`,
    targetBatchSize: targetBatch,
  };
}
