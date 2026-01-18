package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management operations")
public class TaskController {
    
    private final TaskService taskService;
    private final UserRepository userRepository;
    
    @Operation(summary = "Get all tasks", description = "Retrieve paginated list of all tasks")
    @GetMapping
    public ResponseEntity<PagedResponse<TaskDTO>> getAllTasks(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(taskService.getAllTasks(page, size, sortBy, sortDir));
    }
    
    @Operation(summary = "Get task by ID", description = "Retrieve a specific task by its ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskDTO>> getTaskById(
            @Parameter(description = "Task ID") @PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }
    
    @Operation(summary = "Create task", description = "Create a new task")
    @PostMapping
    public ResponseEntity<ApiResponse<TaskDTO>> createTask(
            @RequestBody TaskRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(taskService.createTask(request, userId));
    }
    
    @Operation(summary = "Update task", description = "Update an existing task")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskDTO>> updateTask(
            @Parameter(description = "Task ID") @PathVariable Long id,
            @RequestBody TaskRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(taskService.updateTask(id, request, userId));
    }
    
    @Operation(summary = "Delete task", description = "Delete a task")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @Parameter(description = "Task ID") @PathVariable Long id,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(taskService.deleteTask(id, userId));
    }
    
    @Operation(summary = "Get tasks by user", description = "Retrieve all tasks assigned to a specific user")
    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedResponse<TaskDTO>> getTasksByUser(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(taskService.getTasksByAssignedUser(userId, page, size));
    }
    
    @Operation(summary = "Get my tasks", description = "Retrieve all tasks assigned to the current user")
    @GetMapping("/my-tasks")
    public ResponseEntity<PagedResponse<TaskDTO>> getMyTasks(
            Authentication authentication,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(taskService.getTasksByAssignedUser(userId, page, size));
    }
    
    @Operation(summary = "Get tasks by project", description = "Retrieve all tasks for a specific project")
    @GetMapping("/project/{projectId}")
    public ResponseEntity<PagedResponse<TaskDTO>> getTasksByProject(
            @Parameter(description = "Project ID") @PathVariable Long projectId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, page, size));
    }
    
    @Operation(summary = "Get tasks by status", description = "Retrieve tasks filtered by status")
    @GetMapping("/status/{status}")
    public ResponseEntity<PagedResponse<TaskDTO>> getTasksByStatus(
            @Parameter(description = "Task status (TODO, IN_PROGRESS, REVIEW, COMPLETED)") @PathVariable Task.TaskStatus status,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(taskService.getTasksByStatus(status, page, size));
    }
    
    @Operation(summary = "Get overdue tasks", description = "Retrieve all tasks that are past their deadline")
    @GetMapping("/overdue")
    public ResponseEntity<List<TaskDTO>> getOverdueTasks() {
        return ResponseEntity.ok(taskService.getOverdueTasks());
    }
    
    @Operation(summary = "Update task progress", description = "Update the progress percentage and status of a task")
    @PatchMapping("/{id}/progress")
    public ResponseEntity<ApiResponse<TaskDTO>> updateTaskProgress(
            @Parameter(description = "Task ID") @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        Integer progress = request.get("progress") != null ? 
            Integer.parseInt(request.get("progress").toString()) : null;
        String status = request.get("status") != null ? 
            request.get("status").toString() : null;
        return ResponseEntity.ok(taskService.updateTaskProgress(id, progress, status, userId));
    }
    
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication != null) {
            return userRepository.findByEmail(authentication.getName())
                    .map(allUsers::getId)
                    .orElse(null);
        }
        return null;
    }
}

