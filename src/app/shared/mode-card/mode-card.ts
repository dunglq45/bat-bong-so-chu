import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppIcon } from '../icons/icon';
import { GameMode } from '../../core/theme';

@Component({
  selector: 'app-mode-card',
  imports: [AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mode-card.html',
  styleUrl: './mode-card.scss',
})
export class ModeCard {
  readonly mode = input.required<GameMode>();
  readonly glyph = input.required<string>();
  readonly label = input.required<string>();
  readonly selected = input(false);
  readonly picked = output<GameMode>();

  onPick(): void {
    this.picked.emit(this.mode());
  }
}
