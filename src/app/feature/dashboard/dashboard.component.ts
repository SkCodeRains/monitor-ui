import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceTabsComponent } from '@shared/ui/device-tabs/device-tabs.component';
import { ToolbarComponent } from '@shared/ui/toolbar/toolbar.component';
import { FilterPanelComponent } from '@shared/ui/filter-panel/filter-panel.component';
import { TileGridComponent } from '@shared/features/tile-grid/tile-grid.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CommonModule,
    DeviceTabsComponent,
    ToolbarComponent,
    FilterPanelComponent,
    TileGridComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent { }
