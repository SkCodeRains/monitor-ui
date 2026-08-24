import { Injectable, signal } from '@angular/core';
import { ToastMessage } from '../models/monitor-item.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(type: 'success' | 'error' | 'info' | 'warning', title: string, message: string, duration: number = 3500) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message, duration };

    this.toasts.update(current => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(title: string, message: string, duration = 3500) {
    this.show('success', title, message, duration);
  }

  error(title: string, message: string, duration = 4500) {
    this.show('error', title, message, duration);
  }

  info(title: string, message: string, duration = 3000) {
    this.show('info', title, message, duration);
  }

  warning(title: string, message: string, duration = 4000) {
    this.show('warning', title, message, duration);
  }

  dismiss(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
