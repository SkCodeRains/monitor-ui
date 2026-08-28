export interface MonitorItem {
  id: string;
  eventType?: string;
  source?: string;
  timestamp?: number | string;
  payload?: string | any;
  data?: string | any;
  createdAt: string;
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
