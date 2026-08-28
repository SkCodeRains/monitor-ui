import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from '@shared/ui/toolbar/toolbar.component';
import { TileGridComponent } from '@shared/features/tile-grid/tile-grid.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CommonModule,
    ToolbarComponent,
    TileGridComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent { }
