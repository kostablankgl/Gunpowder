import React from 'react';

interface HeaderNavProps {
  activeView: 'workshop' | 'tenders' | 'research' | 'production' | 'customCaliber';
  hasActiveErrors?: boolean;
  isMuted?: boolean;
  debugMode?: boolean;
  onNavigate: (view: 'workshop' | 'tenders' | 'research' | 'production' | 'customCaliber') => void;
  onSubmitToContest?: () => void;
  onToggleMute?: () => void;
  onOpenSettings?: () => void;
  onOpenMainMenu?: () => void;
  onOpenCheatPanel?: () => void;
  onOpenCivilianMarket?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeView,
  hasActiveErrors = false,
  isMuted = false,
  debugMode = false,
  onNavigate,
  onToggleMute,
  onOpenSettings,
  onOpenMainMenu,
  onOpenCheatPanel,
  onOpenCivilianMarket,
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 lg:gap-8 px-4 lg:px-8 py-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-slate-950/40">
      {/* Zone 1: Wordmark & Main Menu button */}
      <div className="flex items-center gap-3 shrink-0">
        {onOpenMainMenu && (
          <button
            onClick={onOpenMainMenu}
            title="Выйти в главное меню игры"
            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <span>◀</span>
            <span className="hidden sm:inline">Меню</span>
          </button>
        )}

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('workshop');
          }}
          className="text-sm lg:text-base font-bold tracking-tight text-slate-100 whitespace-nowrap flex items-center gap-2"
        >
          <span className="w-6 h-6 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
            КБ
          </span>
          <span className="hidden md:inline font-sans font-extrabold text-slate-100">
            Gunpowder <span className="text-cyan-400 font-mono text-xs font-semibold">v1.7.0</span>
          </span>
        </a>
      </div>

      {/* Zone 2: Tablet-Optimized Spacious Touch Tabs */}
      <nav className="flex items-center gap-1.5 lg:gap-2 overflow-x-auto subtle-scroll py-1">
        {[
          { id: 'workshop', label: 'Чертёж', icon: '📐' },
          { id: 'tenders', label: 'Госзаказы', icon: '📋' },
          { id: 'research', label: 'НИОКР', icon: '🔬' },
          { id: 'production', label: 'Завод', icon: '🏭' },
          { id: 'customCaliber', label: 'Патроны', icon: '💥' },
        ].map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id as any)}
              className={`min-h-[40px] px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-950/60'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Actions, Settings, Stealth Debug, Audio */}
      <div className="flex items-center gap-2 lg:gap-2.5 shrink-0">
        {/* Civilian Market Entry Button */}
        {onOpenCivilianMarket && (
          <button
            type="button"
            onClick={onOpenCivilianMarket}
            title="Оценить образец на гражданском рынке"
            className="h-9 px-3 rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-sm"
          >
            <span>🏪</span>
            <span className="hidden sm:inline">Рынок</span>
          </button>
        )}

        {/* Stealth Cheat Button (clean lightning icon, no text, no code) */}
        {debugMode && onOpenCheatPanel && (
          <button
            type="button"
            onClick={onOpenCheatPanel}
            title="Инженерный терминал"
            className="w-9 h-9 rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 flex items-center justify-center text-sm transition-colors shadow-sm"
          >
            ⚡
          </button>
        )}

        {/* Audio Mute Toggle */}
        {onToggleMute && (
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="w-9 h-9 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors text-xs"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        )}

        {/* Settings button */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            title="Настройки звука и консоль"
            className="w-9 h-9 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors text-xs"
          >
            ⚙️
          </button>
        )}

      </div>
    </header>
  );
};
