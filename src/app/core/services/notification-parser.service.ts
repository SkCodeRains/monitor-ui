import { Injectable } from '@angular/core';
import {
  MonitorItem,
  NotificationCategory,
  ParsedMessageBubble,
  ParsedNotificationData,
  ParsedSocialLink,
  CallDetails,
  AppNotificationDetails
} from '@model';

@Injectable({
  providedIn: 'root'
})
export class NotificationParserService {
  private idCounter = 0;

  /**
   * Parse a MonitorItem into a rich structured ParsedNotificationData
   */
  parseItem(item: MonitorItem): ParsedNotificationData {
    const rawData = this.extractRawData(item);
    const category = this.detectCategory(item, rawData);
    const title = this.extractTitle(item, rawData);
    const text = this.extractText(item, rawData);
    const packageName = item.packageName || rawData['packageName'];
    const eventType = item.eventType || rawData['eventType'];

    let messages: ParsedMessageBubble[] = [];
    let callDetails: CallDetails | undefined;
    let appDetails: AppNotificationDetails | undefined;

    if (category === 'CALL') {
      callDetails = this.parseCallDetails(text, title, item, rawData);
    } else if (category === 'WHATSAPP') {
      // Check if this WhatsApp notification is actually a voice/video call
      if (
        item.isCall === true ||
        rawData['isCall'] === true ||
        /voice\/video call/i.test(text)
      ) {
        callDetails = this.parseCallDetails(text, title, item, rawData);
      }
      messages = this.parseWhatsAppMessages(text, title);
    } else if (category === 'SMS') {
      messages = this.parseSmsMessages(text, title, rawData);
    } else if (category === 'NOTIFICATION') {
      appDetails = this.parseAppNotification(text, title, item, rawData);
      if (text) {
        messages = [
          {
            id: this.generateBubbleId(),
            sender: title || appDetails.appName,
            text: text,
            links: this.extractSocialLinks(text)
          }
        ];
      }
    } else {
      // General or IoT notification
      if (text) {
        messages = [
          {
            id: this.generateBubbleId(),
            sender: title || 'System',
            text: text,
            links: this.extractSocialLinks(text)
          }
        ];
      }
    }

    return {
      category,
      title,
      packageName,
      eventType,
      isWhatsApp: category === 'WHATSAPP',
      isCall: category === 'CALL' || (callDetails !== undefined),
      isSms: category === 'SMS',
      isAppNotification: category === 'NOTIFICATION',
      callDetails,
      appDetails,
      messages,
      rawText: text
    };
  }

  /**
   * Determine the notification category based on item fields and package name
   */
  detectCategory(item: MonitorItem, rawData: Record<string, any>): NotificationCategory {
    const pkg = (item.packageName || rawData['packageName'] || '').toLowerCase();
    const eventType = (item.eventType || rawData['eventType'] || '').toUpperCase();
    const isWa = item.isWhatsApp ?? rawData['isWhatsApp'];
    const isCall = item.isCall ?? rawData['isCall'];
    const isSms = item.isSms ?? rawData['isSms'];
    const source = (item.source || rawData['source'] || '').toLowerCase();
    const text = this.extractText(item, rawData);

    // 1. Call check takes precedence when explicit
    if (
      isCall === true ||
      eventType === 'CALL' ||
      eventType === 'CALL_LOG' ||
      pkg.includes('server.telecom') ||
      pkg.includes('telecom') ||
      pkg.includes('dialer') ||
      (source.toUpperCase() === 'TELEPHONY' && (rawData['durationSeconds'] !== undefined || rawData['callType'])) ||
      (text && (text.includes('Missed Call') || text.includes('Phone Call') || text.includes('Voice/Video Call')))
    ) {
      return 'CALL';
    }

    // 2. WhatsApp check
    if (
      isWa === true ||
      eventType === 'WHATSAPP' ||
      pkg.includes('com.whatsapp') ||
      pkg.includes('whatsapp') ||
      source.includes('whatsapp')
    ) {
      return 'WHATSAPP';
    }

    // 3. SMS check
    if (
      isSms === true ||
      eventType === 'SMS_RECEIVED' ||
      eventType === 'SMS_LOG' ||
      pkg.includes('com.android.mms') ||
      pkg.includes('mms') ||
      pkg.includes('messaging') ||
      (source.toUpperCase() === 'TELEPHONY' && rawData['sender'] !== undefined)
    ) {
      return 'SMS';
    }

    // 4. App Notification check (Instagram, Browsers, System alerts)
    if (
      eventType === 'NOTIFICATION' ||
      eventType === 'PUSH' ||
      pkg.includes('instagram') ||
      pkg.includes('browser') ||
      source.includes('instagram') ||
      source.includes('browser')
    ) {
      return 'NOTIFICATION';
    }

    return 'OTHER';
  }

  /**
   * Parse bundled WhatsApp text lines into individual message bubbles
   */
  parseWhatsAppMessages(text: string, defaultTitle: string): ParsedMessageBubble[] {
    if (!text || !text.trim()) {
      return [
        {
          id: this.generateBubbleId(),
          sender: defaultTitle || 'WhatsApp',
          text: '',
          links: []
        }
      ];
    }

    const lines = text.split('\n');
    const bubbles: ParsedMessageBubble[] = [];
    let currentBubble: { sender: string; group?: string; lines: string[] } | null = null;

    // Pattern 1: WhatsApp Group/Contact prefix with tilde (~ sender @ Group: message or ~ sender: message)
    const tildePattern = /^~[\s\u202F\u00A0]*([^:@\n]+?)(?:[\s\u202F\u00A0]*@[\s\u202F\u00A0]*([^:\n]+?))?:\s*(.*)$/;

    // Pattern 2: Standard sender prefix (Sender: message)
    const standardPattern = /^([^:\n]{1,60}):\s*(.*)$/;

    for (const line of lines) {
      const tildeMatch = line.match(tildePattern);
      if (tildeMatch) {
        if (currentBubble) {
          bubbles.push(this.createBubbleFromBuffer(currentBubble));
        }
        currentBubble = {
          sender: tildeMatch[1].trim(),
          group: tildeMatch[2] ? tildeMatch[2].trim() : undefined,
          lines: tildeMatch[3] ? [tildeMatch[3]] : []
        };
        continue;
      }

      const standardMatch = line.match(standardPattern);
      if (standardMatch) {
        const potentialSender = standardMatch[1].trim();
        // Disqualify labels, URLs, or non-name phrases
        if (this.isValidSenderName(potentialSender)) {
          if (currentBubble) {
            bubbles.push(this.createBubbleFromBuffer(currentBubble));
          }
          currentBubble = {
            sender: potentialSender,
            lines: standardMatch[2] ? [standardMatch[2]] : []
          };
          continue;
        }
      }

      // If no new sender header, append to current message bubble
      if (currentBubble) {
        currentBubble.lines.push(line);
      } else {
        currentBubble = {
          sender: (defaultTitle && defaultTitle !== 'WhatsApp') ? defaultTitle : 'Sender',
          lines: [line]
        };
      }
    }

    if (currentBubble) {
      bubbles.push(this.createBubbleFromBuffer(currentBubble));
    }

    return bubbles.length > 0
      ? bubbles
      : [
          {
            id: this.generateBubbleId(),
            sender: defaultTitle || 'WhatsApp',
            text: text,
            links: this.extractSocialLinks(text)
          }
        ];
  }

  /**
   * Parse App Notifications such as Instagram, Browser news, etc.
   */
  parseAppNotification(
    text: string,
    title: string,
    item: MonitorItem,
    rawData: Record<string, any>
  ): AppNotificationDetails {
    const pkg = (item.packageName || rawData['packageName'] || item.source || '').toLowerCase();
    let appName = 'App Notification';
    let appIcon: 'instagram' | 'browser' | 'system' | 'generic' = 'generic';

    if (pkg.includes('instagram')) {
      appName = 'Instagram';
      appIcon = 'instagram';
    } else if (pkg.includes('browser') || pkg.includes('chrome') || pkg.includes('firefox')) {
      appName = pkg.includes('vivo') ? 'Vivo Browser' : 'Web Browser';
      appIcon = 'browser';
    } else if (pkg.includes('telecom') || pkg.includes('dialer') || pkg.includes('android')) {
      appName = 'Android System';
      appIcon = 'system';
    }

    // Reaction detection: e.g. Mohammed Shaikh: Reacted ❣️ to your message: "beshak 👍"
    let reaction: { emoji: string; targetMessage?: string } | undefined;
    const reactionMatch = text.match(/Reacted\s+([^\s]+)\s+to your message:\s*\\?"([^\\"]+)\\?"/i)
      || text.match(/Reacted\s+([^\s]+)/i);

    if (reactionMatch) {
      reaction = {
        emoji: reactionMatch[1],
        targetMessage: reactionMatch[2] ? reactionMatch[2].trim() : undefined
      };
    }

    return {
      appName,
      appIcon,
      packageName: item.packageName || rawData['packageName'],
      headline: title,
      summary: text,
      reaction
    };
  }

  /**
   * Parse SMS notification text or payload
   */
  parseSmsMessages(text: string, title: string, rawData: Record<string, any>): ParsedMessageBubble[] {
    if (rawData['message']) {
      const sender = rawData['sender'] || title || 'SMS';
      const msgText = String(rawData['message']);
      return [
        {
          id: this.generateBubbleId(),
          sender,
          text: msgText,
          links: this.extractSocialLinks(msgText)
        }
      ];
    }

    if (!text || !text.trim()) {
      return [
        {
          id: this.generateBubbleId(),
          sender: title || 'SMS Contact',
          text: '',
          links: []
        }
      ];
    }

    const lines = text.split('\n');
    const bubbles: ParsedMessageBubble[] = [];
    const prefixRegex = /^([^:\n]{1,40}):\s*(.*)$/;

    let currentBubble: { sender: string; lines: string[] } | null = null;

    for (const line of lines) {
      const match = line.match(prefixRegex);
      if (match && this.isValidSenderName(match[1].trim())) {
        if (currentBubble) {
          bubbles.push(this.createBubbleFromBuffer(currentBubble));
        }
        currentBubble = {
          sender: match[1].trim(),
          lines: match[2] ? [match[2]] : []
        };
      } else {
        if (currentBubble) {
          currentBubble.lines.push(line);
        } else {
          currentBubble = {
            sender: title || 'SMS',
            lines: [line]
          };
        }
      }
    }

    if (currentBubble) {
      bubbles.push(this.createBubbleFromBuffer(currentBubble));
    }

    return bubbles.length > 0
      ? bubbles
      : [
          {
            id: this.generateBubbleId(),
            sender: title || 'SMS',
            text: text,
            links: this.extractSocialLinks(text)
          }
        ];
  }

  /**
   * Parse phone call information from telecom telemetry or text
   */
  parseCallDetails(
    text: string,
    title: string,
    item: MonitorItem,
    rawData: Record<string, any>
  ): CallDetails {
    let direction: 'INCOMING' | 'OUTGOING' | 'MISSED' | 'UNKNOWN' = 'INCOMING';
    let callerName: string | undefined = rawData['name'] || rawData['caller'];
    let phoneNumber: string | undefined =
      item.phoneNumber || item.number || rawData['phoneNumber'] || rawData['number'];
    let duration: string | undefined;
    let durationSeconds: number | undefined = rawData['durationSeconds'];
    let missedCount: number | undefined;
    let callStatusText: string | undefined;

    const isWhatsAppCall: boolean = Boolean(
      item.isWhatsApp === true ||
      rawData['isWhatsApp'] === true ||
      (item.source && item.source.toLowerCase().includes('whatsapp')) ||
      (item.packageName && item.packageName.toLowerCase().includes('whatsapp')) ||
      (text && text.toLowerCase().includes('whatsapp'))
    );

    if (text) {
      if (/\[?Outgoing Call\]?/i.test(text) || rawData['callType'] === 'OUTGOING') {
        direction = 'OUTGOING';
      } else if (/\[?Missed Call\]?/i.test(text) || rawData['callType'] === 'MISSED') {
        direction = 'MISSED';
        const missedMatch = text.match(/(\d+)\s+missed\s+calls?/i);
        if (missedMatch) {
          missedCount = parseInt(missedMatch[1], 10);
        }
      } else if (/\[?Incoming Call\]?/i.test(text) || /Phone Call/i.test(text) || rawData['callType'] === 'INCOMING') {
        direction = 'INCOMING';
      }

      if (text.includes('On hold')) {
        callStatusText = 'On hold';
      } else if (text.includes('Ringing')) {
        callStatusText = 'Ringing';
      } else if (text.includes('Busy')) {
        callStatusText = 'Busy';
      }

      // Extract Number from text: Number: +91...
      const numMatch = text.match(/Number:\s*([+0-9\s\-()]+)/i);
      if (numMatch && !phoneNumber) {
        phoneNumber = numMatch[1].trim();
      }

      // Extract Caller from text: Caller: Mohammad
      const callerMatch = text.match(/Caller:\s*([^•\n]+)/i);
      if (callerMatch && !callerName) {
        callerName = callerMatch[1].trim();
      }

      // Extract Duration: 30s
      const durMatch = text.match(/Duration:\s*([^•\n]+)/i);
      if (durMatch) {
        duration = durMatch[1].trim();
      }
    }

    // If still missing caller name, parse title (e.g., "Mohammad (+917972914439)")
    if (!callerName && title) {
      const titleMatch = title.match(/^([^(]+)(?:\(([^)]+)\))?/);
      if (titleMatch) {
        callerName = titleMatch[1].trim();
        if (titleMatch[2] && !phoneNumber) {
          phoneNumber = titleMatch[2].trim();
        }
      } else {
        callerName = title;
      }
    }

    if (durationSeconds !== undefined && !duration) {
      duration = this.formatDurationSeconds(durationSeconds);
    }

    return {
      callerName: callerName || 'Unknown Caller',
      phoneNumber,
      duration: duration || (direction === 'MISSED' ? '0s' : undefined),
      durationSeconds,
      direction,
      missedCount,
      callStatusText,
      isWhatsAppCall
    };
  }

  /**
   * Extract social links and clean URL tags
   */
  extractSocialLinks(text: string): ParsedSocialLink[] {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s\n"'>]+)/gi;
    const matches = text.match(urlRegex);
    if (!matches) return [];

    const uniqueUrls = Array.from(new Set(matches));
    return uniqueUrls.map(rawUrl => {
      const cleanUrl = rawUrl.replace(/[.,;:?!)]+$/, '');
      const lower = cleanUrl.toLowerCase();

      let platform: ParsedSocialLink['platform'] = 'web';
      let label = 'Link';

      if (lower.includes('instagram.com')) {
        platform = 'instagram';
        label = lower.includes('/reel/') ? 'Instagram Reel' : 'Instagram';
      } else if (lower.includes('facebook.com') || lower.includes('fb.watch')) {
        platform = 'facebook';
        label = lower.includes('/reel/') || lower.includes('/share/r/') ? 'Facebook Reel' : 'Facebook';
      } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
        platform = 'youtube';
        label = lower.includes('/shorts/') ? 'YouTube Shorts' : 'YouTube';
      } else if (lower.includes('chat.whatsapp.com') || lower.includes('wa.me')) {
        platform = 'whatsapp';
        label = 'WhatsApp Group';
      } else {
        try {
          const host = new URL(cleanUrl).hostname.replace(/^www\./, '');
          label = host;
        } catch {
          label = 'Web Link';
        }
      }

      return {
        url: cleanUrl,
        label,
        platform
      };
    });
  }

  private createBubbleFromBuffer(buffer: { sender: string; group?: string; lines: string[] }): ParsedMessageBubble {
    const rawContent = buffer.lines.join('\n').trim();
    let mediaType: 'photo' | 'sticker' | 'reaction' | 'none' = 'none';
    let mediaLabel: string | undefined;

    if (rawContent.includes('📷') || /sent a photo/i.test(rawContent)) {
      mediaType = 'photo';
      mediaLabel = 'Photo';
    } else if (rawContent.includes('💟') || /sent a sticker/i.test(rawContent)) {
      mediaType = 'sticker';
      mediaLabel = 'Sticker';
    } else if (rawContent.includes('❣️') || /reacted/i.test(rawContent)) {
      mediaType = 'reaction';
      mediaLabel = 'Reaction';
    }

    return {
      id: this.generateBubbleId(),
      sender: buffer.sender,
      group: buffer.group,
      text: rawContent,
      links: this.extractSocialLinks(rawContent),
      mediaType,
      mediaLabel
    };
  }

  private isValidSenderName(str: string): boolean {
    if (!str || str.length > 50) return false;
    const lower = str.toLowerCase();
    const disallowedKeywords = [
      'http',
      'https',
      'number',
      'caller',
      'duration',
      'id',
      'note',
      'link',
      'url',
      'status',
      'warning',
      'error',
      'info',
      'utc'
    ];
    if (disallowedKeywords.includes(lower)) return false;
    if (str.includes('/') || str.includes('\\') || str.includes('?') || str.includes('=')) return false;
    return true;
  }

  private formatDurationSeconds(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  private extractRawData(item: MonitorItem): Record<string, any> {
    const result: Record<string, any> = {};

    const tryParse = (val: any) => {
      if (!val) return;
      if (typeof val === 'object') {
        Object.assign(result, val);
      } else if (typeof val === 'string') {
        const trimmed = val.trim();
        if (
          (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))
        ) {
          try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'object' && parsed !== null) {
              Object.assign(result, parsed);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    };

    tryParse(item.payload);
    tryParse(item.data);

    for (const key of Object.keys(item)) {
      if (key !== 'payload' && key !== 'data') {
        if (item[key] !== undefined && item[key] !== null) {
          result[key] = item[key];
        }
      }
    }

    return result;
  }

  private extractTitle(item: MonitorItem, rawData: Record<string, any>): string {
    return item.title || rawData['title'] || rawData['sender'] || rawData['name'] || item.source || 'Notification';
  }

  private extractText(item: MonitorItem, rawData: Record<string, any>): string {
    if (item.text) return item.text;
    if (rawData['text']) return String(rawData['text']);
    if (rawData['message']) return String(rawData['message']);
    return '';
  }

  private generateBubbleId(): string {
    return `msg_${Date.now()}_${++this.idCounter}`;
  }
}
