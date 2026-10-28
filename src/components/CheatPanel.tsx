import React from 'react';
import { sounds } from '../utils/audio';

interface CheatPanelProps {
  budget: number;
  reputation: number;
  onAddBudget: (amount: number) => void;
  onAddReputation: (amount: number) => void;
  onUnlockAllTech: () => void;
  onAdvanceYear: () => void;
  onDisableCheats: () => void;
  onClose: () => void;
}

export const CheatPanel: React.FC<CheatPanelProps> = ({
  budget,
  reputation,
  onAddBudget,
  onAddReputation,
  onUnlockAllTech,
  onAdvanceYear,
  onDisableCheats,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl border-2 border-amber-500/80 bg-slate-900 p-6 shadow-2xl shadow-amber-950/40">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="text-base font-bold text-amber-400 font-mono tracking-wider">
                СЕРВИСНЫЙ ИНЖЕНЕРНЫЙ ТЕРМИНАЛ
              </h3>
              <p className="text-[11px] text-slate-400">
                Панель тестирования баланса, экономики и инженерных формул
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4 font-mono text-xs">
          {/* Status strip */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/70 border border-amber-500/20">
            <div>
              <span className="text-slate-400">Текущий бюджет:</span>{' '}
              <span className="text-emerald-400 font-bold">{budget} ©</span>
            </div>
            <div>
              <span className="text-slate-400">Репутация КБ:</span>{' '}
              <span className="text-cyan-300 font-bold">{reputation}/100</span>
            </div>
          </div>

          {/* Cheat actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                sounds.playSuccessChime();
                onAddBudget(100000);
              }}
              className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-400 font-semibold text-left transition-colors"
            >
              💰 +100 000 Бюджет
              <div className="text-[10px] text-emerald-500/80 font-normal mt-0.5 font-sans">
                Добавить финансирование на разработку
              </div>
            </button>

            <button
              onClick={() => {
                sounds.playSuccessChime();
                onAddBudget(500000);
              }}
              className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-400 font-semibold text-left transition-colors"
            >
              💎 +500 000 Бюджет
              <div className="text-[10px] text-emerald-500/80 font-normal mt-0.5 font-sans">
                Неограниченные ресурсы госбюджета
              </div>
            </button>

            <button
              onClick={() => {
                sounds.playSuccessChime();
                onAddReputation(50);
              }}
              className="p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 font-semibold text-left transition-colors"
            >
              ⭐ +50 Репутация КБ
              <div className="text-[10px] text-cyan-500/80 font-normal mt-0.5 font-sans">
                Увеличить авторитет у заказчика до максимума
              </div>
            </button>

            <button
              onClick={() => {
                sounds.playSuccessChime();
                onUnlockAllTech();
              }}
              className="p-3 rounded-xl border border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:border-purple-400 font-semibold text-left transition-colors"
            >
              🔬 Открыть все технологии
              <div className="text-[10px] text-purple-400/80 font-normal mt-0.5 font-sans">
                Мгновенный доступ ко всем узлам НИОКР
              </div>
            </button>

            <button
              onClick={() => {
                sounds.playBoltCycle();
                onAdvanceYear();
              }}
              className="p-3 rounded-xl border border-blue-500/40 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40 hover:border-blue-400 font-semibold text-left transition-colors col-span-2"
            >
              🕒 Перемотать время на +1 Год вперед
              <div className="text-[10px] text-blue-400/80 font-normal mt-0.5 font-sans">
                Быстрое переключение исторических эпох и требований
              </div>
            </button>
          </div>

          {/* Disable Cheats button */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                sounds.playCheatCodeSound(false);
                onDisableCheats();
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-sans"
            >
              Отключить сервисный терминал
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
