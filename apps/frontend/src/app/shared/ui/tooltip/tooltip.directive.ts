import {
  ChangeDetectionStrategy,
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * CSS-only tooltip. Shows a `role="tooltip"` element on hover/focus,
 * dismisses on blur/Escape. No JS positioning library; uses `position: fixed`
 * with a small offset computed from the host's bounding rect so it works
 * inside scroll containers and modals.
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true,
  host: {
    '[attr.aria-describedby]': 'tipId()',
  },
})
export class TooltipDirective {
  readonly appTooltip = input<string>('');

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly tipId = signal(`app-tip-${Math.random().toString(36).slice(2, 9)}`);

  private tip: HTMLElement | null = null;

  @HostListener('mouseenter')
  @HostListener('focus')
  show(): void {
    const text = this.appTooltip();
    if (!text || this.tip) {
      return;
    }
    const tip = document.createElement('span');
    tip.id = this.tipId();
    tip.className = 'app-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.textContent = text;
    document.body.appendChild(tip);
    this.position(tip);
    tip.style.opacity = '1';
    this.tip = tip;
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  hide(): void {
    this.remove();
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.remove();
  }

  private remove(): void {
    if (this.tip) {
      this.tip.remove();
      this.tip = null;
    }
  }

  private position(tip: HTMLElement): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    tip.style.position = 'fixed';
    tip.style.left = `${rect.left + rect.width / 2}px`;
    tip.style.top = `${rect.bottom + 6}px`;
    tip.style.transform = 'translateX(-50%)';
  }

  ngOnDestroy(): void {
    this.remove();
  }
}
