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

import java.util.Optional;

/**
 * Thin client for the Anthropic Messages API ({@code POST /v1/messages}), used by the
 * AI assistant. Talks raw HTTP via Spring {@link RestClient} — no SDK dependency.
 * <p>
 * The system prompt is sent as a cache-controlled text block so repeated calls with the
 * same prompt are eligible for prompt caching. Every call is best-effort: if the API key
 * is absent, the request fails, or the response is malformed, {@link #complete} returns an
 * empty {@link Optional} and the caller falls back to its rule-based engine.
 */
@Component
public class ClaudeAiClient {

    private static final Logger log = LoggerFactory.getLogger(ClaudeAiClient.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String apiKey;
    private final String apiVersion;
    private final String model;
    private final int maxTokens;

    public ClaudeAiClient(
            @Value("${anthropic.api.key:}") String apiKey,
            @Value("${anthropic.api.base-url:https://api.anthropic.com}") String baseUrl,
            @Value("${anthropic.api.version:2023-06-01}") String apiVersion,
            @Value("${anthropic.api.model:claude-haiku-4-5}") String model,
            @Value("${anthropic.api.max-tokens:1024}") int maxTokens,
            @Value("${anthropic.api.timeout-ms:20000}") int timeoutMs) {
        this.apiKey = apiKey;
        this.apiVersion = apiVersion;
        this.model = model;
        this.maxTokens = maxTokens;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    /** True when an API key is configured. When false, callers should skip straight to fallback. */
    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Send a single-turn message and return the model's text response.
     *
     * @param systemPrompt static instruction text (cache-controlled for prompt caching)
     * @param userContent  the per-request user message (project/task data)
     * @return the response text, or empty on any failure / when disabled
     */
    public Optional<String> complete(String systemPrompt, String userContent) {
        if (!isEnabled()) {
            return Optional.empty();
        }
        try {
            String body = buildRequestBody(systemPrompt, userContent);
            String response = restClient.post()
                    .uri("/v1/messages")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", apiVersion)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return extractText(response);
        } catch (Exception e) {
            log.warn("Claude API call failed, falling back to rule-based engine: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String buildRequestBody(String systemPrompt, String userContent) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("max_tokens", maxTokens);

        // System prompt as an array with a cache_control breakpoint (prompt caching).
        ArrayNode system = root.putArray("system");
        ObjectNode sysBlock = system.addObject();
        sysBlock.put("type", "text");
        sysBlock.put("text", systemPrompt);
        sysBlock.putObject("cache_control").put("type", "ephemeral");

        ArrayNode messages = root.putArray("messages");
        ObjectNode userMsg = messages.addObject();
        userMsg.put("role", "user");
        userMsg.put("content", userContent);

        return objectMapper.writeValueAsString(root);
    }

    /** Pull the concatenated text from the Messages API response envelope. */
    private Optional<String> extractText(String response) throws Exception {
        if (response == null || response.isBlank()) {
            return Optional.empty();
        }
        JsonNode root = objectMapper.readTree(response);
        JsonNode content = root.path("content");
        if (!content.isArray() || content.isEmpty()) {
            return Optional.empty();
        }
        StringBuilder text = new StringBuilder();
        for (JsonNode block : content) {
            if ("text".equals(block.path("type").asText())) {
                text.append(block.path("text").asText());
            }
        }
        String result = text.toString().trim();
        return result.isEmpty() ? Optional.empty() : Optional.of(result);
    }

    /** Reusable accessor so callers can reuse the shared mapper for parsing model JSON. */
    public ObjectMapper objectMapper() {
        return objectMapper;
    }
}
