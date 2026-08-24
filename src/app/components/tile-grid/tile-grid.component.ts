import { Component, inject, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorService } from '../../services/monitor.service';
import { TileCardComponent } from '../tile-card/tile-card.component';

@Component({
  selector: 'app-tile-grid',
  standalone: true,
  imports: [CommonModule, TileCardComponent],
  template: `
    <div class="grid-section">
      <!-- Section Meta & Controls -->
      <div class="section-header">
        <div class="header-info">
          <h3 class="section-title">In-Memory Data Tiles</h3>
          <span class="section-counter">
            Showing {{ monitorService.filteredItems().length }} of {{ monitorService.totalCount() }} tiles
          </span>
        </div>

        <div class="scroll-actions">
          <button 
            type="button" 
            class="btn-scroll" 
            (click)="scrollToTop()" 
            title="Smooth scroll to top"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            <span>Top</span>
          </button>

          <button 
            type="button" 
            class="btn-scroll" 
            (click)="scrollToBottom()" 
            title="Smooth scroll to bottom"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span>Bottom</span>
          </button>
        </div>
      </div>

      <!-- Main Scrollable Grid Area -->
      <div #scrollContainer class="scroll-container">
        @if (monitorService.isLoading() && monitorService.items().length === 0) {
          <!-- Loading State -->
          <div class="loading-state glass-panel animate-fade-in">
            <div class="spinner"></div>
            <p>Fetching data from Express array...</p>
          </div>
        } @else if (monitorService.totalCount() === 0) {
          <!-- Empty State (No items in array) -->
          <div class="empty-state glass-panel animate-fade-in">
            <div class="empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <h4 class="empty-title">In-Memory Array is Empty</h4>
            <p class="empty-subtitle">
              No data has been posted to the server yet, or all items were deleted.
            </p>
            <button type="button" class="btn-sample" (click)="addSampleItem()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Sample Tile</span>
            </button>
          </div>
        } @else if (monitorService.filteredItems().length === 0) {
          <!-- No Search Results -->
          <div class="empty-state glass-panel animate-fade-in">
            <div class="empty-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h4 class="empty-title">No Matching Tiles Found</h4>
            <p class="empty-subtitle">
              No items match your filter "{{ monitorService.searchTerm() }}".
            </p>
            <button type="button" class="btn-sample" (click)="monitorService.setSearchTerm('')">
              Clear Filter
            </button>
          </div>
        } @else {
          <!-- Responsive Tiles Grid with Smooth Scrolling -->
          <div class="tiles-grid">
            @for (item of monitorService.filteredItems(); track item.id) {
              <app-tile-card 
                [item]="item" 
                class="animate-fade-in"
              />
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .grid-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 4px;
    }

    .header-info {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .section-counter {
      font-size: 12px;
      color: var(--text-muted);
    }

    .scroll-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-scroll {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 12px;

      &:hover {
        background: rgba(59, 130, 246, 0.15);
        color: #93c5fd;
        border-color: rgba(59, 130, 246, 0.3);
      }
    }

    .scroll-container {
      max-height: calc(100vh - 350px);
      min-height: 380px;
      overflow-y: auto;
      scroll-behavior: smooth;
      padding: 4px 4px 20px 4px;
    }

    .tiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 280px;
      border: 1px dashed var(--border-subtle);
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(59, 130, 246, 0.2);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.04);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .empty-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      max-width: 360px;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .btn-sample {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;

      &:hover {
        background: var(--accent-primary);
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
      }
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class TileGridComponent {
  readonly monitorService = inject(MonitorService);
  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  scrollToTop(): void {
    const el = this.scrollContainer()?.nativeElement;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  scrollToBottom(): void {
    const el = this.scrollContainer()?.nativeElement;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }

  addSampleItem(): void {
    this.monitorService.createItem(JSON.stringify({
      sensor: "demo_monitor_device",
      status: "active",
      timestamp: new Date().toISOString(),
      metrics: {
        cpuUsage: "18.4%",
        memoryUsage: "42.1%",
        temperature: "28.5 C"
      }
    }, null, 2));
  }
}
