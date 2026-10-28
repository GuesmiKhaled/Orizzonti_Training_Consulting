import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="menu-button"
      [attr.aria-expanded]="sidebarOpen()"
      [attr.aria-label]="sidebarOpen() ? 'Close navigation' : 'Open navigation'"
      (click)="menuToggled.emit()"
    >
      <span class="hamburger" [class.open]="sidebarOpen()">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>
    <div class="user">
      <span>{{ userLabel() }}</span>
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
      min-height: 48px;
      padding: 0 1rem 0 1.25rem;
      background: #fff;
      border-bottom: 1px solid #e3e8f0;
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
      width: 40px;
      height: 40px;
      border-radius: 8px;
      transition: background 160ms ease;
    }
    .menu-button:hover {
      background: rgba(68, 66, 90, 0.08);
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
      background: var(--adm-primary, #44425a);
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
  `,
})
export class AdminTopbarComponent {
  readonly userLabel = input('');
  readonly sidebarOpen = input(false);
  readonly menuToggled = output<void>();
  readonly loggedOut = output<void>();
}
