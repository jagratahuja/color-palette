import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Check, RefreshCw, Lock, Unlock, Undo2, Palette } from 'lucide-react';

interface Color {
  hex: string;
  copied: boolean;
  locked: boolean;
}

interface PaletteSnapshot {
  hexes: string[];
  locked: boolean[];
}

const PALETTE_SIZE = 5;
const HISTORY_LIMIT = 5;
const COPY_FEEDBACK_MS = 1600;

function App() {
  const [colors, setColors] = useState<Color[]>(createInitialPalette());
  const [paletteHistory, setPaletteHistory] = useState<PaletteSnapshot[]>([]);
  const [fullPaletteCopied, setFullPaletteCopied] = useState(false);
  const [paletteVersion, setPaletteVersion] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [backFeedback, setBackFeedback] = useState('');
  const copyResetTimersRef = useRef<Array<number | undefined>>([]);
  const fullCopyResetTimerRef = useRef<number>();
  const backFeedbackTimerRef = useRef<number>();

  const handleGenerate = useCallback(() => {
    setColors(previous => {
      const snapshot = {
        hexes: previous.map(color => color.hex),
        locked: previous.map(color => color.locked),
      };

      setPaletteHistory(currentHistory => [snapshot, ...currentHistory].slice(0, HISTORY_LIMIT));

      return previous.map(color =>
        color.locked
          ? { ...color, copied: false }
          : { ...color, hex: generateRandomColor(), copied: false }
      );
    });

    setPaletteVersion(version => version + 1);
    setHasGenerated(true);
  }, []);

  useEffect(() => {
    const copyResetTimers = copyResetTimersRef.current;

    return () => {
      copyResetTimers.forEach(timerId => {
        if (timerId) {
          window.clearTimeout(timerId);
        }
      });

      if (fullCopyResetTimerRef.current) {
        window.clearTimeout(fullCopyResetTimerRef.current);
      }

      if (backFeedbackTimerRef.current) {
        window.clearTimeout(backFeedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleKeyboardGenerate(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      const isInteractiveTarget =
        !!target &&
        (target.isContentEditable ||
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          tagName === 'button' ||
          tagName === 'a');

      if (isInteractiveTarget) {
        return;
      }

      if (event.key === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        handleGenerate();
      }
    }

    window.addEventListener('keydown', handleKeyboardGenerate);

    return () => {
      window.removeEventListener('keydown', handleKeyboardGenerate);
    };
  }, [handleGenerate]);

  function generateRandomColor(): string {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return '#' + randomColor.padStart(6, '0').toUpperCase();
  }

  function createInitialPalette(): Color[] {
    return Array.from({ length: PALETTE_SIZE }, () => ({
      hex: generateRandomColor(),
      copied: false,
      locked: false,
    }));
  }

  function handleBack() {
    if (paletteHistory.length === 0) {
      setBackFeedback('No previous palettes available.');

      if (backFeedbackTimerRef.current) {
        window.clearTimeout(backFeedbackTimerRef.current);
      }

      backFeedbackTimerRef.current = window.setTimeout(() => {
        setBackFeedback('');
        backFeedbackTimerRef.current = undefined;
      }, COPY_FEEDBACK_MS);

      return;
    }

    setPaletteHistory(previous => {
      if (previous.length === 0) {
        return previous;
      }

      const [latest, ...rest] = previous;

      setColors(current =>
        current.map((color, index) => ({
          ...color,
          hex: latest.hexes[index] ?? color.hex,
          locked: latest.locked[index] ?? color.locked,
          copied: false,
        }))
      );

      setPaletteVersion(version => version + 1);

      return rest;
    });

    setBackFeedback('');
  }

  function handleToggleLock(index: number) {
    setColors(previous =>
      previous.map((color, i) => (i === index ? { ...color, locked: !color.locked } : color))
    );
  }

  async function handleCopy(index: number, hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      return;
    }

    setColors(prev => prev.map((color, i) =>
      i === index ? { ...color, copied: true } : color
    ));

    const currentTimer = copyResetTimersRef.current[index];
    if (currentTimer) {
      window.clearTimeout(currentTimer);
    }

    copyResetTimersRef.current[index] = window.setTimeout(() => {
      setColors(prev => prev.map((color, i) =>
        i === index ? { ...color, copied: false } : color
      ));
      copyResetTimersRef.current[index] = undefined;
    }, COPY_FEEDBACK_MS);
  }

  async function handleCopyPalette() {
    const fullPalette = colors.map(color => color.hex).join(', ');
    try {
      await navigator.clipboard.writeText(fullPalette);
    } catch {
      return;
    }

    setFullPaletteCopied(true);

    if (fullCopyResetTimerRef.current) {
      window.clearTimeout(fullCopyResetTimerRef.current);
    }

    fullCopyResetTimerRef.current = window.setTimeout(() => {
      setFullPaletteCopied(false);
      fullCopyResetTimerRef.current = undefined;
    }, COPY_FEEDBACK_MS);
  }

  const hasHistory = paletteHistory.length > 0;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-foreground">
      <div className="grid-atmosphere absolute inset-0 pointer-events-none" aria-hidden />

      <div
        className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute bottom-10 right-6 h-72 w-72 rounded-full bg-secondary/25 blur-3xl"
        aria-hidden
      />

      <header className="sticky top-0 z-20 border-b border-border/55 bg-card/55 backdrop-blur-md">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3 justify-self-start">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-background/55 text-accent shadow-neon">
              <Palette className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Palette Engine
              </p>
              <p className="text-sm font-bold text-foreground sm:text-base">
                Color Palette Generator
              </p>
            </div>
          </div>

          <div aria-hidden className="justify-self-center" />

          <button
            onClick={handleGenerate}
            className="btn-primary justify-self-end inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate
          </button>
        </div>
      </header>

      <main className={`relative flex w-full flex-1 flex-col px-4 py-8 sm:px-6 lg:px-10 ${hasGenerated ? 'justify-center' : ''}`}>
        {!hasGenerated && (
          <section className="glass-shell overflow-hidden rounded-3xl px-6 py-10 sm:px-8 sm:py-12 lg:px-12" aria-label="Hero">
          <div className="mx-auto w-full text-center">
            <p className="mb-5 inline-flex items-center rounded-full border border-border/60 bg-card/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Live Design System
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              <span className="text-foreground">Every palette matters.</span>{' '}
              <span className="brand-heading">Build visual rhythm.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Build instantly usable color stories designed for modern product workflows.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
              <span className="rounded-full border border-border/60 bg-background/45 px-3 py-1">
                Back supports up to 5 previous palettes
              </span>
              <span className="rounded-full border border-border/60 bg-background/45 px-3 py-1">
                Press Space, Enter, or click Generate Palette
              </span>
            </div>

            <div className="mt-8 flex items-center justify-center">
              <button
                onClick={handleGenerate}
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-foreground"
              >
                <RefreshCw className="h-5 w-5" />
                Generate Palette
              </button>
            </div>
          </div>
          </section>
        )}

        <section className={`${hasGenerated ? '' : 'mt-8'}`} aria-label="Palette Display Section">
          <div className="mb-6 text-center">
            <div>
              <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                Color Palette
              </h2>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleBack}
                className={`btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${!hasHistory ? 'opacity-45' : ''}`}
              >
                <Undo2 className="h-4 w-4" />
                Back
              </button>

              <button
                onClick={handleCopyPalette}
                className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em]"
              >
                {fullPaletteCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied Palette
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Palette
                  </>
                )}
              </button>
            </div>

            {backFeedback && (
              <p className="mt-3 text-sm font-medium text-accent">
                {backFeedback}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-5">
          {colors.map((color, index) => (
            <article
              key={index}
              className="palette-card group overflow-hidden rounded-2xl bg-card/85 backdrop-blur-sm"
            >
              <div
                key={`${index}-${paletteVersion}`}
                className="color-block h-40 w-full"
                style={{ backgroundColor: color.hex }}
                onClick={() => handleCopy(index, color.hex)}
              >
                <div className="h-full w-full bg-gradient-to-b from-transparent to-black/5" />
              </div>

              <div className="space-y-3 p-4">
                <button
                  onClick={() => handleCopy(index, color.hex)}
                  className="w-full rounded-lg border border-border/60 bg-background/45 px-3 py-2 transition-all duration-200 hover:border-accent/65"
                >
                  <span className="flex items-center justify-center gap-2 font-mono text-base font-semibold tracking-wide text-foreground">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-foreground/20"
                      style={{ backgroundColor: color.hex }}
                      aria-hidden
                    />
                    {color.copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      color.hex
                    )}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCopy(index, color.hex)}
                    className="btn-secondary inline-flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>

                  <button
                    onClick={() => handleToggleLock(index)}
                    className="lock-chip inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-[0.05em]"
                  >
                    {color.locked ? (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        Locked
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3.5 w-3.5" />
                        Lock
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
          </div>

          {hasGenerated && (
            <div className="mt-8 flex items-center justify-center">
              <button
                onClick={handleGenerate}
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-foreground"
              >
                <RefreshCw className="h-5 w-5" />
                Generate Palette
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="relative mt-8 border-t border-border/60 bg-card/40 py-6 backdrop-blur-sm">
        <div className="grid w-full grid-cols-1 items-center gap-2 px-4 text-center sm:grid-cols-[1fr_auto_1fr] sm:px-6 lg:px-10">
          <p className="justify-self-center text-xs font-semibold uppercase tracking-[0.22em] text-muted sm:justify-self-start">
            v2.0
          </p>
          <div className="justify-self-center">
            <p className="text-sm text-muted-foreground">
              Built with <span className="text-pink-400">♥</span> by{' '}
              <span className="font-semibold text-primary">Jagrat Ahuja</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              © 2026 All rights reserved.
            </p>
          </div>
          <div aria-hidden className="hidden sm:block" />
        </div>
      </footer>
    </div>
  );
}

export default App;
