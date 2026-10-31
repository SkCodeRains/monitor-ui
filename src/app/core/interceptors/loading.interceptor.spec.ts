import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { loadingInterceptor, SKIP_LOADER, LOADER_MESSAGE } from './loading.interceptor';
import { LoaderService } from '../services/loader.service';

describe('loadingInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let loaderService: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoaderService,
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    loaderService = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    httpTesting.verify();
    loaderService.reset();
  });

  it('should increment activeRequests on request dispatch and decrement on response', () => {
    expect(loaderService.activeRequests()).toBe(0);
    expect(loaderService.isLoading()).toBe(false);

    httpClient.get('/api/test').subscribe();

    expect(loaderService.activeRequests()).toBe(1);
    expect(loaderService.isLoading()).toBe(true);

    const req = httpTesting.expectOne('/api/test');
    req.flush({ success: true });

    expect(loaderService.activeRequests()).toBe(0);
    expect(loaderService.isLoading()).toBe(false);
  });

  it('should safely decrement and hide loader on HTTP error', () => {
    httpClient.get('/api/error').subscribe({
      error: () => {}
    });

    expect(loaderService.activeRequests()).toBe(1);
    expect(loaderService.isLoading()).toBe(true);

    const req = httpTesting.expectOne('/api/error');
    req.flush('Error occurred', { status: 500, statusText: 'Server Error' });

    expect(loaderService.activeRequests()).toBe(0);
    expect(loaderService.isLoading()).toBe(false);
  });

  it('should handle multiple concurrent requests cleanly', () => {
    httpClient.get('/api/req1').subscribe();
    httpClient.get('/api/req2').subscribe();

    expect(loaderService.activeRequests()).toBe(2);
    expect(loaderService.isLoading()).toBe(true);

    const req1 = httpTesting.expectOne('/api/req1');
    const req2 = httpTesting.expectOne('/api/req2');

    // Complete first request
    req1.flush({ id: 1 });
    expect(loaderService.activeRequests()).toBe(1);
    expect(loaderService.isLoading()).toBe(true); // Still loading because req2 is active

    // Complete second request
    req2.flush({ id: 2 });
    expect(loaderService.activeRequests()).toBe(0);
    expect(loaderService.isLoading()).toBe(false);
  });

  it('should bypass loader when SKIP_LOADER context is provided', () => {
    const context = new HttpContext().set(SKIP_LOADER, true);
    httpClient.get('/api/background-poll', { context }).subscribe();

    expect(loaderService.activeRequests()).toBe(0);
    expect(loaderService.isLoading()).toBe(false);

    const req = httpTesting.expectOne('/api/background-poll');
    req.flush({ status: 'ok' });

    expect(loaderService.activeRequests()).toBe(0);
  });

  it('should bypass loader and sanitize header when x-skip-loader header is passed', () => {
    httpClient.get('/api/silent', {
      headers: { 'x-skip-loader': 'true' }
    }).subscribe();

    expect(loaderService.activeRequests()).toBe(0);

    const req = httpTesting.expectOne('/api/silent');
    expect(req.request.headers.has('x-skip-loader')).toBe(false); // Header was stripped
    req.flush({ status: 'ok' });
  });

  it('should update loading message when LOADER_MESSAGE context is passed', () => {
    const context = new HttpContext().set(LOADER_MESSAGE, 'Exporting audit logs...');
    httpClient.get('/api/export', { context }).subscribe();

    expect(loaderService.message()).toBe('Exporting audit logs...');

    const req = httpTesting.expectOne('/api/export');
    req.flush({ success: true });
  });
});
