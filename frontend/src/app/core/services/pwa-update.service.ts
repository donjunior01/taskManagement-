import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

/**
 * Prompts the user to reload when a new app version has been downloaded by the service worker.
 * Without this, an installed PWA keeps running the old build until every tab is closed. No-op when
 * the service worker is disabled (dev, or unsupported browsers).
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private static readonly CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

  constructor(private swUpdate: SwUpdate, private translate: TranslateService) {}

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.pipe(
      filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY')
    ).subscribe(() => {
      const msg = this.translate.instant('pwa.updateAvailable');
      if (confirm(msg)) {
        this.swUpdate.activateUpdate().then(() => document.location.reload());
      }
    });

    // Poll for new versions while the app stays open (installed PWAs are long-lived).
    setInterval(() => { this.swUpdate.checkForUpdate().catch(() => {}); }, PwaUpdateService.CHECK_INTERVAL_MS);
  }
}
