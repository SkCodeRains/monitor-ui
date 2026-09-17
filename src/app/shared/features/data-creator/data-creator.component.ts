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
    packageName: "com.whatsapp",
    title: "WhatsApp",
    text: "Sabdar Bh. khad: 😍\n~ iqbal44in @ कलम-उन्नति व MKN न्यूज़ 🌹139🌹: 🔗 Shahid Iqbal Journalist on Instagram: \"🚨अकोला के फ्लाय ओवर पर दो फोर व्हीलर में भिड़ंत. ट्रैफिक पुलिस निरीक्षक विलास पाटील पहुंच कर दोनों में सुलह कराई\"\n\n👇 Instagram 👇\nhttps://www.instagram.com/reel/DdPoEuYzwzH/?stkn=Y2Rzb2QzMWt4YzA=\n\n👇 Facebook 👇\nhttps://www.facebook.com/share/r/19Xpeouhut/\n\n👇 YouTube Link 👇\nhttps://youtube.com/@inn24newsakola?si=DMBDkT4OV18ET3-a\n~ iqbal44in @ कलम-उन्नति व MKN न्यूज़ 🌹139🌹: 🔗 Shahid Iqbal Journalist: \"🚨सामाजिक कार्यकर्ता आसिफ शाह उर्फ विक्की की पुर्व सांसद से अहम सियासी मुलाकात\"\n\n👇 WhatsApp Group 👇\nhttps://chat.whatsapp.com/sample-group-invite",
    eventType: "WHATSAPP",
    isWhatsApp: true
  }, null, 2);

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  applyPreset(type: 'wa_multi' | 'wa_single' | 'call' | 'sms' | 'iot' | 'plain'): void {
    if (type === 'wa_multi') {
      this.dataContent = JSON.stringify({
        packageName: "com.whatsapp",
        title: "WhatsApp",
        text: "Sabdar Bh. khad: 😍\n~ iqbal44in @ कलम-उन्नति व MKN न्यूज़ 🌹139🌹: 🔗 Shahid Iqbal Journalist on Instagram: \"🚨अकोला के फ्लाय ओवर पर दो फोर व्हीलर में भिड़ंत. ट्रैफिक पुलिस निरीक्षक विलास पाटील पहुंच कर दोनों में सुलह कराई और पुलिस का समय बचाया.\"\n\n👇 Instagram 👇\nhttps://www.instagram.com/reel/DdPoEuYzwzH/?stkn=Y2Rzb2QzMWt4YzA=\n\n👇 Facebook 👇\nhttps://www.facebook.com/share/r/19Xpeouhut/\n\n👇 YouTube Link 👇\nhttps://youtube.com/@inn24newsakola?si=DMBDkT4OV18ET3-a\n~ iqbal44in @ कलम-उन्नति व MKN न्यूज़ 🌹139🌹: 🔗 Shahid Iqbal Journalist: \"🚨सामाजिक कार्यकर्ता आसिफ शाह उर्फ विक्की की पुर्व सांसद इम्तियाज जलील से अहम सियासी मुलाकात\"\n\n👇 WhatsApp Group 👇\nhttps://chat.whatsapp.com/sample-group-link\n~ iqbal44in @ कलम-उन्नति व MKN न्यूज़ 🌹139🌹: 🚨नया बैदपूरा से सफर उमराह के लिए रवाना हो रहे जायरीनों का मोइन खान की और से सत्कार कार्यक्रम का शानदार आयोजन.",
        eventType: "WHATSAPP",
        isWhatsApp: true
      }, null, 2);
    } else if (type === 'wa_single') {
      this.dataContent = JSON.stringify({
        packageName: "com.whatsapp",
        title: "Sabdar Bh. khad",
        text: "Sabdar Bh. khad: 😍",
        eventType: "WHATSAPP",
        isWhatsApp: true
      }, null, 2);
    } else if (type === 'call') {
      this.dataContent = JSON.stringify({
        packageName: "com.android.server.telecom",
        title: "Salim Bh. Dewr (+919823513964)",
        text: "[Outgoing Call] Number: +919823513964 • Caller: Salim Bh. Dewr • Duration: 20s",
        eventType: "CALL",
        phoneNumber: "+919823513964",
        number: "+919823513964",
        isCall: true
      }, null, 2);
    } else if (type === 'sms') {
      this.dataContent = JSON.stringify({
        packageName: "com.android.mms",
        title: "Mohammad",
        text: "Mohammad: ....\nMohammad: Net",
        eventType: "SMS_RECEIVED",
        isSms: true
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
        this.applyPreset('wa_multi');
      }
    } catch {
      await this.monitorService.createItem(this.dataContent);
    }
  }
}
