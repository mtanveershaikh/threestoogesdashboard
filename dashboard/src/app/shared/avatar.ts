import { Component, input } from '@angular/core';

/** The bot's picture, or a dashed circle in the bot's color when there is no avatarUrl. */
@Component({
  selector: 'app-avatar',
  template: `
    @if (url()) {
      <img [src]="url()" [alt]="name()" [style.border-color]="color()" />
    } @else {
      <span class="placeholder" role="img" [attr.aria-label]="name() + ' avatar placeholder'" [style.border-color]="color()">
        <svg viewBox="0 0 30 30" aria-hidden="true">
          <circle cx="15" cy="11" r="5" fill="none" [attr.stroke]="color()" stroke-width="1.8" />
          <path d="M5 26 C6 19 24 19 25 26" fill="none" [attr.stroke]="color()" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      width: var(--size, 64px);
      height: var(--size, 64px);
    }
    img, .placeholder {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid;
    }
    img { object-fit: cover; }
    .placeholder {
      border-style: dashed;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg { width: 47%; height: 47%; }
  `,
  host: { '[style.--size.px]': 'size()' },
})
export class Avatar {
  readonly name = input.required<string>();
  readonly color = input('var(--border-dashed)');
  readonly url = input<string>();
  readonly size = input(64);
}
