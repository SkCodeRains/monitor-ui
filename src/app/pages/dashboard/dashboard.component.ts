import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataCreatorComponent } from '../../components/data-creator/data-creator.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { TileGridComponent } from '../../components/tile-grid/tile-grid.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    DataCreatorComponent,
    ToolbarComponent,
    TileGridComponent
  ],
  template: `
    <div class="dashboard-content animate-fade-in">
      <!-- Telemetry Data Creator (POST /api/data) -->
      <app-data-creator />

      <!-- Toolbar (Search, Select All, Delete Selected, Delete All) -->
      <app-toolbar />

      <!-- Live Tiles Grid (Smooth Scrolling & Real-Time Sync) -->
      <app-tile-grid />
    </div>
  `,
  styles: [`
    .dashboard-content {
      width: 100%;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class DashboardComponent {}
