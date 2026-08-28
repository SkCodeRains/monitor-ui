import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitorService } from '@core/services/monitor.service';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule, FormsModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
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
