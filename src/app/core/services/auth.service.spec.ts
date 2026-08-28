import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let storageStore: Record<string, string> = {};

  beforeEach(() => {
    storageStore = {};
    const mockStorage = {
      getItem: (key: string) => storageStore[key] ?? null,
      setItem: (key: string, value: string) => { storageStore[key] = value; },
      removeItem: (key: string) => { delete storageStore[key]; },
      clear: () => { storageStore = {}; },
      length: 0,
      key: (_index: number) => null
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'dashboard', children: [] },
          { path: 'login', children: [] }
        ])
      ]
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting?.verify();
    storageStore = {};
  });

  it('should initialize with null token, apiKey, and isAuthenticated as false', () => {
    expect(service.token()).toBeNull();
    expect(service.apiKey()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should successfully login and store token and apiKey', async () => {
    const loginPromise = service.login('skcoderains@gmail.com', 'admin123', 'CR-MONITOR-KEY-2026-X99');

    const req = httpTesting.expectOne(request => request.url.endsWith('/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('x-api-key')).toBe('CR-MONITOR-KEY-2026-X99');
    expect(req.request.body).toEqual({
      email: 'skcoderains@gmail.com',
      password: 'admin123',
      apiKey: 'CR-MONITOR-KEY-2026-X99'
    });

    req.flush({
      success: true,
      token: 'mock-jwt-token',
      user: { id: '1', email: 'skcoderains@gmail.com', name: 'Admin' }
    });

    const result = await loginPromise;
    expect(result).toBe(true);
    expect(service.token()).toBe('mock-jwt-token');
    expect(service.apiKey()).toBe('CR-MONITOR-KEY-2026-X99');
    expect(service.isAuthenticated()).toBe(true);
    expect(storageStore['monitor_jwt_auth_token']).toBe('mock-jwt-token');
    expect(storageStore['monitor_jwt_api_key']).toBe('CR-MONITOR-KEY-2026-X99');
  });

  it('should clear token and apiKey on logout', () => {
    service.token.set('mock-token');
    service.apiKey.set('mock-api-key');
    storageStore['monitor_jwt_auth_token'] = 'mock-token';
    storageStore['monitor_jwt_api_key'] = 'mock-api-key';

    service.logout(false);

    expect(service.token()).toBeNull();
    expect(service.apiKey()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(storageStore['monitor_jwt_auth_token']).toBeUndefined();
    expect(storageStore['monitor_jwt_api_key']).toBeUndefined();
  });
});

