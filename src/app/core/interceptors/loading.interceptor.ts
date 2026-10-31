import { HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

/**
 * Context token to bypass the loading indicator for background / silent requests
 */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

/**
 * Context token to customize the loading message for specific requests
 */
export const LOADER_MESSAGE = new HttpContextToken<string>(() => '');

/**
 * Smart HTTP Interceptor that tracks in-flight API requests, increments/decrements
 * the active request count, and coordinates the ngx loader indicator.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);

  // Check if loader should be bypassed via context or custom header
  const shouldSkipContext = req.context.get(SKIP_LOADER);
  const shouldSkipHeader = req.headers.has('x-skip-loader');

  if (shouldSkipContext || shouldSkipHeader) {
    // If skipped via header, remove header before forwarding to server
    const sanitizedReq = shouldSkipHeader
      ? req.clone({ headers: req.headers.delete('x-skip-loader') })
      : req;
    return next(sanitizedReq);
  }

  // Generate unique task identifier for this specific request
  const taskId = `http_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

  // Check for custom message
  const customMessage =
    req.context.get(LOADER_MESSAGE) ||
    req.headers.get('x-loader-message') ||
    undefined;

  // If message provided via header, clean it up
  const cleanReq = req.headers.has('x-loader-message')
    ? req.clone({ headers: req.headers.delete('x-loader-message') })
    : req;

  loaderService.startTask(taskId, customMessage);

  return next(cleanReq).pipe(
    finalize(() => {
      loaderService.stopTask(taskId);
    })
  );
};
