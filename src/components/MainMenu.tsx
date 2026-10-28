import React, { useState } from 'react';
import { CountryId, TechnicalSpecification } from '../types';
import { COUNTRY_PROFILES } from '../data/database';
import { sounds } from '../utils/audio';

interface MainMenuProps {
  hasSavedGame: boolean;
  savedGameInfo?: {
    country: CountryId;
    year: number;
    budget: number;
    tzTitle: string;
  } | null;
  onContinue: () => void;
  onStartNewGame: (country: CountryId, startingTZ: TechnicalSpecification) => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  allInitialTZs: TechnicalSpecification[];
}

export const MainMenu: React.FC<MainMenuProps> = ({
  hasSavedGame,
  savedGameInfo,
  onContinue,
  onStartNewGame,
  onOpenSettings,
  onOpenAbout,
  allInitialTZs,
}) => {
  const [isStartingNew, setIsStartingNew] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryId>('USSR');
  const [selectedTZId, setSelectedTZId] = useState<string>('');

  // Filter orders available for the selected country
  const countryTZs = allInitialTZs.filter(
    (tz) => tz.country === selectedCountry || tz.country === 'USSR' // fallback
  );

  const activeTZ = countryTZs.find((tz) => tz.id === selectedTZId) || countryTZs[0];

  const handleCountryChange = (cId: CountryId) => {
    sounds.playMechanicalClick();
    setSelectedCountry(cId);
    const availableForCountry = allInitialTZs.filter((tz) => tz.country === cId);
    if (availableForCountry.length > 0) {
      setSelectedTZId(availableForCountry[0].id);
    }
  };

  const handleLaunchGame = () => {
    if (!activeTZ) return;
    sounds.playBoltCycle();
    onStartNewGame(selectedCountry, activeTZ);
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 flex flex-col justify-between overflow-x-hidden blueprint-grid text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Blueprint Grid Ambient Overlay */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/70 to-slate-950 pointer-events-none" />

      {/* Top Banner / Technical stamp */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-cyan-900/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-cyan-500/50 bg-cyan-950/60 flex items-center justify-center font-mono font-bold text-cyan-400 text-sm shadow-lg shadow-cyan-950/50">
            КБ
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold">
              Министерство оборонной промышленности
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Отдел опытно-конструкторских работ (ОКР)
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400 border border-cyan-900/50 rounded-lg px-3 py-1.5 bg-slate-900/40">
          <span className="text-cyan-400 font-bold">Gunpowder-v1.7.0</span>
          <span>·</span>
          <span>Спецификация: 1920×1024</span>
          <span>·</span>
          <span>ГОСТ-2.102</span>
          <span>·</span>
          <span className="text-emerald-400">СИСТЕМА ГОТОВА</span>
        </div>
      </header>

      {/* Center Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto w-full">
        {!isStartingNew ? (
          /* Primary Menu Options */
          <div className="w-full max-w-md flex flex-col items-center text-center space-y-8">
            {/* Title Section */}
            <div className="space-y-3">
              <div className="inline-block px-3.5 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/50 text-[11px] font-mono text-cyan-300 uppercase tracking-widest">
                GUNPOWDER v1.7.0 · ИНЖЕНЕРНОЕ БЮРО
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                GUNPOWDER
              </h1>
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                Конструкторское бюро: Оружейный инженер
              </div>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                Проектирование стрелкового оружия, полигонные испытания, баллистические расчёты и серийное производство
              </p>
            </div>

            {/* Menu Buttons */}
            <div className="w-full space-y-3 pt-2">
              <button
                onClick={() => {
                  sounds.playMechanicalClick();
                  setIsStartingNew(true);
                  // pick initial TZ for default country
                  const available = allInitialTZs.filter((tz) => tz.country === selectedCountry);
                  if (available.length > 0) setSelectedTZId(available[0].id);
                }}
                className="w-full py-4 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-between group"
              >
                <span className="flex items-center gap-3">
                  <span className="text-base group-hover:rotate-12 transition-transform">📐</span>
                  НОВАЯ ИГРА
                </span>
                <span className="font-mono text-xs text-cyan-200 group-hover:translate-x-1 transition-transform">
                  Начать проект →
                </span>
              </button>

              <button
                disabled={!hasSavedGame}
                onClick={() => {
                  sounds.playBoltCycle();
                  onContinue();
                }}
                className={`w-full py-3.5 px-6 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between ${
                  hasSavedGame
                    ? 'border-cyan-500/40 bg-slate-900/80 hover:bg-slate-800 text-slate-100 cursor-pointer'
                    : 'border-slate-800 bg-slate-950/40 text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span>📂</span>
                  ПРОДОЛЖИТЬ
                </span>
                {savedGameInfo ? (
                  <span className="font-mono text-[11px] text-cyan-400">
                    {savedGameInfo.country} · {savedGameInfo.year} г.
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-slate-600">Нет сохранения</span>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => {
                    sounds.playMechanicalClick();
                    onOpenSettings();
                  }}
                  className="py-3 px-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <span>⚙️</span>
                  НАСТРОЙКИ
                </button>

                <button
                  onClick={() => {
                    sounds.playMechanicalClick();
                    onOpenAbout();
                  }}
                  className="py-3 px-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <span>📖</span>
                  ОБ ИГРЕ
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: New Game Setup (Choose Country & Initial State Order) */
          <div className="w-full max-w-2xl bg-slate-900/90 border border-cyan-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🏛️</span> Основание Конструкторского Бюро
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Выберите конструкторскую школу и первый государственный заказ
                </p>
              </div>
              <button
                onClick={() => {
                  sounds.playMechanicalClick();
                  setIsStartingNew(false);
                }}
                className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950"
              >
                ← Назад в меню
              </button>
            </div>

            {/* Country Selector */}
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                1. Выберите страну и конструкторскую доктрину:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['USSR', 'USA'] as CountryId[]).map((cId) => {
                  const profile = COUNTRY_PROFILES[cId];
                  const isSelected = selectedCountry === cId;
                  return (
                    <button
                      key={cId}
                      type="button"
                      onClick={() => handleCountryChange(cId)}
                      className={`p-4 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-100 shadow-md shadow-cyan-950/50'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{profile.name}</span>
                        {isSelected && (
                          <span className="text-xs text-cyan-400 font-mono font-bold">✓ Выбрано</span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
                        {profile.desc}
                      </p>
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Стартовый бюджет:</span>
                        <span className="text-emerald-400 font-bold">{profile.startingBudget} у.е.</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Starting State Order (Госзаказ) for chosen country */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  2. Стартовый государственный заказ ({selectedCountry}):
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {countryTZs.length} доступных заказов
                </span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {countryTZs.map((tz) => {
                  const isChosen = activeTZ?.id === tz.id;
                  return (
                    <div
                      key={tz.id}
                      onClick={() => {
                        sounds.playMechanicalClick();
                        setSelectedTZId(tz.id);
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isChosen
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-100'
                          : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-xs text-white flex items-center gap-2">
                          <span>🎯 {tz.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {tz.year} год
                          </span>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 font-bold">
                          +{tz.budgetReward} у.е.
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {tz.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400">
                        <span>Тип: <strong className="text-slate-200">{tz.weaponTypeName}</strong></span>
                        <span>Калибр: <strong className="text-cyan-300">{tz.requiredClass}</strong></span>
                        <span>Надёжность: <strong className="text-slate-200">≥{tz.minReliability}%</strong></span>
                        <span>Серия: <strong className="text-slate-200">{tz.targetBatchSize} шт.</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Launch button */}
            <div className="pt-3 border-t border-cyan-900/40 flex items-center justify-between">
              <div className="text-xs text-slate-400 font-sans">
                Чертёж будет автоматически подготовлен под требования заказа
              </div>
              <button
                type="button"
                onClick={handleLaunchGame}
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
              >
                <span>Приступить к проектированию</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-4 border-t border-cyan-900/30 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
        <div>
          Конструкторское бюро: Оружейный инженер © 1943–2026
        </div>
        <div>
          Широкоформатный режим 1920×1024 · Двигатель баллистики и экономики
        </div>
      </footer>
    </div>
  );
};
