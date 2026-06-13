package com.example.gpiApp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Sends transactional email through Brevo's REST API (https://api.brevo.com/v3/smtp/email).
 * Enabled when {@code brevo.api.key} (BREVO_API_KEY) is set. The sender address must be a
 * verified sender (or on an authenticated domain) in the Brevo account, otherwise Brevo
 * rejects or fails to deliver the message.
 */
@Component
public class BrevoEmailClient {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailClient.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient;
    private final String apiKey;
    private final String senderEmail;
    private final String senderName;

    public BrevoEmailClient(
            @Value("${brevo.api.key:}") String apiKey,
            @Value("${brevo.sender.email:noreply@taskmanagement.com}") String senderEmail,
            @Value("${brevo.sender.name:TaskMaster Pro}") String senderName) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        this.restClient = this.apiKey.isBlank()
                ? null
                : RestClient.builder().baseUrl("https://api.brevo.com/v3").build();
        if (this.restClient != null) {
            log.info("Brevo email client ENABLED (sender {} <{}>).", senderName, senderEmail);
        }
    }

    public boolean isEnabled() {
        return restClient != null;
    }

    /** Send a plain-text email (also wrapped as simple HTML) via Brevo. Throws on transport/API failure. */
    public void send(String to, String subject, String textBody) {
        ObjectNode root = objectMapper.createObjectNode();
        ObjectNode sender = root.putObject("sender");
        sender.put("name", senderName);
        sender.put("email", senderEmail);
        root.putArray("to").addObject().put("email", to);
        root.put("subject", subject);
        root.put("textContent", textBody == null ? "" : textBody);
        root.put("htmlContent",
                "<html><body><pre style=\"font-family:inherit;white-space:pre-wrap;margin:0\">"
                        + escapeHtml(textBody) + "</pre></body></html>");

        String body;
        try {
            body = objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Failed to build Brevo payload", e);
        }

        restClient.post()
                .uri("/smtp/email")
                .header("api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
