import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  WeaponSlots,
  WeaponLayout,
  TechnicalSpecification,
  CountryId,
  ProductionContract,
  ContestResult,
  Cartridge,
} from './types';
import {
  BASE_CARTRIDGES,
  ACTIONS_PRESETS,
  RECEIVERS_PRESETS,
  TOP_INTERFACES_PRESETS,
  HANDGUARD_PRESETS,
  MUZZLE_PRESETS,
  ATTACHMENTS_CATALOG,
  INITIAL_TECHNICAL_SPECIFICATIONS,
  COUNTRY_PROFILES,
  TECH_TREE_NODES,
} from './data/database';
import { calculateDerivedStats, validateWeapon, generateDynamicTZ } from './engine/physics';
import { BlueprintCanvas } from './components/BlueprintCanvas';
import { TTXPanel } from './components/TTXPanel';
import { SlotSelector } from './components/SlotSelector';
import { HeaderNav } from './components/HeaderNav';
import { ContestView } from './components/ContestView';
import { ResearchTree } from './components/ResearchTree';
import { ProductionView } from './components/ProductionView';
import { CustomCaliberModal } from './components/CustomCaliberModal';
import { TenderModal } from './components/TenderModal';
import { FiringRangeModal } from './components/FiringRangeModal';
import { MainMenu } from './components/MainMenu';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { CheatPanel } from './components/CheatPanel';
import { CivilianMarket } from './components/CivilianMarket';
import { CivilianProduct } from './types';
import { sounds } from './utils/audio';

const STORAGE_KEY = 'kb_game_save_v2';
const DEBUG_KEY = 'kb_debug_mode_active';

function sanitizeSavedSlots(raw: any): WeaponSlots {
  const tokarev = BASE_CARTRIDGES.find((c) => c.id === '7.62x25') || BASE_CARTRIDGES[1];
  const defaultSlots: WeaponSlots = {
    cartridge: tokarev,
    barrel: {
      length: 250,
      twist: 240,
      profile: 'medium',
      material: 'steel',
      thread: 'none',
      rifled: true,
    },
    action: { ...ACTIONS_PRESETS[1], gasAdjustable: false },
    receiver: RECEIVERS_PRESETS[1],
    magazine: {
      type: 'box',
      capacity: 35,
      position: 'front',
      material: 'steel',
      techLevel: 1935,
    },
    trigger: {
      mode: 'auto',
      type: 'direct',
      pullLength: 40,
      safety: true,
      cost: 2.0,
    },
    stock: {
      type: 'fixedWood',
      length: 300,
      recoilDamper: false,
      techLevel: 1935,
    },
    topInterface: TOP_INTERFACES_PRESETS[1],
    handguard: HANDGUARD_PRESETS[0],
    muzzleDevice: MUZZLE_PRESETS[0],
    topAttachment: null,
    lowerAttachment: null,
  };

  if (!raw || typeof raw !== 'object') return defaultSlots;

  return {
    cartridge: raw.cartridge && raw.cartridge.class ? { ...defaultSlots.cartridge, ...raw.cartridge } : defaultSlots.cartridge,
    barrel: {
      ...defaultSlots.barrel,
      ...(raw.barrel || {}),
    },
    action: {
      ...defaultSlots.action,
      ...(raw.action || {}),
    },
    receiver: {
      ...defaultSlots.receiver,
      ...(raw.receiver || {}),
    },
    magazine: {
      ...defaultSlots.magazine,
      ...(raw.magazine || {}),
    },
    trigger: {
      ...defaultSlots.trigger,
      ...(raw.trigger || {}),
    },
    stock: {
      ...defaultSlots.stock,
      ...(raw.stock || {}),
    },
    topInterface: {
      ...defaultSlots.topInterface,
      ...(raw.topInterface || {}),
    },
    handguard: {
      ...defaultSlots.handguard,
      ...(raw.handguard || {}),
    },
    muzzleDevice: {
      ...defaultSlots.muzzleDevice,
      ...(raw.muzzleDevice || {}),
    },
    topAttachment: raw.topAttachment || null,
    lowerAttachment: raw.lowerAttachment || null,
  };
}

export default function App() {
  // Navigation mode: Main Menu vs Active Game Workshop
  const [isInMainMenu, setIsInMainMenu] = useState<boolean>(true);

  // Debug & Cheat mode (toggled via code 3689 in settings console)
  const [debugMode, setDebugMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DEBUG_KEY) === 'true';
  });

  const [isCheatPanelOpen, setIsCheatPanelOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isCivilianMarketOpen, setIsCivilianMarketOpen] = useState<boolean>(false);

  // Notification message for blueprint reset or game events
  const [blueprintNotice, setBlueprintNotice] = useState<string | null>(null);

  // Game core state
  const [country, setCountry] = useState<CountryId>('USSR');
  const [year, setYear] = useState<number>(1943);
  const [month, setMonth] = useState<number>(5);
  const [budget, setBudget] = useState<number>(380);
  const [reputation, setReputation] = useState<number>(40);
  const [unlockedTechs, setUnlockedTechs] = useState<string[]>([
    'stamped_metal',
    'intermediate_concept',
  ]);
  const [activeResearchId, setActiveResearchId] = useState<string | null>(null);
  const [researchWeeksLeft, setResearchWeeksLeft] = useState<number>(0);

  // Technical Specifications List & Active Order
  const [tzList, setTzList] = useState<TechnicalSpecification[]>(
    INITIAL_TECHNICAL_SPECIFICATIONS
  );
  const [currentTZ, setCurrentTZ] = useState<TechnicalSpecification>(
    INITIAL_TECHNICAL_SPECIFICATIONS[0]
  );

  // Custom cartridges & production contracts
  const [customCartridges, setCustomCartridges] = useState<Cartridge[]>([]);
  const [contracts, setContracts] = useState<ProductionContract[]>([]);

  // Weapon Layout & Slots
  const [layout, setLayout] = useState<WeaponLayout>('classic');
  const [activeSlot, setActiveSlot] = useState<keyof WeaponSlots>('barrel');

  const [slots, setSlots] = useState<WeaponSlots>(() => {
    const tokarev = BASE_CARTRIDGES.find((c) => c.id === '7.62x25') || BASE_CARTRIDGES[1];
    return {
      cartridge: tokarev,
      barrel: {
        length: 250,
        twist: 240,
        profile: 'medium',
        material: 'steel',
        thread: 'none',
        rifled: true,
      },
      action: { ...ACTIONS_PRESETS[1], gasAdjustable: false }, // blowback
      receiver: RECEIVERS_PRESETS[1], // stamped steel
      magazine: {
        type: 'box',
        capacity: 35,
        position: 'front',
        material: 'steel',
        techLevel: 1935,
      },
      trigger: {
        mode: 'auto',
        type: 'direct',
        pullLength: 40,
        safety: true,
        cost: 2.0,
      },
      stock: {
        type: 'fixedWood',
        length: 300,
        recoilDamper: false,
        techLevel: 1935,
      },
      topInterface: TOP_INTERFACES_PRESETS[1], // dovetail 11mm
      handguard: HANDGUARD_PRESETS[0], // wood
      muzzleDevice: MUZZLE_PRESETS[0], // none
      topAttachment: null,
      lowerAttachment: null,
    };
  });

  // Saved game detection for Continue button
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEY);
  });

  const [savedGameSummary, setSavedGameSummary] = useState<{
    country: CountryId;
    year: number;
    budget: number;
    tzTitle: string;
  } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        return {
          country: p.country,
          year: p.year,
          budget: p.budget,
          tzTitle: p.currentTZ?.title || 'Госзаказ',
        };
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Modals & Overlays
  const [activeModal, setActiveModal] = useState<
    'none' | 'tenders' | 'research' | 'production' | 'customCaliber' | 'countrySwitch'
  >('none');
  const [isContestOpen, setIsContestOpen] = useState<boolean>(false);
  const [isFiringRangeOpen, setIsFiringRangeOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.sfxMuted && sounds.musicMuted);

  // Auto-save game state to localStorage
  const saveGameState = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stateToSave = {
        country,
        year,
        month,
        budget,
        reputation,
        unlockedTechs,
        activeResearchId,
        researchWeeksLeft,
        currentTZ,
        tzList,
        customCartridges,
        contracts,
        layout,
        slots,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      setHasSavedGame(true);
      setSavedGameSummary({
        country,
        year,
        budget,
        tzTitle: currentTZ.title,
      });
    } catch {
      // storage quota or private browsing
    }
  }, [
    country,
    year,
    month,
    budget,
    reputation,
    unlockedTechs,
    activeResearchId,
    researchWeeksLeft,
    currentTZ,
    tzList,
    customCartridges,
    contracts,
    layout,
    slots,
  ]);

  // Persist state on meaningful changes
  useEffect(() => {
    if (!isInMainMenu) {
      saveGameState();
    }
  }, [budget, reputation, year, month, currentTZ, layout, slots, isInMainMenu, saveGameState]);

  // Handle continuing from save
  const handleContinueGame = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setCountry(p.country || 'USSR');
        setYear(p.year || 1943);
        setMonth(p.month || 5);
        setBudget(p.budget ?? 380);
        setReputation(p.reputation ?? 40);
        setUnlockedTechs(p.unlockedTechs || ['stamped_metal', 'intermediate_concept']);
        setActiveResearchId(p.activeResearchId || null);
        setResearchWeeksLeft(p.researchWeeksLeft || 0);
        if (p.currentTZ) setCurrentTZ(p.currentTZ);
        if (p.tzList) setTzList(p.tzList);
        if (p.customCartridges) setCustomCartridges(p.customCartridges);
        if (p.contracts) setContracts(p.contracts);
        if (p.layout) setLayout(p.layout);
        if (p.slots) setSlots(sanitizeSavedSlots(p.slots));

        setIsInMainMenu(false);
        sounds.playBoltCycle();
        sounds.startMusic();
      }
    } catch {
      // fallback
    }
  };

  // =========================================================================
  // RESET BLUEPRINT LOGIC FOR A NEW ORDER
  // "когда берется новый заказ нужно обнулять Блупринт"
  // =========================================================================
  const resetBlueprintForTZ = useCallback(
    (tz: TechnicalSpecification, selectedCountry: CountryId = country) => {
      sounds.playPaperRustle();
      sounds.playBoltCycle();

      // 1. Pick ideal starting cartridge matching requiredClass and country doctrine
      let chosenCartridge: Cartridge;
      if (tz.weaponType === 'pistol') {
        chosenCartridge =
          selectedCountry === 'USSR'
            ? tz.year >= 1951
              ? BASE_CARTRIDGES.find((c) => c.id === '9x18') || BASE_CARTRIDGES[1]
              : BASE_CARTRIDGES.find((c) => c.id === '7.62x25') || BASE_CARTRIDGES[1]
            : BASE_CARTRIDGES.find((c) => c.id === '45acp') || BASE_CARTRIDGES[0];
      } else if (tz.requiredClass === 'pistol') {
        chosenCartridge =
          selectedCountry === 'USSR'
            ? BASE_CARTRIDGES.find((c) => c.id === '7.62x25') || BASE_CARTRIDGES[1]
            : BASE_CARTRIDGES.find((c) => c.id === '9x19') || BASE_CARTRIDGES[0];
      } else if (tz.requiredClass === 'intermediate') {
        if (selectedCountry === 'USSR') {
          chosenCartridge =
            tz.year >= 1974
              ? BASE_CARTRIDGES.find((c) => c.id === '5.45x39') || BASE_CARTRIDGES[4]
              : BASE_CARTRIDGES.find((c) => c.id === '7.62x39') || BASE_CARTRIDGES[2];
        } else {
          chosenCartridge =
            BASE_CARTRIDGES.find((c) => c.id === '5.56x45') || BASE_CARTRIDGES[3];
        }
      } else {
        // rifle
        chosenCartridge =
          selectedCountry === 'USSR'
            ? BASE_CARTRIDGES.find((c) => c.id === '7.62x54R') || BASE_CARTRIDGES[5]
            : BASE_CARTRIDGES.find((c) => c.id === '308win') || BASE_CARTRIDGES[6];
      }

      // 2. Set barrel dimensions suited for the weapon class
      let barrelLen = 415;
      if (tz.weaponType === 'pistol') barrelLen = selectedCountry === 'USSR' ? 116 : 127;
      else if (tz.weaponType === 'submachineGun') barrelLen = 250;
      else if (tz.weaponType === 'sniperRifle') barrelLen = 620;
      else if (tz.weaponType === 'battleRifle') barrelLen = 520;
      else if (tz.title.toLowerCase().includes('компакт')) barrelLen = 310;

      // Optimal twist according to Greenhill formula
      const optTwist = Math.round(
        (30 * (chosenCartridge.bulletDiameter * chosenCartridge.bulletDiameter)) /
          chosenCartridge.bulletMass
      );

      // 3. Reset Action
      const actionPreset =
        tz.weaponType === 'pistol'
          ? ACTIONS_PRESETS[4] // short recoil
          : tz.weaponType === 'submachineGun'
          ? ACTIONS_PRESETS[1] // blowback
          : tz.weaponType === 'sniperRifle' && tz.market === 'civilian'
          ? ACTIONS_PRESETS[0] // bolt action
          : ACTIONS_PRESETS[3]; // gas piston

      // 4. Reset Magazine capacity & placement
      let magCap = 30;
      let magPos: 'front' | 'rear' | 'grip' = 'front';
      if (tz.weaponType === 'pistol') {
        magCap = selectedCountry === 'USA' ? 7 : 8;
        magPos = 'grip';
      } else if (tz.weaponType === 'submachineGun') {
        magCap = 35;
      } else if (tz.weaponType === 'sniperRifle') {
        magCap = 10;
      } else if (tz.weaponType === 'battleRifle' && tz.market === 'civilian') {
        magCap = 5;
      }

      // 5. Build clean, pristine blueprint slots
      const cleanSlots: WeaponSlots = {
        cartridge: chosenCartridge,
        barrel: {
          length: barrelLen,
          twist: optTwist,
          profile: 'medium',
          material: 'steel',
          thread: 'none',
          rifled: true,
        },
        action: { ...actionPreset, gasAdjustable: false },
        receiver:
          selectedCountry === 'USSR' ? RECEIVERS_PRESETS[1] : RECEIVERS_PRESETS[0],
        magazine: {
          type: 'box',
          capacity: magCap,
          position: magPos,
          material: 'steel',
          techLevel: 1935,
        },
        trigger: {
          mode: tz.weaponType === 'pistol' || tz.weaponType === 'sniperRifle' ? 'single' : 'both',
          type: 'direct',
          pullLength: tz.weaponType === 'pistol' ? 22 : 35,
          safety: true,
          cost: tz.weaponType === 'pistol' ? 1.5 : 2.0,
        },
        stock: {
          type: tz.weaponType === 'pistol' ? 'none' : tz.weaponType === 'submachineGun' ? 'folding' : 'fixedWood',
          length: tz.weaponType === 'pistol' ? 0 : 300,
          recoilDamper: false,
          techLevel: 1935,
        },
        topInterface: tz.weaponType === 'pistol' ? TOP_INTERFACES_PRESETS[0] : TOP_INTERFACES_PRESETS[1],
        handguard: tz.weaponType === 'pistol' ? HANDGUARD_PRESETS[4] : HANDGUARD_PRESETS[0],
        muzzleDevice: MUZZLE_PRESETS[0], // none
        topAttachment: null, // Clear all scopes
        lowerAttachment: null, // Clear all grips/bipods
      };

      setLayout('classic');
      setSlots(cleanSlots);
      setActiveSlot('barrel');

      // Show feedback banner
      setBlueprintNotice(
        `Чертёж оружия обнулён и перенастроен под требования ТЗ: «${tz.title}»`
      );
      setTimeout(() => setBlueprintNotice(null), 4500);
    },
    [country]
  );

  // Start a fresh New Game
  const handleStartNewGame = (
    chosenCountry: CountryId,
    startingTZ: TechnicalSpecification
  ) => {
    const profile = COUNTRY_PROFILES[chosenCountry];
    setCountry(chosenCountry);
    setYear(startingTZ.year);
    setMonth(5);
    setBudget(profile.startingBudget);
    setReputation(profile.startingReputation);
    setUnlockedTechs(['stamped_metal', 'intermediate_concept']);
    setActiveResearchId(null);
    setResearchWeeksLeft(0);
    setContracts([]);
    setCustomCartridges([]);

    // Filter/set TZs with startingTZ at top
    const remaining = INITIAL_TECHNICAL_SPECIFICATIONS.filter(
      (t) => t.id !== startingTZ.id
    );
    setTzList([startingTZ, ...remaining]);
    setCurrentTZ(startingTZ);

    // Reset blueprint for this starting order
    resetBlueprintForTZ(startingTZ, chosenCountry);

    setIsInMainMenu(false);
    sounds.startMusic();
  };

  // Toggle debug / cheat mode (persisted)
  const handleToggleDebugMode = (enabled: boolean) => {
    setDebugMode(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEBUG_KEY, enabled ? 'true' : 'false');
    }
  };

  // Audio mute toggler
  const handleToggleMute = () => {
    const sfx = sounds.toggleSfxMute();
    const music = sounds.toggleMusicMute();
    setIsMuted(sfx && music);
  };

  // Generate dynamic new orders
  const handleGenerateNewTZ = () => {
    sounds.playBoltCycle();
    const newTZ = generateDynamicTZ(year, country);
    setTzList((prev) => [newTZ, ...prev]);
  };

  // Real-time Physics & Constraints calculation
  const derived = useMemo(() => {
    return calculateDerivedStats(
      slots,
      layout,
      country,
      currentTZ.targetBatchSize,
      currentTZ.climate
    );
  }, [slots, layout, country, currentTZ]);

  const issues = useMemo(() => {
    return validateWeapon(slots, year, unlockedTechs, layout);
  }, [slots, year, unlockedTechs, layout]);

  const hasErrors = issues.some((i) => i.type === 'error');

  // Slot updates
  const handleUpdateSlots = (updated: Partial<WeaponSlots>) => {
    sounds.playMechanicalClick();
    setSlots((prev) => ({ ...prev, ...updated }));
  };

  const handleToggleLayout = (newLayout: WeaponLayout) => {
    sounds.playBoltCycle();
    setLayout(newLayout);
  };

  const handleSelectSlot = (slot: keyof WeaponSlots) => {
    sounds.playMechanicalClick();
    setActiveSlot(slot);
  };

  // Quick Archetype Presets loader
  const handleApplyPreset = (presetId: string) => {
    sounds.playBoltCycle();
    if (presetId === 'smg_1943') {
      const tokarev = BASE_CARTRIDGES.find((c) => c.id === '7.62x25') || BASE_CARTRIDGES[1];
      setLayout('classic');
      setSlots((prev) => ({
        ...prev,
        cartridge: tokarev,
        barrel: { length: 250, twist: 240, profile: 'medium', material: 'steel', thread: 'none', rifled: true },
        action: { ...ACTIONS_PRESETS[1], gasAdjustable: false },
        receiver: RECEIVERS_PRESETS[1],
        magazine: { type: 'box', capacity: 35, position: 'front', material: 'steel', techLevel: 1935 },
        trigger: { mode: 'auto', type: 'direct', pullLength: 40, safety: true, cost: 2.0 },
        stock: { type: 'fixedWood', length: 300, recoilDamper: false, techLevel: 1935 },
        topInterface: TOP_INTERFACES_PRESETS[1],
        handguard: HANDGUARD_PRESETS[0],
        muzzleDevice: MUZZLE_PRESETS[0],
        topAttachment: null,
        lowerAttachment: null,
      }));
    } else if (presetId === 'ak_1947') {
      const m43 = BASE_CARTRIDGES.find((c) => c.id === '7.62x39') || BASE_CARTRIDGES[2];
      setLayout('classic');
      setSlots((prev) => ({
        ...prev,
        cartridge: m43,
        barrel: { length: 415, twist: 240, profile: 'medium', material: 'steel', thread: 'M14', rifled: true },
        action: { ...ACTIONS_PRESETS[3], gasAdjustable: true },
        receiver: RECEIVERS_PRESETS[1],
        magazine: { type: 'box', capacity: 30, position: 'front', material: 'steel', techLevel: 1935 },
        trigger: { mode: 'both', type: 'direct', pullLength: 35, safety: true, cost: 2.0 },
        stock: { type: 'fixedWood', length: 300, recoilDamper: false, techLevel: 1935 },
        topInterface: TOP_INTERFACES_PRESETS[1],
        handguard: HANDGUARD_PRESETS[1],
        muzzleDevice: MUZZLE_PRESETS[1],
        topAttachment: null,
        lowerAttachment: null,
      }));
    } else if (presetId === 'ak_1974') {
      const ak74 = BASE_CARTRIDGES.find((c) => c.id === '5.45x39') || BASE_CARTRIDGES[4];
      setLayout('classic');
      setSlots((prev) => ({
        ...prev,
        cartridge: ak74,
        barrel: { length: 415, twist: 200, profile: 'medium', material: 'steel', thread: 'M18', rifled: true },
        action: { ...ACTIONS_PRESETS[3], gasAdjustable: true },
        receiver: RECEIVERS_PRESETS[1],
        magazine: { type: 'box', capacity: 30, position: 'front', material: 'polymer', techLevel: 1965 },
        trigger: { mode: 'both', type: 'direct', pullLength: 30, safety: true, cost: 2.0 },
        stock: { type: 'fixedWood', length: 300, recoilDamper: false, techLevel: 1935 },
        topInterface: TOP_INTERFACES_PRESETS[1],
        handguard: HANDGUARD_PRESETS[2],
        muzzleDevice: MUZZLE_PRESETS[2],
        topAttachment: null,
        lowerAttachment: null,
      }));
    } else if (presetId === 'svd_1963') {
      const r54 = BASE_CARTRIDGES.find((c) => c.id === '7.62x54R') || BASE_CARTRIDGES[5];
      setLayout('classic');
      setSlots((prev) => ({
        ...prev,
        cartridge: r54,
        barrel: { length: 620, twist: 240, profile: 'medium', material: 'steel', thread: 'M14', rifled: true },
        action: { ...ACTIONS_PRESETS[3], gasAdjustable: true },
        receiver: RECEIVERS_PRESETS[0],
        magazine: { type: 'box', capacity: 10, position: 'front', material: 'steel', techLevel: 1935 },
        trigger: { mode: 'single', type: 'twoStage', pullLength: 25, safety: true, cost: 2.0 },
        stock: { type: 'fixedWood', length: 320, recoilDamper: true, techLevel: 1935 },
        topInterface: TOP_INTERFACES_PRESETS[3],
        handguard: HANDGUARD_PRESETS[1],
        muzzleDevice: MUZZLE_PRESETS[1],
        topAttachment: ATTACHMENTS_CATALOG[1],
        lowerAttachment: null,
      }));
    } else if (presetId === 'hunt_308') {
      const win308 = BASE_CARTRIDGES.find((c) => c.id === '308win') || BASE_CARTRIDGES[6];
      setLayout('classic');
      setSlots((prev) => ({
        ...prev,
        cartridge: win308,
        barrel: { length: 610, twist: 280, profile: 'heavy', material: 'stainless', thread: 'none', rifled: true },
        action: { ...ACTIONS_PRESETS[0], gasAdjustable: false },
        receiver: RECEIVERS_PRESETS[0],
        magazine: { type: 'box', capacity: 5, position: 'front', material: 'steel', techLevel: 1935 },
        trigger: { mode: 'single', type: 'twoStage', pullLength: 20, safety: true, cost: 2.0 },
        stock: { type: 'fixedWood', length: 330, recoilDamper: true, techLevel: 1935 },
        topInterface: TOP_INTERFACES_PRESETS[3],
        handguard: HANDGUARD_PRESETS[0],
        muzzleDevice: MUZZLE_PRESETS[0],
        topAttachment: ATTACHMENTS_CATALOG[1],
        lowerAttachment: null,
      }));
    } else if (presetId === 'bullpup_556') {
      const nato556 = BASE_CARTRIDGES.find((c) => c.id === '5.56x45') || BASE_CARTRIDGES[3];
      setLayout('bullpup');
      setSlots((prev) => ({
        ...prev,
        cartridge: nato556,
        barrel: { length: 460, twist: 230, profile: 'medium', material: 'steel', thread: 'M14', rifled: true },
        action: { ...ACTIONS_PRESETS[3], gasAdjustable: true },
        receiver: RECEIVERS_PRESETS[1],
        magazine: { type: 'box', capacity: 30, position: 'rear', material: 'polymer', techLevel: 1965 },
        trigger: { mode: 'both', type: 'direct', pullLength: 35, safety: true, cost: 2.0 },
        stock: { type: 'polymer', length: 240, recoilDamper: true, techLevel: 1965 },
        topInterface: TOP_INTERFACES_PRESETS[4],
        handguard: HANDGUARD_PRESETS[3],
        muzzleDevice: MUZZLE_PRESETS[2],
        topAttachment: ATTACHMENTS_CATALOG[0],
        lowerAttachment: ATTACHMENTS_CATALOG[5],
      }));
    } else if (presetId === 'pistol_tt33') {
      const tokarev = BASE_CARTRIDGES.find((c) => c.id === '7.62x25') || BASE_CARTRIDGES[1];
      setLayout('classic');
      setSlots((prev) => ({
        ...prev,
        cartridge: tokarev,
        barrel: { length: 116, twist: 240, profile: 'light', material: 'steel', thread: 'none', rifled: true },
        action: { ...ACTIONS_PRESETS[4], gasAdjustable: false }, // short recoil
        receiver: RECEIVERS_PRESETS[0], // milled steel frame
        magazine: { type: 'box', capacity: 8, position: 'grip', material: 'steel', techLevel: 1935 },
        trigger: { mode: 'single', type: 'direct', pullLength: 20, safety: true, cost: 1.5 },
        stock: { type: 'none', length: 0, recoilDamper: false, techLevel: 1935 },
        topInterface: TOP_INTERFACES_PRESETS[0], // none
        handguard: HANDGUARD_PRESETS[4], // none
        muzzleDevice: MUZZLE_PRESETS[0], // none
        topAttachment: null,
        lowerAttachment: null,
      }));
    } else if (presetId === 'pistol_m1911') {
      const acp45 = BASE_CARTRIDGES.find((c) => c.id === '45acp') || BASE_CARTRIDGES[0];
      setLayout('classic');
      setSlots((prev) => ({
        ...prev,
        cartridge: acp45,
        barrel: { length: 127, twist: 400, profile: 'medium', material: 'steel', thread: 'none', rifled: true },
        action: { ...ACTIONS_PRESETS[4], gasAdjustable: false }, // short recoil Browning
        receiver: RECEIVERS_PRESETS[0], // forged/milled steel frame
        magazine: { type: 'box', capacity: 7, position: 'grip', material: 'steel', techLevel: 1935 },
        trigger: { mode: 'single', type: 'direct', pullLength: 18, safety: true, cost: 2.0 },
        stock: { type: 'none', length: 0, recoilDamper: false, techLevel: 1935 },
        topInterface: TOP_INTERFACES_PRESETS[0], // none
        handguard: HANDGUARD_PRESETS[4], // none
        muzzleDevice: MUZZLE_PRESETS[0], // none
        topAttachment: null,
        lowerAttachment: null,
      }));
    }
  };

  // Start research
  const handleStartResearch = (techId: string, cost: number, weeks: number) => {
    if (budget < cost) return;
    sounds.playBoltCycle();
    setBudget((b) => b - cost);
    setActiveResearchId(techId);
    setResearchWeeksLeft(weeks);
  };

  // Advance time
  const handleAdvanceMonth = () => {
    sounds.playBoltCycle();
    setMonth((m) => {
      let nextMonth = m + 1;
      let nextYear = year;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = year + 1;
        setYear(nextYear);
      }

      // Progress active research
      if (activeResearchId && researchWeeksLeft > 0) {
        const remaining = Math.max(0, researchWeeksLeft - 4);
        setResearchWeeksLeft(remaining);
        if (remaining === 0) {
          sounds.playSuccessChime();
          setUnlockedTechs((prev) => [...prev, activeResearchId]);
          setActiveResearchId(null);
        }
      }

      // Collect production revenue
      let monthlyNetProfit = 0;
      setContracts((prev) =>
        prev.map((c) => {
          if (!c.active) return c;
          const toProduce = Math.min(c.monthlyProduction, c.batchSize - c.producedSoFar);
          const newProduced = c.producedSoFar + toProduce;
          const profit = Math.round((c.unitRevenue - c.unitCost) * (toProduce / 1000));
          monthlyNetProfit += profit;
          return {
            ...c,
            producedSoFar: newProduced,
            active: newProduced < c.batchSize,
          };
        })
      );
      setBudget((b) => b + monthlyNetProfit + 15);

      return nextMonth;
    });
  };

  // Contest evaluation finish handler
  const handleFinishContest = (result: ContestResult) => {
    setIsContestOpen(false);
    if (result.verdict === 'accepted' || result.verdict === 'accepted_with_notes') {
      sounds.playSuccessChime();
      setBudget((b) => b + result.payout);
      setReputation((r) => Math.min(100, r + result.reputationGain));

      // Open new manufacturing contract
      const newContract: ProductionContract = {
        id: `contract_${Date.now()}`,
        name: `Госзаказ: ${currentTZ.title}`,
        weaponName: `${currentTZ.weaponTypeName} КБ-ОБР-${derived.velocity}`,
        type: currentTZ.market === 'civilian' ? 'civilian' : 'military',
        batchSize: currentTZ.targetBatchSize,
        producedSoFar: 0,
        unitRevenue: Number((derived.unitCost * 1.35).toFixed(1)),
        unitCost: derived.unitCost,
        monthlyProduction: Math.round(currentTZ.targetBatchSize / 10),
        active: true,
      };
      setContracts((c) => [newContract, ...c]);
    } else {
      sounds.playMechanicalClick();
      setReputation((r) => Math.max(5, r + result.reputationGain));
    }
  };

  // Add custom caliber
  const handleSaveCustomCartridge = (newCartridge: Cartridge) => {
    sounds.playSuccessChime();
    setCustomCartridges((prev) => [...prev, newCartridge]);
    setSlots((prev) => ({ ...prev, cartridge: newCartridge }));
    setBudget((b) => b - 65);
    setActiveModal('none');
  };

  // =========================================================================
  // VIEW ROUTING: MAIN MENU OR WORKSHOP
  // =========================================================================
  if (isInMainMenu) {
    return (
      <>
        <MainMenu
          hasSavedGame={hasSavedGame}
          savedGameInfo={savedGameSummary}
          allInitialTZs={tzList}
          onContinue={handleContinueGame}
          onStartNewGame={handleStartNewGame}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
        />

        {/* Global Settings & Console Modal */}
        {isSettingsOpen && (
          <SettingsModal
            debugMode={debugMode}
            onToggleDebugMode={handleToggleDebugMode}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}

        {/* Global About Modal */}
        {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
      </>
    );
  }

  // =========================================================================
  // ACTIVE WORKSHOP VIEW (Widescreen 1920x1024 friendly, no top clipping)
  // =========================================================================
  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Landscape Orientation Advisory for Tablets & Mobile */}
      <div className="hidden portrait:flex fixed bottom-3 left-3 right-3 z-50 rounded-xl border border-cyan-500/40 bg-slate-950/95 p-3 backdrop-blur-md shadow-2xl items-center justify-between text-xs font-mono text-cyan-300 animate-fadeIn">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🔄</span>
          <span>Для чертёжного стола рекомендуется ландшафтный режим: поверните планшет горизонтально.</span>
        </div>
      </div>

      {/* 1. Universal Top Navigation Bar */}
      <HeaderNav
        activeView={
          activeModal === 'none'
            ? 'workshop'
            : activeModal === 'tenders'
            ? 'tenders'
            : activeModal === 'research'
            ? 'research'
            : activeModal === 'production'
            ? 'production'
            : 'customCaliber'
        }
        hasActiveErrors={hasErrors}
        isMuted={isMuted}
        debugMode={debugMode}
        onToggleMute={handleToggleMute}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMainMenu={() => {
          sounds.playMechanicalClick();
          setIsInMainMenu(true);
        }}
        onOpenCheatPanel={() => {
          sounds.playCheatCodeSound(true);
          setIsCheatPanelOpen(true);
        }}
        onOpenCivilianMarket={() => {
          sounds.playMechanicalClick();
          setIsCivilianMarketOpen(true);
        }}
        onNavigate={(view) => {
          sounds.playMechanicalClick();
          if (view === 'workshop') setActiveModal('none');
          else setActiveModal(view);
        }}
      />

      {/* 2. Sub-Header Bureau Dashboard & Context Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 px-4 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Страна:</span>
            <button
              onClick={() => setActiveModal('countrySwitch')}
              className="text-cyan-300 font-bold hover:underline"
            >
              {COUNTRY_PROFILES[country].name}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Календарь:</span>
            <span className="text-slate-100 font-bold">
              {year} год · Месяц {month}
            </span>
            <button
              onClick={handleAdvanceMonth}
              title="Перейти к следующему месяцу разработки и производства"
              className="ml-1 text-[11px] text-cyan-400 hover:text-cyan-300 border border-cyan-800/60 rounded px-1.5 py-0.5 bg-cyan-950/40"
            >
              +1 мес.
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Бюджет КБ:</span>
            <span className="text-emerald-400 font-bold">{budget} ©</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Репутация:</span>
            <span className="text-cyan-300 font-bold">{reputation}/100</span>
          </div>
        </div>

        {/* Current Active TZ indicator */}
        <div className="flex items-center gap-3">
          <div className="text-slate-400 truncate max-w-md">
            Активное ТЗ:{' '}
            <span className="text-slate-200 font-sans font-medium">
              {currentTZ.title}
            </span>{' '}
            <span className="text-amber-400 font-mono">[{currentTZ.climate}]</span>
          </div>
          <button
            onClick={() => setActiveModal('tenders')}
            className="text-[11px] font-sans text-cyan-400 hover:text-cyan-300 underline shrink-0"
          >
            Сменить ТЗ
          </button>
        </div>
      </div>

      {/* Blueprint Reset Notification Toast */}
      {blueprintNotice && (
        <div className="bg-cyan-950/80 border-b border-cyan-500/40 px-6 py-2 text-xs font-mono text-cyan-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>📐</span>
            <span>{blueprintNotice}</span>
          </div>
          <button
            onClick={() => setBlueprintNotice(null)}
            className="text-slate-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Main Design Workshop View (Blueprint + Slots Configurator + TTX Panel) */}
      <main className="flex-1 px-4 lg:px-8 py-5 max-w-[1920px] w-full mx-auto flex flex-col gap-5">
        {/* Blueprint 2D Schematic Canvas */}
        <BlueprintCanvas
          slots={slots}
          layout={layout}
          derived={derived}
          activeSlot={activeSlot}
          onSelectSlot={handleSelectSlot}
          issues={issues}
          onOpenFiringRange={() => setIsFiringRangeOpen(true)}
        />

        {/* Two-Column Split: Slot Configurator on Left, Physics & TTX on Right */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <div className="xl:col-span-7 flex flex-col gap-4">
            <SlotSelector
              slots={slots}
              layout={layout}
              currentYear={year}
              unlockedTechs={unlockedTechs}
              activeSlot={activeSlot}
              customCartridges={customCartridges}
              optimalTwist={derived.optimalTwist}
              onSelectSlot={handleSelectSlot}
              onUpdateSlots={handleUpdateSlots}
              onToggleLayout={handleToggleLayout}
              onApplyPreset={handleApplyPreset}
            />
          </div>

          <div className="xl:col-span-5 flex flex-col gap-4">
            <TTXPanel
              derived={derived}
              slots={slots}
              tz={currentTZ}
              issues={issues}
              onSubmitToContest={() => {
                sounds.playBoltCycle();
                setIsContestOpen(true);
              }}
            />
          </div>
        </div>
      </main>

      {/* 4. Modals & Overlays */}
      {/* Tender Modal */}
      {activeModal === 'tenders' && (
        <TenderModal
          country={country}
          currentYear={year}
          activeTZId={currentTZ.id}
          allTZList={tzList}
          onGenerateNewTZ={handleGenerateNewTZ}
          onSelectTZ={(selectedTZ) => {
            setCurrentTZ(selectedTZ);
            resetBlueprintForTZ(selectedTZ);
            setActiveModal('none');
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Research Tree Modal */}
      {activeModal === 'research' && (
        <ResearchTree
          unlockedTechs={unlockedTechs}
          activeResearchId={activeResearchId}
          researchWeeksLeft={researchWeeksLeft}
          currentBudget={budget}
          currentYear={year}
          onStartResearch={handleStartResearch}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Production View Modal */}
      {activeModal === 'production' && (
        <ProductionView
          contracts={contracts}
          country={country}
          budget={budget}
          onAdvanceMonth={handleAdvanceMonth}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Custom Caliber Modal */}
      {activeModal === 'customCaliber' && (
        <CustomCaliberModal
          currentYear={year}
          currentBudget={budget}
          onSaveCartridge={handleSaveCustomCartridge}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Contest & Trials Range Screen */}
      {isContestOpen && (
        <ContestView
          tz={currentTZ}
          derived={derived}
          slots={slots}
          country={country}
          onFinishContest={handleFinishContest}
          onCancel={() => setIsContestOpen(false)}
        />
      )}

      {/* Workshop Firing Range 100m Test Modal */}
      {isFiringRangeOpen && (
        <FiringRangeModal
          slots={slots}
          derived={derived}
          onClose={() => setIsFiringRangeOpen(false)}
        />
      )}

      {/* Settings Modal (with Code 3689 Console) */}
      {isSettingsOpen && (
        <SettingsModal
          debugMode={debugMode}
          onToggleDebugMode={handleToggleDebugMode}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* About Modal */}
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}

      {/* Cheat & Debug Panel (Accessible when Code 3689 entered) */}
      {isCheatPanelOpen && (
        <CheatPanel
          budget={budget}
          reputation={reputation}
          onAddBudget={(amt) => setBudget((b) => b + amt)}
          onAddReputation={(amt) => setReputation((r) => Math.min(100, r + amt))}
          onUnlockAllTech={() => {
            const allIds = TECH_TREE_NODES.map((t) => t.id);
            setUnlockedTechs(allIds);
            setActiveResearchId(null);
            setResearchWeeksLeft(0);
          }}
          onAdvanceYear={() => {
            setYear((y) => y + 1);
            setBudget((b) => b + 100);
          }}
          onDisableCheats={() => {
            handleToggleDebugMode(false);
          }}
          onClose={() => setIsCheatPanelOpen(false)}
        />
      )}

      {/* Country Switcher Modal */}
      {activeModal === 'countrySwitch' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-cyan-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">
              Выбор страны и школы конструирования
            </h3>
            <div className="mt-4 space-y-3">
              {(['USSR', 'USA'] as CountryId[]).map((cId) => {
                const profile = COUNTRY_PROFILES[cId];
                const isSelected = country === cId;
                return (
                  <button
                    key={cId}
                    onClick={() => {
                      sounds.playMechanicalClick();
                      setCountry(cId);
                      setActiveModal('none');
                    }}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-100">{profile.name}</div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {profile.desc}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setActiveModal('none')}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Civilian Commercial Market Modal */}
      {isCivilianMarketOpen && (
        <CivilianMarket
          weapon={slots}
          derived={derived}
          country={country}
          budget={budget}
          onClose={() => setIsCivilianMarketOpen(false)}
          onSwitchToSemiAuto={() => {
            setSlots((prev) => ({
              ...prev,
              trigger: {
                ...prev.trigger,
                mode: 'single',
              },
            }));
            sounds.playClick();
          }}
          onLaunchProduct={(product, marketingCost) => {
            setBudget((prev) => Math.max(0, prev - marketingCost));
            const newContract: ProductionContract = {
              id: product.id,
              name: product.name,
              weaponName: product.weaponName,
              type: 'civilian',
              batchSize: 4000,
              producedSoFar: 0,
              unitRevenue: product.retailPrice,
              unitCost: product.unitCost,
              monthlyProduction: product.monthlySales,
              active: true,
            };
            setContracts((prev) => [newContract, ...prev]);
            sounds.playSuccess();
          }}
        />
      )}

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-900/80 bg-slate-950 py-3 px-6 text-center text-xs text-slate-600 font-mono">
        Конструкторское бюро: Оружейный инженер · Экономическая стратегия проектирования стрелкового оружия
      </footer>
    </div>
  );
}
