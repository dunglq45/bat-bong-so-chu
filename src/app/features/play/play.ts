import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Balloon, BalloonState } from '../../shared/balloon/balloon';
import { Mascot } from '../../shared/mascot/mascot';
import { AppIcon } from '../../shared/icons/icon';
import { GameStateService } from '../../core/game-state.service';
import { SpeechService } from '../../core/speech.service';
import { BalloonColorName, CORRECT_CATCHES_PER_LEVEL, MOTION, PRAISE_PHRASES, randomBalloonColor, randomItem } from '../../core/theme';

interface BalloonVM {
  id: number;
  value: string;
  color: BalloonColorName;
  lane: number;
  leftPercent: number;
  durationMs: number;
  state: BalloonState;
}

interface ConfettiPiece {
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
}

const HINT_DELAY_MS = MOTION.hintDelayMs;
const CONFETTI_COLORS = ['#FF5C8A', '#FFC93C', '#4CC76B', '#3D9BFF', '#9B6BFF', '#FF8A3D'];

let uid = 0;

@Component({
  selector: 'app-play',
  imports: [Balloon, Mascot, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './play.html',
  styleUrl: './play.scss',
})
export class Play {
  private readonly router = inject(Router);
  private readonly gameState = inject(GameStateService);
  private readonly speech = inject(SpeechService);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = this.gameState.mode;
  readonly childName = this.gameState.childName;
  readonly isPhone = this.gameState.isPhone;
  readonly levelIndex = this.gameState.levelIndex;
  readonly levelCount = this.gameState.levelCount;
  readonly totalStars = this.gameState.totalStars;

  readonly target = signal('');
  readonly correctCount = signal(0);
  readonly balloons = signal<BalloonVM[]>([]);
  readonly hintActive = signal(false);
  readonly mascotBounce = signal(false);

  readonly showHomeConfirm = signal(false);
  readonly showLevelUp = signal(false);
  readonly praiseText = signal('');
  readonly confetti = signal<ConfettiPiece[]>([]);

  readonly maxBalloons = computed(() => (this.isPhone() ? 4 : 6));

  readonly wordForMode = computed(() => (this.mode() === 'number' ? 'số' : 'chữ'));
  readonly promptLabel = computed(() =>
    this.isPhone() ? `Bấm ${this.wordForMode()}` : `Con hãy bấm ${this.wordForMode()}`,
  );
  private readonly namedPrefix = computed(() => (this.childName() ? `${this.childName()} ơi, ` : ''));

  private lanes: (number | null)[] = [];
  private spawnTimer: ReturnType<typeof setInterval> | null = null;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  private removalTimers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    afterNextRender(() => this.beginLevel());
    this.destroyRef.onDestroy(() => this.teardown());
  }

  balloonHinted(b: BalloonVM): boolean {
    return this.hintActive() && b.value === this.target() && b.state === 'flying';
  }

  speakPrompt(): void {
    this.speech.speak(`${this.namedPrefix()}Con hãy bấm ${this.wordForMode()} ${this.target()}`);
  }

  onCatch(b: BalloonVM): void {
    if (b.state !== 'flying') return;
    this.resetHintTimer();

    if (b.value === this.target()) {
      this.setBalloonState(b.id, 'correct');
      this.gameState.addStars(1);
      this.correctCount.update((v) => v + 1);
      this.bounceMascot();
      this.scheduleRemoval(b.id, MOTION.popMs + MOTION.starFlyMs);

      if (this.correctCount() >= CORRECT_CATCHES_PER_LEVEL) {
        this.stopSpawning();
        this.clearHintTimer();
        this.scheduleRemoval(-1, MOTION.popMs + MOTION.starFlyMs, () => this.triggerLevelUp());
      } else {
        this.pickNextTarget();
      }
    } else {
      this.setBalloonState(b.id, 'wrong');
      this.scheduleRemoval(b.id, MOTION.wobbleMs, () => this.setBalloonState(b.id, 'flying'));
      this.speakPrompt();
    }
  }

  onReachedTop(b: BalloonVM): void {
    this.freeLane(b.lane);
    this.balloons.update((list) => list.filter((x) => x.id !== b.id));
  }

  openHomeConfirm(): void {
    this.showHomeConfirm.set(true);
    this.stopSpawning();
    this.clearHintTimer();
  }

  cancelHomeConfirm(): void {
    this.showHomeConfirm.set(false);
    this.startSpawning();
    this.resetHintTimer();
  }

  confirmHome(): void {
    this.teardown();
    this.router.navigateByUrl('/start');
  }

  continueAfterLevelUp(): void {
    this.showLevelUp.set(false);
    this.gameState.advanceLevel();
    this.beginLevel();
  }

  private beginLevel(): void {
    this.correctCount.set(0);
    this.balloons.set([]);
    this.lanes = Array.from({ length: this.maxBalloons() }, () => null);
    this.pickNextTarget();
    this.startSpawning();
  }

  private pickNextTarget(): void {
    const pool = this.gameState.currentLevel().pool;
    let next = randomItem(pool);
    if (pool.length > 1) {
      while (next === this.target()) next = randomItem(pool);
    }
    this.target.set(next);
    this.hintActive.set(false);
    this.resetHintTimer();
    setTimeout(() => this.speakPrompt(), 150);
  }

  private startSpawning(): void {
    this.stopSpawning();
    this.spawnTimer = setInterval(() => this.trySpawn(), 1500);
    this.trySpawn();
  }

  private stopSpawning(): void {
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = null;
    }
  }

  private trySpawn(): void {
    const freeLanes = this.lanes.reduce<number[]>((acc, occupied, i) => {
      if (occupied === null) acc.push(i);
      return acc;
    }, []);
    if (!freeLanes.length) return;

    const pool = this.gameState.currentLevel().pool;
    const hasCorrectFlying = this.balloons().some((b) => b.value === this.target() && b.state === 'flying');
    const value = hasCorrectFlying ? randomItem(pool) : this.target();

    const lane = randomItem(freeLanes);
    const id = ++uid;
    this.lanes[lane] = id;

    const total = this.maxBalloons();
    const leftPercent = ((lane + 0.5) / total) * 82 + 9;
    const [minMs, maxMs] = MOTION.balloonRiseMs;

    this.balloons.update((list) => [
      ...list,
      {
        id,
        value,
        color: randomBalloonColor(),
        lane,
        leftPercent,
        durationMs: minMs + Math.random() * (maxMs - minMs),
        state: 'flying',
      },
    ]);
  }

  private setBalloonState(id: number, state: BalloonState): void {
    this.balloons.update((list) => list.map((b) => (b.id === id ? { ...b, state } : b)));
  }

  private freeLane(lane: number): void {
    if (this.lanes[lane] !== undefined) this.lanes[lane] = null;
  }

  private scheduleRemoval(id: number, delayMs: number, after?: () => void): void {
    const timer = setTimeout(() => {
      this.removalTimers.delete(timer);
      if (id >= 0) {
        const balloon = this.balloons().find((b) => b.id === id);
        if (balloon) this.freeLane(balloon.lane);
        this.balloons.update((list) => list.filter((b) => b.id !== id));
      }
      after?.();
    }, delayMs);
    this.removalTimers.add(timer);
  }

  private resetHintTimer(): void {
    this.clearHintTimer();
    this.hintActive.set(false);
    this.hintTimer = setTimeout(() => {
      this.hintActive.set(true);
      this.speakPrompt();
    }, HINT_DELAY_MS);
  }

  private clearHintTimer(): void {
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
  }

  private bounceMascot(): void {
    this.mascotBounce.set(false);
    requestAnimationFrame(() => {
      this.mascotBounce.set(true);
      setTimeout(() => this.mascotBounce.set(false), 1500);
    });
  }

  private triggerLevelUp(): void {
    this.praiseText.set(randomItem(PRAISE_PHRASES));
    this.confetti.set(this.buildConfetti());
    this.showLevelUp.set(true);
    const praiseBase = this.praiseText().replace(/!$/, '');
    const nameCall = this.childName() ? ` ${this.childName()}` : '';
    this.speech.speak(`${praiseBase}${nameCall}! Con đã qua Màn ${this.levelIndex() + 1}`);
  }

  private buildConfetti(): ConfettiPiece[] {
    return Array.from({ length: 48 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 400,
      duration: 1200 + Math.random() * 600,
      rotate: Math.random() * 360,
      color: randomItem(CONFETTI_COLORS),
    }));
  }

  private teardown(): void {
    this.stopSpawning();
    this.clearHintTimer();
    this.removalTimers.forEach((t) => clearTimeout(t));
    this.removalTimers.clear();
    this.speech.cancel();
  }
}
