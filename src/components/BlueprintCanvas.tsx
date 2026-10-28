import React, { useMemo } from 'react';
import { WeaponSlots, WeaponLayout, DerivedStats, ValidationIssue } from '../types';

interface BlueprintCanvasProps {
  slots: WeaponSlots;
  layout: WeaponLayout;
  derived: DerivedStats;
  activeSlot: keyof WeaponSlots | null;
  onSelectSlot: (slot: keyof WeaponSlots) => void;
  issues: ValidationIssue[];
  onOpenFiringRange?: () => void;
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  slots,
  layout,
  derived,
  activeSlot,
  onSelectSlot,
  issues,
  onOpenFiringRange,
}) => {
  const {
    cartridge,
    barrel,
    action,
    receiver,
    magazine,
    trigger,
    stock,
    topInterface,
    handguard,
    muzzleDevice,
    topAttachment,
    lowerAttachment,
  } = slots;

  // Error mappings per slot
  const issuesBySlot = useMemo(() => {
    const map: Record<string, 'error' | 'warning'> = {};
    issues.forEach((iss) => {
      if (iss.affectedSlot) {
        if (!map[iss.affectedSlot] || iss.type === 'error') {
          map[iss.affectedSlot] = iss.type;
        }
      }
    });
    return map;
  }, [issues]);

  // Weapon Class / Archetype Detection
  const isBullpup = layout === 'bullpup';
  const isPistol =
    !isBullpup &&
    (stock.type === 'none' || magazine.position === 'grip') &&
    (barrel.length <= 165 || cartridge.class === 'pistol');

  const isSMG = !isPistol && !isBullpup && cartridge.class === 'pistol';
  const isSniper = !isPistol && !isBullpup && (cartridge.class === 'rifle' || barrel.length >= 580);
  const isAssaultRifle = !isPistol && !isBullpup && !isSMG && !isSniper;

  // Slot highlight styling helper
  const slotHighlight = (slotName: keyof WeaponSlots) => {
    const isSelected = activeSlot === slotName;
    const issue = issuesBySlot[slotName];

    let strokeColor = '#38bdf8'; // cyan-400
    let fillColor = 'rgba(56, 189, 248, 0.08)';

    if (issue === 'error') {
      strokeColor = '#f43f5e'; // rose-500
      fillColor = 'rgba(244, 63, 94, 0.22)';
    } else if (issue === 'warning') {
      strokeColor = '#fbbf24'; // amber-400
      fillColor = 'rgba(251, 191, 36, 0.16)';
    } else if (isSelected) {
      strokeColor = '#06b6d4'; // cyan-500
      fillColor = 'rgba(6, 182, 212, 0.28)';
    }

    return {
      stroke: strokeColor,
      fill: fillColor,
      cursor: 'pointer',
      strokeWidth: isSelected ? 2.5 : 1.6,
    };
  };

  // =========================================================================
  // GEOMETRY & BOUNDS (Calculated for Auto-Centering and Zoom-to-Fit)
  // =========================================================================

  // Long-Gun Dimensions
  const barrelPixLen = Math.max(90, Math.min(380, barrel.length * 0.56));
  const barrelThickness = barrel.profile === 'heavy' ? 14 : barrel.profile === 'medium' ? 10 : 7;
  const receiverWidth = Math.max(160, Math.min(240, (receiver.length || 320) * 0.58));
  const receiverHeight = 52;
  const receiverX = isBullpup ? 350 : 420;
  const receiverY = 185;

  const barrelX = receiverX + receiverWidth - 10;
  const barrelY = receiverY + 16;

  const stockLenPix = Math.max(80, Math.min(180, (stock.length || 300) * 0.46));
  const stockX = isBullpup ? receiverX - 28 : receiverX - stockLenPix;
  const stockY = receiverY + (isBullpup ? 6 : 8);

  const rifleGripX = isBullpup ? receiverX + 75 : receiverX + 38;
  const rifleGripY = receiverY + receiverHeight;

  const rifleMagX = isBullpup ? receiverX + 18 : receiverX + receiverWidth - 80;
  const rifleMagY = receiverY + receiverHeight - 4;
  const rifleMagWidth = cartridge.class === 'intermediate' ? 32 : 36;
  const rifleMagHeight = magazine.type === 'drum' ? 72 : Math.min(125, Math.max(48, magazine.capacity * 2.8));

  const handguardLenPix = Math.min(barrelPixLen - 25, Math.max(70, handguard.length * 0.5));
  const handguardX = barrelX + 4;
  const handguardY = barrelY - 6;
  const handguardHeight = 32;

  // Top Interface position
  const railX = receiverX + 6;
  const railY = receiverY - (topInterface.height ? 10 : 6);
  const railWidth = receiverWidth + 30;

  // Pistol Dimensions
  const pistolSlideLen = Math.max(160, Math.min(240, barrel.length * 1.35));
  const pistolSlideH = 36;
  const pistolSlideX = 420;
  const pistolSlideY = 175;

  const pistolGripX = pistolSlideX + 22;
  const pistolGripY = pistolSlideY + pistolSlideH;
  const pistolBarrelTipLen = Math.max(16, (barrel.length - 110) * 0.4);

  // Muzzle Device Dimensions
  const muzzleX = isPistol ? pistolSlideX + pistolSlideLen + pistolBarrelTipLen : barrelX + barrelPixLen;
  const muzzleY = isPistol ? pistolSlideY + 14 : barrelY - (muzzleDevice.type === 'suppressor' ? 8 : 4);
  const muzzleWidth = muzzleDevice.type === 'suppressor' ? 68 : muzzleDevice.type !== 'none' ? 24 : 0;
  const muzzleHeight = muzzleDevice.type === 'suppressor' ? 26 : barrelThickness + 8;

  // Dynamic Auto-Centering and Zoom-to-fit
  const weaponLeftX = isPistol ? pistolGripX - 18 : isBullpup ? receiverX - 35 : stock.type === 'none' ? receiverX - 12 : stockX;
  const weaponRightX = muzzleX + muzzleWidth;
  const currentSpan = Math.max(180, weaponRightX - weaponLeftX);
  const currentMidX = (weaponLeftX + weaponRightX) / 2;

  const targetX = 475;
  const targetY = 205;
  const maxSafeWidth = 720;
  const fitScale = currentSpan > maxSafeWidth ? Math.max(0.62, maxSafeWidth / currentSpan) : 1.0;
  const transX = targetX - currentMidX * fitScale;
  const transY = targetY - 210 * fitScale;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-cyan-950/80 bg-slate-950 blueprint-grid shadow-2xl">
      {/* Top Blueprint Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-900/40 bg-slate-950/85 px-4 py-2.5 backdrop-blur-sm gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Чертёжная схема КБ
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-mono text-slate-300">
            {isPistol
              ? 'Самозарядный пистолет'
              : isBullpup
              ? 'Компоновка Bullpup'
              : isSMG
              ? 'Пистолет-пулемёт'
              : isSniper
              ? 'Снайперская винтовка'
              : 'Штурмовой автомат'}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-mono text-cyan-300">
            Калибр: {cartridge.name}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-mono text-slate-400">
            {receiver.method === 'stamped'
              ? 'Штампованная коробка'
              : receiver.method === 'milled'
              ? 'Фрезерованная коробка'
              : receiver.method === 'cast'
              ? 'Литой алюминий'
              : 'Полимерный ресивер'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>
            Габарит: <span className="font-semibold text-slate-200">{derived.overallLength} мм</span>
          </div>
          <div>
            Ствол: <span className="font-semibold text-slate-200">{barrel.length} мм</span>
          </div>
          <div>
            Масса: <span className="font-semibold text-slate-200">{derived.weaponMass} кг</span>
          </div>
          {onOpenFiringRange && (
            <button
              type="button"
              onClick={onOpenFiringRange}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-cyan-600/30 text-cyan-200 border border-cyan-500/50 hover:bg-cyan-600/50 hover:text-white transition-colors"
            >
              <span>🎯</span>
              <span>Тестовый отстрел 100м</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Blueprint Canvas Viewport */}
      <div className="relative w-full aspect-[21/9] min-h-[340px] max-h-[460px] bg-slate-950 flex items-center justify-center p-2">
        <svg
          viewBox="0 0 1000 420"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Fine Blueprint Grid pattern */}
            <pattern id="fineGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.07)" strokeWidth="0.8" />
            </pattern>
            {/* Metal Diagonal Hatch pattern */}
            <pattern id="diagHatch" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#38bdf8" strokeWidth="0.8" opacity="0.3" />
            </pattern>
            {/* Checkering Grip Texture pattern */}
            <pattern id="gripCheckering" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 0 3 L 3 0 L 6 3 L 3 6 Z" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.4" />
            </pattern>
            {/* Wood Grain pattern */}
            <pattern id="woodHatch" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 0,2 Q 6,6 12,2 M 0,8 Q 6,12 12,8" stroke="#ca8a04" strokeWidth="0.9" fill="none" opacity="0.45" />
            </pattern>
            {/* Technical Arrow marker */}
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Blueprint Background Grid */}
          <rect width="1000" height="420" fill="#020617" />
          <rect width="1000" height="420" fill="url(#fineGrid)" />

          {/* Central Technical Axis Lines */}
          <line x1="20" y1="210" x2="980" y2="210" stroke="rgba(56, 189, 248, 0.16)" strokeDasharray="14 4 2 4" strokeWidth="1" />

          {/* Scaled & Centered Weapon Assembly Group */}
          <g transform={`translate(${transX}, ${transY}) scale(${fitScale})`}>

            {/* ========================================================================= */}
            {/* ARCHETYPE A: DEDICATED PISTOL SCHEMATIC                                   */}
            {/* ========================================================================= */}
            {isPistol ? (
              <g id="pistol-assembly">
                {/* 1. BARREL & MUZZLE TIP */}
                <g onClick={() => onSelectSlot('barrel')} {...slotHighlight('barrel')}>
                  {/* Protruding barrel tip extending through slide bushing */}
                  <rect
                    x={pistolSlideX + pistolSlideLen - 4}
                    y={pistolSlideY + 12}
                    width={pistolBarrelTipLen + 6}
                    height={barrelThickness + 4}
                    rx="1"
                    fill="rgba(15, 23, 42, 0.95)"
                  />
                  {barrel.rifled && (
                    <line
                      x1={pistolSlideX + pistolSlideLen - 2}
                      y1={pistolSlideY + 12 + (barrelThickness + 4) / 2}
                      x2={pistolSlideX + pistolSlideLen + pistolBarrelTipLen + 4}
                      y2={pistolSlideY + 12 + (barrelThickness + 4) / 2}
                      stroke="#38bdf8"
                      strokeDasharray="4 2"
                      strokeWidth="1.2"
                    />
                  )}
                  {barrel.thread !== 'none' && (
                    <g stroke="#38bdf8" strokeWidth="1">
                      <line x1={pistolSlideX + pistolSlideLen + pistolBarrelTipLen - 2} y1={pistolSlideY + 10} x2={pistolSlideX + pistolSlideLen + pistolBarrelTipLen - 2} y2={pistolSlideY + 28} />
                      <line x1={pistolSlideX + pistolSlideLen + pistolBarrelTipLen + 2} y1={pistolSlideY + 10} x2={pistolSlideX + pistolSlideLen + pistolBarrelTipLen + 2} y2={pistolSlideY + 28} />
                    </g>
                  )}
                </g>

                {/* 2. SLIDE / UPPER (RECEIVER) */}
                <g onClick={() => onSelectSlot('receiver')} {...slotHighlight('receiver')}>
                  {/* Slide Main Body */}
                  <path
                    d={`M ${pistolSlideX} ${pistolSlideY + 2}
                        L ${pistolSlideX + pistolSlideLen - 12} ${pistolSlideY + 2}
                        L ${pistolSlideX + pistolSlideLen} ${pistolSlideY + 10}
                        L ${pistolSlideX + pistolSlideLen} ${pistolSlideY + pistolSlideH}
                        L ${pistolSlideX} ${pistolSlideY + pistolSlideH} Z`}
                    fill="rgba(15, 23, 42, 0.95)"
                  />

                  {/* Rear Cocking Serrations (vertical racking grooves) */}
                  <g stroke="#38bdf8" strokeWidth="1.5" opacity="0.8">
                    <line x1={pistolSlideX + 12} y1={pistolSlideY + 6} x2={pistolSlideX + 12} y2={pistolSlideY + pistolSlideH - 6} />
                    <line x1={pistolSlideX + 17} y1={pistolSlideY + 6} x2={pistolSlideX + 17} y2={pistolSlideY + pistolSlideH - 6} />
                    <line x1={pistolSlideX + 22} y1={pistolSlideY + 6} x2={pistolSlideX + 22} y2={pistolSlideY + pistolSlideH - 6} />
                    <line x1={pistolSlideX + 27} y1={pistolSlideY + 6} x2={pistolSlideX + 27} y2={pistolSlideY + pistolSlideH - 6} />
                    <line x1={pistolSlideX + 32} y1={pistolSlideY + 6} x2={pistolSlideX + 32} y2={pistolSlideY + pistolSlideH - 6} />
                  </g>

                  {/* Open Ejection Port */}
                  <rect
                    x={pistolSlideX + pistolSlideLen * 0.44}
                    y={pistolSlideY + 6}
                    width={Math.max(26, cartridge.overallLength * 0.75)}
                    height="14"
                    rx="2"
                    fill="#020617"
                    stroke="#38bdf8"
                    strokeWidth="1.4"
                  />

                  {/* Extractor pin */}
                  <circle cx={pistolSlideX + pistolSlideLen * 0.44 + 4} cy={pistolSlideY + 13} r="1.5" fill="#38bdf8" />

                  {/* Slide Front Bushing Cut */}
                  <line x1={pistolSlideX + pistolSlideLen - 12} y1={pistolSlideY + 2} x2={pistolSlideX + pistolSlideLen - 12} y2={pistolSlideY + pistolSlideH} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                </g>

                {/* 3. OPEN IRON SIGHTS (FRONT & REAR) */}
                <g stroke="#38bdf8" fill="rgba(15, 23, 42, 0.95)" strokeWidth="1.5">
                  {/* Front blade sight */}
                  <path d={`M ${pistolSlideX + pistolSlideLen - 14} ${pistolSlideY + 2} L ${pistolSlideX + pistolSlideLen - 8} ${pistolSlideY - 6} L ${pistolSlideX + pistolSlideLen - 4} ${pistolSlideY - 6} L ${pistolSlideX + pistolSlideLen - 4} ${pistolSlideY + 2} Z`} />
                  {/* Rear notch sight */}
                  <path d={`M ${pistolSlideX + 4} ${pistolSlideY + 2} L ${pistolSlideX + 6} ${pistolSlideY - 7} L ${pistolSlideX + 16} ${pistolSlideY - 7} L ${pistolSlideX + 16} ${pistolSlideY + 2} Z`} />
                </g>

                {/* 4. FRAME & LOWER DUST COVER (ACTION & RECEIVER) */}
                <g onClick={() => onSelectSlot('action')} {...slotHighlight('action')}>
                  {/* Dust cover under the slide */}
                  <path
                    d={`M ${pistolGripX + 38} ${pistolSlideY + pistolSlideH}
                        L ${pistolSlideX + pistolSlideLen - 10} ${pistolSlideY + pistolSlideH}
                        L ${pistolSlideX + pistolSlideLen - 10} ${pistolSlideY + pistolSlideH + 10}
                        L ${pistolGripX + 38} ${pistolSlideY + pistolSlideH + 10} Z`}
                    fill="rgba(15, 23, 42, 0.95)"
                  />
                  {/* Recoil spring plug collar */}
                  <circle cx={pistolSlideX + pistolSlideLen - 10} cy={pistolSlideY + pistolSlideH + 5} r="3" fill="#38bdf8" />

                  {/* Slide stop release lever */}
                  <rect x={pistolGripX + 44} y={pistolSlideY + pistolSlideH + 2} width="16" height="5" rx="1" fill="#020617" stroke="#38bdf8" strokeWidth="1.2" />
                  {/* Takedown pin */}
                  <circle cx={pistolGripX + 70} cy={pistolSlideY + pistolSlideH + 5} r="2.5" fill="#38bdf8" />
                </g>

                {/* 5. BEAVERTAIL & EXTERNAL HAMMER (STOCK SLOT = NONE) */}
                <g onClick={() => onSelectSlot('stock')} {...slotHighlight('stock')}>
                  {/* Beavertail Tang */}
                  <path
                    d={`M ${pistolSlideX} ${pistolSlideY + pistolSlideH}
                        Q ${pistolSlideX - 16} ${pistolSlideY + pistolSlideH + 6} ${pistolSlideX - 8} ${pistolSlideY + pistolSlideH + 22}
                        L ${pistolGripX} ${pistolGripY + 16}
                        L ${pistolGripX + 16} ${pistolGripY}
                        L ${pistolSlideX} ${pistolSlideY + pistolSlideH} Z`}
                    fill="rgba(15, 23, 42, 0.95)"
                  />
                  {/* External Cocked Hammer */}
                  <path
                    d={`M ${pistolSlideX - 2} ${pistolSlideY + pistolSlideH - 6}
                        Q ${pistolSlideX - 12} ${pistolSlideY + pistolSlideH - 12} ${pistolSlideX - 8} ${pistolSlideY + pistolSlideH - 18}
                        L ${pistolSlideX} ${pistolSlideY + pistolSlideH - 10} Z`}
                    fill="#38bdf8"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                </g>

                {/* 6. TRIGGER GUARD & TRIGGER (УСМ) */}
                <g onClick={() => onSelectSlot('trigger')} {...slotHighlight('trigger')}>
                  {/* Trigger Guard Oval Loop */}
                  <path
                    d={`M ${pistolGripX + 22} ${pistolGripY + 4}
                        Q ${pistolGripX + 24} ${pistolGripY + 36} ${pistolGripX + 46} ${pistolGripY + 36}
                        L ${pistolGripX + 54} ${pistolGripY + 36}
                        Q ${pistolGripX + 62} ${pistolGripY + 36} ${pistolGripX + 62} ${pistolGripY + 10}
                        L ${pistolGripX + 58} ${pistolGripY + 10}
                        Q ${pistolGripX + 58} ${pistolGripY + 32} ${pistolGripX + 46} ${pistolGripY + 32}
                        Q ${pistolGripX + 26} ${pistolGripY + 32} ${pistolGripX + 26} ${pistolGripY + 4} Z`}
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                  />
                  {/* Curved Trigger */}
                  <path
                    d={`M ${pistolGripX + 44} ${pistolGripY + 10}
                        Q ${pistolGripX + 40} ${pistolGripY + 22} ${pistolGripX + 46} ${pistolGripY + 26}`}
                    stroke="#38bdf8"
                    strokeWidth="3.2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>

                {/* 7. PISTOL GRIP & MAGAZINE (РУКОЯТЬ И МАГАЗИН) */}
                <g onClick={() => onSelectSlot('magazine')} {...slotHighlight('magazine')}>
                  {/* Grip Frame (angled at ~105 deg) */}
                  <path
                    d={`M ${pistolGripX + 4} ${pistolGripY + 8}
                        L ${pistolGripX + 34} ${pistolGripY + 6}
                        L ${pistolGripX + 22} ${pistolGripY + 84}
                        L ${pistolGripX - 8} ${pistolGripY + 80} Z`}
                    fill="rgba(15, 23, 42, 0.95)"
                  />
                  {/* Checkered Grip Panel Insert */}
                  <polygon
                    points={`${pistolGripX + 7},${pistolGripY + 16} ${pistolGripX + 29},${pistolGripY + 14} ${pistolGripX + 19},${pistolGripY + 74} ${pistolGripX - 3},${pistolGripY + 70}`}
                    fill="url(#gripCheckering)"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />
                  {/* Grip Screws */}
                  <circle cx={pistolGripX + 18} cy={pistolGripY + 24} r="2.5" fill="#020617" stroke="#38bdf8" strokeWidth="1" />
                  <circle cx={pistolGripX + 8} cy={pistolGripY + 64} r="2.5" fill="#020617" stroke="#38bdf8" strokeWidth="1" />

                  {/* Magazine Floorplate Base protruding at bottom */}
                  <rect
                    x={pistolGripX - 11}
                    y={pistolGripY + 80}
                    width="35"
                    height="7"
                    rx="1.5"
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  {/* Mag retention pin */}
                  <circle cx={pistolGripX + 6} cy={pistolGripY + 83.5} r="1.5" fill="#38bdf8" />
                </g>

                {/* 8. PISTOL OPTIC / TOP INTERFACE (IF EQUIPPED) */}
                {topAttachment && (
                  <g onClick={() => onSelectSlot('topAttachment')} {...slotHighlight('topAttachment')}>
                    {/* Micro Red Dot Sight / Reflex */}
                    <rect x={pistolSlideX + 48} y={pistolSlideY - 14} width="36" height="15" rx="3" fill="rgba(15, 23, 42, 0.95)" stroke="#38bdf8" strokeWidth="1.8" />
                    <line x1={pistolSlideX + 66} y1={pistolSlideY - 14} x2={pistolSlideX + 66} y2={pistolSlideY - 2} stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" />
                    <circle cx={pistolSlideX + 66} cy={pistolSlideY - 7} r="2" fill="#ef4444" />
                  </g>
                )}

                {/* 9. PISTOL MUZZLE ATTACHMENT */}
                {muzzleDevice.type !== 'none' && (
                  <g onClick={() => onSelectSlot('muzzleDevice')} {...slotHighlight('muzzleDevice')}>
                    <rect
                      x={pistolSlideX + pistolSlideLen + pistolBarrelTipLen}
                      y={pistolSlideY + 7}
                      width={muzzleWidth}
                      height={muzzleDevice.type === 'suppressor' ? 24 : 14}
                      rx="2"
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="#38bdf8"
                      strokeWidth="1.8"
                    />
                    {muzzleDevice.type === 'suppressor' && (
                      <g stroke="#38bdf8" strokeWidth="1" opacity="0.6">
                        <line x1={pistolSlideX + pistolSlideLen + pistolBarrelTipLen + 15} y1={pistolSlideY + 7} x2={pistolSlideX + pistolSlideLen + pistolBarrelTipLen + 15} y2={pistolSlideY + 31} />
                        <line x1={pistolSlideX + pistolSlideLen + pistolBarrelTipLen + 32} y1={pistolSlideY + 7} x2={pistolSlideX + pistolSlideLen + pistolBarrelTipLen + 32} y2={pistolSlideY + 31} />
                        <line x1={pistolSlideX + pistolSlideLen + pistolBarrelTipLen + 50} y1={pistolSlideY + 7} x2={pistolSlideX + pistolSlideLen + pistolBarrelTipLen + 50} y2={pistolSlideY + 31} />
                      </g>
                    )}
                  </g>
                )}
              </g>
            ) : (
              // =========================================================================
              // ARCHETYPE B: LONG-GUN (ASSAULT RIFLE / SMG / SNIPER / BULLPUP)          
              // =========================================================================
              <g id="long-gun-assembly">

                {/* 1. STOCK (ПРИКЛАД) */}
                <g onClick={() => onSelectSlot('stock')} {...slotHighlight('stock')}>
                  {isBullpup ? (
                    // Bullpup rubber buttpad on rear of receiver
                    <g>
                      <path
                        d={`M ${receiverX - 26} ${receiverY + 4} 
                            L ${receiverX} ${receiverY + 4} 
                            L ${receiverX} ${receiverY + receiverHeight + 14} 
                            L ${receiverX - 22} ${receiverY + receiverHeight + 14} 
                            Q ${receiverX - 32} ${receiverY + receiverHeight / 2} ${receiverX - 26} ${receiverY + 4} Z`}
                        fill="rgba(15, 23, 42, 0.95)"
                        stroke="#38bdf8"
                        strokeWidth="2"
                      />
                      <line x1={receiverX - 28} y1={receiverY + 15} x2={receiverX - 28} y2={receiverY + receiverHeight + 5} stroke="#38bdf8" strokeDasharray="3 3" strokeWidth="2" />
                    </g>
                  ) : stock.type === 'fixedWood' ? (
                    // Classic Wooden Stock with contour & sling swivel
                    <g>
                      <path
                        d={`M ${stockX} ${stockY + 12} 
                            Q ${stockX + 45} ${stockY + 8} ${receiverX} ${receiverY + 12}
                            L ${receiverX} ${receiverY + receiverHeight - 6}
                            L ${stockX + 55} ${stockY + 68}
                            L ${stockX} ${stockY + 86}
                            Q ${stockX - 12} ${stockY + 48} ${stockX} ${stockY + 12} Z`}
                        fill="url(#woodHatch)"
                        stroke="#ca8a04"
                        strokeWidth="2"
                      />
                      <line x1={stockX} y1={stockY + 12} x2={stockX} y2={stockY + 86} stroke="#94a3b8" strokeWidth="4" />
                      <circle cx={stockX + 5} cy={stockY + 28} r="2" fill="#e2e8f0" />
                      <circle cx={stockX + 5} cy={stockY + 70} r="2" fill="#e2e8f0" />
                    </g>
                  ) : stock.type === 'folding' ? (
                    // Skeleton Wire Folding Stock
                    <g>
                      <circle cx={receiverX - 6} cy={receiverY + 16} r="7" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2" />
                      <circle cx={receiverX - 6} cy={receiverY + 16} r="2.5" fill="#38bdf8" />
                      <line x1={stockX + 10} y1={stockY + 14} x2={receiverX - 6} y2={receiverY + 16} stroke="#38bdf8" strokeWidth="3.5" />
                      <line x1={stockX + 16} y1={stockY + 74} x2={receiverX - 6} y2={receiverY + receiverHeight - 12} stroke="#38bdf8" strokeWidth="3.5" />
                      <path d={`M ${stockX} ${stockY + 10} L ${stockX + 14} ${stockY + 10} L ${stockX + 14} ${stockY + 78} L ${stockX} ${stockY + 78} Z`} fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2" />
                    </g>
                  ) : stock.type === 'telescopic' ? (
                    // Tactical Telescopic Stock with buffer tube & crane
                    <g>
                      <rect x={receiverX - 65} y={receiverY + 14} width="65" height="18" rx="2" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1={receiverX - 55} y1={receiverY + 23} x2={receiverX - 15} y2={receiverY + 23} stroke="#38bdf8" strokeDasharray="4 4" strokeWidth="3" />
                      <rect x={stockX} y={stockY + 6} width={stockLenPix - 48} height="32" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2" />
                      <path d={`M ${stockX} ${stockY + 2} L ${stockX + 18} ${stockY + 2} L ${stockX + 18} ${stockY + 82} L ${stockX} ${stockY + 82} Z`} fill="rgba(15, 23, 42, 0.95)" stroke="#38bdf8" strokeWidth="2" />
                    </g>
                  ) : stock.type === 'none' ? (
                    // Stockless frame endcap
                    <path
                      d={`M ${receiverX} ${receiverY + 6}
                          Q ${receiverX - 10} ${receiverY + 14} ${receiverX - 6} ${receiverY + 30}
                          L ${receiverX} ${receiverY + receiverHeight - 4} Z`}
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                  ) : (
                    // Polymer Ergonomic Fixed Stock
                    <g>
                      <path
                        d={`M ${stockX} ${stockY + 10}
                            L ${receiverX} ${receiverY + 12}
                            L ${receiverX} ${receiverY + receiverHeight - 6}
                            L ${stockX + 65} ${stockY + 54}
                            L ${stockX} ${stockY + 82} Z`}
                        fill="url(#diagHatch)"
                        stroke="#38bdf8"
                        strokeWidth="2"
                      />
                      <polygon points={`${stockX + 25},${stockY + 28} ${stockX + 65},${stockY + 22} ${stockX + 45},${stockY + 54}`} fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
                    </g>
                  )}
                </g>

                {/* 2. RECEIVER (СТВОЛЬНАЯ КОРОБКА) */}
                <g onClick={() => onSelectSlot('receiver')} {...slotHighlight('receiver')}>
                  <rect
                    x={receiverX}
                    y={receiverY}
                    width={receiverWidth}
                    height={receiverHeight}
                    rx={receiver.material === 'polymer' ? '6' : '3'}
                    fill="rgba(15, 23, 42, 0.95)"
                  />

                  {/* Method Details: Stamped vs Milled vs Polymer */}
                  {receiver.method === 'stamped' ? (
                    <g stroke="#38bdf8">
                      <line x1={receiverX + 15} y1={receiverY + 6} x2={receiverX + receiverWidth - 25} y2={receiverY + 6} strokeWidth="1.5" />
                      <line x1={receiverX + 25} y1={receiverY + 10} x2={receiverX + receiverWidth - 35} y2={receiverY + 10} strokeWidth="1.2" opacity="0.7" />
                      <circle cx={receiverX + 12} cy={receiverY + 20} r="2" fill="#38bdf8" />
                      <circle cx={receiverX + 12} cy={receiverY + 38} r="2" fill="#38bdf8" />
                      <circle cx={receiverX + receiverWidth - 18} cy={receiverY + 18} r="2" fill="#38bdf8" />
                      <circle cx={receiverX + receiverWidth - 18} cy={receiverY + 36} r="2" fill="#38bdf8" />
                      {/* Fire selector lever */}
                      <line x1={receiverX + 35} y1={receiverY + 30} x2={receiverX + 68} y2={receiverY + 22} strokeWidth="2.5" />
                      <circle cx={receiverX + 35} cy={receiverY + 30} r="3" fill="#38bdf8" />
                    </g>
                  ) : receiver.method === 'milled' ? (
                    <g stroke="#38bdf8">
                      <rect x={receiverX + 22} y={receiverY + 16} width={receiverWidth - 90} height="20" rx="3" fill="none" strokeWidth="1.8" />
                      <line x1={receiverX + 26} y1={receiverY + 26} x2={receiverX + receiverWidth - 72} y2={receiverY + 26} strokeDasharray="6 3" strokeWidth="1" opacity="0.6" />
                      <rect x={receiverX + 10} y={receiverY + 4} width={receiverWidth - 20} height="5" fill="none" strokeWidth="1.2" />
                    </g>
                  ) : (
                    <g stroke="#38bdf8">
                      <polygon points={`${receiverX + 20},${receiverY + 12} ${receiverX + receiverWidth - 40},${receiverY + 12} ${receiverX + receiverWidth - 50},${receiverY + 36} ${receiverX + 30},${receiverY + 36}`} fill="url(#diagHatch)" strokeWidth="1.2" />
                      <circle cx={receiverX + 16} cy={receiverY + receiverHeight - 12} r="3" fill="none" strokeWidth="2" />
                      <circle cx={receiverX + receiverWidth - 22} cy={receiverY + receiverHeight - 12} r="3" fill="none" strokeWidth="2" />
                    </g>
                  )}

                  {/* Ejection port */}
                  <rect
                    x={receiverX + receiverWidth - (cartridge.class === 'rifle' ? 75 : 62)}
                    y={receiverY + 12}
                    width={cartridge.class === 'rifle' ? 52 : cartridge.class === 'intermediate' ? 42 : 28}
                    height="16"
                    rx="2"
                    fill="#020617"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                </g>

                {/* 3. ACTION & GAS SYSTEM (АВТОМАТИКА) */}
                <g onClick={() => onSelectSlot('action')} {...slotHighlight('action')}>
                  {action.requiresGasTube ? (
                    <g>
                      <rect x={barrelX} y={barrelY - 14} width={Math.min(barrelPixLen - 35, 170)} height="10" rx="2" fill="rgba(15, 23, 42, 0.95)" stroke="#38bdf8" strokeWidth="1.8" />
                      {/* Gas Block Tower */}
                      <path d={`M ${barrelX + Math.min(barrelPixLen - 45, 155)} ${barrelY - 18} L ${barrelX + Math.min(barrelPixLen - 45, 155) + 16} ${barrelY - 18} L ${barrelX + Math.min(barrelPixLen - 45, 155) + 16} ${barrelY + barrelThickness} L ${barrelX + Math.min(barrelPixLen - 45, 155)} ${barrelY + barrelThickness} Z`} fill="rgba(15, 23, 42, 0.95)" stroke="#38bdf8" strokeWidth="2" />
                    </g>
                  ) : action.type === 'blowback' ? (
                    // Blowback heavy bolt cocking handle
                    <g>
                      <line x1={receiverX + receiverWidth - 45} y1={receiverY + 14} x2={receiverX + receiverWidth - 45} y2={receiverY - 10} stroke="#38bdf8" strokeWidth="3.5" />
                      <circle cx={receiverX + receiverWidth - 45} cy={receiverY - 10} r="4.5" fill="#38bdf8" />
                    </g>
                  ) : action.type === 'manual' ? (
                    // Bolt Action handle with ball knob
                    <g>
                      <line x1={receiverX + 45} y1={receiverY + 12} x2={receiverX + 45} y2={receiverY - 14} stroke="#38bdf8" strokeWidth="3.5" />
                      <circle cx={receiverX + 45} cy={receiverY - 14} r="5" fill="#38bdf8" />
                    </g>
                  ) : null}
                </g>

                {/* 4. BARREL (СТВОЛ) */}
                <g onClick={() => onSelectSlot('barrel')} {...slotHighlight('barrel')}>
                  <rect x={barrelX} y={barrelY} width={barrelPixLen} height={barrelThickness} rx="1" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.8" />

                  {/* Profile fluting */}
                  {barrel.profile === 'heavy' ? (
                    <g stroke="#38bdf8" opacity="0.65">
                      <line x1={barrelX + 15} y1={barrelY + 3} x2={barrelX + barrelPixLen - 15} y2={barrelY + 3} strokeWidth="1.5" />
                      <line x1={barrelX + 15} y1={barrelY + barrelThickness - 3} x2={barrelX + barrelPixLen - 15} y2={barrelY + barrelThickness - 3} strokeWidth="1.5" />
                    </g>
                  ) : null}

                  {/* Rifling spiral dashes */}
                  {barrel.rifled && (
                    <line x1={barrelX + 12} y1={barrelY + barrelThickness / 2} x2={barrelX + barrelPixLen - 12} y2={barrelY + barrelThickness / 2} stroke="#38bdf8" strokeDasharray="8 6" strokeWidth="1.5" opacity="0.75" />
                  )}

                  {/* Threaded muzzle lines */}
                  {barrel.thread !== 'none' && (
                    <g stroke="#38bdf8" strokeWidth="1">
                      <line x1={barrelX + barrelPixLen - 8} y1={barrelY - 2} x2={barrelX + barrelPixLen - 8} y2={barrelY + barrelThickness + 2} />
                      <line x1={barrelX + barrelPixLen - 4} y1={barrelY - 2} x2={barrelX + barrelPixLen - 4} y2={barrelY + barrelThickness + 2} />
                    </g>
                  )}
                </g>

                {/* 5. HANDGUARD (ЦЕВЬЁ) */}
                <g onClick={() => onSelectSlot('handguard')} {...slotHighlight('handguard')}>
                  {handguard.material !== 'none' && handguard.length > 0 && (
                    <g>
                      <rect
                        x={handguardX}
                        y={handguardY}
                        width={handguardLenPix}
                        height={handguardHeight}
                        rx={handguard.material === 'wood' ? '4' : '2'}
                        fill={handguard.material === 'wood' ? 'url(#woodHatch)' : handguard.material === 'aluminum' ? 'rgba(15, 23, 42, 0.95)' : 'url(#diagHatch)'}
                        stroke={handguard.material === 'wood' ? '#ca8a04' : '#38bdf8'}
                        strokeWidth="2"
                      />

                      {/* Perforated heat shroud for SMG / Aluminum */}
                      {handguard.material === 'aluminum' ? (
                        <g fill="#020617" stroke="#38bdf8" strokeWidth="1">
                          <circle cx={handguardX + 18} cy={handguardY + 10} r="3.5" />
                          <circle cx={handguardX + 36} cy={handguardY + 10} r="3.5" />
                          <circle cx={handguardX + 54} cy={handguardY + 10} r="3.5" />
                          <circle cx={handguardX + 72} cy={handguardY + 10} r="3.5" />
                          <circle cx={handguardX + 27} cy={handguardY + 22} r="3.5" />
                          <circle cx={handguardX + 45} cy={handguardY + 22} r="3.5" />
                          <circle cx={handguardX + 63} cy={handguardY + 22} r="3.5" />
                        </g>
                      ) : handguard.material === 'wood' ? (
                        <g stroke="#ca8a04" strokeWidth="1.2">
                          <rect x={handguardX + 20} y={handguardY + 7} width="16" height="4" rx="1" fill="#020617" />
                          <rect x={handguardX + 46} y={handguardY + 7} width="16" height="4" rx="1" fill="#020617" />
                        </g>
                      ) : (
                        <g stroke="#38bdf8">
                          <rect x={handguardX + 16} y={handguardY + 12} width="22" height="6" rx="2" fill="#020617" strokeWidth="1" />
                          <rect x={handguardX + 46} y={handguardY + 12} width="22" height="6" rx="2" fill="#020617" strokeWidth="1" />
                        </g>
                      )}
                    </g>
                  )}
                </g>

                {/* 6. MAGAZINE (МАГАЗИН) */}
                <g onClick={() => onSelectSlot('magazine')} {...slotHighlight('magazine')}>
                  {magazine.type === 'drum' ? (
                    // Drum Magazine
                    <g>
                      <circle cx={rifleMagX + 26} cy={rifleMagY + 42} r="40" fill="rgba(15, 23, 42, 0.95)" stroke="#38bdf8" strokeWidth="2.5" />
                      <circle cx={rifleMagX + 26} cy={rifleMagY + 42} r="16" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                      <circle cx={rifleMagX + 26} cy={rifleMagY + 42} r="4" fill="#38bdf8" />
                    </g>
                  ) : cartridge.class === 'intermediate' ? (
                    // Curved Banana Magazine (AK style)
                    <g>
                      <path
                        d={`M ${rifleMagX} ${rifleMagY}
                            L ${rifleMagX + rifleMagWidth} ${rifleMagY}
                            Q ${rifleMagX + rifleMagWidth + 18} ${rifleMagY + rifleMagHeight * 0.65} ${rifleMagX + rifleMagWidth + 6} ${rifleMagY + rifleMagHeight}
                            L ${rifleMagX - 12} ${rifleMagY + rifleMagHeight}
                            Q ${rifleMagX - 6} ${rifleMagY + rifleMagHeight * 0.65} ${rifleMagX} ${rifleMagY} Z`}
                        fill={magazine.material === 'polymer' ? 'url(#diagHatch)' : 'rgba(15, 23, 42, 0.95)'}
                        stroke="#38bdf8"
                        strokeWidth="2"
                      />
                      <line x1={rifleMagX + 4} y1={rifleMagY + rifleMagHeight * 0.3} x2={rifleMagX + rifleMagWidth + 6} y2={rifleMagY + rifleMagHeight * 0.3} stroke="#38bdf8" strokeWidth="1.4" />
                      <line x1={rifleMagX + 1} y1={rifleMagY + rifleMagHeight * 0.55} x2={rifleMagX + rifleMagWidth + 10} y2={rifleMagY + rifleMagHeight * 0.55} stroke="#38bdf8" strokeWidth="1.4" />
                      <line x1={rifleMagX - 3} y1={rifleMagY + rifleMagHeight * 0.8} x2={rifleMagX + rifleMagWidth + 8} y2={rifleMagY + rifleMagHeight * 0.8} stroke="#38bdf8" strokeWidth="1.4" />
                    </g>
                  ) : (
                    // Straight Box Magazine
                    <g>
                      <rect x={rifleMagX} y={rifleMagY} width={rifleMagWidth} height={rifleMagHeight} rx="2" fill="rgba(15, 23, 42, 0.95)" stroke="#38bdf8" strokeWidth="2" />
                      <line x1={rifleMagX + rifleMagWidth / 2} y1={rifleMagY + 6} x2={rifleMagX + rifleMagWidth / 2} y2={rifleMagY + rifleMagHeight - 6} stroke="#38bdf8" strokeWidth="1.5" />
                    </g>
                  )}
                </g>

                {/* 7. PISTOL GRIP & TRIGGER (УСМ) */}
                <g onClick={() => onSelectSlot('trigger')} {...slotHighlight('trigger')}>
                  {isBullpup && (
                    <line x1={rifleGripX + 15} y1={receiverY + receiverHeight - 3} x2={receiverX + 25} y2={receiverY + receiverHeight - 3} stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                  )}
                  {/* Grip Handle */}
                  <path
                    d={`M ${rifleGripX} ${rifleGripY - 4}
                        L ${rifleGripX + 32} ${rifleGripY - 4}
                        L ${rifleGripX + 22} ${rifleGripY + 65}
                        L ${rifleGripX - 6} ${rifleGripY + 62} Z`}
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  {/* Grip Texture */}
                  <line x1={rifleGripX + 5} y1={rifleGripY + 18} x2={rifleGripX + 22} y2={rifleGripY + 18} stroke="#38bdf8" strokeDasharray="2 2" strokeWidth="2" />
                  <line x1={rifleGripX + 3} y1={rifleGripY + 34} x2={rifleGripX + 18} y2={rifleGripY + 34} stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />

                  {/* Trigger Guard Loop & Trigger */}
                  <path
                    d={`M ${rifleGripX + 30} ${rifleGripY - 4}
                        Q ${rifleGripX + 32} ${rifleGripY + 28} ${rifleGripX + 52} ${rifleGripY + 28}
                        L ${rifleGripX + 60} ${rifleGripY + 28}
                        L ${rifleGripX + 60} ${rifleGripY - 4}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  <path d={`M ${rifleGripX + 46} ${rifleGripY} Q ${rifleGripX + 42} ${rifleGripY + 16} ${rifleGripX + 47} ${rifleGripY + 22}`} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                </g>

                {/* 8. TOP INTERFACE & OPTIC ATTACHMENT */}
                <g onClick={() => onSelectSlot('topInterface')} {...slotHighlight('topInterface')}>
                  {topInterface.type !== 'none' && (
                    <g>
                      <rect x={railX} y={railY} width={railWidth} height="8" rx="1.5" fill="rgba(15, 23, 42, 0.95)" stroke="#38bdf8" strokeWidth="1.5" />
                      {topInterface.type === 'picatinny' && (
                        <line x1={railX + 4} y1={railY + 4} x2={railX + railWidth - 4} y2={railY + 4} stroke="#38bdf8" strokeDasharray="4 3" strokeWidth="3" />
                      )}
                    </g>
                  )}
                </g>

                {topAttachment && (
                  <g onClick={() => onSelectSlot('topAttachment')} {...slotHighlight('topAttachment')}>
                    {/* Telescopic / Sniper Optical Scope */}
                    <path
                      d={`M ${receiverX + 25} ${railY - 26}
                          L ${receiverX + 85} ${railY - 26}
                          L ${receiverX + 100} ${railY - 32}
                          L ${receiverX + 165} ${railY - 32}
                          L ${receiverX + 165} ${railY - 8}
                          L ${receiverX + 100} ${railY - 8}
                          L ${receiverX + 85} ${railY - 14}
                          L ${receiverX + 25} ${railY - 14} Z`}
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    {/* Scope Mount Rings */}
                    <rect x={receiverX + 45} y={railY - 14} width="14" height="14" fill="#38bdf8" />
                    <rect x={receiverX + 125} y={railY - 14} width="14" height="14" fill="#38bdf8" />
                    {/* Elevation Adjustment Turret */}
                    <rect x={receiverX + 90} y={railY - 38} width="12" height="7" rx="1" fill="#38bdf8" />
                  </g>
                )}

                {/* 9. LOWER ATTACHMENT (FOREGRIP / BIPOD) */}
                {lowerAttachment && handguard.material !== 'none' && (
                  <g onClick={() => onSelectSlot('lowerAttachment')} {...slotHighlight('lowerAttachment')}>
                    {lowerAttachment.type === 'bipod' ? (
                      // Folded tactical bipod legs
                      <g stroke="#38bdf8" strokeWidth="2.5" fill="none">
                        <line x1={handguardX + 35} y1={handguardY + handguardHeight} x2={handguardX + 95} y2={handguardY + handguardHeight + 6} />
                        <line x1={handguardX + 35} y1={handguardY + handguardHeight} x2={handguardX + 95} y2={handguardY + handguardHeight + 11} />
                        <circle cx={handguardX + 35} cy={handguardY + handguardHeight + 2} r="3" fill="#38bdf8" />
                      </g>
                    ) : (
                      // Vertical Foregrip
                      <g>
                        <path
                          d={`M ${handguardX + 40} ${handguardY + handguardHeight}
                              L ${handguardX + 62} ${handguardY + handguardHeight}
                              L ${handguardX + 57} ${handguardY + handguardHeight + 45}
                              L ${handguardX + 45} ${handguardY + handguardHeight + 45} Z`}
                          fill="rgba(15, 23, 42, 0.95)"
                          stroke="#38bdf8"
                          strokeWidth="2"
                        />
                        <line x1={handguardX + 47} y1={handguardY + handguardHeight + 16} x2={handguardX + 58} y2={handguardY + handguardHeight + 16} stroke="#38bdf8" strokeWidth="1.5" />
                        <line x1={handguardX + 48} y1={handguardY + handguardHeight + 28} x2={handguardX + 56} y2={handguardY + handguardHeight + 28} stroke="#38bdf8" strokeWidth="1.5" />
                      </g>
                    )}
                  </g>
                )}

                {/* 10. MUZZLE DEVICE */}
                {muzzleDevice.type !== 'none' && (
                  <g onClick={() => onSelectSlot('muzzleDevice')} {...slotHighlight('muzzleDevice')}>
                    <rect
                      x={muzzleX}
                      y={muzzleY}
                      width={muzzleWidth}
                      height={muzzleHeight}
                      rx="2"
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    {muzzleDevice.type === 'suppressor' && (
                      <g stroke="#38bdf8" strokeWidth="1" opacity="0.65">
                        <line x1={muzzleX + 16} y1={muzzleY} x2={muzzleX + 16} y2={muzzleY + muzzleHeight} />
                        <line x1={muzzleX + 34} y1={muzzleY} x2={muzzleX + 34} y2={muzzleY + muzzleHeight} />
                        <line x1={muzzleX + 52} y1={muzzleY} x2={muzzleX + 52} y2={muzzleY + muzzleHeight} />
                      </g>
                    )}
                    {muzzleDevice.type === 'compensator' && (
                      <g fill="#020617" stroke="#38bdf8" strokeWidth="1">
                        <circle cx={muzzleX + 8} cy={muzzleY + muzzleHeight / 2} r="2.5" />
                        <circle cx={muzzleX + 16} cy={muzzleY + muzzleHeight / 2} r="2.5" />
                      </g>
                    )}
                  </g>
                )}
              </g>
            )}

            {/* ========================================================================= */}
            {/* TECHNICAL BLUEPRINT DIMENSION LINES (NO CLUTTERING TEXT ON PARTS)        */}
            {/* ========================================================================= */}
            {/* 1. Barrel Length Dimension Arrow (Above) */}
            <g stroke="#38bdf8" strokeWidth="1" opacity="0.8">
              <line
                x1={isPistol ? pistolSlideX + 40 : barrelX}
                y1="82"
                x2={isPistol ? pistolSlideX + pistolSlideLen + pistolBarrelTipLen : barrelX + barrelPixLen}
                y2="82"
                markerStart="url(#arrow)"
                markerEnd="url(#arrow)"
              />
              <line x1={isPistol ? pistolSlideX + 40 : barrelX} y1="74" x2={isPistol ? pistolSlideX + 40 : barrelX} y2={isPistol ? pistolSlideY : barrelY} strokeDasharray="3 3" opacity="0.5" />
              <line x1={isPistol ? pistolSlideX + pistolSlideLen + pistolBarrelTipLen : barrelX + barrelPixLen} y1="74" x2={isPistol ? pistolSlideX + pistolSlideLen + pistolBarrelTipLen : barrelX + barrelPixLen} y2={isPistol ? pistolSlideY : barrelY} strokeDasharray="3 3" opacity="0.5" />
              <text
                x={(isPistol ? pistolSlideX + 40 + pistolSlideX + pistolSlideLen + pistolBarrelTipLen : barrelX + barrelX + barrelPixLen) / 2}
                y="76"
                fill="#38bdf8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="bold"
              >
                ДЛИНА СТВОЛА: {barrel.length} мм
              </text>
            </g>

            {/* 2. Overall Length Dimension Arrow (Below) */}
            <g stroke="#38bdf8" strokeWidth="1" opacity="0.8">
              <line
                x1={weaponLeftX}
                y1="340"
                x2={weaponRightX}
                y2="340"
                markerStart="url(#arrow)"
                markerEnd="url(#arrow)"
              />
              <line x1={weaponLeftX} y1="285" x2={weaponLeftX} y2="348" strokeDasharray="3 3" opacity="0.5" />
              <line x1={weaponRightX} y1="220" x2={weaponRightX} y2="348" strokeDasharray="3 3" opacity="0.5" />
              <text
                x={(weaponLeftX + weaponRightX) / 2}
                y="354"
                fill="#38bdf8"
                fontSize="11"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="bold"
              >
                ОБЩАЯ ДЛИНА: {derived.overallLength} мм
              </text>
            </g>
          </g>

          {/* ========================================================================= */}
          {/* STATIC TECHNICAL TITLE BLOCK (ГОСТ / ОБОРОННАЯ СПЕЦИФИКАЦИЯ)              */}
          {/* ========================================================================= */}
          <g transform="translate(710, 310)">
            <rect width="275" height="95" fill="rgba(15, 23, 42, 0.95)" stroke="#0284c7" strokeWidth="1.8" />
            <line x1="0" y1="26" x2="275" y2="26" stroke="#0284c7" strokeWidth="1.2" />
            <line x1="0" y1="48" x2="275" y2="48" stroke="#0284c7" strokeWidth="1.2" />
            <line x1="0" y1="70" x2="275" y2="70" stroke="#0284c7" strokeWidth="1.2" />
            <line x1="130" y1="26" x2="130" y2="70" stroke="#0284c7" strokeWidth="1.2" />

            {/* Row 1: Header */}
            <text x="8" y="18" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
              GUNPOWDER v1.7.0 · КБ
            </text>
            <text x="200" y="18" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              МАСШТАБ 1:2
            </text>

            {/* Row 2: Author & Class */}
            <text x="8" y="40" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              РАЗРАБ: Главный инж.
            </text>
            <text x="136" y="40" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
              {isPistol ? 'PISTOL' : isBullpup ? 'BULLPUP' : isSMG ? 'SMG' : isSniper ? 'SNIPER' : 'RIFLE'}
            </text>

            {/* Row 3: Action & Mass */}
            <text x="8" y="62" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              СИСТЕМА: {action.type}
            </text>
            <text x="136" y="62" fill="#a5f3fc" fontSize="9" fontFamily="monospace">
              МАССА: {derived.weaponMass} кг
            </text>

            {/* Row 4: Status */}
            <text
              x="8"
              y="84"
              fill={issues.length === 0 ? '#4ade80' : '#f87171'}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              СТАТУС: {issues.length === 0 ? '✓ ЧЕРТЁЖ УТВЕРЖДЁН' : `✗ ТРЕБУЕТ ПРАВОК (${issues.length})`}
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Slot Hotbar underneath blueprint */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-cyan-950/80 bg-slate-900/60 p-2.5 overflow-x-auto subtle-scroll">
        {(
          [
            ['cartridge', 'Патрон', slots.cartridge.name],
            ['barrel', 'Ствол', `${slots.barrel.length}мм (${slots.barrel.profile})`],
            ['action', 'Автоматика', slots.action.type],
            ['receiver', 'Ресивер', `${slots.receiver.method}`],
            ['magazine', 'Магазин', `${slots.magazine.capacity} патр.`],
            ['trigger', 'УСМ', `${slots.trigger.mode}`],
            ['stock', 'Приклад', slots.stock.type === 'none' ? 'без приклада' : slots.stock.type],
            ['topInterface', 'Планка', slots.topInterface.type],
            ['handguard', 'Цевьё', slots.handguard.material === 'none' ? 'без цевья' : slots.handguard.material],
            ['muzzleDevice', 'Дульное', slots.muzzleDevice.type],
            ['topAttachment', 'Прицел', slots.topAttachment ? slots.topAttachment.name : 'отсутствует'],
            ['lowerAttachment', 'Обвес', slots.lowerAttachment ? slots.lowerAttachment.name : 'отсутствует'],
          ] as const
        ).map(([key, label, value]) => {
          const isSelected = activeSlot === key;
          const issue = issuesBySlot[key];
          return (
            <button
              key={key}
              onClick={() => onSelectSlot(key as keyof WeaponSlots)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors whitespace-nowrap shrink-0 ${
                issue === 'error'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/80 hover:bg-rose-900/80'
                  : issue === 'warning'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/80'
                  : isSelected
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/60 font-semibold shadow-sm shadow-cyan-950'
                  : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-slate-400 font-mono text-[10px] uppercase">{label}:</span>
              <span className="font-medium truncate max-w-[130px]">{value}</span>
              {issue === 'error' && <span className="text-rose-400 font-bold ml-0.5">!</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
