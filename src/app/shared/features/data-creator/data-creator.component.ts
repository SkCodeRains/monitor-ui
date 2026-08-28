import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitorService } from '@core/services/monitor.service';

@Component({
  selector: 'app-data-creator',
  imports: [CommonModule, FormsModule],
  templateUrl: './data-creator.component.html',
  styleUrl: './data-creator.component.scss'
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
