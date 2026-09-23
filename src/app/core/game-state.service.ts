import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BREAKPOINT, GameMode, levelsFor } from './theme';

const STORAGE_KEY = 'bat-bong-so-chu:v1';

interface PersistedState {
  childName: string;
  totalStars: number;
  bestLevelByMode: Record<GameMode, number>;
}

function loadPersisted(isBrowser: boolean): PersistedState {
  const fallback: PersistedState = { childName: '', totalStars: 0, bestLevelByMode: { number: 0, letter: 0 } };
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed, bestLevelByMode: { ...fallback.bestLevelByMode, ...parsed?.bestLevelByMode } };
  } catch {
    return fallback;
  }
}

/** Trạng thái xuyên suốt trò chơi: chế độ đang chọn, màn hiện tại, tổng số sao. */
@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly persisted = loadPersisted(this.isBrowser);

  readonly childName = signal(this.persisted.childName);
  readonly mode = signal<GameMode>('number');
  readonly levelIndex = signal(0);
  readonly totalStars = signal(this.persisted.totalStars);

  readonly isPhone = signal(!this.isBrowser ? false : this.computePhone());

  readonly levels = computed(() => levelsFor(this.mode()));
  readonly levelCount = computed(() => this.levels().length);
  readonly currentLevel = computed(() => this.levels()[this.levelIndex()]);

  constructor() {
    if (this.isBrowser) {
      const mq = window.matchMedia(`(max-width: ${BREAKPOINT.phoneMax}px)`);
      const update = () => this.isPhone.set(mq.matches);
      update();
      mq.addEventListener('change', update);
    }
  }

  private computePhone(): boolean {
    return window.innerWidth <= BREAKPOINT.phoneMax;
  }

  setChildName(name: string): void {
    const trimmed = name.trim();
    this.childName.set(trimmed);
    this.persisted.childName = trimmed;
    this.persist();
  }

  selectMode(mode: GameMode): void {
    this.mode.set(mode);
  }

  startFromLevel(index = this.persisted.bestLevelByMode[this.mode()] ?? 0): void {
    this.levelIndex.set(Math.min(index, this.levelCount() - 1));
  }

  resetProgress(): void {
    this.totalStars.set(0);
    this.levelIndex.set(0);
    this.persisted.bestLevelByMode = { number: 0, letter: 0 };
    this.persist();
  }

  addStars(count: number): void {
    this.totalStars.update((v) => v + count);
    this.persist();
  }

  advanceLevel(): boolean {
    const next = this.levelIndex() + 1;
    if (next >= this.levelCount()) {
      this.levelIndex.set(0);
      this.persistBestLevel(0);
      return false;
    }
    this.levelIndex.set(next);
    this.persistBestLevel(next);
    return true;
  }

  private persistBestLevel(index: number): void {
    this.persisted.bestLevelByMode[this.mode()] = index;
    this.persist();
  }

  private persist(): void {
    if (!this.isBrowser) return;
    this.persisted.totalStars = this.totalStars();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.persisted));
    } catch {
      /* bộ nhớ đầy hoặc bị chặn — bỏ qua, không ảnh hưởng gameplay */
    }
  }
}
