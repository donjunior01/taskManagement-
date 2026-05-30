package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.ai.PrioritizationResultDTO;
import com.example.gpiApp.dto.ai.ProjectInsightDTO;
import com.example.gpiApp.dto.ai.RiskAssessmentDTO;
import com.example.gpiApp.service.AiAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI assistant endpoints — project insights and intelligent task prioritisation.
 * Backed today by a rule-based engine ({@code source = "MOCK"}); designed to be
 * swapped for a live model without changing this API.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Assistant", description = "AI-generated project insights and task prioritisation")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    @Operation(summary = "Generate a project summary",
            description = "Returns a natural-language summary, health assessment and recommendations for a project.")
    @GetMapping("/projects/{projectId}/summary")
    public ResponseEntity<ApiResponse<ProjectInsightDTO>> getProjectSummary(@PathVariable Long projectId) {
        ProjectInsightDTO insight = aiAssistantService.generateProjectSummary(projectId);
        return ResponseEntity.ok(ApiResponse.success("Project summary generated", insight));
    }

    @Operation(summary = "Suggest task priorities",
            description = "Scores the project's open tasks and recommends a priority for each, ordered by urgency.")
    @GetMapping("/projects/{projectId}/priorities")
    public ResponseEntity<ApiResponse<PrioritizationResultDTO>> getTaskPriorities(@PathVariable Long projectId) {
        PrioritizationResultDTO result = aiAssistantService.suggestTaskPriorities(projectId);
        return ResponseEntity.ok(ApiResponse.success("Task priorities suggested", result));
    }

    @Operation(summary = "Predict delivery risk",
            description = "Predicts which open tasks will miss their deadlines and assesses the project's overall delay risk.")
    @GetMapping("/projects/{projectId}/risks")
    public ResponseEntity<ApiResponse<RiskAssessmentDTO>> getRiskAssessment(@PathVariable Long projectId) {
        RiskAssessmentDTO result = aiAssistantService.assessProjectRisks(projectId);
        return ResponseEntity.ok(ApiResponse.success("Risk assessment generated", result));
    }
}
