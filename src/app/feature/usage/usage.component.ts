import { Component, inject, OnInit, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceTabsComponent } from '@shared/ui/device-tabs/device-tabs.component';
import { MonitorService } from '@core/services/monitor.service';
import { DeviceTimelineData, TimelineSessionRecord, AppSwapRecord } from '@model';

@Component({
  selector: 'app-usage-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DeviceTabsComponent, DatePipe],
  templateUrl: './usage.component.html',
  styleUrl: './usage.component.scss'
})
export class UsageComponent implements OnInit {
  readonly monitorService = inject(MonitorService);

  readonly timeline = computed<DeviceTimelineData | null>(() => this.monitorService.timelineData());

  readonly totalScreenTimeFormatted = computed<string>(() => {
    const data = this.timeline();
    if (!data) return '0m';
    const totalSec = data.totalScreenTimeSeconds || 0;
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  });

  readonly totalUnlocks = computed<number>(() => {
    const data = this.timeline();
    return data?.totalUnlocks || data?.sessions?.length || 0;
  });

  readonly longestSessionFormatted = computed<string>(() => {
    const sessions = this.timeline()?.sessions || [];
    if (sessions.length === 0) return '0m';
    const maxSec = Math.max(...sessions.map(s => s.durationSeconds));
    const hours = Math.floor(maxSec / 3600);
    const mins = Math.floor((maxSec % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  });

  readonly topApp = computed<{ name: string; durationFormatted: string } | null>(() => {
    const sessions = this.timeline()?.sessions || [];
    const appMap = new Map<string, number>();

    for (const session of sessions) {
      for (const swap of session.appSwaps) {
        const appName = swap.appName || swap.packageName;
        appMap.set(appName, (appMap.get(appName) || 0) + swap.durationSeconds);
      }
    }

    if (appMap.size === 0) return null;

    let topName = '';
    let maxSec = 0;
    for (const [name, sec] of appMap.entries()) {
      if (sec > maxSec) {
        maxSec = sec;
        topName = name;
      }
    }

    const hours = Math.floor(maxSec / 3600);
    const mins = Math.floor((maxSec % 3600) / 60);
    const formatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return { name: topName, durationFormatted: formatted };
  });

  constructor() {
    effect(() => {
      const dev = this.monitorService.selectedDevice();
      if (dev) {
        this.monitorService.loadTimelineSessions(true);
      }
    });
  }

  ngOnInit(): void {
    this.monitorService.loadTimelineSessions();
  }

  formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  }

  getAppIcon(appName: string, pkg: string): string {
    const combined = `${appName} ${pkg}`.toLowerCase();
    if (combined.includes('whatsapp')) return '💬';
    if (combined.includes('instagram')) return '📸';
    if (combined.includes('youtube')) return '▶️';
    if (combined.includes('chrome') || combined.includes('browser')) return '🌐';
    if (combined.includes('phone') || combined.includes('dialer') || combined.includes('telecom')) return '📞';
    if (combined.includes('msg') || combined.includes('messaging')) return '✉️';
    if (combined.includes('music') || combined.includes('spotify')) return '🎵';
    if (combined.includes('gallery') || combined.includes('photo')) return '🖼️';
    return '📱';
  }
}
