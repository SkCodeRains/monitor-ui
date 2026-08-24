import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card glass-panel animate-fade-in">
        <!-- Logo & Header -->
        <div class="login-header">
          <div class="brand-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
              <path d="M7 10l3 3 7-7"></path>
            </svg>
          </div>
          <h1 class="login-title">Data Stream Monitor</h1>
          <p class="login-subtitle">Sign in to access real-time live events and trash archive</p>
        </div>

        <!-- Error Banner -->
        @if (authService.authError()) {
          <div class="error-banner animate-fade-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ authService.authError() }}</span>
          </div>
        }

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              [(ngModel)]="email" 
              name="email" 
              required
              placeholder="skcoderains@gmail.com"
              autocomplete="username"
            >
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-input-wrapper">
              <input 
                id="password"
                [type]="showPassword() ? 'text' : 'password'" 
                [(ngModel)]="password" 
                name="password" 
                required
                placeholder="Enter your password"
                autocomplete="current-password"
              >
              <button type="button" class="btn-toggle-pw" (click)="showPassword.set(!showPassword())">
                @if (showPassword()) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                }
              </button>
            </div>
          </div>

          <!-- Quick Auto-Fill helper -->
          <div class="quick-fill-row">
            <button type="button" class="btn-quick-fill" (click)="quickFill()">
              ✨ Auto-Fill Admin Credentials
            </button>
          </div>

          <button 
            type="submit" 
            class="btn-submit" 
            [disabled]="authService.isLoading() || !email || !password"
          >
            @if (authService.isLoading()) {
              <span class="spinner-sm"></span>
              <span>Authenticating...</span>
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span>Sign In to Dashboard</span>
            }
          </button>
        </form>

        <div class="login-footer">
          <p class="notice">
            🔒 Telemetry POST API is public. Dashboard data viewing & management requires authentication.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 36px 32px;
      background: rgba(16, 22, 37, 0.85);
      border: 1px solid rgba(59, 130, 246, 0.25);
      box-shadow: var(--shadow-lg), 0 0 40px rgba(59, 130, 246, 0.15);
      border-radius: var(--radius-lg);
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .brand-logo {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 18px rgba(59, 130, 246, 0.4);
      margin: 0 auto 16px;
    }

    .login-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .login-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.35);
      color: #fb7185;
      font-size: 13px;
      margin-bottom: 20px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      input {
        width: 100%;
        padding: 12px 14px;
        font-size: 14px;
        background: #0d121e;
      }
    }

    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      input {
        padding-right: 42px;
      }

      .btn-toggle-pw {
        position: absolute;
        right: 8px;
        background: transparent;
        color: var(--text-muted);
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          color: var(--text-primary);
        }
      }
    }

    .quick-fill-row {
      display: flex;
      justify-content: flex-end;
    }

    .btn-quick-fill {
      background: transparent;
      color: var(--accent-cyan);
      font-size: 12px;
      text-decoration: underline;
      padding: 2px 4px;

      &:hover {
        color: #67e8f9;
      }
    }

    .btn-submit {
      width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--accent-primary);
      color: white;
      padding: 12px 24px;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
      margin-top: 4px;

      &:hover:not(:disabled) {
        background: var(--accent-primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .login-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--border-subtle);
      text-align: center;

      .notice {
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.4;
      }
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  email: string = 'skcoderains@gmail.com';
  password: string = 'CodeR@ins69';
  readonly showPassword = signal<boolean>(false);
  private returnUrl: string = '/dashboard';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  quickFill(): void {
    this.email = 'skcoderains@gmail.com';
    this.password = 'CodeR@ins69';
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;
    await this.authService.login(this.email.trim(), this.password.trim(), this.returnUrl);
  }
}
