import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type MascotVariant = 'wave' | 'party';

@Component({
  selector: 'app-mascot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      class="mascot"
      [class.mascot--bounce]="bounce()"
      [src]="'assets/mascot-' + variant() + '.svg'"
      [style.width.px]="size()"
      alt=""
      draggable="false"
    />
  `,
  styles: `
    :host { display: inline-block; line-height: 0; }
    .mascot { width: 100%; height: auto; display: block; user-select: none; -webkit-user-drag: none; }
    .mascot--bounce { animation: mascot-bounce 1.5s var(--ease-pop, cubic-bezier(.34,1.56,.64,1)) 1; }
    @keyframes mascot-bounce {
      0% { transform: translateY(0) scale(1); }
      30% { transform: translateY(-18px) scale(1.05); }
      55% { transform: translateY(0) scale(0.98); }
      75% { transform: translateY(-6px) scale(1.02); }
      100% { transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .mascot--bounce { animation: none; }
    }
  `,
})
export class Mascot {
  readonly variant = input<MascotVariant>('wave');
  readonly size = input(160);
  readonly bounce = input(false);
}
