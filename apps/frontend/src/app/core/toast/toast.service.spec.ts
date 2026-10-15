import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    service = TestBed.inject(ToastService);
  });

  it('adds toasts with increasing ids and the right kind', fakeAsync(() => {
    service.error('boom');
    service.success('ok');
    const [first, second] = service.toasts();
    expect(first).toEqual({ id: first.id, kind: 'error', message: 'boom' });
    expect(second.kind).toBe('success');
    expect(second.id).toBeGreaterThan(first.id);
    tick(10000);
  }));

  it('dismisses a toast manually', fakeAsync(() => {
    service.info('hello');
    service.dismiss(service.toasts()[0].id);
    expect(service.toasts().length).toBe(0);
    tick(10000);
  }));

  it('auto-dismisses after a delay', fakeAsync(() => {
    service.info('temporary');
    expect(service.toasts().length).toBe(1);
    tick(6000);
    expect(service.toasts().length).toBe(0);
  }));
});
