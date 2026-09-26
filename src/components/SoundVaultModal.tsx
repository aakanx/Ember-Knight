import React, { useState, useEffect, useRef } from 'react';
import { X, Flame, Download, Play, Pause, Music, Lock, CheckCircle2, Disc, Radio, AlertCircle } from 'lucide-react';
import { ChapterCompletionRecord } from '../types/game';
import { soundManager } from '../utils/audio';
import { renderBossTrackToWav, downloadBlob } from '../utils/audioExporter';

interface SoundVaultModalProps {
  onClose: () => void;
  chapterRecords: Record<number, ChapterCompletionRecord>;
}

export const SoundVaultModal: React.FC<SoundVaultModalProps> = ({ onClose, chapterRecords }) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const ch1Percent = chapterRecords[1]?.percentage ?? 0;
  const ch2Percent = chapterRecords[2]?.percentage ?? 0;
  const ch3Percent = chapterRecords[3]?.percentage ?? 0;

  const isNaturallyUnlocked = ch1Percent >= 100 && ch2Percent >= 100 && ch3Percent >= 100;
  const isUnlocked = isNaturallyUnlocked;

  // Manage track preview
  useEffect(() => {
    return () => {
      // Restore title music on unmount if preview was playing
      soundManager.switchChapterMusic('TITLE');
    };
  }, []);

  const handleTogglePreview = () => {
    if (isPlayingPreview) {
      soundManager.switchChapterMusic('TITLE');
      setIsPlayingPreview(false);
    } else {
      soundManager.switchChapterMusic(3);
      setIsPlayingPreview(true);
    }
  };

  const handleDownloadWav = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // Render 2 loops with clean fadeout into standard CD-Quality Stereo WAV
      const wavBlob = await renderBossTrackToWav(2);
      downloadBlob(wavBlob, 'ember-knight-wrath-of-the-ignis-wyrm-boss-theme.wav');
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to export boss soundtrack:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-950/50 p-6 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-amber-500/15 via-orange-500/5 to-transparent pointer-events-none rounded-t-2xl blur-xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer z-10"
          aria-label="Close Sound Vault"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Flame className="w-6 h-6 fill-amber-500/20 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/90 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                Easter Egg
              </span>
              {isUnlocked && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Unlocked
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-white tracking-wide">
              Ember Sound Vault
            </h2>
          </div>
        </div>

        {/* Content Section: Unlocked vs Locked */}
        {isUnlocked ? (
          <div>
            <p className="text-xs text-slate-300 text-left mb-4 leading-relaxed">
              Congratulations, Grandmaster Knight! Having fully liberated Pyros at 100% mastery, the royal vaults have unsealed the procedural studio master of the final boss theme.
            </p>

            {/* Boss Track Audio Card */}
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4.5 mb-5 text-left relative overflow-hidden">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                    isPlayingPreview
                      ? 'bg-rose-950/80 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'bg-slate-900 border-slate-700 text-amber-400'
                  }`}>
                    {isPlayingPreview ? (
                      <Radio className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Disc className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Wrath of the Ignis Wyrm</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Chapter 3 Boss Theme · 130 BPM
                    </p>
                  </div>
                </div>

                {/* Live Preview Button */}
                <button
                  onClick={handleTogglePreview}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isPlayingPreview
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-white" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-amber-300" />
                      <span>Preview</span>
                    </>
                  )}
                </button>
              </div>

              {/* Animated Equalizer Bars when playing */}
              <div className="h-8 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-center gap-1.5 px-3 mb-3 overflow-hidden">
                {[12, 24, 18, 28, 14, 22, 10, 26, 16, 20, 30, 15, 25, 12, 18].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isPlayingPreview
                        ? 'bg-gradient-to-t from-amber-500 via-orange-500 to-rose-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                        : 'bg-slate-800'
                    }`}
                    style={{
                      height: isPlayingPreview ? `${Math.max(6, (h * ((i % 3) + 1.2)) % 26 + 4)}px` : '4px',
                    }}
                  />
                ))}
              </div>

              {/* Track Specs */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">FORMAT</span>
                  <strong className="text-slate-200">16-Bit WAV</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">SAMPLING</span>
                  <strong className="text-slate-200">44.1 kHz Stereo</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">SIZE</span>
                  <strong className="text-slate-200">~2.6 MB</strong>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadWav}
              disabled={isExporting}
              className={`w-full py-3.5 px-4 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                exportSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-orange-950/50 hover:shadow-orange-900/70'
              }`}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Studio Master...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Soundtrack Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>DOWNLOAD BOSS TRACK (.WAV)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 font-mono text-center mt-2.5">
              Rendered via Web Audio API offline synthesis • Zero external files
            </p>
          </div>
        ) : (
          <div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4.5 mb-5 text-left">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>The Sound Vault is Sealed</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                To unlock the high-fidelity Ignis Wyrm Boss Soundtrack download, achieve <strong className="text-amber-400">100% completion</strong> in all three chapters of the adventure.
              </p>

              {/* Progress Breakdown */}
              <div className="space-y-2.5 font-mono text-xs">
                {/* Chapter 1 */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    {ch1Percent >= 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className={ch1Percent >= 100 ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                      Chapter 1: Verdant Canopy
                    </span>
                  </div>
                  <span className={`font-bold tabular-nums ${ch1Percent >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {ch1Percent}% / 100%
                  </span>
                </div>

                {/* Chapter 2 */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    {ch2Percent >= 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className={ch2Percent >= 100 ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                      Chapter 2: Molten Caverns
                    </span>
                  </div>
                  <span className={`font-bold tabular-nums ${ch2Percent >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {ch2Percent}% / 100%
                  </span>
                </div>

                {/* Chapter 3 */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    {ch3Percent >= 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className={ch3Percent >= 100 ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                      Chapter 3: Obsidian Citadel
                    </span>
                  </div>
                  <span className={`font-bold tabular-nums ${ch3Percent >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {ch3Percent}% / 100%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                Tip: Collect every Ember Gem and gold coin in each chapter to reach 100%!
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
