import { Component, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorItem } from '@model';
import { MonitorService } from '@core/services/monitor.service';
import { ToastService } from '@core/services/toast.service';
import { TimeAgoPipe } from '@core/pipes/time-ago.pipe';
import { PrettyJsonPipe } from '@core/pipes/pretty-json.pipe';

@Component({
  selector: 'app-tile-card',
  imports: [CommonModule, TimeAgoPipe, PrettyJsonPipe],
  templateUrl: './tile-card.component.html',
  styleUrl: './tile-card.component.scss'
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
