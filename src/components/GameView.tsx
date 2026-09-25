import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngineState, initGameEngine, updateEngine } from '../game/engine';
import { renderGame } from '../game/renderer';
import { LEVELS } from '../game/levels';
import { KeyState, ChapterCompletionRecord } from '../types/game';
import { HUD } from './HUD';
import { ControlsGuide } from './ControlsGuide';
import { LevelCompleteModal } from './LevelCompleteModal';
import { GameOverModal } from './GameOverModal';
import { PauseMenu } from './PauseMenu';
import { soundManager } from '../utils/audio';

interface GameViewProps {
  initialLevelId: number;
  onReturnTitle: () => void;
  onLevelCompleted: (record: ChapterCompletionRecord) => void;
}

export const GameView: React.FC<GameViewProps> = ({
  initialLevelId,
  onReturnTitle,
  onLevelCompleted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentLevelId, setCurrentLevelId] = useState(initialLevelId);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isMusicOn, setIsMusicOn] = useState(soundManager.isMusicPlaying());

  // Engine state reference to prevent react re-render stalls inside 60fps loop
  const engineRef = useRef<GameEngineState>(
    initGameEngine(LEVELS.find((l) => l.id === initialLevelId) || LEVELS[0], 3)
  );
  // Reactive tick state so HUD updates smoothly in real time
  const [hudTick, setHudTick] = useState(0);
  const reportedClearRef = useRef<number | null>(null);

  // Key tracking
  const keyStateRef = useRef<KeyState>({
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false,
    KeyA: false,
    KeyD: false,
    KeyW: false,
    KeyS: false,
    ShiftLeft: false,
  });

  const [activeKeyState, setActiveKeyState] = useState<KeyState>({ ...keyStateRef.current });

  // Handle Level Loading & Music Switch (each chapter starts with 3 lives)
  const loadLevel = useCallback((levelId: number) => {
    const levelData = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
    engineRef.current = initGameEngine(levelData, 3);
    reportedClearRef.current = null;
    setCurrentLevelId(levelId);
    setIsPaused(false);
    // Switch to Chapter-specific musical theme
    soundManager.switchChapterMusic(levelId);
  }, []);

  // Set initial chapter music on mount
  useEffect(() => {
    soundManager.switchChapterMusic(initialLevelId);
  }, [initialLevelId]);

  // Handle return to title screen
  const handleReturnToTitle = useCallback(() => {
    soundManager.switchChapterMusic('TITLE');
    onReturnTitle();
  }, [onReturnTitle]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling from arrow keys / space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        setIsPaused((prev) => !prev);
        return;
      }

      if (e.code === 'KeyM') {
        const nextMute = !isMuted;
        soundManager.setMuted(nextMute);
        setIsMuted(nextMute);
        return;
      }

      if (e.code in keyStateRef.current) {
        keyStateRef.current[e.code as keyof KeyState] = true;
        setActiveKeyState({ ...keyStateRef.current });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in keyStateRef.current) {
        keyStateRef.current[e.code as keyof KeyState] = false;
        setActiveKeyState({ ...keyStateRef.current });
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMuted]);

  // Touch controls support for mobile / on-screen clicks
  const handleTouchPress = useCallback((key: keyof KeyState, pressed: boolean) => {
    keyStateRef.current[key] = pressed;
    setActiveKeyState({ ...keyStateRef.current });
  }, []);

  // Audio Toggles
  const handleToggleMute = useCallback(() => {
    const nextMute = !isMuted;
    soundManager.setMuted(nextMute);
    setIsMuted(nextMute);
  }, [isMuted]);

  const handleToggleMusic = useCallback(() => {
    const nextState = soundManager.toggleMusic();
    setIsMusicOn(nextState);
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let frameCounter = 0;

    const loop = (currentTime: number) => {
      const dt = Math.min(0.06, (currentTime - lastTime) / 1000); // delta time cap at 60ms
      lastTime = currentTime;
      frameCounter++;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Resize if needed
          const displayWidth = canvas.clientWidth;
          const displayHeight = canvas.clientHeight;
          if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
          }

          if (!isPaused && !engineRef.current.isLevelCleared && !engineRef.current.isGameOver) {
            updateEngine(
              engineRef.current,
              keyStateRef.current,
              dt,
              canvas.width,
              canvas.height
            );

          }

          // Check if level just cleared
          if (engineRef.current.isLevelCleared && reportedClearRef.current !== currentLevelId) {
            reportedClearRef.current = currentLevelId;
            const totalGems = engineRef.current.level.collectibles.filter((c) => c.type === 'EMBER_GEM').length || 3;
            const totalCoins = engineRef.current.level.collectibles.filter((c) => c.type === 'COIN').length || 1;
            const gemRatio = Math.min(1, engineRef.current.gems / totalGems);
            const coinRatio = Math.min(1, engineRef.current.coins / totalCoins);
            const percentage = Math.round(gemRatio >= 1 && coinRatio >= 0.8 ? 100 : (gemRatio * 0.7 + coinRatio * 0.3) * 100);

            onLevelCompleted({
              levelId: currentLevelId,
              completed: true,
              gems: engineRef.current.gems,
              totalGems,
              coins: engineRef.current.coins,
              totalCoins,
              percentage,
              points: engineRef.current.score,
            });
          }

          // Frame-accurate HUD updates every 2 frames (~30fps) for smooth energy depletion & regeneration
          if (frameCounter % 2 === 0) {
            setHudTick((t) => (t + 1) % 10000);
          }

          renderGame(ctx, engineRef.current, canvas.width, canvas.height);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPaused, onLevelCompleted, currentLevelId]);

  const state = engineRef.current;
  const hasNextLevel = currentLevelId < LEVELS.length;

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* HUD Bar - re-renders smoothly on hudTick */}
      <HUD
        key={hudTick}
        state={state}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((p) => !p)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isMusicOn={isMusicOn}
        onToggleMusic={handleToggleMusic}
      />

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none cursor-crosshair"
      />

      {/* Controls Overlay & Touch D-Pad */}
      <ControlsGuide
        keyState={activeKeyState}
        onTouchPress={handleTouchPress}
      />

      {/* Pause Menu Modal */}
      {isPaused && (
        <PauseMenu
          onResume={() => setIsPaused(false)}
          onRestart={() => loadLevel(currentLevelId)}
          onReturnTitle={handleReturnToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isMusicOn={isMusicOn}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* Level Complete Modal */}
      {state.isLevelCleared && (
        <LevelCompleteModal
          state={state}
          onNextLevel={() => loadLevel(currentLevelId + 1)}
          onRestartLevel={() => loadLevel(currentLevelId)}
          onReturnTitle={handleReturnToTitle}
          hasNextLevel={hasNextLevel}
        />
      )}

      {/* Game Over Modal */}
      {state.isGameOver && (
        <GameOverModal
          state={state}
          onRetry={() => loadLevel(currentLevelId)}
          onReturnTitle={handleReturnToTitle}
        />
      )}
    </div>
  );
};
