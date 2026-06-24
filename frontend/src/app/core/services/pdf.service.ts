import { Injectable } from '@angular/core';
import { BrandingService } from './branding.service';

export interface PdfDocOptions {
  /** Main document title (e.g. "Rapport global"). */
  title: string;
  /** Optional sub-line under the title (date range, counts, …). */
  subtitle?: string;
  /** Inner HTML for the document body (tables, sections, KPI lists, …). */
  bodyHtml: string;
}

/**
 * Produces every system PDF from a single branded template: a coloured header band
 * carrying the admin-configured logo + app name + title, the caller's content, and a
 * coloured footer band repeated on each printed page. Colours, logo and name come from
 * {@link BrandingService}, so changing them in the admin Configuration restyles every PDF.
 *
 * It renders to a popup window and triggers the browser's print-to-PDF, matching the
 * existing export pattern across the dashboards (no extra dependency).
 */
@Injectable({ providedIn: 'root' })
export class PdfService {
  constructor(private branding: BrandingService) {}

  /** Escape a value for safe HTML interpolation. */
  esc(s: any): string {
    return (s ?? '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Open a blank tab synchronously (within a user click) so it isn't pop-up blocked. Pass the
   * returned window to {@link open} after any async work to render into it.
   */
  blankWindow(): Window | null {
    return window.open('', '_blank');
  }

  /**
   * Open the branded document in a new window and start printing.
   * @param preOpened an already-opened window (from {@link blankWindow}) to render into; when omitted
   *   a new window is opened (only safe in a direct user-gesture call stack).
   * @returns true when the window opened, false when blocked by a pop-up blocker.
   */
  open(opts: PdfDocOptions, preOpened?: Window | null): boolean {
    const b = this.branding.current;
    const name = this.esc(b.appName);
    const header = b.pdfHeaderColor || '#1e2540';
    const footer = b.pdfFooterColor || '#2563eb';
    const footerText = this.esc(b.pdfFooterText || '');
    const now = new Date();
    const year = now.getFullYear();
    const generated = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) +
      ' à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Logo: use the configured image when present, otherwise a small inline brand mark.
    const logo = b.logoUrl
      ? `<img src="${b.logoUrl}" alt="logo" class="brand-logo-img"/>`
      : `<span class="brand-logo-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></span>`;

    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>${this.esc(opts.title)} — ${name}</title>
<style>
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{font-family:Inter,'Segoe UI',Arial,sans-serif;color:#1e2540;font-size:12px;}
  /* Header band */
  .pdf-header{background:${header};color:#fff;padding:18px 28px;display:flex;align-items:center;gap:16px;}
  .brand-logo-img{height:40px;width:auto;max-width:160px;object-fit:contain;border-radius:6px;background:#fff;padding:3px;}
  .brand-logo-mark{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:9px;background:rgba(255,255,255,.16);}
  .brand-logo-mark svg{width:24px;height:24px;}
  .pdf-header .brand-name{font-size:16px;font-weight:800;letter-spacing:.2px;line-height:1.1;}
  .pdf-header .doc-title{font-size:12px;opacity:.85;font-weight:500;margin-top:2px;}
  .pdf-header .header-right{margin-left:auto;text-align:right;font-size:10.5px;opacity:.85;}
  /* Body */
  .pdf-body{padding:24px 28px 90px;}
  .pdf-body h1{font-size:18px;margin:0 0 4px;color:#1e2540;}
  .pdf-body .doc-sub{color:#64748b;font-size:12px;margin:0 0 18px;}
  .pdf-body table{width:100%;border-collapse:collapse;font-size:11px;margin-top:10px;}
  .pdf-body th{background:#f1f5f9;text-align:left;padding:8px;font-size:9.5px;text-transform:uppercase;color:#64748b;letter-spacing:.4px;}
  .pdf-body td{padding:8px;border-top:1px solid #e2e8f0;}
  .pdf-body .kpis{margin:0 0 14px;color:#334155;font-size:12px;}
  .pdf-body .kpis b{color:#1e2540;}
  /* Footer band — fixed so it repeats on every printed page */
  .pdf-footer{position:fixed;bottom:0;left:0;right:0;background:${footer};color:#fff;padding:9px 28px;display:flex;align-items:center;font-size:10px;}
  .pdf-footer .f-left{font-weight:600;}
  .pdf-footer .f-mid{margin:0 auto;opacity:.9;}
  .pdf-footer .f-right{opacity:.9;}
  @media print{ @page{ margin:0; } body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head>
<body>
  <div class="pdf-header">
    ${logo}
    <div>
      <div class="brand-name">${name}</div>
      <div class="doc-title">${this.esc(opts.title)}</div>
    </div>
    <div class="header-right">Généré le<br>${generated}</div>
  </div>
  <div class="pdf-body">
    <h1>${this.esc(opts.title)}</h1>
    ${opts.subtitle ? `<p class="doc-sub">${this.esc(opts.subtitle)}</p>` : ''}
    ${opts.bodyHtml}
  </div>
  <div class="pdf-footer">
    <span class="f-left">© ${year} ${name} — Tous droits réservés</span>
    <span class="f-mid">${footerText}</span>
    <span class="f-right">${generated}</span>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();},120);}<\/script>
</body></html>`;

    const w = preOpened ?? window.open('', '_blank');
    if (!w) return false;
    w.document.open();
    w.document.write(html);
    w.document.close();
    return true;
  }
}
