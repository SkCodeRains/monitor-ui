import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExclusionItem, ExclusionsResponse, ExclusionType } from '@model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ExclusionService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiUrl;

  readonly exclusions = signal<ExclusionItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  readonly titleExclusions = computed(() =>
    this.exclusions().filter(i => i.type === 'title')
  );

  readonly packageExclusions = computed(() =>
    this.exclusions().filter(i => i.type === 'package')
  );

  readonly totalCount = computed(() => this.exclusions().length);

  async loadExclusions(silent = false): Promise<void> {
    if (!silent) {
      this.isLoading.set(true);
    }
    try {
      const response = await firstValueFrom(
        this.http.get<ExclusionsResponse>(this.apiUrl + '/exclusions')
      );
      if (response && response.success && Array.isArray(response.data)) {
        this.exclusions.set(response.data);
        if (!silent) {
          this.toast.success('Exclusions Loaded', 'Retrieved ' + response.data.length + ' active filter rule(s).');
        }
      }
    } catch (err: any) {
      console.error('Failed loading exclusions:', err);
      if (!silent) {
        this.toast.error('Load Failed', err?.error?.error || 'Could not fetch exclusions from server.');
      }
    } finally {
      if (!silent) {
        this.isLoading.set(false);
      }
    }
  }

  async addExclusion(type: ExclusionType, value: string): Promise<boolean> {
    const cleanValue = value.trim();
    if (!cleanValue) {
      this.toast.warning('Validation', 'Exclusion text cannot be empty.');
      return false;
    }

    this.isSaving.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message: string; item: ExclusionItem; isExisting?: boolean }>(
          this.apiUrl + '/exclusions',
          { type, value: cleanValue }
        )
      );

      if (response && response.success) {
        if (response.isExisting) {
          this.toast.info('Already Exists', '"  + cleanValue +  \ is already in the exclusions list.');
 } else {
 this.exclusions.update(current => [response.item, ...current]);
 this.toast.success('Exclusion Added', '\ + cleanValue + \ will now be ignored by all devices.');
 }
 return true;
 }
 return false;
 } catch (err: any) {
 console.error('Failed adding exclusion:', err);
 this.toast.error('Add Failed', err?.error?.error || 'Server error while adding exclusion.');
 return false;
 } finally {
 this.isSaving.set(false);
 }
 }

 async deleteExclusion(id: string): Promise<boolean> {
 const item = this.exclusions().find(i => i.id === id);
 try {
 const response = await firstValueFrom(
 this.http.delete<{ success: boolean; message: string }>(this.apiUrl + '/exclusions/' + id)
 );

 if (response && response.success) {
 this.exclusions.update(current => current.filter(i => i.id !== id));
 this.toast.info('Exclusion Removed', 'Rule \ + (item ? item.value : id) + \ deleted.');
 return true;
 }
 return false;
 } catch (err: any) {
 console.error('Failed deleting exclusion:', err);
 this.toast.error('Delete Failed', err?.error?.error || 'Could not delete exclusion rule.');
 return false;
 }
 }
}