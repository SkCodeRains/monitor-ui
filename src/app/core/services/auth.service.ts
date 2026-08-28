import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { UserProfile, LoginResponse } from '@model';
import { ToastService } from './toast.service';

const TOKEN_STORAGE_KEY = 'monitor_jwt_auth_token';
const API_KEY_STORAGE_KEY = 'monitor_jwt_api_key';
const USER_STORAGE_KEY = 'monitor_jwt_user_profile';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiUrl;

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  readonly apiKey = signal<string | null>(localStorage.getItem(API_KEY_STORAGE_KEY));
  readonly currentUser = signal<UserProfile | null>(this.loadStoredUser());
  readonly isLoading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this.token() && !!this.apiKey());

  constructor() {
    if (this.token() && this.apiKey()) {
      this.verifyToken();
    }
  }

  private loadStoredUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async login(email: string, password: string, apiKey: string, returnUrl?: string): Promise<boolean> {
    this.isLoading.set(true);
    this.authError.set(null);

    try {
      const res = await firstValueFrom(
        this.http.post<LoginResponse>(
          `${this.apiUrl}/auth/login`,
          { email, password, apiKey },
          {
            headers: {
              'x-api-key': apiKey
            }
          }
        )
      );

      if (res && res.success && res.token && res.user) {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        this.token.set(res.token);
        this.apiKey.set(apiKey);
        this.currentUser.set(res.user);
        this.toast.success('Welcome Back', `Logged in as ${res.user.email}`);

        const targetUrl = returnUrl || '/dashboard';
        this.router.navigateByUrl(targetUrl);
        return true;
      } else {
        this.authError.set(res.error || 'Login failed.');
        return false;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errMsg = err?.error?.error || 'Could not connect to authentication server.';
      this.authError.set(errMsg);
      this.toast.error('Authentication Error', errMsg);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  async verifyToken(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; user: UserProfile }>(`${this.apiUrl}/auth/me`)
      );
      if (res && res.success && res.user) {
        this.currentUser.set(res.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
      }
    } catch (err: any) {
      // ONLY clear session if server explicitly responded with 401/403 Unauthorized (invalid/expired JWT or API Key)
      // Do NOT log out on network drop, server restart, or temporary offline state
      if (err && (err.status === 401 || err.status === 403)) {
        this.logout(false);
      }
    }
  }

  logout(showNotification = true): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this.token.set(null);
    this.apiKey.set(null);
    this.currentUser.set(null);
    if (showNotification) {
      this.toast.info('Logged Out', 'You have been signed out.');
    }
    this.router.navigate(['/login']);
  }
}

