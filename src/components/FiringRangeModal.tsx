import React, { useState } from 'react';
import { WeaponSlots, DerivedStats } from '../types';
import { sounds } from '../utils/audio';

interface FiringRangeModalProps {
  slots: WeaponSlots;
  derived: DerivedStats;
  onClose: () => void;
}

interface ShotHit {
  id: number;
  x: number;
  y: number;
  shotNumber: number;
}

export const FiringRangeModal: React.FC<FiringRangeModalProps> = ({
  slots,
  derived,
  onClose,
}) => {
  const [hits, setHits] = useState<ShotHit[]>([]);
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [stoppageNotice, setStoppageNotice] = useState<string | null>(null);
  const [totalShotsFired, setTotalShotsFired] = useState<number>(0);

  const isSuppressed = slots.muzzleDevice.type === 'suppressor';
  const isAutoCapable = slots.trigger.mode === 'auto' || slots.trigger.mode === 'both';

  const fireSingle = () => {
    if (isFiring) return;
    setStoppageNotice(null);

    // Stoppage check based on reliability
    const failureChance = Math.max(0.01, (100 - derived.reliability) / 250);
    if (Math.random() < failureChance) {
      sounds.playMechanicalClick();
      setStoppageNotice('Задержка при подаче патрона: клин затвора! Устраните дефект или передёрните рукоятку.');
      return;
    }

    sounds.playGunshot(isSuppressed);

    // Calculate spread based on MOA: 1 MOA at 100m is ~2.9 cm
    // Target canvas is 300x300, center is (150, 150)
    // 1 MOA ~ 8 pixels radius on this scaled target
    const radiusPixels = derived.accuracyMOA * 6.5;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.pow(Math.random(), 0.6) * radiusPixels;
    const hitX = Math.round(150 + Math.cos(angle) * distance);
    const hitY = Math.round(150 + Math.sin(angle) * distance);

    const newHit: ShotHit = {
      id: Date.now() + Math.random(),
      x: Math.max(10, Math.min(290, hitX)),
      y: Math.max(10, Math.min(290, hitY)),
      shotNumber: totalShotsFired + 1,
    };

    setHits((prev) => [...prev, newHit]);
    setTotalShotsFired((prev) => prev + 1);
  };

  const fireBurst = () => {
    if (isFiring) return;
    setIsFiring(true);
    setStoppageNotice(null);

    let count = 0;
    const burstCount = 8;
    const intervalTime = Math.max(60, Math.round(60000 / derived.cyclicRate));

    const burstTimer = setInterval(() => {
      count++;
      sounds.playGunshot(isSuppressed);

      // Recoil climb upwards
      const recoilClimb = (count - 1) * (derived.feltRecoil * 1.8);
      const radiusPixels = derived.accuracyMOA * 7.0;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.pow(Math.random(), 0.6) * radiusPixels;

      const hitX = Math.round(150 + Math.cos(angle) * distance + (Math.random() - 0.5) * 8);
      const hitY = Math.round(150 + Math.sin(angle) * distance - recoilClimb);

      setHits((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: Math.max(10, Math.min(290, hitX)),
          y: Math.max(10, Math.min(290, hitY)),
          shotNumber: totalShotsFired + count,
        },
      ]);

      if (count >= burstCount) {
        clearInterval(burstTimer);
        setIsFiring(false);
        setTotalShotsFired((prev) => prev + count);
      }
    }, intervalTime);
  };

  const handleClearTarget = () => {
    sounds.playMechanicalClick();
    setHits([]);
    setStoppageNotice(null);
  };

  // Group size calculation
  const groupDiameterCm = React.useMemo(() => {
    if (hits.length < 2) return null;
    let maxDistSq = 0;
    for (let i = 0; i < hits.length; i++) {
      for (let j = i + 1; j < hits.length; j++) {
        const dx = hits[i].x - hits[j].x;
        const dy = hits[i].y - hits[j].y;
        const dSq = dx * dx + dy * dy;
        if (dSq > maxDistSq) maxDistSq = dSq;
      }
    }
    const maxPix = Math.sqrt(maxDistSq);
    // 1 MOA ~ 2.9 cm ~ 6.5 pixels
    return Number(((maxPix / 6.5) * 2.9).toFixed(1));
  }, [hits]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto subtle-scroll">
      <div className="w-full max-w-3xl rounded-2xl border border-cyan-800/80 bg-slate-900 p-6 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Полигонный тир КБ
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              Пробный отстрел на 100 метров
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Калибр: {slots.cartridge.name} · Кучность по формуле: {derived.accuracyMOA} MOA ·
              Скорость пули: {derived.velocity} м/с
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded border border-slate-800"
          >
            Выход [×]
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Target Display Canvas */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg
                width="300"
                height="300"
                viewBox="0 0 300 300"
                className="rounded-full bg-slate-950 border-2 border-cyan-900 shadow-2xl"
              >
                {/* Outer concentric scoring rings */}
                <circle cx="150" cy="150" r="140" fill="none" stroke="#1e293b" strokeWidth="1" />
                <circle cx="150" cy="150" r="115" fill="none" stroke="#334155" strokeWidth="1" />
                <circle cx="150" cy="150" r="90" fill="none" stroke="#334155" strokeWidth="1.2" />
                <circle cx="150" cy="150" r="65" fill="none" stroke="#475569" strokeWidth="1.5" />
                <circle cx="150" cy="150" r="40" fill="none" stroke="#64748b" strokeWidth="1.8" />
                <circle cx="150" cy="150" r="16" fill="#0284c7" />
                <circle cx="150" cy="150" r="5" fill="#f8fafc" />

                {/* Crosshairs */}
                <line x1="15" y1="150" x2="285" y2="150" stroke="#1e293b" strokeWidth="1" />
                <line x1="150" y1="15" x2="150" y2="285" stroke="#1e293b" strokeWidth="1" />

                {/* Bullet Holes */}
                {hits.map((h) => (
                  <g key={h.id}>
                    <circle cx={h.x} cy={h.y} r="4.2" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
                    <circle cx={h.x} cy={h.y} r="1.5" fill="#0f172a" />
                  </g>
                ))}
              </svg>

              {/* Suppressor / Muzzle device indicator badge */}
              <div className="absolute top-2 right-2 rounded bg-slate-900/90 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-slate-700">
                {isSuppressed ? 'ПБС (Глушитель)' : slots.muzzleDevice.type !== 'none' ? 'ДТК установлен' : 'Без ДТК'}
              </div>
            </div>

            <div className="mt-3 text-xs font-mono text-slate-400">
              Мишень №4 армейская (дистанция 100м)
            </div>
          </div>

          {/* Controls & Statistics */}
          <div className="space-y-4">
            {/* Stats Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Сделано выстрелов:</span>
                <span className="text-slate-100 font-bold">{hits.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Диаметр рассеивания:</span>
                <span className="text-cyan-300 font-bold">
                  {groupDiameterCm !== null ? `${groupDiameterCm} см (~${(groupDiameterCm / 2.9).toFixed(1)} MOA)` : 'Требуется ≥2 выстрелов'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Импульс отдачи:</span>
                <span className="text-slate-200">
                  {derived.feltRecoil} Дж/кг ({slots.stock.recoilDamper ? 'Демпфер активен' : 'Обычный затыльник'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Надёжность узлов:</span>
                <span className="text-emerald-400 font-bold">{derived.reliability}%</span>
              </div>
            </div>

            {/* Stoppage Alert Banner */}
            {stoppageNotice && (
              <div className="rounded-lg border border-rose-900/80 bg-rose-950/40 p-3 text-xs text-rose-300">
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  <span>⛔</span> Осечка / Задержка
                </div>
                <p>{stoppageNotice}</p>
              </div>
            )}

            {/* Firing Action Buttons */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={isFiring}
                  onClick={fireSingle}
                  className="rounded-xl bg-cyan-600 px-4 py-3 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-md disabled:opacity-50"
                >
                  Одиночный выстрел
                </button>
                <button
                  disabled={isFiring || !isAutoCapable}
                  onClick={fireBurst}
                  className={`rounded-xl px-4 py-3 text-xs font-semibold transition-colors shadow-md ${
                    isAutoCapable
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isAutoCapable ? 'Очередь (8 выстр.)' : 'Только одиночный УСМ'}
                </button>
              </div>

              <button
                onClick={handleClearTarget}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
              >
                Очистить мишень (Новая серия)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
