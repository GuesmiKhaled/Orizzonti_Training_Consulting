import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-svg-icon-animations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="icon-grid">
      <button type="button" class="icon-tile" aria-label="Book: draw-on stroke">
        <svg viewBox="0 0 48 48" class="icon icon--book" aria-hidden="true">
          <path
            class="stroke-path"
            d="M10 8h20a4 4 0 0 1 4 4v28l-4-2H10z"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            class="stroke-path"
            d="M14 16h16M14 22h16M14 28h10"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <span class="label">Book</span>
      </button>

      <button
        type="button"
        class="icon-tile"
        aria-label="Calendar: rotate on hover"
      >
        <svg viewBox="0 0 48 48" class="icon icon--calendar" aria-hidden="true">
          <rect
            x="8"
            y="12"
            width="32"
            height="30"
            rx="4"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linejoin="round"
          />
          <path
            d="M8 20h32"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            d="M16 8v8M32 8v8"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <circle
            cx="16"
            cy="28"
            r="2.5"
            fill="currentColor"
            class="dot dot--1"
          />
          <circle
            cx="24"
            cy="28"
            r="2.5"
            fill="currentColor"
            class="dot dot--2"
          />
          <circle
            cx="32"
            cy="28"
            r="2.5"
            fill="currentColor"
            class="dot dot--3"
          />
          <circle
            cx="16"
            cy="35"
            r="2.5"
            fill="currentColor"
            class="dot dot--4"
          />
          <circle
            cx="24"
            cy="35"
            r="2.5"
            fill="currentColor"
            class="dot dot--5"
          />
        </svg>
        <span class="label">Calendar</span>
      </button>

      <button
        type="button"
        class="icon-tile"
        aria-label="Mail: envelope flap open"
      >
        <svg viewBox="0 0 48 48" class="icon icon--mail" aria-hidden="true">
          <rect
            x="6"
            y="14"
            width="36"
            height="26"
            rx="3"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linejoin="round"
          />
          <path
            class="flap"
            d="M6 14L24 4l18 10"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            class="letter"
            d="M6 14l18 12 18-12"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="label">Mail</span>
      </button>

      <button
        type="button"
        class="icon-tile"
        aria-label="Check: fill pulse and draw-on"
      >
        <svg viewBox="0 0 48 48" class="icon icon--check" aria-hidden="true">
          <circle
            class="ring"
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          />
          <path
            class="check-path"
            d="M14 24l7 7 13-14"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="label">Check</span>
      </button>
    </div>
  `,
  styles: `
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1.5rem;
      max-width: 600px;
    }

    .icon-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem 1rem;
      border: 1px solid var(--adm-border, #10231f16);
      border-radius: var(--adm-radius-card, 16px);
      background: var(--adm-surface, #fbfcfb);
      cursor: pointer;
      color: var(--adm-text, #10231f);
      transition:
        background 0.2s ease,
        border-color 0.2s ease;
    }

    .icon-tile:hover {
      background: var(--adm-surface-hover, #f1f5f1);
      border-color: var(--adm-primary, #0d5c55);
    }

    .icon-tile:focus-visible {
      outline: 2px solid var(--adm-primary, #0d5c55);
      outline-offset: 2px;
    }

    .icon-tile .label {
      font-size: 0.85rem;
      color: var(--adm-text-muted, #586a65);
      font-weight: 500;
    }

    .icon {
      width: 48px;
      height: 48px;
    }

    /* Book: draw-on stroke animation */
    .icon--book .stroke-path {
      stroke-dasharray: 200;
      stroke-dashoffset: 200;
      transition: stroke-dashoffset 0.8s ease-in-out;
    }

    .icon-tile:hover .icon--book .stroke-path {
      stroke-dashoffset: 0;
    }

    /* Calendar: rotate 360° */
    .icon--calendar {
      transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      transform-origin: center;
    }

    .icon-tile:hover .icon--calendar {
      transform: rotate(360deg);
    }

    .icon--calendar .dot {
      opacity: 0;
      transform: scale(0);
      transition:
        opacity 0.3s ease,
        transform 0.3s ease;
    }

    .icon-tile:hover .icon--calendar .dot {
      opacity: 1;
      transform: scale(1);
    }

    .icon-tile:hover .icon--calendar .dot--1 {
      transition-delay: 0.15s;
    }
    .icon-tile:hover .icon--calendar .dot--2 {
      transition-delay: 0.25s;
    }
    .icon-tile:hover .icon--calendar .dot--3 {
      transition-delay: 0.35s;
    }
    .icon-tile:hover .icon--calendar .dot--4 {
      transition-delay: 0.45s;
    }
    .icon-tile:hover .icon--calendar .dot--5 {
      transition-delay: 0.55s;
    }

    /* Mail: envelope flap open */
    .icon--mail .flap {
      transform-origin: 24px 14px;
      transition: transform 0.4s ease-in-out;
    }

    .icon-tile:hover .icon--mail .flap {
      transform: translateY(-6px) rotateX(180deg);
    }

    .icon--mail .letter {
      stroke-dasharray: 60;
      stroke-dashoffset: 60;
      transition: stroke-dashoffset 0.5s ease-in-out 0.1s;
    }

    .icon-tile:hover .icon--mail .letter {
      stroke-dashoffset: 0;
    }

    /* Check: ring fill pulse + draw-on check */
    .icon--check .ring {
      transition:
        stroke 0.3s ease,
        stroke-width 0.3s ease;
    }

    .icon-tile:hover .icon--check .ring {
      stroke: var(--adm-primary, #0d5c55);
      stroke-width: 3.5;
    }

    .icon--check .check-path {
      stroke-dasharray: 40;
      stroke-dashoffset: 40;
      transition: stroke-dashoffset 0.5s ease-in-out 0.15s;
    }

    .icon-tile:hover .icon--check .check-path {
      stroke-dashoffset: 0;
    }

    @media (max-width: 360px) {
      .icon-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .icon {
        width: 40px;
        height: 40px;
      }

      .icon-tile {
        padding: 1rem 0.75rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .icon--book .stroke-path,
      .icon--calendar,
      .icon--mail .flap,
      .icon--mail .letter,
      .icon--check .ring,
      .icon--check .check-path,
      .icon--calendar .dot {
        transition: none !important;
      }

      .icon-tile:hover .icon--calendar {
        transform: none !important;
      }

      .icon-tile:hover .icon--book .stroke-path,
      .icon-tile:hover .icon--mail .letter,
      .icon-tile:hover .icon--check .check-path {
        stroke-dashoffset: 0 !important;
      }
    }
  `,
})
export class SvgIconAnimationsComponent {}
