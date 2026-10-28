import React, { useState } from 'react';
import { sounds } from '../utils/audio';

interface SettingsModalProps {
  debugMode: boolean;
  onToggleDebugMode: (enabled: boolean) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  debugMode,
  onToggleDebugMode,
  onClose,
}) => {
  const [sfxVol, setSfxVol] = useState<number>(sounds.sfxVolume);
  const [musicVol, setMusicVol] = useState<number>(sounds.musicVolume);
  const [sfxMuted, setSfxMuted] = useState<boolean>(sounds.sfxMuted);
  const [musicMuted, setMusicMuted] = useState<boolean>(sounds.musicMuted);

  const [consoleInput, setConsoleInput] = useState<string>('');
  const [consoleMessage, setConsoleMessage] = useState<string | null>(null);

  const handleSfxVolChange = (val: number) => {
    setSfxVol(val);
    sounds.setSfxVolume(val);
  };

  const handleMusicVolChange = (val: number) => {
    setMusicVol(val);
    sounds.setMusicVolume(val);
  };

  const handleToggleSfx = () => {
    const next = sounds.toggleSfxMute();
    setSfxMuted(next);
  };

  const handleToggleMusic = () => {
    const next = sounds.toggleMusicMute();
    setMusicMuted(next);
  };

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = consoleInput.trim();
    if (trimmed === '3689') {
      const nextState = !debugMode;
      onToggleDebugMode(nextState);
      sounds.playCheatCodeSound(nextState);
      if (nextState) {
        setConsoleMessage('✓ ДОСТУП РАЗРЕШЁН: Инженерный режим активирован.');
      } else {
        setConsoleMessage('✗ Инженерный режим деактивирован.');
      }
      setConsoleInput('');
    } else if (trimmed === 'clear') {
      setConsoleMessage(null);
      setConsoleInput('');
    } else {
      sounds.playErrorSound();
      setConsoleMessage(`ОШИБКА: Неизвестная команда или код "${trimmed}".`);
      setConsoleInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h3 className="text-base font-bold text-slate-100">Настройки системы</h3>
              <p className="text-xs text-slate-400">Параметры звука, музыки и инженерная консоль</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Audio settings */}
        <div className="mt-5 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
              Аудио и Звуковое сопровождение
            </h4>

            {/* Background music */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <span>🎵</span> Фоновая музыка (атмосфера КБ)
                </span>
                <button
                  type="button"
                  onClick={handleToggleMusic}
                  className={`text-[11px] px-2.5 py-0.5 rounded border transition-colors ${
                    musicMuted
                      ? 'border-rose-800/80 bg-rose-950/50 text-rose-300'
                      : 'border-cyan-800/80 bg-cyan-950/50 text-cyan-300'
                  }`}
                >
                  {musicMuted ? 'Выключена' : 'Включена'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVol}
                  disabled={musicMuted}
                  onChange={(e) => handleMusicVolChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
                />
                <span className="text-xs font-mono text-slate-400 w-12 text-right">
                  {Math.round(musicVol * 100)}%
                </span>
              </div>
            </div>

            {/* Sound effects */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <span>🔊</span> Звуковые эффекты (механика, выстрелы, затвор)
                </span>
                <button
                  type="button"
                  onClick={handleToggleSfx}
                  className={`text-[11px] px-2.5 py-0.5 rounded border transition-colors ${
                    sfxMuted
                      ? 'border-rose-800/80 bg-rose-950/50 text-rose-300'
                      : 'border-cyan-800/80 bg-cyan-950/50 text-cyan-300'
                  }`}
                >
                  {sfxMuted ? 'Выключены' : 'Включены'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVol}
                  disabled={sfxMuted}
                  onChange={(e) => handleSfxVolChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
                />
                <span className="text-xs font-mono text-slate-400 w-12 text-right">
                  {Math.round(sfxVol * 100)}%
                </span>
              </div>

              {/* SFX Quick Test Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => sounds.playMechanicalClick()}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                >
                  Тест: Щелчок
                </button>
                <button
                  type="button"
                  onClick={() => sounds.playBoltCycle()}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                >
                  Тест: Затвор
                </button>
                <button
                  type="button"
                  onClick={() => sounds.playGunshot(false)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                >
                  Тест: Выстрел
                </button>
                <button
                  type="button"
                  onClick={() => sounds.playGunshot(true)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                >
                  Тест: С глушителем
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Console for Debug Code 3689 */}
          <div className="rounded-xl border border-amber-500/40 bg-slate-950 p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                <span>💻</span> Консоль разработчика и сервисных кодов
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  debugMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {debugMode ? 'ОТЛАДКА АКТИВНА' : 'ОТЛАДКА ВЫКЛЮЧЕНА'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Инженерная консоль доступа. Введите служебный сервисный код для переключения расширенных инструментов КБ.
            </p>

            <form onSubmit={handleConsoleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  &gt;
                </span>
                <input
                  type="text"
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  placeholder="Введите сервисный код доступа..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-colors"
              >
                Ввести
              </button>
            </form>

            {consoleMessage && (
              <div
                className={`p-2.5 rounded-lg text-xs font-sans ${
                  consoleMessage.startsWith('✓')
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : consoleMessage.startsWith('✗')
                    ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}
              >
                {consoleMessage}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
