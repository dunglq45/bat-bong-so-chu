import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Mascot } from '../../shared/mascot/mascot';
import { AppIcon } from '../../shared/icons/icon';
import { GameStateService } from '../../core/game-state.service';
import { SpeechService } from '../../core/speech.service';
import { SoundService } from '../../core/sound.service';

@Component({
  selector: 'app-welcome',
  imports: [Mascot, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class Welcome {
  private readonly router = inject(Router);
  private readonly gameState = inject(GameStateService);
  private readonly speech = inject(SpeechService);
  private readonly sound = inject(SoundService);
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  readonly name = signal(this.gameState.childName());
  readonly hasExistingName = signal(!!this.gameState.childName());

  constructor() {
    afterNextRender(() => this.nameInput()?.nativeElement.focus());
  }

  onInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  get canContinue(): boolean {
    return this.name().trim().length > 0;
  }

  continue(): void {
    if (!this.canContinue) return;
    this.speech.unlock();
    this.sound.unlock();
    this.gameState.setChildName(this.name());
    this.speech.speak(`Chào ${this.gameState.childName()}! Rất vui được chơi cùng con.`);
    this.router.navigateByUrl('/start');
  }
}
