import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorService } from '@core/services/monitor.service';
import { NotificationCategory } from '@model';

@Component({
  selector: 'app-filter-panel',
  imports: [CommonModule],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss'
})
export class FilterPanelComponent {
  readonly monitorService = inject(MonitorService);

  readonly categories: Array<{
    id: NotificationCategory;
    label: string;
    description: string;
    iconType: 'all' | 'whatsapp' | 'call' | 'sms' | 'notification' | 'other';
  }> = [
    {
      id: 'ALL',
      label: 'All Events',
      description: 'Entire data stream',
      iconType: 'all'
    },
    {
      id: 'WHATSAPP',
      label: 'WhatsApp',
      description: 'Chats & group notifications',
      iconType: 'whatsapp'
    },
    {
      id: 'CALL',
      label: 'Phone Calls',
      description: 'Incoming, outgoing & logs',
      iconType: 'call'
    },
    {
      id: 'SMS',
      label: 'SMS Messages',
      description: 'Incoming text alerts',
      iconType: 'sms'
    },
    {
      id: 'NOTIFICATION',
      label: 'App Alerts',
      description: 'Instagram, Browser & Push',
      iconType: 'notification'
    },
    {
      id: 'OTHER',
      label: 'System & IoT',
      description: 'Sensors & raw payloads',
      iconType: 'other'
    }
  ];

  selectCategory(category: NotificationCategory): void {
    this.monitorService.setCategory(category);
  }

  isCategoryActive(category: NotificationCategory): boolean {
    return this.monitorService.selectedCategory() === category;
  }

  hasActiveFilter(): boolean {
    return this.monitorService.selectedCategory() !== 'ALL' || !!this.monitorService.searchTerm();
  }

  resetAllFilters(): void {
    this.monitorService.resetFilters();
  }
}
