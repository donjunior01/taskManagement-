import { ErrorHandler, Injectable } from '@angular/core';

/**
 * Centralized client-side error handler. Every uncaught error funnels through here so nothing is
 * swallowed silently, and there is a single seam to forward errors to an external monitor.
 *
 * To enable Sentry (or similar) later: `npm i @sentry/angular`, init it in main.ts with a DSN from
 * the environment, and call `Sentry.captureException(error)` in the marked spot below — no other
 * change is needed.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    // Unwrap Angular's rejection wrapper when present.
    const err = (error as { rejection?: unknown })?.rejection ?? error;
    // eslint-disable-next-line no-console
    console.error('[app] uncaught error:', err);
    // ── monitoring seam ──
    // if (environment.sentryDsn) Sentry.captureException(err);
  }
}
