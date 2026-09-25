import React from 'react';
import { KeyState } from '../types/game';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Flame, Zap } from 'lucide-react';

interface ControlsGuideProps {
  keyState: KeyState;
  onTouchPress?: (key: keyof KeyState, pressed: boolean) => void;
}

export const ControlsGuide: React.FC<ControlsGuideProps> = ({
  keyState,
  onTouchPress,
}) => {
  const isLeft = keyState.ArrowLeft || keyState.KeyA;
  const isRight = keyState.ArrowRight || keyState.KeyD;
  const isUp = keyState.ArrowUp || keyState.KeyW;
  const isDown = keyState.ArrowDown || keyState.KeyS;
  const isSpace = keyState.Space;
  const isShift = keyState.ShiftLeft;

  return (
    <div className="absolute bottom-2 left-0 right-0 z-30 pointer-events-none px-3 flex flex-col sm:flex-row items-center justify-between gap-2 select-none">
      {/* Visual Keyboard Indicator */}
      <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800/80 shadow-2xl text-xs text-slate-300 pointer-events-auto">
        {/* Movement Arrows */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Move:</span>
          <div
            className={`w-7 h-7 rounded flex items-center justify-center font-mono border transition-all duration-75 ${
              isLeft
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-95'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <div
            className={`w-7 h-7 rounded flex items-center justify-center font-mono border transition-all duration-75 ${
              isRight
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-95'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <div
            className={`w-7 h-7 rounded flex items-center justify-center font-mono border transition-all duration-75 ${
              isUp
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-95'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
            title="Jump · Tap again in air for Double Jump"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </div>
          <div
            className={`w-7 h-7 rounded flex items-center justify-center font-mono border transition-all duration-75 ${
              isDown
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-95'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Spacebar Fireball */}
        <div className="flex items-center gap-1.5">
          <div
            className={`h-7 px-3 rounded flex items-center gap-1 font-mono text-[11px] font-bold border transition-all duration-75 ${
              isSpace
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.9)] scale-95'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${isSpace ? 'text-yellow-200' : 'text-orange-400'}`} />
            <span>SPACE</span>
          </div>
          <span className="text-[11px] text-amber-400 hidden lg:inline">
            (Tap: Fireball · Hold: Mega Inferno)
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Dash */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div
            className={`h-7 px-2 rounded flex items-center gap-1 font-mono text-[11px] font-semibold border transition-all duration-75 ${
              isShift
                ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)] scale-95'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            <Zap className={`w-3 h-3 ${isShift ? 'text-amber-200' : 'text-rose-400'}`} />
            <span>SHIFT</span>
          </div>
          <span className="text-[11px] text-rose-300">Flame Dash</span>
        </div>
      </div>

      {/* Touch / Mobile Action buttons for touchscreens */}
      {onTouchPress && (
        <div className="flex sm:hidden items-center justify-between w-full pointer-events-auto px-1 py-1">
          {/* Touch D-Pad */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onPointerDown={() => onTouchPress('ArrowLeft', true)}
              onPointerUp={() => onTouchPress('ArrowLeft', false)}
              onPointerLeave={() => onTouchPress('ArrowLeft', false)}
              className="w-10 h-10 bg-slate-900 border border-slate-700 active:bg-amber-500 active:text-slate-950 rounded-lg flex items-center justify-center text-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onPointerDown={() => onTouchPress('ArrowRight', true)}
              onPointerUp={() => onTouchPress('ArrowRight', false)}
              onPointerLeave={() => onTouchPress('ArrowRight', false)}
              className="w-10 h-10 bg-slate-900 border border-slate-700 active:bg-amber-500 active:text-slate-950 rounded-lg flex items-center justify-center text-slate-200"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onPointerDown={() => onTouchPress('ArrowDown', true)}
              onPointerUp={() => onTouchPress('ArrowDown', false)}
              onPointerLeave={() => onTouchPress('ArrowDown', false)}
              className="w-10 h-10 bg-slate-900 border border-slate-700 active:bg-amber-500 active:text-slate-950 rounded-lg flex items-center justify-center text-slate-200"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>

          {/* Jump & Fire buttons */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onPointerDown={() => onTouchPress('ArrowUp', true)}
              onPointerUp={() => onTouchPress('ArrowUp', false)}
              onPointerLeave={() => onTouchPress('ArrowUp', false)}
              className="w-12 h-10 bg-slate-900 border border-slate-700 active:bg-emerald-500 active:text-slate-950 rounded-lg flex items-center justify-center text-slate-200 text-xs font-bold"
            >
              JUMP
            </button>
            <button
              onPointerDown={() => onTouchPress('Space', true)}
              onPointerUp={() => onTouchPress('Space', false)}
              onPointerLeave={() => onTouchPress('Space', false)}
              className="w-14 h-10 bg-gradient-to-r from-orange-600 to-rose-600 border border-orange-500 active:scale-95 rounded-lg flex items-center justify-center text-white text-xs font-bold gap-1 shadow-lg shadow-orange-600/30"
            >
              <Flame className="w-4 h-4" />
              FIRE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
