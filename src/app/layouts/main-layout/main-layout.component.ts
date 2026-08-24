import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <div class="main-layout">
      <div class="layout-container">
        <!-- Main Top Navigation Header -->
        <app-header />

        <!-- Dynamic Child Content (Dashboard or Trash) -->
        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .main-layout {
      min-height: 100vh;
      padding: 24px 16px;
      display: flex;
      justify-content: center;
    }

    .layout-container {
      width: 100%;
      max-width: 1280px;
      display: flex;
      flex-direction: column;
    }

    .content-area {
      width: 100%;
    }

    @media (max-width: 768px) {
      .main-layout {
        padding: 12px 8px;
      }
    }
  `]
})
export class MainLayoutComponent {}
