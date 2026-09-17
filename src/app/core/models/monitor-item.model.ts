export type NotificationCategory = 'ALL' | 'WHATSAPP' | 'CALL' | 'SMS' | 'NOTIFICATION' | 'OTHER';

export interface ParsedSocialLink {
  url: string;
  label: string;
  platform: 'instagram' | 'facebook' | 'youtube' | 'whatsapp' | 'web';
}

export interface ParsedMessageBubble {
  id: string;
  sender: string;
  group?: string;
  text: string;
  links: ParsedSocialLink[];
  mediaType?: 'photo' | 'sticker' | 'reaction' | 'none';
  mediaLabel?: string;
}

export interface CallDetails {
  callerName?: string;
  phoneNumber?: string;
  duration?: string;
  durationSeconds?: number;
  direction: 'INCOMING' | 'OUTGOING' | 'MISSED' | 'UNKNOWN';
  missedCount?: number;
  callStatusText?: string;
  isWhatsAppCall?: boolean;
}

export interface AppNotificationDetails {
  appName: string;
  appIcon: 'instagram' | 'browser' | 'system' | 'generic';
  packageName?: string;
  headline?: string;
  summary?: string;
  reaction?: {
    emoji: string;
    targetMessage?: string;
  };
}

export interface ParsedNotificationData {
  category: NotificationCategory;
  title: string;
  packageName?: string;
  eventType?: string;
  isWhatsApp: boolean;
  isCall: boolean;
  isSms: boolean;
  isAppNotification: boolean;
  callDetails?: CallDetails;
  appDetails?: AppNotificationDetails;
  messages: ParsedMessageBubble[];
  rawText?: string;
}

export interface MonitorItem {
  id: string;
  eventType?: string;
  source?: string;
  timestamp?: number | string;
  payload?: string | any;
  data?: string | any;
  createdAt: string;
  packageName?: string;
  title?: string;
  text?: string;
  isWhatsApp?: boolean;
  isCall?: boolean;
  isSms?: boolean;
  phoneNumber?: string;
  number?: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  count?: number;
  data?: T;
  item?: MonitorItem;
  deletedItem?: MonitorItem;
  deletedCount?: number;
  remainingCount?: number;
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  categoryCounts?: Record<NotificationCategory, number>;
  error?: string;
  details?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}
