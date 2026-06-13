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
 * Client for the LangChain.js + Gemini sidecar microservice (see {@code ai-service/}).
 *
 * When {@code ai.service.url} is configured this becomes the PRIMARY AI provider; the model call
 * and the API key live in the Node service (never in the browser). When the URL is blank or the
 * service is unreachable, calls return {@link Optional#empty()} and {@code AiChatService} falls
 * back to the in-JVM clients (OpenAI / Claude / Gemini) and finally the rule-based engine.
 */
@Component
public class LangChainAiClient {

    private static final Logger log = LoggerFactory.getLogger(LangChainAiClient.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient;

    public LangChainAiClient(
            @Value("${ai.service.url:}") String baseUrl,
            @Value("${ai.service.timeout-ms:25000}") int timeoutMs) {
        String url = baseUrl == null ? "" : baseUrl.trim();
        if (url.isBlank()) {
            this.restClient = null;
            log.warn("LangChain AI sidecar DISABLED (ai.service.url is empty). The assistant will use the rule-based fallback.");
        } else {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(timeoutMs);
            factory.setReadTimeout(timeoutMs);
            this.restClient = RestClient.builder().baseUrl(url).requestFactory(factory).build();
            log.info("LangChain AI sidecar ENABLED at {} (timeout {} ms).", url, timeoutMs);
        }
    }

    public boolean isEnabled() {
        return restClient != null;
    }

    /** Single-turn completion. */
    public Optional<String> complete(String systemPrompt, String userContent) {
        return chat(systemPrompt, List.of(Map.of("role", "user", "content", userContent == null ? "" : userContent)));
    }

    /** Multi-turn chat. Turns are (role, content) maps with role "user" or "assistant". */
    public Optional<String> chat(String systemPrompt, List<Map<String, String>> turns) {
        if (!isEnabled() || turns == null || turns.isEmpty()) {
            return Optional.empty();
        }
        try {
            ObjectNode root = objectMapper.createObjectNode();
            if (systemPrompt != null) root.put("systemPrompt", systemPrompt);
            ArrayNode arr = root.putArray("turns");
            for (Map<String, String> turn : turns) {
                String content = turn.getOrDefault("content", "");
                if (content == null || content.isBlank()) continue;
                ObjectNode o = arr.addObject();
                o.put("role", "assistant".equals(turn.getOrDefault("role", "user")) ? "assistant" : "user");
                o.put("content", content);
            }
            String response = restClient.post()
                    .uri("/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(objectMapper.writeValueAsString(root))
                    .retrieve()
                    .body(String.class);
            JsonNode node = objectMapper.readTree(response);
            String text = node.path("text").asText("");
            return text.isBlank() ? Optional.empty() : Optional.of(text.trim());
        } catch (Exception e) {
            // Sidecar down / errored — let the caller fall back to the next provider.
            log.warn("LangChain ai-service call failed, falling back: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
