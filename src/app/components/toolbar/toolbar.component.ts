import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitorService } from '../../services/monitor.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="toolbar glass-panel">
      <!-- Left side: Select all & Bulk actions -->
      <div class="toolbar-left">
        <label class="checkbox-container" title="Select / Deselect all visible items">
          <input 
            type="checkbox" 
            [checked]="monitorService.isAllSelected()"
            [indeterminate]="monitorService.isSomeSelected()"
            (change)="monitorService.toggleSelectAll()"
            [disabled]="monitorService.filteredItems().length === 0"
          >
          <span class="checkmark"></span>
          <span class="checkbox-label">
            {{ monitorService.isAllSelected() ? 'Deselect All' : 'Select All' }}
          </span>
        </label>

        @if (monitorService.selectedCount() > 0) {
          <div class="selection-pill animate-fade-in">
            <span class="count">{{ monitorService.selectedCount() }}</span> selected
          </div>

          <button 
            type="button" 
            class="btn-action btn-delete-selected animate-fade-in"
            (click)="onDeleteSelected()"
            [disabled]="monitorService.isLoading()"
            title="Delete all checked items"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete Selected ({{ monitorService.selectedCount() }})</span>
          </button>
        }
      </div>

      <!-- Right side: Refresh, Auto-Sync, Search & Delete All -->
      <div class="toolbar-right">
        <!-- Manual Refresh Button -->
        <button 
          type="button" 
          class="btn-action btn-refresh"
          (click)="onRefresh()"
          [disabled]="monitorService.isLoading()"
          title="Refresh / Fetch latest telemetry data from server"
        >
          <svg [class.spin]="monitorService.isLoading()" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          <span>{{ monitorService.isLoading() ? 'Refreshing...' : 'Refresh' }}</span>
        </button>

        <!-- 1s Auto-Polling Toggle -->
        <button 
          type="button" 
          class="btn-action btn-auto-refresh"
          [class.active]="monitorService.isAutoRefreshEnabled()"
          (click)="monitorService.toggleAutoRefresh()"
          title="Toggle 1-second background auto-polling"
        >
          <span class="live-indicator" [class.pulse]="monitorService.isAutoRefreshEnabled()"></span>
          <span>Auto (1s)</span>
        </button>

        <!-- Filter Search Box -->
        <div class="search-box">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Filter tiles by ID or content..."
            [ngModel]="monitorService.searchTerm()"
            (ngModelChange)="monitorService.setSearchTerm($event)"
          >
          @if (monitorService.searchTerm()) {
            <button type="button" class="btn-clear-search" (click)="monitorService.setSearchTerm('')">
              &times;
            </button>
          }
        </div>

        <!-- Delete All Button -->
        <button 
          type="button" 
          class="btn-action btn-delete-all"
          (click)="confirmDeleteAll()"
          [disabled]="monitorService.totalCount() === 0 || monitorService.isLoading()"
          title="Clear all stored items from server array"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"></path>
          </svg>
          <span>Delete All</span>
        </button>
      </div>
    </div>


    <!-- Confirm Delete All Modal -->
    @if (showConfirmModal()) {
      <div class="modal-overlay animate-fade-in" (click)="showConfirmModal.set(false)">
        <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-icon danger">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3 class="modal-title">Delete All Items?</h3>
          <p class="modal-desc">
            This will permanently remove all <strong>{{ monitorService.totalCount() }}</strong> item(s) from the server's static in-memory array.
          </p>
          <div class="modal-buttons">
            <button type="button" class="btn-modal btn-cancel" (click)="showConfirmModal.set(false)">Cancel</button>
            <button type="button" class="btn-modal btn-danger" (click)="onDeleteAllConfirmed()">
              Yes, Delete All
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      margin-bottom: 20px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .toolbar-left, .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* Modern Custom Checkbox */
    .checkbox-container {
      display: inline-flex;
      align-items: center;
      position: relative;
      cursor: pointer;
      user-select: none;
      gap: 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);

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
        background-color: #131a29;
        border: 1.5px solid var(--border-subtle);
        border-radius: 4px;
        transition: all 0.2s ease;
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

      input:indeterminate ~ .checkmark {
        background-color: var(--accent-primary);
        border-color: var(--accent-primary);
      }

      input:indeterminate ~ .checkmark::after {
        content: "";
        width: 8px;
        height: 2px;
        background: white;
      }
    }

    .selection-pill {
      font-size: 12px;
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(59, 130, 246, 0.3);
      .count {
        font-weight: 700;
        color: white;
      }
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;

      .search-icon {
        position: absolute;
        left: 10px;
        color: var(--text-muted);
        pointer-events: none;
      }

      input {
        padding-left: 32px;
        padding-right: 28px;
        width: 240px;
        height: 36px;
        font-size: 13px;

        &:focus {
          width: 280px;
        }
      }

      .btn-clear-search {
        position: absolute;
        right: 8px;
        background: transparent;
        color: var(--text-muted);
        font-size: 16px;
        line-height: 1;

        &:hover {
          color: var(--text-primary);
        }
      }
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .btn-refresh {
      background: rgba(59, 130, 246, 0.12);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.3);

      &:hover:not(:disabled) {
        background: rgba(59, 130, 246, 0.25);
        color: white;
        border-color: var(--accent-primary);
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.35);
      }
    }

    .btn-auto-refresh {
      background: rgba(16, 185, 129, 0.1);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.25);

      &.active {
        background: rgba(16, 185, 129, 0.25);
        color: #a7f3d0;
        border-color: #10b981;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
      }

      &:hover {
        background: rgba(16, 185, 129, 0.2);
        color: white;
      }
    }

    .live-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #64748b;
      transition: all 0.3s ease;

      &.pulse {
        background: #10b981;
        box-shadow: 0 0 8px #10b981;
        animation: livePulse 1.5s infinite;
      }
    }

    @keyframes livePulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }

    .spin {
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .btn-delete-selected {
      background: rgba(244, 63, 94, 0.15);
      color: #fda4af;
      border: 1px solid rgba(244, 63, 94, 0.35);

      &:hover:not(:disabled) {
        background: rgba(244, 63, 94, 0.25);
        color: white;
        box-shadow: var(--shadow-danger-glow);
      }
    }

    .btn-delete-all {
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);

      &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.25);
        color: white;
        border-color: var(--accent-rose);
      }
    }

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 420px;
      padding: 24px;
      background: #111726;
      border: 1px solid rgba(244, 63, 94, 0.3);
      box-shadow: var(--shadow-lg), var(--shadow-danger-glow);
      text-align: center;
    }

    .modal-icon.danger {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(244, 63, 94, 0.15);
      color: var(--accent-rose);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .modal-desc {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .modal-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .btn-modal {
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 600;
    }

    .btn-cancel {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-secondary);

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: var(--text-primary);
      }
    }

    .btn-danger {
      background: var(--accent-rose);
      color: white;

      &:hover {
        background: var(--accent-rose-hover);
        box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4);
      }
    }
  `]
})
export class ToolbarComponent {
  readonly monitorService = inject(MonitorService);
  readonly showConfirmModal = signal<boolean>(false);

  onRefresh(): void {
    this.monitorService.loadItems();
  }

  onDeleteSelected(): void {
    this.monitorService.deleteSelected();
  }

  confirmDeleteAll(): void {
    this.showConfirmModal.set(true);
  }

  onDeleteAllConfirmed(): void {
    this.showConfirmModal.set(false);
    this.monitorService.deleteAll();
  }
}

