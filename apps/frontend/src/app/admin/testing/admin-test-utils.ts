import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { EnvironmentProviders, Provider, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/api/api.config';

export const BASE = 'http://api.test';

export function configureHttpTesting(extra: (Provider | EnvironmentProviders)[] = []): HttpTestingController {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
      ...extra,
    ],
  });
  return TestBed.inject(HttpTestingController);
}

export function mount<T>(
  type: Type<T>,
  inputs: Record<string, unknown> = {},
): ComponentFixture<T> {
  const fixture = TestBed.createComponent(type);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  return fixture;
}

export const rootOf = (fixture: ComponentFixture<unknown>): HTMLElement =>
  fixture.nativeElement as HTMLElement;

/** Expects exactly one request with this method and path (query string ignored). */
export function expectCall(
  http: HttpTestingController,
  method: string,
  path: string,
): TestRequest {
  return http.expectOne((r) => r.method === method && r.url === `${BASE}${path}`);
}

export function typeInto(host: HTMLElement, selector: string, value: string): void {
  const input = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!input) {
    throw new Error(`No element for ${selector}`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('change'));
}

export function choose(host: HTMLElement, selector: string, optionText: string): void {
  const select = host.querySelector<HTMLSelectElement>(selector);
  if (!select) {
    throw new Error(`No element for ${selector}`);
  }
  const index = Array.from(select.options).findIndex((o) => o.textContent?.trim() === optionText);
  select.selectedIndex = index;
  select.dispatchEvent(new Event('change'));
}

export function clickButton(host: HTMLElement, scope: string, text: string): void {
  const target = Array.from(host.querySelectorAll<HTMLElement>(scope)).find((el) =>
    el.textContent?.trim().includes(text),
  );
  if (!target) {
    throw new Error(`No "${text}" in ${scope}`);
  }
  target.click();
}
