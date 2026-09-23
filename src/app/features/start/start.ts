import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Mascot } from '../../shared/mascot/mascot';
import { ModeCard } from '../../shared/mode-card/mode-card';
import { AppIcon } from '../../shared/icons/icon';
import { GameStateService } from '../../core/game-state.service';
import { SpeechService } from '../../core/speech.service';
import { SoundService } from '../../core/sound.service';
import { GameMode } from '../../core/theme';

const PARENT_GATE_HOLD_MS = 2000;

@Component({
  selector: 'app-start',
  imports: [Mascot, ModeCard, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './start.html',
  styleUrl: './start.scss',
})
export class Start {
  private readonly router = inject(Router);
  private readonly gameState = inject(GameStateService);
  private readonly speech = inject(SpeechService);
  private readonly sound = inject(SoundService);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = this.gameState.mode;
  readonly childName = this.gameState.childName;
  readonly greeting = computed(() => (this.childName() ? `Chào ${this.childName()}!` : 'Chào bé!'));

  readonly parentGateOpen = signal(false);
  readonly parentGateProgress = signal(0);

  private holdTimer: ReturnType<typeof setInterval> | null = null;
  private spoken = false;

  constructor() {
    afterNextRender(() => {
      this.trySpeakGreeting();
    });
    this.destroyRef.onDestroy(() => this.clearHold());
  }

  pickMode(mode: GameMode): void {
    this.gameState.selectMode(mode);
  }

  startGame(): void {
    this.speech.unlock();
    this.sound.unlock();
    this.gameState.startFromLevel();
    this.router.navigateByUrl('/play');
  }

  onFirstTouch(): void {
    this.speech.unlock();
    this.sound.unlock();
    this.trySpeakGreeting();
  }

  beginHold(): void {
    if (this.holdTimer) return;
    this.parentGateProgress.set(0);
    const start = performance.now();
    this.holdTimer = setInterval(() => {
      const pct = Math.min(1, (performance.now() - start) / PARENT_GATE_HOLD_MS);
      this.parentGateProgress.set(pct);
      if (pct >= 1) {
        this.clearHold();
        this.parentGateOpen.set(true);
      }
    }, 50);
  }

  clearHold(): void {
    if (this.holdTimer) {
      clearInterval(this.holdTimer);
      this.holdTimer = null;
    }
    this.parentGateProgress.set(0);
  }

  closeParentGate(): void {
    this.parentGateOpen.set(false);
  }

  resetProgress(): void {
    this.gameState.resetProgress();
    this.parentGateOpen.set(false);
  }

  changeName(): void {
    this.parentGateOpen.set(false);
    this.router.navigateByUrl('/');
  }

  private trySpeakGreeting(): void {
    if (this.spoken) return;
    this.spoken = true;
    const name = this.childName();
    const text = name
      ? `Chào ${name}! Con hãy chọn Học Số hoặc Học Chữ, rồi bấm Bắt đầu chơi.`
      : 'Chào bé! Con hãy chọn Học Số hoặc Học Chữ, rồi bấm Bắt đầu chơi.';
    this.speech.speak(text);
  }
}
