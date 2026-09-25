import React from 'react';
import { Trophy, Star, ArrowRight, RotateCcw, Home, Gem, Coins, Timer } from 'lucide-react';
import { GameEngineState } from '../game/engine';

interface LevelCompleteModalProps {
  state: GameEngineState;
  onNextLevel: () => void;
  onRestartLevel: () => void;
  onReturnTitle: () => void;
  hasNextLevel: boolean;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  state,
  onNextLevel,
  onRestartLevel,
  onReturnTitle,
  hasNextLevel,
}) => {
  const totalGems = state.level.collectibles.filter((c) => c.type === 'EMBER_GEM').length || 3;
  const totalCoins = state.level.collectibles.filter((c) => c.type === 'COIN').length || 1;

  const gemRatio = Math.min(1, state.gems / totalGems);
  const coinRatio = Math.min(1, state.coins / totalCoins);
  const percentage = Math.round(gemRatio >= 1 && coinRatio >= 0.8 ? 100 : (gemRatio * 0.7 + coinRatio * 0.3) * 100);
  const stars = percentage >= 95 ? 3 : percentage >= 60 ? 2 : 1;

  const minutes = Math.floor(state.timeSeconds / 60);
  const seconds = Math.floor(state.timeSeconds % 60);
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 text-center shadow-2xl shadow-orange-950/50">
        {/* Glow halo */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Badge */}
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-7 h-7 text-amber-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-black text-white mb-1">
          {hasNextLevel ? 'STAGE CLEARED!' : 'REALM LIBERATED!'}
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          {hasNextLevel
            ? state.level.title
            : 'The Ignis Wyrm has fallen. The realm of Pyros is restored!'}
        </p>

        {/* Chapter Completion Percentage Hero Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-5 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Chapter Completion
            </span>
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {percentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 p-0.5 mb-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                percentage >= 100
                  ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Star Badges */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((starIndex) => (
              <Star
                key={starIndex}
                className={`w-6 h-6 transition-all ${
                  starIndex <= stars
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-110'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 text-left">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1 text-cyan-400 mb-1">
              <Gem className="w-3.5 h-3.5" />
              <span className="text-[11px] text-slate-400">Gems</span>
            </div>
            <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
              {state.gems} / {totalGems}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1 text-amber-400 mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span className="text-[11px] text-slate-400">Points</span>
            </div>
            <span className="text-base font-bold font-mono text-amber-300 tabular-nums">
              {state.score.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1 text-slate-300 mb-1">
              <Timer className="w-3.5 h-3.5" />
              <span className="text-[11px] text-slate-400">Time</span>
            </div>
            <span className="text-base font-bold font-mono text-slate-200 tabular-nums">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {hasNextLevel ? (
            <button
              onClick={onNextLevel}
              className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>NEXT CHAPTER</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onReturnTitle}
              className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Home className="w-4 h-4" />
              <span>RETURN TO MAIN MENU</span>
            </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onRestartLevel}
              title="Replay Level"
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex-1 sm:flex-initial flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {hasNextLevel && (
              <button
                onClick={onReturnTitle}
                title="Return to Menu"
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex-1 sm:flex-initial flex items-center justify-center cursor-pointer"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
