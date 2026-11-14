import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceTabsComponent } from '@shared/ui/device-tabs/device-tabs.component';
import { MonitorService } from '@core/services/monitor.service';
import { MonitorItem } from '@model';

export type AppFilterType = 'ALL' | 'WHATSAPP' | 'INSTAGRAM' | 'GMAIL' | 'SYSTEM' | 'OTHER';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DeviceTabsComponent, DatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  readonly monitorService = inject(MonitorService);

  readonly selectedAppFilter = signal<AppFilterType>('ALL');
  readonly localSearchTerm = signal<string>('');

  constructor() {
    effect(() => {
      const dev = this.monitorService.selectedDevice();
      if (dev) {
        // Set category to NOTIFICATION or ALL and reload
        this.monitorService.selectedCategory.set('NOTIFICATION');
        this.monitorService.loadItems(true);
      }
    });
  }

  ngOnInit(): void {
    this.monitorService.selectedCategory.set('NOTIFICATION');
    this.monitorService.loadItems();
  }

  setFilter(filter: AppFilterType): void {
    this.selectedAppFilter.set(filter);
  }

  readonly filteredNotifications = computed<MonitorItem[]>(() => {
    const rawItems = this.monitorService.items();
    const filter = this.selectedAppFilter();
    const search = this.localSearchTerm().toLowerCase().trim();

    return rawItems.filter(item => {
      // Exclude pure call logs and pure SMS from this notification feed
      const isCall = /call|dialer|telecom/i.test(item.eventType || '') || /call/i.test(item.source || '');
      const isSms = /sms|mms|messaging/i.test(item.eventType || '') || /messaging/i.test(item.source || '');
      if (isCall || isSms) return false;

      const pkg = (item.payload?.packageName || item.source || '').toLowerCase();
      const combinedText = `${item.title || ''} ${item.text || ''} ${pkg}`.toLowerCase();

      // App Filter
      if (filter === 'WHATSAPP' && !pkg.includes('whatsapp') && !combinedText.includes('whatsapp')) return false;
      if (filter === 'INSTAGRAM' && !pkg.includes('instagram') && !combinedText.includes('instagram')) return false;
      if (filter === 'GMAIL' && !pkg.includes('gm') && !pkg.includes('gmail') && !combinedText.includes('gmail')) return false;
      if (filter === 'SYSTEM' && !pkg.includes('system') && !pkg.includes('android')) return false;
      if (filter === 'OTHER') {
        if (pkg.includes('whatsapp') || pkg.includes('instagram') || pkg.includes('gmail')) return false;
      }

      // Search filter
      if (search && !combinedText.includes(search)) return false;

      return true;
    });
  });

  getAppBadge(item: MonitorItem): { name: string; iconClass: string } {
    const pkg = (item.payload?.packageName || item.source || '').toLowerCase();
    const combined = `${item.title || ''} ${item.text || ''}`.toLowerCase();

    if (pkg.includes('whatsapp') || combined.includes('whatsapp')) {
      return { name: 'WhatsApp', iconClass: 'icon-whatsapp' };
    }
    if (pkg.includes('instagram') || combined.includes('instagram')) {
      return { name: 'Instagram', iconClass: 'icon-instagram' };
    }
    if (pkg.includes('gm') || pkg.includes('gmail') || combined.includes('gmail')) {
      return { name: 'Gmail', iconClass: 'icon-gmail' };
    }
    if (pkg.includes('youtube') || combined.includes('youtube')) {
      return { name: 'YouTube', iconClass: 'icon-youtube' };
    }
    if (pkg.includes('system') || pkg.includes('android')) {
      return { name: 'System Alert', iconClass: 'icon-system' };
    }
    return { name: item.source || 'App Notification', iconClass: 'icon-generic' };
  }
}
