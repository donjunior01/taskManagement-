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
 * OpenAI API client for GPT-4o ({@code POST /v1/chat/completions}), the primary LLM
 * provider in the fallback chain. Mirrored on seruca's approach: thin REST client
 * via Spring {@link RestClient}, no SDK dependency.
 * <p>
 * System prompts are sent as the first message with role "system". Every call is best-effort:
 * if the API key is absent, the request fails, or the response is malformed,
 * {@link #complete} returns an empty {@link Optional} and the caller falls back to Claude,
 * then Gemini, then rule-based engine.
 */
@Component
public class OpenAiClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiClient.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String apiKey;
    private final String model;
    private final int maxTokens;

    public OpenAiClient(
            @Value("${openai.api.key:}") String apiKey,
            @Value("${openai.api.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${openai.api.model:gpt-4o}") String model,
            @Value("${openai.api.max-tokens:1024}") int maxTokens,
            @Value("${openai.api.timeout-ms:20000}") int timeoutMs) {
        this.apiKey = apiKey;
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
     * @param systemPrompt static instruction text
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
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return extractText(response);
        } catch (Exception e) {
            log.warn("OpenAI API call failed, falling back to Claude: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Multi-turn chat. Each turn is a (role, content) pair where role is "user" or
     * "assistant". The final turn should be the latest user message. Returns the
     * model's reply text, or empty on any failure / when disabled.
     */
    public Optional<String> chat(String systemPrompt, List<Map<String, String>> turns) {
        if (!isEnabled() || turns == null || turns.isEmpty()) {
            return Optional.empty();
        }
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("model", model);
            root.put("max_tokens", maxTokens);

            ArrayNode messages = root.putArray("messages");

            // Add system prompt as the first message.
            if (systemPrompt != null && !systemPrompt.isBlank()) {
                ObjectNode sysMsg = messages.addObject();
                sysMsg.put("role", "system");
                sysMsg.put("content", systemPrompt);
            }

            // Add all turns.
            for (Map<String, String> turn : turns) {
                String role = turn.getOrDefault("role", "user");
                String content = turn.getOrDefault("content", "");
                if (content == null || content.isBlank()) continue;
                if (!"assistant".equals(role)) role = "user";
                ObjectNode m = messages.addObject();
                m.put("role", role);
                m.put("content", content);
            }

            if (messages.isEmpty()) return Optional.empty();

            String response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(objectMapper.writeValueAsString(root))
                    .retrieve()
                    .body(String.class);
            return extractText(response);
        } catch (Exception e) {
            log.warn("OpenAI chat call failed, falling back to Claude: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String buildRequestBody(String systemPrompt, String userContent) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("max_tokens", maxTokens);

        ArrayNode messages = root.putArray("messages");

        // Add system prompt.
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            ObjectNode sysMsg = messages.addObject();
            sysMsg.put("role", "system");
            sysMsg.put("content", systemPrompt);
        }

        // Add user message.
        ObjectNode userMsg = messages.addObject();
        userMsg.put("role", "user");
        userMsg.put("content", userContent);

        return objectMapper.writeValueAsString(root);
    }

    /** Pull the text from the OpenAI response envelope. */
    private Optional<String> extractText(String response) throws Exception {
        if (response == null || response.isBlank()) {
            return Optional.empty();
        }
        JsonNode root = objectMapper.readTree(response);
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            return Optional.empty();
        }
        String text = choices.path(0).path("message").path("content").asText("").trim();
        return text.isEmpty() ? Optional.empty() : Optional.of(text);
    }

    /** Reusable accessor so callers can reuse the shared mapper for parsing model JSON. */
    public ObjectMapper objectMapper() {
        return objectMapper;
    }
}
