import { DOCUMENT } from '@angular/common';
import {
  Injectable,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

const STORAGE_KEY = 'orizzonti-theme';
const DATA_ATTR = 'data-theme';

/**
 * Signal-based theme controller. Persists the user's choice to localStorage,
 * reacts to OS `prefers-color-scheme` changes when in `system` mode, and sets
 * `document.documentElement.dataset.theme` so the CSS custom-property
 * overrides in `design-tokens.scss` apply.
 *
 * The pre-paint script in `index.html` sets the initial `data-theme` before
 * first render to avoid FOUC; this service keeps it in sync afterwards.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly media = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  private readonly mode = signal<ThemeMode>(this.readStored());
  /** The actually-applied theme after resolving `system`. */
  readonly effective = computed<EffectiveTheme>(() => {
    const mode = this.mode();
    if (mode === 'system') {
      return this.media?.matches ? 'dark' : 'light';
    }
    return mode;
  });

  constructor() {
    this.apply(this.effective());
    this.media?.addEventListener('change', this.onMediaChange);
  }

  ngOnDestroy(): void {
    this.media?.removeEventListener('change', this.onMediaChange);
  }

  /** Returns the user's explicit choice (not the resolved `effective` value). */
  readonly modeSignal = this.mode.asReadonly();

  set(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage may be unavailable (private mode); the in-memory signal still works.
    }
    this.apply(this.effective());
  }

  /** Cycles light → dark → system for the toggle button. */
  cycle(): void {
    const order: readonly ThemeMode[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(this.mode()) + 1) % order.length];
    this.set(next);
  }

  private apply(theme: EffectiveTheme): void {
    this.document.documentElement.setAttribute(DATA_ATTR, theme);
  }

  private readonly onMediaChange = (): void => {
    if (this.mode() === 'system') {
      this.apply(this.effective());
    }
  };

  private readStored(): ThemeMode {
    try {
      const value = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (value === 'light' || value === 'dark' || value === 'system') {
        return value;
      }
    } catch {
      // localStorage unavailable; fall through to system default.
    }
    return 'system';
  }
}
