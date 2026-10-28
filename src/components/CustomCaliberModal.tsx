import React, { useState } from 'react';
import { Cartridge, CartridgeClass } from '../types';
import { CARTRIDGE_LIMITS } from '../engine/physics';
import { sounds } from '../utils/audio';

interface CustomCaliberModalProps {
  currentYear: number;
  currentBudget: number;
  onSaveCartridge: (cartridge: Cartridge) => void;
  onClose: () => void;
}

export const CustomCaliberModal: React.FC<CustomCaliberModalProps> = ({
  currentYear,
  currentBudget,
  onSaveCartridge,
  onClose,
}) => {
  const [name, setName] = useState<string>('6.5×39 КБ Спецпатрон');
  const [cartridgeClass, setCartridgeClass] = useState<CartridgeClass>('intermediate');
  const [bulletDiameter, setBulletDiameter] = useState<number>(6.7);
  const [bulletMass, setBulletMass] = useState<number>(6.5);
  const [caseLength, setCaseLength] = useState<number>(39);
  const [maxPressure, setMaxPressure] = useState<number>(3650);
  // User can freely configure test/reference barrel length to calculate ballistics
  const [testBarrelLength, setTestBarrelLength] = useState<number>(415);

  const classLimits = CARTRIDGE_LIMITS[cartridgeClass];

  // Derived properties calculation
  const overallLength = Math.round(caseLength + 16 + (bulletDiameter > 7 ? 2 : 0));
  
  // Base reference barrel length for standard classification
  const defaultStandardLRef = cartridgeClass === 'pistol' ? 140 : cartridgeClass === 'intermediate' ? 415 : 620;

  // vRef ballistics approximation:
  const powderFactor = Math.sqrt((caseLength * maxPressure) / (bulletMass * 3000));
  const baseStandardV = Math.round(
    cartridgeClass === 'pistol'
      ? 320 * powderFactor
      : cartridgeClass === 'intermediate'
      ? 680 * powderFactor
      : 800 * powderFactor
  );

  // Ballistics scaling with custom test barrel length
  const rawVelocity = Math.round(
    baseStandardV * Math.pow(Math.max(100, testBarrelLength) / defaultStandardLRef, 0.25)
  );
  // Strictly capped velocity and energy
  const muzzleVelocityWithTestBarrel = Math.min(classLimits.maxVelocity, rawVelocity);

  const rawEnergy = Math.round(0.5 * (bulletMass / 1000) * rawVelocity * rawVelocity);
  const muzzleEnergy = Math.min(classLimits.maxEnergy, rawEnergy);
  const devCost = 65;

  // Strict physical class validation (БЛОК 1.2)
  const limitViolations: string[] = [];
  if (bulletMass > classLimits.maxBulletMass) {
    limitViolations.push(
      `Масса пули ${bulletMass} г превышает предел для ${cartridgeClass === 'pistol' ? 'пистолетов' : cartridgeClass === 'intermediate' ? 'промежуточных' : 'винтовок'} (макс. ${classLimits.maxBulletMass} г).`
    );
  }
  if (rawEnergy > classLimits.maxEnergy) {
    limitViolations.push(
      `Дульная энергия ${rawEnergy} Дж превышает конструктивный предел класса (${classLimits.maxEnergy} Дж).`
    );
  }
  if (rawVelocity > classLimits.maxVelocity) {
    limitViolations.push(
      `Скорость пули ${rawVelocity} м/с превышает порог стабильности ствола (${classLimits.maxVelocity} м/с).`
    );
  }
  if (maxPressure > classLimits.maxPressure) {
    limitViolations.push(
      `Пиковое давление ${maxPressure} бар разорвёт патронник (лимит класса: ${classLimits.maxPressure} бар).`
    );
  }

  const isBlockedByLimits = limitViolations.length > 0;

  const handleCreate = () => {
    sounds.playCraft();
    const newCartridge: Cartridge = {
      id: `custom_${Date.now()}`,
      name: name.trim() || `${bulletDiameter.toFixed(1)}×${caseLength} КБ`,
      class: cartridgeClass,
      bulletDiameter,
      bulletMass,
      caseLength,
      overallLength,
      maxPressure,
      vRef: muzzleVelocityWithTestBarrel,
      lRef: testBarrelLength, // Saved with user's tuned test barrel length!
      cost: Number((1.2 + (maxPressure / 4000) * 0.8).toFixed(1)),
      techLevel: currentYear,
      isCustom: true,
    };
    onSaveCartridge(newCartridge);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto subtle-scroll p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md flex justify-center items-center">
      <div className="w-full max-w-2xl my-auto max-h-[92vh] flex flex-col rounded-2xl border border-cyan-800/80 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Pinned Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Баллистическая лаборатория КБ
            </span>
            <h2 className="text-lg font-bold text-slate-100 mt-0.5">
              Проектирование боеприпаса и баллистический стенд
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded border border-slate-800 bg-slate-800/50 hover:bg-slate-800"
          >
            Закрыть [×]
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto subtle-scroll p-4 sm:p-5 flex-1 space-y-4">
          {/* Caliber Name & Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Наименование патрона:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Класс патрона:
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['pistol', 'intermediate', 'rifle'] as CartridgeClass[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setCartridgeClass(c);
                      if (c === 'pistol') {
                        setCaseLength(25);
                        setBulletMass(6.0);
                        setMaxPressure(2400);
                        setTestBarrelLength(200);
                        setName('7.62×25 КБ ТТ-Мод');
                      } else if (c === 'intermediate') {
                        setCaseLength(39);
                        setBulletMass(7.9);
                        setMaxPressure(3600);
                        setTestBarrelLength(415);
                        setName('7.62×39 КБ Обр-43');
                      } else {
                        setCaseLength(54);
                        setBulletMass(9.6);
                        setMaxPressure(4100);
                        setTestBarrelLength(620);
                        setName('7.62×54R КБ Снайпер');
                      }
                    }}
                    className={`py-2 text-xs rounded border transition-colors ${
                      cartridgeClass === c
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {c === 'pistol' ? 'Пистолетный' : c === 'intermediate' ? 'Промежуточный' : 'Винтовочный'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Barrel Length Control (Регулируемая длина ствола для расчёта!) */}
          <div className="rounded-xl border border-sky-800/80 bg-sky-950/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-sky-300 block">
                  Тестовая длина ствола для расчёта баллистики:
                </span>
                <span className="text-[11px] text-slate-400">
                  (Влияет на расчёт начальной скорости пули и дульной энергии)
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-mono font-bold text-cyan-300">{testBarrelLength} мм</span>
              </div>
            </div>

            <input
              type="range"
              min="100"
              max="750"
              step="5"
              value={testBarrelLength}
              onChange={(e) => setTestBarrelLength(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            {/* Quick Presets for Barrel Length */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { l: 150, label: '150 мм (Компакт)' },
                { l: 314, label: '314 мм (Карабин)' },
                { l: 415, label: '415 мм (АК-стандарт)' },
                { l: 508, label: '508 мм (M16 / 20")' },
                { l: 620, label: '620 мм (СВД / Снайпер)' },
              ].map((preset) => (
                <button
                  key={preset.l}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setTestBarrelLength(preset.l);
                  }}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    testBarrelLength === preset.l
                      ? 'border-cyan-400 bg-cyan-900/60 text-cyan-200 font-bold'
                      : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders for Physical Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Калибр (диаметр пули):</span>
                <span className="font-mono text-cyan-400 font-bold">{bulletDiameter} мм</span>
              </div>
              <input
                type="range"
                min="4.5"
                max="12.7"
                step="0.1"
                value={bulletDiameter}
                onChange={(e) => setBulletDiameter(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Масса пули:</span>
                <span className="font-mono text-cyan-400 font-bold">{bulletMass} г</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="16.0"
                step="0.1"
                value={bulletMass}
                onChange={(e) => setBulletMass(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Длина гильзы:</span>
                <span className="font-mono text-cyan-400 font-bold">{caseLength} мм</span>
              </div>
              <input
                type="range"
                min="15"
                max="75"
                step="1"
                value={caseLength}
                onChange={(e) => setCaseLength(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Пиковое давление:</span>
                <span className="font-mono text-cyan-400 font-bold">{maxPressure} бар</span>
              </div>
              <input
                type="range"
                min="1500"
                max="4500"
                step="50"
                value={maxPressure}
                onChange={(e) => setMaxPressure(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Ballistic Output Preview */}
          <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-4">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide block mb-2">
              Расчётные баллистические свойства патрона (со стволом {testBarrelLength} мм)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Длина патрона</span>
                <span className="text-slate-100 font-bold">{overallLength} мм</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Скорость пули</span>
                <span className="text-cyan-300 font-bold">{muzzleVelocityWithTestBarrel} м/с</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Дульная энергия</span>
                <span className="text-emerald-400 font-bold">{muzzleEnergy} Дж</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Базовый ствол</span>
                <span className="text-slate-200 font-bold">{testBarrelLength} мм</span>
              </div>
            </div>
          </div>
          {/* Class Limits & Physical Ceiling Reference */}
          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="text-slate-300 font-semibold block mb-1">
              Нормативы класса ({cartridgeClass === 'pistol' ? 'Пистолетный' : cartridgeClass === 'intermediate' ? 'Промежуточный' : 'Винтовочный'}):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
              <div>Макс. масса пули: <span className="text-cyan-300">{classLimits.maxBulletMass} г</span></div>
              <div>Макс. скорость: <span className="text-cyan-300">{classLimits.maxVelocity} м/с</span></div>
              <div>Макс. энергия: <span className="text-cyan-300">{classLimits.maxEnergy} Дж</span></div>
              <div>Предел давления: <span className="text-cyan-300">{classLimits.maxPressure} бар</span></div>
            </div>
          </div>

          {/* Hard Limit Violations Banner (БЛОК 1.2) */}
          {isBlockedByLimits && (
            <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <span>⛔</span>
                <span>Нарушение баллистических пределов класса:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-rose-200 font-mono text-[11px]">
                {limitViolations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
              <div className="text-[11px] text-rose-400 pt-1">
                Государственная приёмочная комиссия блокирует запуск в серию патронов, выходящих за рамки физических допусков класса.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Освоение линии: <span className="text-cyan-300 font-bold">{devCost} тыс. руб.</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={currentBudget < devCost || isBlockedByLimits}
              onClick={handleCreate}
              className={`rounded-lg px-5 py-2 text-xs font-semibold text-white transition-colors ${
                !isBlockedByLimits && currentBudget >= devCost
                  ? 'bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isBlockedByLimits
                ? 'Заблокировано (Превышение лимитов)'
                : currentBudget >= devCost
                ? 'Утвердить и поставить на вооружение'
                : 'Недостаточно бюджета'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
