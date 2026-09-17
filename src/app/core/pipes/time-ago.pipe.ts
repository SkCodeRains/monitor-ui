import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  pure: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | number | Date | undefined, currentTimestamp?: number): string {
    if (!value) return '';

    const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';

    const now = currentTimestamp ? new Date(currentTimestamp) : new Date();
    const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (elapsedSeconds < 3) return 'Just now';

    const seconds = elapsedSeconds % 60;
    const minutes = Math.floor(elapsedSeconds / 60) % 60;
    const hours = Math.floor(elapsedSeconds / 3600) % 24;
    const days = Math.floor(elapsedSeconds / 86400);

    const s = `${seconds}s`;
    const m = `${minutes}m`;
    const h = `${hours}h`;

    if (days > 0) {
      return `${days}d ${h} ${m} ${s} ago`;
    }
    return `${h} ${m} ${s} ago`;
  }
}
