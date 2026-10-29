import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to system mode when no stored preference exists', () => {
    expect(service.modeSignal()).toBe('system');
  });

  it('persists the chosen mode to localStorage', () => {
    service.set('dark');
    expect(localStorage.getItem('orizzonti-theme')).toBe('dark');
    expect(service.modeSignal()).toBe('dark');
  });

  it('applies the effective theme to document.documentElement', () => {
    service.set('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    service.set('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('reads a previously stored preference on construction', () => {
    localStorage.setItem('orizzonti-theme', 'dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(ThemeService);
    expect(fresh.modeSignal()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('cycles light -> dark -> system -> light', () => {
    service.set('light');
    service.cycle();
    expect(service.modeSignal()).toBe('dark');
    service.cycle();
    expect(service.modeSignal()).toBe('system');
    service.cycle();
    expect(service.modeSignal()).toBe('light');
  });
});
