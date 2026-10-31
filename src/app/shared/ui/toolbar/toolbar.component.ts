import { Component, inject, signal, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MonitorService } from '@core/services/monitor.service';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  readonly monitorService = inject(MonitorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly searchInput = signal<string>(this.monitorService.searchTerm());
  readonly showConfirmModal = signal<boolean>(false);
  readonly deleteMode = signal<'device' | 'all'>('device');

  constructor() {
    // Keep local searchInput in sync if searchTerm is reset/changed externally (e.g., resetFilters)
    effect(() => {
      const externalTerm = this.monitorService.searchTerm();
      if (this.searchInput() !== externalTerm) {
        this.searchInput.set(externalTerm);
      }
    });

    // Debounce search typing so user can type freely without triggering requests per keystroke
    this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(term => {
        this.monitorService.setSearchTerm(term);
      });
  }

  onSearchInput(value: string): void {
    this.searchInput.set(value);
    this.searchSubject.next(value);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.monitorService.setSearchTerm(this.searchInput());
    }
  }

  clearSearch(): void {
    this.searchInput.set('');
    this.searchSubject.next('');
    this.monitorService.setSearchTerm('');
  }

  onRefresh(): void {
    this.monitorService.loadItems();
  }

  onDeleteSelected(): void {
    this.monitorService.deleteSelected();
  }

  confirmDeleteDevice(): void {
    this.deleteMode.set('device');
    this.showConfirmModal.set(true);
  }

  confirmDeleteAllDevices(): void {
    this.deleteMode.set('all');
    this.showConfirmModal.set(true);
  }

  onDeleteConfirmed(): void {
    this.showConfirmModal.set(false);
    if (this.deleteMode() === 'device') {
      this.monitorService.deleteDeviceData();
    } else {
      this.monitorService.deleteAllDevicesData();
    }
  }
}
