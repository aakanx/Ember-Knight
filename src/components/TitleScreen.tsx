import React from 'react';
import { Play, Trophy, Flame, ArrowRight, Lock, CheckCircle2, RotateCcw, Gem, Coins } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { ChapterCompletionRecord } from '../types/game';

interface TitleScreenProps {
  onStartGame: (levelId: number) => void;
  completedChapters: number[];
  chapterRecords: Record<number, ChapterCompletionRecord>;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  completedChapters,
  chapterRecords,
}) => {
  // Determine unlock status
  const isChapterUnlocked = (id: number) => id === 1 || completedChapters.includes(id - 1);
  const isChapterCompleted = (id: number) => completedChapters.includes(id);

  // Find most recently unfinished chapter
  const currentUnfinishedLevel = !completedChapters.includes(1)
    ? 1
    : !completedChapters.includes(2)
    ? 2
    : !completedChapters.includes(3)
    ? 3
    : null;

  const allCompleted = currentUnfinishedLevel === null;

  // Calculate overall game completion average across 3 chapters
  const totalCompletionPercent = Math.round(
    LEVELS.reduce((acc, lvl) => {
      const rec = chapterRecords[lvl.id];
      return acc + (rec ? rec.percentage : 0);
    }, 0) / LEVELS.length
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 overflow-y-auto">
      {/* Background Graphic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/src/assets/images/game_cover_ember_knight_1790286808038.jpg"
          alt="Ember Knight Game Cover"
          className="w-full h-full object-cover opacity-35 filter blur-[2px] scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center my-auto py-6">
        {/* Editorial Subtitle */}
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400/90 mb-3">
          <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          <span>Arcade Action Platformer</span>
          <span>·</span>
          <span>3 Epic Chapters</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-serif tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] mb-2">
          EMBER <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500">KNIGHT</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mb-6 leading-relaxed">
          Master the ancient flame. Run, jump, and incinerate foes with blazing fireball special moves to liberate the Pyros realm from the Wyrm of Embers.
        </p>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 w-full max-w-xl">
          <button
            onClick={() => onStartGame(allCompleted ? 1 : currentUnfinishedLevel!)}
            className="group w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:via-orange-500 hover:to-rose-500 text-white font-bold text-base rounded-xl shadow-xl shadow-orange-900/40 hover:shadow-orange-700/60 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            {allCompleted ? (
              <RotateCcw className="w-5 h-5 shrink-0" />
            ) : (
              <Play className="w-5 h-5 fill-white shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {allCompleted ? (
                <>REPLAY ADVENTURE · CHAPTER&nbsp;1</>
              ) : currentUnfinishedLevel === 1 ? (
                <>PLAY NOW · CHAPTER&nbsp;1</>
              ) : (
                <>CONTINUE CHAPTER&nbsp;{currentUnfinishedLevel}</>
              )}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Overall Adventure Mastery Pill */}
          {completedChapters.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900/90 px-4 py-3 rounded-xl border border-slate-800 text-slate-300 font-mono text-sm shrink-0">
              <Gem className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">Realm Mastery:</span>
              <strong className="text-amber-400 font-bold tabular-nums">{totalCompletionPercent}%</strong>
            </div>
          )}
        </div>

        {/* Level Select Cards - Sole Chapter Entry Point with Completion Metrics */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 text-left mb-8">
          {LEVELS.map((lvl) => {
            const unlocked = isChapterUnlocked(lvl.id);
            const completed = isChapterCompleted(lvl.id);
            const isCurrentTarget = currentUnfinishedLevel === lvl.id;
            const record = chapterRecords[lvl.id];

            return (
              <div
                key={lvl.id}
                onClick={() => {
                  if (unlocked) {
                    onStartGame(lvl.id);
                  }
                }}
                className={`group relative rounded-xl overflow-hidden border transition-all duration-200 p-3.5 flex flex-col justify-between ${
                  unlocked
                    ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-amber-500/60 shadow-lg cursor-pointer'
                    : 'bg-slate-950/80 border-slate-900 opacity-60 cursor-not-allowed select-none'
                }`}
              >
                <div>
                  {/* Level Thumbnail with status overlay */}
                  <div className="w-full h-28 rounded-lg overflow-hidden relative mb-3 bg-slate-950">
                    <img
                      src={lvl.bannerImage}
                      alt={lvl.title}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        unlocked
                          ? 'opacity-85 group-hover:opacity-100 group-hover:scale-105'
                          : 'opacity-25 grayscale'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                    {/* Chapter badge */}
                    <span className="absolute bottom-2 left-2 text-[11px] font-mono font-bold bg-slate-950/85 px-2 py-0.5 rounded text-amber-400 border border-slate-800">
                      Chapter {lvl.id}
                    </span>

                    {/* Lock / Completed Badge Overlay */}
                    {!unlocked ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[1px] text-slate-400">
                        <Lock className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[10px] font-mono tracking-wider uppercase text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
                          Locked
                        </span>
                      </div>
                    ) : completed ? (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-950/90 border border-emerald-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>CLEARED</span>
                      </div>
                    ) : isCurrentTarget ? (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-950/90 border border-amber-500/60 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-300 animate-pulse">
                        <span>NEXT</span>
                      </div>
                    ) : null}
                  </div>

                  <h3
                    className={`font-serif font-bold text-base transition-colors ${
                      unlocked
                        ? 'text-slate-100 group-hover:text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {lvl.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {lvl.subtitle}
                  </p>

                  {/* Chapter Completion Stats (Gems, Points & Percentage) */}
                  {record ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="text-slate-400">Chapter Completion</span>
                        <span className="font-bold text-amber-400 tabular-nums">
                          {record.percentage}%
                        </span>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/90 mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            record.percentage >= 100
                              ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                          style={{ width: `${record.percentage}%` }}
                        />
                      </div>

                      {/* Gems & Points */}
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <div className="flex items-center gap-1 text-cyan-400" title="Ember Gems Found">
                          <Gem className="w-3 h-3" />
                          <span className="tabular-nums font-semibold">{record.gems}/{record.totalGems} Gems</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-300" title="Points Earned">
                          <Coins className="w-3 h-3" />
                          <span className="tabular-nums">{record.points.toLocaleString()} pts</span>
                        </div>
                      </div>
                    </div>
                  ) : unlocked ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                        <span>Not Yet Cleared</span>
                        <span>0/3 Gems</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full border border-slate-800" />
                    </div>
                  ) : (
                    <div className="mt-3 pt-2.5 border-t border-slate-900 text-[11px] font-mono text-slate-600">
                      <span>Locked · Complete Chapter {lvl.id - 1}</span>
                    </div>
                  )}
                </div>

                {/* Footer link/status */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-500">
                    {lvl.id === 3 ? 'Boss Citadel' : 'Adventure'}
                  </span>

                  {unlocked ? (
                    <span className="flex items-center gap-1 text-amber-400 group-hover:translate-x-0.5 transition-transform font-medium">
                      {completed ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" /> Replay
                        </>
                      ) : (
                        <>
                          Launch &rarr;
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-[11px] font-mono">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Moves & Controls Reminder Box */}
        <div className="bg-slate-900/60 backdrop-blur-md px-6 py-3 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex flex-col items-center justify-center gap-2.5">
          {/* Row 1: Movement Controls */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded">← / →</span>
              <span>Move</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded">↑</span>
              <span>Jump & Double Jump</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded">↓</span>
              <span>Drop Platform</span>
            </div>
          </div>

          {/* Row 2: Special Actions (Fireball & Dash) */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-amber-400 font-bold bg-amber-950/80 border border-amber-600/40 px-2 py-0.5 rounded">SPACE</span>
              <span className="text-amber-200">Fireball (Tap: Dart · Hold: Mega Blast)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded">SHIFT</span>
              <span className="text-rose-300">Flame Dash (Invulnerable)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
