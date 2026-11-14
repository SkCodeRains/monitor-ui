import { Component, inject, OnInit, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceTabsComponent } from '@shared/ui/device-tabs/device-tabs.component';
import { MonitorService } from '@core/services/monitor.service';
import { MessageThread, SmsMessage } from '@model';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DeviceTabsComponent, DatePipe],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit {
  readonly monitorService = inject(MonitorService);

  readonly todayStr = new Date().toISOString().slice(0, 10);

  getYesterdayStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  setDateFilter(date: string): void {
    this.monitorService.messagesSelectedDate.set(date);
    this.monitorService.loadGroupedMessages(true);
  }

  clearDateFilter(): void {
    this.monitorService.messagesSelectedDate.set('');
    this.monitorService.loadGroupedMessages(true);
  }

  onDateInputChange(eventOrVal: any): void {
    const val = typeof eventOrVal === 'string' ? eventOrVal : eventOrVal?.target?.value;
    if (val) {
      this.setDateFilter(val);
    } else {
      this.clearDateFilter();
    }
  }

  readonly activeThread = computed<MessageThread | null>(() => {
    const threadId = this.monitorService.selectedThreadId();
    const threads = this.monitorService.messageThreads();
    if (!threadId) return threads.length > 0 ? threads[0] : null;
    return threads.find(t => t.threadId === threadId) || (threads.length > 0 ? threads[0] : null);
  });

  constructor() {
    effect(() => {
      const dev = this.monitorService.selectedDevice();
      if (dev) {
        this.monitorService.loadGroupedMessages(true);
      }
    });
  }

  ngOnInit(): void {
    this.monitorService.loadGroupedMessages();
  }

  selectThread(threadId: string): void {
    this.monitorService.selectedThreadId.set(threadId);
  }

  onSearchChange(term: string): void {
    this.monitorService.messagesSearchTerm.set(term);
    this.monitorService.loadGroupedMessages(true);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
