import React, { useEffect, useState, useRef } from 'react';
import { GameEngineState } from '../game/engine';
import { Heart, Flame, Coins, Gem, Volume2, VolumeX, Pause, Play, Music } from 'lucide-react';

interface HUDProps {
  state: GameEngineState;
  isPaused: boolean;
  onTogglePause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isMusicOn: boolean;
  onToggleMusic: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  isPaused,
  onTogglePause,
  isMuted,
  onToggleMute,
  isMusicOn,
  onToggleMusic,
}) => {
  const p = state.player;
  const manaPercent = Math.max(0, Math.min(100, (p.mana / p.maxMana) * 100));
  const isLowEnergy = manaPercent < 25;

  // Trailing HP damage chip bar & flash effect
  const [trailingHp, setTrailingHp] = useState(p.health);
  const [damageFlash, setDamageFlash] = useState(false);
  const prevHpRef = useRef(p.health);

  useEffect(() => {
    if (p.health < prevHpRef.current) {
      // Health decreased: trigger crimson flash and hold trailing bar before animating down
      setDamageFlash(true);
      const flashTimer = setTimeout(() => setDamageFlash(false), 260);
      const drainTimer = setTimeout(() => {
        setTrailingHp(p.health);
      }, 350);
      prevHpRef.current = p.health;
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(drainTimer);
      };
    } else {
      setTrailingHp(p.health);
      prevHpRef.current = p.health;
    }
  }, [p.health]);

  const hpPercent = Math.max(0, Math.min(100, (p.health / p.maxHealth) * 100));
  const trailingHpPercent = Math.max(0, Math.min(100, (trailingHp / p.maxHealth) * 100));

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4 flex items-center justify-between text-slate-100 select-none">
      {/* Left: Player Stats (HP Bar with Damage Reflection & Flame Energy) */}
      <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
        
        {/* Dedicated Health Bar reflecting damage decreases */}
        <div
          className="flex items-center gap-2"
          title={`Health: ${p.health} / ${p.maxHealth} HP`}
        >
          {/* Heart icon & label */}
          <div className="flex items-center gap-1">
            <Heart
              className={`w-4 h-4 transition-all duration-150 ${
                damageFlash
                  ? 'fill-rose-500 text-rose-500 scale-125'
                  : p.health <= 1
                  ? 'fill-rose-500 text-rose-500 animate-pulse'
                  : 'fill-rose-500 text-rose-500'
              }`}
            />
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">
              HP
            </span>
          </div>

          {/* HP Bar Container */}
          <div
            className={`relative w-24 sm:w-32 h-3.5 bg-slate-900/90 rounded-full overflow-hidden border p-0.5 shadow-inner transition-colors duration-200 ${
              damageFlash
                ? 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                : 'border-slate-700/80'
            }`}
          >
            {/* Trailing damage chip layer (visibly reflects HP lost before draining) */}
            <div
              className="absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-rose-400/90 transition-all duration-500 ease-out"
              style={{ width: `calc(${trailingHpPercent}% - 4px)` }}
            />

            {/* Current HP fill */}
            <div
              className={`relative h-full rounded-full transition-all duration-100 ${
                p.health <= 1
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500'
                  : p.health <= 2
                  ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-amber-400'
                  : 'bg-gradient-to-r from-rose-600 via-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              }`}
              style={{ width: `${hpPercent}%` }}
            />

            {/* Exact numeric HP text overlay */}
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] pointer-events-none">
              {p.health} / {p.maxHealth}
            </span>
          </div>

          {/* Compact Heart icons */}
          <div className="hidden lg:flex items-center gap-0.5 ml-0.5">
            {Array.from({ length: p.maxHealth }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 transition-all duration-200 ${
                  i < p.health
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-slate-800 fill-slate-900'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        {/* Dynamic Fireball Energy Bar (Depletes on Fireball, Auto-Regens) */}
        <div
          className="flex items-center gap-2"
          title={`Flame Energy: ${Math.round(manaPercent)}% · Auto-regenerates over time`}
        >
          <div className="flex items-center gap-1">
            <Flame
              className={`w-4 h-4 transition-colors ${
                p.isCharging
                  ? 'text-yellow-300 animate-bounce drop-shadow-[0_0_12px_rgba(253,224,71,1)]'
                  : isLowEnergy
                  ? 'text-rose-500 animate-pulse'
                  : 'text-amber-500'
              }`}
            />
            <span className="hidden sm:inline text-[10px] font-mono font-bold tracking-wider text-slate-400">
              FLAME
            </span>
          </div>

          {/* Energy Bar Track */}
          <div className="relative w-24 sm:w-32 h-3.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-700/80 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                p.isCharging
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-[0_0_10px_rgba(249,115,22,0.9)]'
                  : isLowEnergy
                  ? 'bg-gradient-to-r from-rose-600 to-orange-600'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
              }`}
              style={{ width: `${manaPercent}%` }}
            />
            {/* Energy numeric overlay */}
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none">
              {Math.round(manaPercent)}%
            </span>
          </div>

          {/* Powerup Badge */}
          {p.currentPowerup !== 'STANDARD' && (
            <span className="text-[10px] font-mono text-amber-300 font-bold tracking-wider uppercase bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
              {p.currentPowerup === 'TRIPLE_FLAME' ? '3x Flame' : 'Mega Inferno'}
            </span>
          )}

          <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

          {/* 2x Jump Ready Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-all ${
              p.doubleJumpAvailable
                ? 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-600 border-slate-800 opacity-60'
            }`}
            title={p.doubleJumpAvailable ? 'Double Jump Ready' : 'Double Jump Spent'}
          >
            <span>2x JUMP</span>
          </div>
        </div>
      </div>

      {/* Center: Stage Title & Tabular Score */}
      <div className="hidden md:flex flex-col items-center bg-slate-950/85 backdrop-blur-md px-4 py-1.5 rounded-xl border border-slate-800 shadow-xl">
        <span className="text-xs font-serif tracking-widest text-slate-400 uppercase">
          {state.level.title}
        </span>
        <span className="text-lg font-bold font-mono tracking-wider tabular-nums text-amber-400">
          {state.score.toString().padStart(6, '0')}
        </span>
      </div>

      {/* Right: Coins, Gems, Lives & Controls */}
      <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
        <div className="flex items-center gap-3 text-xs sm:text-sm font-mono mr-1">
          {/* Coins */}
          <div className="flex items-center gap-1 text-amber-400" title="Coins Collected">
            <Coins className="w-4 h-4" />
            <span className="tabular-nums font-semibold">{state.coins}</span>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-1 text-cyan-400" title="Ember Gems Found">
            <Gem className="w-4 h-4" />
            <span className="tabular-nums font-semibold">{state.gems}</span>
          </div>

          {/* Lives */}
          <span className="text-slate-400 text-xs font-sans">
            Lives: <strong className="text-slate-200">{state.lives}</strong>
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Audio Mute */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute SFX (M)' : 'Mute SFX (M)'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Music Toggle */}
        <button
          onClick={onToggleMusic}
          title={isMusicOn ? 'Mute Music' : 'Enable Music'}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isMusicOn
              ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/80'
              : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          <Music className="w-4 h-4" />
        </button>

        {/* Pause Button */}
        <button
          onClick={onTogglePause}
          title={isPaused ? 'Resume (P)' : 'Pause (P)'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
