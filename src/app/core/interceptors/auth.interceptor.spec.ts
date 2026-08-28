import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { provideRouter } from '@angular/router';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should attach Authorization and x-api-key headers when credentials exist', () => {
    authService.token.set('test-jwt-token');
    authService.apiKey.set('test-api-key');

    httpClient.get('/api/data').subscribe();

    const req = httpTesting.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    expect(req.request.headers.get('x-api-key')).toBe('test-api-key');
    req.flush({ success: true });
  });

  it('should not attach headers when token and apiKey are not present', () => {
    authService.token.set(null);
    authService.apiKey.set(null);

    httpClient.get('/api/public').subscribe();

    const req = httpTesting.expectOne('/api/public');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.headers.has('x-api-key')).toBe(false);
    req.flush({ success: true });
  });
});
