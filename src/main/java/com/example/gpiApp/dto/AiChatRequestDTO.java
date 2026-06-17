package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * A turn of conversation with the AI assistant. {@code projectId} / {@code taskId} are
 * optional and, when present, scope the answer to that project or task. {@code history}
 * is the prior conversation as a list of {role, content} maps (role = "user"|"assistant").
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequestDTO {
    private String message;
    private Long projectId;
    private Long taskId;
    private List<Map<String, String>> history;
    /** Optional UI language override ("fr"/"en"); falls back to the admin-configured default. */
    private String language;
}
