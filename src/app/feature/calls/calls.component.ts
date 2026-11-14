import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceTabsComponent } from '@shared/ui/device-tabs/device-tabs.component';
import { MonitorService } from '@core/services/monitor.service';
import { GroupedCallContact, CallRecord } from '@model';

@Component({
  selector: 'app-calls-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DeviceTabsComponent, DatePipe],
  templateUrl: './calls.component.html',
  styleUrl: './calls.component.scss'
})
export class CallsComponent implements OnInit {
  readonly monitorService = inject(MonitorService);

  readonly expandedKeys = signal<Set<string>>(new Set<string>());
  readonly searchFilter = signal<string>('');
  readonly todayStr = new Date().toISOString().slice(0, 10);

  getYesterdayStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  setDateFilter(date: string): void {
    this.monitorService.callsSelectedDate.set(date);
    this.monitorService.loadGroupedCalls(true);
  }

  clearDateFilter(): void {
    this.monitorService.callsSelectedDate.set('');
    this.monitorService.loadGroupedCalls(true);
  }

  onDateInputChange(eventOrVal: any): void {
    const val = typeof eventOrVal === 'string' ? eventOrVal : eventOrVal?.target?.value;
    if (val) {
      this.setDateFilter(val);
    } else {
      this.clearDateFilter();
    }
  }

  constructor() {
    // Reload calls whenever selected device changes
    effect(() => {
      const dev = this.monitorService.selectedDevice();
      if (dev) {
        this.monitorService.loadGroupedCalls(true);
      }
    });
  }

  ngOnInit(): void {
    this.monitorService.loadGroupedCalls();
  }

  toggleExpand(key: string): void {
    this.expandedKeys.update(current => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  isExpanded(key: string): boolean {
    return this.expandedKeys().has(key);
  }

  onSearchChange(term: string): void {
    this.monitorService.callsSearchTerm.set(term);
    this.monitorService.loadGroupedCalls(true);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getDirectionClass(dir: string): string {
    switch (dir?.toUpperCase()) {
      case 'INCOMING': return 'badge-incoming';
      case 'OUTGOING': return 'badge-outgoing';
      case 'MISSED': return 'badge-missed';
      case 'REJECTED': return 'badge-rejected';
      default: return 'badge-neutral';
    }
  }

  getDirectionIcon(dir: string): string {
    switch (dir?.toUpperCase()) {
      case 'INCOMING': return '↙';
      case 'OUTGOING': return '↗';
      case 'MISSED': return '✕';
      case 'REJECTED': return '⊘';
      default: return '📞';
    }
  }
}
