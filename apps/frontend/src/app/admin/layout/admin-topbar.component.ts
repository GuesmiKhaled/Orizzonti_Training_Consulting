import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ThemeToggleComponent } from '../../shared/ui';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="menu-button"
      [attr.aria-expanded]="sidebarOpen()"
      (click)="menuToggled.emit()"
    >
      <span class="hamburger" [class.open]="sidebarOpen()">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <span class="menu-label">Menu</span>
    </button>
    <div class="user">
      <app-theme-toggle />
      <span class="user-label">{{ userLabel() }}</span>
      <button type="button" class="logout" (click)="loggedOut.emit()">
        Sign out
      </button>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 56px;
      padding: 0 1.25rem;
      background: var(--adm-surface, #fbfcfb);
      border-bottom: 1px solid var(--adm-border);
    }
    button {
      border: 0;
      background: transparent;
      color: var(--adm-primary);
      font: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    /* Animated hamburger icon — three bars that morph into an X */
    .menu-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      width: auto;
      height: 40px;
      padding: 0 0.75rem;
      border-radius: 12px;
      transition: background 160ms ease;
    }
    .menu-label {
      color: var(--adm-primary, #0d5c55);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .menu-button:hover {
      background: var(--adm-surface-hover, rgba(13, 92, 85, 0.06));
    }
    .hamburger {
      position: relative;
      display: block;
      width: 20px;
      height: 14px;
    }
    .hamburger span {
      position: absolute;
      left: 0;
      display: block;
      width: 100%;
      height: 2px;
      border-radius: 2px;
      background: var(--adm-primary, #0d5c55);
      transition:
        transform 220ms cubic-bezier(0.4, 0, 0.2, 1),
        opacity 160ms ease,
        top 160ms ease;
    }
    .hamburger span:nth-child(1) { top: 0; }
    .hamburger span:nth-child(2) { top: 6px; }
    .hamburger span:nth-child(3) { top: 12px; }

    /* Open state: top and bottom bars rotate to form an X, middle fades */
    .hamburger.open span:nth-child(1) {
      top: 6px;
      transform: rotate(45deg);
    }
    .hamburger.open span:nth-child(2) {
      opacity: 0;
      transform: scaleX(0.4);
    }
    .hamburger.open span:nth-child(3) {
      top: 6px;
      transform: rotate(-45deg);
    }

    .user {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.85rem;
    }
    .user-label {
      color: var(--adm-text-muted, #586a65);
    }
    .logout {
      padding: 0.4rem 0.85rem;
      border-radius: 10px;
      color: var(--adm-danger, #cf4429);
      transition: background 160ms ease;
    }
    .logout:hover {
      background: var(--adm-danger-light, #fee2e2);
    }
    @media (prefers-reduced-motion: reduce) {
      .hamburger span { transition: none; }
      .menu-button, .logout { transition: none; }
    }
  `,
})
export class AdminTopbarComponent {
  readonly userLabel = input('');
  readonly sidebarOpen = input(false);
  readonly menuToggled = output<void>();
  readonly loggedOut = output<void>();
}
