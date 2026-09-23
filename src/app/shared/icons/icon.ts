import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName = 'home' | 'settings' | 'play' | 'speaker' | 'star' | 'check';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      @switch (name()) {
        @case ('home') {
          <path
            d="M4 11.5 12 4l8 7.5"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M6 10v8a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3.4" stroke="currentColor" stroke-width="2.1" />
          <path
            d="M12 3.5v2.1M12 18.4v2.1M20.5 12h-2.1M5.6 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8 6.3 6.3"
            stroke="currentColor"
            stroke-width="2.1"
            stroke-linecap="round"
          />
        }
        @case ('play') {
          <path d="M7 5.2v13.6a1 1 0 0 0 1.53.85l11-6.8a1 1 0 0 0 0-1.7l-11-6.8A1 1 0 0 0 7 5.2Z" fill="currentColor" />
        }
        @case ('speaker') {
          <path d="M4 9.5v5h3.2l4.8 3.6V5.9L7.2 9.5H4Z" fill="currentColor" />
          <path
            d="M15.3 9.1a4 4 0 0 1 0 5.8M17.7 6.7a7.5 7.5 0 0 1 0 10.6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        }
        @case ('star') {
          <path
            d="m12 3.5 2.47 5.13 5.53.76-4 4.02.98 5.59L12 16.3l-4.98 2.7.98-5.59-4-4.02 5.53-.76L12 3.5Z"
            fill="currentColor"
          />
        }
        @case ('check') {
          <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
        }
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; }
    svg { display: block; }
  `,
})
export class AppIcon {
  readonly name = input.required<IconName>();
  readonly size = input(24);
}
