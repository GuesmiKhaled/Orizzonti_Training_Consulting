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
      (click)="menuToggled.emit()"
    >
      Menu
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
      min-height: 44px;
      padding: 0 1.5rem;
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
    .user {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.85rem;
    }
    /* The sidebar is always visible on wide screens, so the toggle is only for the drawer. */
    @media (min-width: 861px) {
      .menu-button {
        display: none;
      }
    }
  `,
})
export class AdminTopbarComponent {
  readonly userLabel = input('');
  readonly menuToggled = output<void>();
  readonly loggedOut = output<void>();
}
