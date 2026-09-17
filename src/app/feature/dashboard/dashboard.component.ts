import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataCreatorComponent } from '@shared/features/data-creator/data-creator.component';
import { ToolbarComponent } from '@shared/ui/toolbar/toolbar.component';
import { FilterPanelComponent } from '@shared/ui/filter-panel/filter-panel.component';
import { TileGridComponent } from '@shared/features/tile-grid/tile-grid.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CommonModule,
    ToolbarComponent,
    FilterPanelComponent,
    TileGridComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent { }
