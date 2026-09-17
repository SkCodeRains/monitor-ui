import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExclusionService } from '@core/services/exclusion.service';
import { ExclusionItem, ExclusionType } from '@model';
import { TimeAgoPipe } from '@core/pipes/time-ago.pipe';

@Component({
  selector: 'app-exclusions-page',
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  templateUrl: './exclusions.component.html',
  styleUrl: './exclusions.component.scss'
})
export class ExclusionsComponent implements OnInit {
  readonly exclusionService = inject(ExclusionService);

  // Form input state
  readonly newType = signal<ExclusionType>('title');
  readonly newValue = signal<string>('');

  // Filter state
  readonly filterType = signal<'ALL' | 'title' | 'package'>('ALL');
  readonly searchQuery = signal<string>('');

  readonly filteredExclusions = computed(() => {
    let items = this.exclusionService.exclusions();
    const type = this.filterType();
    const query = this.searchQuery().trim().toLowerCase();

    if (type !== 'ALL') {
      items = items.filter(i => i.type === type);
    }
    if (query) {
      items = items.filter(i => i.value.toLowerCase().includes(query));
    }
    return items;
  });

  ngOnInit(): void {
    this.exclusionService.loadExclusions(false);
  }

  setType(type: ExclusionType): void {
    this.newType.set(type);
  }

  async onAdd(): Promise<void> {
    const val = this.newValue().trim();
    if (!val) return;
    const ok = await this.exclusionService.addExclusion(this.newType(), val);
    if (ok) {
      this.newValue.set('');
    }
  }

  async onDelete(item: ExclusionItem): Promise<void> {
    const confirmed = confirm('Remove exclusion "  + item.value +  \? Telemetry and notifications from this sender/package will no longer be excluded.');
 if (confirmed) {
 await this.exclusionService.deleteExclusion(item.id);
 }
 }

 setFilter(type: 'ALL' | 'title' | 'package'): void {
 this.filterType.set(type);
 }
}