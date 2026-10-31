import { Injectable, inject, signal, computed } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private readonly ngxUiLoader = inject(NgxUiLoaderService);

  // Reactive state signals
  readonly activeRequests = signal<number>(0);
  readonly isLoading = computed(() => this.activeRequests() > 0);
  readonly message = signal<string>('Syncing system data...');

  // Track active task IDs to prevent duplicate increments or decrements
  private readonly runningTasks = new Set<string>();

  private hasLoader(): boolean {
    return Boolean(this.ngxUiLoader.getLoader());
  }

  /**
   * Manually trigger loader visibility (increments request counter)
   */
  show(message?: string): void {
    if (message) {
      this.message.set(message);
    }
    this.activeRequests.update(count => count + 1);
    if (this.hasLoader()) {
      this.ngxUiLoader.start();
    }
  }

  /**
   * Manually hide loader (decrements request counter safely)
   */
  hide(): void {
    this.activeRequests.update(count => {
      const nextCount = Math.max(0, count - 1);
      if (nextCount === 0 && this.hasLoader()) {
        this.ngxUiLoader.stop();
      }
      return nextCount;
    });
  }

  /**
   * Begin tracking a specific named task (e.g. from an HTTP request)
   */
  startTask(taskId: string, message?: string): void {
    if (this.runningTasks.has(taskId)) {
      return;
    }
    this.runningTasks.add(taskId);
    if (message) {
      this.message.set(message);
    }
    this.activeRequests.update(count => count + 1);
    if (this.hasLoader()) {
      this.ngxUiLoader.start(taskId);
    }
  }

  /**
   * Stop tracking a specific named task (e.g. on HTTP completion or error)
   */
  stopTask(taskId: string): void {
    if (!this.runningTasks.has(taskId)) {
      return;
    }
    this.runningTasks.delete(taskId);
    if (this.hasLoader()) {
      this.ngxUiLoader.stop(taskId);
    }

    this.activeRequests.update(count => {
      const nextCount = Math.max(0, count - 1);
      if (nextCount === 0 && this.hasLoader()) {
        this.ngxUiLoader.stopAll();
      }
      return nextCount;
    });
  }

  /**
   * Reset all counters and force stop all active loader animations
   */
  reset(): void {
    this.runningTasks.clear();
    this.activeRequests.set(0);
    if (this.hasLoader()) {
      this.ngxUiLoader.stopAll();
    }
  }
}

