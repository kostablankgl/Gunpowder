import React, { useState, useMemo } from 'react';
import {
  WeaponSlots,
  DerivedStats,
  MarketSegment,
  CountryId,
  CivilianProduct,
} from '../types';
import { calculateDemand, SEGMENT_PROFILES } from '../engine/economy';
import {
  generateCustomerReviews,
  generateReviewText,
  REVIEW_TAGS_DICTIONARY,
} from '../engine/reviewGenerator';

interface CivilianMarketProps {
  weapon: WeaponSlots;
  derived: DerivedStats;
  country: CountryId;
  budget: number;
  onLaunchProduct?: (product: CivilianProduct, marketingBudget: number) => void;
  onSwitchToSemiAuto?: () => void;
  onClose?: () => void;
  initialSegment?: MarketSegment;
}

export const CivilianMarket: React.FC<CivilianMarketProps> = ({
  weapon,
  derived,
  country,
  budget,
  onLaunchProduct,
  onSwitchToSemiAuto,
  onClose,
  initialSegment = 'hunters',
}) => {
  const [segment, setSegment] = useState<MarketSegment>(initialSegment);
  const [priceInput, setPriceInput] = useState<number>(() => Math.round(derived.unitCost * 1.45));
  const [marketingBudget, setMarketingBudget] = useState<number>(50);
  const [showGeminiPrompt, setShowGeminiPrompt] = useState<boolean>(false);
  const [isLaunched, setIsLaunched] = useState<boolean>(false);

  // Recalculate price when unitCost changes if user hasn't heavily modified
  const currentProfile = SEGMENT_PROFILES[segment];

  const analysis = useMemo(() => {
    return calculateDemand(weapon, segment, priceInput, marketingBudget, derived);
  }, [weapon, segment, priceInput, marketingBudget, derived]);

  const reviews = useMemo(() => {
    return generateCustomerReviews(analysis.reviewTags, segment, weapon.cartridge.name);
  }, [analysis.reviewTags, segment, weapon.cartridge.name]);

  const geminiPrompt = useMemo(() => {
    return generateReviewText(analysis.reviewTags, segment, weapon.cartridge.name);
  }, [analysis.reviewTags, segment, weapon.cartridge.name]);

  // Projected 6-month sales points for chart
  const projectionMonths = useMemo(() => {
    const base = analysis.monthlySales;
    return [
      { month: '1 мес', sales: Math.round(base * 0.7), rev: Math.round(base * 0.7 * priceInput) },
      { month: '2 мес', sales: Math.round(base * 0.9), rev: Math.round(base * 0.9 * priceInput) },
      { month: '3 мес', sales: Math.round(base * 1.05), rev: Math.round(base * 1.05 * priceInput) },
      { month: '4 мес', sales: Math.round(base * 1.15), rev: Math.round(base * 1.15 * priceInput) },
      { month: '5 мес', sales: Math.round(base * 1.1), rev: Math.round(base * 1.1 * priceInput) },
      { month: '6 мес', sales: Math.round(base * 1.08), rev: Math.round(base * 1.08 * priceInput) },
    ];
  }, [analysis.monthlySales, priceInput]);

  const maxChartSales = Math.max(10, ...projectionMonths.map((m) => m.sales));

  const handleLaunch = () => {
    if (analysis.isForbidden || derived.isBroken) return;
    if (budget < marketingBudget) return;

    const newProduct: CivilianProduct = {
      id: `civ-prod-${Date.now()}`,
      name: `Гражданский ${weapon.cartridge.name}`,
      weaponName: `${weapon.cartridge.name} (${currentProfile.name.split(' ')[0]})`,
      caliber: `${weapon.cartridge.bulletDiameter}×${weapon.cartridge.caseLength} мм`,
      unitCost: derived.unitCost,
      retailPrice: priceInput,
      monthlySales: analysis.monthlySales,
      totalSold: 0,
      totalProfit: 0,
      customerRating: analysis.satisfactionRating,
      active: true,
    };

    if (onLaunchProduct) {
      onLaunchProduct(newProduct, marketingBudget);
    }
    setIsLaunched(true);
    setTimeout(() => setIsLaunched(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏪</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 tracking-wide uppercase">
                  Гражданский коммерческий рынок
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {country === 'USSR' ? 'Экспорт / Охотсоюз' : 'USA Commercial Market'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Расчёт спроса, ценообразования, маржинальности и реакция покупателей
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Бюджет КБ:</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{budget} ©</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                title="Закрыть"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* USSR Special Note */}
        {country === 'USSR' && (
          <div className="px-6 py-2 bg-rose-950/30 border-b border-rose-900/40 text-xs text-rose-300 flex items-center gap-2">
            <span>ℹ️</span>
            <span>
              <strong>Доктрина СССР:</strong> Внутри страны частная продажа оружия населению запрещена. Гражданские поставки оформляются как экспорт через В/О «Автоэкспорт» дружественным странам и промысловым артелям Росохотрыболовсоюза.
            </span>
          </div>
        )}

        {/* Legal Warnings & Safety Flags */}
        {analysis.isForbidden && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-purple-950/40 border border-purple-500/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⛔</span>
              <div>
                <h4 className="text-sm font-bold text-purple-200">
                  Оружие запрещено к гражданскому обороту!
                </h4>
                <p className="text-xs text-purple-300/80">
                  {analysis.forbiddenReason}
                </p>
              </div>
            </div>
            {onSwitchToSemiAuto && weapon.trigger.mode !== 'single' && (
              <button
                onClick={onSwitchToSemiAuto}
                className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md whitespace-nowrap"
              >
                <span>⚙️</span>
                <span>Переключить УСМ на одиночный (Single)</span>
              </button>
            )}
          </div>
        )}

        {derived.isBroken && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-red-950/60 border border-red-500/80 flex items-center gap-3 text-red-200 shadow-lg">
            <span className="text-3xl">💥</span>
            <div>
              <h4 className="text-sm font-bold text-red-100">
                Опасный технический брак: Разрыв патронника!
              </h4>
              <p className="text-xs text-red-300">
                {derived.breakageReason || 'Давление пороховых газов превышает прочность ресивера. Выпуск в продажу невозможен.'}
              </p>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Segment Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Целевой сегмент рынка:
              </span>
              <span className="text-xs text-slate-400">
                Ориентировочная готовность платить: <span className="text-slate-200 font-mono font-medium">до {currentProfile.maxPrice} ©</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['hunters', 'sports', 'self_defense'] as MarketSegment[]).map((segId) => {
                const prof = SEGMENT_PROFILES[segId];
                const active = segment === segId;
                return (
                  <button
                    key={segId}
                    onClick={() => {
                      setSegment(segId);
                      setPriceInput(Math.round(Math.max(derived.unitCost * 1.25, prof.targetPrice * 0.95)));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      active
                        ? 'bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">
                        {segId === 'hunters' ? '🦌' : segId === 'sports' ? '🎯' : '🛡️'}
                      </span>
                      {active && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      )}
                    </div>
                    <div className={`text-sm font-bold ${active ? 'text-slate-100' : 'text-slate-300'}`}>
                      {prof.name.split(' ')[0]}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                      {prof.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing & Economics Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Controls & Economics */}
            <div className="lg:col-span-2 bg-slate-950/50 p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Параметры ценообразования и рекламы</span>
                <span className="text-xs text-slate-500 normal-case">
                  Себестоимость производства: <strong className="text-slate-200 font-mono">{derived.unitCost} ©</strong>
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Retail Price Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-slate-300 font-medium">Розничная цена продажи:</label>
                    <span className="font-mono text-emerald-400 font-bold">{priceInput} ©</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={Math.ceil(derived.unitCost)}
                      max={5000}
                      step={10}
                      value={priceInput}
                      onChange={(e) => setPriceInput(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-500">© / шт.</span>
                  </div>

                  {/* Margin badges */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>
                      Маржа с единицы: <strong className="text-emerald-400 font-mono">+{analysis.unitMargin} ©</strong>
                    </span>
                    <span>
                      Наценка:{' '}
                      <strong className="text-slate-300 font-mono">
                        {Math.round(((priceInput - derived.unitCost) / derived.unitCost) * 100)}%
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Marketing Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-slate-300 font-medium">Маркетинговый бюджет:</label>
                    <span className="font-mono text-amber-400 font-bold">{marketingBudget} © / мес</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={300}
                    step={10}
                    value={marketingBudget}
                    onChange={(e) => setMarketingBudget(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Без рекламы (0 ©)</span>
                    <span>Агрессивная (300 ©)</span>
                  </div>
                </div>
              </div>

              {/* Price Presets */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Пресеты цены:</span>
                {[
                  { label: 'Народная (+20%)', mult: 1.2 },
                  { label: 'Оптимум (+50%)', mult: 1.5 },
                  { label: 'Премиум (+90%)', mult: 1.9 },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPriceInput(Math.round(derived.unitCost * p.mult))}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Sales Projection Chart */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Проекция объёма продаж (6 месяцев)
                  </span>
                  <span className="text-xs text-slate-400">
                    Спрос:{' '}
                    <strong
                      className={`font-mono ${
                        analysis.demandScore >= 70
                          ? 'text-emerald-400'
                          : analysis.demandScore >= 40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {analysis.demandScore} / 100
                    </strong>
                  </span>
                </div>

                {/* SVG / Bar Chart */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
                  <div className="h-28 flex items-end gap-2 sm:gap-4 px-2">
                    {projectionMonths.map((item, idx) => {
                      const heightPercent = analysis.monthlySales > 0 ? Math.max(8, Math.round((item.sales / maxChartSales) * 100)) : 4;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                          <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.sales} шт
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              analysis.isForbidden || derived.isBroken
                                ? 'bg-slate-800'
                                : idx === 2
                                ? 'bg-blue-500 shadow-md shadow-blue-500/20'
                                : 'bg-blue-600/70 hover:bg-blue-500/90'
                            }`}
                          />
                          <span className="text-[10px] text-slate-400">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Commercial Summary & Launch Action */}
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Финансовый итог
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Продажи в месяц:</span>
                    <span className="text-sm font-bold text-slate-100 font-mono">
                      {analysis.monthlySales} шт.
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Выручка (валовая):</span>
                    <span className="text-sm font-bold text-blue-400 font-mono">
                      {analysis.monthlyRevenue} © / мес
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Чистая прибыль:</span>
                    <span
                      className={`text-base font-bold font-mono ${
                        analysis.monthlyProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {analysis.monthlyProfit > 0 ? `+${analysis.monthlyProfit}` : analysis.monthlyProfit} ©
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Рейтинг покупателей:</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1 font-mono">
                      {'★'.repeat(Math.round(analysis.satisfactionRating))}
                      {'☆'.repeat(5 - Math.round(analysis.satisfactionRating))}
                      <span className="text-xs text-slate-300 ml-1">({analysis.satisfactionRating})</span>
                    </span>
                  </div>
                </div>

                {/* Verdict Callout */}
                <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-slate-200 block mb-0.5">Рыночный вердикт:</span>
                  {analysis.verdict}
                </div>
              </div>

              {/* Launch CTA */}
              <div className="pt-2">
                <button
                  onClick={handleLaunch}
                  disabled={analysis.isForbidden || derived.isBroken || budget < marketingBudget}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                    analysis.isForbidden || derived.isBroken || budget < marketingBudget
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 hover:shadow-emerald-900/60 active:scale-[0.99]'
                  }`}
                >
                  <span>🚀</span>
                  <span>
                    {isLaunched
                      ? 'Партия запущена в производство!'
                      : 'Выпустить в продажу'}
                  </span>
                </button>

                {budget < marketingBudget && (
                  <p className="text-[11px] text-rose-400 text-center mt-1.5">
                    Недостаточно средств для рекламной кампании ({marketingBudget} ©)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Feedback & Customer Reviews Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Отзывы покупателей и теги ТТХ
                </h3>
                <span className="text-xs text-slate-500 font-normal">
                  (основано на балансе веса, точности, импульса отдачи и цены)
                </span>
              </div>

              <button
                onClick={() => setShowGeminiPrompt(!showGeminiPrompt)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>{showGeminiPrompt ? 'Скрыть промпт LLM' : 'Просмотр промпта для Gemini'}</span>
                <span>{showGeminiPrompt ? '▲' : '▼'}</span>
              </button>
            </div>

            {/* Generated Review Tags Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Присвоенные теги:</span>
              {analysis.reviewTags.length > 0 ? (
                analysis.reviewTags.map((tagId) => {
                  const meta = REVIEW_TAGS_DICTIONARY[tagId] || {
                    id: tagId,
                    label: tagId,
                    color: 'bg-slate-700 text-slate-200 border-slate-600',
                  };
                  return (
                    <span
                      key={tagId}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-medium ${meta.color}`}
                      title={meta.description}
                    >
                      #{meta.label}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-slate-500 italic">Специфических тегов не выявлено</span>
              )}
            </div>

            {/* Gemini Prompt Preview Card */}
            {showGeminiPrompt && (
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 text-xs font-mono text-slate-300 space-y-1">
                <div className="text-blue-400 font-bold mb-1 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>Gemini LLM Prompt for Review Synthesis (generateReviewText):</span>
                </div>
                <pre className="whitespace-pre-wrap text-slate-300/90 leading-relaxed font-sans text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  {geminiPrompt}
                </pre>
              </div>
            )}

            {/* Reviews Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-base border border-slate-700">
                        {rev.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-200">{rev.author}</span>
                          {rev.verifiedPurchase && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              ✓ Куплено
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{rev.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center text-amber-400 text-xs">
                      {'★'.repeat(rev.rating)}
                      <span className="text-slate-600">{'★'.repeat(5 - rev.rating)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    «{rev.text}»
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                    <div className="flex items-center gap-1">
                      {rev.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="text-slate-500">{rev.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
