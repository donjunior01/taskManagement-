package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponseDTO {
    private String reply;
    /** "AI" when answered by Claude, "MOCK" when produced by the rule-based fallback. */
    private String source;
}
