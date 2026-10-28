import React, { useState } from 'react';
import {
  DerivedStats,
  TechnicalSpecification,
  ValidationIssue,
  WeaponSlots,
} from '../types';
import { checkTZCompliance } from '../engine/physics';
import { sounds } from '../utils/audio';

interface TTXPanelProps {
  derived: DerivedStats;
  slots: WeaponSlots;
  tz: TechnicalSpecification | null;
  issues: ValidationIssue[];
  onSubmitToContest?: () => void;
  onOpenFormulaExplainer?: (statName: string) => void;
}

export const TTXPanel: React.FC<TTXPanelProps> = ({
  derived,
  slots,
  tz,
  issues,
  onSubmitToContest,
}) => {
  const [selectedFormula, setSelectedFormula] = useState<string | null>(null);

  const compliance = tz ? checkTZCompliance(derived, tz, slots) : null;
  const hasCriticalErrors = issues.some((i) => i.type === 'error');

  // Detailed Engineering Breakdowns (БЛОК 4.1)
  const mb = derived.massBreakdown;
  const cb = derived.costBreakdown;

  const formulaExplanations: Record<
    string,
    { title: string; formula: string; explanation: string }
  > = {
    velocity: {
      title: 'Начальная скорость пули (v)',
      formula: 'v = min(v_limit, vRef * (0.55 + 0.45 * min(1.0, L_ствола / lRef)))',
      explanation: `Базовая скорость для патрона ${slots.cartridge.name}: ${slots.cartridge.vRef} м/с при эталоне ${slots.cartridge.lRef} мм. При текущей длине ствола ${slots.barrel.length} мм скорость составляет ${derived.velocity} м/с (лимит класса: 940/960 м/с).`,
    },
    energy: {
      title: 'Дульная кинетическая энергия (E)',
      formula: 'E = min(E_limit, 0.5 * (m_пули / 1000) * v²)',
      explanation: `Пуля массой ${slots.cartridge.bulletMass} г на скорости ${derived.velocity} м/с генерирует ${derived.energy} Дж дульной энергии. Действует строгое ограничение по классу патрона.`,
    },
    mass: {
      title: 'Масса оружия без патронов (по ТЗ)',
      formula: 'M = Ствол + Ресивер + Затвор + Магазин (пустой) + Приклад + Цевьё + Обвес + Механизмы',
      explanation: `Точная калькуляция массы по узлам:\n• Ствол (${slots.barrel.length} мм, ${slots.barrel.profile}): ${mb.barrel} кг\n• Ресивер (${slots.receiver.method}): ${mb.receiver} кг\n• Затвор и газовый узел: ${mb.action} кг\n• Пустой магазин (${slots.magazine.type}, ${slots.magazine.capacity} мест): ${mb.magazine} кг\n• Приклад: ${mb.stock} кг\n• Цевьё: ${mb.handguard} кг\n• Прицелы и планки: ${mb.attachments} кг\n• Механизмы УСМ: ${mb.other} кг\n\nИтого масса без патронов (по ТЗ): ${derived.weaponMass} кг\nБоеприпасы в магазине (${slots.magazine.capacity} шт.): +${mb.ammo ?? 0} кг\nПолная снаряжённая масса: ${derived.loadedMass ?? (derived.weaponMass + (mb.ammo || 0)).toFixed(2)} кг.`,
    },
    cost: {
      title: 'Себестоимость серии (©)',
      formula: 'unitCost = Сумма узлов + Наценка метода обработки',
      explanation: `Сумма деталей: ${cb.nodesSum} ©. Наценка за метод обработки (${slots.receiver.method}): +${cb.productionMarkup} ©. При крупной серии штамповка обходится дешевле всего, фрезеровка увеличивает станкоёмкость.`,
    },
    reliability: {
      title: 'Коэффициент надёжности (%)',
      formula: 'reliability = base(автоматика) - климатический штраф + бонусы узлов',
      explanation: `Базовая надёжность ${slots.action.type}: ${slots.action.reliabilityBase}%. Климат "${tz?.climate || 'норма'}" даёт полигонный штраф. ${slots.action.gasAdjustable ? 'Регулируемый газоотвод компенсирует -8% штрафа.' : 'Нерегулируемый газоотвод чувствителен к загрязнению.'}`,
    },
    accuracy: {
      title: 'Кучность стрельбы (MOA)',
      formula: 'MOA = base(схема) + twistPenalty + (100 - triggerQuality)*0.025 - compensator',
      explanation: `База схемы: ${slots.action.type === 'manual' ? '1.4' : '2.8'} MOA. Отклонение шага нарезки от оптимума (${derived.optimalTwist} мм): твист-штраф. Качество спуска: ${derived.triggerQuality}%. Итоговое рассеивание: ${derived.accuracyMOA} MOA на 100 м.`,
    },
    recoil: {
      title: 'Ощущаемая отдача (Дж/кг)',
      formula: 'feltRecoil = [E * (1 - muzzleReduction) * (damper ? 0.85 : 1) * kClass] / weaponMass',
      explanation: `Коэффициент класса патрона: ${derived.recoilCoeff} (0.05 пистолетный, 0.09 промежуточный, 0.12 винтовочный). Энергия отдачи ${derived.recoilEnergy} Дж гасится массой оружия ${derived.weaponMass} кг.`,
    },
    recoilImpulse: {
      title: 'Импульс отдачи в плечо (I)',
      formula: 'I = (m_bullet * v0 + m_powder * v_gas) / 1000 * (1 - muzzleBrake)',
      explanation: `Физический импульс отдачи (толчок в плечо): ${derived.recoilImpulse} Н·с. При импульсе > 8 Н·с на лёгком оружии стрелок испытывает сильную боль (тег #BOLNO). Дульный тормоз-компенсатор снижает импульс.`,
    },
    muzzleClimb: {
      title: 'Подброс ствола (Muzzle Climb)',
      formula: 'climb = (I / mass) * kStock * kCompensator * kFrontBalance',
      explanation: `Угловой подброс ствола при выстреле: ${derived.muzzleClimb}°. Зависит от высоты приклада относительно оси канала ствола (прямая линия снижает подброс), компенсатора (до -52%) и смещения центра тяжести вперёд.`,
    },
    barrelRigidity: {
      title: 'Жёсткость ствола (%)',
      formula: 'Rigidity = profileBase * matFactor - lengthPenalty',
      explanation: `Индекс жёсткости ствола: ${derived.barrelRigidity}%. Длинный ствол увеличивает скорость пули, но НЕ улучшает кучность. Тонкий и длинный ствол при нагреве вибрирует (barrel whip) и теряет кучность. Тяжёлый профиль (Heavy) сохраняет sub-MOA точность.`,
    },
    triggerQuality: {
      title: 'Качество работы УСМ (%)',
      formula: 'triggerQuality = 100 - ход_спуска*k - тип - bullpupPenalty',
      explanation: `Ход спуска ${slots.trigger.pullLength} мм. ${derived.isBullpupPenaltyApplied ? 'ВНИМАНИЕ: Компоновка Bullpup даёт штраф -25 баллов из-за длинной гибкой спусковой тяги к шепталу!' : 'Классическая схема с прямым шепталом.'}`,
    },
  };

  // Stat Items with Full Formula Reveal & Color Coding (БЛОК 4.1, 4.2)
  const statItems = [
    {
      key: 'mass',
      label: 'Масса (без патронов)',
      val: `${derived.weaponMass} кг`,
      formulaSnippet: `(Ствол ${mb.barrel} + Рес. ${mb.receiver} + Затвор ${mb.action} + Маг. ${mb.magazine} + Приклад ${mb.stock} + Цевьё ${mb.handguard})`,
      req: tz ? `≤ ${tz.maxMass} кг` : null,
      passed: tz ? derived.weaponMass <= tz.maxMass : true,
      delta: tz ? derived.weaponMass - tz.maxMass : 0,
    },
    {
      key: 'cost',
      label: 'Себестоимость серии',
      val: `${derived.unitCost} ©`,
      formulaSnippet: `(Узлы: ${cb.nodesSum} + Наценка [${slots.receiver.method}]: ${cb.productionMarkup} ©)`,
      req: tz ? `≤ ${tz.maxUnitCost} ©` : null,
      passed: tz ? derived.unitCost <= tz.maxUnitCost : true,
      delta: tz ? derived.unitCost - tz.maxUnitCost : 0,
    },
    {
      key: 'reliability',
      label: 'Надёжность',
      val: `${derived.reliability}%`,
      formulaSnippet: `(База ${slots.action.reliabilityBase}% · Климат [${tz?.climate || 'норма'}])`,
      req: tz ? `≥ ${tz.minReliability}%` : null,
      passed: tz ? derived.reliability >= tz.minReliability : true,
      delta: tz ? tz.minReliability - derived.reliability : 0,
    },
    {
      key: 'accuracy',
      label: 'Кучность (MOA)',
      val: `${derived.accuracyMOA} MOA`,
      formulaSnippet: `(База ${slots.action.type === 'manual' ? '1.4' : '2.8'} + Жёсткость [${derived.barrelRigidity}%] + Спуск ${derived.triggerQuality}%)`,
      req: tz ? `≤ ${tz.minAccuracyMOA} MOA` : null,
      passed: tz ? derived.accuracyMOA <= tz.minAccuracyMOA : true,
      delta: tz ? derived.accuracyMOA - tz.minAccuracyMOA : 0,
    },
    {
      key: 'barrelRigidity',
      label: 'Жёсткость ствола',
      val: `${derived.barrelRigidity}%`,
      formulaSnippet: `(Профиль [${slots.barrel.profile}] · Длина ${slots.barrel.length} мм · ${slots.barrel.material})`,
      req: null,
      passed: true,
      delta: 0,
    },
    {
      key: 'velocity',
      label: 'Скорость пули (v)',
      val: `${derived.velocity} м/с`,
      formulaSnippet: `(База: ${slots.cartridge.vRef} м/с · Ствол: ${slots.barrel.length} мм · E: ${derived.energy} Дж)`,
      req: null,
      passed: true,
      delta: 0,
    },
    {
      key: 'recoilImpulse',
      label: 'Импульс отдачи',
      val: `${derived.recoilImpulse} Н·с`,
      formulaSnippet: `(Толчок в плечо: заряд ${slots.cartridge.bulletMass}г + порох · ДТК -${slots.muzzleDevice.recoilReduction}%)`,
      req: null,
      passed: true,
      delta: 0,
    },
    {
      key: 'muzzleClimb',
      label: 'Подброс ствола',
      val: `${derived.muzzleClimb}°`,
      formulaSnippet: `(Ось приклада [${slots.stock.type}] · Компенсатор [${slots.muzzleDevice.type}])`,
      req: null,
      passed: true,
      delta: 0,
    },
    {
      key: 'recoil',
      label: 'Ощущаемая отдача',
      val: `${derived.feltRecoil} Дж/кг`,
      formulaSnippet: `(${derived.recoilEnergy} Дж / ${derived.weaponMass} кг · Коэфф: ${derived.recoilCoeff})`,
      req: null,
      passed: true,
      delta: 0,
    },
    {
      key: 'cyclicRate',
      label: 'Темп стрельбы',
      val: `${derived.cyclicRate} в/м`,
      formulaSnippet: `(Схема: ${slots.action.type} · Режим: ${slots.trigger.mode})`,
      req: tz && tz.minRate > 0 ? `≥ ${tz.minRate} в/м` : null,
      passed: tz && tz.minRate > 0 ? derived.cyclicRate >= tz.minRate : true,
      delta: tz ? tz.minRate - derived.cyclicRate : 0,
    },
    {
      key: 'triggerQuality',
      label: 'Качество спуска (УСМ)',
      val: `${derived.triggerQuality}%`,
      formulaSnippet: derived.isBullpupPenaltyApplied
        ? `[Штраф Bullpup -25 баллов тяги!]`
        : `[Прямая тяга шептала]`,
      req: null,
      passed: true,
      delta: 0,
    },
    {
      key: 'standardization',
      label: 'Стандартизация',
      val: `${derived.standardization}%`,
      formulaSnippet: `(Планка: ${slots.topInterface.type} · Цевьё: ${slots.handguard.lowerInterface})`,
      req: tz ? `≥ ${tz.minStandardization}%` : null,
      passed: tz ? derived.standardization >= tz.minStandardization : true,
      delta: tz ? tz.minStandardization - derived.standardization : 0,
    },
  ];

  // Dynamic AI Chief Engineer Recommendations (БЛОК 4.3)
  const engineerAdvice: string[] = [];

  if (slots.receiver.strength < slots.cartridge.maxPressure) {
    engineerAdvice.push(
      `⛔ КРИТИЧЕСКИ: Ресивер не выдержит давление! Прочность ${slots.receiver.strength} бар ниже давления патрона ${slots.cartridge.maxPressure} бар. Смените материал на сталь или фрезеровку!`
    );
  }

  if (
    slots.action.type === 'blowback' &&
    (slots.cartridge.class === 'intermediate' || slots.cartridge.class === 'rifle')
  ) {
    engineerAdvice.push(
      `⛔ ОШИБКА АВТОМАТИКИ: Свободный затвор недопустим под ${slots.cartridge.class} патрон! Масса затвора будет слишком большой (более 2.5 кг). Перейдите на газоотводный двигатель.`
    );
  }

  if (derived.isBullpupPenaltyApplied) {
    engineerAdvice.push(
      `ℹ️ КОМПОНОВКА BULLPUP: Длинная тяга через корпус ухудшает качество спуска (-22 очка). Рекомендую установить двухступенчатый УСМ (Two-Stage) или отрегулировать спуск.`
    );
  }

  if (tz) {
    if (derived.weaponMass > tz.maxMass) {
      const diffGrams = Math.round((derived.weaponMass - tz.maxMass) * 1000);
      const massTips: string[] = [];
      if (slots.receiver.method === 'milled') {
        massTips.push('замените фрезерованный ресивер на штампованный (-550 г)');
      }
      if (slots.stock.type === 'fixedWood') {
        massTips.push('установите складной или полимерный приклад (-240..300 г)');
      }
      if (slots.barrel.profile === 'heavy') {
        massTips.push('облегчите профиль ствола с Heavy на Light/Medium (-350..500 г)');
      }
      if (slots.barrel.length > 420) {
        massTips.push('укоротите ствол на 40-80 мм (-120..220 г)');
      }
      if (slots.magazine.type === 'drum') {
        massTips.push('замените дисковый барабан на секторный коробчатый магазин (-350 г)');
      }
      if (slots.topAttachment && slots.topAttachment.mass > 0.3) {
        massTips.push('демонтируйте тяжёлый прицел');
      }

      const adviceText = massTips.length > 0
        ? `⚖️ ПЕРЕВЕС (+${diffGrams} г): Чтобы уложиться в норматив ${tz.maxMass} кг, ${massTips.slice(0, 2).join(' или ')}.`
        : `⚖️ ПЕРЕВЕС (+${diffGrams} г): Уменьшите длину ствола или установите облегченные узлы, чтобы уложиться в норматив ${tz.maxMass} кг.`;

      engineerAdvice.push(adviceText);
    }

    if (derived.unitCost > tz.maxUnitCost) {
      const diffCost = (derived.unitCost - tz.maxUnitCost).toFixed(1);
      engineerAdvice.push(
        `💰 ПРЕВЫШЕНИЕ СМЕТЫ (+${diffCost} ©): Рекомендую сменить метод производства ресивера на штамповку (экономия до ~6-8 ©) или убрать дорогостоящий обвес.`
      );
    }

    if (derived.reliability < tz.minReliability) {
      engineerAdvice.push(
        `🛡️ НАДЁЖНОСТЬ НИЖЕ НОРМАТИВА: В климате "${tz.climate}" рекомендую добавить регулируемый газоотвод (+5%) или заменить барабанный магазин на секторный коробчатый.`
      );
    }

    if (derived.accuracyMOA > tz.minAccuracyMOA) {
      engineerAdvice.push(
        `🎯 КУЧНОСТЬ: Отклонение шага нарезов ствола от оптимума (${derived.optimalTwist} мм). Скорректируйте твист в настройках ствола или используйте двухступенчатый спуск.`
      );
    }
  }

  if (engineerAdvice.length === 0) {
    engineerAdvice.push(
      '✓ Все технические узлы идеально согласованы. Схема не имеет прочностных противоречий и полностью удовлетворяет директивам ТЗ. Проект готов к конкурсу!'
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Critical Chamber Breakage Alert */}
      {derived.isBroken && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/80 shadow-lg flex items-center gap-3 text-red-200 animate-pulse">
          <span className="text-2xl">💥</span>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-red-100 uppercase tracking-wide">
              Отказ: Разрыв ствола и патронника при выстреле!
            </h4>
            <p className="text-xs text-red-300/90 mt-0.5">
              {derived.breakageReason || 'Пиковое давление пороховых газов превышает предел прочности ресивера. Оружие непригодно для испытаний и стрельбы.'}
            </p>
          </div>
        </div>
      )}

      {/* 1. Main TTX Table Grid with Formula Reveal & Strict Colors */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Сводная таблица ТТХ и Физика узлов
            </h3>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-cyan-400 font-mono">Калькуляция формул</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Кликните по параметру для разбора формулы
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {statItems.map((item) => {
            const hasRequirement = item.req !== null;
            const isPassing = item.passed;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSelectedFormula(item.key);
                }}
                className={`flex flex-col text-left rounded-lg p-3 transition-all border ${
                  hasRequirement && !isPassing
                    ? 'border-rose-700 bg-rose-950/35 hover:bg-rose-950/50 shadow-sm shadow-rose-950'
                    : hasRequirement && isPassing
                    ? 'border-emerald-700/80 bg-emerald-950/25 hover:bg-emerald-950/35'
                    : 'border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                  {hasRequirement && (
                    <span
                      className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isPassing
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-rose-950 text-rose-300 border border-rose-800/80'
                      }`}
                    >
                      {isPassing ? '✓ Норма ТЗ' : '✗ Брак'}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-lg font-bold font-mono tracking-tight tabular-nums ${
                      hasRequirement && !isPassing
                        ? 'text-rose-300'
                        : hasRequirement && isPassing
                        ? 'text-emerald-300'
                        : 'text-slate-100'
                    }`}
                  >
                    {item.val}
                  </span>
                  {item.req && (
                    <span className="text-[11px] font-mono text-slate-400">
                      [ТЗ: {item.req}]
                    </span>
                  )}
                </div>

                {/* Formula Breakdown Snippet (БЛОК 4.1) */}
                <div
                  className={`mt-1.5 text-[10px] font-mono truncate ${
                    hasRequirement && !isPassing
                      ? 'text-rose-300/90'
                      : 'text-cyan-400/80'
                  }`}
                  title={item.formulaSnippet}
                >
                  {item.formulaSnippet}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Chief Engineer's Dynamic Advisory Report (БЛОК 4.3) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Отчёт Главного инженера
            </h3>
            <span className="text-xs text-slate-500">·</span>
            <span
              className={`text-xs font-mono font-semibold ${
                hasCriticalErrors
                  ? 'text-rose-400'
                  : compliance?.passed
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {hasCriticalErrors
                ? 'Критический дефект'
                : compliance?.passed
                ? 'Проект готов к конкурсу'
                : 'Требуется инженерная доводка'}
            </span>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Ошибок: {issues.filter((i) => i.type === 'error').length} · Замечаний:{' '}
            {issues.filter((i) => i.type === 'warning').length}
          </div>
        </div>

        {/* Real-time Engineering Advice Feed */}
        <div className="mt-3 flex flex-col gap-2">
          {engineerAdvice.map((advice, idx) => {
            const isError = advice.startsWith('⛔');
            const isSuccess = advice.startsWith('✓');
            return (
              <div
                key={idx}
                className={`rounded-lg p-2.5 text-xs font-sans leading-relaxed border ${
                  isError
                    ? 'border-rose-800/90 bg-rose-950/40 text-rose-200 font-semibold'
                    : isSuccess
                    ? 'border-emerald-800/70 bg-emerald-950/25 text-emerald-300'
                    : 'border-cyan-900/60 bg-slate-950/60 text-slate-200'
                }`}
              >
                {advice}
              </div>
            );
          })}
        </div>

        {/* 3. Action Submit to Contest Button (БЛОК 3.3) */}
        {onSubmitToContest && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-[11px] font-mono text-slate-400">
              {hasCriticalErrors ? (
                <span className="text-rose-400 font-bold">
                  ⚠️ Устраните критические ошибки перед подачей!
                </span>
              ) : compliance?.passed ? (
                <span className="text-emerald-400 font-bold">
                  ✓ Все критерии ТЗ выполнены. Высокие шансы на победу.
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">
                  ℹ️ Допустимо к подаче (возможны замечания комиссии).
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playBoltCycle();
                onSubmitToContest();
              }}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold font-sans tracking-wide transition-all shadow-lg flex items-center gap-2 ${
                hasCriticalErrors
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900'
                  : compliance?.passed
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              }`}
            >
              <span>🏛️</span>
              <span>Подать проект на конкурс</span>
            </button>
          </div>
        )}
      </div>

      {/* Formula Explainer Modal */}
      {selectedFormula && formulaExplanations[selectedFormula] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-cyan-800 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-cyan-300">
                {formulaExplanations[selectedFormula].title}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedFormula(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1"
              >
                Закрыть [×]
              </button>
            </div>
            <div className="mt-4">
              <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-cyan-400 border border-cyan-950">
                {formulaExplanations[selectedFormula].formula}
              </div>
              <p className="mt-3 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {formulaExplanations[selectedFormula].explanation}
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedFormula(null)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-500 transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
