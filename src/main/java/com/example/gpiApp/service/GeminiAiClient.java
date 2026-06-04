package com.example.gpiApp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Fallback LLM client for Google Gemini ({@code generateContent}), modelled on the
 * approach used in the seruca project: no SDK, raw HTTP via {@link RestClient}, a hardcoded
 * (but env-overridable) API key so the assistant works out of the box, and model triage that
 * tries several Gemini models in order until one succeeds.
 *
 * Gemini has no native "system" role, so the system prompt is prepended to the first user
 * message — the same technique seruca uses.
 */
@Component
public class GeminiAiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiClient.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String apiKey;
    private final List<String> models;

    public GeminiAiClient(
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.api.base-url:https://generativelanguage.googleapis.com/v1beta/models}") String baseUrl,
            @Value("${gemini.api.models:gemini-2.0-flash,gemini-1.5-flash,gemini-pro}") String models,
            @Value("${gemini.api.timeout-ms:20000}") int timeoutMs) {
        this.apiKey = apiKey;
        this.models = List.of(models.split("\\s*,\\s*"));

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Single-turn completion. */
    public Optional<String> complete(String systemPrompt, String userContent) {
        return chat(systemPrompt, List.of(Map.of("role", "user", "content", userContent)));
    }

    /**
     * Multi-turn chat. Turns are (role, content) maps with role "user" or "assistant".
     * Tries each configured model until one returns text.
     */
    public Optional<String> chat(String systemPrompt, List<Map<String, String>> turns) {
        if (!isEnabled() || turns == null || turns.isEmpty()) {
            return Optional.empty();
        }
        String body;
        try {
            body = buildBody(systemPrompt, turns);
        } catch (Exception e) {
            return Optional.empty();
        }
        for (String model : models) {
            try {
                String response = restClient.post()
                        .uri("/{model}:generateContent?key={key}", model, apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(String.class);
                Optional<String> text = extractText(response);
                if (text.isPresent()) {
                    return text;
                }
            } catch (Exception e) {
                log.warn("Gemini model {} failed, trying next: {}", model, e.getMessage());
            }
        }
        return Optional.empty();
    }

    private String buildBody(String systemPrompt, List<Map<String, String>> turns) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        boolean systemInjected = false;
        for (Map<String, String> turn : turns) {
            String role = turn.getOrDefault("role", "user");
            String content = turn.getOrDefault("content", "");
            if (content == null || content.isBlank()) continue;
            String geminiRole = "assistant".equals(role) ? "model" : "user";
            // Prepend the system prompt to the first user turn (Gemini has no system role).
            if (!systemInjected && "user".equals(geminiRole) && systemPrompt != null && !systemPrompt.isBlank()) {
                content = "[SYSTEM INSTRUCTIONS]\n" + systemPrompt + "\n\n" + content;
                systemInjected = true;
            }
            ObjectNode c = contents.addObject();
            c.put("role", geminiRole);
            c.putArray("parts").addObject().put("text", content);
        }
        return objectMapper.writeValueAsString(root);
    }

    private Optional<String> extractText(String response) throws Exception {
        if (response == null || response.isBlank()) return Optional.empty();
        JsonNode root = objectMapper.readTree(response);
        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) return Optional.empty();
        StringBuilder sb = new StringBuilder();
        for (JsonNode part : parts) {
            sb.append(part.path("text").asText(""));
        }
        String result = sb.toString().trim();
        return result.isEmpty() ? Optional.empty() : Optional.of(result);
    }
}
