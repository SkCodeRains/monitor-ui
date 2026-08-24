import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MonitorService } from '../../services/monitor.service';
import { TrashService } from '../../services/trash.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="app-header glass-panel">
      <!-- Top Bar: Logo, Navigation, & User Controls -->
      <div class="header-main">
        <div class="header-brand">
          <div class="brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
              <path d="M7 10l3 3 7-7"></path>
            </svg>
          </div>
          <div class="brand-text">
            <h1 class="brand-title">Data Stream Monitor</h1>
            <span class="brand-subtitle">Real-time WebSocket & Telemetry Vault</span>
          </div>
        </div>

        <!-- Navigation Router Tabs -->
        <nav class="view-tabs">
          <a 
            routerLink="/dashboard" 
            routerLinkActive="active" 
            [routerLinkActiveOptions]="{exact: true}"
            class="tab-link"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
            </svg>
            <span>Dashboard</span>
            <span class="tab-badge">{{ monitorService.totalCount() }}</span>
          </a>

          <a 
            routerLink="/trash" 
            routerLinkActive="active" 
            class="tab-link trash-tab"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Trash Vault</span>
            @if (trashService.trashCount() > 0) {
              <span class="tab-badge trash-count">{{ trashService.trashCount() }}</span>
            }
          </a>
        </nav>

        <!-- Right Side: Status, User Auth, & Sync -->
        <div class="header-stats">
          <!-- WebSocket Status Indicator -->
          <div 
            class="status-pill ws-pill" 
            [class.ws-connected]="monitorService.wsService.status() === 'CONNECTED'"
            [class.ws-reconnecting]="monitorService.wsService.status() === 'RECONNECTING' || monitorService.wsService.status() === 'CONNECTING'"
            [class.ws-disconnected]="monitorService.wsService.status() === 'DISCONNECTED'"
          >
            <span class="status-dot"></span>
            <span class="status-label">
              @switch (monitorService.wsService.status()) {
                @case ('CONNECTED') { WebSocket: Live }
                @case ('CONNECTING') { WebSocket: Connecting }
                @case ('RECONNECTING') { WebSocket: Retrying }
                @default { WebSocket: Offline }
              }
            </span>
          </div>

          <!-- Auth User Info / Sign In -->
          @if (authService.isAuthenticated()) {
            <div class="user-pill">
              <div class="user-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <span class="user-email">{{ authService.currentUser()?.email }}</span>
              <button type="button" class="btn-logout" (click)="authService.logout()" title="Sign Out">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          } @else {
            <a routerLink="/login" class="btn-signin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span>Sign In</span>
            </a>
          }

          <!-- Sync Button -->
          <button class="btn-refresh" (click)="onRefresh()" [disabled]="monitorService.isLoading()" title="Manual sync with server">
            <svg [class.spin]="monitorService.isLoading()" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      padding: 12px 20px;
      margin-bottom: 20px;
    }

    .header-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .brand-subtitle {
      font-size: 11px;
      color: var(--text-muted);
    }

    .view-tabs {
      display: flex;
      align-items: center;
      background: rgba(13, 18, 30, 0.7);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 3px;
      gap: 4px;
    }

    .tab-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      background: transparent;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        color: var(--text-primary);
      }

      &.active {
        background: var(--accent-primary);
        color: white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);

        &.trash-tab {
          background: var(--accent-rose);
          box-shadow: 0 2px 8px rgba(244, 63, 94, 0.35);
        }
      }
    }

    .tab-badge {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      background: rgba(0, 0, 0, 0.3);
      padding: 1px 6px;
      border-radius: var(--radius-full);

      &.trash-count {
        background: rgba(244, 63, 94, 0.3);
        color: #fecdd3;
      }
    }

    .header-stats {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 500;
      background: rgba(16, 22, 34, 0.6);
      border: 1px solid var(--border-subtle);

      &.ws-connected {
        border-color: rgba(16, 185, 129, 0.35);
        color: #34d399;
        background: rgba(16, 185, 129, 0.08);
        .status-dot {
          background-color: var(--accent-emerald);
          box-shadow: 0 0 10px var(--accent-emerald);
          animation: pulseGlow 1.8s infinite;
        }
      }

      &.ws-reconnecting {
        border-color: rgba(245, 158, 11, 0.35);
        color: #fbbf24;
        background: rgba(245, 158, 11, 0.08);
        .status-dot {
          background-color: var(--accent-amber);
          box-shadow: 0 0 10px var(--accent-amber);
          animation: pulseGlow 1s infinite;
        }
      }

      &.ws-disconnected {
        border-color: rgba(244, 63, 94, 0.35);
        color: #fb7185;
        background: rgba(244, 63, 94, 0.08);
        .status-dot {
          background-color: var(--accent-rose);
        }
      }
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px 4px 6px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
    }

    .user-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.2);
      color: var(--accent-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-email {
      font-size: 12px;
      color: var(--text-primary);
      max-width: 140px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .btn-logout {
      background: transparent;
      color: var(--text-muted);
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: var(--accent-rose);
        background: rgba(244, 63, 94, 0.15);
      }
    }

    .btn-signin {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--accent-primary);
      color: white;
      padding: 6px 12px;
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;

      &:hover {
        background: var(--accent-primary-hover);
      }
    }

    .btn-refresh {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      padding: 6px 10px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover:not(:disabled) {
        background: rgba(59, 130, 246, 0.15);
        color: #93c5fd;
      }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class HeaderComponent {
  readonly monitorService = inject(MonitorService);
  readonly trashService = inject(TrashService);
  readonly authService = inject(AuthService);

  onRefresh(): void {
    this.monitorService.loadItems();
  }
}
