import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isMusicOn: boolean;
  onToggleMusic: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onReturnTitle,
  isMuted,
  onToggleMute,
  isMusicOn,
  onToggleMusic,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mb-1">
          GAME PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Press P or Esc to resume
        </p>

        <div className="flex flex-col gap-2.5 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART CHAPTER</span>
          </button>

          <button
            onClick={onReturnTitle}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO MENU</span>
          </button>
        </div>

        {/* Audio Quick Toggles */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            <span>SFX: {isMuted ? 'OFF' : 'ON'}</span>
          </button>

          <div className="h-3 w-px bg-slate-800" />

          <button
            onClick={onToggleMusic}
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
          >
            <Music className={`w-4 h-4 ${isMusicOn ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Music: {isMusicOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
