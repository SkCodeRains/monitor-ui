import { Component, inject, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceTabsComponent } from '@shared/ui/device-tabs/device-tabs.component';
import { MonitorService } from '@core/services/monitor.service';
import { DeviceTimelineData, TimelineSessionRecord, AppSwapRecord } from '@model';

export type AppCategory = 'Social' | 'Entertainment' | 'Productivity' | 'Communication' | 'System' | 'Other';

export interface CategorySummary {
  category: AppCategory;
  name: string;
  icon: string;
  color: string;
  totalDurationSeconds: number;
  percentageOfTotal: number;
  appsCount: number;
}

export interface AppIntervalRecord {
  startTime: number;
  endTime: number;
  durationSeconds: number;
  count?: number;
}

export interface AppUsageStreak {
  startTime: number;
  endTime: number;
  durationSeconds: number;
  openCount: number;
  timeOfDay: string;
  timeOfDayIcon: string;
}

export interface SessionAppGroup {
  packageName: string;
  appName: string;
  category: AppCategory;
  categoryIcon: string;
  categoryColor: string;
  totalDurationSeconds: number;
  openCount: number;
  firstStartTime: number;
  lastEndTime: number;
  intervals: AppIntervalRecord[];
}

export interface DailyAppTreeItem {
  packageName: string;
  appName: string;
  category: AppCategory;
  categoryIcon: string;
  categoryColor: string;
  totalDurationSeconds: number;
  totalSessionsCount: number;
  totalIntervalsCount: number;
  percentageOfTotal: number;
  streaks: AppUsageStreak[];
  intervals: {
    sessionId: string;
    sessionStartTime: number;
    startTime: number;
    endTime: number;
    durationSeconds: number;
  }[];
}

export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeOfDayInfo(timestamp: number): { label: string; icon: string } {
  const hour = new Date(timestamp).getHours();
  if (hour >= 5 && hour < 12) {
    return { label: 'Morning', icon: '☀️' };
  } else if (hour >= 12 && hour < 17) {
    return { label: 'Afternoon', icon: '🌤️' };
  } else if (hour >= 17 && hour < 21) {
    return { label: 'Evening', icon: '🌆' };
  } else {
    return { label: 'Night', icon: '🌙' };
  }
}

export function classifyAppCategory(appName: string, pkg: string): { category: AppCategory; icon: string; color: string } {
  const s = `${appName} ${pkg}`.toLowerCase();

  // 1. Social
  if (
    s.includes('instagram') || s.includes('whatsapp') || s.includes('telegram') ||
    s.includes('snapchat') || s.includes('facebook') || s.includes('twitter') ||
    s.includes('discord') || s.includes('reddit') || s.includes('tiktok') ||
    s.includes('linkedin') || s.includes('threads') || s.includes('pinterest') ||
    s.includes('messenger')
  ) {
    return { category: 'Social', icon: '💬', color: '#6366f1' }; // Indigo
  }

  // 2. Entertainment & Media
  if (
    s.includes('youtube') || s.includes('netflix') || s.includes('prime') ||
    s.includes('spotify') || s.includes('hotstar') || s.includes('disney') ||
    s.includes('twitch') || s.includes('music') || s.includes('video') ||
    s.includes('media') || s.includes('vlc') || s.includes('game') ||
    s.includes('stream') || s.includes('mx player')
  ) {
    return { category: 'Entertainment', icon: '🍿', color: '#ec4899' }; // Pink
  }

  // 3. Productivity & Work
  if (
    s.includes('chrome') || s.includes('browser') || s.includes('gmail') ||
    s.includes('drive') || s.includes('docs') || s.includes('sheets') ||
    s.includes('slides') || s.includes('teams') || s.includes('slack') ||
    s.includes('outlook') || s.includes('office') || s.includes('notion') ||
    s.includes('keep') || s.includes('notes') || s.includes('zoom') ||
    s.includes('meet') || s.includes('calculator') || s.includes('calendar') ||
    s.includes('word') || s.includes('excel') || s.includes('pdf')
  ) {
    return { category: 'Productivity', icon: '💼', color: '#0ea5e9' }; // Sky Blue
  }

  // 4. Communication
  if (
    s.includes('phone') || s.includes('dialer') || s.includes('contacts') ||
    s.includes('telecom') || s.includes('sms') || s.includes('mms') ||
    s.includes('messaging') || s.includes('truecaller') || s.includes('incallui')
  ) {
    return { category: 'Communication', icon: '📞', color: '#10b981' }; // Emerald
  }

  // 5. System & Tools
  if (
    s.includes('settings') || s.includes('camera') || s.includes('gallery') ||
    s.includes('photos') || s.includes('files') || s.includes('clock') ||
    s.includes('vending') || s.includes('packageinstaller') || s.includes('system') ||
    s.includes('launcher') || s.includes('security')
  ) {
    return { category: 'System', icon: '⚙️', color: '#8b5cf6' }; // Violet
  }

  return { category: 'Other', icon: '📱', color: '#94a3b8' }; // Slate
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

  readonly todayStr = formatLocalDate(new Date());

  readonly selectedDate = computed(() => this.monitorService.selectedTimelineDate());

  readonly isToday = computed(() => this.selectedDate() >= this.todayStr);

  /** View Mode: 'tree' (Tree / Grouped Apps) vs 'flow' (Linear step-by-step stream) */
  readonly viewMode = signal<'tree' | 'flow'>('tree');

  /** Whether the top-level Daily App Tree Breakdown card is expanded */
  readonly showDailyBreakdown = signal<boolean>(true);

  /** Active Category Filter for the Daily App Bar Chart: 'ALL' or specific AppCategory */
  readonly selectedCategoryFilter = signal<AppCategory | 'ALL'>('ALL');

  /** Filter toggle: whether to hide transient launcher and system noise (< 10s) from timeline */
  readonly hideSystemNoise = signal<boolean>(true);

  /** Set of expanded app tree keys for session intervals: "sessionId_packageName" */
  readonly expandedSessionApps = signal<Set<string>>(new Set<string>());

  /** Set of expanded daily app keys: "packageName" */
  readonly expandedDailyApps = signal<Set<string>>(new Set<string>());

  readonly formattedDateLabel = computed(() => {
    const dStr = this.selectedDate();
    if (dStr === this.todayStr) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = formatLocalDate(yesterday);
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
    const newDateStr = formatLocalDate(dt);
    this.monitorService.loadTimelineSessions(false, newDateStr);
  }

  nextDay(): void {
    if (this.isToday()) return;
    const current = this.selectedDate();
    const parts = current.split('-');
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    dt.setDate(dt.getDate() + 1);
    const newDateStr = formatLocalDate(dt);
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
   * Classifies each app into categories (Social, Entertainment, Productivity, etc.)
   */
  readonly dailyAppTree = computed<DailyAppTreeItem[]>(() => {
    const data = this.timeline();
    if (!data || !data.sessions) return [];

    const totalDaySec = data.totalScreenTimeSeconds || 1;
    const appMap = new Map<string, DailyAppTreeItem>();

    const filterNoise = this.hideSystemNoise();
    for (const session of data.sessions) {
      for (const swap of session.appSwaps || []) {
        const pkg = (swap.packageName || '').toLowerCase();
        const isSystemOrLauncher = pkg.includes('launcher') || pkg.includes('permissioncontroller') || pkg.includes('systemui');
        const minDuration = filterNoise ? 10 : 3;
        if (isSystemOrLauncher && swap.durationSeconds < minDuration) continue;

        const key = swap.packageName || swap.appName;
        let item = appMap.get(key);
        if (!item) {
          const catInfo = classifyAppCategory(swap.appName, swap.packageName);
          item = {
            packageName: swap.packageName,
            appName: swap.appName || swap.packageName,
            category: catInfo.category,
            categoryIcon: catInfo.icon,
            categoryColor: catInfo.color,
            totalDurationSeconds: 0,
            totalSessionsCount: 0,
            totalIntervalsCount: 0,
            percentageOfTotal: 0,
            streaks: [],
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
      const sessionIds = new Set(item.intervals.map(i => i.sessionId));
      item.totalSessionsCount = sessionIds.size;
      item.percentageOfTotal = Math.min(100, Math.round((item.totalDurationSeconds / totalDaySec) * 100));

      // Build continuous usage streaks (gap <= 45 seconds merges into one active period)
      const sortedIntervals = [...item.intervals].sort((a, b) => a.startTime - b.startTime);
      const streaks: AppUsageStreak[] = [];

      for (const swap of sortedIntervals) {
        const last = streaks[streaks.length - 1];
        if (last && (swap.startTime - last.endTime) <= 45000) {
          last.endTime = Math.max(last.endTime, swap.endTime);
          last.durationSeconds += swap.durationSeconds;
          last.openCount += 1;
        } else {
          const tod = getTimeOfDayInfo(swap.startTime);
          streaks.push({
            startTime: swap.startTime,
            endTime: swap.endTime,
            durationSeconds: swap.durationSeconds,
            openCount: 1,
            timeOfDay: tod.label,
            timeOfDayIcon: tod.icon
          });
        }
      }

      item.streaks = streaks.sort((a, b) => b.startTime - a.startTime);
      item.intervals.sort((a, b) => b.startTime - a.startTime);
    }

    // Sort by total duration descending
    return items.sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds);
  });

  /**
   * Aggregates daily usage into Categories (Social, Productivity, Entertainment, etc.)
   */
  readonly categorySummaries = computed<CategorySummary[]>(() => {
    const apps = this.dailyAppTree();
    const data = this.timeline();
    const totalDaySec = data?.totalScreenTimeSeconds || 1;

    const catMap = new Map<AppCategory, CategorySummary>();
    const order: AppCategory[] = ['Social', 'Entertainment', 'Productivity', 'Communication', 'System', 'Other'];

    for (const c of order) {
      let icon = '📱';
      let color = '#94a3b8';
      let name: string = c;
      if (c === 'Social') { icon = '💬'; color = '#6366f1'; }
      else if (c === 'Entertainment') { icon = '🍿'; color = '#ec4899'; }
      else if (c === 'Productivity') { icon = '💼'; color = '#0ea5e9'; }
      else if (c === 'Communication') { icon = '📞'; color = '#10b981'; }
      else if (c === 'System') { icon = '⚙️'; color = '#8b5cf6'; }

      catMap.set(c, {
        category: c,
        name,
        icon,
        color,
        totalDurationSeconds: 0,
        percentageOfTotal: 0,
        appsCount: 0
      });
    }

    for (const app of apps) {
      const sum = catMap.get(app.category);
      if (sum) {
        sum.totalDurationSeconds += app.totalDurationSeconds;
        sum.appsCount += 1;
      }
    }

    const list: CategorySummary[] = [];
    for (const c of order) {
      const s = catMap.get(c)!;
      if (s.totalDurationSeconds > 0) {
        s.percentageOfTotal = Math.min(100, Math.round((s.totalDurationSeconds / totalDaySec) * 100));
        list.push(s);
      }
    }

    return list;
  });

  /**
   * Filtered list of daily apps based on selected category filter pill
   */
  readonly filteredDailyApps = computed<DailyAppTreeItem[]>(() => {
    const filter = this.selectedCategoryFilter();
    const all = this.dailyAppTree();
    if (filter === 'ALL') return all;
    return all.filter(a => a.category === filter);
  });

  constructor() {
    effect(() => {
      const dev = this.monitorService.selectedDevice();
      if (dev) {
        this.monitorService.loadTimelineSessions(true);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.monitorService.loadTimelineSessions();
  }

  setCategoryFilter(cat: AppCategory | 'ALL'): void {
    this.selectedCategoryFilter.set(cat);
  }

  /**
   * Helper to retrieve filtered app swaps for linear/flow view
   */
  getFilteredSwaps(session: TimelineSessionRecord): AppSwapRecord[] {
    const filterNoise = this.hideSystemNoise();
    return (session.appSwaps || []).filter(swap => {
      const pkg = (swap.packageName || '').toLowerCase();
      const isSystemOrLauncher = pkg.includes('launcher') || pkg.includes('permissioncontroller') || pkg.includes('systemui');
      const minDuration = filterNoise ? 10 : 3;
      if (isSystemOrLauncher && swap.durationSeconds < minDuration) return false;
      return true;
    });
  }

  /**
   * Helper to group a single session's app swaps by application (Tree Structure).
   */
  getSessionAppGroups(session: TimelineSessionRecord): SessionAppGroup[] {
    const filterNoise = this.hideSystemNoise();
    const validSwaps = (session.appSwaps || []).filter(swap => {
      const pkg = (swap.packageName || '').toLowerCase();
      const isSystemOrLauncher = pkg.includes('launcher') || pkg.includes('permissioncontroller') || pkg.includes('systemui');
      const minDuration = filterNoise ? 10 : 3;
      if (isSystemOrLauncher && swap.durationSeconds < minDuration) return false;
      return true;
    });

    const groupMap = new Map<string, SessionAppGroup>();

    for (const swap of validSwaps) {
      const key = swap.packageName || swap.appName;
      let grp = groupMap.get(key);
      if (!grp) {
        const catInfo = classifyAppCategory(swap.appName, swap.packageName);
        grp = {
          packageName: swap.packageName,
          appName: swap.appName || swap.packageName,
          category: catInfo.category,
          categoryIcon: catInfo.icon,
          categoryColor: catInfo.color,
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

      const lastInt = grp.intervals[grp.intervals.length - 1];
      if (lastInt && (swap.startTime - lastInt.endTime) <= 45000) {
        lastInt.endTime = Math.max(lastInt.endTime, swap.endTime);
        lastInt.durationSeconds += swap.durationSeconds;
        lastInt.count = (lastInt.count || 1) + 1;
      } else {
        grp.intervals.push({
          startTime: swap.startTime,
          endTime: swap.endTime,
          durationSeconds: swap.durationSeconds,
          count: 1
        });
      }
    }

    for (const grp of groupMap.values()) {
      grp.intervals.sort((a, b) => b.startTime - a.startTime);
    }

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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
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
