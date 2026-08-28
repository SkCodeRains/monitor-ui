import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  // Public Login Route
  {
    path: 'login',
    loadComponent: () => import('@feature/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },

  // Authenticated Main Layout Shell with Nested Child Routes
  {
    path: '',
    loadComponent: () => import('@feature/layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('@feature/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'trash',
        loadComponent: () => import('@feature/trash/trash.component').then(m => m.TrashComponent)
      }
    ]
  },

  // Fallback Wildcard
  {
    path: '**',
    redirectTo: ''
  }
];
