import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrashService, TrashItem } from '../../services/trash.service';
import { MonitorService } from '../../services/monitor.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { PrettyJsonPipe } from '../../pipes/pretty-json.pipe';

@Component({
  selector: 'app-trash-page',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe, PrettyJsonPipe],
  template: `
    <div class="trash-page animate-fade-in">
      <!-- Header Banner -->
      <div class="trash-header-banner glass-panel">
        <div class="header-left">
          <div class="trash-badge-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
          <div>
            <h2 class="title">Browser Trash Vault</h2>
            <p class="subtitle">
              Locally archived deleted items on this browser. Deleted items here are not visible on other devices.
            </p>
          </div>
        </div>

        <div class="header-right">
          <div class="count-pill">
            <span class="count">{{ trashService.trashCount() }}</span> item(s) in trash
          </div>

          @if (trashService.trashCount() > 0) {
            <button type="button" class="btn-empty" (click)="trashService.emptyTrash()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Empty Trash</span>
            </button>
          }
        </div>
      </div>

      <!-- Trash Grid -->
      @if (trashService.trashCount() === 0) {
        <div class="empty-state glass-panel animate-fade-in">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
          <h3 class="empty-title">Trash is Empty</h3>
          <p class="empty-desc">Deleted items from the live stream dashboard will be safely saved in this local browser vault.</p>
        </div>
      } @else {
        <div class="trash-grid">
          @for (item of trashService.trashItems(); track item.id + item.deletedAt) {
            <div class="trash-card glass-panel animate-fade-in">
              <!-- Top bar -->
              <div class="card-top">
                <div class="top-left">
                  <span class="id-pill">ID: {{ item.id }}</span>
                  @if (item.eventType) {
                    <span class="tag-event">{{ item.eventType }}</span>
                  }
                  @if (item.source) {
                    <span class="tag-source">{{ item.source }}</span>
                  }
                </div>
                <span class="deleted-time" [title]="item.deletedAt">
                  Deleted {{ item.deletedAt | timeAgo }}
                </span>
              </div>

              <!-- Payload Viewer -->
              <div class="data-block">
                <pre class="data-code"><code>{{ displayPayload(item) | prettyJson }}</code></pre>
              </div>

              <!-- Actions -->
              <div class="card-actions">
                <button type="button" class="btn-restore" (click)="restoreItem(item)" title="Restore back to live server">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                  <span>Restore to Live</span>
                </button>

                <button type="button" class="btn-perm-delete" (click)="trashService.deletePermanently(item.id)" title="Delete permanently from browser storage">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span>Remove</span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .trash-page {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .trash-header-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 22px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .trash-badge-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: var(--accent-rose);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .title {
      font-size: 17px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .subtitle {
      font-size: 12px;
      color: var(--text-muted);
      max-width: 520px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .count-pill {
      font-size: 12px;
      background: rgba(244, 63, 94, 0.12);
      color: #fda4af;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(244, 63, 94, 0.25);
      .count {
        font-weight: 700;
        color: white;
      }
    }

    .btn-empty {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(244, 63, 94, 0.2);
      color: #fecdd3;
      border: 1px solid rgba(244, 63, 94, 0.4);
      padding: 7px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 600;

      &:hover {
        background: var(--accent-rose);
        color: white;
      }
    }

    .trash-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .trash-card {
      display: flex;
      flex-direction: column;
      padding: 16px;
      border-radius: var(--radius-lg);
      border: 1px solid rgba(244, 63, 94, 0.2);
      background: rgba(22, 16, 24, 0.7);
      transition: transform 0.2s ease, border-color 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        border-color: rgba(244, 63, 94, 0.4);
      }
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      gap: 8px;
    }

    .top-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .id-pill {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--accent-cyan);
      background: rgba(0, 0, 0, 0.4);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-subtle);
    }

    .tag-event {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .tag-source {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
    }

    .deleted-time {
      font-size: 11px;
      color: #fb7185;
      background: rgba(244, 63, 94, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .data-block {
      background: #090d16;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 12px;
    }

    .data-code {
      margin: 0;
      padding: 10px;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.4;
      color: #cbd5e1;
      max-height: 140px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .btn-restore {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.35);
      padding: 6px 12px;
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 600;

      &:hover {
        background: var(--accent-emerald);
        color: white;
      }
    }

    .btn-perm-delete {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-muted);
      border: 1px solid var(--border-subtle);
      padding: 6px 10px;
      border-radius: var(--radius-md);
      font-size: 12px;

      &:hover {
        background: rgba(244, 63, 94, 0.15);
        color: #fb7185;
        border-color: rgba(244, 63, 94, 0.3);
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 56px 24px;
      text-align: center;
      min-height: 280px;
      border: 1px dashed var(--border-subtle);
    }

    .empty-icon {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: rgba(244, 63, 94, 0.08);
      color: #fda4af;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 17px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .empty-desc {
      font-size: 13px;
      color: var(--text-secondary);
      max-width: 420px;
      line-height: 1.5;
    }
  `]
})
export class TrashComponent {
  readonly trashService = inject(TrashService);
  private readonly monitorService = inject(MonitorService);

  displayPayload(item: TrashItem): any {
    if (item.payload !== undefined && item.payload !== null) return item.payload;
    if (item.data !== undefined && item.data !== null) return item.data;
    return item;
  }

  async restoreItem(item: TrashItem): Promise<void> {
    await this.monitorService.restoreFromTrash(item);
  }
}
