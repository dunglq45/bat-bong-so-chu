import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BalloonColorName, BALLOON_COLORS } from '../../core/theme';

export type BalloonState = 'flying' | 'correct' | 'wrong';

const PARTICLE_ANGLES = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];

@Component({
  selector: 'app-balloon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './balloon.html',
  styleUrl: './balloon.scss',
})
export class Balloon {
  readonly value = input.required<string>();
  readonly color = input.required<BalloonColorName>();
  readonly size = input(130);
  readonly durationMs = input(9000);
  readonly leftPercent = input(50);
  readonly state = input<BalloonState>('flying');
  readonly hinted = input(false);
  readonly isPhone = input(false);

  readonly caught = output<void>();
  readonly reachedTop = output<void>();

  readonly particles = PARTICLE_ANGLES;

  get palette() {
    return BALLOON_COLORS[this.color()];
  }

  onPointerDown(event: PointerEvent): void {
    if (this.state() !== 'flying') return;
    event.preventDefault();
    this.caught.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (this.state() !== 'flying') return;
    this.caught.emit();
  }

  onRiseEnd(): void {
    this.reachedTop.emit();
  }
}
