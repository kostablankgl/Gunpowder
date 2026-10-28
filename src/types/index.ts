export type CountryId = 'USSR' | 'USA';

export type CartridgeClass = 'pistol' | 'intermediate' | 'rifle';

export interface Cartridge {
  id: string;
  name: string;
  class: CartridgeClass;
  bulletDiameter: number; // mm
  bulletMass: number; // grams
  caseLength: number; // mm
  overallLength: number; // mm
  maxPressure: number; // bar
  vRef: number; // m/s
  lRef: number; // mm
  cost: number; // currency units
  techLevel: number; // min year
  isCustom?: boolean;
}

// Separate technical concept of ammunition and chambering
export interface Ammo {
  id: string;
  name: string;
  caliber: number; // bullet diameter in mm (e.g. 7.62, 5.45, 9.0, 11.43)
  caseLength: number; // case length in mm (e.g. 39, 54, 19, 25)
  powderLoad: number; // propellant powder mass in grams
  pressure: number; // peak chamber pressure in bar
  bulletMass: number; // bullet weight in grams
  class: CartridgeClass;
  cost: number;
}

export interface Chambering {
  id: string;
  name: string;
  caliber: number;
  caseLength: number;
  chamberPressureLimit: number; // bar safe limit of barrel chamber
}

export interface RecoilAnalysis {
  recoilImpulse: number; // N·s (shoulder push)
  muzzleClimb: number; // angular climb degrees / index (0 - 15)
  feltRecoil: number; // perceived kick
}

export type BarrelProfile = 'light' | 'medium' | 'heavy';
export type BarrelMaterial = 'steel' | 'stainless' | 'composite';
export type BarrelThread = 'none' | 'M14' | 'M18';

export interface Barrel {
  length: number; // mm (100 - 800)
  twist: number; // mm/rev (100 - 450)
  profile: BarrelProfile;
  material: BarrelMaterial;
  thread: BarrelThread;
  rifled: boolean;
}

export type ActionType = 'manual' | 'blowback' | 'delayedBlowback' | 'gas' | 'recoil';

export interface Action {
  type: ActionType;
  cyclicRate: number; // rounds/min
  gasAdjustable: boolean;
  boltMass: number; // kg
  requiresGasTube: boolean;
  cost: number;
  reliabilityBase: number; // 0 - 100
  techLevel: number;
}

export type ReceiverMaterial = 'steel' | 'aluminum' | 'polymer';
export type ReceiverMethod = 'milled' | 'stamped' | 'cast' | 'polymerMolded';

export interface Receiver {
  material: ReceiverMaterial;
  method: ReceiverMethod;
  strength: number; // bar max
  length: number; // mm
  mass: number; // kg
  cost: number;
  techLevel: number;
}
export type MagazineType = 'box' | 'drum' | 'tube';
export type MagazinePosition = 'front' | 'rear' | 'grip'; // rear = bullpup, grip = pistol
export type MagazineMaterial = 'steel' | 'polymer';

export interface Magazine {
  type: MagazineType;
  capacity: number;
  position: MagazinePosition;
  material: MagazineMaterial;
  techLevel: number;
}

export type TriggerMode = 'single' | 'auto' | 'both';
export type TriggerType = 'direct' | 'twoStage';

export interface Trigger {
  mode: TriggerMode;
  type: TriggerType;
  pullLength: number; // mm (20 - 70)
  safety: boolean;
  cost: number;
}

export type StockType = 'fixedWood' | 'folding' | 'telescopic' | 'polymer' | 'none';

export interface Stock {
  type: StockType;
  length: number; // mm (0 for none, 150 - 400)
  recoilDamper: boolean;
  techLevel: number;
}

export type InterfaceType = 'none' | 'dovetail11' | 'dovetail38' | 'weaver' | 'picatinny' | 'proprietary';

export interface TopInterface {
  type: InterfaceType;
  standardization: number; // 0 - 100
  recoilCapacity: number; // Joules
  height: number; // mm
  mass: number; // kg
  cost: number;
  techLevel: number;
}

export type LowerInterfaceType = 'none' | 'mlok' | 'picatinny';
export type HandguardMaterial = 'wood' | 'aluminum' | 'polymer' | 'none';

export interface Handguard {
  length: number; // mm
  material: HandguardMaterial;
  lowerInterface: LowerInterfaceType;
  vented: boolean;
  techLevel: number;
}

export type MuzzleType = 'none' | 'flashHider' | 'compensator' | 'suppressor';

export interface MuzzleDevice {
  type: MuzzleType;
  recoilReduction: number; // percentage, e.g. 20
  flashReduction: number; // percentage, e.g. 80
  soundReduction: number; // dB, e.g. 25
  mass: number;
  cost: number;
  requiresThread: boolean;
  techLevel: number;
}

export type AttachmentType = 
  | 'collimator' 
  | 'optic4x' 
  | 'optic8x' 
  | 'nightVision' 
  | 'thermal' 
  | 'flashlight' 
  | 'laser' 
  | 'verticalGrip' 
  | 'bipod';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  slot: 'top' | 'lower';
  requiredInterface: 'weaver_plus' | 'picatinny' | 'lower_rail';
  requiredRecoilCapacity: number; // J
  mass: number; // kg
  cost: number;
  techLevel: number;
  effectLabel: string;
  accuracyBonus: number; // negative decreases MOA (better)
  ergonomicsBonus: number;
}

export type WeaponLayout = 'classic' | 'bullpup';

export interface WeaponSlots {
  cartridge: Cartridge;
  barrel: Barrel;
  action: Action;
  receiver: Receiver;
  magazine: Magazine;
  trigger: Trigger;
  stock: Stock;
  topInterface: TopInterface;
  handguard: Handguard;
  muzzleDevice: MuzzleDevice;
  topAttachment?: Attachment | null;
  lowerAttachment?: Attachment | null;
}

export interface DerivedStats {
  velocity: number; // m/s
  energy: number; // J
  flatness: number; // 0 - 100
  weaponMass: number; // kg
  unitCost: number; // currency
  reliability: number; // 0 - 100
  accuracyMOA: number; // MOA (lower is better)
  ergonomics: number; // 0 - 100
  standardization: number; // 0 - 100
  manufacturability: number; // 0 - 100
  cyclicRate: number; // rpm
  feltRecoil: number; // J/kg
  recoilEnergy: number; // J
  recoilImpulse: number; // N·s (shoulder push)
  muzzleClimb: number; // degrees / climb index (0 - 15)
  isBroken: boolean; // barrel or chamber burst due to overpressure
  breakageReason?: string;
  barrelRigidity: number; // 0 - 100 (affects accuracy under heat and length)
  leftHandedFriendly: boolean; // false for standard bullpup without brass deflector
  triggerQuality: number; // 0 - 100
  optimalTwist: number; // mm
  overallLength: number; // mm
  recoilCoeff: number; // 0.05 | 0.09 | 0.12 based on class
  isBullpupPenaltyApplied?: boolean;
  loadedMass?: number; // kg (dry weapon + loaded ammo)
  massBreakdown: {
    barrel: number;
    receiver: number;
    magazine: number;
    stock: number;
    action: number;
    handguard: number;
    attachments: number;
    ammo?: number;
    other: number;
  };
  costBreakdown: {
    nodesSum: number;
    productionMarkup: number;
  };
}

export type MarketSegment = 'hunters' | 'sports' | 'self_defense';

export interface MarketAnalysis {
  segment: MarketSegment;
  demandScore: number; // 0 - 100
  monthlySales: number; // units
  unitPrice: number; // retail price ©
  unitCost: number; // production cost ©
  unitMargin: number; // profit per unit ©
  monthlyRevenue: number;
  monthlyProfit: number;
  satisfactionRating: number; // 1.0 - 5.0
  verdict: string;
  reviewTags: string[];
  isForbidden: boolean;
  forbiddenReason?: string;
}

export interface CustomerReview {
  id: string;
  author: string;
  avatar: string;
  role: string;
  rating: number; // 1 - 5
  tags: string[];
  text: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  code: string;
  title: string;
  description: string;
  affectedSlot?: keyof WeaponSlots;
}

export interface TechnicalSpecification {
  id: string;
  title: string;
  year: number;
  country: CountryId;
  client: 'army' | 'special_forces' | 'hunters' | 'police' | 'militia';
  clientName: string;
  weaponType: 'pistol' | 'submachineGun' | 'assaultRifle' | 'battleRifle' | 'sniperRifle';
  weaponTypeName: string;
  requiredClass: CartridgeClass;
  minReliability: number;
  minRate: number;
  maxMass: number;
  maxUnitCost: number;
  minAccuracyMOA: number; // maximum MOA allowed (e.g. <= 3.5 MOA)
  minStandardization: number;
  deadlineWeeks: number;
  budgetReward: number;
  prestigeReward: number;
  climate: 'normal' | 'dust' | 'frost' | 'mud';
  priority: (keyof DerivedStats)[];
  market: 'military' | 'civilian' | 'both';
  description: string;
  targetBatchSize: number;
}

export interface CompetitorDesign {
  bureauName: string;
  style: 'cheap_mass' | 'precision_cost' | 'innovative' | 'conservative';
  weaponName: string;
  slots: Partial<WeaponSlots>;
  derived: DerivedStats;
  score: number;
  passedThresholds: boolean;
  breakdown: Record<string, number>;
}

export interface ContestResult {
  passed: boolean;
  playerScore: number;
  rank: number;
  totalCompetitors: number;
  verdict: 'accepted' | 'accepted_with_notes' | 'rejected';
  verdictTitle: string;
  verdictText: string;
  payout: number;
  reputationGain: number;
  competitors: CompetitorDesign[];
  criteriaBreakdown: {
    criterion: string;
    requirement: string;
    playerValue: string;
    status: 'pass' | 'fail' | 'bonus';
    note: string;
  }[];
}

export interface TechNode {
  id: string;
  name: string;
  category: 'materials' | 'production' | 'interfaces' | 'actions' | 'optics' | 'cartridges';
  cost: number;
  weeks: number;
  yearAvailable: number;
  description: string;
  prerequisites: string[];
  unlocked: boolean;
}

export interface ProductionContract {
  id: string;
  name: string;
  weaponName: string;
  type: 'military' | 'civilian';
  batchSize: number;
  producedSoFar: number;
  unitRevenue: number;
  unitCost: number;
  monthlyProduction: number;
  active: boolean;
}

export interface CivilianProduct {
  id: string;
  name: string;
  weaponName: string;
  caliber: string;
  unitCost: number;
  retailPrice: number;
  monthlySales: number;
  totalSold: number;
  totalProfit: number;
  customerRating: number; // 1 - 5 stars based on MOA, ergonomics, price
  active: boolean;
}

export interface GameState {
  year: number;
  month: number;
  country: CountryId;
  budget: number;
  reputation: number; // 0 - 100
  bureauLevel: number;
  unlockedTechIds: string[];
  currentTZ: TechnicalSpecification | null;
  activeContracts: ProductionContract[];
  civilianProducts?: CivilianProduct[];
  researchingTechId: string | null;
  researchWeeksLeft: number;
  customCartridges: Cartridge[];
  stats: {
    totalAccepted: number;
    totalRejected: number;
    totalRevenue: number;
  };
}
