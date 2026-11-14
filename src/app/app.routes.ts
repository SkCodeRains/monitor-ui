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
        path: 'calls',
        loadComponent: () => import('@feature/calls/calls.component').then(m => m.CallsComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('@feature/messages/messages.component').then(m => m.MessagesComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('@feature/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'usage',
        loadComponent: () => import('@feature/usage/usage.component').then(m => m.UsageComponent)
      },
      {
        path: 'trash',
        loadComponent: () => import('@feature/trash/trash.component').then(m => m.TrashComponent)
      },
      {
        path: 'exclusions',
        loadComponent: () => import('@feature/exclusions/exclusions.component').then(m => m.ExclusionsComponent)
      }
    ]
  },

  // Fallback Wildcard
  {
    path: '**',
    redirectTo: ''
  }
];
