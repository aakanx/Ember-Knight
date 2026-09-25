import React, { useState, useEffect, useCallback } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { GameView } from './components/GameView';
import { SoundVaultModal } from './components/SoundVaultModal';
import { soundManager } from './utils/audio';
import { Flame, HelpCircle, X, Music, VolumeX } from 'lucide-react';
import { ChapterCompletionRecord } from './types/game';

export default function App() {
  const [screen, setScreen] = useState<'TITLE' | 'PLAYING'>('TITLE');
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [isMusicOn, setIsMusicOn] = useState<boolean>(() => soundManager.isMusicPlaying());

  // Track completed chapters to enforce linear unlock progression
  const [completedChapters, setCompletedChapters] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ember_knight_completed_chapters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track per-chapter completion records (gems, percentage, points)
  const [chapterRecords, setChapterRecords] = useState<Record<number, ChapterCompletionRecord>>(() => {
    try {
      const saved = localStorage.getItem('ember_knight_chapter_records');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSoundVault, setShowSoundVault] = useState(false);

  // Check if all 3 chapters have achieved 100% completion
  const isAll100Percent = [1, 2, 3].every(
    (id) => (chapterRecords[id]?.percentage ?? 0) >= 100
  );

  // Play Title Screen Music when on Title with gentle fade
  useEffect(() => {
    if (screen === 'TITLE') {
      soundManager.switchChapterMusic('TITLE');
    }
  }, [screen]);

  // First user interaction audio unlock
  useEffect(() => {
    const handleFirstGesture = () => {
      if (screen === 'TITLE') {
        soundManager.switchChapterMusic('TITLE');
      }
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [screen]);

  const handleToggleMusic = useCallback(() => {
    const nextState = soundManager.toggleMusic();
    setIsMusicOn(nextState);
  }, []);

  const handleLevelCompleted = useCallback((record: ChapterCompletionRecord) => {
    setCompletedChapters((prev) => {
      if (!prev.includes(record.levelId)) {
        const next = [...prev, record.levelId];
        try {
          localStorage.setItem('ember_knight_completed_chapters', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      }
      return prev;
    });

    setChapterRecords((prev) => {
      const existing = prev[record.levelId];
      // Keep best performance record (highest percentage and gems)
      const bestRecord: ChapterCompletionRecord = !existing
        ? record
        : {
            ...record,
            percentage: Math.max(existing.percentage, record.percentage),
            gems: Math.max(existing.gems, record.gems),
            points: Math.max(existing.points, record.points),
            coins: Math.max(existing.coins, record.coins),
          };

      const updated = {
        ...prev,
        [record.levelId]: bestRecord,
      };

      try {
        localStorage.setItem('ember_knight_chapter_records', JSON.stringify(updated));
      } catch {
        // ignore
      }

      return updated;
    });
  }, []);

  const handleStartGame = (levelId: number) => {
    setSelectedLevelId(levelId);
    setScreen('PLAYING');
    soundManager.switchChapterMusic(levelId);
  };

  const handleReturnTitle = () => {
    setScreen('TITLE');
    soundManager.switchChapterMusic('TITLE');
  };

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar: Clean static wordmark (Zone 1) - Actions (Zone 3) */}
      <header className="h-13 bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-40 shrink-0 select-none">
        {/* Zone 1: Interactive Easter Egg on Home Screen (Subtle slow blinking of words when 100% unlocked) */}
        {screen === 'TITLE' ? (
          <button
            onClick={() => setShowSoundVault(true)}
            className="flex items-center gap-2 select-none cursor-pointer focus:outline-none text-left py-1"
            aria-label="Ember Knight"
          >
            <Flame className="w-5 h-5 text-amber-500 shrink-0" />
            <span
              className={`font-serif font-black tracking-wide text-base sm:text-lg transition-colors ${
                isAll100Percent
                  ? 'animate-slow-blink text-amber-200'
                  : 'text-slate-100 hover:text-amber-300'
              }`}
            >
              Ember Knight
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2 select-none">
            <Flame className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="font-serif font-black tracking-wide text-base sm:text-lg text-slate-100">
              Ember Knight
            </span>
          </div>
        )}

        {/* Zone 3: Primary Actions & Music Controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Music Toggle on Header */}
          <button
            onClick={handleToggleMusic}
            className={`px-2.5 py-1.5 text-xs font-mono font-medium border rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              isMusicOn
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700/80'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-500 border-slate-800'
            }`}
            title={isMusicOn ? 'Turn Music Off' : 'Turn Music On'}
          >
            {isMusicOn ? (
              <Music className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline">{isMusicOn ? 'Music: ON' : 'Music: OFF'}</span>
          </button>

          <button
            onClick={() => setShowHowToPlay(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Guide</span>
          </button>
        </div>
      </header>

      {/* Main Screen */}
      <main className="flex-1 relative w-full h-[calc(100vh-3.25rem)] overflow-hidden">
        {screen === 'TITLE' ? (
          <TitleScreen
            onStartGame={handleStartGame}
            completedChapters={completedChapters}
            chapterRecords={chapterRecords}
          />
        ) : (
          <GameView
            initialLevelId={selectedLevelId}
            onReturnTitle={handleReturnTitle}
            onLevelCompleted={handleLevelCompleted}
          />
        )}
      </main>

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setShowHowToPlay(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-serif font-bold text-white">How To Play</h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-amber-400 block mb-1">Navigation & Acrobatics</span>
                <p>Use <strong className="text-white">←</strong> and <strong className="text-white">→</strong> (or A / D) to run. Press <strong className="text-white">↑</strong> (or W) to jump, and tap again in mid-air to <strong className="text-amber-300">double jump</strong>! Step onto spring mushrooms for a super high bounce.</p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-rose-400 block mb-1">Flame Dash (SHIFT Key)</span>
                <p>
                  Press <strong className="text-white font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">SHIFT</strong> to unleash a high-speed fiery forward dash. Flame Dash grants <strong className="text-amber-300">brief invulnerability</strong>, allowing you to slip through enemy fireballs, boss shockwaves, and past dangerous traps unharmed! (Cooldown: 1.2s).
                </p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-amber-400 block mb-1">Health & Flame Energy Bars</span>
                <p className="mb-1.5"><strong className="text-rose-400">HP Bar:</strong> Reflects health decreases with damage chip tracking when taking hits.</p>
                <p className="mb-1.5"><strong className="text-amber-300">Tap Space:</strong> Casts a fiery dart projectile that destroys enemies and cracks secret walls (costs 22 energy).</p>
                <p className="mb-1.5"><strong className="text-orange-400">Hold Space (Charge):</strong> Charges radiant energy into a <strong className="text-orange-300">Mega Inferno Blast</strong> (costs 48 energy) with massive blast radius!</p>
                <p className="text-slate-400">Your Flame Energy automatically regenerates over time (20/sec) when not casting.</p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-cyan-400 block mb-1">Chapter Completion & Collectibles</span>
                <p className="text-slate-300">Every chapter contains <strong className="text-cyan-400">3 Ember Gems</strong>, coins, and secret passages. Track your completion percentage and gem mastery directly on each chapter card!</p>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="mt-6 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* Secret Sound Vault Easter Egg Modal */}
      {showSoundVault && (
        <SoundVaultModal
          onClose={() => setShowSoundVault(false)}
          chapterRecords={chapterRecords}
        />
      )}
    </div>
  );
}
