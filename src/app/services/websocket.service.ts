import { Injectable, signal, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WebSocketEvent<T = any> {
  type: 'INITIAL_STATE' | 'ITEM_ADDED' | 'ITEM_DELETED' | 'ALL_DELETED' | 'AUTH_SUCCESS' | 'AUTH_ERROR' | 'PONG' | 'ERROR' | string;
  data?: T;
  item?: any;
  id?: string;
  totalCount?: number;
  remainingCount?: number;
  deletedCount?: number;
  timestamp?: string;
  [key: string]: any;
}

export type ConnectionState = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'DISCONNECTED';

const TOKEN_STORAGE_KEY = 'monitor_jwt_auth_token';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private readonly baseWsUrl = environment.wsUrl || 'ws://localhost:5000';
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isExplicitlyClosed = false;

  readonly status = signal<ConnectionState>('DISCONNECTED');
  readonly lastPingTime = signal<number | null>(null);
  readonly isWsAuthenticated = signal<boolean>(false);

  private readonly eventSubject = new Subject<WebSocketEvent>();
  readonly events$: Observable<WebSocketEvent> = this.eventSubject.asObservable();

  constructor() {
    this.connect();
  }

  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.status.set(this.socket ? 'RECONNECTING' : 'CONNECTING');

    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const urlWithToken = token ? `${this.baseWsUrl}?token=${encodeURIComponent(token)}` : this.baseWsUrl;

      this.socket = new WebSocket(urlWithToken);

      this.socket.onopen = () => {
        this.status.set('CONNECTED');
        this.startHeartbeat();

        if (token) {
          this.send({ action: 'AUTH', token });
        }
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const parsed: WebSocketEvent = JSON.parse(event.data);
          if (parsed.type === 'PONG') {
            this.lastPingTime.set(Date.now());
          } else if (parsed.type === 'AUTH_SUCCESS') {
            this.isWsAuthenticated.set(true);
            this.eventSubject.next(parsed);
          } else if (parsed.type === 'AUTH_ERROR') {
            this.isWsAuthenticated.set(false);
            this.eventSubject.next(parsed);
          } else {
            this.eventSubject.next(parsed);
          }
        } catch (err) {
          console.warn('[WebSocket] Received non-JSON message:', event.data);
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        this.isWsAuthenticated.set(false);
        if (!this.isExplicitlyClosed) {
          this.status.set('RECONNECTING');
          this.scheduleReconnect();
        } else {
          this.status.set('DISCONNECTED');
        }
      };

      this.socket.onerror = (err) => {
        // Suppress noisy error object when reconnecting
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  /**
   * Authenticate WebSocket with new token
   */
  authenticate(token: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({ action: 'AUTH', token });
    } else if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.connect();
    }
  }

  reconnect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
    this.connect();
  }

  send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      this.send({ action: 'PING' });
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  ngOnDestroy(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.socket) {
      this.socket.close();
    }
  }
}
