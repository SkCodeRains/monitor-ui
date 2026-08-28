import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrashService, TrashItem } from '@core/services/trash.service';
import { MonitorService } from '@core/services/monitor.service';
import { TimeAgoPipe } from '@core/pipes/time-ago.pipe';
import { PrettyJsonPipe } from '@core/pipes/pretty-json.pipe';

@Component({
  selector: 'app-trash-panel',
  imports: [CommonModule, TimeAgoPipe, PrettyJsonPipe],
  templateUrl: './trash-panel.component.html',
  styleUrl: './trash-panel.component.scss'
})
export class TrashPanelComponent {
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
