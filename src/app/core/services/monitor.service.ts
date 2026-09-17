import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { MonitorItem, ApiResponse, NotificationCategory } from '@model';
import { ToastService } from './toast.service';
import { TrashService } from './trash.service';
import { AuthService } from './auth.service';
import { NotificationParserService } from './notification-parser.service';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly trash = inject(TrashService);
  private readonly parser = inject(NotificationParserService);
  readonly auth = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  // Primary reactive state using Angular Signals
  readonly items = signal<MonitorItem[]>([]);
  readonly selectedIds = signal<Set<string>>(new Set<string>());
  readonly selectedCategory = signal<NotificationCategory>('ALL');
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly isBackendOnline = signal<boolean>(true);
  readonly lastSynced = signal<Date | null>(null);
  readonly isAutoRefreshEnabled = signal<boolean>(false);
  readonly nowTick = signal<number>(Date.now());
  private pollingTimer: any = null;
  private searchDebounceTimer: any = null;

  // Server-Side Pagination State Signals
  readonly pageSize = signal<number>(25);
  readonly currentPage = signal<number>(1);
  readonly serverTotalItems = signal<number>(0);
  readonly serverTotalPages = signal<number>(1);
  readonly serverCategoryCounts = signal<Record<NotificationCategory, number>>({
    ALL: 0,
    WHATSAPP: 0,
    CALL: 0,
    SMS: 0,
    NOTIFICATION: 0,
    OTHER: 0
  });

  // Computed signals
  readonly totalCount = computed(() => this.serverTotalItems());
  readonly totalPages = computed(() => Math.max(1, this.serverTotalPages()));
  readonly categoryCounts = computed(() => this.serverCategoryCounts());
  readonly selectedCount = computed(() => this.selectedIds().size);

  // Since filtering and pagination occur on the server, filteredItems and paginatedItems
  // map directly to the current page slice returned by the backend
  readonly filteredItems = computed(() => this.items());
  readonly paginatedItems = computed(() => this.items());

  readonly pageRangeText = computed(() => {
    const total = this.serverTotalItems();
    if (total === 0) return '0 of 0';
    const size = this.pageSize();
    const page = this.currentPage();
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return `${start}-${end} of ${total}`;
  });

  readonly isAllSelected = computed(() => {
    const visible = this.paginatedItems();
    if (visible.length === 0) return false;
    const selected = this.selectedIds();
    return visible.every(item => selected.has(item.id));
  });

  readonly isSomeSelected = computed(() => {
    const visible = this.paginatedItems();
    if (visible.length === 0) return false;
    const selected = this.selectedIds();
    const count = visible.filter(item => selected.has(item.id)).length;
    return count > 0 && count < visible.length;
  });

  constructor() {
    // Initial fetch if user is authenticated
    if (this.auth.isAuthenticated()) {
      this.loadItems();
    }

    // Effect: on auth token change, reload items
    effect(() => {
      const token = this.auth.token();
      if (token) {
        this.loadItems(true);
      } else {
        this.items.set([]);
        this.serverTotalItems.set(0);
        this.serverTotalPages.set(1);
      }
    });

    // Reactive 1-second ticker for live timestamp calculations
    setInterval(() => {
      this.nowTick.set(Date.now());
    }, 1000);
  }

  /**
   * Server-Side Pagination Controls
   */
  setPage(page: number): void {
    const total = this.totalPages();
    const clamped = Math.max(1, Math.min(page, total));
    if (clamped !== this.currentPage()) {
      this.currentPage.set(clamped);
      this.loadItems();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadItems();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadItems();
    }
  }

  setPageSize(size: number): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(1);
    this.loadItems();
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.loadItems();
    }, 300);
  }

  setCategory(category: NotificationCategory): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
    this.loadItems();
  }

  resetFilters(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.selectedCategory.set('ALL');
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadItems();
  }

  /**
   * Toggle auto polling interval
   */
  toggleAutoRefresh(): void {
    const next = !this.isAutoRefreshEnabled();
    this.isAutoRefreshEnabled.set(next);
    if (next) {
      this.startPolling();
      this.toast.info('Auto-Sync Active', 'Polling backend every 10 seconds.');
    } else {
      this.stopPolling();
      this.toast.info('Auto-Sync Stopped', 'Switched back to manual refresh.');
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollingTimer = setInterval(() => {
      if (this.auth.isAuthenticated() && !this.isLoading()) {
        this.loadItems(true); // silent background fetch
      }
    }, 10000);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Fetch paginated items from GET /api/data?page=X&limit=Y&category=Z&search=W
   */
  async loadItems(silent = false): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    if (!silent) {
      this.isLoading.set(true);
    }

    try {
      const params: Record<string, string | number> = {
        page: this.currentPage(),
        limit: this.pageSize()
      };

      const category = this.selectedCategory();
      if (category && category !== 'ALL') {
        params['category'] = category;
      }

      const search = this.searchTerm().trim();
      if (search) {
        params['search'] = search;
      }

      const response = await firstValueFrom(
        this.http.get<ApiResponse<MonitorItem[]>>(`${this.apiUrl}/data`, { params })
      );

      if (response && response.success && Array.isArray(response.data)) {
        this.items.set(response.data);
        this.isBackendOnline.set(true);
        this.lastSynced.set(new Date());

        if (response.totalItems !== undefined) {
          this.serverTotalItems.set(response.totalItems);
        }
        if (response.totalPages !== undefined) {
          this.serverTotalPages.set(response.totalPages);
        }
        if (response.categoryCounts) {
          this.serverCategoryCounts.set(response.categoryCounts);
        }

        const validIds = new Set(response.data.map(i => i.id));
        this.selectedIds.update(current => {
          const next = new Set<string>();
          current.forEach(id => {
            if (validIds.has(id)) next.add(id);
          });
          return next;
        });

        if (!silent) {
          this.toast.success('Refreshed', `Loaded page ${response.page || this.currentPage()} (${response.data.length} items, ${response.totalItems ?? response.data.length} total).`);
        }
      }
    } catch (err: any) {
      this.isBackendOnline.set(false);
      console.error('Error fetching items:', err);
      if (!silent) {
        if (err.status === 401 || err.status === 403) {
          this.auth.logout(false);
        } else {
          this.toast.error(
            'Connection Error',
            `Cannot reach backend server at ${this.apiUrl}. Please verify server is running.`
          );
        }
      }
    } finally {
      if (!silent) {
        this.isLoading.set(false);
      }
    }
  }

  /**
   * Post new item to POST /api/data (Public)
   */
  async createItem(dataPayload: any): Promise<boolean> {
    if (dataPayload === undefined || dataPayload === null || (typeof dataPayload === 'string' && dataPayload.trim() === '')) {
      this.toast.warning('Validation', 'Data cannot be empty.');
      return false;
    }

    const bodyToSend = typeof dataPayload === 'object' ? dataPayload : { data: dataPayload };

    this.isSaving.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<MonitorItem>>(`${this.apiUrl}/data`, bodyToSend)
      );

      if (response && response.success && response.item) {
        await this.loadItems(true);
        this.toast.success('Created', 'New event tile added to the stream.');
        this.lastSynced.set(new Date());
        return true;
      } else {
        this.toast.error('Failed', response.message || 'Could not save item.');
        return false;
      }
    } catch (err: any) {
      console.error('Error creating item:', err);
      this.toast.error('Error', err?.error?.error || 'Failed to communicate with server.');
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Delete item by ID via DELETE /api/data/:id
   */
  async deleteItem(id: string): Promise<boolean> {
    const itemToDelete = this.items().find(i => i.id === id);

    try {
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<any>>(`${this.apiUrl}/data/${id}`)
      );

      if (response && response.success) {
        if (itemToDelete) {
          this.trash.moveToTrash(itemToDelete);
        }
        await this.loadItems(true);
        this.selectedIds.update(current => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        this.toast.info('Deleted', `Item removed from server and saved in Trash.`);
        this.lastSynced.set(new Date());
        return true;
      }
      return false;
    } catch (err: any) {
      console.error(`Error deleting item ${id}:`, err);
      if (err.status === 401 || err.status === 403) {
        this.auth.logout(false);
      } else {
        this.toast.error('Delete Failed', err?.error?.error || 'Could not delete item.');
      }
      return false;
    }
  }

  /**
   * Delete all currently selected items
   */
  async deleteSelected(): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    const itemsToDelete = this.items().filter(i => this.selectedIds().has(i.id));

    this.isLoading.set(true);
    let successCount = 0;

    for (const id of ids) {
      try {
        const response = await firstValueFrom(
          this.http.delete<ApiResponse<any>>(`${this.apiUrl}/data/${id}`)
        );
        if (response && response.success) {
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to delete item ${id}:`, err);
      }
    }

    if (itemsToDelete.length > 0) {
      this.trash.moveToTrash(itemsToDelete);
    }

    await this.loadItems(true);
    this.selectedIds.set(new Set());
    this.isLoading.set(false);
    this.toast.success('Bulk Delete', `Deleted ${successCount} selected item(s) and moved to Trash.`);
  }

  /**
   * Delete all items via DELETE /api/data/all
   */
  async deleteAll(): Promise<boolean> {
    const allItems = [...this.items()];
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<any>>(`${this.apiUrl}/data/all`)
      );

      if (response && response.success) {
        if (allItems.length > 0) {
          this.trash.moveToTrash(allItems);
        }
        this.items.set([]);
        this.serverTotalItems.set(0);
        this.serverTotalPages.set(1);
        this.serverCategoryCounts.set({
          ALL: 0,
          WHATSAPP: 0,
          CALL: 0,
          SMS: 0,
          NOTIFICATION: 0,
          OTHER: 0
        });
        this.selectedIds.set(new Set());
        this.toast.warning('Store Cleared', `Deleted all items from server and archived in Trash.`);
        this.lastSynced.set(new Date());
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error clearing data:', err);
      if (err.status === 401 || err.status === 403) {
        this.auth.logout(false);
      } else {
        this.toast.error('Failed', err?.error?.error || 'Could not clear data array.');
      }
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Restore an item from Trash back into the live server array
   */
  async restoreFromTrash(item: MonitorItem): Promise<boolean> {
    const success = await this.createItem(item);
    if (success) {
      this.trash.removeFromTrash(item.id);
      this.toast.success('Restored', `Item restored back to the live server array!`);
      return true;
    }
    return false;
  }

  toggleSelectItem(id: string): void {
    this.selectedIds.update(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleSelectAll(): void {
    const visible = this.paginatedItems();
    const allSelected = this.isAllSelected();

    this.selectedIds.update(current => {
      const next = new Set(current);
      if (allSelected) {
        visible.forEach(item => next.delete(item.id));
      } else {
        visible.forEach(item => next.add(item.id));
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }
}
