import { Component, inject, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceTabsComponent } from '@shared/ui/device-tabs/device-tabs.component';
import { MonitorService } from '@core/services/monitor.service';
import { DeviceTimelineData, TimelineSessionRecord, AppSwapRecord } from '@model';

export interface AppIntervalRecord {
  startTime: number;
  endTime: number;
  durationSeconds: number;
}

export interface SessionAppGroup {
  packageName: string;
  appName: string;
  totalDurationSeconds: number;
  openCount: number;
  firstStartTime: number;
  lastEndTime: number;
  intervals: AppIntervalRecord[];
}

export interface DailyAppTreeItem {
  packageName: string;
  appName: string;
  totalDurationSeconds: number;
  totalSessionsCount: number;
  totalIntervalsCount: number;
  percentageOfTotal: number;
  intervals: {
    sessionId: string;
    sessionStartTime: number;
    startTime: number;
    endTime: number;
    durationSeconds: number;
  }[];
}

@Component({
  selector: 'app-usage-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DeviceTabsComponent, DatePipe],
  templateUrl: './usage.component.html',
  styleUrl: './usage.component.scss'
})
export class UsageComponent implements OnInit {
  readonly monitorService = inject(MonitorService);

  readonly todayStr = new Date().toISOString().slice(0, 10);

  readonly selectedDate = computed(() => this.monitorService.selectedTimelineDate());

  readonly isToday = computed(() => this.selectedDate() === this.todayStr);

  /** View Mode: 'tree' (Tree / Grouped Apps) vs 'flow' (Linear step-by-step stream) */
  readonly viewMode = signal<'tree' | 'flow'>('tree');

  /** Whether the top-level Daily App Tree Breakdown card is expanded */
  readonly showDailyBreakdown = signal<boolean>(true);

  /** Set of expanded app tree keys for session intervals: "sessionId_packageName" */
  readonly expandedSessionApps = signal<Set<string>>(new Set<string>());

  /** Set of expanded daily app keys: "packageName" */
  readonly expandedDailyApps = signal<Set<string>>(new Set<string>());

  readonly formattedDateLabel = computed(() => {
    const dStr = this.selectedDate();
    if (dStr === this.todayStr) return 'Today';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    if (dStr === yStr) return 'Yesterday';

    const parts = dStr.split('-');
    if (parts.length === 3) {
      const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dStr;
  });

  prevDay(): void {
    const current = this.selectedDate();
    const parts = current.split('-');
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    dt.setDate(dt.getDate() - 1);
    const newDateStr = dt.toISOString().slice(0, 10);
    this.monitorService.loadTimelineSessions(false, newDateStr);
  }

  nextDay(): void {
    if (this.isToday()) return;
    const current = this.selectedDate();
    const parts = current.split('-');
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    dt.setDate(dt.getDate() + 1);
    const newDateStr = dt.toISOString().slice(0, 10);
    this.monitorService.loadTimelineSessions(false, newDateStr);
  }

  goToToday(): void {
    this.monitorService.loadTimelineSessions(false, this.todayStr);
  }

  onDateChange(eventOrValue: any): void {
    const val = typeof eventOrValue === 'string' ? eventOrValue : eventOrValue?.target?.value;
    if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      this.monitorService.loadTimelineSessions(false, val);
    }
  }

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
    const daily = this.dailyAppTree();
    if (!daily || daily.length === 0) return null;
    const top = daily[0];
    const hours = Math.floor(top.totalDurationSeconds / 3600);
    const mins = Math.floor((top.totalDurationSeconds % 3600) / 60);
    const formatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return { name: top.appName, durationFormatted: formatted };
  });

  /**
   * Daily App Usage Tree: Groups all sessions and intervals by application.
   * Shows total daily usage, percentage bar, and expandable session intervals.
   */
  readonly dailyAppTree = computed<DailyAppTreeItem[]>(() => {
    const data = this.timeline();
    if (!data || !data.sessions) return [];

    const totalDaySec = data.totalScreenTimeSeconds || 1;
    const appMap = new Map<string, DailyAppTreeItem>();

    for (const session of data.sessions) {
      for (const swap of session.appSwaps || []) {
        const pkg = (swap.packageName || '').toLowerCase();
        const isTransient = (pkg.includes('launcher') || pkg.includes('permissioncontroller') || pkg.includes('systemui')) && swap.durationSeconds < 3;
        if (isTransient) continue;

        const key = swap.packageName || swap.appName;
        let item = appMap.get(key);
        if (!item) {
          item = {
            packageName: swap.packageName,
            appName: swap.appName || swap.packageName,
            totalDurationSeconds: 0,
            totalSessionsCount: 0,
            totalIntervalsCount: 0,
            percentageOfTotal: 0,
            intervals: []
          };
          appMap.set(key, item);
        }

        item.totalDurationSeconds += swap.durationSeconds;
        item.totalIntervalsCount += 1;
        item.intervals.push({
          sessionId: session.sessionId,
          sessionStartTime: session.startTime,
          startTime: swap.startTime,
          endTime: swap.endTime,
          durationSeconds: swap.durationSeconds
        });
      }
    }

    const items = Array.from(appMap.values());
    for (const item of items) {
      // Count unique sessions this app appeared in
      const sessionIds = new Set(item.intervals.map(i => i.sessionId));
      item.totalSessionsCount = sessionIds.size;
      item.percentageOfTotal = Math.min(100, Math.round((item.totalDurationSeconds / totalDaySec) * 100));
      // Sort intervals newest first
      item.intervals.sort((a, b) => b.startTime - a.startTime);
    }

    // Sort by total duration descending
    return items.sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds);
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

  /**
   * Helper to group a single session's app swaps by application (Tree Structure).
   */
  getSessionAppGroups(session: TimelineSessionRecord): SessionAppGroup[] {
    const validSwaps = (session.appSwaps || []).filter(swap => {
      const pkg = (swap.packageName || '').toLowerCase();
      const isTransient = (pkg.includes('launcher') || pkg.includes('permissioncontroller') || pkg.includes('systemui')) && swap.durationSeconds < 3;
      return !isTransient;
    });

    const groupMap = new Map<string, SessionAppGroup>();

    for (const swap of validSwaps) {
      const key = swap.packageName || swap.appName;
      let grp = groupMap.get(key);
      if (!grp) {
        grp = {
          packageName: swap.packageName,
          appName: swap.appName || swap.packageName,
          totalDurationSeconds: 0,
          openCount: 0,
          firstStartTime: swap.startTime,
          lastEndTime: swap.endTime,
          intervals: []
        };
        groupMap.set(key, grp);
      }

      grp.totalDurationSeconds += swap.durationSeconds;
      grp.openCount += 1;
      grp.lastEndTime = Math.max(grp.lastEndTime, swap.endTime);
      grp.intervals.push({
        startTime: swap.startTime,
        endTime: swap.endTime,
        durationSeconds: swap.durationSeconds
      });
    }

    // Sort intervals inside each app newest first
    for (const grp of groupMap.values()) {
      grp.intervals.sort((a, b) => b.startTime - a.startTime);
    }

    // Sort apps in this session by duration descending
    return Array.from(groupMap.values()).sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds);
  }

  toggleSessionApp(sessionId: string, pkg: string): void {
    const key = `${sessionId}_${pkg}`;
    const next = new Set(this.expandedSessionApps());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expandedSessionApps.set(next);
  }

  isSessionAppExpanded(sessionId: string, pkg: string): boolean {
    return this.expandedSessionApps().has(`${sessionId}_${pkg}`);
  }

  toggleDailyApp(pkg: string): void {
    const next = new Set(this.expandedDailyApps());
    if (next.has(pkg)) {
      next.delete(pkg);
    } else {
      next.add(pkg);
    }
    this.expandedDailyApps.set(next);
  }

  isDailyAppExpanded(pkg: string): boolean {
    return this.expandedDailyApps().has(pkg);
  }

  expandAll(): void {
    const allSessionKeys = new Set<string>();
    for (const session of this.timeline()?.sessions || []) {
      for (const grp of this.getSessionAppGroups(session)) {
        allSessionKeys.add(`${session.sessionId}_${grp.packageName}`);
      }
    }
    this.expandedSessionApps.set(allSessionKeys);

    const allDailyKeys = new Set<string>();
    for (const item of this.dailyAppTree()) {
      allDailyKeys.add(item.packageName);
    }
    this.expandedDailyApps.set(allDailyKeys);
  }

  collapseAll(): void {
    this.expandedSessionApps.set(new Set<string>());
    this.expandedDailyApps.set(new Set<string>());
  }

  toggleViewMode(mode: 'tree' | 'flow'): void {
    this.viewMode.set(mode);
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
    if (combined.includes('settings')) return '⚙️';
    if (combined.includes('camera')) return '📷';
    if (combined.includes('map')) return '🗺️';
    return '📱';
  }
}
