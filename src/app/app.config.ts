import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { NgxUiLoaderModule, SPINNER, PB_DIRECTION, NgxUiLoaderConfig } from 'ngx-ui-loader';
import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { loadingInterceptor } from '@core/interceptors/loading.interceptor';

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  bgsColor: '#3b82f6',
  fgsColor: '#3b82f6',
  fgsType: SPINNER.threeStrings,
  fgsSize: 64,
  pbColor: '#3b82f6',
  pbThickness: 3,
  pbDirection: PB_DIRECTION.leftToRight,
  overlayColor: 'rgba(10, 13, 20, 0.78)',
  blur: 8,
  text: 'Syncing system data...',
  textColor: '#93c5fd',
  hasProgressBar: true,
  fastFadeOut: true,
  minTime: 200
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, loadingInterceptor])
    ),
    importProvidersFrom(NgxUiLoaderModule.forRoot(ngxUiLoaderConfig))
  ]
};


