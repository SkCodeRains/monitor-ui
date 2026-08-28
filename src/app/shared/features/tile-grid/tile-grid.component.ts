import { Component, inject, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorService } from '@core/services/monitor.service';
import { TileCardComponent } from '@shared/ui/tile-card/tile-card.component';

@Component({
  selector: 'app-tile-grid',
  imports: [CommonModule, TileCardComponent],
  templateUrl: './tile-grid.component.html',
  styleUrl: './tile-grid.component.scss'
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
