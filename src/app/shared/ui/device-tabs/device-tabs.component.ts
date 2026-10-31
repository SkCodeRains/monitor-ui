import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorService } from '@core/services/monitor.service';
import { Device, AppUsageStat } from '@core/models/monitor-item.model';

@Component({
  selector: 'app-device-tabs',
  imports: [CommonModule],
  templateUrl: './device-tabs.component.html',
  styleUrl: './device-tabs.component.scss'
})
export class DeviceTabsComponent {
  readonly monitorService = inject(MonitorService);
  showAppUsage = false;

  selectDevice(deviceId: string): void {
    this.monitorService.setDevice(deviceId);
  }

  isDeviceActive(deviceId: string): boolean {
    return this.monitorService.selectedDevice() === deviceId;
  }

  getActiveDevice(): Device | undefined {
    const activeId = this.monitorService.selectedDevice();
    return this.monitorService.devices().find(d => d.id === activeId || d.deviceId === activeId);
  }

  toggleAppUsage(): void {
    this.showAppUsage = !this.showAppUsage;
  }

  formatBytes(bytes: number | undefined): string {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return (mb / 1024).toFixed(2) + ' GB';
    }
    return mb.toFixed(1) + ' MB';
  }

  formatLastUpdated(dateStr: string | Date | undefined | null): string {
    if (!dateStr) return 'Awaiting sync';
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }

  formatDuration(ms: number | undefined): string {
    if (!ms || ms <= 0) return '0m';
    const totalMinutes = Math.floor(ms / 60000);
    if (totalMinutes < 1) return '< 1m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  getMaxForegroundMs(apps: AppUsageStat[] | undefined): number {
    if (!apps || apps.length === 0) return 1;
    return Math.max(...apps.map(a => a.foregroundTimeMs || 0), 1);
  }

  getUsagePercent(appMs: number, maxMs: number): number {
    if (!maxMs || maxMs <= 0) return 0;
    return Math.min(100, Math.max(8, Math.round((appMs / maxMs) * 100)));
  }
}
