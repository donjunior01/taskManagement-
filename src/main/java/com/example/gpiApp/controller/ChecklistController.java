package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.ChecklistItemDTO;
import com.example.gpiApp.service.ChecklistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Checklist / sub-task endpoints, nested under /api/tasks so they inherit the
 * existing task security rule (any authenticated user).
 */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Checklists", description = "Task sub-tasks / checklist items")
public class ChecklistController {

    private final ChecklistService checklistService;

    @Operation(summary = "List a task's checklist items")
    @GetMapping("/{taskId}/checklist")
    public ResponseEntity<ApiResponse<List<ChecklistItemDTO>>> getChecklist(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success("Checklist retrieved", checklistService.getItems(taskId)));
    }

    @Operation(summary = "Add a checklist item to a task")
    @PostMapping("/{taskId}/checklist")
    public ResponseEntity<ApiResponse<ChecklistItemDTO>> addItem(
            @PathVariable Long taskId,
            @RequestBody ChecklistItemDTO request) {
        return ResponseEntity.ok(ApiResponse.success("Checklist item added",
                checklistService.addItem(taskId, request.getTitle())));
    }

    @Operation(summary = "Toggle a checklist item's completed state")
    @PatchMapping("/checklist/{itemId}/toggle")
    public ResponseEntity<ApiResponse<ChecklistItemDTO>> toggleItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success("Checklist item updated", checklistService.toggle(itemId)));
    }

    @Operation(summary = "Delete a checklist item")
    @DeleteMapping("/checklist/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long itemId) {
        checklistService.delete(itemId);
        return ResponseEntity.ok(ApiResponse.success("Checklist item deleted", null));
    }
}
