import React from 'react';
import { TechnicalSpecification, CountryId } from '../types';

interface TenderModalProps {
  country: CountryId;
  currentYear: number;
  activeTZId: string | null;
  allTZList: TechnicalSpecification[];
  onSelectTZ: (tz: TechnicalSpecification) => void;
  onGenerateNewTZ?: () => void;
  onClose: () => void;
}

export const TenderModal: React.FC<TenderModalProps> = ({
  country,
  currentYear,
  activeTZId,
  allTZList,
  onSelectTZ,
  onGenerateNewTZ,
  onClose,
}) => {
  const filteredTZList = allTZList.filter((tz) => tz.country === country);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto subtle-scroll p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md flex justify-center items-start">
      <div className="w-full max-w-5xl my-auto max-h-[92vh] flex flex-col rounded-2xl border border-cyan-800/80 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Pinned Sticky Header - NEVER CLIPPED */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              {country === 'USSR'
                ? 'Портфель государственных оборонных заказов (СССР / ГРАУ)'
                : 'Портфель государственных и коммерческих контрактов (США)'}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 mt-0.5">
              Технические задания (ТЗ) на проектирование
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onGenerateNewTZ && (
              <button
                type="button"
                onClick={onGenerateNewTZ}
                className="rounded-lg bg-cyan-600/30 text-cyan-200 border border-cyan-500/50 hover:bg-cyan-600/50 px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                + Новое ТЗ ({currentYear} г.)
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded border border-slate-800 bg-slate-800/50 hover:bg-slate-800"
            >
              Закрыть [×]
            </button>
          </div>
        </div>

        {/* Scrollable Body Container */}
        <div className="overflow-y-auto subtle-scroll p-4 sm:p-5 flex-1">
          {filteredTZList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              Нет активных заказов для выбранной страны. Нажмите «+ Новое ТЗ», чтобы запросить конкурсные требования министерства.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTZList.map((tz) => {
              const isCurrent = activeTZId === tz.id;
              return (
                <div
                  key={tz.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500 shadow-md'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-cyan-400">
                        {tz.year} год · {tz.country}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                        {tz.market === 'military' ? 'Армейский заказ' : tz.market === 'civilian' ? 'Гражданский' : 'Смешанный'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 mt-1.5">{tz.title}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Заказчик: {tz.clientName}
                    </div>

                    <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                      {tz.description}
                    </p>

                    {/* Requirements Grid */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Класс патрона</span>
                        <span className="text-slate-200 font-semibold uppercase">{tz.requiredClass}</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Лимит массы</span>
                        <span className="text-slate-200 font-semibold">≤ {tz.maxMass} кг</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Надёжность ({tz.climate})</span>
                        <span className="text-cyan-400 font-semibold">≥ {tz.minReliability}%</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Лимит сметы</span>
                        <span className="text-slate-200 font-semibold">≤ {tz.maxUnitCost} ©</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Кучность</span>
                        <span className="text-emerald-400 font-semibold">≤ {tz.minAccuracyMOA} MOA</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Темп стрельбы</span>
                        <span className="text-slate-200 font-semibold">≥ {tz.minRate} в/м</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-xs font-mono text-slate-400">
                      Награда: <span className="text-emerald-400 font-bold">+{tz.budgetReward} ©</span> ·{' '}
                      Престиж: <span className="text-cyan-400 font-bold">+{tz.prestigeReward}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTZ(tz);
                        onClose();
                      }}
                      className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-slate-800 text-cyan-300'
                          : 'bg-cyan-600 text-white hover:bg-cyan-500'
                      }`}
                    >
                      {isCurrent ? 'Текущее ТЗ' : 'Взять в разработку'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
);
};
