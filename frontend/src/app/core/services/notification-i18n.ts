import { TranslateService } from '@ngx-translate/core';
import { Notification } from './notification.service';

/** Parse the stored JSON params string into an interpolation object (empty on failure). */
function parseParams(raw?: string): Record<string, any> {
  if (!raw) return {};
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

/**
 * Localised notification title. When the backend attached an i18nKey the title is rendered from
 * `notif.msg.<key>.title` in the user's chosen language; otherwise we fall back to the stored text.
 */
export function resolveNotifTitle(n: Notification, translate: TranslateService): string {
  if (n.i18nKey) {
    const key = 'notif.msg.' + n.i18nKey + '.title';
    const out = translate.instant(key, parseParams(n.i18nParams));
    if (out !== key) return out;
  }
  return n.title || '';
}

/**
 * Localised notification body. Same rule as the title, falling back to the stored message text for
 * legacy rows or unknown keys.
 */
export function resolveNotifMessage(n: Notification, translate: TranslateService): string {
  if (n.i18nKey) {
    const key = 'notif.msg.' + n.i18nKey + '.body';
    const out = translate.instant(key, parseParams(n.i18nParams));
    if (out !== key) return out;
  }
  return n.message || '';
}
