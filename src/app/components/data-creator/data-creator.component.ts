import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitorService } from '../../services/monitor.service';

@Component({
  selector: 'app-data-creator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="creator-card glass-panel" [class.expanded]="isExpanded()">
      <div class="creator-header" (click)="toggleExpand()">
        <div class="header-left">
          <div class="icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </div>
          <div>
            <h2 class="creator-title">Post New Event / Data Tile</h2>
            <p class="creator-desc">Send telephony events, notifications, IoT telemetry, or custom JSON to Express</p>
          </div>
        </div>
        <button class="toggle-btn" type="button" [attr.aria-expanded]="isExpanded()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [class.rotate]="isExpanded()">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      @if (isExpanded()) {
        <div class="creator-body animate-fade-in">
          <!-- Preset buttons -->
          <div class="preset-row">
            <span class="preset-label">Event Presets:</span>
            <button type="button" class="preset-btn active-preset" (click)="applyPreset('call_log')">📞 Call Log</button>
            <button type="button" class="preset-btn" (click)="applyPreset('sms_log')">💬 SMS Log</button>
            <button type="button" class="preset-btn" (click)="applyPreset('notification')">🔔 Vault Notification</button>
            <button type="button" class="preset-btn" (click)="applyPreset('iot')">🌡️ IoT Sensor</button>
            <button type="button" class="preset-btn" (click)="applyPreset('plain')">📝 Raw String</button>
          </div>

          <!-- Data Input Editor -->
          <div class="editor-container">
            <textarea
              class="data-textarea"
              [(ngModel)]="dataContent"
              rows="6"
              placeholder='Enter JSON object or data string...'
            ></textarea>
          </div>

          <!-- Creator Actions -->
          <div class="creator-footer">
            <div class="footer-meta">
              @if (isValidJson()) {
                <span class="badge badge-json">Valid JSON Payload</span>
              } @else {
                <span class="badge badge-text">String / Raw Data</span>
              }
              <button type="button" class="btn-format" (click)="formatInput()" [disabled]="!isValidJson()">
                Beautify JSON
              </button>
            </div>

            <div class="footer-buttons">
              <button type="button" class="btn-clear" (click)="clearInput()">Clear</button>
              <button 
                type="button" 
                class="btn-submit" 
                (click)="submitData()" 
                [disabled]="monitorService.isSaving() || !dataContent.trim()"
              >
                @if (monitorService.isSaving()) {
                  <span class="spinner-sm"></span>
                  <span>Posting...</span>
                } @else {
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  <span>Post Event</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .creator-card {
      margin-bottom: 20px;
      padding: 16px 20px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid rgba(59, 130, 246, 0.2);

      &:hover {
        border-color: rgba(59, 130, 246, 0.4);
      }
    }

    .creator-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-badge {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-primary);
    }

    .creator-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .creator-desc {
      font-size: 12px;
      color: var(--text-muted);
    }

    .toggle-btn {
      background: transparent;
      color: var(--text-secondary);
      padding: 6px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-primary);
      }

      svg {
        transition: transform 0.25s ease;
        &.rotate {
          transform: rotate(180deg);
        }
      }
    }

    .creator-body {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-subtle);
    }

    .preset-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .preset-label {
      font-size: 12px;
      color: var(--text-muted);
    }

    .preset-btn {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);

      &:hover {
        background: rgba(59, 130, 246, 0.15);
        color: #93c5fd;
        border-color: rgba(59, 130, 246, 0.3);
      }

      &.active-preset {
        background: rgba(16, 185, 129, 0.15);
        color: #6ee7b7;
        border-color: rgba(16, 185, 129, 0.3);
      }
    }

    .editor-container {
      margin-bottom: 12px;
    }

    .data-textarea {
      width: 100%;
      min-height: 120px;
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.5;
      padding: 12px;
      resize: vertical;
      background: #0d121d;
    }

    .creator-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .footer-meta {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge {
      font-size: 11px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      display: inline-block;

      &.badge-json {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      &.badge-text {
        background: rgba(148, 163, 184, 0.12);
        color: #94a3b8;
        border: 1px solid rgba(148, 163, 184, 0.25);
      }
    }

    .btn-format {
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
      padding: 4px 8px;
      border-radius: var(--radius-sm);

      &:hover:not(:disabled) {
        color: var(--accent-cyan);
        text-decoration: underline;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .footer-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-clear {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      padding: 8px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
      }
    }

    .btn-submit {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--accent-primary);
      color: white;
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);

      &:hover:not(:disabled) {
        background: var(--accent-primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.45);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class DataCreatorComponent {
  readonly monitorService = inject(MonitorService);

  readonly isExpanded = signal<boolean>(true);
  dataContent: string = JSON.stringify({
    id: 3,
    eventType: "CALL_LOG",
    source: "TELEPHONY",
    timestamp: Date.now(),
    payload: JSON.stringify({
      number: "+19876543210",
      name: "Mom",
      durationSeconds: 145,
      callType: "INCOMING"
    })
  }, null, 2);

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  applyPreset(type: 'call_log' | 'sms_log' | 'notification' | 'iot' | 'plain'): void {
    if (type === 'call_log') {
      this.dataContent = JSON.stringify({
        id: Math.floor(Math.random() * 1000 + 1),
        eventType: "CALL_LOG",
        source: "TELEPHONY",
        timestamp: Date.now(),
        payload: JSON.stringify({
          number: "+1" + Math.floor(Math.random() * 9000000000 + 1000000000),
          name: "Mom",
          durationSeconds: Math.floor(Math.random() * 300 + 10),
          callType: "INCOMING"
        })
      }, null, 2);
    } else if (type === 'sms_log') {
      this.dataContent = JSON.stringify({
        id: Math.floor(Math.random() * 1000 + 1),
        eventType: "SMS_LOG",
        source: "TELEPHONY",
        timestamp: Date.now(),
        payload: JSON.stringify({
          sender: "Bank Alert",
          message: "Your OTP is " + Math.floor(Math.random() * 900000 + 100000),
          read: true
        })
      }, null, 2);
    } else if (type === 'notification') {
      this.dataContent = JSON.stringify({
        id: Math.floor(Math.random() * 1000 + 1),
        eventType: "NOTIFICATION",
        source: "VAULT",
        timestamp: Date.now(),
        payload: JSON.stringify({
          packageName: "com.whatsapp",
          title: "New Message",
          text: "Hey, are you free for a call?"
        })
      }, null, 2);
    } else if (type === 'iot') {
      this.dataContent = JSON.stringify({
        sensor: `node_${Math.floor(Math.random() * 900 + 100)}`,
        temperature: +(Math.random() * 15 + 20).toFixed(1),
        humidity: `${Math.floor(Math.random() * 40 + 40)}%`
      }, null, 2);
    } else {
      this.dataContent = `System heartbeat ping - healthy at ${new Date().toLocaleTimeString()}`;
    }
  }

  isValidJson(): boolean {
    const trimmed = this.dataContent.trim();
    if (!trimmed) return false;
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  formatInput(): void {
    try {
      const parsed = JSON.parse(this.dataContent);
      this.dataContent = JSON.stringify(parsed, null, 2);
    } catch {
      // Ignore
    }
  }

  clearInput(): void {
    this.dataContent = '';
  }

  async submitData(): Promise<void> {
    if (!this.dataContent.trim()) return;
    try {
      let payloadToSend: any = this.dataContent;
      if (this.isValidJson()) {
        payloadToSend = JSON.parse(this.dataContent);
      }
      const success = await this.monitorService.createItem(payloadToSend);
      if (success) {
        this.applyPreset('call_log');
      }
    } catch {
      await this.monitorService.createItem(this.dataContent);
    }
  }
}
