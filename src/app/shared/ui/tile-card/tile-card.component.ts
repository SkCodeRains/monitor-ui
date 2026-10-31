import { Component, input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorItem, ParsedNotificationData, ParsedMessageBubble } from '@model';
import { MonitorService } from '@core/services/monitor.service';
import { NotificationParserService } from '@core/services/notification-parser.service';
import { ToastService } from '@core/services/toast.service';
import { TimeAgoPipe } from '@core/pipes/time-ago.pipe';
import { PrettyJsonPipe } from '@core/pipes/pretty-json.pipe';

@Component({
  selector: 'app-tile-card',
  imports: [CommonModule, TimeAgoPipe, PrettyJsonPipe],
  templateUrl: './tile-card.component.html',
  styleUrl: './tile-card.component.scss'
})
export class TileCardComponent {
  readonly item = input.required<MonitorItem>();
  readonly monitorService = inject(MonitorService);
  private readonly parser = inject(NotificationParserService);
  private readonly toast = inject(ToastService);

  readonly payloadCopied = signal<boolean>(false);
  readonly textCopied = signal<boolean>(false);
  readonly viewMode = signal<'smart' | 'raw'>('smart');
  readonly isExpanded = signal<boolean>(false);
  readonly showJsonDrawer = signal<boolean>(false);

  readonly parsed = computed<ParsedNotificationData>(() => {
    return this.parser.parseItem(this.item());
  });

  isSelected(): boolean {
    return this.monitorService.selectedIds().has(this.item().id);
  }

  formatDisplayId(id: string): string {
    if (!id) return '';
    return id.length > 10 ? `${id.substring(0, 8)}...` : id;
  }

  getDeviceBadge(): string {
    const item = this.item();
    return item.deviceName || item.deviceId || '';
  }

  getDisplayLogId(): string {
    const item = this.item();
    const logId = item.clientLogId || item.id;
    if (logId) {
      const parts = logId.split('_');
      const num = parts.find((p: string) => /^\d{1,7}$/.test(p));
      return num ? `#${num}` : `#${this.formatDisplayId(logId)}`;
    }
    return '';
  }

  getMetadataChips(): { label: string; value: string }[] {
    const chips: { label: string; value: string }[] = [];
    const it = this.item();

    const pkg = it.packageName || it.source;
    if (pkg && pkg !== 'CLIENT' && pkg !== 'TELEPHONY') {
      chips.push({ label: 'pkg', value: pkg });
    }

    const raw = this.displayPayload();
    if (typeof raw === 'object' && raw !== null) {
      if (raw.number || raw.phoneNumber) chips.push({ label: 'Phone', value: String(raw.number || raw.phoneNumber) });
      if (raw.durationSeconds) chips.push({ label: 'Duration', value: `${raw.durationSeconds}s` });
      if (raw.direction) chips.push({ label: 'Dir', value: String(raw.direction) });
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          if (parsed.number || parsed.phoneNumber) chips.push({ label: 'Phone', value: String(parsed.number || parsed.phoneNumber) });
          if (parsed.durationSeconds) chips.push({ label: 'Duration', value: `${parsed.durationSeconds}s` });
          if (parsed.direction) chips.push({ label: 'Dir', value: String(parsed.direction) });
        }
      } catch {
        // ignore
      }
    }

    return chips;
  }

  getFormattedPayload(): string {
    const raw = this.displayPayload();
    if (typeof raw === 'object' && raw !== null) {
      return JSON.stringify(raw, null, 2);
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
      ) {
        try {
          return JSON.stringify(JSON.parse(trimmed), null, 2);
        } catch {
          return raw;
        }
      }
      return raw;
    }
    return JSON.stringify(this.item(), null, 2);
  }

  displayPayload(): any {
    const it = this.item();
    if (it.payload !== undefined && it.payload !== null) return it.payload;
    if (it.data !== undefined && it.data !== null) return it.data;
    return it;
  }

  isJson(): boolean {
    const raw = this.displayPayload();
    if (typeof raw === 'object' && raw !== null) return true;
    if (typeof raw === 'string') {
      const t = raw.trim();
      return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
    }
    return false;
  }

  toggleViewMode(event: MouseEvent): void {
    event.stopPropagation();
    this.viewMode.update(mode => (mode === 'smart' ? 'raw' : 'smart'));
  }

  toggleExpand(event: MouseEvent): void {
    event.stopPropagation();
    this.isExpanded.update(v => !v);
  }

  toggleJsonDrawer(event: MouseEvent): void {
    event.stopPropagation();
    this.showJsonDrawer.update(v => !v);
  }

  onCardClick(event: MouseEvent): void {
    this.monitorService.toggleSelectItem(this.item().id);
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.monitorService.deleteItem(this.item().id);
  }

  copyId(event: MouseEvent): void {
    event.stopPropagation();
    navigator.clipboard.writeText(this.item().id);
    this.toast.info('Copied', `ID ${this.item().id} copied`);
  }

  /**
   * Prominent Copy Payload action with visual feedback and toast notification
   */
  copyPayload(event: MouseEvent): void {
    event.stopPropagation();
    const payloadText = this.getFormattedPayload();
    navigator.clipboard.writeText(payloadText);
    this.payloadCopied.set(true);
    this.toast.success('Payload Copied', 'Full JSON payload copied to clipboard');
    setTimeout(() => this.payloadCopied.set(false), 2200);
  }

  copyText(event: MouseEvent, text: string, label = 'Text'): void {
    event.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.toast.info('Copied', `${label} copied to clipboard`);
  }

  openExternalLink(event: MouseEvent, url: string): void {
    event.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  getEventTime(): string | number | Date {
    const item = this.item();
    if (item.timestamp !== undefined && item.timestamp !== null) {
      const num = Number(item.timestamp);
      return !isNaN(num) && num > 0 ? num : item.timestamp;
    }
    return item.createdAt;
  }

  formatExactTime(dateVal: string | number | Date | undefined): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  formatFullDateTime(dateVal: string | number | Date | undefined): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  getAppBadgeInfo(): { label: string; icon: string; brandClass: string } {
    const p = this.parsed();
    const pkg = (p.packageName || this.item().source || '').toLowerCase();

    if (p.category === 'WHATSAPP') {
      return { label: 'WhatsApp', icon: 'whatsapp', brandClass: 'brand-whatsapp' };
    }
    if (p.category === 'CALL') {
      if (p.callDetails?.isWhatsAppCall) {
        return { label: 'WhatsApp Call', icon: 'whatsapp-call', brandClass: 'brand-whatsapp' };
      }
      if (pkg.includes('dialer')) {
        return { label: 'Phone Dialer', icon: 'call', brandClass: 'brand-call' };
      }
      return { label: 'Telecom', icon: 'call', brandClass: 'brand-call' };
    }
    if (p.category === 'NOTIFICATION') {
      if (pkg.includes('instagram')) {
        return { label: 'Instagram', icon: 'instagram', brandClass: 'brand-instagram' };
      }
      if (pkg.includes('browser')) {
        return { label: p.appDetails?.appName || 'Browser', icon: 'browser', brandClass: 'brand-browser' };
      }
      return { label: p.appDetails?.appName || 'App Alert', icon: 'notification', brandClass: 'brand-notification' };
    }
    if (p.category === 'SMS') {
      return { label: 'SMS Alert', icon: 'sms', brandClass: 'brand-sms' };
    }
    return { label: this.item().source || 'Telemetry', icon: 'telemetry', brandClass: 'brand-other' };
  }

  getSenderInitials(sender: string): string {
    if (!sender) return '?';
    const clean = sender.replace(/[~@🌹#\-_]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  getSenderColor(sender: string): string {
    if (!sender) return '#3b82f6';
    const palette = [
      '#10b981', // emerald
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f59e0b', // amber
      '#14b8a6', // teal
      '#6366f1'  // indigo
    ];
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash = sender.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palette.length;
    return palette[index];
  }
}
