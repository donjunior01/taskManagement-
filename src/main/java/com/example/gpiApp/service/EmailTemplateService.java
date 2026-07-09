package com.example.gpiApp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Wraps a plain-text email body in a branded, responsive HTML shell (inline CSS so it survives email
 * clients). Every email that goes through EmailService.dispatch gets the same look: a coloured header
 * with the app name, the message, and a muted footer. Plain-text remains the multipart fallback.
 */
@Service
public class EmailTemplateService {

    @Value("${brevo.sender.name:TaskMaster Pro}")
    private String appName;

    @Value("${email.brand-color:#2563eb}")
    private String brandColor;

    public String render(String title, String bodyText) {
        String safeTitle = escape(title);
        String safeBody = escape(bodyText).replace("\n", "<br>");
        return "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>"
                + "<body style=\"margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f1f5f9;padding:24px 0;\"><tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.12);\">"
                + "<tr><td style=\"background:" + brandColor + ";padding:20px 28px;\">"
                + "<span style=\"color:#ffffff;font-size:18px;font-weight:700;\">" + escape(appName) + "</span></td></tr>"
                + "<tr><td style=\"padding:28px;\">"
                + (safeTitle.isBlank() ? "" : "<h1 style=\"margin:0 0 14px;font-size:18px;color:#0f172a;\">" + safeTitle + "</h1>")
                + "<div style=\"font-size:14px;line-height:1.6;color:#334155;\">" + safeBody + "</div>"
                + "</td></tr>"
                + "<tr><td style=\"padding:18px 28px;border-top:1px solid #e2e8f0;\">"
                + "<span style=\"font-size:12px;color:#94a3b8;\">" + escape(appName)
                + " — this is an automated message, please do not reply.</span></td></tr>"
                + "</table></td></tr></table></body></html>";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
