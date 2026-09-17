import { TestBed } from '@angular/core/testing';
import { NotificationParserService } from './notification-parser.service';
import { MonitorItem } from '@model';

describe('NotificationParserService', () => {
  let service: NotificationParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationParserService]
    });
    service = TestBed.inject(NotificationParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('WhatsApp Multi-Message Parsing', () => {
    it('should separate bundled WhatsApp messages into individual bubbles with senders and groups', () => {
      const rawItem: MonitorItem = {
        id: 'wa-1',
        createdAt: new Date().toISOString(),
        packageName: 'com.whatsapp',
        title: 'WhatsApp',
        text: 'Sabdar Bh. khad: 😍\n~ iqbal44in @ कलम-उन्नति व MKN न्यूज़ 🌹139🌹: 🔗 Shahid Iqbal Journalist on Instagram: "🚨अकोला के फ्लाय ओवर पर दो फोर व्हीलर में भिड़ंत. ट्रैफिक पुलिस निरीक्षक विलास पाटील पहुंच कर दोनों में सुलह कराई"\n\n👇 Instagram 👇\nhttps://www.instagram.com/reel/DdPoEuYzwzH/?stkn=Y2Rzb2QzMWt4YzA=\n\n👇 Facebook 👇\nhttps://www.facebook.com/share/r/19Xpeouhut/\n~ iqbal44in @ कलम-उन्नति व MKN न्यूज़ 🌹139🌹: 🔗 Shahid Iqbal Journalist on Instagram: "🚨सामाजिक कार्यकर्ता आसिफ शाह"\n\n👇 YouTube Link 👇\nhttps://youtube.com/@inn24newsakola?si=DMBDkT4OV18ET3-a',
        eventType: 'WHATSAPP',
        isWhatsApp: true
      };

      const parsed = service.parseItem(rawItem);
      expect(parsed.category).toBe('WHATSAPP');
      expect(parsed.isWhatsApp).toBe(true);
      expect(parsed.messages.length).toBe(3);

      // Bubble 1
      expect(parsed.messages[0].sender).toBe('Sabdar Bh. khad');
      expect(parsed.messages[0].text).toBe('😍');

      // Bubble 2
      expect(parsed.messages[1].sender).toBe('iqbal44in');
      expect(parsed.messages[1].group).toContain('कलम-उन्नति');
      expect(parsed.messages[1].links.length).toBeGreaterThanOrEqual(2);
      expect(parsed.messages[1].links.some(l => l.platform === 'instagram')).toBe(true);
      expect(parsed.messages[1].links.some(l => l.platform === 'facebook')).toBe(true);

      // Bubble 3
      expect(parsed.messages[2].sender).toBe('iqbal44in');
      expect(parsed.messages[2].links.some(l => l.platform === 'youtube')).toBe(true);
    });

    it('should parse single WhatsApp message properly', () => {
      const rawItem: MonitorItem = {
        id: 'wa-2',
        createdAt: new Date().toISOString(),
        packageName: 'com.whatsapp',
        title: 'Sabdar Bh. khad',
        text: 'Sabdar Bh. khad: 😍',
        eventType: 'WHATSAPP',
        isWhatsApp: true
      };

      const parsed = service.parseItem(rawItem);
      expect(parsed.category).toBe('WHATSAPP');
      expect(parsed.messages.length).toBe(1);
      expect(parsed.messages[0].sender).toBe('Sabdar Bh. khad');
      expect(parsed.messages[0].text).toBe('😍');
    });
  });

  describe('Call Parsing', () => {
    it('should parse telecom outgoing call details with caller name, number, and duration', () => {
      const rawItem: MonitorItem = {
        id: 'call-1',
        createdAt: new Date().toISOString(),
        packageName: 'com.android.server.telecom',
        title: 'Salim Bh. Dewr (+919823513964)',
        text: '[Outgoing Call] Number: +919823513964 • Caller: Salim Bh. Dewr • Duration: 20s',
        eventType: 'CALL',
        phoneNumber: '+919823513964',
        number: '+919823513964',
        isCall: true
      };

      const parsed = service.parseItem(rawItem);
      expect(parsed.category).toBe('CALL');
      expect(parsed.isCall).toBe(true);
      expect(parsed.callDetails).toBeDefined();
      expect(parsed.callDetails?.direction).toBe('OUTGOING');
      expect(parsed.callDetails?.callerName).toBe('Salim Bh. Dewr');
      expect(parsed.callDetails?.phoneNumber).toBe('+919823513964');
      expect(parsed.callDetails?.duration).toBe('20s');
    });
  });

  describe('SMS Parsing', () => {
    it('should parse and separate multiple SMS messages from same sender', () => {
      const rawItem: MonitorItem = {
        id: 'sms-1',
        createdAt: new Date().toISOString(),
        packageName: 'com.android.mms',
        title: 'Mohammad',
        text: 'Mohammad: ....\nMohammad: Net',
        eventType: 'SMS_RECEIVED',
        isSms: true
      };

      const parsed = service.parseItem(rawItem);
      expect(parsed.category).toBe('SMS');
      expect(parsed.isSms).toBe(true);
      expect(parsed.messages.length).toBe(2);
      expect(parsed.messages[0].sender).toBe('Mohammad');
      expect(parsed.messages[0].text).toBe('....');
      expect(parsed.messages[1].sender).toBe('Mohammad');
      expect(parsed.messages[1].text).toBe('Net');
    });
  });

  describe('Social Links Extractor', () => {
    it('should extract social platforms and clean URLs', () => {
      const sample = 'Check out https://www.instagram.com/reel/12345/ and join https://chat.whatsapp.com/test';
      const links = service.extractSocialLinks(sample);

      expect(links.length).toBe(2);
      expect(links[0].platform).toBe('instagram');
      expect(links[0].label).toBe('Instagram Reel');
      expect(links[1].platform).toBe('whatsapp');
      expect(links[1].label).toBe('WhatsApp Group');
    });
  });
});
