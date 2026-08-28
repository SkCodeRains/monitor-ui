# 🏛️ Angular Modular Architecture Guide

A production-ready architectural blueprint for modern Angular applications. This structure enforces clean separation of concerns, high reusability, Atomic Design principles, and streamlined TypeScript path aliases.

---

## 📁 1. Project Directory Structure

```
src/app/
├── app.config.ts                      # Application providers & HTTP configuration
├── app.routes.ts                      # Top-level routing definitions
├── app.html                           # Root shell template (<router-outlet />)
├── app.scss                           # Root shell styles
├── app.ts                             # Root AppComponent
│
├── core/                              # SINGLETON / APP-WIDE SINGLE INSTANCES
│   ├── models/                        # TypeScript interfaces, types & enums (Alias: @model)
│   │   ├── index.ts                   # Model barrel export
│   │   ├── auth.model.ts
│   │   └── monitor-item.model.ts
│   ├── services/                      # Singleton business logic & state services
│   │   ├── auth.service.ts
│   │   ├── monitor.service.ts
│   │   ├── toast.service.ts
│   │   └── trash.service.ts
│   ├── guards/                        # Angular route activation guards
│   │   └── auth.guard.ts
│   ├── interceptors/                  # HTTP interceptors (JWT auth, error handlers)
│   │   └── auth.interceptor.ts
│   ├── pipes/                         # Pure, reusable transformation pipes
│   │   ├── pretty-json.pipe.ts
│   │   └── time-ago.pipe.ts
│   └── directives/                    # Custom DOM / attribute directives
│       └── index.ts
│
├── feature/                           # ROUTED FEATURE PAGES & LAYOUT SHELLS
│   ├── layout/                        # Main shell layout with header & router-outlet
│   │   ├── main-layout.component.ts
│   │   ├── main-layout.component.html
│   │   └── main-layout.component.scss
│   ├── dashboard/                     # Primary dashboard page
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.scss
│   ├── login/                         # Authentication login page
│   │   ├── login.component.ts
│   │   ├── login.component.html
│   │   └── login.component.scss
│   └── trash/                         # Trash archive page
│       ├── trash.component.ts
│       ├── trash.component.html
│       └── trash.component.scss
│
└── shared/                            # REUSABLE COMPONENTS & UTILITIES
    ├── ui/                            # Dumb / Presentational (Atoms, Molecules, Organisms)
    │   ├── header/                    # Top navigation & status bar
    │   │   ├── header.component.ts
    │   │   ├── header.component.html
    │   │   └── header.component.scss
    │   ├── toolbar/                   # Actions toolbar (search, bulk select, refresh)
    │   │   ├── toolbar.component.ts
    │   │   ├── toolbar.component.html
    │   │   └── toolbar.component.scss
    │   ├── tile-card/                 # Individual display tile card
    │   │   ├── tile-card.component.ts
    │   │   ├── tile-card.component.html
    │   │   └── tile-card.component.scss
    │   └── toast/                     # Global toast notification container
    │       ├── toast.component.ts
    │       ├── toast.component.html
    │       └── toast.component.scss
    │
    └── features/                      # Reusable Smart Components, Modals & Forms
        ├── data-creator/              # Telemetry post form with JSON validation
        │   ├── data-creator.component.ts
        │   ├── data-creator.component.html
        │   └── data-creator.component.scss
        ├── trash-panel/               # Trash drawer / vault component
        │   ├── trash-panel.component.ts
        │   ├── trash-panel.component.html
        │   └── trash-panel.component.scss
        └── tile-grid/                 # Virtual/Scrollable grid container
            ├── tile-grid.component.ts
            ├── tile-grid.component.html
            └── tile-grid.component.scss
```

---

## 🎯 2. Layer Responsibilities & Guidelines

### 🔵 `core/` (Core Foundation)
- **Purpose**: Singleton services, data models, guards, interceptors, and pipes that are shared across the application.
- **Rule**: Loaded once. Contains application-wide state, API clients, security, and global models.
- **Path Alias**:
  - `@model` -> Points directly to `src/app/core/models/index.ts`
  - `@core/*` -> Points to `src/app/core/*`

### 🟣 `feature/` (Feature Pages / Routing)
- **Purpose**: Components that are directly mounted by the Angular Router (`app.routes.ts`).
- **Rule**: Loaded lazily via `loadComponent: () => import(...)`.
- **Contains**: Page-level containers and shell layouts that assemble shared components.
- **Path Alias**: `@feature/*` -> `src/app/feature/*`

### 🟢 `shared/ui/` (Dumb / Presentational Components)
- **Purpose**: Atomic Design components (Atoms, Molecules, Organisms) whose only job is rendering UI based on inputs and emitting user interactions via outputs.
- **Rule**: Dumb components do not directly trigger API calls or hold business state. They receive inputs (`input()`) and emit events (`output()`).
- **Examples**: Buttons, Badges, Header, Toolbar, Cards, Toast Viewers.

### 🟡 `shared/features/` (Reusable Smart Components / Modals / Forms)
- **Purpose**: Reusable components that contain embedded business logic, reactive form validation, or direct service injections.
- **Rule**: Components that can be dropped into multiple pages/features while managing their own interactive lifecycle (e.g. Creator Dialogs, Filter Drawers, Trash Vaults).
- **Path Alias**: `@shared/*` -> `src/app/shared/*`

---

## ⚙️ 3. TypeScript Path Mapping Setup

Add the following path aliases to your `tsconfig.json` under `compilerOptions`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "preserve",
    "paths": {
      "@model": ["./src/app/core/models/index.ts", "./src/app/core/models"],
      "@model/*": ["./src/app/core/models/*"],
      "@models/*": ["./src/app/core/models/*"],
      "@core/*": ["./src/app/core/*"],
      "@shared/*": ["./src/app/shared/*"],
      "@feature/*": ["./src/app/feature/*"],
      "@env/*": ["./src/environments/*"]
    }
  }
}
```

### Import Examples:
```typescript
// Import models via @model alias:
import { MonitorItem, ApiResponse, UserProfile } from '@model';

// Import services via @core alias:
import { MonitorService } from '@core/services/monitor.service';
import { AuthService } from '@core/services/auth.service';

// Import shared UI components:
import { HeaderComponent } from '@shared/ui/header/header.component';
import { TileCardComponent } from '@shared/ui/tile-card/tile-card.component';

// Import shared feature smart components:
import { TileGridComponent } from '@shared/features/tile-grid/tile-grid.component';
import { DataCreatorComponent } from '@shared/features/data-creator/data-creator.component';
```

---

## 🚀 4. Copy-Paste CLI Commands to Scaffold in Any New Project

Run these commands in PowerShell / Terminal to generate this exact structure with separate `.ts`, `.html`, and `.scss` files:

```bash
# 1. Generate Core Services
ng g s core/services/auth
ng g s core/services/monitor
ng g s core/services/toast
ng g s core/services/trash

# 2. Generate Core Guards & Interceptors
ng g guard core/guards/auth --functional
ng g interceptor core/interceptors/auth --functional

# 3. Generate Core Pipes
ng g pipe core/pipes/time-ago
ng g pipe core/pipes/pretty-json

# 4. Generate Feature Page Components (Separate HTML/SCSS/TS)
ng g c feature/layout/main-layout --style=scss
ng g c feature/login --style=scss
ng g c feature/dashboard --style=scss
ng g c feature/trash --style=scss

# 5. Generate Shared UI (Dumb Components)
ng g c shared/ui/header --style=scss
ng g c shared/ui/toolbar --style=scss
ng g c shared/ui/tile-card --style=scss
ng g c shared/ui/toast --style=scss

# 6. Generate Shared Features (Smart Components / Forms / Modals)
ng g c shared/features/data-creator --style=scss
ng g c shared/features/trash-panel --style=scss
ng g c shared/features/tile-grid --style=scss
```

---

## ⚡ 5. Modern Angular Best Practices

1. **Signals for State Management**:
   - Use `signal<T>()` for writable state.
   - Use `computed(() => ...)` for derived state.
   - Use `input.required<T>()` and `output<T>()` instead of legacy `@Input()` and `@Output()`.

2. **Native Control Flow**:
   - Always use `@if`, `@else`, `@for (item of items; track item.id)`, and `@switch`.
   - Avoid legacy `*ngIf`, `*ngFor`, `*ngSwitch`.

3. **Separation of Files**:
   - Every component has a dedicated `.ts` (logic), `.html` (semantic template), and `.scss` (encapsulated styles) file.

4. **Class & Style Bindings**:
   - Use `[class.active]="isActive()"` or `[class]="dynamicClass"` instead of `ngClass`.
   - Use `[style.width.px]="width()"` instead of `ngStyle`.
