import React from 'react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📖</span>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Об игре «Gunpowder v1.7.0» (Оружейный инженер)
              </h3>
              <p className="text-xs text-slate-400">
                Инженерная и экономическая стратегия проектирования стрелкового оружия
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-5 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Section 1 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">
              1. Главная цель и роль Главного конструктора
            </h4>
            <p>
              Вы возглавляете государственное или коммерческое Конструкторское Бюро (КБ). Ваша задача — получать технические задания (ТЗ) от армии, спецподразделений или гражданского рынка, проектировать оптимальные образцы стрелкового оружия, побеждать на полигонных государственных испытаниях у конкурирующих бюро и запускать победившую модель в серию на оружейных заводах.
            </p>
          </div>

          {/* Section 2 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">
              2. Настоящая физика и баллистические формулы
            </h4>
            <ul className="space-y-2 list-disc list-inside text-slate-300">
              <li>
                <strong className="text-slate-100">Начальная скорость пули (м/с):</strong> зависит от длины ствола, объёма гильзы и давления пороховых газов. Увеличение длины ствола даёт прирост до оптимального предела, после чего сила трения начинает гасить прирост.
              </li>
              <li>
                <strong className="text-slate-100">Формула шага нарезов (Твист по Грингиллу):</strong> оптимум твиста вычисляется через квадрат диаметра пули и её массу. Несоответствие шага нарезов ведёт к недостаточной или избыточной гироскопической стабилизации пули, резко ухудшая кучность (MOA).
              </li>
              <li>
                <strong className="text-slate-100">Дульная энергия и импульс отдачи:</strong> дульная энергия $E = (m \cdot v^2)/2$. Импульс отдачи рассчитывается с учётом массы оружия, типа приклада с амортизатором и дульного тормоза-компенсатора (ДТК).
              </li>
              <li>
                <strong className="text-slate-100">Климатические испытания:</strong> полигонные испытания включают мороз (-50°C), запыление в камере песчаной бури и купание в жидкой болотной грязи.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">
              3. Экономика серийного производства и масштаб
            </h4>
            <p>
              Победа в конкурсе открывает государственный контракт на изготовление партии (от 5 000 до 80 000 единиц). При крупных тиражах штампованная ствольная коробка становится в разы дешевле фрезерованной, снижая себестоимость и увеличивая чистую прибыль КБ, которую вы можете вкладывать в НИОКР и новые калибры.
            </p>
          </div>

          {/* Section 4 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">
              4. Разрешение, сенсорный ввод и платформы
            </h4>
            <p>
              Игра Gunpowder v1.7.0 полностью адаптирована для планшетов (включая Poco Pad M1 12.1" и мобильный Chrome), широкоформатных экранов (1920×1024), а также стабильно работает при публикации на GitHub Pages и в локальной сети. В настройках доступна регулировка фоновой музыки, механических звуков и сервисная консоль.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
