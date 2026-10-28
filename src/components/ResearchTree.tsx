import React from 'react';
import { TechNode } from '../types';
import { TECH_TREE_NODES } from '../data/database';

interface ResearchTreeProps {
  unlockedTechs: string[];
  activeResearchId: string | null;
  researchWeeksLeft: number;
  currentBudget: number;
  currentYear: number;
  onStartResearch: (techId: string, cost: number, weeks: number) => void;
  onClose: () => void;
}

export const ResearchTree: React.FC<ResearchTreeProps> = ({
  unlockedTechs,
  activeResearchId,
  researchWeeksLeft,
  currentBudget,
  currentYear,
  onStartResearch,
  onClose,
}) => {
  const activeTech = TECH_TREE_NODES.find((t) => t.id === activeResearchId);

  const categories = [
    { key: 'production', label: 'Производство и технологии' },
    { key: 'cartridges', label: 'Баллистика и патроны' },
    { key: 'materials', label: 'Материалы и сплавы' },
    { key: 'actions', label: 'Схемы автоматики' },
    { key: 'interfaces', label: 'Интерфейсы и планки' },
    { key: 'optics', label: 'Прицелы и электроника' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto subtle-scroll p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md flex justify-center items-start">
      <div className="w-full max-w-5xl my-auto max-h-[92vh] flex flex-col rounded-2xl border border-cyan-800/80 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Pinned Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Научно-исследовательский отдел (НИОКР)
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 mt-0.5">
              Дерево технологий и модернизаций
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Текущий год: <span className="text-cyan-300 font-mono font-bold">{currentYear}</span> ·
              Бюджет КБ: <span className="text-emerald-400 font-mono font-bold">{currentBudget} у.е.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded border border-slate-800 bg-slate-800/50 hover:bg-slate-800"
          >
            Закрыть [×]
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto subtle-scroll p-4 sm:p-5 flex-1">
          {/* Active Research Banner if currently in progress */}
        {activeTech && (
          <div className="mt-4 rounded-xl border border-cyan-500/60 bg-cyan-950/30 p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-cyan-300">
                Идёт исследование: {activeTech.name}
              </span>
              <span className="font-mono text-slate-300">
                Осталось недель: {researchWeeksLeft}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-cyan-900">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{
                  width: `${Math.round(((activeTech.weeks - researchWeeksLeft) / activeTech.weeks) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Category Sections */}
        <div className="mt-6 space-y-6">
          {categories.map((cat) => {
            const nodes = TECH_TREE_NODES.filter((n) => n.category === cat.key);
            if (nodes.length === 0) return null;
            return (
              <div key={cat.key}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-l-2 border-cyan-500 pl-2">
                  {cat.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nodes.map((tech) => {
                    const isUnlocked = unlockedTechs.includes(tech.id);
                    const isResearching = activeResearchId === tech.id;
                    const canAfford = currentBudget >= tech.cost;
                    const prereqsMet = tech.prerequisites.every((p) => unlockedTechs.includes(p));
                    const yearMet = currentYear >= tech.yearAvailable;
                    const canStart = !isUnlocked && !activeResearchId && canAfford && prereqsMet && yearMet;

                    return (
                      <div
                        key={tech.id}
                        className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                          isUnlocked
                            ? 'border-emerald-800/80 bg-emerald-950/20'
                            : isResearching
                            ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500'
                            : prereqsMet && yearMet
                            ? 'border-slate-800 bg-slate-950/60'
                            : 'border-slate-800/40 bg-slate-950/30 opacity-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-slate-100">{tech.name}</h4>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded whitespace-nowrap ${
                                isUnlocked
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : isResearching
                                  ? 'bg-cyan-950 text-cyan-300'
                                  : 'bg-slate-900 text-slate-400'
                              }`}
                            >
                              {isUnlocked
                                ? '✓ Изучено'
                                : isResearching
                                ? 'В работе'
                                : `${tech.yearAvailable} г.`}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                            {tech.description}
                          </p>

                          {/* Prerequisites notice if any missing */}
                          {!prereqsMet && (
                            <div className="mt-2 text-[10px] text-amber-400 font-mono">
                              Требует: {tech.prerequisites.join(', ')}
                            </div>
                          )}
                          {!yearMet && (
                            <div className="mt-1 text-[10px] text-rose-400 font-mono">
                              Недоступно до {tech.yearAvailable} года
                            </div>
                          )}
                        </div>

                        {/* Bottom action row */}
                        <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between">
                          <div className="text-xs font-mono text-slate-400">
                            <span>{tech.cost} у.е.</span> · <span>{tech.weeks} нед.</span>
                          </div>

                          {isUnlocked ? (
                            <span className="text-xs font-medium text-emerald-400">
                              Доступно в КБ
                            </span>
                          ) : isResearching ? (
                            <span className="text-xs font-medium text-cyan-400 animate-pulse">
                              Изучается...
                            </span>
                          ) : (
                            <button
                              disabled={!canStart}
                              onClick={() => onStartResearch(tech.id, tech.cost, tech.weeks)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                canStart
                                  ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              {activeResearchId
                                ? 'КБ занято'
                                : !canAfford
                                ? 'Нет средств'
                                : 'Исследовать'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
};
