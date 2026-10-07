import { Component, computed, input } from '@angular/core';
import { sparklinePath } from './chart-math';

/** A small trend line with no axes. Decorative unless `ariaLabel` is given. */
@Component({
  selector: 'app-sparkline',
  template: `
    <svg viewBox="0 0 120 40" width="120" height="40" [attr.role]="ariaLabel() ? 'img' : null" [attr.aria-label]="ariaLabel() || null" [attr.aria-hidden]="ariaLabel() ? null : true">
      @if (d()) {
        <path [attr.d]="d()" fill="none" [attr.stroke]="color()" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      }
    </svg>
  `,
  styles: `:host { display: inline-block; line-height: 0; }`,
})
export class Sparkline {
  readonly values = input.required<number[]>();
  readonly color = input('var(--text)');
  readonly ariaLabel = input<string>();

  protected readonly d = computed(() => sparklinePath(this.values(), { width: 120, height: 40 }));
}
