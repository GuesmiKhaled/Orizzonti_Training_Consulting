import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '../toast/toast.service';
import { describeHttpError, errorInterceptor } from './error.interceptor';
import { SKIP_ERROR_TOAST } from './http-context.tokens';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let toastError: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    toastError = spyOn(TestBed.inject(ToastService), 'error');
  });

  afterEach(() => controller.verify());

  const fail = (
    body: Record<string, unknown> | string,
    status: number,
    context?: HttpContext,
  ): void => {
    http.get('/x', { context }).subscribe({ error: () => undefined });
    controller.expectOne('/x').flush(body, { status, statusText: 'Error' });
  };

  it('shows the backend message for 4xx errors', () => {
    fail({ message: 'Level A1 already exists' }, 409);
    expect(toastError).toHaveBeenCalledWith('Level A1 already exists');
  });

  it('joins validation message arrays', () => {
    fail({ message: ['price must be a string', 'courseHours must be a string'] }, 400);
    expect(toastError).toHaveBeenCalledWith(
      'price must be a string, courseHours must be a string',
    );
  });

  it('shows a generic message for 5xx errors', () => {
    fail({}, 500);
    expect(toastError).toHaveBeenCalledWith(
      'Server error. Please try again later.',
    );
  });

  it('shows a network message when the server is unreachable', () => {
    http.get('/x').subscribe({ error: () => undefined });
    controller.expectOne('/x').error(new ProgressEvent('error'));
    expect(toastError).toHaveBeenCalledWith(
      'Unable to reach the server. Check your connection.',
    );
  });

  it('does not toast 401 (handled by the auth interceptor)', () => {
    fail({}, 401);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('does not toast when the request opts out', () => {
    fail({ message: 'nope' }, 400, new HttpContext().set(SKIP_ERROR_TOAST, true));
    expect(toastError).not.toHaveBeenCalled();
  });

  it('still propagates the error to the caller', () => {
    let status = 0;
    http.get('/x').subscribe({
      error: (e: HttpErrorResponse) => (status = e.status),
    });
    controller.expectOne('/x').flush({}, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });
});

describe('describeHttpError', () => {
  it('falls back to a generic 4xx message', () => {
    const error = new HttpErrorResponse({ status: 400, error: 'plain text' });
    expect(describeHttpError(error)).toBe('The request could not be completed.');
  });
});
