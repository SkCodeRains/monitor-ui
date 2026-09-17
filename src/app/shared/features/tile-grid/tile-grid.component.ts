import { Component, inject, ElementRef, viewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitorService } from '@core/services/monitor.service';
import { TileCardComponent } from '@shared/ui/tile-card/tile-card.component';

@Component({
  selector: 'app-tile-grid',
  imports: [CommonModule, FormsModule, TileCardComponent],
  templateUrl: './tile-grid.component.html',
  styleUrl: './tile-grid.component.scss'
})
export class TileGridComponent {
  readonly monitorService = inject(MonitorService);
  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  readonly pageSizeOptions = [10, 25, 50, 100];

  /**
   * Generates a smart array of page numbers with ellipsis (-1 indicates ellipsis)
   */
  readonly pageNumbers = computed<(number | -1)[]>(() => {
    const total = this.monitorService.totalPages();
    const current = this.monitorService.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | -1)[] = [];
    pages.push(1);

    if (current > 3) {
      pages.push(-1);
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push(-1);
    }

    pages.push(total);
    return pages;
  });

  goToPage(page: number): void {
    if (page < 1 || page > this.monitorService.totalPages()) return;
    this.monitorService.setPage(page);
    this.scrollToTop();
  }

  changePageSize(newSize: number): void {
    this.monitorService.setPageSize(Number(newSize));
    this.scrollToTop();
  }

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
