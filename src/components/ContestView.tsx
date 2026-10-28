import React, { useState, useEffect } from 'react';
import {
  TechnicalSpecification,
  DerivedStats,
  WeaponSlots,
  CountryId,
  ContestResult,
} from '../types';
import { evaluateContest } from '../engine/physics';

interface ContestViewProps {
  tz: TechnicalSpecification;
  derived: DerivedStats;
  slots: WeaponSlots;
  country: CountryId;
  onFinishContest: (result: ContestResult) => void;
  onCancel: () => void;
}

export const ContestView: React.FC<ContestViewProps> = ({
  tz,
  derived,
  slots,
  country,
  onFinishContest,
  onCancel,
}) => {
  const [trialStage, setTrialStage] = useState<'testing' | 'evaluating' | 'verdict'>('testing');
  const [testProgress, setTestProgress] = useState<number>(0);
  const [currentTestName, setCurrentTestName] = useState<string>('Климатическая камера (пылевой бокс)...');
  const [targetHits, setTargetHits] = useState<{ x: number; y: number }[]>([]);

  const [result, setResult] = useState<ContestResult | null>(null);

  useEffect(() => {
    // Generate evaluation result upfront
    const evalResult = evaluateContest(derived, slots, tz, country);
    setResult(evalResult);

    // Simulation steps
    const interval = setInterval(() => {
      setTestProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTrialStage('verdict');
          return 100;
        }

        const next = prev + 12;
        if (next < 35) {
          setCurrentTestName(`Климатическая камера: испытание в условиях "${tz.climate}"...`);
        } else if (next < 70) {
          setCurrentTestName('Стрельба на кучность: отстрел 5 серий по 10 выстрелов на 100м...');
          // Add bullet holes around center based on MOA
          const radiusScale = Math.min(65, derived.accuracyMOA * 12);
          const newHits = Array.from({ length: 5 }).map(() => ({
            x: 100 + (Math.random() - 0.5) * radiusScale,
            y: 100 + (Math.random() - 0.5) * radiusScale,
          }));
          setTargetHits((old) => [...old, ...newHits]);
        } else {
          setCurrentTestName('Заседание приёмочной комиссии: сопоставление сметы и конкурентов...');
        }
        return next;
      });
    }, 280);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto subtle-scroll">
      <div className="w-full max-w-4xl rounded-2xl border border-cyan-800/80 bg-slate-900 p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Полигонные испытания и конкурс
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-1">{tz.title}</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Заказчик: {tz.clientName} · Лимит серии: {tz.targetBatchSize.toLocaleString()} ед.
            </div>
          </div>
          {trialStage === 'verdict' && (
            <button
              onClick={onCancel}
              className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded border border-slate-800"
            >
              Закрыть [Esc]
            </button>
          )}
        </div>

        {/* Phase 1: Interactive Simulation in Progress */}
        {trialStage === 'testing' && (
          <div className="py-8 flex flex-col items-center">
            {/* Target Display and Chamber */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl items-center mb-6">
              {/* Target SVG */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono text-slate-400 mb-2">
                  Мишень 100м (Кучность {derived.accuracyMOA} MOA)
                </span>
                <svg width="200" height="200" viewBox="0 0 200 200" className="rounded-full bg-slate-950 border border-cyan-900 shadow-inner">
                  {/* Concentric rings */}
                  <circle cx="100" cy="100" r="90" fill="none" stroke="#334155" strokeWidth="1" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#334155" strokeWidth="1" />
                  <circle cx="100" cy="100" r="50" fill="none" stroke="#334155" strokeWidth="1" />
                  <circle cx="100" cy="100" r="30" fill="none" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="100" cy="100" r="10" fill="#0284c7" />
                  {/* Crosshairs */}
                  <line x1="10" y1="100" x2="190" y2="100" stroke="#1e293b" strokeWidth="1" />
                  <line x1="100" y1="10" x2="100" y2="190" stroke="#1e293b" strokeWidth="1" />
                  {/* Bullet holes */}
                  {targetHits.map((hit, idx) => (
                    <circle
                      key={idx}
                      cx={hit.x}
                      cy={hit.y}
                      r="3.5"
                      fill="#f8fafc"
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                  ))}
                </svg>
              </div>

              {/* Status and endurance box */}
              <div className="flex flex-col gap-3 rounded-xl bg-slate-950 p-4 border border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Надёжность в испытаниях:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {derived.reliability}% ({derived.reliability >= tz.minReliability ? 'В норме' : 'Задержки'})
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Темп непрерывной очереди:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {derived.cyclicRate} в/м
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Нагрев ствола:</span>
                  <span className="font-mono text-slate-300">
                    {slots.barrel.profile === 'heavy' ? 'Низкий (матчевый)' : 'Умеренный'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Климат полигона:</span>
                  <span className="font-mono text-amber-400 font-semibold uppercase">
                    {tz.climate}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xl">
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-2">
                <span>{currentTestName}</span>
                <span>{testProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                  style={{ width: `${testProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Verdict & Comparison Table */}
        {trialStage === 'verdict' && result && (
          <div className="py-4 space-y-6">
            {/* Verdict Banner */}
            <div
              className={`rounded-xl p-5 border ${
                result.verdict === 'accepted'
                  ? 'border-emerald-600/80 bg-emerald-950/30 text-emerald-200'
                  : result.verdict === 'accepted_with_notes'
                  ? 'border-amber-600/80 bg-amber-950/30 text-amber-200'
                  : 'border-rose-600/80 bg-rose-950/30 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">
                  {result.verdict === 'accepted'
                    ? '🏆'
                    : result.verdict === 'accepted_with_notes'
                    ? '📜'
                    : '❌'}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {result.verdictTitle}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    {result.verdictText}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono">
                    <span className="text-emerald-400 font-bold">
                      Премия за конкурс: +{result.payout} ©
                    </span>
                    <span className="text-cyan-400 font-bold">
                      Репутация КБ: {result.reputationGain >= 0 ? `+${result.reputationGain}` : result.reputationGain}
                    </span>
                    <span className="text-slate-300">
                      Итоговое место: #{result.rank} из {result.totalCompetitors}
                    </span>
                  </div>

                  {/* Explicit Score Matchup Callout (БЛОК 5.2) */}
                  {result.competitors.length > 0 && (
                    <div className="mt-3.5 rounded-lg bg-slate-950/80 border border-slate-800 p-2.5 font-mono text-xs">
                      {result.rank === 1 && result.passed ? (
                        <span className="text-emerald-300 font-bold">
                          ★ Ваш проект: {result.playerScore} баллов. Проект {result.competitors[0]?.bureauName}: {result.competitors[0]?.score} баллов. Вы победили в конкурсе!
                        </span>
                      ) : (
                        <span className="text-rose-300 font-bold">
                          ✗ Ваш проект: {result.playerScore} баллов. Проект {result.competitors.slice().sort((a,b)=>b.score-a.score)[0]?.bureauName}: {result.competitors.slice().sort((a,b)=>b.score-a.score)[0]?.score} баллов. Вы проиграли конкурс.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Criteria Verification Breakdown */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                Протокол приёмочной комиссии
              </h4>
              <div className="divide-y divide-slate-800/80 text-xs">
                {result.criteriaBreakdown.map((c, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          c.status === 'pass' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {c.status === 'pass' ? '✓' : '✗'}
                      </span>
                      <span className="text-slate-200 font-medium">{c.criterion}</span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-slate-400 font-mono">Требование: {c.requirement}</span>
                      <span
                        className={`font-mono font-bold ${
                          c.status === 'pass' ? 'text-slate-100' : 'text-rose-400'
                        }`}
                      >
                        {c.playerValue}
                      </span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">{c.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitors Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                Сводная таблица конкурса (Ваше КБ vs Конкуренты)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Участник конкурса</th>
                      <th className="pb-2">Надёжность</th>
                      <th className="pb-2">Масса</th>
                      <th className="pb-2">Себестоимость</th>
                      <th className="pb-2">Кучность (MOA)</th>
                      <th className="pb-2">Баллы</th>
                      <th className="pb-2">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {/* Player Row */}
                    <tr className="bg-cyan-950/20 text-cyan-200 font-semibold">
                      <td className="py-2.5 text-slate-100 font-sans">
                        ★ Ваше Конструкторское бюро
                      </td>
                      <td className="py-2.5">{derived.reliability}%</td>
                      <td className="py-2.5">{derived.weaponMass} кг</td>
                      <td className="py-2.5">{derived.unitCost} ©</td>
                      <td className="py-2.5">{derived.accuracyMOA} MOA</td>
                      <td className="py-2.5 text-cyan-300 font-bold">{result.playerScore}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            result.passed ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {result.passed ? 'Прошёл' : 'Брак'}
                        </span>
                      </td>
                    </tr>
                    {/* Competitor Rows */}
                    {result.competitors.map((comp, idx) => (
                      <tr key={idx} className="text-slate-300">
                        <td className="py-2.5 text-slate-200 font-sans">
                          {comp.bureauName} ({comp.weaponName})
                        </td>
                        <td className="py-2.5">{comp.derived.reliability}%</td>
                        <td className="py-2.5">{comp.derived.weaponMass} кг</td>
                        <td className="py-2.5">{comp.derived.unitCost} ©</td>
                        <td className="py-2.5">{comp.derived.accuracyMOA} MOA</td>
                        <td className="py-2.5 font-bold">{comp.score}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              comp.passedThresholds ? 'bg-slate-800 text-slate-300' : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {comp.passedThresholds ? 'Прошёл' : 'Брак'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => onFinishContest(result)}
                className="rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-lg"
              >
                Утвердить итоги конкурса
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
