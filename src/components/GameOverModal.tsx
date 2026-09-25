import React from 'react';
import { RotateCcw, Home, Skull, Gem, Coins } from 'lucide-react';
import { GameEngineState } from '../game/engine';

interface GameOverModalProps {
  state: GameEngineState;
  onRetry: () => void;
  onReturnTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  onRetry,
  onReturnTitle,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative max-w-md w-full bg-slate-900 border border-rose-900/50 rounded-2xl p-6 sm:p-8 text-center shadow-2xl shadow-rose-950/50">
        <div className="w-14 h-14 bg-rose-950/50 border border-rose-700/40 rounded-full flex items-center justify-center mx-auto mb-3">
          <Skull className="w-7 h-7 text-rose-500" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-black text-rose-500 mb-1">
          EMBER EXTINGUISHED
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          The flame never truly dies. Rekindle your spirit and rise again.
        </p>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1 text-cyan-400 mb-0.5">
              <Gem className="w-3.5 h-3.5" />
              <span className="text-xs text-slate-400">Gems</span>
            </div>
            <span className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
              {state.gems} / 3
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1 text-amber-400 mb-0.5">
              <Coins className="w-3.5 h-3.5" />
              <span className="text-xs text-slate-400">Points</span>
            </div>
            <span className="text-lg font-bold font-mono text-amber-300 tabular-nums">
              {state.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onRetry}
            className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={onReturnTitle}
            className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
