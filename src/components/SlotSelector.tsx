import React from 'react';
import {
  WeaponSlots,
  WeaponLayout,
  Cartridge,
  BarrelProfile,
  BarrelMaterial,
  BarrelThread,
  ActionType,
  ReceiverMethod,
  ReceiverMaterial,
  MagazineType,
  MagazineMaterial,
  TriggerMode,
  TriggerType,
  StockType,
  InterfaceType,
  LowerInterfaceType,
  HandguardMaterial,
  MuzzleType,
  Attachment,
} from '../types';
import {
  BASE_CARTRIDGES,
  ACTIONS_PRESETS,
  RECEIVERS_PRESETS,
  TOP_INTERFACES_PRESETS,
  HANDGUARD_PRESETS,
  MUZZLE_PRESETS,
  ATTACHMENTS_CATALOG,
} from '../data/database';

interface SlotSelectorProps {
  slots: WeaponSlots;
  layout: WeaponLayout;
  currentYear: number;
  unlockedTechs: string[];
  activeSlot: keyof WeaponSlots;
  customCartridges: Cartridge[];
  optimalTwist?: number;
  onSelectSlot: (slot: keyof WeaponSlots) => void;
  onUpdateSlots: (updated: Partial<WeaponSlots>) => void;
  onToggleLayout: (layout: WeaponLayout) => void;
  onApplyPreset?: (presetId: string) => void;
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({
  slots,
  layout,
  currentYear,
  unlockedTechs,
  activeSlot,
  customCartridges,
  optimalTwist,
  onSelectSlot,
  onUpdateSlots,
  onToggleLayout,
  onApplyPreset,
}) => {
  const allCartridges = [...BASE_CARTRIDGES, ...customCartridges];

  const slotTabs: { key: keyof WeaponSlots; label: string }[] = [
    { key: 'cartridge', label: 'Патрон' },
    { key: 'barrel', label: 'Ствол' },
    { key: 'action', label: 'Автоматика' },
    { key: 'receiver', label: 'Ресивер' },
    { key: 'magazine', label: 'Магазин' },
    { key: 'trigger', label: 'УСМ' },
    { key: 'stock', label: 'Приклад' },
    { key: 'topInterface', label: 'Планка' },
    { key: 'handguard', label: 'Цевьё' },
    { key: 'muzzleDevice', label: 'Дульное' },
    { key: 'topAttachment', label: 'Прицел' },
    { key: 'lowerAttachment', label: 'Обвес' },
  ];

  const isTechAvailable = (techYear: number, techId?: string) => {
    if (techId && unlockedTechs.includes(techId)) return true;
    return currentYear >= techYear;
  };

  const presetList = [
    { id: 'pistol_tt33', label: 'Пистолет ТТ' },
    { id: 'pistol_m1911', label: 'Пистолет M1911' },
    { id: 'smg_1943', label: 'ПП 7.62×25' },
    { id: 'ak_1947', label: 'Автомат 7.62×39' },
    { id: 'ak_1974', label: 'Автомат 5.45×39' },
    { id: 'svd_1963', label: 'Винтовка 7.62×54R' },
    { id: 'hunt_308', label: 'Охотничий .308' },
    { id: 'bullpup_556', label: 'Булл-пап 5.56' },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg backdrop-blur-md">
      {/* Quick Concept Presets Strip */}
      {onApplyPreset && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3 mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mr-1">
            Концепции:
          </span>
          {presetList.map((p) => (
            <button
              key={p.id}
              onClick={() => onApplyPreset(p.id)}
              className="px-2.5 py-1 text-xs rounded border border-slate-800 bg-slate-950 text-slate-300 hover:border-cyan-500/60 hover:text-cyan-300 transition-colors whitespace-nowrap"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Top Bar with Layout switch & Slot tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Layout Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => onToggleLayout('classic')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              layout === 'classic'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Классика
          </button>
          <button
            onClick={() => onToggleLayout('bullpup')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              layout === 'bullpup'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Булл-пап (Bullpup)
          </button>
        </div>

        {/* Slot Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto subtle-scroll py-1 max-w-full">
          {slotTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onSelectSlot(tab.key)}
              className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                activeSlot === tab.key
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Content Panel for Active Slot */}
      <div className="mt-4">
        {/* 1. CARTRIDGE */}
        {activeSlot === 'cartridge' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Выбор базового патрона
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {allCartridges.map((c) => {
                const available = isTechAvailable(c.techLevel);
                const isSelected = slots.cartridge.id === c.id;
                return (
                  <button
                    key={c.id}
                    disabled={!available}
                    onClick={() => onUpdateSlots({ cartridge: c })}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : available
                        ? 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                        : 'border-slate-800/40 bg-slate-950/20 opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100">{c.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase">
                        {c.class}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-slate-400">
                      Пуля {c.bulletMass}г · {c.maxPressure} бар · vRef {c.vRef} м/с
                    </div>
                    {!available && (
                      <span className="mt-2 text-[10px] text-rose-400">
                        Доступен с {c.techLevel} г.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. BARREL */}
        {activeSlot === 'barrel' && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Параметры ствольной группы
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Length Slider */}
              <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Длина ствола:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {slots.barrel.length} мм
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlots({
                        barrel: { ...slots.barrel, length: Math.max(80, slots.barrel.length - 10) },
                      })
                    }
                    className="h-8 w-8 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center shrink-0 text-sm border border-slate-700/60"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min="80"
                    max="760"
                    step="5"
                    value={slots.barrel.length}
                    onChange={(e) =>
                      onUpdateSlots({
                        barrel: { ...slots.barrel, length: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer h-2"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlots({
                        barrel: { ...slots.barrel, length: Math.min(760, slots.barrel.length + 10) },
                      })
                    }
                    className="h-8 w-8 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center shrink-0 text-sm border border-slate-700/60"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Влияет на начальную скорость пули, дульную энергию и общую массу.
                </span>
              </div>

              {/* Twist Slider */}
              <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Шаг нарезки (Twist):</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {slots.barrel.twist} мм/об
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlots({
                        barrel: { ...slots.barrel, twist: Math.max(140, slots.barrel.twist - 10) },
                      })
                    }
                    className="h-8 w-8 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center shrink-0 text-sm border border-slate-700/60"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min="140"
                    max="380"
                    step="10"
                    value={slots.barrel.twist}
                    onChange={(e) =>
                      onUpdateSlots({
                        barrel: { ...slots.barrel, twist: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer h-2"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlots({
                        barrel: { ...slots.barrel, twist: Math.min(380, slots.barrel.twist + 10) },
                      })
                    }
                    className="h-8 w-8 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center shrink-0 text-sm border border-slate-700/60"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="text-slate-500">
                    Оптимальный шаг под {slots.cartridge.bulletMass}г пулю.
                  </span>
                  {optimalTwist && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSlots({
                          barrel: { ...slots.barrel, twist: optimalTwist },
                        })
                      }
                      className="text-cyan-400 hover:text-cyan-300 underline font-mono"
                    >
                      Оптимум: {optimalTwist} мм
                    </button>
                  )}
                </div>
              </div>

              {/* Profile */}
              <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
                <span className="text-xs text-slate-300 font-medium block mb-2">
                  Профиль ствола
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'medium', 'heavy'] as BarrelProfile[]).map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        onUpdateSlots({ barrel: { ...slots.barrel, profile: p } })
                      }
                      className={`py-1.5 text-xs rounded border transition-colors ${
                        slots.barrel.profile === p
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-semibold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p === 'light' ? 'Лёгкий' : p === 'medium' ? 'Стандартный' : 'Тяжёлый'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thread & Material */}
              <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
                <span className="text-xs text-slate-300 font-medium block mb-2">
                  Резьба на дульном срезе (для ДТК и глушителя)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'M14', 'M18'] as BarrelThread[]).map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        onUpdateSlots({ barrel: { ...slots.barrel, thread: t } })
                      }
                      className={`py-1.5 text-xs rounded border transition-colors ${
                        slots.barrel.thread === t
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-semibold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'none' ? 'Без резьбы' : `Резьба ${t}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ACTION (АВТОМАТИКА) */}
        {activeSlot === 'action' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Принцип действия автоматики
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ACTIONS_PRESETS.map((act) => {
                const available = isTechAvailable(act.techLevel);
                const isSelected = slots.action.type === act.type;
                return (
                  <button
                    key={act.type}
                    disabled={!available}
                    onClick={() =>
                      onUpdateSlots({
                        action: {
                          ...act,
                          gasAdjustable: slots.action.gasAdjustable,
                        },
                      })
                    }
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : available
                        ? 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                        : 'border-slate-800/40 bg-slate-950/20 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-100">
                        {act.type === 'manual'
                          ? 'Ручная (болт/помпа)'
                          : act.type === 'blowback'
                          ? 'Свободный затвор'
                          : act.type === 'delayedBlowback'
                          ? 'Полусвободный затвор'
                          : act.type === 'gas'
                          ? 'Газоотводный двигатель'
                          : 'Короткий ход ствола'}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-slate-400">
                      Темп: {act.cyclicRate} в/м · Надёжность: {act.reliabilityBase}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Gas Adjustable Toggle */}
            {slots.action.type === 'gas' && (
              <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <div>
                  <span className="text-xs font-medium text-slate-200">
                    Регулируемый газовый двигатель (газовый регулятор)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Компенсирует штрафы за пыль, мороз и сильный пороховой нагар (+8% к надёжности).
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSlots({
                      action: {
                        ...slots.action,
                        gasAdjustable: !slots.action.gasAdjustable,
                      },
                    })
                  }
                  className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                    slots.action.gasAdjustable
                      ? 'border-cyan-500 bg-cyan-950/50 text-cyan-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  {slots.action.gasAdjustable ? 'Установлен' : 'Отключён'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. RECEIVER (СТВОЛЬНАЯ КОРОБКА) */}
        {activeSlot === 'receiver' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Конструкция и метод изготовления ствольной коробки
            </h4>
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono">
              <span className="text-slate-300">
                Калибр: <strong className="text-cyan-300">{slots.cartridge.name}</strong>
              </span>
              <span className="text-slate-300">
                Пиковое давление выстрела: <strong className="text-amber-400">{slots.cartridge.maxPressure} бар</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {RECEIVERS_PRESETS.map((rec) => {
                const available = isTechAvailable(
                  rec.techLevel,
                  rec.method === 'stamped'
                    ? 'stamped_metal'
                    : rec.material === 'polymer'
                    ? 'polymers_gen1'
                    : undefined
                );
                const isSelected =
                  slots.receiver.method === rec.method &&
                  slots.receiver.material === rec.material;
                const isUnderPressure = rec.strength < slots.cartridge.maxPressure;
                return (
                  <button
                    key={`${rec.material}-${rec.method}`}
                    disabled={!available}
                    onClick={() => onUpdateSlots({ receiver: rec })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? isUnderPressure
                          ? 'border-rose-500 bg-rose-950/30'
                          : 'border-cyan-500 bg-cyan-950/30'
                        : available
                        ? isUnderPressure
                          ? 'border-rose-800/60 bg-slate-950/40 hover:bg-rose-950/20'
                          : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                        : 'border-slate-800/40 bg-slate-950/20 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-100">
                      {rec.method === 'milled'
                        ? 'Фрезерованная сталь'
                        : rec.method === 'stamped'
                        ? 'Штампованная сталь'
                        : rec.method === 'cast'
                        ? 'Литой алюминий'
                        : 'Полимерный моноблок'}
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-slate-400">
                      Прочность: {rec.strength} бар · Масса: {rec.mass} кг
                    </div>
                    {isUnderPressure ? (
                      <span className="mt-1.5 text-[11px] text-rose-400 font-semibold block">
                        ⚠️ Не выдержит давление ({slots.cartridge.maxPressure} бар)
                      </span>
                    ) : (
                      <span className="mt-1.5 text-[10px] text-emerald-400 font-mono block">
                        ✓ Запас: +{rec.strength - slots.cartridge.maxPressure} бар
                      </span>
                    )}
                    {!available && (
                      <span className="mt-1.5 text-[10px] text-amber-400 block">
                        Требует технологию {rec.techLevel} г.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. MAGAZINE (МАГАЗИН) */}
        {activeSlot === 'magazine' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Тип и ёмкость боепитания
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Capacity Buttons */}
              <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
                <span className="text-xs text-slate-300 font-medium block mb-2">
                  Ёмкость магазина (патронов)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[5, 10, 20, 30, 45, 75].map((cap) => (
                    <button
                      key={cap}
                      onClick={() =>
                        onUpdateSlots({
                          magazine: {
                            ...slots.magazine,
                            capacity: cap,
                            type: cap > 45 ? 'drum' : 'box',
                          },
                        })
                      }
                      className={`py-1.5 text-xs rounded border transition-colors ${
                        slots.magazine.capacity === cap
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-semibold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cap} шт.
                    </button>
                  ))}
                </div>
              </div>

              {/* Material */}
              <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
                <span className="text-xs text-slate-300 font-medium block mb-2">
                  Материал корпуса магазина
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['steel', 'polymer'] as MagazineMaterial[]).map((mat) => {
                    const available = mat === 'steel' || isTechAvailable(1965, 'polymers_gen1');
                    return (
                      <button
                        key={mat}
                        disabled={!available}
                        onClick={() =>
                          onUpdateSlots({
                            magazine: { ...slots.magazine, material: mat },
                          })
                        }
                        className={`py-2 text-xs rounded border transition-colors ${
                          slots.magazine.material === mat
                            ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-semibold'
                            : available
                            ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                            : 'border-slate-800/40 bg-slate-950/20 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        {mat === 'steel' ? 'Сталь' : 'Полимер (-30% веса)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. TRIGGER / УСМ */}
        {activeSlot === 'trigger' && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Ударно-спусковой механизм
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Modes */}
              <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
                <span className="text-xs text-slate-300 font-medium block mb-2">
                  Режим огня
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['single', 'auto', 'both'] as TriggerMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() =>
                        onUpdateSlots({ trigger: { ...slots.trigger, mode: m } })
                      }
                      className={`py-1.5 text-xs rounded border transition-colors ${
                        slots.trigger.mode === m
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-semibold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m === 'single' ? 'Одиночный' : m === 'auto' ? 'Автомат' : 'Одиноч.+Авто'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
                <span className="text-xs text-slate-300 font-medium block mb-2">
                  Характер спуска
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['direct', 'twoStage'] as TriggerType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        onUpdateSlots({ trigger: { ...slots.trigger, type: t } })
                      }
                      className={`py-2 text-xs rounded border transition-colors ${
                        slots.trigger.type === t
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-semibold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'direct' ? 'Прямой военный' : 'Двухступенчатый матчевый'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pull length */}
              <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Ход спускового крючка:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {slots.trigger.pullLength} мм
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlots({
                        trigger: {
                          ...slots.trigger,
                          pullLength: Math.max(20, slots.trigger.pullLength - 5),
                        },
                      })
                    }
                    className="h-8 w-8 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center shrink-0 text-sm border border-slate-700/60"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    step="5"
                    value={slots.trigger.pullLength}
                    onChange={(e) =>
                      onUpdateSlots({
                        trigger: {
                          ...slots.trigger,
                          pullLength: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer h-2"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlots({
                        trigger: {
                          ...slots.trigger,
                          pullLength: Math.min(60, slots.trigger.pullLength + 5),
                        },
                      })
                    }
                    className="h-8 w-8 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center shrink-0 text-sm border border-slate-700/60"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Короткий спуск повышает точность первого выстрела.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 7. STOCK */}
        {activeSlot === 'stock' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Тип приклада и рукоятки
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
              {(
                [
                  ['none', 'Без приклада (Пистолет)', 'Только рукоять frame: 0 кг, максимальная эргономика'],
                  ['fixedWood', 'Постоянный деревянный', 'Классическая эргономика, надежность'],
                  ['folding', 'Складной металлический', 'Компактность в транспорте, малый вес'],
                  ['telescopic', 'Телескопический тактический', 'Регулировка под бронежилет'],
                  ['polymer', 'Эргономичный полимерный', 'Лёгкий, ударопрочный моноблок'],
                ] as const
              ).map(([type, title, desc]) => {
                const isSelected = slots.stock.type === type;
                return (
                  <button
                    key={type}
                    onClick={() =>
                      onUpdateSlots({
                        stock: { ...slots.stock, type: type as StockType },
                      })
                    }
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-100">{title}</div>
                    <div className="mt-1 text-[11px] text-slate-400">{desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Recoil damper toggle */}
            <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-xs font-medium text-slate-200">
                  Резиновый затыльник-демпфер отдачи
                </span>
                <p className="text-[11px] text-slate-400">
                  Снижает импульс ощущаемой отдачи на 15%.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSlots({
                    stock: {
                      ...slots.stock,
                      recoilDamper: !slots.stock.recoilDamper,
                    },
                  })
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                  slots.stock.recoilDamper
                    ? 'border-cyan-500 bg-cyan-950/50 text-cyan-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                {slots.stock.recoilDamper ? 'Установлен' : 'Отключён'}
              </button>
            </div>
          </div>
        )}

        {/* 8. TOP INTERFACE */}
        {activeSlot === 'topInterface' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Верхняя планка крепления прицелов
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {TOP_INTERFACES_PRESETS.map((rail) => {
                const available = isTechAvailable(
                  rail.techLevel,
                  rail.type === 'weaver'
                    ? 'weaver_rail'
                    : rail.type === 'picatinny'
                    ? 'picatinny_standard'
                    : undefined
                );
                const isSelected = slots.topInterface.type === rail.type;
                return (
                  <button
                    key={rail.type}
                    disabled={!available}
                    onClick={() => onUpdateSlots({ topInterface: rail })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : available
                        ? 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                        : 'border-slate-800/40 bg-slate-950/20 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-100">
                      {rail.type === 'none'
                        ? 'Механический прицел (без планки)'
                        : rail.type === 'dovetail11'
                        ? 'Ласточкин хвост 11 мм'
                        : rail.type === 'dovetail38'
                        ? 'Ласточкин хвост 3/8"'
                        : rail.type === 'weaver'
                        ? 'Планка Вивера (Weaver)'
                        : rail.type === 'picatinny'
                        ? 'MIL-STD-1913 Пикатинни'
                        : 'Проприетарная планка КБ'}
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-slate-400">
                      Стойкость: {rail.recoilCapacity} Дж · Стандарт: {rail.standardization}%
                    </div>
                    {!available && (
                      <span className="mt-2 text-[10px] text-rose-400 block">
                        Стандартизирована с {rail.techLevel} г.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 9. HANDGUARD */}
        {activeSlot === 'handguard' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Цевьё и подствольный интерфейс
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {HANDGUARD_PRESETS.map((hg, idx) => {
                const available = isTechAvailable(
                  hg.techLevel,
                  hg.lowerInterface === 'mlok' ? 'mlok_modular' : undefined
                );
                const isSelected =
                  slots.handguard.material === hg.material &&
                  slots.handguard.lowerInterface === hg.lowerInterface &&
                  slots.handguard.vented === hg.vented;
                return (
                  <button
                    key={idx}
                    disabled={!available}
                    onClick={() => onUpdateSlots({ handguard: hg })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : available
                        ? 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                        : 'border-slate-800/40 bg-slate-950/20 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-100">
                      {hg.material === 'none'
                        ? 'Без цевья (Пистолет / Компакт)'
                        : `Цевьё: ${
                            hg.material === 'wood'
                              ? 'Дерево'
                              : hg.material === 'polymer'
                              ? 'Полимер'
                              : 'Алюминий'
                          } (${hg.lowerInterface !== 'none' ? hg.lowerInterface : 'без планки'})`}
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-slate-400">
                      {hg.material === 'none'
                        ? 'Длина: 0 мм · Открытый затвор / ствол'
                        : `Длина: ${hg.length} мм ${hg.vented ? '· Вентилируемое' : ''}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 10. MUZZLE DEVICE */}
        {activeSlot === 'muzzleDevice' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Дульное устройство (ДТК / Пламегаситель / Глушитель)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {MUZZLE_PRESETS.map((m) => {
                const isSelected = slots.muzzleDevice.type === m.type;
                return (
                  <button
                    key={m.type}
                    onClick={() => onUpdateSlots({ muzzleDevice: m })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-100">
                      {m.type === 'none'
                        ? 'Без насадки'
                        : m.type === 'flashHider'
                        ? 'Щелевой пламегаситель'
                        : m.type === 'compensator'
                        ? 'Дульный тормоз-компенсатор'
                        : 'Тактический глушитель (ПБС)'}
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-slate-400">
                      Отдача: -{m.recoilReduction}% · Звук: {m.soundReduction > 0 ? `-${m.soundReduction}дБ` : '0'}
                    </div>
                    {m.requiresThread && (
                      <span className="mt-1 text-[10px] text-amber-400 block">
                        Требует резьбу на стволе
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 11. TOP ATTACHMENT */}
        {activeSlot === 'topAttachment' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Оптические и прицельные приборы (верхняя планка)
              </h4>
              {slots.topAttachment && (
                <button
                  onClick={() => onUpdateSlots({ topAttachment: null })}
                  className="text-xs text-rose-400 hover:text-rose-300 font-mono"
                >
                  Снять прицел [×]
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ATTACHMENTS_CATALOG.filter((a) => a.slot === 'top').map((att) => {
                const available = isTechAvailable(att.techLevel);
                const isSelected = slots.topAttachment?.id === att.id;
                return (
                  <button
                    key={att.id}
                    disabled={!available}
                    onClick={() => onUpdateSlots({ topAttachment: att })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : available
                        ? 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                        : 'border-slate-800/40 bg-slate-950/20 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-100">{att.name}</div>
                    <div className="mt-1 text-[11px] text-cyan-400 font-mono">
                      {att.effectLabel}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500 font-mono">
                      Стойкость: {att.requiredRecoilCapacity} Дж · Масса: {att.mass} кг
                    </div>
                    {!available && (
                      <span className="mt-1 text-[10px] text-rose-400 block">
                        Появится в {att.techLevel} г.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 12. LOWER ATTACHMENT */}
        {activeSlot === 'lowerAttachment' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Подствольное оборудование (рукояти, сошки, фонари)
              </h4>
              {slots.lowerAttachment && (
                <button
                  onClick={() => onUpdateSlots({ lowerAttachment: null })}
                  className="text-xs text-rose-400 hover:text-rose-300 font-mono"
                >
                  Снять обвес [×]
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ATTACHMENTS_CATALOG.filter((a) => a.slot === 'lower').map((att) => {
                const available = isTechAvailable(att.techLevel);
                const isSelected = slots.lowerAttachment?.id === att.id;
                return (
                  <button
                    key={att.id}
                    disabled={!available}
                    onClick={() => onUpdateSlots({ lowerAttachment: att })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : available
                        ? 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                        : 'border-slate-800/40 bg-slate-950/20 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-100">{att.name}</div>
                    <div className="mt-1 text-[11px] text-cyan-400 font-mono">
                      {att.effectLabel}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500 font-mono">
                      Масса: {att.mass} кг · Цена: {att.cost} у.е.
                    </div>
                    {!available && (
                      <span className="mt-1 text-[10px] text-rose-400 block">
                        Появится в {att.techLevel} г.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
