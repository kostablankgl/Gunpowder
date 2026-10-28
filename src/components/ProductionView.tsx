import React from 'react';
import { ProductionContract, CountryId } from '../types';

interface ProductionViewProps {
  contracts: ProductionContract[];
  country: CountryId;
  budget: number;
  onAdvanceMonth: () => void;
  onClose: () => void;
}

export const ProductionView: React.FC<ProductionViewProps> = ({
  contracts,
  country,
  budget,
  onAdvanceMonth,
  onClose,
}) => {
  const totalMonthlyRevenue = contracts.reduce((sum, c) => {
    if (!c.active) return sum;
    const netPerUnit = c.unitRevenue - c.unitCost;
    return sum + Math.round(netPerUnit * (c.monthlyProduction / 1000));
  }, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto subtle-scroll p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md flex justify-center items-start">
      <div className="w-full max-w-4xl my-auto max-h-[92vh] flex flex-col rounded-2xl border border-cyan-800/80 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Pinned Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Заводской отдел и снабжение
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 mt-0.5">
              Серийное производство и государственные контракты
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Текущий баланс КБ: <span className="font-mono text-emerald-400 font-bold">{budget} ©</span> ·
              Чистый доход в месяц: <span className="font-mono text-cyan-300 font-bold">+{totalMonthlyRevenue} ©</span>
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
        <div className="overflow-y-auto subtle-scroll p-4 sm:p-5 flex-1 space-y-4">
          {contracts.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-8 text-center text-xs text-slate-400">
              <p>У вашего КБ пока нет утверждённых серийных контрактов.</p>
              <p className="mt-1 text-slate-500">
                Спроектируйте оружие по техническому заданию (ТЗ), победите в конкурсе у конкурирующих бюро, и министерство обороны откроет заводскую линию!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contracts.map((c) => {
                const percentDone = Math.min(100, Math.round((c.producedSoFar / c.batchSize) * 100));
                const unitProfit = Number((c.unitRevenue - c.unitCost).toFixed(1));
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-cyan-400 uppercase">
                          {c.type === 'military' ? 'Госзаказ армии' : 'Гражданский рынок'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {percentDone}% серии
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-100 mt-1">{c.name}</h4>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Образец: {c.weaponName}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 transition-all duration-300"
                          style={{ width: `${percentDone}%` }}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800/60">
                          <span className="text-slate-500 block text-[10px]">Выпуск в месяц</span>
                          <span className="text-slate-200 font-bold">{c.monthlyProduction.toLocaleString()} шт.</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800/60">
                          <span className="text-slate-500 block text-[10px]">Маржа за единицу</span>
                          <span className="text-emerald-400 font-bold">+{unitProfit} ©</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Произведено: {c.producedSoFar.toLocaleString()} / {c.batchSize.toLocaleString()}</span>
                      <span className={c.active ? 'text-emerald-400' : 'text-slate-500'}>
                        {c.active ? '✓ Линия активна' : 'Завершён'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <div className="border-t border-slate-800 p-4 shrink-0 bg-slate-900/95 flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            {country === 'USSR'
              ? 'Экономика СССР: крупная серия и низкие издержки на штамповку.'
              : 'Экономика США: высокая маржинальность гражданского рынка.'}
          </div>
          <button
            type="button"
            onClick={onAdvanceMonth}
            className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-lg ml-auto"
          >
            Производственный цикл (+1 месяц)
          </button>
        </div>
      </div>
    </div>
  );
};
