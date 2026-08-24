import { Component, input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorItem } from '../../models/monitor-item.model';
import { MonitorService } from '../../services/monitor.service';
import { ToastService } from '../../services/toast.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { PrettyJsonPipe } from '../../pipes/pretty-json.pipe';

@Component({
  selector: 'app-tile-card',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe, PrettyJsonPipe],
  template: `
    <div 
      class="tile-card glass-panel" 
      [class.selected]="isSelected()"
      (click)="onCardClick($event)"
    >
      <!-- Card Top Bar -->
      <div class="card-header">
        <div class="header-left">
          <!-- Selection Checkbox -->
          <label class="custom-checkbox" (click)="$event.stopPropagation()">
            <input 
              type="checkbox" 
              [checked]="isSelected()"
              (change)="monitorService.toggleSelectItem(item().id)"
            >
            <span class="checkmark"></span>
          </label>

          <!-- Unique ID Pill -->
          <button 
            type="button" 
            class="id-badge" 
            (click)="copyId($event)" 
            title="Click to copy ID: {{ item().id }}"
          >
            <span class="id-text">ID: {{ formatDisplayId(item().id) }}</span>
            <svg class="copy-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>

        <!-- Date & Delete Action -->
        <div class="header-right">
          <span class="timestamp-badge" [title]="item().createdAt">
            {{ item().createdAt | timeAgo }}
          </span>

          <button 
            type="button" 
            class="btn-delete-card" 
            (click)="onDelete($event)" 
            title="Delete this tile from array"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Event Tags (if eventType or source present) -->
      @if (item().eventType || item().source) {
        <div class="event-meta-tags">
          @if (item().eventType) {
            <span class="tag-event" [class]="'event-' + item().eventType?.toLowerCase()">
              {{ item().eventType }}
            </span>
          }
          @if (item().source) {
            <span class="tag-source">
              {{ item().source }}
            </span>
          }
        </div>
      }

      <!-- Card Data Content -->
      <div class="card-content">
        <div class="data-block">
          <div class="data-header">
            <span class="data-type-label">{{ isJson() ? 'Payload / JSON' : 'Raw Content' }}</span>
            <button type="button" class="btn-copy-data" (click)="copyData($event)">
              {{ copied() ? 'Copied!' : 'Copy Payload' }}
            </button>
          </div>
          <pre class="data-code"><code>{{ displayPayload() | prettyJson }}</code></pre>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tile-card {
      display: flex;
      flex-direction: column;
      padding: 16px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), 
                  box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                  border-color 0.2s ease,
                  background-color 0.2s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        background: var(--bg-card-hover);
        border-color: rgba(59, 130, 246, 0.4);
        box-shadow: var(--shadow-md), 0 0 15px rgba(59, 130, 246, 0.15);

        .btn-delete-card {
          opacity: 1;
        }
      }

      &.selected {
        background: var(--bg-card-selected);
        border-color: var(--border-selected);
        box-shadow: 0 0 0 1px var(--accent-primary), var(--shadow-glow);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      gap: 8px;
    }

    .header-left, .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .custom-checkbox {
      display: inline-flex;
      align-items: center;
      position: relative;
      cursor: pointer;
      user-select: none;

      input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
      }

      .checkmark {
        height: 18px;
        width: 18px;
        background-color: #0e1422;
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &:hover input ~ .checkmark {
        border-color: var(--accent-primary);
      }

      input:checked ~ .checkmark {
        background-color: var(--accent-primary);
        border-color: var(--accent-primary);
      }

      input:checked ~ .checkmark::after {
        content: "";
        width: 4px;
        height: 8px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        margin-bottom: 2px;
      }
    }

    .id-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(0, 0, 0, 0.4);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--accent-cyan);

      &:hover {
        border-color: var(--accent-cyan);
        background: rgba(6, 182, 212, 0.15);
      }

      .copy-icon {
        opacity: 0.6;
      }
    }

    .timestamp-badge {
      font-size: 11px;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.04);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .btn-delete-card {
      background: rgba(244, 63, 94, 0.1);
      color: #fb7185;
      padding: 5px;
      border-radius: 6px;
      border: 1px solid rgba(244, 63, 94, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      opacity: 0.8;

      &:hover {
        background: var(--accent-rose);
        color: white;
        border-color: var(--accent-rose);
        transform: scale(1.05);
      }
    }

    .event-meta-tags {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .tag-event {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.03em;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.35);

      &.event-call_log {
        background: rgba(16, 185, 129, 0.18);
        color: #6ee7b7;
        border-color: rgba(16, 185, 129, 0.35);
      }

      &.event-sms_log {
        background: rgba(139, 92, 246, 0.18);
        color: #c4b5fd;
        border-color: rgba(139, 92, 246, 0.35);
      }

      &.event-notification {
        background: rgba(245, 158, 11, 0.18);
        color: #fcd34d;
        border-color: rgba(245, 158, 11, 0.35);
      }
    }

    .tag-source {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
      border: 1px solid var(--border-subtle);
    }

    .card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .data-block {
      background: #090d16;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-md);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .data-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .data-type-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
    }

    .btn-copy-data {
      background: transparent;
      color: var(--text-secondary);
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;

      &:hover {
        color: var(--accent-primary);
        background: rgba(59, 130, 246, 0.15);
      }
    }

    .data-code {
      margin: 0;
      padding: 10px 12px;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.45;
      color: #e2e8f0;
      max-height: 180px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `]
})
export class TileCardComponent {
  readonly item = input.required<MonitorItem>();
  readonly monitorService = inject(MonitorService);
  private readonly toast = inject(ToastService);

  readonly copied = signal<boolean>(false);

  isSelected(): boolean {
    return this.monitorService.selectedIds().has(this.item().id);
  }

  formatDisplayId(id: string): string {
    if (!id) return '';
    return id.length > 10 ? `${id.substring(0, 8)}...` : id;
  }

  displayPayload(): any {
    const it = this.item();
    if (it.payload !== undefined && it.payload !== null) return it.payload;
    if (it.data !== undefined && it.data !== null) return it.data;
    return it;
  }

  isJson(): boolean {
    const raw = this.displayPayload();
    if (typeof raw === 'object') return true;
    if (typeof raw === 'string') {
      const t = raw.trim();
      return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
    }
    return false;
  }

  onCardClick(event: MouseEvent): void {
    this.monitorService.toggleSelectItem(this.item().id);
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.monitorService.deleteItem(this.item().id);
  }

  copyId(event: MouseEvent): void {
    event.stopPropagation();
    navigator.clipboard.writeText(this.item().id);
    this.toast.info('Copied', `ID ${this.item().id} copied`);
  }

  copyData(event: MouseEvent): void {
    event.stopPropagation();
    const payload = this.displayPayload();
    const dataStr = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
    navigator.clipboard.writeText(dataStr);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
