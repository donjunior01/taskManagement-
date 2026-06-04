package com.example.gpiApp.controller;

import com.example.gpiApp.dto.AiChatRequestDTO;
import com.example.gpiApp.dto.AiChatResponseDTO;
import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.GenerateDescriptionRequestDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.AiChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Conversational AI assistant available to any signed-in user: project/task Q&A,
 * description drafting, and task completion guidance.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Chat Assistant", description = "Conversational assistant for projects, tasks and guidance")
public class AiChatController {

    private final AiChatService aiChatService;
    private final UserRepository userRepository;

    @Operation(summary = "Chat with the assistant",
            description = "Answers questions about the user's projects/tasks, optionally scoped to a project or task.")
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponseDTO>> chat(
            @RequestBody AiChatRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("AI reply", aiChatService.chat(request, userId)));
    }

    @Operation(summary = "Draft a description",
            description = "Generates a professional description for a project, task or deliverable from its title.")
    @PostMapping("/generate-description")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateDescription(
            @RequestBody GenerateDescriptionRequestDTO request) {
        String text = aiChatService.generateDescription(request);
        return ResponseEntity.ok(ApiResponse.success("Description generated", Map.of("description", text)));
    }

    @Operation(summary = "Get task guidance",
            description = "Explains a task and proposes an ordered checklist for completing it.")
    @GetMapping("/tasks/{taskId}/guidance")
    public ResponseEntity<ApiResponse<AiChatResponseDTO>> taskGuidance(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success("Guidance generated", aiChatService.taskGuidance(taskId)));
    }

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            String name = authentication.getName();
            try {
                return Long.parseLong(name);
            } catch (NumberFormatException e) {
                return userRepository.findByEmail(name)
                        .map(allUsers::getId)
                        .orElseGet(() -> userRepository.findByUsername(name)
                                .map(allUsers::getId)
                                .orElse(null));
            }
        }
        return null;
    }
}
