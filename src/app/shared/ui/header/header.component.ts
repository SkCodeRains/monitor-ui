import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MonitorService } from '@core/services/monitor.service';
import { TrashService } from '@core/services/trash.service';
import { AuthService } from '@core/services/auth.service';
import { ExclusionService } from '@core/services/exclusion.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly monitorService = inject(MonitorService);
  readonly trashService = inject(TrashService);
  readonly authService = inject(AuthService);
  readonly exclusionService = inject(ExclusionService);

  onRefresh(): void {
    this.monitorService.loadItems();
    this.exclusionService.loadExclusions(true);
  }
}
