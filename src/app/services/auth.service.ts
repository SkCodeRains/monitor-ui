import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserProfile;
  error?: string;
}

const TOKEN_STORAGE_KEY = 'monitor_jwt_auth_token';
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
  readonly currentUser = signal<UserProfile | null>(this.loadStoredUser());
  readonly isLoading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this.token());

  constructor() {
    if (this.token()) {
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

  async login(email: string, password: string, returnUrl?: string): Promise<boolean> {
    this.isLoading.set(true);
    this.authError.set(null);

    try {
      const res = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      );

      if (res && res.success && res.token && res.user) {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        this.token.set(res.token);
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
      // ONLY clear session if server explicitly responded with 401 Unauthorized (invalid/expired JWT)
      // Do NOT log out on network drop, server restart, or temporary offline state
      if (err && (err.status === 401 || err.status === 403)) {
        this.logout(false);
      }
    }
  }

  logout(showNotification = true): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    if (showNotification) {
      this.toast.info('Logged Out', 'You have been signed out.');
    }
    this.router.navigate(['/login']);
  }
}
