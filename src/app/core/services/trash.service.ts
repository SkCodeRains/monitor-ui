import { Injectable, signal, computed, inject } from '@angular/core';
import { MonitorItem } from '@model';
import { ToastService } from './toast.service';

export interface TrashItem extends MonitorItem {
  deletedAt: string;
}

const TRASH_STORAGE_KEY = 'monitor_browser_trash_vault_v1';

@Injectable({
  providedIn: 'root'
})
export class TrashService {
  private readonly toast = inject(ToastService);

  readonly trashItems = signal<TrashItem[]>(this.loadStoredTrash());
  readonly trashCount = computed(() => this.trashItems().length);

  private loadStoredTrash(): TrashItem[] {
    try {
      const stored = localStorage.getItem(TRASH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: TrashItem[]): void {
    try {
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  /**
   * Move one or more items to the browser-local trash vault
   */
  moveToTrash(items: MonitorItem | MonitorItem[]): void {
    const list = Array.isArray(items) ? items : [items];
    if (list.length === 0) return;

    const now = new Date().toISOString();
    const newTrashItems: TrashItem[] = list.map(item => ({
      ...item,
      deletedAt: now
    }));

    this.trashItems.update(current => {
      // Avoid duplicate IDs in trash
      const existingIds = new Set(newTrashItems.map(i => i.id));
      const filteredCurrent = current.filter(i => !existingIds.has(i.id));
      const updated = [...newTrashItems, ...filteredCurrent];
      this.saveToStorage(updated);
      return updated;
    });

    this.toast.info(
      'Moved to Browser Trash',
      `${list.length} item(s) archived in local browser storage.`
    );
  }

  /**
   * Delete item permanently from browser storage
   */
  deletePermanently(id: string): void {
    this.trashItems.update(current => {
      const updated = current.filter(i => i.id !== id);
      this.saveToStorage(updated);
      return updated;
    });
    this.toast.info('Permanently Deleted', 'Item removed from browser trash.');
  }

  /**
   * Empty all items from browser storage
   */
  emptyTrash(): void {
    this.trashItems.set([]);
    localStorage.removeItem(TRASH_STORAGE_KEY);
    this.toast.warning('Trash Emptied', 'All items in local browser trash have been permanently cleared.');
  }

  /**
   * Remove item from trash after restoring
   */
  removeFromTrash(id: string): void {
    this.trashItems.update(current => {
      const updated = current.filter(i => i.id !== id);
      this.saveToStorage(updated);
      return updated;
    });
  }
}
